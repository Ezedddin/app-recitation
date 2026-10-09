/** Mirrors the backend's `Reciter` model (server/app/models/reciter.py) — real UmmahAPI data, nothing invented. */
export interface Reciter {
  id: string;
  name: string;
  nameArabic: string;
  style: string;
}

/** Per-ayah reference audio for one reciter — `ayahAudioUrl` may be null (not every reciter has every ayah). */
export interface ReferenceAudio {
  reciterId: string;
  ayahAudioUrl: string | null;
  surahAudioUrl: string | null;
}

export interface TrainingWeek {
  week: number;
  title: string;
  description: string;
  focusSkill: 'pitch' | 'rhythm' | 'timing' | 'melody' | 'breath' | 'emotion';
}

export interface TrainingProgram {
  reciterId: string;
  weeks: TrainingWeek[];
}
