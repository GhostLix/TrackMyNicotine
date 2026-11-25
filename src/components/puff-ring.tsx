import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Colors, Shadow } from '@/constants/theme';
import { formatMg } from '@/lib/nicotine';

type Props = {
  size: number;
  puffs: number;
  mgToday: number;
  limitMg: number;
  onPress: () => void;
};

const STROKE = 18;
const OVER_STROKE = 24;

/**
 * Anello di progresso: si riempie di blu fino al limite giornaliero,
 * poi un secondo giro rosso indica quanto si è oltre il limite.
 */
export function PuffRing({ size, puffs, mgToday, limitMg, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const radius = (size - OVER_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const ratio = limitMg > 0 ? mgToday / limitMg : 0;
  const blue = Math.min(ratio, 1);
  const red = Math.min(Math.max(ratio - 1, 0), 1);

  const innerSize = size - OVER_STROKE * 2 - 20;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={Colors.ringTrack}
          strokeWidth={STROKE}
          fill="none"
        />
        {blue > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={Colors.primary}
            strokeWidth={STROKE}
            strokeLinecap={blue < 1 ? 'round' : 'butt'}
            fill="none"
            // A cerchio pieno niente tratteggio, altrimenti i cap tondi lasciano una tacca in alto.
            strokeDasharray={blue < 1 ? `${circumference} ${circumference}` : undefined}
            strokeDashoffset={blue < 1 ? circumference * (1 - blue) : undefined}
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}
        {red > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={Colors.danger}
            strokeOpacity={0.9}
            strokeWidth={OVER_STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - red)}
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}
      </Svg>

      <View style={styles.centerWrap} pointerEvents="box-none">
        <Animated.View style={{ transform: [{ scale }] }}>
          <Pressable
            onPress={onPress}
            onPressIn={pressIn}
            onPressOut={pressOut}
            accessibilityRole="button"
            accessibilityLabel={`Aggiungi un tiro. ${puffs} tiri oggi, ${formatMg(mgToday)} milligrammi`}
            style={[
              styles.button,
              { width: innerSize, height: innerSize, borderRadius: innerSize / 2 },
            ]}>
            <Text style={styles.plus}>+1</Text>
            <Text style={styles.puffs}>{puffs}</Text>
            <Text style={styles.label}>tiri oggi</Text>
            <View style={styles.divider} />
            <Text style={styles.mg}>
              {formatMg(mgToday)}
              <Text style={styles.mgUnit}> mg</Text>
            </Text>
            <Text style={styles.label}>assunti oggi</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: Colors.primarySoft,
    ...Shadow,
  },
  plus: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  puffs: {
    fontSize: 52,
    lineHeight: 58,
    fontWeight: '800',
    color: Colors.text,
  },
  label: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  divider: {
    width: 40,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  mg: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
  },
  mgUnit: {
    fontSize: 16,
    fontWeight: '700',
  },
});
