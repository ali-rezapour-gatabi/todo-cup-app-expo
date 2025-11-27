import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { getVazirmatnFamily, type VazirmatnWeight } from '@/constants/fonts';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  weight?: VazirmatnWeight;
};

export function ThemedText({ style, lightColor, darkColor, type = 'default', weight, ...rest }: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const typeKey: NonNullable<ThemedTextProps['type']> = type ?? 'default';
  const variant = textVariants[typeKey];
  const resolvedWeight = weight ?? variant?.weight ?? 'regular';
  const textColor = variant?.color ?? color;

  return <Text style={[styles.base, variant?.style, { fontFamily: getVazirmatnFamily(resolvedWeight), color: textColor }, style]} {...rest} />;
}

type TextVariant = {
  style?: TextStyle;
  weight?: VazirmatnWeight;
  color?: string;
};

const textVariants: Record<NonNullable<ThemedTextProps['type']>, TextVariant> = {
  default: {
    style: { fontSize: 16, lineHeight: 24 },
    weight: 'regular',
  },
  defaultSemiBold: {
    style: { fontSize: 16, lineHeight: 24 },
    weight: 'semiBold',
  },
  title: {
    style: { fontSize: 32, lineHeight: 32 },
    weight: 'bold',
  },
  subtitle: {
    style: { fontSize: 20 },
    weight: 'bold',
  },
  link: {
    style: { lineHeight: 30, fontSize: 16 },
    weight: 'medium',
    color: '#0a7ea4',
  },
};

const styles = StyleSheet.create({
  base: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});
