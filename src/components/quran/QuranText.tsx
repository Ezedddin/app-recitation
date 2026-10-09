import { StyleSheet, Text, type TextStyle } from 'react-native';

import { ArabicType, Colors } from '@/constants';

type QuranTextSize = 'display' | 'large' | 'medium' | 'word';

interface QuranTextProps {
  children: string;
  size?: QuranTextSize;
  color?: string;
  style?: TextStyle;
}

/** Reusable Quran Arabic text block — large, RTL, generous line height by default. */
export function QuranText({ children, size = 'large', color = Colors.text, style }: QuranTextProps) {
  const scale = ArabicType[size];
  return (
    <Text
      accessibilityLanguage="ar"
      style={[
        styles.base,
        { fontSize: scale.fontSize, lineHeight: scale.lineHeight, color, fontFamily: ArabicType.fontFamily },
        style,
      ]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
