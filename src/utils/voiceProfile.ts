import { isolateRTL } from './bidi';
import type { RecitationAnalysis, WordAnalysis } from '@/types';

/**
 * Real analysis needs a real reference reciter to compare pitch/rhythm/
 * melody against — there's no such thing as a reference-free style score.
 * Before the user has chosen a reciter, we use this one (Mishary Alafasy,
 * UmmahAPI id "1" — the most widely-recognized Murattal style) purely as a
 * technical baseline. It is never shown to the user as a comparison target;
 * only the correctness (pronunciation/Tajweed) side and the derived
 * "leans towards X" style label are surfaced, both of which read as
 * properties of the user's own voice, not "how close to reciter 1".
 */
export const VOICE_DISCOVERY_RECITER_ID = '1';

export interface VoiceSummary {
  correctness: { pronunciation: number; tajweed: number };
  style: { pitch: number; rhythm: number; melody: number };
  naturalStyleLabel: string;
  strengths: WordAnalysis[];
  growthAreas: WordAnalysis[];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

const STYLE_LABELS: Record<'pitch' | 'rhythm' | 'melody', string> = {
  pitch: 'expressive and dynamic',
  rhythm: 'steady and controlled',
  melody: 'melodic and flowing',
};

function describeNaturalStyle(style: { pitch: number; rhythm: number; melody: number }): string {
  const [top] = (Object.entries(style) as [keyof typeof STYLE_LABELS, number][]).sort((a, b) => b[1] - a[1]);
  return STYLE_LABELS[top[0]];
}

/**
 * Aggregates a handful of baseline recitations (no reciter comparison yet)
 * into a short, honest read of the user's own strengths and growth areas.
 * Pure computation over already-generated (mocked) analyses — same
 * "compute a summary, don't store one" pattern as ProgressService.
 */
export function summarizeVoiceDiscovery(analyses: RecitationAnalysis[]): VoiceSummary {
  const correctness = {
    pronunciation: mean(analyses.map((a) => a.correctness.pronunciation)),
    tajweed: mean(analyses.map((a) => a.correctness.tajweed)),
  };
  const style = {
    pitch: mean(analyses.map((a) => a.style.pitch)),
    rhythm: mean(analyses.map((a) => a.style.rhythm)),
    melody: mean(analyses.map((a) => a.style.melody)),
  };

  const allWords = analyses.flatMap((a) => a.words);
  const strengths = [...allWords].sort((a, b) => b.pronunciationScore - a.pronunciationScore).slice(0, 2);
  const growthAreas = [...allWords]
    .sort((a, b) => Math.min(a.pronunciationScore, a.tajweedScore) - Math.min(b.pronunciationScore, b.tajweedScore))
    .slice(0, 2);

  return {
    correctness,
    style,
    naturalStyleLabel: describeNaturalStyle(style),
    strengths,
    growthAreas,
  };
}

export function formatWordList(words: WordAnalysis[]): string {
  return words.map((w) => isolateRTL(w.arabicText)).join(', ');
}
