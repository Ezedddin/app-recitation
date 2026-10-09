import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants';

interface SkillScoreProps {
  label: string;
  score: number;
  accentColor?: string;
}

export function SkillScore({ label, score, accentColor = Colors.primary }: SkillScoreProps) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.score}>{Math.round(clamped)}</Text>
      </View>
      <View
        style={styles.track}
        accessible
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}>
        <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: accentColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.xxs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    ...Typography.subhead,
    color: Colors.text,
  },
  score: {
    ...Typography.subhead,
    color: Colors.secondaryText,
  },
  track: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.sageMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
});
