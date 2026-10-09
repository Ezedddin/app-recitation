import { File } from 'expo-file-system';

import { postForm } from '@/services/api/client';
import type { RecitationAnalysis, RecitationAnalysisRequest } from '@/types';

import type { AnalysisService } from './AnalysisService';

export class RemoteAnalysisService implements AnalysisService {
  async analyze(request: RecitationAnalysisRequest): Promise<RecitationAnalysis> {
    const form = new FormData();
    // SDK 57 replaces global fetch with expo/fetch, whose FormData only
    // accepts real Blob-like parts (string | Blob | { bytes() }) — the
    // classic RN `{ uri, name, type }` object throws "Unsupported
    // FormDataPart implementation". `File` from expo-file-system implements
    // Blob, so it works here.
    const audioFile = new File(request.recordingUri);
    form.append('audio', audioFile, 'recording.m4a');
    form.append('reciterId', request.reciterId);
    form.append('surahNumber', request.surahId);
    form.append('ayahNumber', String(request.ayahNumber));
    form.append('attemptNumber', String(request.attemptNumber));
    if (request.ayahNumberEnd) {
      form.append('ayahNumberEnd', String(request.ayahNumberEnd));
    }

    return postForm<RecitationAnalysis>('/api/v1/analyze', form);
  }
}
