import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { Colors, Spacing, Typography } from '@/constants';
import type { PitchCue, PitchPoint, WordAnalysis } from '@/types';

interface PitchGraphProps {
  referenceContour: PitchPoint[];
  userContour: PitchPoint[];
  words: WordAnalysis[];
  height?: number;
}

const CUE_GLYPH: Record<PitchCue, string> = {
  raise: '↑',
  lower: '↓',
  hold: '→',
  graduallyRaise: '↗',
  graduallyLower: '↘',
};

function toViewBoxPoints(points: PitchPoint[], totalDuration: number): string {
  return points
    .map((point) => {
      const x = totalDuration > 0 ? (point.timestamp / totalDuration) * 100 : 0;
      const y = 50 - point.normalizedPitch * 40;
      return `${x.toFixed(2)},${Math.max(4, Math.min(96, y)).toFixed(2)}`;
    })
    .join(' ');
}

/**
 * Pitch is shown relative (-1..1), never as absolute Hz — the real backend
 * normalizes to the user's own vocal range. Understandable via shape +
 * arrows, not numbers: no axis values are rendered.
 */
export function PitchGraph({ referenceContour, userContour, words, height = 200 }: PitchGraphProps) {
  const totalDuration = Math.max(
    referenceContour.at(-1)?.timestamp ?? 0,
    userContour.at(-1)?.timestamp ?? 0,
    words.at(-1)?.endTime ?? 1,
  );

  return (
    <View style={styles.container}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.sage }]} />
          <Text style={styles.legendText}>REFERENCE</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>YOU</Text>
        </View>
      </View>

      <View style={[styles.chartArea, { height }]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Polyline
            points={toViewBoxPoints(referenceContour, totalDuration)}
            fill="none"
            stroke={Colors.sage}
            strokeWidth={1.6}
            strokeDasharray="3,2"
            vectorEffect="non-scaling-stroke"
          />
          <Polyline
            points={toViewBoxPoints(userContour, totalDuration)}
            fill="none"
            stroke={Colors.primary}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        </Svg>

        {words.map((word) => {
          if (!word.pitchCue) return null;
          const midpoint = (word.startTime + word.endTime) / 2;
          const leftPercent = totalDuration > 0 ? (midpoint / totalDuration) * 100 : 0;
          return (
            <Text
              key={`cue-${word.index}`}
              style={[styles.cueGlyph, { left: `${leftPercent}%` }]}
              accessibilityLabel={`${word.arabicText}: ${word.pitchCue}`}>
              {CUE_GLYPH[word.pitchCue]}
            </Text>
          );
        })}
      </View>

      <View style={styles.wordsRow}>
        {words.map((word) => {
          const midpoint = (word.startTime + word.endTime) / 2;
          const leftPercent = totalDuration > 0 ? (midpoint / totalDuration) * 100 : 0;
          return (
            <Text key={word.index} style={[styles.wordLabel, { left: `${leftPercent}%` }]} numberOfLines={1}>
              {word.arabicText}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...Typography.caption,
    color: Colors.secondaryText,
    letterSpacing: 0.5,
  },
  chartArea: {
    position: 'relative',
  },
  cueGlyph: {
    position: 'absolute',
    top: 0,
    transform: [{ translateX: -8 }],
    ...Typography.headline,
    color: Colors.goldAccent,
  },
  wordsRow: {
    height: 28,
    position: 'relative',
  },
  wordLabel: {
    position: 'absolute',
    transform: [{ translateX: -20 }],
    width: 40,
    textAlign: 'center',
    ...Typography.footnote,
    color: Colors.text,
  },
});
