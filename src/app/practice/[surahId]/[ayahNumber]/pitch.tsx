import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { PitchGraph } from '@/components/charts';
import { BackHeader, Card, ScreenContainer } from '@/components/ui';
import { Colors, Spacing, Typography } from '@/constants';
import { useAsync } from '@/hooks/useAsync';
import { quranService } from '@/services/quran';
import { useAppStore } from '@/stores/useAppStore';

export default function PitchComparisonScreen() {
  const { surahId, ayahNumber, attemptId } = useLocalSearchParams<{
    surahId: string;
    ayahNumber: string;
    attemptId: string;
  }>();
  const attempt = useAppStore((state) => state.attempts.find((a) => a.id === attemptId));
  const { data: surah } = useAsync(() => quranService.getSurah(surahId), [surahId]);

  if (!attempt) {
    return (
      <ScreenContainer>
        <BackHeader title="Pitch comparison" />
        <Text style={styles.missing}>We couldn&apos;t find this result.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <BackHeader title="Pitch comparison" subtitle={`${surah?.transliteratedName} · Ayah ${ayahNumber}`} />

        <Card>
          <PitchGraph
            referenceContour={attempt.analysis.referencePitchContour}
            userContour={attempt.analysis.userPitchContour}
            words={attempt.analysis.words}
          />
        </Card>

        <Text style={styles.helper}>
          The graph shows how your pitch rises and falls relative to your own natural range — not exact musical notes.
          Follow the arrows: ↑ raise, ↓ lower, → hold, ↗ gradually raise, ↘ gradually lower.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  missing: {
    ...Typography.body,
    color: Colors.secondaryText,
    padding: Spacing.lg,
  },
  scroll: {
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  helper: {
    ...Typography.footnote,
    color: Colors.secondaryText,
  },
});
