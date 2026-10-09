import { Platform } from 'react-native';

/**
 * Latin type scale. iOS gets the system font (San Francisco); Android/web
 * fall back to their platform default rather than bundling a custom font in
 * phase 1.
 */
const latinFontFamily = Platform.select({ ios: undefined, default: undefined });

/**
 * Arabic Quran text needs a dedicated, generous scale — it must stay the
 * visually dominant element on practice/reading screens. `lineHeight` is
 * intentionally large to give diacritics (tashkeel) room to breathe.
 */
export const ArabicType = {
  fontFamily: Platform.select({ ios: 'Geeza Pro', android: undefined, default: undefined }),
  display: { fontSize: 34, lineHeight: 62 },
  large: { fontSize: 28, lineHeight: 52 },
  medium: { fontSize: 24, lineHeight: 46 },
  word: { fontSize: 22, lineHeight: 40 },
} as const;

export const Typography = {
  fontFamily: latinFontFamily,
  display: { fontSize: 30, lineHeight: 38, fontWeight: '700' as const },
  title1: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  title2: { fontSize: 20, lineHeight: 26, fontWeight: '600' as const },
  headline: { fontSize: 17, lineHeight: 23, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' as const },
  bodyEmphasis: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '400' as const },
  subhead: { fontSize: 14, lineHeight: 19, fontWeight: '500' as const },
  footnote: { fontSize: 13, lineHeight: 17, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 15, fontWeight: '500' as const },
  numeric: { fontSize: 32, lineHeight: 36, fontWeight: '700' as const },
} as const;

export type TypographyToken = keyof typeof Typography;
