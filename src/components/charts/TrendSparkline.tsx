import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { Colors } from '@/constants';
import type { SkillHistoryPoint } from '@/types';

interface TrendSparklineProps {
  history: SkillHistoryPoint[];
  color?: string;
  height?: number;
}

export function TrendSparkline({ history, color = Colors.primary, height = 40 }: TrendSparklineProps) {
  if (history.length < 2) {
    return <View style={[styles.empty, { height }]} />;
  }

  const values = history.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = history
    .map((point, index) => {
      const x = (index / (history.length - 1)) * 100;
      const y = 90 - ((point.value - min) / range) * 80;
      return `${x},${y}`;
    })
    .join(' ');

  const lastX = 100;
  const lastY = 90 - ((values.at(-1)! - min) / range) * 80;

  return (
    <Svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none" style={styles.svg}>
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
      <Circle cx={lastX - 2} cy={lastY} r={3} fill={color} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  svg: {
    overflow: 'visible',
  },
  empty: {
    justifyContent: 'center',
  },
});
