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

type PersistedState = Pick<
  AppState,
  'onboardingCompleted' | 'selectedReciterId' | 'lastSurahId' | 'lastAyahNumber' | 'attempts' | 'voiceDiscoveryAnalyses'
>;

interface V0Analysis extends Omit<RecitationAnalysis, 'feedback'> {
  feedback?: string;
  insights?: { id: string; detail: string }[];
}

function toV1Analysis(analysis: RecitationAnalysis): RecitationAnalysis {
  const old = analysis as V0Analysis;
  const feedback =
    old.feedback ?? (old.insights ?? []).filter((insight) => insight.id !== 'overall').map((insight) => insight.detail).join(' ');
  return {
    id: old.id,
    createdAt: old.createdAt,
    surahId: old.surahId,
    ayahNumber: old.ayahNumber,
    reciterId: old.reciterId,
    attemptNumber: old.attemptNumber,
    overallScore: old.overallScore,
    feedback,
  };
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
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as PersistedState;
        if (version < 1) {
          // v0 analyses carried per-skill scores, per-word results and coach
          // insights; v1 keeps only the overall score plus one feedback text.
          state.attempts = (state.attempts ?? []).map((attempt) => ({
            ...attempt,
            analysis: toV1Analysis(attempt.analysis),
          }));
          state.voiceDiscoveryAnalyses = (state.voiceDiscoveryAnalyses ?? []).map(toV1Analysis);
        }
        return state;
      },
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
