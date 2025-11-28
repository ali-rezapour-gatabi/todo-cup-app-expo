import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useTodoStore } from '@/stores/useTodoStore';

export function useColorScheme() {
  const storeTheme = useTodoStore((state) => state.theme);
  const systemTheme = useSystemColorScheme();

  const resolvedTheme = storeTheme === 'system' ? systemTheme : storeTheme;

  return resolvedTheme ?? 'light';
}
