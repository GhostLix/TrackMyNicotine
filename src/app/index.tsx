import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DailyLimitEditor } from '@/components/daily-limit-editor';
import { NicotineChart } from '@/components/nicotine-chart';
import { ProductSelector } from '@/components/product-selector';
import { PuffCounter } from '@/components/puff-counter';
import { Spacing } from '@/constants/theme';
import { bodyNicotineAt, formatMg, puffsToday } from '@/lib/nicotine';
import { useNicotine } from '@/store/nicotine-store';
import { useDevSettings, useStyles, useTheme } from '@/theme/theme-provider';
import type { Theme } from '@/theme/themes';

const MAX_CONTENT_WIDTH = 520;

function formatToday(now: number): string {
  const text = new Date(now).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function HomeScreen() {
  const styles = useStyles(makeStyles);
  const t = useTheme();
  const { dev } = useDevSettings();
  const insets = useSafeAreaInsets();
  const {
    loaded,
    now,
    puffs,
    dailyLimitMg,
    enabledProducts,
    selectedProduct,
    addPuff,
    undoLastPuff,
    selectProduct,
    setDailyLimit,
  } = useNicotine();
  const { width } = useWindowDimensions();

  const today = useMemo(() => puffsToday(puffs, now), [puffs, now]);
  const mgToday = today.reduce((sum, p) => sum + p.mg, 0);
  const inBody = useMemo(() => bodyNicotineAt(puffs, now), [puffs, now]);
  const limit = dailyLimitMg ?? 10;
  const overLimit = mgToday > limit;
  const layout = dev.home;

  // Nel layout Hero la parte alta è colorata: icone di stato chiare solo mentre la Home è visibile.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(layout === 2 || t.dark ? 'light' : 'dark');
      return () => setStatusBarStyle(t.dark ? 'light' : 'dark');
    }, [layout, t.dark]),
  );

  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH) - Spacing.md * 2;
  const counterSize =
    dev.counter === 2
      ? contentWidth - Spacing.md * 2
      : layout === 5
        ? Math.min(contentWidth - Spacing.sm * 2, 330)
        : Math.min(contentWidth - Spacing.lg * 2, 300);

  const selector = (onColor?: boolean) => (
    <ProductSelector
      products={enabledProducts}
      selected={selectedProduct}
      onSelect={selectProduct}
      onColor={onColor}
    />
  );

  const limitPill = (onColor?: boolean) => (
    <View
      style={[
        styles.limitPill,
        onColor && styles.limitPillOnColor,
        overLimit && styles.limitPillOver,
      ]}>
      {overLimit && <Ionicons name="warning" size={13} color={t.colors.danger} />}
      <Text
        style={[
          styles.limitText,
          onColor && styles.limitTextOnColor,
          overLimit && styles.limitTextOver,
        ]}>
        {overLimit ? 'Limite giornaliero superato' : `${formatMg(mgToday)} / ${limit} mg`}
      </Text>
    </View>
  );

  const counterBlock = (
    <>
      <PuffCounter
        size={counterSize}
        puffs={today.length}
        mgToday={mgToday}
        limitMg={limit}
        onPress={addPuff}
      />
      {today.length === 0 ? (
        <View style={styles.hint}>
          <Ionicons name="hand-left-outline" size={15} color={t.colors.primary} />
          <Text style={styles.hintText}>
            {dev.counter === 2
              ? 'Tocca “+1” ogni volta che fai un tiro'
              : 'Tocca il cerchio ogni volta che fai un tiro'}
          </Text>
        </View>
      ) : (
        <Pressable
          onPress={undoLastPuff}
          hitSlop={8}
          style={({ pressed }) => [styles.undo, pressed && { opacity: 0.6 }]}>
          <Ionicons name="arrow-undo" size={14} color={t.colors.textMuted} />
          <Text style={styles.undoText}>Annulla ultimo tiro</Text>
        </Pressable>
      )}
    </>
  );

  const chartCard = (
    <View style={styles.card}>
      <NicotineChart puffs={puffs} now={now} />
    </View>
  );

  let content: React.ReactNode;
  if (layout === 2) {
    // Hero: fascia colorata in alto, contatore in una card che la sovrappone.
    content = (
      <>
        <View style={[styles.hero, { paddingTop: insets.top + Spacing.md }]}>
          <View style={styles.heroInner}>
            <View style={styles.ringHeader}>
              <View>
                <Text style={styles.heroDate}>{formatToday(now)}</Text>
                <Text style={styles.heroTitle}>Oggi</Text>
              </View>
              {limitPill(true)}
            </View>
            {selector(true)}
          </View>
        </View>
        <View style={[styles.content, styles.heroBody]}>
          <View style={styles.ringCard}>{counterBlock}</View>
          {chartCard}
        </View>
      </>
    );
  } else if (layout === 3) {
    // Dashboard: tre riquadri con i numeri chiave sopra il contatore.
    content = (
      <View style={[styles.content, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.ringHeader}>
          <View>
            <Text style={styles.pageTitle}>Oggi</Text>
            <Text style={styles.ringDate}>{formatToday(now)}</Text>
          </View>
          {limitPill()}
        </View>
        {selector()}
        <View style={styles.tiles}>
          <StatTile label="Tiri oggi" value={String(today.length)} />
          <StatTile label="mg oggi" value={formatMg(mgToday)} danger={overLimit} />
          <StatTile label="Nel corpo" value={formatMg(inBody)} unit="mg" />
        </View>
        <View style={styles.ringCard}>{counterBlock}</View>
        {chartCard}
      </View>
    );
  } else if (layout === 4) {
    // Fluttuante: niente card dietro al contatore, che galleggia sullo sfondo.
    content = (
      <View style={[styles.content, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.ringHeader}>
          <View>
            <Text style={styles.ringDate}>{formatToday(now)}</Text>
            <Text style={styles.pageTitle}>Oggi</Text>
          </View>
          {limitPill()}
        </View>
        {selector()}
        <View style={styles.floatingCounter}>{counterBlock}</View>
        {chartCard}
      </View>
    );
  } else if (layout === 5) {
    // Focus: contatore grande al centro, numeri in linea sotto.
    content = (
      <View style={[styles.content, { paddingTop: insets.top + Spacing.sm }]}>
        {selector()}
        <View style={styles.focusCounter}>{counterBlock}</View>
        <View style={styles.inlineStats}>
          <InlineStat label="tiri oggi" value={String(today.length)} />
          <View style={styles.inlineDot} />
          <InlineStat label="mg oggi" value={formatMg(mgToday)} danger={overLimit} />
          <View style={styles.inlineDot} />
          <InlineStat label={`limite ${limit} mg`} value={`${Math.round((mgToday / limit) * 100)}%`} danger={overLimit} />
        </View>
        {chartCard}
      </View>
    );
  } else {
    content = (
      <View style={[styles.content, { paddingTop: insets.top + Spacing.md }]}>
        {selector()}
        <View style={styles.ringCard}>
          <View style={styles.ringHeader}>
            <View>
              <Text style={styles.ringTitle}>Oggi</Text>
              <Text style={styles.ringDate}>{formatToday(now)}</Text>
            </View>
            {limitPill()}
          </View>
          {counterBlock}
        </View>
        {chartCard}
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={layout === 2 ? styles.scrollHero : styles.scroll}>
        {content}
      </ScrollView>

      <Modal visible={loaded && dailyLimitMg === null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Imposta il tuo limite giornaliero</Text>
            <Text style={styles.modalBody}>
              Quanta nicotina vuoi assumere al massimo in un giorno? Potrai cambiarlo in qualsiasi
              momento dalle Impostazioni.
            </Text>
            <DailyLimitEditor initial={10} confirmLabel="Inizia" onConfirm={setDailyLimit} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InlineStat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.inlineStat}>
      <Text style={[styles.inlineValue, danger && styles.limitTextOver]}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function StatTile({ label, value, unit, danger }: { label: string; value: string; unit?: string; danger?: boolean }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileValue, danger && styles.limitTextOver]} numberOfLines={1}>
        {value}
        {unit ? <Text style={styles.tileUnit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    scroll: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.xl,
      alignItems: 'center',
    },
    content: {
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH,
      gap: Spacing.md,
    },
    ringCard: {
      backgroundColor: t.colors.card,
      borderRadius: t.radius.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      alignItems: 'center',
      gap: Spacing.md,
      ...t.elevation,
    },
    ringHeader: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    ringTitle: {
      ...t.text(17, '700'),
      color: t.colors.text,
    },
    limitPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.primarySoft,
    },
    limitPillOver: {
      backgroundColor: t.colors.dangerSoft,
    },
    limitText: {
      ...t.text(12, '700'),
      color: t.colors.primaryDark,
    },
    limitTextOver: {
      color: t.colors.danger,
    },
    undo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    scrollHero: {
      paddingBottom: Spacing.xl,
      alignItems: 'center',
    },
    hero: {
      alignSelf: 'stretch',
      backgroundColor: t.colors.primary,
      borderBottomLeftRadius: t.radius.lg + 8,
      borderBottomRightRadius: t.radius.lg + 8,
      paddingHorizontal: Spacing.md,
      paddingBottom: 64,
      alignItems: 'center',
    },
    heroInner: {
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH,
      gap: Spacing.md,
    },
    heroDate: {
      ...t.text(13, '600'),
      color: t.colors.onPrimary,
      opacity: 0.8,
    },
    heroTitle: {
      ...t.text(30, '800'),
      color: t.colors.onPrimary,
    },
    heroBody: {
      marginTop: -48,
      paddingHorizontal: Spacing.md,
      maxWidth: MAX_CONTENT_WIDTH + Spacing.md * 2,
    },
    limitPillOnColor: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    limitTextOnColor: {
      color: t.colors.onPrimary,
    },
    floatingCounter: {
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing.lg,
    },
    focusCounter: {
      alignItems: 'center',
      gap: Spacing.md,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.md,
    },
    inlineStats: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.md,
      paddingBottom: Spacing.md,
    },
    inlineStat: {
      alignItems: 'center',
    },
    inlineValue: {
      ...t.text(22, '800'),
      color: t.colors.text,
    },
    inlineDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.colors.control,
    },
    pageTitle: {
      ...t.text(30, '800'),
      color: t.colors.text,
    },
    tiles: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    tile: {
      flex: 1,
      minWidth: 0,
      backgroundColor: t.colors.card,
      borderRadius: t.radius.md,
      paddingVertical: 14,
      paddingHorizontal: 12,
      gap: 2,
      ...t.elevation,
    },
    tileValue: {
      ...t.text(22, '800'),
      color: t.colors.text,
    },
    tileUnit: {
      ...t.text(12, '700'),
      color: t.colors.textMuted,
    },
    tileLabel: {
      ...t.text(12, '500'),
      color: t.colors.textMuted,
    },
    ringDate: {
      ...t.text(12, '500'),
      color: t.colors.textMuted,
      marginTop: 1,
    },
    hint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: t.colors.primarySoft,
      borderRadius: t.radius.pill,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    hintText: {
      ...t.text(13, '600'),
      color: t.colors.primaryDark,
    },
    undoText: {
      ...t.text(13, '600'),
      color: t.colors.textMuted,
    },
    card: {
      backgroundColor: t.colors.card,
      borderRadius: t.radius.lg,
      padding: Spacing.md,
      ...t.elevation,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: t.colors.backdrop,
      justifyContent: 'center',
      padding: Spacing.md,
    },
    modalCard: {
      backgroundColor: t.colors.card,
      borderRadius: t.radius.lg,
      padding: Spacing.lg,
      gap: Spacing.md,
      width: '100%',
      maxWidth: 440,
      alignSelf: 'center',
    },
    modalTitle: {
      ...t.text(20, '800'),
      color: t.colors.text,
    },
    modalBody: {
      ...t.text(14, '400'),
      lineHeight: 20,
      color: t.colors.textMuted,
    },
  });
