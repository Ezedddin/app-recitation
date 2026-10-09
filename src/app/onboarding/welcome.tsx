import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Waveform } from '@/components/audio';
import { PrimaryButton, ScreenContainer } from '@/components/ui';
import { Colors, Spacing, Typography } from '@/constants';

export default function WelcomeScreen() {
  return (
    <ScreenContainer>
      <View style={styles.body}>
        <View style={styles.waveformWrap}>
          <Waveform isActive barCount={34} height={90} color={Colors.sage} />
        </View>

        <View style={styles.textGroup}>
          <Text style={styles.headline}>Find the beauty in your recitation.</Text>
          <Text style={styles.subtitle}>
            Train your voice with AI and learn from the reciters who inspire you.
          </Text>
        </View>
      </View>

      <PrimaryButton label="Begin" onPress={() => router.push('/onboarding/discover-voice')} style={styles.cta} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.xxl,
  },
  waveformWrap: {
    paddingHorizontal: Spacing.md,
  },
  textGroup: {
    gap: Spacing.sm,
  },
  headline: {
    ...Typography.display,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  cta: {
    marginBottom: Spacing.lg,
  },
});
