import type { TrainingProgram, TrainingWeek } from '@/types';

/**
 * Phase 1 training programs are static mock content — the same five-week
 * shape for every reciter. Real per-reciter lesson content/exercises will
 * replace this once the coaching content pipeline exists.
 */
const BASE_WEEKS: TrainingWeek[] = [
  {
    week: 1,
    title: 'Pitch Control',
    description: 'Learn how to smoothly raise and lower your voice during longer phrases.',
    focusSkill: 'pitch',
  },
  {
    week: 2,
    title: 'Rhythm & Timing',
    description: 'Build a steady internal pulse so pauses and elongations land consistently.',
    focusSkill: 'rhythm',
  },
  {
    week: 3,
    title: 'Breath Control',
    description: 'Plan your breaths so long ayat never feel rushed or cut short.',
    focusSkill: 'breath',
  },
  {
    week: 4,
    title: 'Emotional Delivery',
    description: 'Bring meaning and feeling into your recitation without losing control.',
    focusSkill: 'emotion',
  },
  {
    week: 5,
    title: 'Advanced Melody',
    description: 'Combine everything into a fuller, more expressive melodic style.',
    focusSkill: 'melody',
  },
];

export function getTrainingProgram(reciterId: string): TrainingProgram {
  return { reciterId, weeks: BASE_WEEKS };
}
