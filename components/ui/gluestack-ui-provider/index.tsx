import { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { getFinThemeVars } from '@/constants/finpilot';
import type { ThemeModeResolved } from '@/types/finpilot';

export function GluestackUIProvider({
  children,
  colorMode = 'light',
}: PropsWithChildren<{ colorMode?: ThemeModeResolved }>) {
  return (
    <View className="flex-1 bg-fin-background" style={getFinThemeVars(colorMode)}>
      {children}
    </View>
  );
}
