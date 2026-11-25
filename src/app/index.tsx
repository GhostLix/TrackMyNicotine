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
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { formatMg, puffsToday } from '@/lib/nicotine';
import { useNicotine } from '@/store/nicotine-store';

const MAX_CONTENT_WIDTH = 520;

export default function HomeScreen() {
  const {
    loaded,
    now,
    puffs,
    dailyLimitMg,
    products,
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
          <ProductPicker products={products} selected={selectedProduct} onSelect={selectProduct} />

          <View style={styles.ringCard}>
            <View style={styles.ringHeader}>
              <Text style={styles.ringTitle}>Oggi</Text>
              <View style={[styles.limitPill, overLimit && styles.limitPillOver]}>
                {overLimit && <Ionicons name="warning" size={13} color={Colors.danger} />}
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

            <Pressable
              onPress={undoLastPuff}
              disabled={today.length === 0}
              hitSlop={8}
              style={({ pressed }) => [
                styles.undo,
                today.length === 0 && styles.undoDisabled,
                pressed && { opacity: 0.6 },
              ]}>
              <Ionicons name="arrow-undo" size={14} color={Colors.textMuted} />
              <Text style={styles.undoText}>Annulla ultimo tiro</Text>
            </Pressable>
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow,
  },
  ringHeader: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ringTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  limitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
  },
  limitPillOver: {
    backgroundColor: Colors.dangerSoft,
  },
  limitText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  limitTextOver: {
    color: Colors.danger,
  },
  undo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  undoDisabled: {
    opacity: 0.35,
  },
  undoText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(27, 35, 64, 0.45)',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textMuted,
  },
});
