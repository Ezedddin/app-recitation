import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { QuranText } from './QuranText';
import { Colors, Radius, Spacing, Typography } from '@/constants';
import type { Ayah } from '@/types';

interface AyahCardProps {
  ayah: Ayah;
  isPlayingReference?: boolean;
  bestScore?: number;
  onPlayReference: () => void;
  onPractice: () => void;
}

export function AyahCard({ ayah, isPlayingReference, bestScore, onPlayReference, onPractice }: AyahCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{ayah.number}</Text>
        </View>
        {typeof bestScore === 'number' ? (
          <View style={styles.progressBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
            <Text style={styles.progressText}>{Math.round(bestScore)}</Text>
          </View>
        ) : null}
      </View>

      <QuranText size="medium">{ayah.arabicText}</QuranText>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPlayingReference ? 'Pause reference audio' : `Play reference audio for ayah ${ayah.number}`}
          onPress={onPlayReference}
          hitSlop={8}
          style={styles.iconButton}>
          <Ionicons name={isPlayingReference ? 'pause' : 'play'} size={16} color={Colors.primary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Practice ayah ${ayah.number}`}
          onPress={onPractice}
          style={styles.practiceButton}>
          <Text style={styles.practiceLabel}>Practice</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.sageMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    ...Typography.caption,
    color: Colors.primaryDark,
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.primary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceButton: {
    flex: 1,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceLabel: {
    ...Typography.subhead,
    color: Colors.onPrimary,
    fontWeight: '600',
  },
});
