import { getJSON } from '@/services/api/client';
import type { Ayah, ReferenceAudio, Surah } from '@/types';

/** Boundary for the `/api/v1` Quran endpoints on our own backend (which itself proxies UmmahAPI). */
export interface QuranService {
  listSurahs(): Promise<Surah[]>;
  searchSurahs(query: string): Promise<Surah[]>;
  getSurah(surahId: string): Promise<Surah | undefined>;
  getAyahs(surahId: string): Promise<Ayah[]>;
  getAyah(surahId: string, ayahNumber: number): Promise<Ayah | undefined>;
  getReferenceAudio(surahId: string, ayahNumber: number): Promise<ReferenceAudio[]>;
}

export class RemoteQuranService implements QuranService {
  private surahCache: Surah[] | null = null;
  private surahInFlight: Promise<Surah[]> | null = null;

  private async loadSurahs(): Promise<Surah[]> {
    if (this.surahCache) return this.surahCache;
    if (!this.surahInFlight) {
      this.surahInFlight = getJSON<Surah[]>('/api/v1/surahs')
        .then((surahs) => {
          this.surahCache = surahs;
          return surahs;
        })
        .finally(() => {
          this.surahInFlight = null;
        });
    }
    return this.surahInFlight;
  }

  async listSurahs(): Promise<Surah[]> {
    return this.loadSurahs();
  }

  async searchSurahs(query: string): Promise<Surah[]> {
    const surahs = await this.loadSurahs();
    const normalized = query.trim().toLowerCase();
    if (!normalized) return surahs;
    return surahs.filter(
      (surah) =>
        surah.transliteratedName.toLowerCase().includes(normalized) ||
        surah.englishName.toLowerCase().includes(normalized) ||
        String(surah.number) === normalized,
    );
  }

  async getSurah(surahId: string): Promise<Surah | undefined> {
    const surahs = await this.loadSurahs();
    return surahs.find((surah) => surah.id === surahId);
  }

  async getAyahs(surahId: string): Promise<Ayah[]> {
    return getJSON<Ayah[]>(`/api/v1/surah/${surahId}/ayahs`);
  }

  async getAyah(surahId: string, ayahNumber: number): Promise<Ayah | undefined> {
    return getJSON<Ayah>(`/api/v1/surah/${surahId}/ayah/${ayahNumber}`);
  }

  async getReferenceAudio(surahId: string, ayahNumber: number): Promise<ReferenceAudio[]> {
    return getJSON<ReferenceAudio[]>(`/api/v1/surah/${surahId}/ayah/${ayahNumber}/audio`);
  }
}

export const quranService: QuranService = new RemoteQuranService();
