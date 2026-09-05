import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import '@/translations/i18n';
import { ThemeProvider } from '@/context/ThemeContext';
import { logFullDatabase } from '@/db/debug';

//TODO usunąć pliki z fontami, których ostatecznie nie używamy

SplashScreen.preventAutoHideAsync().catch( (error) => {
    console.warn('SplashScreen error:', error);
  }
);

export default function RootLayout() {

  useEffect(() => {
    if (__DEV__) {
      // Wypisze wszystkie tabele i wiersze w terminalu przy każdym odświeżeniu
      try {
        logFullDatabase();
      } catch (error) {
        console.error('Failed to log database contents:', error);
      }
    }
  }, []);

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
    SplashScreen.hideAsync().catch((error) => {
      console.error('Failed to hide splash screen:', error);
    });
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