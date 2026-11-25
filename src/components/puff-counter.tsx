import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Path } from 'react-native-svg';

import { PuffRing } from '@/components/puff-ring';
import { formatMg } from '@/lib/nicotine';
import { useDevSettings, useStyles, useTheme } from '@/theme/theme-provider';
import type { Theme } from '@/theme/themes';

export type CounterProps = {
  size: number;
  puffs: number;
  mgToday: number;
  limitMg: number;
  onPress: () => void;
};

/** Il pulsante per registrare un tiro, nella variante scelta nelle Impostazioni developer. */
export function PuffCounter(props: CounterProps) {
  const { dev } = useDevSettings();
  if (dev.counter === 2) return <PuffBar {...props} />;
  if (dev.counter === 3) return <PuffFill {...props} />;
  return <PuffRing {...props} />;
}

function usePressScale() {
  const scale = useRef(new Animated.Value(1)).current;
  return {
    scale,
    onPressIn: () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 40 }).start(),
    onPressOut: () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start(),
  };
}

function ratios(mgToday: number, limitMg: number) {
  const ratio = limitMg > 0 ? mgToday / limitMg : 0;
  return { ratio, blue: Math.min(ratio, 1), red: Math.min(Math.max(ratio - 1, 0), 1) };
}

/** Variante 2: grande pulsante "+1" con barra di avanzamento verso il limite. */
function PuffBar({ size, puffs, mgToday, limitMg, onPress }: CounterProps) {
  const styles = useStyles(makeStyles);
  const press = usePressScale();
  const { blue, red } = ratios(mgToday, limitMg);
  const over = red > 0;
  const button = Math.round(size * 0.58);

  return (
    <View style={[styles.barWrap, { width: size }]}>
      <Animated.View style={{ transform: [{ scale: press.scale }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          accessibilityRole="button"
          accessibilityLabel={`Aggiungi un tiro. ${puffs} tiri oggi, ${formatMg(mgToday)} milligrammi`}
          style={[
            styles.bigButton,
            over && styles.bigButtonOver,
            { width: button, height: button, borderRadius: button / 2 },
          ]}>
          <Text style={styles.bigPlus}>+1</Text>
          <Text style={styles.bigLabel}>tiro</Text>
        </Pressable>
      </Animated.View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{puffs}</Text>
          <Text style={styles.statLabel}>tiri oggi</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, over && styles.overText]}>
            {formatMg(mgToday)}
            <Text style={styles.statUnit}> mg</Text>
          </Text>
          <Text style={styles.statLabel}>assunti oggi</Text>
        </View>
      </View>

      <View style={styles.track}>
        {/* Come l'anello: il blu arriva al limite, poi il rosso lo sostituisce da sinistra. */}
        <View style={[styles.fill, styles.fillBlue, { width: `${blue * 100}%` }]} />
        {over && <View style={[styles.fill, styles.fillRed, { width: `${red * 100}%` }]} />}
      </View>
      <View style={styles.trackLabels}>
        <Text style={styles.trackLabel}>0</Text>
        <Text style={[styles.trackLabel, over && styles.overText]}>limite {limitMg} mg</Text>
      </View>
    </View>
  );
}

/** Onda sul bordo superiore del liquido: sinusoide da sinistra a destra, poi chiusura in basso. */
function wavePath(size: number, level: number): string {
  const y0 = size * (1 - level);
  const amp = level > 0 && level < 1 ? Math.max(3, size * 0.018) : 0;
  const waves = 2;
  let d = `M 0 ${y0.toFixed(1)}`;
  const steps = 32;
  for (let i = 1; i <= steps; i++) {
    const x = (size * i) / steps;
    const y = y0 + amp * Math.sin((i / steps) * waves * 2 * Math.PI);
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d} L ${size} ${size} L 0 ${size} Z`;
}

/** Variante 3: cerchio che si riempie di liquido fino al limite; oltre, il liquido diventa rosso. */
function PuffFill({ size, puffs, mgToday, limitMg, onPress }: CounterProps) {
  const styles = useStyles(makeStyles);
  const t = useTheme();
  const press = usePressScale();
  const { blue, red } = ratios(mgToday, limitMg);
  const over = red > 0;
  // Oltre il limite il cerchio è pieno e il rosso sale dal basso sostituendo il colore normale.
  const border = 4;
  const r = size / 2 - border;

  return (
    <Animated.View style={{ transform: [{ scale: press.scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`Aggiungi un tiro. ${puffs} tiri oggi, ${formatMg(mgToday)} milligrammi`}
        style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Defs>
            <ClipPath id="fillClip">
              <Circle cx={size / 2} cy={size / 2} r={r} />
            </ClipPath>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={r} fill={t.colors.card} />
          <G clipPath="url(#fillClip)">
            {blue > 0 && <Path d={wavePath(size, blue)} fill={t.colors.primary} fillOpacity={0.3} />}
            {over && <Path d={wavePath(size, red)} fill={t.colors.danger} fillOpacity={0.4} />}
          </G>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={over ? t.colors.danger : t.colors.primary}
            strokeWidth={border}
          />
        </Svg>
        <View style={styles.fillCenter} pointerEvents="none">
          <Text style={styles.fillPlus}>+1</Text>
          <Text style={styles.fillPuffs}>{puffs}</Text>
          <Text style={styles.fillLabel}>tiri oggi</Text>
          <Text style={styles.fillMg}>
            {formatMg(mgToday)}
            <Text style={styles.fillMgUnit}> mg</Text>
          </Text>
          <Text style={styles.fillLabel}>
            {over ? 'oltre il limite' : `${Math.round(blue * 100)}% del limite`}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    barWrap: {
      alignItems: 'center',
      gap: 16,
      paddingVertical: 4,
    },
    bigButton: {
      backgroundColor: t.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: t.colors.primary,
      shadowOpacity: 0.35,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    bigButtonOver: {
      backgroundColor: t.colors.danger,
      shadowColor: t.colors.danger,
    },
    bigPlus: {
      ...t.text(52, '800'),
      color: t.colors.onPrimary,
      lineHeight: 58,
    },
    bigLabel: {
      ...t.text(15, '700'),
      color: t.colors.onPrimary,
      opacity: 0.85,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'stretch',
    },
    stat: {
      flex: 1,
      alignItems: 'center',
    },
    statDivider: {
      width: 1,
      height: 36,
      backgroundColor: t.colors.border,
    },
    statValue: {
      ...t.text(30, '800'),
      color: t.colors.text,
    },
    statUnit: {
      ...t.text(15, '700'),
      color: t.colors.textMuted,
    },
    statLabel: {
      ...t.text(12, '500'),
      color: t.colors.textMuted,
    },
    overText: {
      color: t.colors.danger,
    },
    track: {
      alignSelf: 'stretch',
      height: 14,
      borderRadius: 7,
      backgroundColor: t.colors.ringTrack,
      overflow: 'hidden',
    },
    fill: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      borderRadius: 7,
    },
    fillBlue: {
      backgroundColor: t.colors.primary,
    },
    fillRed: {
      backgroundColor: t.colors.danger,
    },
    trackLabels: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: -8,
    },
    trackLabel: {
      ...t.text(12, '600'),
      color: t.colors.textMuted,
    },
    fillCenter: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fillPlus: {
      ...t.text(18, '700'),
      color: t.colors.primary,
    },
    fillPuffs: {
      ...t.text(52, '800'),
      lineHeight: 58,
      color: t.colors.text,
    },
    fillLabel: {
      ...t.text(13, '500'),
      color: t.colors.textMuted,
    },
    fillMg: {
      ...t.text(28, '800'),
      color: t.colors.text,
      marginTop: 6,
    },
    fillMgUnit: {
      ...t.text(15, '700'),
    },
  });
