import { ayahsCovered, isFlowAttempt } from '@/stores/useAppStore';
import type { PracticeAttempt, ProgressSummary, SkillId, SkillProgress } from '@/types';

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

const SKILL_LABELS: Record<SkillId, string> = {
  pitch: 'Pitch Control',
  tajweed: 'Tajweed',
  pronunciation: 'Pronunciation',
  rhythm: 'Rhythm',
  melody: 'Melody',
};

function metricFor(attempt: PracticeAttempt, skill: SkillId): number {
  switch (skill) {
    case 'pitch':
      return attempt.analysis.style.pitch;
    case 'rhythm':
      return attempt.analysis.style.rhythm;
    case 'melody':
      return attempt.analysis.style.melody;
    case 'tajweed':
      return attempt.analysis.correctness.tajweed;
    case 'pronunciation':
      return attempt.analysis.correctness.pronunciation;
  }
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

function buildSkillProgress(attempts: PracticeAttempt[], skill: SkillId): SkillProgress {
  const sorted = [...attempts].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  const recent = sorted.filter((a) => now - new Date(a.createdAt).getTime() <= THIRTY_DAYS);
  const previous = sorted.filter((a) => {
    const age = now - new Date(a.createdAt).getTime();
    return age > THIRTY_DAYS && age <= THIRTY_DAYS * 2;
  });

  const recentAvg = average(recent.map((a) => metricFor(a, skill)));
  const previousAvg = average(previous.map((a) => metricFor(a, skill)));
  const current = recentAvg || average(sorted.map((a) => metricFor(a, skill)));
  const monthChangePercent = previousAvg > 0 ? Math.round(((recentAvg - previousAvg) / previousAvg) * 100) : 0;

  const history = sorted.slice(-8).map((a, i) => ({
    label: `#${i + 1}`,
    value: Math.round(metricFor(a, skill)),
  }));

  return {
    skill,
    label: SKILL_LABELS[skill],
    current: Math.round(current),
    monthChangePercent,
    history,
  };
}

export class LocalProgressService implements ProgressService {
  summarize(attempts: PracticeAttempt[]): ProgressSummary {
    const skills = (Object.keys(SKILL_LABELS) as SkillId[]).map((skill) => buildSkillProgress(attempts, skill));
    const distinctAyat = new Set(attempts.flatMap((a) => ayahsCovered(a).map((n) => `${a.surahId}:${n}`)));

    const bestScoreByAyah = new Map<string, number>();
    // Mastery is per ayah, so only single-ayah attempts count — a flow
    // attempt's score is shared across its whole range.
    for (const attempt of attempts) {
      if (isFlowAttempt(attempt)) continue;
      const key = `${attempt.surahId}:${attempt.ayahNumber}`;
      bestScoreByAyah.set(key, Math.max(bestScoreByAyah.get(key) ?? 0, attempt.analysis.overallScore));
    }
    const ayatMastered = [...bestScoreByAyah.values()].filter((score) => score >= 90).length;

    const withScores = skills.filter((s) => s.current > 0);
    const strongestSkill = (withScores.length
      ? [...withScores].sort((a, b) => b.current - a.current)[0]
      : skills[0]
    ).skill;
    const currentFocus = (withScores.length
      ? [...withScores].sort((a, b) => a.current - b.current)[0]
      : skills[0]
    ).skill;

    return {
      streakDays: computeStreakDays(attempts),
      totalMinutesPracticed: Math.round(attempts.reduce((sum, a) => sum + a.durationSeconds, 0) / 60),
      ayatPracticed: distinctAyat.size,
      ayatMastered,
      skills,
      strongestSkill,
      currentFocus,
    };
  }
}

export const progressService: ProgressService = new LocalProgressService();
