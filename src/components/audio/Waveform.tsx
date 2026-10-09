import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Colors, Radius } from '@/constants';

interface WaveformProps {
  /** Decorative only — this is not derived from real audio samples. */
  isActive?: boolean;
  barCount?: number;
  color?: string;
  height?: number;
}

export function Waveform({ isActive = false, barCount = 26, color = Colors.primary, height = 56 }: WaveformProps) {
  const [restingHeights] = useState(() => Array.from({ length: barCount }, () => 0.3 + Math.random() * 0.55));
  const [animatedValues] = useState(() => restingHeights.map((value) => new Animated.Value(value)));

  useEffect(() => {
    if (!isActive) {
      const settle = animatedValues.map((value, i) =>
        Animated.timing(value, { toValue: restingHeights[i], duration: 300, useNativeDriver: false }),
      );
      Animated.parallel(settle).start();
      return;
    }

    const loops = animatedValues.map((value) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 0.2 + Math.random() * 0.8,
            duration: 220 + Math.random() * 260,
            useNativeDriver: false,
          }),
          Animated.timing(value, {
            toValue: 0.2 + Math.random() * 0.8,
            duration: 220 + Math.random() * 260,
            useNativeDriver: false,
          }),
        ]),
      ),
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [isActive, animatedValues, restingHeights]);

  return (
    <View style={[styles.row, { height }]}>
      {animatedValues.map((value, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              height: value.interpolate({ inputRange: [0, 1], outputRange: ['18%', '100%'] }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bar: {
    width: 4,
    borderRadius: Radius.pill,
  },
});
