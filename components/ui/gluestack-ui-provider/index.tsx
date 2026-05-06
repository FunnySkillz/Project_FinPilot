import { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { finThemeVars } from '@/constants/finpilot';

export function GluestackUIProvider({ children }: PropsWithChildren) {
  return (
    <View className="flex-1 bg-fin-background" style={finThemeVars}>
      {children}
    </View>
  );
}

