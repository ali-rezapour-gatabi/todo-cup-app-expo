import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { useTodoStore } from '@/stores/useTodoStore';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const storeTheme = useTodoStore((state) => state.theme);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();
  const resolvedTheme = storeTheme === 'system' ? colorScheme : storeTheme;

  if (hasHydrated) {
    return resolvedTheme ?? 'light';
  }

  return 'light';
}
