import { Stack } from 'expo-router';

import { getFinTheme } from '@/constants/finpilot';
import { useLanguage } from '@/context/language-context';
import { useThemeMode } from '@/context/theme-mode-context';

export default function SettingsLayout() {
  const { t } = useLanguage();
  const { resolvedMode } = useThemeMode();
  const theme = getFinTheme(resolvedMode);

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        contentStyle: { backgroundColor: theme.background },
        gestureEnabled: true,
      }}>
      <Stack.Screen name="index" options={{ title: t('navigation.stack.settings') }} />
      <Stack.Screen name="appearance" options={{ title: t('navigation.stack.appearance') }} />
      <Stack.Screen name="language" options={{ title: t('navigation.stack.language') }} />
      <Stack.Screen name="security" options={{ title: t('navigation.stack.security') }} />
      <Stack.Screen name="legal" options={{ title: t('navigation.stack.legal') }} />
      <Stack.Screen name="data" options={{ title: t('navigation.stack.data') }} />
    </Stack>
  );
}

