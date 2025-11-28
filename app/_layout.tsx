import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager, useColorScheme as useSystemColorScheme } from 'react-native';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import 'react-native-gesture-handler';

import { vazirmatnFamilies } from '@/constants/fonts';
import { ToastProvider } from '@/components/ui/toast';
import { useTodoStore } from '@/stores/useTodoStore';
import { useAppInit } from '@/hooks/useAppInit';

export const unstable_settings = {
  anchor: '(tabs)',
};

void SplashScreen.preventAutoHideAsync();

const vazirmatnSources = {
  [vazirmatnFamilies.thin]: require('../assets/fonts/Vazirmatn-Thin.ttf'),
  [vazirmatnFamilies.extraLight]: require('../assets/fonts/Vazirmatn-ExtraLight.ttf'),
  [vazirmatnFamilies.light]: require('../assets/fonts/Vazirmatn-Light.ttf'),
  [vazirmatnFamilies.regular]: require('../assets/fonts/Vazirmatn-Regular.ttf'),
  [vazirmatnFamilies.medium]: require('../assets/fonts/Vazirmatn-Medium.ttf'),
  [vazirmatnFamilies.semiBold]: require('../assets/fonts/Vazirmatn-SemiBold.ttf'),
  [vazirmatnFamilies.bold]: require('../assets/fonts/Vazirmatn-Bold.ttf'),
  [vazirmatnFamilies.extraBold]: require('../assets/fonts/Vazirmatn-ExtraBold.ttf'),
  [vazirmatnFamilies.black]: require('../assets/fonts/Vazirmatn-Black.ttf'),
  Vazirmatn: require('../assets/fonts/Vazirmatn-Regular.ttf'),
};

export default function RootLayout() {
  const storeTheme = useTodoStore((s) => s.theme);
  const systemTheme = useSystemColorScheme();
  const colorScheme = storeTheme === 'system' ? systemTheme : storeTheme;
  useAppInit();

  const [fontsLoaded, fontError] = useFonts(vazirmatnSources);

  useEffect(() => {
    I18nManager.allowRTL(true);
  }, []);

  useEffect(() => {
    if (fontError) {
      throw fontError;
    }
  }, [fontError]);

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }

    void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ToastProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </ToastProvider>
  );
}
