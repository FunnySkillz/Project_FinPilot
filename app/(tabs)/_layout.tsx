import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { FinPilotColors } from '@/constants/finpilot';

type TabIconName = keyof typeof MaterialIcons.glyphMap;

function TabIcon({ name, color }: { name: TabIconName; color: string }) {
  return <MaterialIcons name={name} size={24} color={color} />;
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
          tabBarIcon: ({ color }) => <TabIcon name="dashboard" color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color }) => <TabIcon name="receipt-long" color={color} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Docs',
          tabBarIcon: ({ color }) => <TabIcon name="folder" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask',
          tabBarIcon: ({ color }) => <TabIcon name="question-answer" color={color} />,
        }}
      />
      <Tabs.Screen
        name="purchase"
        options={{
          title: 'Check',
          tabBarIcon: ({ color }) => <TabIcon name="verified-user" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}

