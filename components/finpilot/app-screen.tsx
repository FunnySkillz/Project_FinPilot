import { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { FinPilotColors } from '@/constants/finpilot';

type AppScreenProps = PropsWithChildren<{
  scroll?: boolean;
}>;

export function AppScreen({ children, scroll = true }: AppScreenProps) {
  if (!scroll) {
    return <SafeAreaView style={styles.safe}>{children}</SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Stack({ children, gap = 12 }: PropsWithChildren<{ gap?: number }>) {
  return <View style={{ gap }}>{children}</View>;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: FinPilotColors.background,
  },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 110,
  },
});

