import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useRef, type ComponentProps } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { useNicotine } from '@/store/nicotine-store';

import { useDevSettings, useStyles, useTheme } from '@/theme/theme-provider';
import type { Theme } from '@/theme/themes';

type IconName = ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  statistiche: { active: 'stats-chart', inactive: 'stats-chart-outline' },
  prodotti: { active: 'bag-handle', inactive: 'bag-handle-outline' },
  impostazioni: { active: 'settings', inactive: 'settings-outline' },
};

/** Barra di navigazione in tre varianti, scelte dalle Impostazioni developer. */
export function TabBar({ state, descriptors, navigateToTab, insets }: BottomTabBarProps) {
  const styles = useStyles(makeStyles);
  const t = useTheme();
  const { dev } = useDevSettings();
  const { addPuff } = useNicotine();
  const bump = useRef(new Animated.Value(1)).current;
  const variant = dev.nav;

  const items = state.routes.map((route, index) => {
    const focused = index === state.index;
    const title = descriptors[route.key]?.options.title ?? route.name;
    const icon = ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };
    const color = focused ? t.colors.primary : t.colors.textMuted;
    return { route, focused, title, icon, color };
  });

  if (variant === 4) {
    // Con +1: barra classica con un pulsante centrale rialzato che registra un tiro ovunque.
    const onPlus = () => {
      addPuff();
      Animated.sequence([
        Animated.timing(bump, { toValue: 0.88, duration: 80, useNativeDriver: true }),
        Animated.spring(bump, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
    };
    const half = Math.ceil(items.length / 2);
    const renderItem = ({ route, focused, title, icon, color }: (typeof items)[number]) => (
      <Pressable
        key={route.key}
        onPress={() => navigateToTab(route.key)}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        style={styles.classicItem}>
        <View style={[styles.classicIndicator, focused && styles.classicIndicatorActive]} />
        <Ionicons name={focused ? icon.active : icon.inactive} size={24} color={color} />
        <Text style={[styles.classicLabel, { color }]} numberOfLines={1}>
          {title}
        </Text>
      </Pressable>
    );
    return (
      <View style={[styles.classic, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {items.slice(0, half).map(renderItem)}
        <View style={styles.plusSlot}>
          <Animated.View style={{ transform: [{ scale: bump }] }}>
            <Pressable
              onPress={onPlus}
              accessibilityRole="button"
              accessibilityLabel="Registra un tiro"
              style={({ pressed }) => [styles.plusButton, pressed && { opacity: 0.85 }]}>
              <Text style={styles.plusText}>+1</Text>
            </Pressable>
          </Animated.View>
        </View>
        {items.slice(half).map(renderItem)}
      </View>
    );
  }

  if (variant === 2) {
    // Fluttuante: pillola sospesa, la voce attiva si allarga e mostra il nome.
    return (
      <View style={[styles.floatingWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.floating}>
          {items.map(({ route, focused, title, icon }) => (
            <Pressable
              key={route.key}
              onPress={() => navigateToTab(route.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={title}
              style={[styles.floatingItem, focused && styles.floatingItemActive]}>
              <Ionicons
                name={focused ? icon.active : icon.inactive}
                size={22}
                color={focused ? t.colors.onPrimary : t.colors.textMuted}
              />
              {focused && (
                <Text style={styles.floatingLabel} numberOfLines={1}>
                  {title}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  if (variant === 3) {
    // Minimal: solo icone, un puntino sotto la voce attiva.
    return (
      <View style={[styles.minimal, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {items.map(({ route, focused, title, icon, color }) => (
          <Pressable
            key={route.key}
            onPress={() => navigateToTab(route.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={title}
            style={styles.minimalItem}>
            <Ionicons name={focused ? icon.active : icon.inactive} size={26} color={color} />
            <View style={[styles.dot, focused && styles.dotActive]} />
          </Pressable>
        ))}
      </View>
    );
  }

  // Classica: icona + nome, indicatore in alto sulla voce attiva.
  return (
    <View style={[styles.classic, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {items.map(({ route, focused, title, icon, color }) => (
        <Pressable
          key={route.key}
          onPress={() => navigateToTab(route.key)}
          accessibilityRole="tab"
          accessibilityState={{ selected: focused }}
          style={styles.classicItem}>
          <View style={[styles.classicIndicator, focused && styles.classicIndicatorActive]} />
          <Ionicons name={focused ? icon.active : icon.inactive} size={24} color={color} />
          <Text style={[styles.classicLabel, { color }]} numberOfLines={1}>
            {title}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    classic: {
      flexDirection: 'row',
      backgroundColor: t.colors.card,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.border,
    },
    classicItem: {
      flex: 1,
      alignItems: 'center',
      paddingBottom: 6,
      gap: 3,
    },
    classicIndicator: {
      width: 28,
      height: 3,
      borderBottomLeftRadius: 3,
      borderBottomRightRadius: 3,
      backgroundColor: 'transparent',
      marginBottom: 6,
    },
    classicIndicatorActive: {
      backgroundColor: t.colors.primary,
    },
    classicLabel: {
      ...t.text(11, '600'),
    },
    plusSlot: {
      width: 76,
      alignItems: 'center',
    },
    plusButton: {
      width: 62,
      height: 62,
      borderRadius: 31,
      marginTop: -22,
      backgroundColor: t.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: t.colors.card,
      shadowColor: t.colors.primary,
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    plusText: {
      ...t.text(22, '800'),
      color: t.colors.onPrimary,
    },
    floatingWrap: {
      backgroundColor: t.colors.background,
      paddingHorizontal: 16,
      paddingTop: 6,
    },
    floating: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      alignSelf: 'center',
      width: '100%',
      maxWidth: 420,
      backgroundColor: t.colors.card,
      borderRadius: t.radius.pill,
      padding: 6,
      ...(t.shadow
        ? { ...t.shadow, shadowOpacity: 0.14, shadowRadius: 20, elevation: 10 }
        : { borderWidth: 1, borderColor: t.colors.border }),
    },
    floatingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 48,
      minWidth: 48,
      paddingHorizontal: 12,
      borderRadius: t.radius.pill,
    },
    floatingItemActive: {
      backgroundColor: t.colors.primary,
      paddingHorizontal: 16,
    },
    floatingLabel: {
      ...t.text(13, '700'),
      color: t.colors.onPrimary,
    },
    minimal: {
      flexDirection: 'row',
      backgroundColor: t.colors.background,
      paddingTop: 10,
    },
    minimalItem: {
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
