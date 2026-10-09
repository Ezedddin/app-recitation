import { ayahsCovered, isFlowAttempt } from '@/stores/useAppStore';
import type { PracticeAttempt, ProgressSummary } from '@/types';

/**
 * Computes real progress from the user's own stored practice attempts —
 * nothing here is fabricated. The per-attempt scores come from the backend
 * analysis, and the aggregation is genuine arithmetic over what the user
 * actually did, so a brand-new install shows a real empty state rather than
 * invented stats.
 */
export interface ProgressService {
  summarize(attempts: PracticeAttempt[]): ProgressSummary;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Calendar day in the device's own timezone — `createdAt` is UTC, so slicing the ISO string would put late-night practice on the wrong day. */
function localDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function computeStreakDays(attempts: PracticeAttempt[]): number {
  if (attempts.length === 0) return 0;
  const practicedDays = new Set(attempts.map((a) => localDayKey(new Date(a.createdAt))));
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = localDayKey(cursor);
    if (!practicedDays.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * 30% of the score is style similarity to the reciter, where even two
 * professional reciters only reach ~75 against each other — so a near-
 * perfect recitation lands around 85–92, not 100.
 */
const MASTERED_SCORE = 85;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const HISTORY_LENGTH = 8;

function scoreTrend(attempts: PracticeAttempt[]) {
  const sorted = [...attempts].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const now = Date.now();
  const ageOf = (a: PracticeAttempt) => now - new Date(a.createdAt).getTime();

  const recentAvg = average(sorted.filter((a) => ageOf(a) <= THIRTY_DAYS).map((a) => a.analysis.overallScore));
  const previousAvg = average(
    sorted
      .filter((a) => ageOf(a) > THIRTY_DAYS && ageOf(a) <= THIRTY_DAYS * 2)
      .map((a) => a.analysis.overallScore),
  );

  return {
    averageScore: Math.round(recentAvg || average(sorted.map((a) => a.analysis.overallScore))),
    monthChangePercent: previousAvg > 0 ? Math.round(((recentAvg - previousAvg) / previousAvg) * 100) : 0,
    scoreHistory: sorted.slice(-HISTORY_LENGTH).map((a, i) => ({
      label: `#${i + 1}`,
      value: Math.round(a.analysis.overallScore),
    })),
  };
}

export class LocalProgressService implements ProgressService {
  summarize(attempts: PracticeAttempt[]): ProgressSummary {
    const distinctAyat = new Set(attempts.flatMap((a) => ayahsCovered(a).map((n) => `${a.surahId}:${n}`)));

    const bestScoreByAyah = new Map<string, number>();
    // Mastery is per ayah, so only single-ayah attempts count — a flow
    // attempt's score is shared across its whole range.
    for (const attempt of attempts) {
      if (isFlowAttempt(attempt)) continue;
      const key = `${attempt.surahId}:${attempt.ayahNumber}`;
      bestScoreByAyah.set(key, Math.max(bestScoreByAyah.get(key) ?? 0, attempt.analysis.overallScore));
    }
    const ayatMastered = [...bestScoreByAyah.values()].filter((score) => score >= MASTERED_SCORE).length;

    return {
      streakDays: computeStreakDays(attempts),
      totalMinutesPracticed: Math.round(attempts.reduce((sum, a) => sum + a.durationSeconds, 0) / 60),
      ayatPracticed: distinctAyat.size,
      ayatMastered,
      ...scoreTrend(attempts),
    };
  }
}

export const progressService: ProgressService = new LocalProgressService();
