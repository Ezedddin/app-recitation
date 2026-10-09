from typing import Literal

from pydantic import BaseModel

PitchCue = Literal["raise", "lower", "hold", "graduallyRaise", "graduallyLower"]
WordStatus = Literal["excellent", "good", "needsWork", "practice"]


class PitchPoint(BaseModel):
    timestamp: float
    normalizedPitch: float


class WordAnalysis(BaseModel):
    index: int
    arabicText: str
    startTime: float
    endTime: float
    status: WordStatus
    pronunciationScore: float
    tajweedScore: float
    pitchScore: float
    pitchCue: PitchCue | None = None
    feedback: str


class CorrectnessScores(BaseModel):
    pronunciation: float
    tajweed: float


class StyleScores(BaseModel):
    pitch: float
    rhythm: float
    timing: float
    melody: float
    similarity: float


class CoachInsight(BaseModel):
    id: str
    headline: str
    detail: str
    relatedWordIndex: int | None = None


class RecitationAnalysis(BaseModel):
    """Mirrors the RN `RecitationAnalysis` type exactly (src/types/analysis.ts)
    so the mobile app's existing UI needs zero changes to consume real results."""

    id: str
    createdAt: str
    surahId: str
    ayahNumber: int
    reciterId: str
    attemptNumber: int
    overallScore: float
    correctness: CorrectnessScores
    style: StyleScores
    words: list[WordAnalysis]
    referencePitchContour: list[PitchPoint]
    userPitchContour: list[PitchPoint]
    insights: list[CoachInsight]
