import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackHeader, Card, FeedbackText, PrimaryButton, ScoreRing, ScreenContainer, SectionHeader } from '@/components/ui';
import { Colors, Spacing, Typography } from '@/constants';
import { useAppStore } from '@/stores/useAppStore';
import { summarizeVoiceDiscovery } from '@/utils/voiceProfile';

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

        <View style={styles.scoreWrap}>
          <ScoreRing score={summary.averageScore} label="Starting score" />
        </View>

        {summary.feedback.length > 0 ? (
          <Card style={styles.section}>
            <SectionHeader title="Feedback" />
            {summary.feedback.map((text, index) => (
              <View key={index} style={[styles.feedbackItem, index > 0 && styles.feedbackDivider]}>
                <Text style={styles.feedbackLabel}>Ayah {index + 1}</Text>
                <FeedbackText text={text} />
              </View>
            ))}
          </Card>
        ) : null}

        {onboardingCompleted ? (
          <Text style={styles.footerNote}>
            This is your baseline from onboarding — keep practicing and your Progress tab will show how far
            you&apos;ve come since then.
          </Text>
        ) : (
          <>
            <Text style={styles.footerNote}>
              Next, choose a reciter whose style you&apos;d like to learn — every recitation gets a score and
              feedback on how well you recited it, not just how closely you match them.
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
  scoreWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  section: {
    gap: Spacing.sm,
  },
  feedbackItem: {
    gap: Spacing.xs,
  },
  feedbackDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.md,
  },
  feedbackLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  footerNote: {
    ...Typography.footnote,
    color: Colors.secondaryText,
  },
  cta: {
    marginBottom: Spacing.lg,
  },
});
