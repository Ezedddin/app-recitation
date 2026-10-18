import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer, SectionHeader } from '@/components/ui';
import { Colors, Radius, Spacing, Typography } from '@/constants';
import { useAsync } from '@/hooks/useAsync';
import { reciterService } from '@/services/reciters';
import { useAppStore } from '@/stores/useAppStore';

const SETTINGS_ROWS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'text-outline', label: 'Arabic text settings' },
  { icon: 'volume-medium-outline', label: 'Audio settings' },
  { icon: 'speedometer-outline', label: 'Playback speed' },
  { icon: 'notifications-outline', label: 'Notifications' },
  { icon: 'sparkles-outline', label: 'Subscription' },
  { icon: 'person-circle-outline', label: 'Account' },
];

const LEGAL_ROWS = [
  { icon: 'shield-checkmark-outline', label: 'Privacy Policy', document: 'privacy' },
  { icon: 'document-text-outline', label: 'Terms of Use', document: 'terms' },
] as const;

export default function ProfileScreen() {
  const selectedReciterId = useAppStore((state) => state.selectedReciterId);
  const { data: reciter } = useAsync(
    () => (selectedReciterId ? reciterService.getById(selectedReciterId) : Promise.resolve(undefined)),
    [selectedReciterId],
  );

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <Text style={styles.headline}>Profile</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={28} color={Colors.primaryDark} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.name}>Your recitation journey</Text>
          <Text style={styles.detail}>Training goal: Improve pronunciation</Text>
          <Text style={styles.detail}>Daily practice goal: 10 minutes</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change reciter"
        onPress={() => router.push('/onboarding/choose-reciter')}
        style={styles.reciterRow}>
        <View style={styles.reciterInfo}>
          <Text style={styles.reciterLabel}>Learning from</Text>
          <Text style={styles.reciterName}>{reciter?.name}</Text>
        </View>
        <Text style={styles.changeLabel}>Change</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Your Voice"
        onPress={() => router.push('/onboarding/voice-results')}
        style={styles.reciterRow}>
        <View style={styles.reciterInfo}>
          <Text style={styles.reciterLabel}>Your natural strengths and style</Text>
          <Text style={styles.reciterName}>Your Voice</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.secondaryText} />
      </Pressable>

      <SectionHeader title="Settings" />
      <View style={styles.settingsList}>
        {SETTINGS_ROWS.map((row) => (
          <View key={row.label} style={styles.settingsRow}>
            <Ionicons name={row.icon} size={18} color={Colors.secondaryText} />
            <Text style={styles.settingsLabel}>{row.label}</Text>
            <Text style={styles.comingSoon}>Coming soon</Text>
          </View>
        ))}
      </View>

      <View style={[styles.settingsList, styles.legalList]}>
        {LEGAL_ROWS.map((row) => (
          <Pressable
            key={row.document}
            accessibilityRole="link"
            accessibilityLabel={row.label}
            onPress={() => router.push({ pathname: '/legal/[document]', params: { document: row.document } })}
            style={styles.settingsRow}>
            <Ionicons name={row.icon} size={18} color={Colors.secondaryText} />
            <Text style={styles.settingsLabel}>{row.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.secondaryText} />
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headline: {
    ...Typography.title1,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.sageMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Typography.bodyEmphasis,
    color: Colors.text,
  },
  detail: {
    ...Typography.footnote,
    color: Colors.secondaryText,
  },
  reciterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  reciterInfo: {
    flex: 1,
    gap: 2,
  },
  reciterLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  reciterName: {
    ...Typography.bodyEmphasis,
    color: Colors.text,
  },
  changeLabel: {
    ...Typography.subhead,
    color: Colors.primary,
  },
  settingsList: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  legalList: {
    marginTop: Spacing.lg,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  settingsLabel: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  comingSoon: {
    ...Typography.caption,
    color: Colors.tertiaryText,
  },
});
