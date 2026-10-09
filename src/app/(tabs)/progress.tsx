import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { TrendSparkline } from '@/components/charts';
import { EmptyState, ProgressCard, ScreenContainer, SectionHeader } from '@/components/ui';
import { Colors, Radius, Spacing, Typography } from '@/constants';
import { progressService } from '@/services/progress';
import { useAppStore } from '@/stores/useAppStore';
import { formatSignedPercent } from '@/utils/format';
import { summarizeVoiceDiscovery } from '@/utils/voiceProfile';

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export default function ProgressScreen() {
  const attempts = useAppStore((state) => state.attempts);
  const voiceDiscoveryAnalyses = useAppStore((state) => state.voiceDiscoveryAnalyses);
  const summary = progressService.summarize(attempts);

  const baseline = voiceDiscoveryAnalyses.length > 0 ? summarizeVoiceDiscovery(voiceDiscoveryAnalyses) : null;
  const sinceStart =
    baseline && attempts.length > 0
      ? {
          pronunciation: mean(attempts.map((a) => a.analysis.correctness.pronunciation)) - baseline.correctness.pronunciation,
          tajweed: mean(attempts.map((a) => a.analysis.correctness.tajweed)) - baseline.correctness.tajweed,
        }
      : null;

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

          {sinceStart ? (
            <View style={styles.baselineCard}>
              <SectionHeader title="Since your starting point" subtitle="Compared to your first recordings" />
              <View style={styles.baselineRow}>
                <DeltaStat label="Pronunciation" value={sinceStart.pronunciation} />
                <DeltaStat label="Tajweed" value={sinceStart.tajweed} />
              </View>
            </View>
          ) : null}

          <View style={styles.calloutRow}>
            <View style={styles.callout}>
              <Text style={styles.calloutLabel}>Strongest skill</Text>
              <Text style={styles.calloutValue}>
                {summary.skills.find((s) => s.skill === summary.strongestSkill)?.label}
              </Text>
            </View>
            <View style={styles.callout}>
              <Text style={styles.calloutLabel}>Current focus</Text>
              <Text style={styles.calloutValue}>
                {summary.skills.find((s) => s.skill === summary.currentFocus)?.label}
              </Text>
            </View>
          </View>

          <SectionHeader title="Skill progression" />
          <View style={styles.skillList}>
            {summary.skills.map((skill) => (
              <View key={skill.skill} style={styles.skillCard}>
                <View style={styles.skillHeaderRow}>
                  <Text style={styles.skillLabel}>{skill.label}</Text>
                  <Text style={styles.skillScore}>{skill.current}</Text>
                </View>
                <TrendSparkline history={skill.history} />
                {skill.monthChangePercent !== 0 ? (
                  <Text style={styles.skillChange}>
                    Your {skill.label.toLowerCase()} improved {formatSignedPercent(skill.monthChangePercent)} this
                    month.
                  </Text>
                ) : null}
              </View>
            ))}
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
  calloutRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  callout: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 2,
  },
  calloutLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  calloutValue: {
    ...Typography.bodyEmphasis,
    color: Colors.primary,
  },
  skillList: {
    gap: Spacing.sm,
  },
  skillCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  skillHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skillLabel: {
    ...Typography.bodyEmphasis,
    color: Colors.text,
  },
  skillScore: {
    ...Typography.bodyEmphasis,
    color: Colors.primary,
  },
  skillChange: {
    ...Typography.footnote,
    color: Colors.secondaryText,
  },
  baselineCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  baselineRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
