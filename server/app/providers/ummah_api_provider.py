import time

import httpx

from app.config import settings
from app.models.quran import Ayah, ReferenceAudio, Surah
from app.models.reciter import Reciter
from app.providers.quran_audio_provider import QuranAudioProvider

PROVIDER_NAME = "ummahapi"

# UmmahAPI sends `cache-control: public, max-age=14400` and explicitly asks
# callers to "cache responses where possible" (fair-use note on /api/limits).
# This is a minimal in-memory TTL cache honoring that, independent of our own
# permanent reference-feature store (which caches *analysis*, not API JSON).
_RESPONSE_CACHE_TTL_SECONDS = 4 * 60 * 60
_response_cache: dict[str, tuple[float, dict]] = {}

# UmmahAPI returns ayah-audio URLs with a misspelled everyayah.com folder for
# some reciters — every one 404s. Maps the broken folder to the real one;
# verified against everyayah.com. Remove an entry once UmmahAPI fixes it.
_AYAH_AUDIO_FOLDER_FIXES = {
    "/MauroAuad-AlMuaiqly_128kbps/": "/MaherAlMuaiqly128kbps/",  # Maher Al Muaiqly
}


def _fix_ayah_audio_url(url: str | None) -> str | None:
    if not url:
        return url
    for broken, fixed in _AYAH_AUDIO_FOLDER_FIXES.items():
        url = url.replace(broken, fixed)
    return url


class UmmahApiError(RuntimeError):
    """Raised when UmmahAPI is unreachable or returns an unexpected response."""


class UmmahApiProvider(QuranAudioProvider):
    def __init__(self) -> None:
        self._base_url = settings.ummahapi_base_url
        self._headers = {"apikey": settings.ummahapi_key} if settings.ummahapi_key else {}

    async def _get(self, path: str) -> dict:
        now = time.monotonic()
        cached = _response_cache.get(path)
        if cached and cached[0] > now:
            return cached[1]

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(f"{self._base_url}{path}", headers=self._headers)
        except httpx.HTTPError as error:
            raise UmmahApiError(f"UmmahAPI request failed for {path}: {error}") from error

        if response.status_code != 200:
            raise UmmahApiError(f"UmmahAPI returned {response.status_code} for {path}")

        payload = response.json()
        if not payload.get("success"):
            raise UmmahApiError(f"UmmahAPI reported failure for {path}")

        _response_cache[path] = (now + _RESPONSE_CACHE_TTL_SECONDS, payload)
        return payload

    async def list_reciters(self) -> list[Reciter]:
        payload = await self._get("/quran/reciters")
        return [
            Reciter(id=str(r["id"]), name=r["name"], nameArabic=r["name_arabic"], style=r["style"])
            for r in payload["data"]["reciters"]
        ]

    async def list_surahs(self) -> list[Surah]:
        payload = await self._get("/quran/surahs")
        return [
            Surah(
                id=str(s["number"]),
                number=s["number"],
                arabicName=s["name_arabic"],
                transliteratedName=s["name_english"],
                englishName=s["name_translation"],
                ayahCount=s["verses_count"],
            )
            for s in payload["data"]["surahs"]
        ]

    async def get_ayah(self, surah_number: int, ayah_number: int) -> Ayah:
        payload = await self._get(f"/quran/surah/{surah_number}/ayah/{ayah_number}")
        verse = payload["data"]["verse"]
        arabic_text = verse["arabic"]
        return Ayah(
            surahId=str(surah_number),
            number=ayah_number,
            arabicText=arabic_text,
            words=arabic_text.split(" "),
        )

    async def get_surah_ayahs(self, surah_number: int) -> list[Ayah]:
        payload = await self._get(f"/quran/surah/{surah_number}")
        verses = payload["data"]["verses"]
        return [
            Ayah(
                surahId=str(surah_number),
                number=v["ayah"],
                arabicText=v["arabic"],
                words=v["arabic"].split(" "),
            )
            for v in verses
        ]

    async def get_reference_audio(self, surah_number: int, ayah_number: int) -> list[ReferenceAudio]:
        payload = await self._get(f"/quran/surah/{surah_number}/ayah/{ayah_number}")
        return [
            ReferenceAudio(
                reciterId=str(entry["reciter_id"]),
                ayahAudioUrl=_fix_ayah_audio_url(entry.get("ayah_audio")),
                surahAudioUrl=entry.get("surah_audio"),
            )
            for entry in payload["data"]["audio"]
        ]
