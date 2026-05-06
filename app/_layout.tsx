import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '@/global.css';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { FinPilotProvider } from '@/context/finpilot-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GluestackUIProvider>
        <FinPilotProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="document/[id]" options={{ title: 'Document Detail' }} />
          </Stack>
          <StatusBar style="dark" />
        </FinPilotProvider>
      </GluestackUIProvider>
    </ThemeProvider>
  );
}
