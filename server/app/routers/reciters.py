from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_provider
from app.models.reciter import Reciter
from app.providers.quran_audio_provider import QuranAudioProvider
from app.providers.ummah_api_provider import UmmahApiError

router = APIRouter(prefix="/api/v1", tags=["reciters"])


@router.get("/reciters", response_model=list[Reciter])
async def list_reciters(provider: QuranAudioProvider = Depends(get_provider)) -> list[Reciter]:
    try:
        return await provider.list_reciters()
    except UmmahApiError as error:
        raise HTTPException(status_code=502, detail=f"Reciter directory unavailable: {error}") from error
