import asyncio
import hashlib
import tempfile
from pathlib import Path

import httpx

from app.config import settings
from app.locks.async_lock_registry import reference_locks
from app.models.features import AudioFeatures, ReferenceFeatureRecord
from app.providers.mp3quran_clip_source import ClipUnavailableError, Mp3QuranClipSource
from app.providers.quran_audio_provider import QuranAudioProvider
from app.providers.ummah_api_provider import PROVIDER_NAME, UmmahApiError
from app.services.audio_features import extract_audio_features
from app.storage.reference_store import ReferenceFeatureStore


class ReferenceUnavailableError(RuntimeError):
    """Raised when a reference has never been analyzed AND the provider
    can't supply it right now (missing audio, or the provider is down)."""


def reference_id(provider: str, reciter_id: str, surah_number: int, ayah_number: int, version: int) -> str:
    return f"{provider}:{reciter_id}:{surah_number}:{ayah_number}:v{version}"


class ReferenceFeatureService:
    """The 'reference recitations are static, analyze once, reuse forever'
    layer. Every caller goes through `get_or_create` — it never re-downloads
    or re-analyzes a reference that's already been extracted at the current
    `REFERENCE_ANALYSIS_VERSION`.
    """

    def __init__(
        self,
        provider: QuranAudioProvider,
        store: ReferenceFeatureStore,
        clip_source: Mp3QuranClipSource | None = None,
    ) -> None:
        self._provider = provider
        self._store = store
        self._clip_source = clip_source

    async def get_or_create_range(
        self, reciter_id: str, surah_number: int, start_ayah: int, end_ayah: int
    ) -> AudioFeatures:
        """Combined reference for a 'flowing' multi-ayah recitation. Reuses
        `get_or_create` per ayah — an ayah already cached from individual
        practice isn't re-downloaded or re-analyzed just because it's now
        part of a range — then concatenates the per-ayah features with
        timestamps offset by cumulative duration so the sequence reads as
        one continuous recitation.
        """
        per_ayah = [
            await self.get_or_create(reciter_id, surah_number, ayah_number)
            for ayah_number in range(start_ayah, end_ayah + 1)
        ]

        pitch_contour: list[float] = []
        pitch_timestamps: list[float] = []
        energy_contour: list[float] = []
        energy_timestamps: list[float] = []
        voiced_segments: list[list[float]] = []
        pause_total = 0.0
        pause_count = 0
        offset = 0.0

        for features in per_ayah:
            pitch_contour.extend(features.pitchContour)
            pitch_timestamps.extend(t + offset for t in features.pitchTimestamps)
            energy_contour.extend(features.energyContour)
            energy_timestamps.extend(t + offset for t in features.energyTimestamps)
            voiced_segments.extend([start + offset, end + offset] for start, end in features.voicedSegments)
            pause_total += features.pauseTotalSeconds
            pause_count += features.pauseCount
            offset += features.durationSeconds

        return AudioFeatures(
            durationSeconds=offset,
            pitchContour=pitch_contour,
            pitchTimestamps=pitch_timestamps,
            energyContour=energy_contour,
            energyTimestamps=energy_timestamps,
            voicedSegments=voiced_segments,
            pauseCount=pause_count,
            pauseTotalSeconds=pause_total,
        )

    async def get_or_create(self, reciter_id: str, surah_number: int, ayah_number: int) -> AudioFeatures:
        version = settings.reference_analysis_version

        existing = self._store.load(PROVIDER_NAME, reciter_id, surah_number, ayah_number, version)
        if existing is not None:
            return existing.features

        key = reference_id(PROVIDER_NAME, reciter_id, surah_number, ayah_number, version)
        lock = await reference_locks.get(key)
        async with lock:
            # Re-check: another request may have finished this while we waited for the lock.
            existing = self._store.load(PROVIDER_NAME, reciter_id, surah_number, ayah_number, version)
            if existing is not None:
                return existing.features

            record = await self._create(reciter_id, surah_number, ayah_number, version)
            self._store.save(record)
            return record.features

    async def _create(self, reciter_id: str, surah_number: int, ayah_number: int, version: int) -> ReferenceFeatureRecord:
        try:
            audio_entries = await self._provider.get_reference_audio(surah_number, ayah_number)
        except UmmahApiError as error:
            raise ReferenceUnavailableError(str(error)) from error

        entry = next((e for e in audio_entries if e.reciterId == reciter_id), None)
        audio_url = entry.ayahAudioUrl if entry else None
        if not audio_url:
            raise ReferenceUnavailableError(
                f"No reference audio available for reciter {reciter_id}, surah {surah_number}, ayah {ayah_number}"
            )

        with tempfile.TemporaryDirectory() as tmp_dir:
            file_path = Path(tmp_dir) / "reference_audio"
            audio_bytes = await self._download(audio_url, file_path)
            features = await asyncio.to_thread(extract_audio_features, str(file_path))

        return ReferenceFeatureRecord(
            provider=PROVIDER_NAME,
            reciterId=reciter_id,
            surahNumber=surah_number,
            ayahNumber=ayah_number,
            analysisVersion=version,
            audioSourceUrl=audio_url,
            audioSourceHash=hashlib.sha256(audio_bytes).hexdigest(),
            features=features,
        )

    async def _download(self, url: str, destination: Path) -> bytes:
        if self._clip_source is not None and self._clip_source.owns(url):
            try:
                clip = await self._clip_source.get_clip_for_path(url)
            except ClipUnavailableError as error:
                raise ReferenceUnavailableError(str(error)) from error
            audio_bytes = clip.read_bytes()
            destination.write_bytes(audio_bytes)
            return audio_bytes

        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.get(url)
        except httpx.HTTPError as error:
            raise ReferenceUnavailableError(f"Could not download reference audio: {error}") from error

        if response.status_code != 200:
            raise ReferenceUnavailableError(f"Reference audio download failed with status {response.status_code}")

        destination.write_bytes(response.content)
        return response.content
