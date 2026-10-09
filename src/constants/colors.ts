/**
 * Brand palette: sage green x warm beige x ivory.
 * Beige/ivory dominates the UI; green is reserved for CTAs, selected/active
 * states, progress, recording, and positive feedback. Gold is a subtle accent
 * only (dividers, highlights) — never a primary action color.
 *
 * Phase 1 ships a single warm/light theme by design (no dark mode yet) — the
 * product's identity is this specific palette, not an adaptive system one.
 */
export const Colors = {
  background: '#F5F0E6',
  surface: '#FFFCF5',
  surfaceRaised: '#FFFFFF',

  sage: '#A8C3A0',
  sageMuted: '#D9E4D5',
  primary: '#668466',
  primaryDark: '#4E6750',

  goldAccent: '#C5A96A',
  goldAccentMuted: '#E8DCC0',

  text: '#263229',
  secondaryText: '#70776F',
  tertiaryText: '#9CA39A',
  onPrimary: '#FFFCF5',

  border: '#E4DCC9',
  borderStrong: '#D3C8AC',
  divider: '#EAE3D3',

  overlay: 'rgba(38, 50, 41, 0.45)',

  /** Correctness/style feedback — success skews green, caution skews gold, never bright red. */
  feedbackExcellent: '#668466',
  feedbackGood: '#8BA684',
  feedbackNeedsWork: '#C5A96A',
  feedbackCaution: '#B9754C',

  recordingActive: '#668466',
  recordingPulse: 'rgba(102, 132, 102, 0.18)',
} as const;

export type ColorToken = keyof typeof Colors;
