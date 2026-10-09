import type { RecitationAnalysis } from './analysis';

export interface PracticeAttempt {
  id: string;
  surahId: string;
  ayahNumber: number;
  reciterId: string;
  createdAt: string;
  durationSeconds: number;
  /** Local file uri for this attempt's recording — may become unavailable if the OS clears the cache. */
  recordingUri: string;
  analysis: RecitationAnalysis;
}

export type SkillId = 'pitch' | 'tajweed' | 'pronunciation' | 'rhythm' | 'melody';

export interface SkillHistoryPoint {
  label: string;
  value: number;
}

export interface SkillProgress {
  skill: SkillId;
  label: string;
  current: number;
  monthChangePercent: number;
  history: SkillHistoryPoint[];
}

export interface ProgressSummary {
  streakDays: number;
  totalMinutesPracticed: number;
  ayatPracticed: number;
  ayatMastered: number;
  skills: SkillProgress[];
  strongestSkill: SkillId;
  currentFocus: SkillId;
}
