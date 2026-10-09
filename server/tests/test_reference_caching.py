"""Proves the core scalability requirement: a reference recitation is
analyzed once and reused by every subsequent (and concurrent) request —
never re-downloaded or re-analyzed for every user. Uses a fake provider and
a monkeypatched download/extract so this runs fast and offline; the real
pipeline (real UmmahAPI + real DSP) is proven separately in
tests/manual_reference_check.py.
"""

import asyncio

import pytest

from app.models.features import AudioFeatures
from app.models.quran import Ayah, ReferenceAudio, Surah
from app.providers.quran_audio_provider import QuranAudioProvider
from app.services.reference_feature_service import ReferenceFeatureService
from app.storage.reference_store import ReferenceFeatureStore


class FakeProvider(QuranAudioProvider):
    """Echoes back a fake audio URL for whichever reciter was actually
    requested, like the real UmmahAPI response shape (one entry per reciter)."""

    def __init__(self) -> None:
        self.audio_calls = 0

    async def list_reciters(self) -> list:
        return []

    async def list_surahs(self) -> list[Surah]:
        return []

    async def get_ayah(self, surah_number: int, ayah_number: int) -> Ayah:
        return Ayah(surahId=str(surah_number), number=ayah_number, arabicText="", words=[])

    async def get_surah_ayahs(self, surah_number: int) -> list[Ayah]:
        return []

    async def get_reference_audio(self, surah_number: int, ayah_number: int) -> list[ReferenceAudio]:
        self.audio_calls += 1
        return [
            ReferenceAudio(reciterId=rid, ayahAudioUrl=f"https://example.com/{rid}.mp3", surahAudioUrl=None)
            for rid in ("2", "9")
        ]


@pytest.fixture
def fake_features() -> AudioFeatures:
    return AudioFeatures(
        durationSeconds=3.0,
        pitchContour=[0.0, 1.0],
        pitchTimestamps=[0.0, 0.1],
        energyContour=[0.1],
        energyTimestamps=[0.0],
        voicedSegments=[[0.0, 3.0]],
        pauseCount=0,
        pauseTotalSeconds=0.0,
    )


def _patch_download_and_extract(monkeypatch, extraction_count: dict, fake_features: AudioFeatures, delay: float = 0.0):
    async def fake_download(self, url, destination):
        if delay:
            await asyncio.sleep(delay)
        destination.write_bytes(b"fake-audio-bytes")
        return b"fake-audio-bytes"

    def fake_extract(path):
        extraction_count["n"] += 1
        return fake_features

    monkeypatch.setattr(ReferenceFeatureService, "_download", fake_download)
    monkeypatch.setattr("app.services.reference_feature_service.extract_audio_features", fake_extract)


async def test_reference_analyzed_once_across_100_sequential_calls(tmp_path, monkeypatch, fake_features):
    extraction_count = {"n": 0}
    _patch_download_and_extract(monkeypatch, extraction_count, fake_features)

    provider = FakeProvider()
    service = ReferenceFeatureService(provider, ReferenceFeatureStore(tmp_path))

    for _ in range(100):
        features = await service.get_or_create("9", 1, 1)
        assert features == fake_features

    assert extraction_count["n"] == 1, "reference should be analyzed exactly once, not once per call"
    assert provider.audio_calls == 1, "reference audio URL should be resolved exactly once"


async def test_concurrent_requests_for_missing_reference_analyze_once(tmp_path, monkeypatch, fake_features):
    extraction_count = {"n": 0}
    # A real download takes time — sleeping here means the 100 concurrent
    # requests below actually overlap, genuinely exercising the lock instead
    # of racing past it before the first one finishes.
    _patch_download_and_extract(monkeypatch, extraction_count, fake_features, delay=0.05)

    provider = FakeProvider()
    service = ReferenceFeatureService(provider, ReferenceFeatureStore(tmp_path))

    results = await asyncio.gather(*[service.get_or_create("9", 1, 2) for _ in range(100)])

    assert extraction_count["n"] == 1, "a cache stampede occurred — reference was analyzed more than once"
    assert provider.audio_calls == 1
    assert all(r == fake_features for r in results)


async def test_different_ayat_are_cached_independently(tmp_path, monkeypatch, fake_features):
    extraction_count = {"n": 0}
    _patch_download_and_extract(monkeypatch, extraction_count, fake_features)

    provider = FakeProvider()
    service = ReferenceFeatureService(provider, ReferenceFeatureStore(tmp_path))

    await service.get_or_create("9", 1, 1)
    await service.get_or_create("9", 1, 2)
    await service.get_or_create("2", 1, 1)

    assert extraction_count["n"] == 3, "three distinct references should each be analyzed once"


async def test_range_reuses_already_cached_individual_ayahs(tmp_path, monkeypatch, fake_features):
    """The 'flowing recitation' mode (a range of ayahs in one take) must not
    re-download/re-analyze ayahs a user already practiced individually."""
    extraction_count = {"n": 0}
    _patch_download_and_extract(monkeypatch, extraction_count, fake_features)

    provider = FakeProvider()
    service = ReferenceFeatureService(provider, ReferenceFeatureStore(tmp_path))

    # Ayahs 2 and 3 already cached from individual practice.
    await service.get_or_create("9", 1, 2)
    await service.get_or_create("9", 1, 3)
    assert extraction_count["n"] == 2

    # Requesting the range 2-4 should only newly analyze ayah 4.
    combined = await service.get_or_create_range("9", 1, 2, 4)

    assert extraction_count["n"] == 3, "only the uncached ayah (4) should trigger a new analysis"
    assert combined.durationSeconds == fake_features.durationSeconds * 3
    assert combined.pauseCount == fake_features.pauseCount * 3
