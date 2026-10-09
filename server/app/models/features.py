from pydantic import BaseModel


class AudioFeatures(BaseModel):
    """Deterministic DSP features extracted from one recording (reference or
    user) — internal only, never sent to the mobile app directly."""

    durationSeconds: float
    # F0 contour normalized to semitones relative to this speaker's own
    # median pitch, so two different natural vocal ranges compare fairly.
    pitchContour: list[float]
    pitchTimestamps: list[float]
    # RMS energy envelope, used for pause/word-boundary detection.
    energyContour: list[float]
    energyTimestamps: list[float]
    # Non-silent [start, end] second ranges — a rough proxy for word/phrase segments.
    voicedSegments: list[list[float]]
    pauseCount: int
    pauseTotalSeconds: float


class ReferenceFeatureRecord(BaseModel):
    """Permanent, reusable record for one (provider, reciter, surah, ayah).
    Stored once, read by every subsequent user practicing the same reference."""

    provider: str
    reciterId: str
    surahNumber: int
    ayahNumber: int
    analysisVersion: int
    audioSourceUrl: str
    audioSourceHash: str
    features: AudioFeatures
