import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductEditor } from '@/components/product-editor';
import { ScoreBadge } from '@/components/score-badge';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import {
  DEFAULT_PRODUCTS,
  formatMgPerPuff,
  SCORE_THRESHOLDS,
  scoreFor,
  type Product,
} from '@/data/products';
import { useNicotine } from '@/store/nicotine-store';

type EditorState = { open: false } | { open: true; product?: Product };

export default function ProdottiScreen() {
  const {
    customProducts,
    selectedProduct,
    selectProduct,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useNicotine();
  const [editor, setEditor] = useState<EditorState>({ open: false });

  const closeEditor = () => setEditor({ open: false });
  const editing = editor.open ? editor.product : undefined;

  const renderRow = (product: Product, index: number) => {
    const active = product.id === selectedProduct.id;
    return (
      <Pressable
        key={product.id}
        onPress={() => selectProduct(product.id)}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={`${product.name}, ${formatMgPerPuff(product.mgPerPuff)} milligrammi per tiro${active ? ', in uso' : ''}`}
        style={({ pressed }) => [
          styles.row,
          index > 0 && styles.rowDivider,
          active && styles.rowActive,
          pressed && styles.pressed,
        ]}>
        <View style={styles.rowText}>
          <View style={styles.rowTitleLine}>
            <Text style={[styles.rowName, active && styles.rowNameActive]} numberOfLines={1}>
              {product.name}
            </Text>
            {active && (
              <View style={styles.inUse}>
                <Text style={styles.inUseText}>In uso</Text>
              </View>
            )}
          </View>
          <Text style={styles.rowDetail} numberOfLines={1}>
            {product.detail ? `${product.detail} · ` : ''}
            {formatMgPerPuff(product.mgPerPuff)} mg/tiro
          </Text>
        </View>
        {product.custom && (
          <Pressable
            onPress={() => setEditor({ open: true, product })}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Modifica ${product.name}`}
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
            <Ionicons name="pencil" size={16} color={Colors.primary} />
          </Pressable>
        )}
        <ScoreBadge score={scoreFor(product.mgPerPuff)} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Prodotti</Text>
            <Text style={styles.subtitle}>Tocca un prodotto per usarlo nella Home.</Text>
          </View>
          <Pressable
            onPress={() => setEditor({ open: true })}
            accessibilityRole="button"
            accessibilityLabel="Aggiungi prodotto"
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addText}>Aggiungi</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>I tuoi prodotti</Text>
        {customProducts.length > 0 ? (
          <View style={styles.card}>{customProducts.map(renderRow)}</View>
        ) : (
          <Pressable
            onPress={() => setEditor({ open: true })}
            style={({ pressed }) => [styles.empty, pressed && styles.pressed]}>
            <Ionicons name="add-circle-outline" size={28} color={Colors.primary} />
            <Text style={styles.emptyTitle}>Aggiungi il tuo prodotto</Text>
            <Text style={styles.emptyBody}>
              Inserisci i mg di nicotina per tiro del prodotto che usi davvero: le stime della Home
              saranno più precise.
            </Text>
          </Pressable>
        )}

        <Text style={styles.sectionTitle}>Predefiniti</Text>
        <View style={styles.card}>{DEFAULT_PRODUCTS.map(renderRow)}</View>

        <Text style={styles.sectionTitle}>Come si calcola il punteggio</Text>
        <View style={[styles.card, styles.legend]}>
          {SCORE_THRESHOLDS.map((t, i) => {
            const from = i === 0 ? 0 : SCORE_THRESHOLDS[i - 1].maxMg;
            const range =
              t.maxMg === Infinity
                ? `oltre ${formatMgPerPuff(from)} mg/tiro`
                : i === 0
                  ? `fino a ${formatMgPerPuff(t.maxMg)} mg/tiro`
                  : `${formatMgPerPuff(from)} – ${formatMgPerPuff(t.maxMg)} mg/tiro`;
            return (
              <View key={t.score} style={styles.legendRow}>
                <ScoreBadge score={t.score} />
                <Text style={styles.legendText}>{range}</Text>
              </View>
            );
          })}
          <Text style={styles.legendNote}>
            Il punteggio considera solo la nicotina per tiro, non le altre sostanze. I valori dei
            prodotti predefiniti sono stime indicative.
          </Text>
        </View>
      </ScrollView>

      <ProductEditor
        visible={editor.open}
        product={editing}
        onClose={closeEditor}
        onSave={(input) => {
          if (editing) {
            updateProduct(editing.id, input);
          } else {
            addProduct(input);
          }
          closeEditor();
        }}
        onDelete={
          editing
            ? () => {
                deleteProduct(editing.id);
                closeEditor();
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm + 4,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 16,
  },
  addText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 4,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  rowActive: {
    backgroundColor: Colors.primarySoft,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rowName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  rowNameActive: {
    color: Colors.primaryDark,
  },
  inUse: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  inUseText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  rowDetail: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  empty: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  legend: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 4,
  },
  legendText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  legendNote: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
