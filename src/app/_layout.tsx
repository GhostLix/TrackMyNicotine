import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { Colors } from '@/constants/theme';
import { NicotineProvider, useNicotine } from '@/store/nicotine-store';

SplashScreen.preventAutoHideAsync();

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(active: IconName, inactive: IconName) {
  return ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => (
    <Ionicons name={focused ? active : inactive} size={size} color={color as string} />
  );
}

function AppTabs() {
  const { loaded } = useNicotine();

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopWidth: 0,
          height: 64,
          paddingTop: 6,
          shadowColor: '#2A3A6B',
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 8,
        },
        sceneStyle: { backgroundColor: Colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="statistiche"
        options={{ title: 'Statistiche', tabBarIcon: tabIcon('stats-chart', 'stats-chart-outline') }}
      />
      <Tabs.Screen
        name="prodotti"
        options={{ title: 'Prodotti', tabBarIcon: tabIcon('bag-handle', 'bag-handle-outline') }}
      />
      <Tabs.Screen
        name="impostazioni"
        options={{ title: 'Impostazioni', tabBarIcon: tabIcon('settings', 'settings-outline') }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <NicotineProvider>
      <StatusBar style="dark" />
      <AppTabs />
    </NicotineProvider>
  );
}
