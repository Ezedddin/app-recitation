import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants';

/**
 * Caveats shown under a section heading. The "Letters" tips come from the AI
 * listening by ear, and in testing it gave confidently wrong letter advice
 * — so learners should treat them as suggestions to check against the
 * reciter, unlike the "Melody" tips, which are based on measured pitch.
 */
const SECTION_NOTES: Record<string, string> = {
  Letters: 'AI suggestion — this can be wrong. Always check it against the reciter.',
};

interface FeedbackTextProps {
  text: string;
}

/**
 * Renders the AI coach's feedback: blocks are separated by blank lines, and
 * a block whose first line is followed by "• " tips (e.g. "Melody",
 * "Letters") gets that first line as a heading.
 */
export function FeedbackText({ text }: FeedbackTextProps) {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        const [first, ...rest] = block.split('\n');
        const isSection = rest.length > 0 && rest.every((line) => line.trim().startsWith('•'));
        return (
          <View key={index} style={styles.block}>
            {isSection ? (
              <>
                <Text style={styles.heading}>{first}</Text>
                {rest.map((line, lineIndex) => (
                  <Text key={lineIndex} style={styles.tip}>
                    {line.trim()}
                  </Text>
                ))}
                {SECTION_NOTES[first] ? (
                  <View style={styles.note}>
                    <Ionicons name="information-circle-outline" size={14} color={Colors.goldAccent} />
                    <Text style={styles.noteText}>{SECTION_NOTES[first]}</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={styles.body}>{block}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  block: {
    gap: Spacing.xs,
  },
  heading: {
    ...Typography.bodyEmphasis,
    color: Colors.text,
  },
  body: {
    ...Typography.body,
    color: Colors.text,
  },
  tip: {
    ...Typography.callout,
    color: Colors.secondaryText,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    marginTop: Spacing.xxs,
  },
  noteText: {
    ...Typography.caption,
    color: Colors.tertiaryText,
    flex: 1,
  },
});
