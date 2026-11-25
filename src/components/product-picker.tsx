import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type HostInstance } from 'react-native';

import { ScoreBadge } from '@/components/score-badge';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { PRODUCTS, type Product } from '@/data/products';

type Props = {
  selected: Product;
  onSelect: (id: string) => void;
};

type Anchor = { x: number; y: number; width: number; height: number };

/**
 * Tendina a tutta larghezza. Si apre in un Modal trasparente posizionato
 * sotto il pulsante, così resta sopra a tutto il resto della schermata
 * (anche su Android, dove zIndex tra fratelli è inaffidabile).
 */
export function ProductPicker({ selected, onSelect }: Props) {
  const triggerRef = useRef<HostInstance>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

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
        <Ionicons
          name={anchor ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.primary}
        />
        <ScoreBadge score={selected.score} />
      </Pressable>

      <Modal visible={anchor !== null} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Chiudi" />
        {anchor && (
          <View
            style={[
              styles.panel,
              { top: anchor.y + anchor.height + Spacing.sm, left: anchor.x, width: anchor.width },
            ]}>
            {PRODUCTS.map((product, index) => {
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
                      {product.detail} · {product.mgPerPuff} mg/tiro
                    </Text>
                  </View>
                  <ScoreBadge score={product.score} />
                </Pressable>
              );
            })}
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 60,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    ...Shadow,
  },
  triggerText: {
    flex: 1,
  },
  caption: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  triggerLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  pressed: {
    opacity: 0.7,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(27, 35, 64, 0.15)',
  },
  panel: {
    position: 'absolute',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingVertical: Spacing.xs,
    overflow: 'hidden',
    ...Shadow,
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
    borderTopColor: Colors.border,
  },
  optionSelected: {
    backgroundColor: Colors.primarySoft,
  },
  optionText: {
    flex: 1,
  },
  optionName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  optionNameSelected: {
    color: Colors.primaryDark,
  },
  optionDetail: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
