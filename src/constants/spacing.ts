export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const HitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

export type SpacingToken = keyof typeof Spacing;
export type RadiusToken = keyof typeof Radius;
