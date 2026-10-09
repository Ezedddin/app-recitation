import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { getTrainingProgram } from '@/data';
import { BackHeader, ScreenContainer } from '@/components/ui';
import { Colors, Radius, Spacing, Typography } from '@/constants';
import { useAsync } from '@/hooks/useAsync';
import { reciterService } from '@/services/reciters';

export default function TrainingProgramScreen() {
  const { reciterId } = useLocalSearchParams<{ reciterId: string }>();
  const { data: reciter } = useAsync(() => reciterService.getById(reciterId), [reciterId]);
  const program = getTrainingProgram(reciterId);

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <BackHeader title={`Learn the style of ${reciter?.name ?? 'your reciter'}`} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.path}>
          {program.weeks.map((week, index) => (
            <View key={week.week} style={styles.weekRow}>
              <View style={styles.timeline}>
                <View style={styles.weekBadge}>
                  <Text style={styles.weekNumber}>{week.week}</Text>
                </View>
                {index < program.weeks.length - 1 ? <View style={styles.connector} /> : null}
              </View>

              <View style={styles.weekCard}>
                <Text style={styles.weekLabel}>Week {week.week}</Text>
                <Text style={styles.weekTitle}>{week.title}</Text>
                <Text style={styles.weekDescription}>{week.description}</Text>
                <View style={styles.tagRow}>
                  {['Explanation', 'Listening', 'Exercises', 'Quran practice', 'AI feedback'].map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: Spacing.xxl,
  },
  path: {
    marginTop: Spacing.sm,
  },
  weekRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  timeline: {
    alignItems: 'center',
  },
  weekBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNumber: {
    ...Typography.subhead,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  connector: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.sageMuted,
    marginVertical: 4,
  },
  weekCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 4,
  },
  weekLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
    textTransform: 'uppercase',
  },
  weekTitle: {
    ...Typography.headline,
    color: Colors.text,
  },
  weekDescription: {
    ...Typography.callout,
    color: Colors.secondaryText,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.xs,
  },
  tag: {
    backgroundColor: Colors.goldAccentMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  tagText: {
    ...Typography.caption,
    color: Colors.text,
  },
});
