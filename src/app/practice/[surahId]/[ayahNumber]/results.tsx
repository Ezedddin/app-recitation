import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AudioPlayer } from '@/components/audio';
import { BackHeader, Card, FeedbackText, PrimaryButton, ScoreRing, ScreenContainer, SecondaryButton, SectionHeader } from '@/components/ui';
import { Colors, Spacing, Typography } from '@/constants';
import { useAsync } from '@/hooks/useAsync';
import { quranService } from '@/services/quran';
import { reciterService } from '@/services/reciters';
import { attemptsFor, flowAttemptsFor, isFlowAttempt, useAppStore } from '@/stores/useAppStore';
import type { PracticeAttempt } from '@/types';

const FLOW_GROUP_SIZE = 5;

export default function ResultsScreen() {
  const { surahId, ayahNumber, attemptId, ayahNumberEnd } = useLocalSearchParams<{
    surahId: string;
    ayahNumber: string;
    attemptId: string;
    ayahNumberEnd?: string;
  }>();
  const ayahNum = Number(ayahNumber);
  const isFlowResult = Boolean(ayahNumberEnd);
  const attempts = useAppStore((state) => state.attempts);

  const attempt = attempts.find((a) => a.id === attemptId);
  const previousAttempt = useMemo(() => {
    if (!attempt) return undefined;
    const comparable =
      isFlowAttempt(attempt)
        ? flowAttemptsFor(attempts, surahId, ayahNum, attempt.ayahNumberEnd as number)
        : attemptsFor(attempts, surahId, ayahNum);
    const sameAyah = comparable
      .filter((a) => a.id !== attempt.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return sameAyah.at(-1);
  }, [attempts, attempt, surahId, ayahNum]);

  const { data: surah } = useAsync(() => quranService.getSurah(surahId), [surahId]);
  const { data: reciter } = useAsync(
    () => (attempt ? reciterService.getById(attempt.reciterId) : Promise.resolve(undefined)),
    [attempt?.reciterId],
  );
  const { data: referenceAudio } = useAsync(
    () => quranService.getReferenceAudio(surahId, ayahNum),
    [surahId, ayahNum],
  );
  const nextAyahExists = Boolean(surah && ayahNum + 1 <= surah.ayahCount);

  const referenceUrl = attempt
    ? (referenceAudio?.find((entry) => entry.reciterId === attempt.reciterId)?.ayahAudioUrl ?? null)
    : null;

  if (!attempt || !surah) {
    return (
      <ScreenContainer>
        <BackHeader title="Your Recitation" />
        <Text style={styles.missing}>We couldn&apos;t find this result. Please record again.</Text>
      </ScreenContainer>
    );
  }

  const reciterName = reciter?.name ?? 'your reciter';
  const analysis = attempt.analysis;

  const handleTryAgain = () => {
    router.replace(`/practice/${surahId}/${ayahNum}`);
  };

  const handleNextAyah = () => {
    if (nextAyahExists) {
      router.replace(`/practice/${surahId}/${ayahNum + 1}`);
    } else {
      router.replace(`/surah/${surahId}`);
    }
  };

  const showFlowSuggestion = !isFlowResult && ayahNum >= FLOW_GROUP_SIZE && ayahNum % FLOW_GROUP_SIZE === 0;
  const flowRangeStart = ayahNum - FLOW_GROUP_SIZE + 1;

  const goToFlowPractice = () => router.push(`/practice/${surahId}/flow/${flowRangeStart}/${ayahNum}`);

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <BackHeader
          title="Your Recitation"
          subtitle={`${surah.transliteratedName} · Ayah ${isFlowResult ? `${ayahNum}–${ayahNumberEnd}` : ayahNum}`}
        />

        <View style={styles.scoreWrap}>
          <ScoreRing score={analysis.overallScore} label="Overall" />
        </View>

        <Card style={styles.section}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="sparkles-outline" size={18} color={Colors.primary} />
            <SectionHeader title="Feedback" />
          </View>
          <FeedbackText text={analysis.feedback || 'No feedback was given for this recitation.'} />
        </Card>

        <Card style={styles.section}>
          <SectionHeader title="Listen back" />
          {referenceUrl ? <AudioPlayer source={referenceUrl} label={reciterName} /> : null}
          <AudioPlayer source={{ uri: attempt.recordingUri }} label="Your recitation" allowSpeedControl={false} />
        </Card>

        {previousAttempt ? <RetryComparison previous={previousAttempt} current={attempt} /> : null}

        {showFlowSuggestion ? (
          <Card style={styles.section}>
            <SectionHeader title="Ready to bring it together?" />
            <Text style={styles.flowText}>
              You&apos;ve practiced ayat {flowRangeStart}–{ayahNum} of {surah.transliteratedName} one at a time.
              Want to recite them all in one flowing take?
            </Text>
            <PrimaryButton label="Start flowing recitation" onPress={goToFlowPractice} />
          </Card>
        ) : null}

        <View style={styles.actions}>
          <PrimaryButton label="Try Again" onPress={handleTryAgain} />
          <SecondaryButton label="Next Ayah" onPress={handleNextAyah} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function RetryComparison({ previous, current }: { previous: PracticeAttempt; current: PracticeAttempt }) {
  const delta = current.analysis.overallScore - previous.analysis.overallScore;
  const improved = delta > 0;

  return (
    <Card style={styles.section}>
      <SectionHeader title={improved ? 'Great improvement' : 'Keep practicing'} />
      <View style={styles.compareRow}>
        <View style={styles.compareCol}>
          <Text style={styles.compareLabel}>Previous</Text>
          <Text style={styles.compareScore}>{Math.round(previous.analysis.overallScore)}</Text>
        </View>
        <Text style={styles.compareArrow}>→</Text>
        <View style={styles.compareCol}>
          <Text style={styles.compareLabel}>Current</Text>
          <Text style={[styles.compareScore, improved && styles.compareScorePositive]}>
            {Math.round(current.analysis.overallScore)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  missing: {
    ...Typography.body,
    color: Colors.secondaryText,
    padding: Spacing.lg,
  },
  scroll: {
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  scoreWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  section: {
    gap: Spacing.sm,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  flowText: {
    ...Typography.callout,
    color: Colors.secondaryText,
  },
  actions: {
    gap: Spacing.sm,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  compareCol: {
    alignItems: 'center',
  },
  compareLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  compareScore: {
    ...Typography.numeric,
    color: Colors.text,
  },
  compareScorePositive: {
    color: Colors.primary,
  },
  compareArrow: {
    ...Typography.title2,
    color: Colors.tertiaryText,
  },
});
