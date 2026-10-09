import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

/**
 * Soft, low-contrast elevation that reads as "premium paper," not
 * Material-style drop shadows. Android falls back to `elevation`.
 */
function shadow(opacity: number, radius: number, elevation: number): ViewStyle {
  return Platform.select({
    android: { elevation },
    default: {
      shadowColor: '#3A3226',
      shadowOffset: { width: 0, height: elevation / 2 },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
  }) as ViewStyle;
}

export const Shadows = {
  none: {} as ViewStyle,
  card: shadow(0.06, 12, 3),
  raised: shadow(0.1, 20, 6),
  floating: shadow(0.16, 28, 10),
} as const;
