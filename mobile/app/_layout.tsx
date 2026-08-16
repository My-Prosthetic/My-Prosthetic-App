import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import '@/translations/i18n';
import { ThemeProvider } from '@/context/ThemeContext';

//TODO usunąć pliki z fontami, których ostatecznie nie używamy

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Afacad-Regular': require('@/assets/fonts/Afacad/Afacad-Regular.ttf'),
    'Afacad-Medium': require('@/assets/fonts/Afacad/Afacad-Medium.ttf'),
    'Afacad-SemiBold': require('@/assets/fonts/Afacad/Afacad-SemiBold.ttf'),
    'Afacad-Bold': require('@/assets/fonts/Afacad/Afacad-Bold.ttf'),

    'Inter-Regular': require('@/assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Medium': require('@/assets/fonts/Inter/Inter_18pt-Medium.ttf'),
    'Inter-SemiBold': require('@/assets/fonts/Inter/Inter_18pt-SemiBold.ttf'),
    'Inter-Bold': require('@/assets/fonts/Inter/Inter_18pt-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}