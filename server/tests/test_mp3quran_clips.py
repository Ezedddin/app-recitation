"""Reciters without per-ayah audio on UmmahAPI get a clip path on our own
server, and the reference pipeline resolves that path through the clip
source instead of downloading it. Offline — the clip source is faked."""

from pathlib import Path

from app.providers.mp3quran_clip_source import Mp3QuranClipSource
from app.providers.ummah_api_provider import UmmahApiProvider
from app.services.reference_feature_service import ReferenceFeatureService
from app.storage.reference_store import ReferenceFeatureStore


def test_ayah_audio_url_falls_back_to_clip_only_when_missing(tmp_path):
    provider = UmmahApiProvider(Mp3QuranClipSource(tmp_path))

    # Covered reciter without per-ayah audio -> our clip endpoint.
    assert provider._ayah_audio_url({"reciter_id": 12, "ayah_audio": None}, 2, 255) == "/api/v1/audio/12/2/255.mp3"
    # Reciter with real per-ayah audio is left alone.
    real = "https://everyayah.com/data/Alafasy_128kbps/001001.mp3"
    assert provider._ayah_audio_url({"reciter_id": 1, "ayah_audio": real}, 1, 1) == real
    # Uncovered reciter without audio stays None (analysis reports it cleanly).
    assert provider._ayah_audio_url({"reciter_id": 99, "ayah_audio": None}, 1, 1) is None
    # Known-misspelled UmmahAPI folder is corrected.
    broken = "https://everyayah.com/data/MauroAuad-AlMuaiqly_128kbps/001001.mp3"
    assert "MaherAlMuaiqly128kbps" in provider._ayah_audio_url({"reciter_id": 5, "ayah_audio": broken}, 1, 1)


async def test_reference_download_resolves_clip_paths_locally(tmp_path, monkeypatch):
    clip_file = tmp_path / "clip.mp3"
    clip_file.write_bytes(b"clip-bytes")
    requested: list[tuple[str, int, int]] = []

    async def fake_get_clip(self, reciter_id, surah_number, ayah_number):
        requested.append((reciter_id, surah_number, ayah_number))
        return clip_file

    monkeypatch.setattr(Mp3QuranClipSource, "get_clip", fake_get_clip)
    clips = Mp3QuranClipSource(tmp_path / "clips")
    service = ReferenceFeatureService(UmmahApiProvider(clips), ReferenceFeatureStore(tmp_path / "refs"), clips)

    destination = tmp_path / "out"
    data = await service._download("/api/v1/audio/13/112/4.mp3", destination)

    assert requested == [("13", 112, 4)]
    assert data == b"clip-bytes"
    assert Path(destination).read_bytes() == b"clip-bytes"
