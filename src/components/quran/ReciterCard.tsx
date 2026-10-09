import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants';
import type { Reciter } from '@/types';

interface ReciterCardProps {
  reciter: Reciter;
  selected?: boolean;
  isPreviewPlaying?: boolean;
  onSelect: () => void;
  onPreviewPress: () => void;
}

function initialsFor(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function ReciterCard({ reciter, selected, isPreviewPlaying, onSelect, onPreviewPress }: ReciterCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${reciter.name}, ${reciter.style}${selected ? ', selected' : ''}`}
      onPress={onSelect}
      style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.cardPressed]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initialsFor(reciter.name)}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{reciter.name}</Text>
        <Text style={styles.style} numberOfLines={1}>
          {reciter.style}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isPreviewPlaying ? `Pause preview of ${reciter.name}` : `Play preview of ${reciter.name}`}
        hitSlop={8}
        onPress={(event) => {
          event.stopPropagation();
          onPreviewPress();
        }}
        style={styles.previewButton}>
        <Ionicons name={isPreviewPlaying ? 'pause' : 'play'} size={16} color={Colors.primary} />
      </Pressable>

      {selected ? (
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark" size={12} color={Colors.onPrimary} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: Colors.primary,
  },
  cardPressed: {
    opacity: 0.9,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.sageMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.headline,
    color: Colors.primaryDark,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Typography.bodyEmphasis,
    color: Colors.text,
  },
  style: {
    ...Typography.footnote,
    color: Colors.secondaryText,
  },
  previewButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
});
