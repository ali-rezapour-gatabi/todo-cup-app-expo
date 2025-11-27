export const vazirmatnFamilies = {
  thin: 'Vazirmatn-Thin',
  extraLight: 'Vazirmatn-ExtraLight',
  light: 'Vazirmatn-Light',
  regular: 'Vazirmatn-Regular',
  medium: 'Vazirmatn-Medium',
  semiBold: 'Vazirmatn-SemiBold',
  bold: 'Vazirmatn-Bold',
  extraBold: 'Vazirmatn-ExtraBold',
  black: 'Vazirmatn-Black',
} as const;

export type VazirmatnWeight = keyof typeof vazirmatnFamilies;

export const getVazirmatnFamily = (weight: VazirmatnWeight = 'regular') => vazirmatnFamilies[weight];
