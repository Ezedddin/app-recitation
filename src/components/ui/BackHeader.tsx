import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants';

interface BackHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

/**
 * Falls back to the Home tab when there's no screen to go back to — a deep
 * link (or a dev-tool navigation) can land here with an empty stack, and
 * `router.back()` alone would then be a dead button.
 */
function goBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)');
  }
}

export function BackHeader({ title, subtitle, onBack }: BackHeaderProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack ?? goBack}
        hitSlop={8}
        style={styles.backButton}>
        <Ionicons name="chevron-back" size={22} color={Colors.text} />
      </Pressable>
      <View style={styles.textGroup}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  textGroup: {
    flex: 1,
  },
  title: {
    ...Typography.headline,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.footnote,
    color: Colors.secondaryText,
  },
});
