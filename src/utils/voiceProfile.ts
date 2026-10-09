import type { RecitationAnalysis } from '@/types';

/**
 * The backend's score includes a style match against a reference reciter,
 * and there's no such thing as a reference-free style score. Before the
 * user has chosen a reciter, we use this one (Mishary Alafasy, UmmahAPI id
 * "1" — the most widely-recognized Murattal style) purely as a technical
 * baseline. It is never shown to the user as a comparison target.
 */
export const VOICE_DISCOVERY_RECITER_ID = '1';

export interface VoiceSummary {
  /** Average score of the onboarding recordings — the user's starting point. */
  averageScore: number;
  /** The AI feedback for each onboarding recording, in recording order. */
  feedback: string[];
}

/**
 * Aggregates the onboarding baseline recordings into a starting score —
 * same "compute a summary, don't store one" pattern as ProgressService.
 */
export function summarizeVoiceDiscovery(analyses: RecitationAnalysis[]): VoiceSummary {
  const total = analyses.reduce((sum, a) => sum + a.overallScore, 0);
  return {
    averageScore: analyses.length > 0 ? Math.round(total / analyses.length) : 0,
    feedback: analyses.map((a) => a.feedback).filter((text) => text.length > 0),
  };
}
