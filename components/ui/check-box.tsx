import React from 'react';
import { Pressable } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { MotiView } from 'moti';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type CheckboxProps = {
  value?: boolean;
  checked?: boolean;
  onChange?: (next: boolean) => void;
};

const CheckIcon = ({ color }: { color: string }) => (
  <Svg width="16" height="12" viewBox="0 0 16 12" fill="none">
    <Path d="M1 6L5.5 10.5L15 1.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const Checkbox = ({ value, checked, onChange }: CheckboxProps) => {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const isChecked = checked ?? value ?? false;

  return (
    <Pressable hitSlop={10} accessibilityRole="checkbox" accessibilityState={{ checked: isChecked }} onPress={() => onChange?.(!isChecked)}>
      <MotiView
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: isChecked ? palette.tint : palette.border,
          backgroundColor: isChecked ? palette.tint : 'transparent',
        }}
        from={{ scale: 0.9, opacity: 0 }}
        animate={{
          scale: isChecked ? 1 : 0.95,
          opacity: 1,
          backgroundColor: isChecked ? palette.tint : 'transparent',
          borderColor: isChecked ? palette.tint : palette.border,
        }}
        transition={{
          type: 'timing',
          duration: 200,
        }}
      >
        {isChecked ? (
          <MotiView from={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'timing', duration: 200 }}>
            <CheckIcon color={palette.tint} />
          </MotiView>
        ) : null}
      </MotiView>
    </Pressable>
  );
};
