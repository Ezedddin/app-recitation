import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { TrendSparkline } from '@/components/charts';
import { EmptyState, ProgressCard, ScreenContainer } from '@/components/ui';
import { Colors, Radius, Spacing, Typography } from '@/constants';
import { progressService } from '@/services/progress';
import { useAppStore } from '@/stores/useAppStore';
import { formatSignedPercent } from '@/utils/format';
import { summarizeVoiceDiscovery } from '@/utils/voiceProfile';

export default function ProgressScreen() {
  const attempts = useAppStore((state) => state.attempts);
  const voiceDiscoveryAnalyses = useAppStore((state) => state.voiceDiscoveryAnalyses);
  const summary = progressService.summarize(attempts);

  const baseline = voiceDiscoveryAnalyses.length > 0 ? summarizeVoiceDiscovery(voiceDiscoveryAnalyses) : null;
  const sinceStart = baseline && attempts.length > 0 ? summary.averageScore - baseline.averageScore : null;

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <Text style={styles.headline}>Progress</Text>

      {attempts.length === 0 ? (
        <EmptyState
          icon="trending-up-outline"
          title="Nothing to show yet"
          message="Practice an ayah and your progress will start showing up here."
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.statsRow}>
            <ProgressCard value={`${summary.streakDays}`} label="Day streak" />
            <ProgressCard value={`${summary.totalMinutesPracticed}`} label="Minutes" />
            <ProgressCard value={`${summary.ayatPracticed}`} label="Ayat practiced" />
            <ProgressCard value={`${summary.ayatMastered}`} label="Ayat mastered" />
          </View>

          <View style={styles.scoreCard}>
            <View style={styles.scoreHeaderRow}>
              <Text style={styles.scoreLabel}>Average score</Text>
              <Text style={styles.scoreValue}>{summary.averageScore}</Text>
            </View>
            <TrendSparkline history={summary.scoreHistory} />
            {summary.monthChangePercent !== 0 ? (
              <Text style={styles.scoreNote}>
                {formatSignedPercent(summary.monthChangePercent)} compared to the month before.
              </Text>
            ) : null}
            {sinceStart !== null ? (
              <Text style={styles.scoreNote}>
                {sinceStart >= 0 ? `${Math.round(sinceStart)} points above` : `${Math.round(-sinceStart)} points below`}{' '}
                your starting score of {baseline?.averageScore}.
              </Text>
            ) : null}
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headline: {
    ...Typography.title1,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  scroll: {
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  scoreCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  scoreHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreLabel: {
    ...Typography.bodyEmphasis,
    color: Colors.text,
  },
  scoreValue: {
    ...Typography.bodyEmphasis,
    color: Colors.primary,
  },
  scoreNote: {
    ...Typography.footnote,
    color: Colors.secondaryText,
  },
});
