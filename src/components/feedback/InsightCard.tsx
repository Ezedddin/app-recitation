import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui';
import { Colors, Radius, Spacing, Typography } from '@/constants';

interface InsightCardProps {
  headline: string;
  detail?: string;
  ctaLabel?: string;
  onPressCta?: () => void;
}

export function InsightCard({ headline, detail, ctaLabel, onPressCta }: InsightCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Your coach noticed</Text>
      <Text style={styles.headline}>{headline}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      {ctaLabel && onPressCta ? <PrimaryButton label={ctaLabel} onPress={onPressCta} style={styles.cta} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: Colors.goldAccent,
  },
  eyebrow: {
    ...Typography.caption,
    color: Colors.goldAccent,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headline: {
    ...Typography.headline,
    color: Colors.text,
  },
  detail: {
    ...Typography.callout,
    color: Colors.secondaryText,
  },
  cta: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg,
  },
});
