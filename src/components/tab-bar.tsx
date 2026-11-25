import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useStyles, useTheme } from '@/theme/theme-provider';
import type { Theme } from '@/theme/themes';

type IconName = ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  statistiche: { active: 'stats-chart', inactive: 'stats-chart-outline' },
  prodotti: { active: 'bag-handle', inactive: 'bag-handle-outline' },
  impostazioni: { active: 'settings', inactive: 'settings-outline' },
};

/** Barra di navigazione minimal: solo icone, un puntino sotto la sezione attiva. */
export function TabBar({ state, descriptors, navigateToTab, insets }: BottomTabBarProps) {
  const styles = useStyles(makeStyles);
  const t = useTheme();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const focused = index === state.index;
        const title = descriptors[route.key]?.options.title ?? route.name;
        const icon = ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };
        return (
          <Pressable
            key={route.key}
            onPress={() => navigateToTab(route.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={title}
            style={styles.item}>
            <Ionicons
              name={focused ? icon.active : icon.inactive}
              size={26}
              color={focused ? t.colors.primary : t.colors.textMuted}
            />
            <View style={[styles.dot, focused && styles.dotActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      backgroundColor: t.colors.background,
      paddingTop: 10,
    },
    item: {
      flex: 1,
      alignItems: 'center',
      gap: 5,
      paddingVertical: 4,
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: 'transparent',
    },
    dotActive: {
      backgroundColor: t.colors.primary,
    },
  });
