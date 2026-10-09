import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { QuranText } from '@/components/quran';
import { Colors, Radius, Spacing, Typography } from '@/constants';
import type { WordAnalysis, WordStatus } from '@/types';

interface WordFeedbackProps {
  words: WordAnalysis[];
  onListenReference?: (word: WordAnalysis) => void;
  onListenSelf?: (word: WordAnalysis) => void;
  onListenSlowly?: (word: WordAnalysis) => void;
  onPracticeSection?: (word: WordAnalysis) => void;
}

const STATUS_LABEL: Record<WordStatus, string> = {
  excellent: 'Excellent',
  good: 'Good',
  needsWork: 'Needs work',
  practice: 'Practice',
};

const STATUS_COLOR: Record<WordStatus, string> = {
  excellent: Colors.feedbackExcellent,
  good: Colors.feedbackGood,
  needsWork: Colors.feedbackNeedsWork,
  practice: Colors.feedbackCaution,
};

export function WordFeedback({ words, onListenReference, onListenSelf, onListenSlowly, onPracticeSection }: WordFeedbackProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = selectedIndex !== null ? words.find((w) => w.index === selectedIndex) ?? null : null;

  return (
    <View style={styles.container}>
      <View style={styles.chipRow}>
        {words.map((word) => {
          const isSelected = word.index === selectedIndex;
          const color = STATUS_COLOR[word.status];
          return (
            <Pressable
              key={word.index}
              accessibilityRole="button"
              accessibilityLabel={`${word.arabicText}, ${STATUS_LABEL[word.status]}`}
              onPress={() => setSelectedIndex(isSelected ? null : word.index)}
              style={[styles.chip, isSelected && { borderColor: color }]}>
              <QuranText size="word" style={styles.chipWord}>
                {word.arabicText}
              </QuranText>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: color }]} />
                <Text style={[styles.statusLabel, { color }]}>{STATUS_LABEL[word.status]}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {selected ? (
        <View style={styles.detailPanel}>
          <QuranText size="medium">{selected.arabicText}</QuranText>
          <Text style={styles.feedbackText}>{selected.feedback}</Text>

          <View style={styles.actionsRow}>
            <DetailAction icon="musical-notes-outline" label="Reference" onPress={() => onListenReference?.(selected)} />
            <DetailAction icon="person-outline" label="Yourself" onPress={() => onListenSelf?.(selected)} />
            <DetailAction icon="hourglass-outline" label="Slowly" onPress={() => onListenSlowly?.(selected)} />
            <DetailAction icon="repeat-outline" label="Practice" onPress={() => onPracticeSection?.(selected)} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function DetailAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.action}>
      <Ionicons name={icon} size={18} color={Colors.primary} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  chipRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 4,
    minWidth: 72,
  },
  chipWord: {
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    ...Typography.caption,
  },
  detailPanel: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  feedbackText: {
    ...Typography.body,
    color: Colors.secondaryText,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  action: {
    alignItems: 'center',
    gap: 4,
  },
  actionLabel: {
    ...Typography.caption,
    color: Colors.text,
  },
});
