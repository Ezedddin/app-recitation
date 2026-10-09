import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackHeader, Card, PrimaryButton, ScreenContainer, SectionHeader, SkillScore } from '@/components/ui';
import { Colors, Spacing, Typography } from '@/constants';
import { useAppStore } from '@/stores/useAppStore';
import { formatWordList, summarizeVoiceDiscovery } from '@/utils/voiceProfile';

export default function VoiceResultsScreen() {
  const analyses = useAppStore((state) => state.voiceDiscoveryAnalyses);
  const onboardingCompleted = useAppStore((state) => state.onboardingCompleted);

  if (analyses.length === 0) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        {onboardingCompleted ? <BackHeader title="Your Voice" /> : null}
        <View style={styles.missingWrap}>
          <Text style={styles.missing}>We don&apos;t have a recording to show yet.</Text>
          <PrimaryButton label="Record my voice" onPress={() => router.push('/onboarding/discover-voice')} />
        </View>
      </ScreenContainer>
    );
  }

  const summary = summarizeVoiceDiscovery(analyses);

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {onboardingCompleted ? (
          <BackHeader title="Your Voice" subtitle="From your first recordings" />
        ) : (
          <View style={styles.header}>
            <Text style={styles.headline}>Your natural voice</Text>
            <Text style={styles.subtitle}>
              Here&apos;s what we noticed — before you even pick a style to learn.
            </Text>
          </View>
        )}

        <Card style={styles.section}>
          <SectionHeader title="Correctness" subtitle="Pronunciation and Tajweed" />
          <SkillScore label="Pronunciation" score={summary.correctness.pronunciation} />
          <SkillScore label="Tajweed" score={summary.correctness.tajweed} />
        </Card>

        <Card style={styles.section}>
          <View style={styles.row}>
            <Ionicons name="sparkles-outline" size={18} color={Colors.primary} />
            <Text style={styles.rowText}>
              Your natural delivery leans <Text style={styles.emphasis}>{summary.naturalStyleLabel}</Text>.
            </Text>
          </View>

          {summary.strengths.length > 0 ? (
            <View style={styles.row}>
              <Ionicons name="star-outline" size={18} color={Colors.primary} />
              <Text style={styles.rowText}>
                You&apos;re already strong on {formatWordList(summary.strengths)}.
              </Text>
            </View>
          ) : null}

          {summary.growthAreas.length > 0 ? (
            <View style={styles.row}>
              <Ionicons name="trending-up-outline" size={18} color={Colors.goldAccent} />
              <Text style={styles.rowText}>Focus your practice on {formatWordList(summary.growthAreas)}.</Text>
            </View>
          ) : null}
        </Card>

        {onboardingCompleted ? (
          <Text style={styles.footerNote}>
            This is your baseline from onboarding — keep practicing and your Progress tab will show how far
            you&apos;ve come since then.
          </Text>
        ) : (
          <>
            <Text style={styles.footerNote}>
              Next, choose a reciter whose style you&apos;d like to learn — we&apos;ll keep coaching your own
              pronunciation and Tajweed the whole way, not just how closely you match them.
            </Text>
            <PrimaryButton
              label="Choose your reciter style"
              onPress={() => router.replace('/onboarding/choose-reciter')}
              style={styles.cta}
            />
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  missingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  missing: {
    ...Typography.body,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  scroll: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  header: {
    gap: Spacing.xxs,
  },
  headline: {
    ...Typography.title1,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.callout,
    color: Colors.secondaryText,
  },
  section: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  rowText: {
    ...Typography.callout,
    color: Colors.text,
    flex: 1,
  },
  emphasis: {
    fontWeight: '700',
    color: Colors.primary,
  },
  footerNote: {
    ...Typography.footnote,
    color: Colors.secondaryText,
  },
  cta: {
    marginBottom: Spacing.lg,
  },
});
