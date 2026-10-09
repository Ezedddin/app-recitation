/**
 * Core analysis data model.
 *
 * CORRECTNESS (pronunciation, tajweed) and STYLE (pitch, rhythm, timing,
 * melody, reciter similarity) are kept as separate top-level groups
 * everywhere in this codebase. Similarity to a reciter is a STYLE metric —
 * it must never be read as a measure of Quranic correctness.
 */

export type WordStatus = 'excellent' | 'good' | 'needsWork' | 'practice';

/** Pitch relative to the speaker's own natural range, never absolute Hz. */
export interface PitchPoint {
  timestamp: number;
  normalizedPitch: number;
}

export type PitchCue = 'raise' | 'lower' | 'hold' | 'graduallyRaise' | 'graduallyLower';

export interface WordAnalysis {
  index: number;
  arabicText: string;
  startTime: number;
  endTime: number;
  status: WordStatus;
  pronunciationScore: number;
  tajweedScore: number;
  pitchScore: number;
  pitchCue?: PitchCue;
  feedback: string;
}

export interface CorrectnessScores {
  pronunciation: number;
  tajweed: number;
}

export interface StyleScores {
  pitch: number;
  rhythm: number;
  timing: number;
  melody: number;
  /** Style similarity to the chosen reciter — NOT a correctness signal. */
  similarity: number;
}

export interface CoachInsight {
  id: string;
  headline: string;
  detail: string;
  relatedWordIndex?: number;
}

export interface RecitationAnalysis {
  id: string;
  createdAt: string;
  surahId: string;
  ayahNumber: number;
  reciterId: string;
  attemptNumber: number;
  overallScore: number;
  correctness: CorrectnessScores;
  style: StyleScores;
  words: WordAnalysis[];
  referencePitchContour: PitchPoint[];
  userPitchContour: PitchPoint[];
  insights: CoachInsight[];
}

export interface RecitationAnalysisRequest {
  surahId: string;
  ayahNumber: number;
  reciterId: string;
  recordingUri: string;
  attemptNumber: number;
  /** When set (and greater than `ayahNumber`), analyzes one continuous recitation spanning this ayah range — the "flowing recitation" mode. */
  ayahNumberEnd?: number;
}
