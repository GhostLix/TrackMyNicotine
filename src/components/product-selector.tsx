import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductPicker } from '@/components/product-picker';
import { ScoreBadge } from '@/components/score-badge';
import { Spacing } from '@/constants/theme';
import { formatMgPerPuff, scoreFor, type Product } from '@/data/products';
import { useDevSettings, useStyles, useTheme } from '@/theme/theme-provider';
import type { Theme } from '@/theme/themes';

type Props = {
  products: Product[];
  selected: Product;
  onSelect: (id: string) => void;
  /** Su sfondo colorato (layout Hero) i chip usano colori chiari. */
  onColor?: boolean;
};

/** Selettore del prodotto in uso, nella variante scelta nelle Impostazioni developer. */
export function ProductSelector(props: Props) {
  const { dev } = useDevSettings();
  if (dev.picker === 2) return <ProductChips {...props} />;
  if (dev.picker === 3) return <ProductSheet {...props} />;
  return <ProductPicker products={props.products} selected={props.selected} onSelect={props.onSelect} />;
}

/** Variante 2: fila scorrevole di chip, un tocco per cambiare prodotto. */
function ProductChips({ products, selected, onSelect, onColor }: Props) {
  const styles = useStyles(makeStyles);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsRow}
      style={styles.chipsScroll}>
      {products.map((p) => {
        const active = p.id === selected.id;
        return (
          <Pressable
            key={p.id}
            onPress={() => onSelect(p.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Usa ${p.name}`}
            style={({ pressed }) => [
              styles.chip,
              onColor && styles.chipOnColor,
              active && (onColor ? styles.chipActiveOnColor : styles.chipActive),
              pressed && styles.pressed,
            ]}>
            <ScoreBadge score={scoreFor(p.mgPerPuff)} />
            <Text
              style={[
                styles.chipText,
                onColor && styles.chipTextOnColor,
                active && (onColor ? styles.chipTextActiveOnColor : styles.chipTextActive),
              ]}
              numberOfLines={1}>
              {p.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Variante 3: pulsante che apre un pannello dal basso con l'elenco dei predefiniti. */
function ProductSheet({ products, selected, onSelect }: Props) {
  const styles = useStyles(makeStyles);
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Prodotto selezionato: ${selected.name}. Tocca per cambiare`}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}>
        <ScoreBadge score={scoreFor(selected.mgPerPuff)} size="lg" />
        <View style={styles.triggerText}>
          <Text style={styles.caption}>Stai usando</Text>
          <Text style={styles.triggerLabel} numberOfLines={1}>
            {selected.name}
          </Text>
        </View>
        <View style={styles.changePill}>
          <Ionicons name="swap-vertical" size={14} color={t.colors.primaryDark} />
          <Text style={styles.changeText}>Cambia</Text>
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setOpen(false)} accessibilityLabel="Chiudi" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Scegli il prodotto</Text>
          <ScrollView style={styles.sheetList} bounces={false}>
            {products.map((p, i) => {
              const active = p.id === selected.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    onSelect(p.id);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [
                    styles.sheetRow,
                    i > 0 && styles.sheetDivider,
                    active && styles.sheetRowActive,
                    pressed && styles.pressed,
                  ]}>
                  <ScoreBadge score={scoreFor(p.mgPerPuff)} />
                  <View style={styles.triggerText}>
                    <Text style={[styles.sheetName, active && styles.sheetNameActive]} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={styles.sheetDetail} numberOfLines={1}>
                      {p.detail ? `${p.detail} · ` : ''}
                      {formatMgPerPuff(p.mgPerPuff)} mg/tiro
                    </Text>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={22} color={t.colors.primary} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    chipsScroll: {
      flexGrow: 0,
      marginHorizontal: -Spacing.md,
    },
    chipsRow: {
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: 4,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingLeft: 6,
      paddingRight: 14,
      paddingVertical: 6,
      borderRadius: t.button.radius,
      backgroundColor: t.colors.card,
      borderWidth: 1.5,
      borderColor: t.colors.border,
    },
    chipActive: {
      borderColor: t.colors.primary,
      backgroundColor: t.colors.primarySoft,
    },
    chipOnColor: {
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
      borderColor: 'rgba(255, 255, 255, 0.28)',
    },
    chipActiveOnColor: {
      backgroundColor: t.colors.card,
      borderColor: t.colors.card,
    },
    chipText: {
      ...t.text(14, '600'),
      color: t.colors.text,
      maxWidth: 180,
    },
    chipTextActive: {
      color: t.colors.primaryDark,
    },
    chipTextOnColor: {
      color: t.colors.onPrimary,
    },
    chipTextActiveOnColor: {
      color: t.colors.text,
    },
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 10,
      paddingRight: 12,
      borderRadius: t.radius.lg,
      backgroundColor: t.colors.card,
      ...t.elevation,
    },
    triggerText: {
      flex: 1,
      minWidth: 0,
    },
    caption: {
      ...t.text(11, '600'),
      color: t.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    triggerLabel: {
      ...t.text(17, '700'),
      color: t.colors.text,
    },
    changePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: t.colors.primarySoft,
      borderRadius: t.button.radius,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    changeText: {
      ...t.text(13, '700'),
      ...t.button.label,
      color: t.colors.primaryDark,
    },
    sheetBackdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: t.colors.backdrop,
    },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      maxHeight: '75%',
      backgroundColor: t.colors.card,
      borderTopLeftRadius: t.radius.lg,
      borderTopRightRadius: t.radius.lg,
      paddingTop: 10,
      paddingHorizontal: Spacing.md,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: t.colors.control,
      marginBottom: 12,
    },
    sheetTitle: {
      ...t.text(18, '800'),
      color: t.colors.text,
      marginBottom: 8,
    },
    sheetList: {
      flexGrow: 0,
    },
    sheetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderRadius: t.radius.md,
    },
    sheetDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.border,
    },
    sheetRowActive: {
      backgroundColor: t.colors.primarySoft,
    },
    sheetName: {
      ...t.text(16, '600'),
      color: t.colors.text,
    },
    sheetNameActive: {
      color: t.colors.primaryDark,
    },
    sheetDetail: {
      ...t.text(12, '400'),
      color: t.colors.textMuted,
      marginTop: 2,
    },
    pressed: {
      opacity: 0.7,
    },
  });
