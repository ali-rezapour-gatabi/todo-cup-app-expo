
import { Platform } from 'react-native';

const primaryLight = '#3B82F6';
const primaryDark = '#60A5FA';

export const Colors = {
  light: {
    text: '#111827',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    tint: primaryLight,
    icon: '#6B7280',
    tabIconDefault: '#6B7280',
    tabIconSelected: primaryLight,
    border: '#E5E7EB',
    completedTask: '#D1D5DB',
  },
  dark: {
    text: '#F3F4F6',
    background: '#0F1115',
    surface: '#1A1C1F',
    tint: primaryDark,
    icon: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: primaryDark,
    border: '#2D2F33',
    completedTask: '#4B5563',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
