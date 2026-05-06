import { createContext, PropsWithChildren, useContext, useMemo } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

import { useFinPilot } from '@/context/finpilot-context';
import { themePreferenceService } from '@/services/theme-preference';
import type { ThemeMode, ThemeModeResolved } from '@/types/finpilot';

type ThemeModeContextValue = {
  mode: ThemeMode;
  resolvedMode: ThemeModeResolved;
  setMode: (next: ThemeMode) => Promise<void>;
};

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

export function resolveThemeMode(mode: ThemeMode, systemMode: ThemeModeResolved): ThemeModeResolved {
  return mode === 'system' ? systemMode : mode;
}

export function ThemeModeProvider({ children }: PropsWithChildren) {
  const { state, updateSettings } = useFinPilot();
  const nativeScheme = useNativeColorScheme();
  const systemMode: ThemeModeResolved = nativeScheme === 'dark' ? 'dark' : 'light';
  const mode = state.settings.themeMode;
  const resolvedMode = resolveThemeMode(mode, systemMode);

  const value = useMemo<ThemeModeContextValue>(
    () => ({
      mode,
      resolvedMode,
      setMode: async (next) => {
        themePreferenceService.save(next);
        await updateSettings({ themeMode: next });
      },
    }),
    [mode, resolvedMode, updateSettings],
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);

  if (!context) {
    throw new Error('useThemeMode must be used inside ThemeModeProvider');
  }

  return context;
}
