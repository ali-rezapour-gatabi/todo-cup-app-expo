import React from 'react';
import { Pressable, StyleSheet, TextStyle, View, type PressableProps, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type ButtonProps = PressableProps & {
  title: any;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  icon?: React.ReactNode;
};

export function Button({ title, variant = 'primary', fullWidth = false, icon, disabled, style, ...pressableProps }: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const variantStyle = getVariantStyles(variant, palette);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => {
        const resolvedStyle =
          typeof style === 'function'
            ? style({
                pressed,
                hovered: false,
              })
            : style;

        return [
          styles.base,
          variantStyle.container,
          fullWidth && styles.fullWidth,
          pressed && styles.pressed,
          disabled && styles.disabled,
          disabled && variantStyle.disabled,
          resolvedStyle,
        ];
      }}
      {...pressableProps}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <ThemedText style={[styles.label, variantStyle.label]} weight="bold">
        {title}
      </ThemedText>
    </Pressable>
  );
}

type Palette = (typeof Colors)['light'];

function getVariantStyles(variant: ButtonVariant, palette: Palette) {
  const destructive = palette.tint === '#fff' ? '#ff6b6b' : '#d64545';

  const stylesByVariant: Record<
    ButtonVariant,
    {
      container: ViewStyle;
      label: TextStyle;
      disabled?: ViewStyle;
    }
  > = {
    primary: {
      container: {
        backgroundColor: palette.tint,
        borderColor: palette.tint,
        borderWidth: 1,
      },
      label: { color: palette.background },
      disabled: { backgroundColor: palette.icon, borderColor: palette.icon },
    },
    secondary: {
      container: {
        backgroundColor: palette.background,
        borderColor: palette.icon,
        borderWidth: 1,
      },
      label: { color: palette.text },
      disabled: { borderColor: palette.icon, opacity: 0.8 },
    },
    ghost: {
      container: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      },
      label: { color: palette.tint },
      disabled: { opacity: 0.5 },
    },
    destructive: {
      container: {
        backgroundColor: destructive,
        borderColor: destructive,
        borderWidth: 1,
      },
      label: { color: palette.background },
      disabled: { opacity: 0.7, backgroundColor: '#8a2c2c', borderColor: '#8a2c2c' },
    },
  };

  return stylesByVariant[variant];
}

const styles = StyleSheet.create({
  base: {
    minHeight: 38,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.6,
  },
  label: {},
  icon: {
    marginLeft: 6,
  },
});
