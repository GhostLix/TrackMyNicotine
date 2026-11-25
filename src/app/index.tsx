import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DailyLimitEditor } from '@/components/daily-limit-editor';
import { NicotineChart } from '@/components/nicotine-chart';
import { ProductPicker } from '@/components/product-picker';
import { PuffRing } from '@/components/puff-ring';
import { Spacing } from '@/constants/theme';
import { formatMg, puffsToday } from '@/lib/nicotine';
import { useNicotine } from '@/store/nicotine-store';
import { useStyles, useTheme } from '@/theme/theme-provider';
import type { Theme } from '@/theme/themes';

const MAX_CONTENT_WIDTH = 520;

function formatToday(now: number): string {
  const text = new Date(now).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function HomeScreen() {
  const styles = useStyles(makeStyles);
  const t = useTheme();
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
  const limit = dailyLimitMg ?? 10;
  const overLimit = mgToday > limit;

  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH) - Spacing.md * 2;
  const ringSize = Math.min(contentWidth - Spacing.lg * 2, 300);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <ProductPicker products={enabledProducts} selected={selectedProduct} onSelect={selectProduct} />

          <View style={styles.ringCard}>
            <View style={styles.ringHeader}>
              <View>
                <Text style={styles.ringTitle}>Oggi</Text>
                <Text style={styles.ringDate}>{formatToday(now)}</Text>
              </View>
              <View style={[styles.limitPill, overLimit && styles.limitPillOver]}>
                {overLimit && <Ionicons name="warning" size={13} color={t.colors.danger} />}
                <Text style={[styles.limitText, overLimit && styles.limitTextOver]}>
                  {overLimit
                    ? 'Limite giornaliero superato'
                    : `${formatMg(mgToday)} / ${limit} mg`}
                </Text>
              </View>
            </View>

            <PuffRing
              size={ringSize}
              puffs={today.length}
              mgToday={mgToday}
              limitMg={limit}
              onPress={addPuff}
            />

            {today.length === 0 ? (
              <View style={styles.hint}>
                <Ionicons name="hand-left-outline" size={15} color={t.colors.primary} />
                <Text style={styles.hintText}>Tocca il cerchio ogni volta che fai un tiro</Text>
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
          </View>

          <View style={styles.card}>
            <NicotineChart puffs={puffs} now={now} />
          </View>
        </View>
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
    </SafeAreaView>
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
      paddingTop: Spacing.md,
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
