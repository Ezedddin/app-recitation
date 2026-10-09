from fastapi import APIRouter, Depends, HTTPException, Request

from app.dependencies import get_provider
from app.models.quran import Ayah, ReferenceAudio, Surah
from app.providers.quran_audio_provider import QuranAudioProvider
from app.providers.ummah_api_provider import UmmahApiError

router = APIRouter(prefix="/api/v1", tags=["quran"])


@router.get("/surahs", response_model=list[Surah])
async def list_surahs(provider: QuranAudioProvider = Depends(get_provider)) -> list[Surah]:
    try:
        return await provider.list_surahs()
    except UmmahApiError as error:
        raise HTTPException(status_code=502, detail=f"Surah list unavailable: {error}") from error


@router.get("/surah/{surah_number}/ayahs", response_model=list[Ayah])
async def get_surah_ayahs(surah_number: int, provider: QuranAudioProvider = Depends(get_provider)) -> list[Ayah]:
    try:
        return await provider.get_surah_ayahs(surah_number)
    except UmmahApiError as error:
        raise HTTPException(status_code=502, detail=f"Surah ayat unavailable: {error}") from error


@router.get("/surah/{surah_number}/ayah/{ayah_number}", response_model=Ayah)
async def get_ayah(
    surah_number: int, ayah_number: int, provider: QuranAudioProvider = Depends(get_provider)
) -> Ayah:
    try:
        return await provider.get_ayah(surah_number, ayah_number)
    except UmmahApiError as error:
        raise HTTPException(status_code=502, detail=f"Ayah unavailable: {error}") from error


@router.get("/surah/{surah_number}/ayah/{ayah_number}/audio", response_model=list[ReferenceAudio])
async def get_ayah_audio(
    surah_number: int, ayah_number: int, request: Request, provider: QuranAudioProvider = Depends(get_provider)
) -> list[ReferenceAudio]:
    try:
        entries = await provider.get_reference_audio(surah_number, ayah_number)
    except UmmahApiError as error:
        raise HTTPException(status_code=502, detail=f"Reference audio unavailable: {error}") from error
    # Clip URLs are paths on this server; resolve them against the host the
    # app actually used (localhost on the simulator, the LAN IP on a device).
    base = str(request.base_url).rstrip("/")
    return [
        entry.model_copy(update={"ayahAudioUrl": f"{base}{entry.ayahAudioUrl}"})
        if entry.ayahAudioUrl and entry.ayahAudioUrl.startswith("/")
        else entry
        for entry in entries
    ]
