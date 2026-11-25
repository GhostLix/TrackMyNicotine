import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { bodyNicotineSeries, type Puff } from '@/lib/nicotine';
import { useStyles, useTheme } from '@/theme/theme-provider';
import type { Theme } from '@/theme/themes';

type Props = {
  puffs: Puff[];
  now: number;
};

const HEIGHT = 190;
const PAD_LEFT = 34;
const PAD_RIGHT = 8;
const PAD_TOP = 10;
const PAD_BOTTOM = 24;

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / exp;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * exp;
}

function formatTick(v: number): string {
  if (v === 0) return '0';
  // Le tacche sono quarti di un valore "tondo": 3 decimali bastano sempre (es. 0.025).
  return String(Math.round(v * 1000) / 1000);
}

function formatHour(t: number): string {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Nicotina stimata nel corpo nelle ultime 24 ore. */
export function NicotineChart({ puffs, now }: Props) {
  const styles = useStyles(makeStyles);
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const series = useMemo(() => bodyNicotineSeries(puffs, now), [puffs, now]);

  const chart = useMemo(() => {
    if (width === 0) return null;
    const maxVal = Math.max(...series.map((p) => p.mg));
    const yMax = niceMax(maxVal * 1.15);
    const plotW = width - PAD_LEFT - PAD_RIGHT;
    const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
    const t0 = series[0].t;
    const span = now - t0;

    const x = (t: number) => PAD_LEFT + ((t - t0) / span) * plotW;
    const y = (mg: number) => PAD_TOP + plotH - (mg / yMax) * plotH;

    const line = series
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t).toFixed(1)},${y(p.mg).toFixed(1)}`)
      .join(' ');
    const baseY = PAD_TOP + plotH;
    const area = `${line} L${x(now).toFixed(1)},${baseY} L${PAD_LEFT},${baseY} Z`;

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);
    const xTicks = [0, 6, 12, 18, 24].map((h) => t0 + h * 60 * 60 * 1000);

    return { line, area, yTicks, xTicks, x, y, baseY };
  }, [series, width, now]);

  const current = series[series.length - 1].mg;

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Nicotina nel corpo</Text>
        <Text style={styles.current}>
          {current.toFixed(2)} <Text style={styles.currentUnit}>mg ora</Text>
        </Text>
      </View>
      <Text style={styles.subtitle}>Stima delle ultime 24 ore</Text>

      <View style={{ height: HEIGHT }} onLayout={onLayout}>
        {chart && (
          <Svg width={width} height={HEIGHT}>
            <Defs>
              <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={t.colors.primary} stopOpacity={0.28} />
                <Stop offset="1" stopColor={t.colors.primary} stopOpacity={0.02} />
              </LinearGradient>
            </Defs>

            {chart.yTicks.map((v) => (
              <Line
                key={`g${v}`}
                x1={PAD_LEFT}
                x2={width - PAD_RIGHT}
                y1={chart.y(v)}
                y2={chart.y(v)}
                stroke={t.colors.border}
                strokeWidth={1}
              />
            ))}
            {chart.yTicks.map((v) => (
              <SvgText
                key={`y${v}`}
                x={PAD_LEFT - 6}
                y={chart.y(v) + 4}
                fontSize={10}
                fontFamily={t.svgFont}
                fill={t.colors.textMuted}
                textAnchor="end">
                {formatTick(v)}
              </SvgText>
            ))}

            <Path d={chart.area} fill="url(#fill)" />
            <Path d={chart.line} stroke={t.colors.primary} strokeWidth={2.5} fill="none" />

            {chart.xTicks.map((tick, i) => (
              <SvgText
                key={`x${tick}`}
                x={chart.x(tick)}
                y={HEIGHT - 6}
                fontSize={10}
                fontFamily={t.svgFont}
                fill={t.colors.textMuted}
                textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}>
                {i === 4 ? 'Ora' : formatHour(tick)}
              </SvgText>
            ))}
          </Svg>
        )}
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    title: {
      ...t.text(17, '700'),
      color: t.colors.text,
    },
    current: {
      ...t.text(17, '800'),
      color: t.colors.primary,
    },
    currentUnit: {
      ...t.text(12, '600'),
      color: t.colors.textMuted,
    },
    subtitle: {
      ...t.text(12, '400'),
      color: t.colors.textMuted,
      marginTop: 2,
      marginBottom: 12,
    },
  });
