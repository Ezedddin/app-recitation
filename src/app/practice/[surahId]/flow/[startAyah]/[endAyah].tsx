import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RecitationRecorderPanel } from '@/components/audio';
import { QuranText } from '@/components/quran';
import { BackHeader, ScreenContainer } from '@/components/ui';
import { Colors, Spacing, Typography } from '@/constants';
import { useAsync } from '@/hooks/useAsync';
import { useRecitationRecorder } from '@/hooks/useRecitationRecorder';
import { analysisService } from '@/services/analysis';
import { quranService } from '@/services/quran';
import { flowAttemptsFor, useAppStore } from '@/stores/useAppStore';

export default function FlowPracticeScreen() {
  const { surahId, startAyah, endAyah } = useLocalSearchParams<{
    surahId: string;
    startAyah: string;
    endAyah: string;
  }>();
  const start = Number(startAyah);
  const end = Number(endAyah);

  const selectedReciterId = useAppStore((state) => state.selectedReciterId);
  const attempts = useAppStore((state) => state.attempts);
  const addAttempt = useAppStore((state) => state.addAttempt);

  const { data: surah } = useAsync(() => quranService.getSurah(surahId), [surahId]);
  const { data: allAyahs, loading } = useAsync(() => quranService.getAyahs(surahId), [surahId]);
  const ayahsInRange = useMemo(
    () => (allAyahs ?? []).filter((a) => a.number >= start && a.number <= end),
    [allAyahs, start, end],
  );

  const recorder = useRecitationRecorder();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attemptNumber = useMemo(
    () => flowAttemptsFor(attempts, surahId, start, end).length + 1,
    [attempts, surahId, start, end],
  );

  const handleAnalyze = () => {
    if (!recorder.uri || !selectedReciterId) return;
    setError(null);
    setIsAnalyzing(true);

    analysisService
      .analyze({
        surahId,
        ayahNumber: start,
        ayahNumberEnd: end,
        reciterId: selectedReciterId,
        recordingUri: recorder.uri,
        attemptNumber,
      })
      .then((analysis) => {
        addAttempt({
          id: analysis.id,
          surahId,
          ayahNumber: start,
          ayahNumberEnd: end,
          reciterId: analysis.reciterId,
          createdAt: analysis.createdAt,
          durationSeconds: recorder.durationMillis / 1000,
          recordingUri: recorder.uri as string,
          analysis,
        });
        router.replace({
          pathname: '/practice/[surahId]/[ayahNumber]/results',
          params: { surahId, ayahNumber: String(start), attemptId: analysis.id, ayahNumberEnd: String(end) },
        });
      })
      .catch((err: unknown) =>
        setError(`Something went wrong analyzing that recording. ${err instanceof Error ? err.message : ''}`),
      )
      .finally(() => setIsAnalyzing(false));
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <BackHeader
        title={surah ? `${surah.transliteratedName} · Ayah ${start}–${end}` : 'Flowing recitation'}
        subtitle="Recite it all in one take"
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loading} />
        ) : (
          <View style={styles.ayahBlock}>
            {ayahsInRange.map((ayah) => (
              <QuranText key={ayah.number} size="large" style={styles.ayahText}>
                {ayah.arabicText}
              </QuranText>
            ))}
          </View>
        )}

        {isAnalyzing ? (
          <View style={styles.analyzingWrap}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.analyzingText}>Listening to your recitation…</Text>
          </View>
        ) : (
          <RecitationRecorderPanel recorder={recorder} onAnalyze={handleAnalyze} analyzeLabel="Analyze this flow" />
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    flexGrow: 1,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  loading: {
    marginTop: Spacing.xxl,
  },
  ayahBlock: {
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  ayahText: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    paddingBottom: Spacing.md,
  },
  analyzingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xxl,
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
