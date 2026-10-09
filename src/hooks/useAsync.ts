import { useEffect, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Runs `factory` whenever `deps` changes, exposing the standard
 * loading/data/error triple. Every screen that reads from the real backend
 * (reciters, Quran text, reference audio — nothing is local/synchronous
 * anymore) uses this instead of hand-rolling the same effect.
 */
export function useAsync<T>(factory: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let active = true;

    factory()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (active) setState({ data: null, loading: false, error: error instanceof Error ? error : new Error(String(error)) });
      });

    return () => {
      active = false;
    };
  }, deps);

  return state;
}
