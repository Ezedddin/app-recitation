import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.dependencies import get_analysis_engine
from app.models.analysis import RecitationAnalysis
from app.services.analysis_engine import AnalysisEngine, AnalysisFailedError

router = APIRouter(prefix="/api/v1", tags=["analysis"])


@router.post("/analyze", response_model=RecitationAnalysis)
async def analyze_recitation(
    audio: UploadFile = File(...),
    reciterId: str = Form(...),
    surahNumber: int = Form(...),
    ayahNumber: int = Form(...),
    attemptNumber: int = Form(1),
    ayahNumberEnd: int | None = Form(None),
    engine: AnalysisEngine = Depends(get_analysis_engine),
) -> RecitationAnalysis:
    """The only analysis endpoint. There is no mock mode and no fallback —
    any failure here becomes a proper error response, never a fake result.
    `ayahNumberEnd` is optional — when set (and greater than `ayahNumber`),
    this analyzes one continuous recitation spanning that ayah range (the
    "flowing recitation" practice mode) instead of a single ayah.
    """
    suffix = Path(audio.filename or "recording").suffix or ".m4a"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as tmp_file:
        tmp_file.write(await audio.read())
        tmp_file.flush()

        try:
            return await engine.analyze(
                surah_number=surahNumber,
                ayah_number=ayahNumber,
                reciter_id=reciterId,
                attempt_number=attemptNumber,
                recording_path=tmp_file.name,
                ayah_number_end=ayahNumberEnd,
            )
        except AnalysisFailedError as error:
            raise HTTPException(status_code=502, detail=str(error)) from error
