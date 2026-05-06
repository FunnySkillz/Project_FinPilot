import { PropsWithChildren } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { VStack } from '@/components/ui/gluestack';

type AppScreenProps = PropsWithChildren<{
  scroll?: boolean;
  nativeHeader?: boolean;
}>;

export function AppScreen({ children, scroll = true, nativeHeader = false }: AppScreenProps) {
  const edges: Edge[] = nativeHeader ? ['bottom'] : ['top', 'bottom'];

  if (!scroll) {
    return (
      <SafeAreaView edges={edges} className="flex-1 bg-fin-background">
        {children}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={edges} className="flex-1 bg-fin-background">
      <ScrollView
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerClassName="w-full max-w-[860px] self-center gap-4 p-4 pb-28"
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Stack({ children, gap = 12 }: PropsWithChildren<{ gap?: number }>) {
  return <VStack style={{ gap }}>{children}</VStack>;
}
