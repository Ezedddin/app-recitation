import { getJSON } from '@/services/api/client';
import type { Reciter } from '@/types';

/**
 * Reciters come from our backend's `/api/v1/reciters`, which in turn proxies
 * UmmahAPI. UmmahAPI has no search endpoint, so — per its own fair-use
 * guidance to cache responses — this fetches the (small, ~13-reciter)
 * directory once and searches it locally rather than hitting the network
 * per keystroke.
 */
export interface ReciterService {
  list(): Promise<Reciter[]>;
  search(query: string): Promise<Reciter[]>;
  getById(id: string): Promise<Reciter | undefined>;
}

function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[-\s']+/g, ' ')
    .trim();
}

export class RemoteReciterService implements ReciterService {
  private cache: Reciter[] | null = null;
  private inFlight: Promise<Reciter[]> | null = null;

  private async loadAll(): Promise<Reciter[]> {
    if (this.cache) return this.cache;
    if (!this.inFlight) {
      this.inFlight = getJSON<Reciter[]>('/api/v1/reciters')
        .then((reciters) => {
          this.cache = reciters;
          return reciters;
        })
        .finally(() => {
          this.inFlight = null;
        });
    }
    return this.inFlight;
  }

  async list(): Promise<Reciter[]> {
    return this.loadAll();
  }

  async search(query: string): Promise<Reciter[]> {
    const all = await this.loadAll();
    const normalized = normalizeForSearch(query);
    if (!normalized) return all;
    return all.filter((reciter) => normalizeForSearch(reciter.name).includes(normalized));
  }

  async getById(id: string): Promise<Reciter | undefined> {
    const all = await this.loadAll();
    return all.find((reciter) => reciter.id === id);
  }
}

export const reciterService: ReciterService = new RemoteReciterService();
