import { Tabs } from 'expo-router';
import {
  CircleHelp,
  FileText,
  Gauge,
  ReceiptText,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { getFinTheme } from '@/constants/finpilot';
import { useLanguage } from '@/context/language-context';
import { useThemeMode } from '@/context/theme-mode-context';

function TabIcon({ icon: Icon, color }: { icon: LucideIcon; color: string }) {
  return <Icon size={22} color={color} strokeWidth={2.3} />;
}

export default function TabLayout() {
  const { t } = useLanguage();
  const { resolvedMode } = useThemeMode();
  const insets = useSafeAreaInsets();
  const theme = getFinTheme(resolvedMode);
  const safeAreaBottom = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.background },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: 58 + safeAreaBottom,
          paddingBottom: safeAreaBottom,
          paddingTop: 6,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.tabs.dashboard'),
          tabBarIcon: ({ color }) => <TabIcon icon={Gauge} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: t('navigation.tabs.expenses'),
          tabBarIcon: ({ color }) => <TabIcon icon={ReceiptText} color={color} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: t('navigation.tabs.documents'),
          tabBarIcon: ({ color }) => <TabIcon icon={FileText} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: t('navigation.tabs.ask'),
          tabBarIcon: ({ color }) => <TabIcon icon={CircleHelp} color={color} />,
        }}
      />
      <Tabs.Screen
        name="purchase"
        options={{
          title: t('navigation.tabs.purchase'),
          tabBarIcon: ({ color }) => <TabIcon icon={ShieldCheck} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('navigation.tabs.settings'),
          tabBarIcon: ({ color }) => <TabIcon icon={Settings} color={color} />,
        }}
      />
    </Tabs>
  );
}
