import asyncio
import tempfile
import uuid
from datetime import UTC, datetime
from pathlib import Path

from app.models.analysis import RecitationAnalysis
from app.models.quran import Ayah
from app.providers.quran_audio_provider import QuranAudioProvider
from app.services.audio_convert import concat_to_wav, convert_to_wav
from app.services.audio_features import extract_audio_features
from app.services.comparison import compare_features
from app.services.pitch_guidance import pitch_differences
from app.services.recitation_feedback_service import (
    RecitationFeedbackService,
    RecitationFeedbackUnavailableError,
)
from app.services.reference_feature_service import ReferenceFeatureService, ReferenceUnavailableError

# The AI's judgement of the recitation itself dominates; the DSP style match
# with the chosen reciter (pitch/rhythm/timing/melody) adds the rest.
_AI_WEIGHT = 0.7
_STYLE_WEIGHT = 0.3


class AnalysisFailedError(RuntimeError):
    """Any failure along the way — the router turns this into a proper HTTP
    error. There is no fallback path that returns fake data instead."""


class AnalysisEngine:
    def __init__(
        self,
        provider: QuranAudioProvider,
        reference_features: ReferenceFeatureService,
        feedback: RecitationFeedbackService,
    ) -> None:
        self._provider = provider
        self._reference_features = reference_features
        self._feedback = feedback

    async def analyze(
        self,
        *,
        surah_number: int,
        ayah_number: int,
        reciter_id: str,
        attempt_number: int,
        recording_path: str,
        ayah_number_end: int | None = None,
    ) -> RecitationAnalysis:
        is_range = ayah_number_end is not None and ayah_number_end > ayah_number

        try:
            if is_range:
                ayah = await self._load_ayah_range(surah_number, ayah_number, ayah_number_end)
            else:
                ayah = await self._provider.get_ayah(surah_number, ayah_number)
        except Exception as error:  # noqa: BLE001 — any provider failure is a hard failure here
            raise AnalysisFailedError(f"Could not load ayah text: {error}") from error

        last_ayah = ayah_number_end if is_range else ayah_number
        try:
            if is_range:
                reference_features = await self._reference_features.get_or_create_range(
                    reciter_id, surah_number, ayah_number, ayah_number_end
                )
            else:
                reference_features = await self._reference_features.get_or_create(
                    reciter_id, surah_number, ayah_number
                )
            reference_audio = [
                str(await self._reference_features.get_audio_path(reciter_id, surah_number, n))
                for n in range(ayah_number, last_ayah + 1)
            ]
        except ReferenceUnavailableError as error:
            raise AnalysisFailedError(str(error)) from error

        with tempfile.TemporaryDirectory() as tmp_dir:
            wav_path = str(Path(tmp_dir) / "user.wav")
            reference_wav_path = str(Path(tmp_dir) / "reference.wav")
            # librosa decoding/DSP is CPU-bound and synchronous — run it off
            # the event loop so one analysis doesn't stall every other request.
            try:
                await asyncio.to_thread(convert_to_wav, recording_path, wav_path)
            except Exception as error:  # noqa: BLE001
                raise AnalysisFailedError(f"Could not decode the recording: {error}") from error

            try:
                await asyncio.to_thread(concat_to_wav, reference_audio, reference_wav_path)
            except Exception as error:  # noqa: BLE001
                raise AnalysisFailedError(f"Could not decode the reference recording: {error}") from error

            user_features = await asyncio.to_thread(extract_audio_features, wav_path)
            style = await asyncio.to_thread(compare_features, user_features, reference_features)
            melody_differences = pitch_differences(ayah.words, user_features, reference_features)

            try:
                ai = await self._feedback.analyze(wav_path, reference_wav_path, ayah.arabicText, melody_differences)
            except RecitationFeedbackUnavailableError as error:
                raise AnalysisFailedError(str(error)) from error

        overall_score = round(ai.score * _AI_WEIGHT + style.similarity * _STYLE_WEIGHT, 1)

        return RecitationAnalysis(
            id=f"analysis-{uuid.uuid4().hex}",
            createdAt=datetime.now(UTC).isoformat(),
            surahId=str(surah_number),
            ayahNumber=ayah_number,
            reciterId=reciter_id,
            attemptNumber=attempt_number,
            overallScore=overall_score,
            feedback=ai.feedback,
        )

    async def _load_ayah_range(self, surah_number: int, start_ayah: int, end_ayah: int) -> Ayah:
        ayahs = [
            await self._provider.get_ayah(surah_number, ayah_number)
            for ayah_number in range(start_ayah, end_ayah + 1)
        ]
        return Ayah(
            surahId=str(surah_number),
            number=start_ayah,
            arabicText=" ".join(a.arabicText for a in ayahs),
            words=[word for a in ayahs for word in a.words],
        )

