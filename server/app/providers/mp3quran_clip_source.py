import asyncio
from pathlib import Path

import httpx

from app.locks.async_lock_registry import AsyncLockRegistry

# Clips are served by our own `/api/v1/audio` router; a reference-audio URL
# starting with this prefix means "cut from mp3quran", not a remote file.
CLIP_PATH_PREFIX = "/api/v1/audio/"

_TIMING_URL = "https://www.mp3quran.net/api/v3/ayat_timing"

# UmmahAPI reciter id -> (mp3quran "read" id, mp3quran audio folder). These
# reciters have no per-ayah audio on UmmahAPI/everyayah, but mp3quran.net
# publishes their full-surah audio plus exact per-ayah start/end times.
# Verified: cut ayat match the other reciters' durations (ratio ~0.98) and
# compare against them about as well as real per-ayah files do.
_READS: dict[str, tuple[int, str]] = {
    "12": (217, "https://cdn.mp3quran.net/audio/bandar-baleela/r1/"),  # Bandar Baleela
    "13": (58, "https://cdn.mp3quran.net/audio/abdullah-buaijan/r1/"),  # Abdullah Al-Buajan
}


class ClipUnavailableError(RuntimeError):
    """Raised when an ayah clip can't be produced (unknown ayah, mp3quran down, ffmpeg failure)."""


class Mp3QuranClipSource:
    """Per-ayah audio for reciters that only exist as full-surah recordings.

    ffmpeg seeks straight to the ayah over HTTP range requests and
    stream-copies just that span (no re-encode) — byte-identical to cutting
    from a full download, without fetching e.g. Al-Baqarah's 200 MB. Each
    clip is cut once and then served from `cache_dir` forever, since the
    recordings are static.
    """

    def __init__(self, cache_dir: Path) -> None:
        self._cache_dir = cache_dir
        self._timings: dict[tuple[int, int], dict[int, tuple[int, int]]] = {}
        self._locks = AsyncLockRegistry()

    def covers(self, reciter_id: str) -> bool:
        return reciter_id in _READS

    def clip_path(self, reciter_id: str, surah_number: int, ayah_number: int) -> str:
        return f"{CLIP_PATH_PREFIX}{reciter_id}/{surah_number}/{ayah_number}.mp3"

    def owns(self, url: str) -> bool:
        return url.startswith(CLIP_PATH_PREFIX)

    async def get_clip_for_path(self, path: str) -> Path:
        try:
            reciter_id, surah, ayah_file = path.removeprefix(CLIP_PATH_PREFIX).split("/")
            return await self.get_clip(reciter_id, int(surah), int(ayah_file.removesuffix(".mp3")))
        except ValueError as error:
            raise ClipUnavailableError(f"Malformed clip path: {path}") from error

    async def get_clip(self, reciter_id: str, surah_number: int, ayah_number: int) -> Path:
        if reciter_id not in _READS:
            raise ClipUnavailableError(f"No mp3quran source for reciter {reciter_id}")

        destination = self._cache_dir / reciter_id / str(surah_number) / f"{ayah_number}.mp3"
        if destination.exists():
            return destination

        lock = await self._locks.get(f"{reciter_id}:{surah_number}:{ayah_number}")
        async with lock:
            if destination.exists():
                return destination

            read_id, folder = _READS[reciter_id]
            timings = await self._load_timings(read_id, surah_number)
            if ayah_number not in timings:
                raise ClipUnavailableError(f"No timing for surah {surah_number}, ayah {ayah_number}")
            start_ms, end_ms = timings[ayah_number]

            destination.parent.mkdir(parents=True, exist_ok=True)
            partial = destination.with_suffix(".partial.mp3")
            await self._cut(f"{folder}{surah_number:03d}.mp3", start_ms, end_ms, partial)
            partial.rename(destination)
            return destination

    async def _load_timings(self, read_id: int, surah_number: int) -> dict[int, tuple[int, int]]:
        key = (read_id, surah_number)
        if key not in self._timings:
            try:
                async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                    response = await client.get(_TIMING_URL, params={"surah": surah_number, "read": read_id})
                response.raise_for_status()
                entries = response.json()
            except (httpx.HTTPError, ValueError) as error:
                raise ClipUnavailableError(f"mp3quran ayah timings unavailable: {error}") from error
            self._timings[key] = {e["ayah"]: (e["start_time"], e["end_time"]) for e in entries}
        return self._timings[key]

    async def _cut(self, source_url: str, start_ms: int, end_ms: int, output: Path) -> None:
        process = await asyncio.create_subprocess_exec(
            "ffmpeg", "-loglevel", "error", "-y",
            "-ss", f"{start_ms / 1000:.3f}", "-to", f"{end_ms / 1000:.3f}",
            "-i", source_url,
            "-map", "0:a", "-c", "copy", str(output),
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await process.communicate()
        if process.returncode != 0 or not output.exists() or output.stat().st_size == 0:
            output.unlink(missing_ok=True)
            raise ClipUnavailableError(f"Could not cut ayah audio: {stderr.decode(errors='replace').strip()}")
