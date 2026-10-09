import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AudioPlayer, RecitationRecorderPanel } from '@/components/audio';
import { QuranText } from '@/components/quran';
import { BackHeader, ScreenContainer } from '@/components/ui';
import { Colors, Radius, Spacing, Typography } from '@/constants';
import { useAsync } from '@/hooks/useAsync';
import { useRecitationRecorder } from '@/hooks/useRecitationRecorder';
import { quranService } from '@/services/quran';
import { reciterService } from '@/services/reciters';
import { attemptsFor, useAppStore } from '@/stores/useAppStore';

export default function PracticeScreen() {
  const { surahId, ayahNumber } = useLocalSearchParams<{ surahId: string; ayahNumber: string }>();
  const ayahNum = Number(ayahNumber);
  const selectedReciterId = useAppStore((state) => state.selectedReciterId);
  const attempts = useAppStore((state) => state.attempts);

  const { data: surah, loading: surahLoading } = useAsync(() => quranService.getSurah(surahId), [surahId]);
  const { data: ayah, loading: ayahLoading } = useAsync(() => quranService.getAyah(surahId, ayahNum), [surahId, ayahNum]);
  const { data: reciter, loading: reciterLoading } = useAsync(
    () => (selectedReciterId ? reciterService.getById(selectedReciterId) : Promise.resolve(undefined)),
    [selectedReciterId],
  );
  const { data: referenceAudio } = useAsync(
    () => quranService.getReferenceAudio(surahId, ayahNum),
    [surahId, ayahNum],
  );

  const attemptNumber = useMemo(
    () => attemptsFor(attempts, surahId, ayahNum).length + 1,
    [attempts, surahId, ayahNum],
  );

  const recorder = useRecitationRecorder();

  const loading = surahLoading || ayahLoading || reciterLoading;

  if (loading) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <BackHeader title="Practice" />
        <ActivityIndicator color={Colors.primary} style={styles.loading} />
      </ScreenContainer>
    );
  }

  if (!surah || !ayah || !reciter) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <BackHeader title="Practice" />
        <Text style={styles.missing}>Couldn&apos;t load this ayah. Check your connection and try again.</Text>
      </ScreenContainer>
    );
  }

  const referenceUrl = referenceAudio?.find((entry) => entry.reciterId === reciter.id)?.ayahAudioUrl ?? null;

  const goToAnalysis = () => {
    if (!recorder.uri) return;
    router.push({
      pathname: '/practice/[surahId]/[ayahNumber]/analyzing',
      params: {
        surahId,
        ayahNumber,
        recordingUri: recorder.uri,
        attemptNumber: String(attemptNumber),
        durationMillis: String(recorder.durationMillis),
      },
    });
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <BackHeader title={surah.transliteratedName} subtitle={`Ayah ${ayah.number}`} />

      <View style={styles.body}>
        <QuranText size="display" style={styles.ayahText}>
          {ayah.arabicText}
        </QuranText>

        <View style={styles.section}>
          {referenceUrl ? (
            <AudioPlayer source={referenceUrl} label={`Listen to ${reciter.name}`} />
          ) : (
            <Text style={styles.previewNote}>No reference recitation available for {reciter.name} on this ayah yet.</Text>
          )}
        </View>

        <View style={styles.divider} />

        <RecitationRecorderPanel recorder={recorder} onAnalyze={goToAnalysis} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  missing: {
    ...Typography.body,
    color: Colors.secondaryText,
    padding: Spacing.lg,
  },
  loading: {
    marginTop: Spacing.xxl,
  },
  body: {
    flex: 1,
    gap: Spacing.lg,
  },
  ayahText: {
    marginTop: Spacing.sm,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  previewNote: {
    ...Typography.callout,
    color: Colors.secondaryText,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
});
