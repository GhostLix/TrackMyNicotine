import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScoreBadge } from '@/components/score-badge';
import { Spacing } from '@/constants/theme';
import { formatMgPerPuff, scoreFor, type Product } from '@/data/products';
import { useStyles, useTheme } from '@/theme/theme-provider';
import type { Theme } from '@/theme/themes';

type Props = {
  products: Product[];
  selected: Product;
  onSelect: (id: string) => void;
};

/** Selettore del prodotto in uso: pillola che apre un pannello dal basso con i predefiniti. */
export function ProductSelector({ products, selected, onSelect }: Props) {
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
        <ScoreBadge score={scoreFor(selected.mgPerPuff)} />
        <View style={styles.triggerText}>
          <Text style={styles.caption}>Prodotto</Text>
          <Text style={styles.triggerLabel} numberOfLines={1}>
            {selected.name}
          </Text>
        </View>
        <View style={styles.chevron}>
          <Ionicons name="chevron-down" size={16} color={t.colors.primaryDark} />
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
          <Pressable
            onPress={() => {
              setOpen(false);
              router.navigate('/prodotti');
            }}
            style={({ pressed }) => [styles.manage, pressed && styles.pressed]}>
            <Ionicons name="options-outline" size={16} color={t.colors.primary} />
            <Text style={styles.manageText}>Gestisci i prodotti</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 9,
      paddingLeft: 10,
      paddingRight: 9,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.card,
      ...t.elevation,
    },
    triggerText: {
      flex: 1,
      minWidth: 0,
    },
    caption: {
      ...t.text(10, '600'),
      color: t.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    triggerLabel: {
      ...t.text(15, '700'),
      color: t.colors.text,
    },
    chevron: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: t.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
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
    manage: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 14,
      marginTop: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.border,
    },
    manageText: {
      ...t.text(14, '700'),
      ...t.button.label,
      color: t.colors.primary,
    },
    pressed: {
      opacity: 0.7,
    },
  });
