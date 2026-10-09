import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors, Radius, Shadows, Spacing } from '@/constants';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  raised?: boolean;
  accessibilityLabel?: string;
}

export function Card({ children, onPress, style, raised, accessibilityLabel }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [styles.base, raised && styles.raised, pressed && styles.pressed, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.base, raised && styles.raised, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  raised: {
    ...Shadows.raised,
  },
  pressed: {
    opacity: 0.85,
  },
});
