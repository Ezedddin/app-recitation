import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { WordFeedback } from '@/components/feedback';
import { BackHeader, Card, PrimaryButton, ScoreRing, ScreenContainer, SecondaryButton, SectionHeader, SkillScore } from '@/components/ui';
import { Colors, Spacing, Typography } from '@/constants';
import { useAsync } from '@/hooks/useAsync';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { quranService } from '@/services/quran';
import { reciterService } from '@/services/reciters';
import { useAppStore } from '@/stores/useAppStore';
import { formatPercent, formatSignedPercent } from '@/utils/format';
import type { CoachInsight, PracticeAttempt } from '@/types';

const FLOW_GROUP_SIZE = 5;

export default function ResultsScreen() {
  const { surahId, ayahNumber, attemptId, ayahNumberEnd } = useLocalSearchParams<{
    surahId: string;
    ayahNumber: string;
    attemptId: string;
    ayahNumberEnd?: string;
  }>();
  const ayahNum = Number(ayahNumber);
  const isFlowAttempt = Boolean(ayahNumberEnd);
  const attempts = useAppStore((state) => state.attempts);
  const [showScores, setShowScores] = useState(false);

  const attempt = attempts.find((a) => a.id === attemptId);
  const previousAttempt = useMemo(() => {
    if (!attempt) return undefined;
    const sameAyah = attempts
      .filter((a) => a.surahId === surahId && a.ayahNumber === ayahNum && a.id !== attempt.id)
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
  const referencePlayer = useAudioPlayback(referenceUrl);
  const selfPlayer = useAudioPlayback(attempt ? { uri: attempt.recordingUri } : null);

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

  /**
   * Phase 1 has no real per-word audio alignment yet, so "listen to this
   * word" plays the full clip from the start rather than faking a seek.
   */
  const playFromStart = (player: ReturnType<typeof useAudioPlayback>) => {
    player.replay();
  };

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

  const goToPitch = () =>
    router.push({
      pathname: '/practice/[surahId]/[ayahNumber]/pitch',
      params: { surahId, ayahNumber, attemptId },
    });

  const showFlowSuggestion = !isFlowAttempt && ayahNum >= FLOW_GROUP_SIZE && ayahNum % FLOW_GROUP_SIZE === 0;
  const flowRangeStart = ayahNum - FLOW_GROUP_SIZE + 1;

  const goToFlowPractice = () => router.push(`/practice/${surahId}/flow/${flowRangeStart}/${ayahNum}`);

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <BackHeader
          title="Your Recitation"
          subtitle={`${surah.transliteratedName} · Ayah ${isFlowAttempt ? `${ayahNum}–${ayahNumberEnd}` : ayahNum}`}
        />

        <View style={styles.scoreWrap}>
          <ScoreRing score={analysis.overallScore} label="Overall" />
        </View>

        <Card style={styles.section}>
          <SectionHeader title="Your coach noticed" />
          {analysis.insights.map((insight, index) => (
            <CoachFeedbackRow
              key={insight.id}
              insight={insight}
              isLast={index === analysis.insights.length - 1}
              onShowPitch={insight.id.startsWith('pitch-') ? goToPitch : undefined}
            />
          ))}
        </Card>

        <View style={styles.section}>
          <SectionHeader title="Word by word" subtitle="Tap a word for detailed coaching" />
          <WordFeedback
            words={analysis.words}
            onListenReference={() => playFromStart(referencePlayer)}
            onListenSelf={() => playFromStart(selfPlayer)}
            onListenSlowly={() => {
              referencePlayer.setRate(0.75);
              playFromStart(referencePlayer);
            }}
            onPracticeSection={() => router.replace(`/practice/${surahId}/${ayahNum}`)}
          />
        </View>

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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showScores ? 'Hide detailed scores' : 'Show detailed scores'}
          onPress={() => setShowScores((v) => !v)}
          style={styles.scoresToggle}>
          <Text style={styles.scoresToggleLabel}>{showScores ? 'Hide detailed scores' : 'Show detailed scores'}</Text>
          <Ionicons name={showScores ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.secondaryText} />
        </Pressable>

        {showScores ? (
          <>
            <Card style={styles.section}>
              <SectionHeader title="Correctness" subtitle="Pronunciation and Tajweed" />
              <SkillScore label="Pronunciation" score={analysis.correctness.pronunciation} />
              <SkillScore label="Tajweed" score={analysis.correctness.tajweed} />
            </Card>

            <Card style={styles.section}>
              <SectionHeader title="Recitation Style" subtitle="How you sound, not whether it's correct" />
              <SkillScore label="Pitch" score={analysis.style.pitch} accentColor={Colors.goldAccent} />
              <SkillScore label="Rhythm" score={analysis.style.rhythm} accentColor={Colors.goldAccent} />
              <SkillScore label="Timing" score={analysis.style.timing} accentColor={Colors.goldAccent} />
              <SkillScore label="Melody" score={analysis.style.melody} accentColor={Colors.goldAccent} />

              <View style={styles.similarityRow}>
                <Text style={styles.similarityValue}>{formatPercent(analysis.style.similarity)} style similarity</Text>
                <Text style={styles.similarityRef}>Reference: {reciterName}</Text>
              </View>
              <Text style={styles.similarityNote}>
                Style similarity reflects how you sound, not whether your Tajweed is correct.
              </Text>
            </Card>
          </>
        ) : null}

        <View style={styles.actions}>
          <PrimaryButton label="Try Again" onPress={handleTryAgain} />
          <SecondaryButton label="Next Ayah" onPress={handleNextAyah} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const INSIGHT_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  overall: 'sparkles-outline',
  correctness: 'alert-circle-outline',
  pitch: 'trending-up-outline',
  strength: 'star-outline',
};

const INSIGHT_COLOR: Record<string, string> = {
  overall: Colors.primary,
  correctness: Colors.feedbackNeedsWork,
  pitch: Colors.goldAccent,
  strength: Colors.primary,
};

function insightCategory(id: string): string {
  return id.split('-')[0];
}

function CoachFeedbackRow({
  insight,
  isLast,
  onShowPitch,
}: {
  insight: CoachInsight;
  isLast: boolean;
  onShowPitch?: () => void;
}) {
  const category = insightCategory(insight.id);
  const icon = INSIGHT_ICON[category] ?? 'chatbubble-ellipses-outline';
  const color = INSIGHT_COLOR[category] ?? Colors.primary;

  return (
    <View style={[styles.feedbackRow, !isLast && styles.feedbackRowDivider]}>
      <Ionicons name={icon} size={18} color={color} style={styles.feedbackIcon} />
      <View style={styles.feedbackText}>
        <Text style={styles.feedbackHeadline}>{insight.headline}</Text>
        <Text style={styles.feedbackDetail}>{insight.detail}</Text>
        {onShowPitch ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Show me on the pitch graph" onPress={onShowPitch} hitSlop={4}>
            <Text style={styles.feedbackCta}>Show me →</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
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
      <View style={styles.deltaRow}>
        <DeltaStat label="Pitch" value={current.analysis.style.pitch - previous.analysis.style.pitch} />
        <DeltaStat label="Timing" value={current.analysis.style.timing - previous.analysis.style.timing} />
        <DeltaStat
          label="Pronunciation"
          value={current.analysis.correctness.pronunciation - previous.analysis.correctness.pronunciation}
        />
      </View>
    </Card>
  );
}

function DeltaStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.deltaStat}>
      <Text style={styles.deltaLabel}>{label}</Text>
      <Text style={[styles.deltaValue, value >= 0 ? styles.deltaPositive : styles.deltaNegative]}>
        {formatSignedPercent(value)}
      </Text>
    </View>
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
  feedbackRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  feedbackRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  feedbackIcon: {
    marginTop: 2,
  },
  feedbackText: {
    flex: 1,
    gap: 2,
  },
  feedbackHeadline: {
    ...Typography.bodyEmphasis,
    color: Colors.text,
  },
  feedbackDetail: {
    ...Typography.callout,
    color: Colors.secondaryText,
  },
  feedbackCta: {
    ...Typography.subhead,
    color: Colors.primary,
    marginTop: 2,
  },
  scoresToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
  },
  scoresToggleLabel: {
    ...Typography.subhead,
    color: Colors.secondaryText,
  },
  similarityRow: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: 2,
  },
  similarityValue: {
    ...Typography.headline,
    color: Colors.text,
  },
  similarityRef: {
    ...Typography.footnote,
    color: Colors.secondaryText,
  },
  similarityNote: {
    ...Typography.caption,
    color: Colors.tertiaryText,
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
  deltaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  deltaStat: {
    alignItems: 'center',
    gap: 2,
  },
  deltaLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  deltaValue: {
    ...Typography.bodyEmphasis,
  },
  deltaPositive: {
    color: Colors.primary,
  },
  deltaNegative: {
    color: Colors.feedbackCaution,
  },
});
