import type { RecitationAnalysis } from './analysis';

export interface PracticeAttempt {
  id: string;
  surahId: string;
  ayahNumber: number;
  /** Set only for a "flowing recitation" attempt spanning `ayahNumber`..`ayahNumberEnd` in one take. */
  ayahNumberEnd?: number;
  reciterId: string;
  createdAt: string;
  durationSeconds: number;
  /** Local file uri for this attempt's recording — may become unavailable if the OS clears the cache. */
  recordingUri: string;
  analysis: RecitationAnalysis;
}

export interface ScoreHistoryPoint {
  label: string;
  value: number;
}

export interface ProgressSummary {
  streakDays: number;
  totalMinutesPracticed: number;
  ayatPracticed: number;
  ayatMastered: number;
  /** Average score over the last 30 days (or all attempts, if none are that recent). */
  averageScore: number;
  /** Change of the 30-day average versus the 30 days before, in percent; 0 when there's no earlier month. */
  monthChangePercent: number;
  /** The most recent attempts' scores, oldest first. */
  scoreHistory: ScoreHistoryPoint[];
}
