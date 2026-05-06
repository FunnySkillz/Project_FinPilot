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

import { HapticTab } from '@/components/haptic-tab';
import { FinPilotColors } from '@/constants/finpilot';

function TabIcon({ icon: Icon, color }: { icon: LucideIcon; color: string }) {
  return <Icon size={22} color={color} strokeWidth={2.3} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: FinPilotColors.primary,
        tabBarInactiveTintColor: FinPilotColors.muted,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: FinPilotColors.border,
          minHeight: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabIcon icon={Gauge} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color }) => <TabIcon icon={ReceiptText} color={color} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Docs',
          tabBarIcon: ({ color }) => <TabIcon icon={FileText} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask',
          tabBarIcon: ({ color }) => <TabIcon icon={CircleHelp} color={color} />,
        }}
      />
      <Tabs.Screen
        name="purchase"
        options={{
          title: 'Check',
          tabBarIcon: ({ color }) => <TabIcon icon={ShieldCheck} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon icon={Settings} color={color} />,
        }}
      />
    </Tabs>
  );
}
