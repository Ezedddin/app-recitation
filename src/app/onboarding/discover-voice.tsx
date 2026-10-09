import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { RecitationRecorderPanel } from '@/components/audio';
import { QuranText } from '@/components/quran';
import { EmptyState, ScreenContainer } from '@/components/ui';
import { Colors, Radius, Spacing, Typography } from '@/constants';
import { useRecitationRecorder } from '@/hooks/useRecitationRecorder';
import { analysisService } from '@/services/analysis';
import { quranService } from '@/services/quran';
import { useAppStore } from '@/stores/useAppStore';
import { VOICE_DISCOVERY_RECITER_ID } from '@/utils/voiceProfile';
import type { Ayah } from '@/types';

const SURAH_ID = '1'; // Al-Fatihah
const DISCOVERY_AYAH_COUNT = 3;
// Ayah 1 of Al-Fatihah is Bismillah — recited before every surah, only 4
// words, not distinctive of this person's voice. Start from ayah 2 instead.
const DISCOVERY_START_AYAH_INDEX = 1;

export default function DiscoverVoiceScreen() {
  const [ayahs, setAyahs] = useState<Ayah[] | null>(null);
  const [ayahsFailed, setAyahsFailed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorder = useRecitationRecorder();
  const addVoiceDiscoveryAnalysis = useAppStore((state) => state.addVoiceDiscoveryAnalysis);
  const clearVoiceDiscoveryAnalyses = useAppStore((state) => state.clearVoiceDiscoveryAnalyses);

  useEffect(() => {
    clearVoiceDiscoveryAnalyses();
    quranService
      .getAyahs(SURAH_ID)
      .then((result) =>
        setAyahs(result.slice(DISCOVERY_START_AYAH_INDEX, DISCOVERY_START_AYAH_INDEX + DISCOVERY_AYAH_COUNT)),
      )
      .catch(() => setAyahsFailed(true));
    // Only run once, when the flow starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ayah = ayahs?.[currentIndex];

  const handleAnalyze = () => {
    if (!recorder.uri || !ayah) return;
    setError(null);
    setIsAnalyzing(true);

    analysisService
      .analyze({
        surahId: SURAH_ID,
        ayahNumber: ayah.number,
        reciterId: VOICE_DISCOVERY_RECITER_ID,
        recordingUri: recorder.uri,
        attemptNumber: 1,
      })
      .then((analysis) => {
        addVoiceDiscoveryAnalysis(analysis);
        recorder.reset();
        if (ayahs && currentIndex + 1 < ayahs.length) {
          setCurrentIndex((i) => i + 1);
        } else {
          router.replace('/onboarding/voice-results');
        }
      })
      .catch((err: unknown) =>
        setError(
          `Something went wrong analyzing that recording. ${err instanceof Error ? err.message : 'Please try again.'}`,
        ),
      )
      .finally(() => setIsAnalyzing(false));
  };

  if (ayahsFailed) {
    return (
      <ScreenContainer>
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load Al-Fatihah"
          message="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => router.replace('/onboarding/discover-voice')}
        />
      </ScreenContainer>
    );
  }

  if (!ayahs || !ayah) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={Colors.primary} style={styles.loading} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.step}>
          Ayah {currentIndex + 1} of {ayahs.length}
        </Text>
        <Text style={styles.headline}>{currentIndex === 0 ? "Let's hear your voice" : 'One more ayah'}</Text>
        <Text style={styles.subtitle}>
          {currentIndex === 0
            ? "Recite a few ayat of Al-Fatihah so we can understand your natural strengths — no reciter comparison yet."
            : 'Recite the next ayah whenever you\'re ready.'}
        </Text>
      </View>

      <View style={styles.progressRow}>
        {ayahs.map((_, index) => (
          <View key={index} style={[styles.progressDot, index <= currentIndex && styles.progressDotActive]} />
        ))}
      </View>

      <View style={styles.body}>
        <QuranText size="display" style={styles.ayahText}>
          {ayah.arabicText}
        </QuranText>

        {isAnalyzing ? (
          <View style={styles.analyzingWrap}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.analyzingText}>Listening to your recitation…</Text>
          </View>
        ) : (
          <RecitationRecorderPanel
            recorder={recorder}
            onAnalyze={handleAnalyze}
            analyzeLabel={currentIndex + 1 < ayahs.length ? 'Continue' : 'See my results'}
          />
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    marginTop: Spacing.xxl,
  },
  header: {
    gap: Spacing.xxs,
    marginTop: Spacing.md,
  },
  step: {
    ...Typography.caption,
    color: Colors.secondaryText,
    textTransform: 'uppercase',
  },
  headline: {
    ...Typography.title1,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.callout,
    color: Colors.secondaryText,
  },
  progressRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.sageMuted,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  body: {
    flex: 1,
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
  ayahText: {
    marginTop: Spacing.sm,
  },
  analyzingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  analyzingText: {
    ...Typography.callout,
    color: Colors.secondaryText,
  },
  errorText: {
    ...Typography.footnote,
    color: Colors.feedbackCaution,
    textAlign: 'center',
  },
});
