import { Tabs } from 'expo-router/js-tabs';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { TabBar } from '@/components/tab-bar';
import { NicotineProvider, useNicotine } from '@/store/nicotine-store';
import { ThemeProvider, useDevSettings, useTheme } from '@/theme/theme-provider';

SplashScreen.preventAutoHideAsync();

function AppTabs() {
  const { loaded } = useNicotine();
  const { ready } = useDevSettings();
  const t = useTheme();

  useEffect(() => {
    if (loaded && ready) SplashScreen.hideAsync();
  }, [loaded, ready]);

  // Finché font e preferenze non sono pronti resta lo splash: evita un "salto" di stile.
  if (!ready) return null;

  return (
    <>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: t.colors.background },
        }}>
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="statistiche" options={{ title: 'Statistiche' }} />
        <Tabs.Screen name="prodotti" options={{ title: 'Prodotti' }} />
        <Tabs.Screen name="impostazioni" options={{ title: 'Impostazioni' }} />
      </Tabs>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <NicotineProvider>
        <AppTabs />
      </NicotineProvider>
    </ThemeProvider>
  );
}
