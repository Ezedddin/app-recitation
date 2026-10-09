from pydantic import BaseModel


class StyleScores(BaseModel):
    """Internal DSP comparison with the chosen reciter — folded into
    `overallScore`, never returned to the app on its own."""

    pitch: float
    rhythm: float
    timing: float
    melody: float
    similarity: float


class RecitationAnalysis(BaseModel):
    """Mirrors the RN `RecitationAnalysis` type exactly (src/types/analysis.ts)."""

    id: str
    createdAt: str
    surahId: str
    ayahNumber: int
    reciterId: str
    attemptNumber: int
    overallScore: float
    feedback: str
