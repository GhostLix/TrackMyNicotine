import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type HostInstance,
} from 'react-native';

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

type Anchor = { x: number; y: number; width: number; height: number };

/**
 * Tendina a tutta larghezza. Si apre in un Modal trasparente posizionato
 * sotto il pulsante, così resta sopra a tutto il resto della schermata
 * (anche su Android, dove zIndex tra fratelli è inaffidabile).
 */
export function ProductPicker({ products, selected, onSelect }: Props) {
  const styles = useStyles(makeStyles);
  const t = useTheme();
  const triggerRef = useRef<HostInstance>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const { height: windowHeight } = useWindowDimensions();

  const open = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
    });
  };
  const close = () => setAnchor(null);

  return (
    <View ref={triggerRef}>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`Prodotto selezionato: ${selected.name}. Tocca per cambiare`}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}>
        <View style={styles.triggerText}>
          <Text style={styles.caption}>Prodotto</Text>
          <Text style={styles.triggerLabel} numberOfLines={1}>
            {selected.name}
          </Text>
        </View>
        <ScoreBadge score={scoreFor(selected.mgPerPuff)} />
        <Ionicons
          name={anchor ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={t.colors.primary}
        />
      </Pressable>

      <Modal visible={anchor !== null} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Chiudi" />
        {anchor && (
          <View
            style={[
              styles.panel,
              { top: anchor.y + anchor.height + Spacing.sm, left: anchor.x, width: anchor.width },
            ]}>
            <ScrollView
              style={{ maxHeight: windowHeight - (anchor.y + anchor.height) - 120 }}
              bounces={false}>
            {products.map((product, index) => {
              const isSelected = product.id === selected.id;
              return (
                <Pressable
                  key={product.id}
                  onPress={() => {
                    onSelect(product.id);
                    close();
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={({ pressed }) => [
                    styles.option,
                    index > 0 && styles.optionDivider,
                    isSelected && styles.optionSelected,
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                      {product.name}
                    </Text>
                    <Text style={styles.optionDetail}>
                      {product.detail ? `${product.detail} · ` : ''}{formatMgPerPuff(product.mgPerPuff)} mg/tiro
                    </Text>
                  </View>
                  <ScoreBadge score={scoreFor(product.mgPerPuff)} />
                </Pressable>
              );
            })}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      height: 60,
      paddingHorizontal: Spacing.md,
      backgroundColor: t.colors.card,
      borderRadius: t.radius.md,
      ...t.elevation,
    },
    triggerText: {
      flex: 1,
    },
    caption: {
      ...t.text(11, '600'),
      color: t.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    triggerLabel: {
      ...t.text(16, '700'),
      color: t.colors.text,
    },
    pressed: {
      opacity: 0.7,
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: t.dark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(27, 35, 64, 0.15)',
    },
    panel: {
      position: 'absolute',
      backgroundColor: t.colors.card,
      borderRadius: t.radius.md,
      paddingVertical: Spacing.xs,
      overflow: 'hidden',
      ...t.elevation,
      shadowOpacity: 0.16,
      elevation: 12,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: 12,
      paddingHorizontal: Spacing.md,
    },
    optionDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.border,
    },
    optionSelected: {
      backgroundColor: t.colors.primarySoft,
    },
    optionText: {
      flex: 1,
    },
    optionName: {
      ...t.text(15, '600'),
      color: t.colors.text,
    },
    optionNameSelected: {
      color: t.colors.primaryDark,
    },
    optionDetail: {
      ...t.text(12, '400'),
      color: t.colors.textMuted,
      marginTop: 2,
    },
  });
