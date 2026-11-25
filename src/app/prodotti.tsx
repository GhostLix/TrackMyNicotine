import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductEditor } from '@/components/product-editor';
import { ScoreBadge } from '@/components/score-badge';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { CATEGORY_LABELS, CATEGORY_ORDER, type Category } from '@/data/nicotine-model';
import {
  CATALOG,
  formatMgPerPuff,
  SCORE_THRESHOLDS,
  scoreFor,
  type Product,
} from '@/data/products';
import { useNicotine } from '@/store/nicotine-store';

type EditorState = { open: false } | { open: true; product?: Product };

const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export default function ProdottiScreen() {
  const {
    customProducts,
    enabledProductIds,
    selectedProduct,
    toggleEnabled,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useNicotine();
  const [editor, setEditor] = useState<EditorState>({ open: false });
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Partial<Record<Category, boolean>>>({});
  const [lastWarning, setLastWarning] = useState(false);

  const enabled = useMemo(() => new Set(enabledProductIds), [enabledProductIds]);
  const q = normalize(query.trim());
  const searching = q.length > 0;
  const matches = (p: Product) => !searching || normalize(`${p.name} ${p.detail}`).includes(q);

  const closeEditor = () => setEditor({ open: false });
  const editing = editor.open ? editor.product : undefined;

  const toggle = (id: string) => {
    const ok = toggleEnabled(id);
    setLastWarning(!ok);
  };

  const renderRow = (product: Product, index: number) => {
    const checked = enabled.has(product.id);
    const inUse = product.id === selectedProduct.id;
    return (
      <Pressable
        key={product.id}
        onPress={() => toggle(product.id)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={`${product.name}, ${formatMgPerPuff(product.mgPerPuff)} milligrammi per tiro`}
        style={({ pressed }) => [styles.row, index > 0 && styles.rowDivider, pressed && styles.pressed]}>
        <View style={[styles.checkbox, checked && styles.checkboxOn]}>
          {checked && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>
        <View style={styles.rowText}>
          <View style={styles.rowTitleLine}>
            <Text style={styles.rowName} numberOfLines={1}>
              {product.name}
            </Text>
            {inUse && (
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
            <Ionicons name="pencil" size={15} color={Colors.primary} />
          </Pressable>
        )}
        <ScoreBadge score={scoreFor(product.mgPerPuff)} />
      </Pressable>
    );
  };

  const customVisible = customProducts.filter(matches);
  const sections = CATEGORY_ORDER.map((category) => {
    const all = CATALOG.filter((p) => p.category === category);
    return {
      category,
      items: all.filter(matches),
      total: all.length,
      checked: all.filter((p) => enabled.has(p.id)).length,
    };
  }).filter((s) => s.items.length > 0);
  const nothingFound = searching && customVisible.length === 0 && sections.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Prodotti</Text>
            <Text style={styles.subtitle}>Spunta quelli che usi: compaiono nella Home.</Text>
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

        <View style={styles.search}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={`Cerca tra ${CATALOG.length + customProducts.length} prodotti`}
            placeholderTextColor={Colors.textMuted}
            style={[styles.searchInput, noWebOutline]}
            accessibilityLabel="Cerca prodotto"
            returnKeyType="search"
          />
          {searching && (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Cancella ricerca">
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>

        {lastWarning && (
          <Text style={styles.warning}>Tieni almeno un prodotto spuntato per usare la Home.</Text>
        )}

        {nothingFound && (
          <Pressable
            onPress={() => setEditor({ open: true })}
            style={({ pressed }) => [styles.empty, pressed && styles.pressed]}>
            <Ionicons name="sparkles-outline" size={26} color={Colors.primary} />
            <Text style={styles.emptyTitle}>Nessun prodotto trovato</Text>
            <Text style={styles.emptyBody}>
              Aggiungilo tu: se non sai quanta nicotina contiene, l’AI può cercarlo per te.
            </Text>
          </Pressable>
        )}

        {customVisible.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>I tuoi prodotti</Text>
            <View style={styles.card}>{customVisible.map(renderRow)}</View>
          </>
        )}

        {sections.map(({ category, items, total, checked }) => {
          const expanded = searching || open[category] === true;
          return (
            <View key={category} style={styles.card}>
              <Pressable
                onPress={() => setOpen((o) => ({ ...o, [category]: !expanded }))}
                disabled={searching}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                style={({ pressed }) => [styles.categoryHeader, pressed && styles.pressed]}>
                <View style={styles.flex}>
                  <Text style={styles.categoryName}>{CATEGORY_LABELS[category]}</Text>
                  <Text style={styles.categoryMeta}>
                    {searching ? `${items.length} risultati` : `${checked} spuntati su ${total}`}
                  </Text>
                </View>
                {!searching && (
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.primary}
                  />
                )}
              </Pressable>
              {expanded && <View style={styles.categoryBody}>{items.map(renderRow)}</View>}
            </View>
          );
        })}

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
            Il punteggio considera solo la nicotina per tiro, non le altre sostanze. Le specifiche
            sono quelle dichiarate dai produttori; i mg per tiro sono stime.
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
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    ...Shadow,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  warning: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '600',
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
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  categoryMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  categoryBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 4,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
  inUse: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  inUseText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  rowDetail: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  editButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  flex: {
    flex: 1,
    minWidth: 0,
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
