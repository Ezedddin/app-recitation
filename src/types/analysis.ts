/**
 * Core analysis data model: one 0–100 score plus the AI coach's feedback
 * text. The backend blends its AI judgement of the recitation with a DSP
 * style match against the chosen reciter into `overallScore`.
 */
export interface RecitationAnalysis {
  id: string;
  createdAt: string;
  surahId: string;
  ayahNumber: number;
  reciterId: string;
  attemptNumber: number;
  overallScore: number;
  feedback: string;
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
