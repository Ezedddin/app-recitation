import type { RecitationAnalysis, RecitationAnalysisRequest } from '@/types';

/**
 * Boundary between the app and whatever produces recitation analysis.
 *
 * `RemoteAnalysisService` uploads the recording to our own backend
 * (see /server), which runs the real pipeline: reference audio resolved via
 * UmmahAPI (cached — a reference is analyzed once, then reused for every
 * user) -> deterministic DSP pitch/timing/rhythm extraction and comparison
 * -> OpenAI audio analysis of the user's own recording for pronunciation/
 * Tajweed -> structured `RecitationAnalysis` JSON, matching this type
 * exactly. Screens only ever depend on this interface.
 */
export interface AnalysisService {
  analyze(request: RecitationAnalysisRequest): Promise<RecitationAnalysis>;
}
