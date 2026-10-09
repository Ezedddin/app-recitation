import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function SecondaryButton({ label, onPress, disabled, style }: SecondaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    backgroundColor: 'transparent',
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  pressed: {
    backgroundColor: Colors.sageMuted,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...Typography.bodyEmphasis,
    color: Colors.primary,
  },
});
