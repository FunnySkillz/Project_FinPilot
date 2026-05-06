import { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView } from 'react-native';

import { VStack } from '@/components/ui/gluestack';

type AppScreenProps = PropsWithChildren<{
  scroll?: boolean;
}>;

export function AppScreen({ children, scroll = true }: AppScreenProps) {
  if (!scroll) {
    return <SafeAreaView className="flex-1 bg-fin-background">{children}</SafeAreaView>;
  }

  return (
    <SafeAreaView className="flex-1 bg-fin-background">
      <ScrollView contentContainerClassName="gap-4 p-4 pb-28" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Stack({ children, gap = 12 }: PropsWithChildren<{ gap?: number }>) {
  return <VStack style={{ gap }}>{children}</VStack>;
}
