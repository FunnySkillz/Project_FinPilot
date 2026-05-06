import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme as useNativeColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import '@/global.css';

import { AppLockGate } from '@/components/finpilot/app-lock-gate';
import { AppScreen, Stack as VStack } from '@/components/finpilot/app-screen';
import { Card } from '@/components/finpilot/card';
import { Button } from '@/components/finpilot/controls';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { getFinTheme } from '@/constants/finpilot';
import { AppLockProvider, useAppLock } from '@/context/app-lock-context';
import { FinPilotProvider, useFinPilot } from '@/context/finpilot-context';
import { LanguageProvider, useLanguage } from '@/context/language-context';
import { resolveThemeMode, ThemeModeProvider } from '@/context/theme-mode-context';
import type { ThemeModeResolved } from '@/types/finpilot';

export const unstable_settings = {
  anchor: '(tabs)',
};

function LoadingShell() {
  return (
    <AppScreen>
      <Card>
        <Muted>FinPilot</Muted>
      </Card>
    </AppScreen>
  );
}

function InitErrorShell() {
  const { retryLoad } = useFinPilot();
  const { t } = useLanguage();

  return (
    <AppScreen>
      <Card>
        <VStack>
          <H1>{t('shell.initError')}</H1>
          <Body>{t('settings.data.note')}</Body>
          <Button onPress={retryLoad}>{t('common.retry')}</Button>
        </VStack>
      </Card>
    </AppScreen>
  );
}

function ShellGate({ resolvedMode }: { resolvedMode: ThemeModeResolved }) {
  const segments = useSegments();
  const { state, isLoading, error } = useFinPilot();
  const { t } = useLanguage();
  const appLock = useAppLock();
  const theme = getFinTheme(resolvedMode);
  const inOnboarding = segments[0] === '(onboarding)';

  if (isLoading) {
    return <LoadingShell />;
  }

  if (error) {
    return <InitErrorShell />;
  }

  if (!state.settings.hasCompletedOnboarding && !inOnboarding) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  if (state.settings.hasCompletedOnboarding && inOnboarding) {
    return <Redirect href="/(tabs)" />;
  }

  if (state.settings.appLockEnabled && !appLock.isUnlocked && state.settings.hasCompletedOnboarding) {
    return <AppLockGate />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        gestureEnabled: true,
      }}>
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="document/[id]"
        options={{
          headerShown: true,
          title: t('navigation.stack.documentDetail'),
          presentation: 'card',
        }}
      />
    </Stack>
  );
}

function ShellProviders() {
  const { state } = useFinPilot();
  const nativeScheme = useNativeColorScheme();
  const systemMode: ThemeModeResolved = nativeScheme === 'dark' ? 'dark' : 'light';
  const resolvedMode = resolveThemeMode(state.settings.themeMode, systemMode);
  const theme = getFinTheme(resolvedMode);
  const navigationTheme = {
    ...(resolvedMode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(resolvedMode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.background,
      card: theme.background,
      text: theme.text,
      border: theme.border,
      primary: theme.primary,
    },
  };

  return (
    <LanguageProvider>
      <ThemeModeProvider>
        <ThemeProvider value={navigationTheme}>
          <GluestackUIProvider colorMode={resolvedMode}>
            <AppLockProvider>
              <ShellGate resolvedMode={resolvedMode} />
              <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
            </AppLockProvider>
          </GluestackUIProvider>
        </ThemeProvider>
      </ThemeModeProvider>
    </LanguageProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FinPilotProvider>
        <ShellProviders />
      </FinPilotProvider>
    </SafeAreaProvider>
  );
}
