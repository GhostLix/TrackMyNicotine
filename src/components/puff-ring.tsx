import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { formatMg } from '@/lib/nicotine';
import { useStyles, useTheme } from '@/theme/theme-provider';
import type { Theme } from '@/theme/themes';

type Props = {
  size: number;
  puffs: number;
  mgToday: number;
  limitMg: number;
  onPress: () => void;
};

const STROKE = 20;

/**
 * Anello di progresso: si riempie di blu fino al limite giornaliero.
 * Superato il limite parte un secondo giro, rosso, che sostituisce il blu
 * man mano (stesso spessore, colore pieno), fino a diventare tutto rosso a 2× il limite.
 */
export function PuffRing({ size, puffs, mgToday, limitMg, onPress }: Props) {
  const styles = useStyles(makeStyles);
  const t = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const ratio = limitMg > 0 ? mgToday / limitMg : 0;
  const blue = Math.min(ratio, 1);
  const red = Math.min(Math.max(ratio - 1, 0), 1);

  const innerSize = size - STROKE * 2 - 28;

  // Arco rosso disegnato come UNA sola forma piena (corpo dell'arco + punta a semicerchio):
  // niente giunture tra forme diverse dove l'antialiasing farebbe trasparire il blu.
  const redAngle = red * 2 * Math.PI;
  const half = STROKE / 2;
  const outerR = radius + half;
  const innerR = radius - half;
  const at = (r: number, angle: number) =>
    `${(center + r * Math.sin(angle)).toFixed(3)} ${(center - r * Math.cos(angle)).toFixed(3)}`;
  const largeArc = redAngle > Math.PI ? 1 : 0;
  const redPath =
    `M ${at(outerR, 0)} ` +
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${at(outerR, redAngle)} ` +
    // punta: semicerchio rivolto in avanti, dal bordo esterno a quello interno
    `A ${half} ${half} 0 0 1 ${at(innerR, redAngle)} ` +
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${at(innerR, 0)} Z`;

  // Oltre il limite il blu resta solo nella parte non ancora coperta dal rosso, così sotto il
  // rosso non c'è blu. Lo allungo di 1.5px oltre le ore 12 per non lasciare una fessura chiara
  // nel punto in cui il rosso inizia.
  const blueRemaining = (1 - red) * circumference + 1.5;

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
          stroke={t.colors.ringTrack}
          strokeWidth={STROKE}
          fill="none"
        />
        {blue > 0 && red === 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={t.colors.primary}
            strokeWidth={STROKE}
            strokeLinecap={blue < 1 ? 'round' : 'butt'}
            fill="none"
            // A cerchio pieno niente tratteggio, altrimenti i cap tondi lasciano una tacca in alto.
            strokeDasharray={blue < 1 ? `${circumference} ${circumference}` : undefined}
            strokeDashoffset={blue < 1 ? circumference * (1 - blue) : undefined}
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}
        {red > 0 && red < 1 && (
          <>
            {/* Blu residuo: dal punto in cui arriva il rosso fino alle ore 12. */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={t.colors.primary}
              strokeWidth={STROKE}
              strokeLinecap="butt"
              fill="none"
              strokeDasharray={`${blueRemaining} ${circumference * 2}`}
              transform={`rotate(${red * 360 - 90} ${center} ${center})`}
            />
            <Path d={redPath} fill={t.colors.danger} />
          </>
        )}
        {red >= 1 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={t.colors.danger}
            strokeWidth={STROKE}
            fill="none"
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

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    centerWrap: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    button: {
      backgroundColor: t.colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 6,
      borderColor: t.colors.primarySoft,
      ...t.elevation,
    },
    plus: {
      ...t.text(18, '700'),
      color: t.colors.primary,
    },
    puffs: {
      ...t.text(52, '800'),
      lineHeight: 58,
      color: t.colors.text,
    },
    label: {
      ...t.text(13, '400'),
      color: t.colors.textMuted,
    },
    divider: {
      width: 40,
      height: 2,
      borderRadius: 1,
      backgroundColor: t.colors.border,
      marginVertical: 8,
    },
    mg: {
      ...t.text(30, '800'),
      color: t.colors.text,
    },
    mgUnit: {
      ...t.text(16, '700'),
    },
  });
