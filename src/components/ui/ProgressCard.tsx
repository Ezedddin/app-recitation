import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants';

interface ProgressCardProps {
  value: string;
  label: string;
}

export function ProgressCard({ value, label }: ProgressCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    ...Typography.title1,
    color: Colors.primary,
  },
  label: {
    ...Typography.caption,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
});
