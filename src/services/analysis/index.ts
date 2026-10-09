import type { AnalysisService } from './AnalysisService';
import { RemoteAnalysisService } from './RemoteAnalysisService';

export type { AnalysisService } from './AnalysisService';
export { RemoteAnalysisService };

export const analysisService: AnalysisService = new RemoteAnalysisService();
