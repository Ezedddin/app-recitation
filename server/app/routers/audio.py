from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from app.dependencies import get_clip_source
from app.providers.mp3quran_clip_source import ClipUnavailableError, Mp3QuranClipSource

router = APIRouter(prefix="/api/v1", tags=["audio"])


@router.get("/audio/{reciter_id}/{surah_number}/{ayah_number}.mp3")
async def get_ayah_clip(
    reciter_id: str,
    surah_number: int,
    ayah_number: int,
    clip_source: Mp3QuranClipSource = Depends(get_clip_source),
) -> FileResponse:
    """Per-ayah audio for reciters that only exist as full-surah recordings
    (see mp3quran_clip_source.py). `get_ayah_audio` points the app here."""
    if not clip_source.covers(reciter_id):
        raise HTTPException(status_code=404, detail=f"No ayah clips for reciter {reciter_id}")
    try:
        path = await clip_source.get_clip(reciter_id, surah_number, ayah_number)
    except ClipUnavailableError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    return FileResponse(path, media_type="audio/mpeg")
