import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, ProgressCard, ScreenContainer } from '@/components/ui';
import { Colors, Radius, Spacing, Typography } from '@/constants';
import { useAsync } from '@/hooks/useAsync';
import { progressService } from '@/services/progress';
import { quranService } from '@/services/quran';
import { reciterService } from '@/services/reciters';
import { ayahsCovered, useAppStore } from '@/stores/useAppStore';

const DEFAULT_SURAH_ID = '1';

export default function HomeScreen() {
  const attempts = useAppStore((state) => state.attempts);
  const selectedReciterId = useAppStore((state) => state.selectedReciterId);
  const lastSurahId = useAppStore((state) => state.lastSurahId) ?? DEFAULT_SURAH_ID;
  const lastAyahNumber = useAppStore((state) => state.lastAyahNumber) ?? 1;

  const { data: reciter } = useAsync(
    () => (selectedReciterId ? reciterService.getById(selectedReciterId) : Promise.resolve(undefined)),
    [selectedReciterId],
  );
  const { data: surah } = useAsync(() => quranService.getSurah(lastSurahId), [lastSurahId]);

  const summary = useMemo(() => progressService.summarize(attempts), [attempts]);

  const attemptedAyahs = useMemo(
    () => new Set(attempts.filter((a) => a.surahId === lastSurahId).flatMap(ayahsCovered)).size,
    [attempts, lastSurahId],
  );
  const continueProgress = surah && surah.ayahCount > 0 ? Math.round((attemptedAyahs / surah.ayahCount) * 100) : 0;

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.greeting}>Assalamu Alaikum</Text>

        <View style={styles.continueCard}>
          <Text style={styles.continueLabel}>Continue your training</Text>
          <Text style={styles.continueSurah}>
            {surah?.transliteratedName ?? '…'} · Ayah {lastAyahNumber}
          </Text>
          <Text style={styles.continueReciter}>Learning from: {reciter?.name ?? '…'}</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${continueProgress}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{continueProgress}% progress</Text>

          <PrimaryButton
            label="Continue"
            onPress={() => router.push(`/practice/${lastSurahId}/${lastAyahNumber}`)}
            style={styles.continueCta}
          />
        </View>

        <View style={styles.statsRow}>
          <ProgressCard value={`${summary.streakDays}`} label="Day streak" />
          <ProgressCard value={`${summary.ayatPracticed}`} label="Ayat practiced" />
          <ProgressCard value={`${summary.totalMinutesPracticed}`} label="Minutes practiced" />
          <ProgressCard value={`${summary.ayatMastered}`} label="Ayat mastered" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xl,
  },
  greeting: {
    ...Typography.title1,
    color: Colors.text,
  },
  continueCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.xxs,
  },
  continueLabel: {
    ...Typography.subhead,
    color: Colors.secondaryText,
  },
  continueSurah: {
    ...Typography.title2,
    color: Colors.text,
  },
  continueReciter: {
    ...Typography.footnote,
    color: Colors.secondaryText,
    marginBottom: Spacing.sm,
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.sageMuted,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
    marginTop: 4,
  },
  continueCta: {
    marginTop: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
