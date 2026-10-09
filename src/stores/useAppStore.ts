import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PracticeAttempt, RecitationAnalysis } from '@/types';

interface AppState {
  hasHydrated: boolean;
  onboardingCompleted: boolean;
  selectedReciterId: string | null;
  lastSurahId: string | null;
  lastAyahNumber: number | null;
  attempts: PracticeAttempt[];
  /** The onboarding "discover your voice" baseline readings — kept so the profile can be revisited later. */
  voiceDiscoveryAnalyses: RecitationAnalysis[];

  completeOnboarding: () => void;
  selectReciter: (reciterId: string) => void;
  setLastPosition: (surahId: string, ayahNumber: number) => void;
  addAttempt: (attempt: PracticeAttempt) => void;
  addVoiceDiscoveryAnalysis: (analysis: RecitationAnalysis) => void;
  clearVoiceDiscoveryAnalyses: () => void;
}

/**
 * Single local persisted store for phase-1 prototype state. Keeping this as
 * one flat, serializable shape (rather than several stores) means a future
 * backend can replace `persist`'s AsyncStorage adapter with a sync-to-server
 * layer without restructuring how screens read state.
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      onboardingCompleted: false,
      selectedReciterId: null,
      lastSurahId: null,
      lastAyahNumber: null,
      attempts: [],
      voiceDiscoveryAnalyses: [],

      completeOnboarding: () => set({ onboardingCompleted: true }),
      selectReciter: (reciterId) => set({ selectedReciterId: reciterId }),
      setLastPosition: (surahId, ayahNumber) => set({ lastSurahId: surahId, lastAyahNumber: ayahNumber }),
      addAttempt: (attempt) => set((state) => ({ attempts: [...state.attempts, attempt] })),
      addVoiceDiscoveryAnalysis: (analysis) =>
        set((state) => ({ voiceDiscoveryAnalyses: [...state.voiceDiscoveryAnalyses, analysis] })),
      clearVoiceDiscoveryAnalyses: () => set({ voiceDiscoveryAnalyses: [] }),
    }),
    {
      name: 'app-recitatie-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        onboardingCompleted: state.onboardingCompleted,
        selectedReciterId: state.selectedReciterId,
        lastSurahId: state.lastSurahId,
        lastAyahNumber: state.lastAyahNumber,
        attempts: state.attempts,
        voiceDiscoveryAnalyses: state.voiceDiscoveryAnalyses,
      }),
      onRehydrateStorage: () => () => {
        useAppStore.setState({ hasHydrated: true });
      },
    },
  ),
);

export function isFlowAttempt(attempt: PracticeAttempt): boolean {
  return attempt.ayahNumberEnd !== undefined && attempt.ayahNumberEnd > attempt.ayahNumber;
}

/** Every ayah number an attempt recited — one for a single-ayah attempt, the whole range for a flow attempt. */
export function ayahsCovered(attempt: PracticeAttempt): number[] {
  const end = isFlowAttempt(attempt) ? (attempt.ayahNumberEnd as number) : attempt.ayahNumber;
  return Array.from({ length: end - attempt.ayahNumber + 1 }, (_, i) => attempt.ayahNumber + i);
}

/** Single-ayah attempts only — a flow attempt's score covers several ayat, so it isn't comparable here. */
export function attemptsFor(attempts: PracticeAttempt[], surahId: string, ayahNumber: number): PracticeAttempt[] {
  return attempts.filter(
    (attempt) => attempt.surahId === surahId && attempt.ayahNumber === ayahNumber && !isFlowAttempt(attempt),
  );
}

export function flowAttemptsFor(
  attempts: PracticeAttempt[],
  surahId: string,
  startAyah: number,
  endAyah: number,
): PracticeAttempt[] {
  return attempts.filter(
    (attempt) =>
      attempt.surahId === surahId &&
      attempt.ayahNumber === startAyah &&
      attempt.ayahNumberEnd === endAyah &&
      isFlowAttempt(attempt),
  );
}
