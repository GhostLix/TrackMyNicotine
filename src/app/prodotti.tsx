import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { DraggableList } from '@/components/draggable-list';
import { ProductEditor } from '@/components/product-editor';
import { ScoreBadge } from '@/components/score-badge';
import { Spacing } from '@/constants/theme';
import { CATEGORY_LABELS, CATEGORY_ORDER, type Category } from '@/data/nicotine-model';
import {
  CATALOG,
  formatMgPerPuff,
  SCORE_THRESHOLDS,
  scoreFor,
  type Product,
  type Score,
} from '@/data/products';
import { useNicotine } from '@/store/nicotine-store';
import { useDevSettings, useStyles, useTheme } from '@/theme/theme-provider';
import type { Theme } from '@/theme/themes';

type EditorState = { open: false } | { open: true; product?: Product };

const DEFAULT_ROW_HEIGHT = 64;

const SCORE_LABELS: Record<Score, string> = {
  A: 'Nicotina molto bassa',
  B: 'Nicotina bassa',
  C: 'Nicotina media',
  D: 'Nicotina alta',
  E: 'Nicotina molto alta',
};

const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export default function ProdottiScreen() {
  const styles = useStyles(makeStyles);
  const t = useTheme();
  const {
    customProducts,
    enabledProducts,
    enabledProductIds,
    selectedProduct,
    toggleEnabled,
    reorderEnabled,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useNicotine();
  const [editor, setEditor] = useState<EditorState>({ open: false });
  const [query, setQuery] = useState('');
  const [lastWarning, setLastWarning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const { dev } = useDevSettings();
  const layout = dev.products;

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

  const renderDefaultRow = (
    product: Product,
    { index, isDragging, dragHandleProps }: { index: number; isDragging: boolean; dragHandleProps: object },
  ) => {
    const inUse = product.id === selectedProduct.id;
    const onlyOne = enabledProducts.length === 1;
    return (
      <View style={[styles.row, styles.defaultRow, index > 0 && !isDragging && styles.rowDivider]}>
        <View
          {...dragHandleProps}
          accessibilityLabel={`Trascina per riordinare ${product.name}`}
          style={[styles.handle, (dragHandleProps as { style?: object }).style]}>
          <Ionicons
            name="reorder-three"
            size={26}
            color={isDragging ? t.colors.primary : t.colors.textMuted}
          />
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
            {formatMgPerPuff(product.mgPerPuff)} mg/tiro
          </Text>
        </View>
        <ScoreBadge score={scoreFor(product.mgPerPuff)} />
        <IconButton
          icon="close"
          label={`Rimuovi ${product.name} dai predefiniti`}
          disabled={onlyOne}
          danger
          onPress={() => toggle(product.id)}
        />
      </View>
    );
  };

  const renderRow = (product: Product, index: number) => {
    const checked = enabled.has(product.id);
    return (
      <Pressable
        key={product.id}
        onPress={() => toggle(product.id)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={`${product.name}, ${formatMgPerPuff(product.mgPerPuff)} milligrammi per tiro`}
        style={({ pressed }) => [styles.row, index > 0 && styles.rowDivider, pressed && styles.pressed]}>
        <View style={[styles.checkbox, checked && styles.checkboxOn]}>
          {checked && <Ionicons name="checkmark" size={16} color={t.colors.onPrimary} />}
        </View>
        <View style={styles.rowText}>
          <View style={styles.rowTitleLine}>
            <Text style={styles.rowName} numberOfLines={1}>
              {product.name}
            </Text>
            {product.custom && (
              <View style={styles.inUse}>
                <Text style={styles.inUseText}>Tuo</Text>
              </View>
            )}
          </View>
          <Text style={styles.rowDetail} numberOfLines={1}>
            {layout === 3 ? `${CATEGORY_LABELS[product.category]} · ` : ''}
            {product.detail && layout !== 3 ? `${product.detail} · ` : ''}
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
            <Ionicons name="pencil" size={15} color={t.colors.primary} />
          </Pressable>
        )}
        <ScoreBadge score={scoreFor(product.mgPerPuff)} />
      </Pressable>
    );
  };

  // Tutti i prodotti (catalogo + tuoi) in ordine di nicotina crescente, raggruppati secondo la variante scelta.
  const all = [...customProducts, ...CATALOG]
    .filter(matches)
    .sort((x, y) => x.mgPerPuff - y.mgPerPuff || x.name.localeCompare(y.name, 'it'));
  const countByCategory = (c: Category) => all.filter((p) => p.category === c).length;
  const sections: { key: string; title: ReactNode; items: Product[] }[] =
    layout === 3
      ? SCORE_THRESHOLDS.map(({ score }) => ({
          key: score,
          title: (
            <View style={styles.scoreTitle}>
              <ScoreBadge score={score} />
              <Text style={styles.categoryName}>{SCORE_LABELS[score]}</Text>
            </View>
          ),
          items: all.filter((p) => scoreFor(p.mgPerPuff) === score),
        }))
      : CATEGORY_ORDER.filter((c) => layout !== 2 || filter === 'all' || filter === c).map((c) => ({
          key: c,
          title: <Text style={styles.categoryName}>{CATEGORY_LABELS[c]}</Text>,
          items: all.filter((p) => p.category === c),
        }));
  const visibleSections = sections.filter((x) => x.items.length > 0);
  const nothingFound = visibleSections.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!dragging}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Prodotti</Text>
            <Text style={styles.subtitle}>Scegli e ordina i prodotti che usi.</Text>
          </View>
          <Pressable
            onPress={() => setEditor({ open: true })}
            accessibilityRole="button"
            accessibilityLabel="Aggiungi prodotto"
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Ionicons name="add" size={20} color={t.colors.onPrimary} />
            <Text style={styles.addText}>Aggiungi</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Predefiniti</Text>
        <Text style={styles.sectionHint}>Tieni premuto ≡ e trascina per cambiare l’ordine della tendina nella Home.</Text>
        <View style={styles.card}>
          <DraggableList
            items={enabledProducts}
            keyOf={(p) => p.id}
            rowHeight={DEFAULT_ROW_HEIGHT}
            renderRow={renderDefaultRow}
            onReorder={reorderEnabled}
            onDragActiveChange={setDragging}
          />
        </View>
        {lastWarning && (
          <Text style={styles.warning}>Tieni almeno un prodotto tra i predefiniti.</Text>
        )}

        <Text style={[styles.sectionTitle, styles.sectionGap]}>Tutti i prodotti</Text>
        <Text style={styles.sectionHint}>Spunta un prodotto per aggiungerlo ai predefiniti.</Text>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={t.colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={`Cerca tra ${CATALOG.length + customProducts.length} prodotti`}
            placeholderTextColor={t.colors.textMuted}
            style={[styles.searchInput, noWebOutline]}
            accessibilityLabel="Cerca prodotto"
            returnKeyType="search"
          />
          {searching && (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Cancella ricerca">
              <Ionicons name="close-circle" size={18} color={t.colors.textMuted} />
            </Pressable>
          )}
        </View>

        {layout === 2 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}>
            {(['all', ...CATEGORY_ORDER] as const).map((c) => {
              const active = filter === c;
              const count = c === 'all' ? all.length : countByCategory(c);
              return (
                <Pressable
                  key={c}
                  onPress={() => setFilter(c)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {c === 'all' ? 'Tutti' : CATEGORY_LABELS[c]}
                  </Text>
                  <Text style={[styles.chipCount, active && styles.chipTextActive]}>{count}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {nothingFound && (
          <Pressable
            onPress={() => setEditor({ open: true })}
            style={({ pressed }) => [styles.empty, pressed && styles.pressed]}>
            <Ionicons name="sparkles-outline" size={26} color={t.colors.primary} />
            <Text style={styles.emptyTitle}>Nessun prodotto trovato</Text>
            <Text style={styles.emptyBody}>
              Aggiungilo tu: se non sai quanta nicotina contiene, l’AI può cercarlo per te.
            </Text>
          </Pressable>
        )}

        {visibleSections.map(({ key, title, items }) => (
          <View key={key} style={styles.group}>
            {title}
            <View style={styles.card}>{items.map(renderRow)}</View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, styles.sectionGap]}>Come si calcola il punteggio</Text>
        <View style={[styles.card, styles.legend]}>
          {SCORE_THRESHOLDS.map((th, i) => {
            const from = i === 0 ? 0 : SCORE_THRESHOLDS[i - 1].maxMg;
            const range =
              th.maxMg === Infinity
                ? `oltre ${formatMgPerPuff(from)} mg/tiro`
                : i === 0
                  ? `fino a ${formatMgPerPuff(th.maxMg)} mg/tiro`
                  : `${formatMgPerPuff(from)} – ${formatMgPerPuff(th.maxMg)} mg/tiro`;
            return (
              <View key={th.score} style={styles.legendRow}>
                <ScoreBadge score={th.score} />
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

function IconButton({
  icon,
  label,
  disabled,
  danger,
  onPress,
}: {
  icon: 'close';
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onPress: () => void;
}) {
  const styles = useStyles(makeStyles);
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.iconButton,
        danger && styles.iconButtonDanger,
        disabled && styles.iconButtonDisabled,
        pressed && styles.pressed,
      ]}>
      <Ionicons name={icon} size={16} color={danger ? t.colors.danger : t.colors.primary} />
    </Pressable>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: t.colors.background,
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
      ...t.text(26, '800'),
      color: t.colors.text,
    },
    subtitle: {
      ...t.text(13, '400'),
      color: t.colors.textMuted,
      marginTop: 2,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: t.colors.primary,
      borderRadius: t.button.radius,
      paddingVertical: 10,
      paddingLeft: 12,
      paddingRight: 16,
    },
    addText: {
      color: t.colors.onPrimary,
      ...t.text(14, '700'),
      ...t.button.label,
    },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: t.colors.card,
      borderRadius: t.radius.md,
      paddingHorizontal: Spacing.md,
      ...t.elevation,
    },
    searchInput: {
      flex: 1,
      minWidth: 0,
      paddingVertical: 12,
      ...t.text(15, '400'),
      color: t.colors.text,
    },
    warning: {
      ...t.text(13, '600'),
      color: t.colors.danger,
    },
    sectionTitle: {
      ...t.text(12, '700'),
      color: t.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: Spacing.sm,
    },
    card: {
      backgroundColor: t.colors.card,
      borderRadius: t.radius.lg,
      overflow: 'hidden',
      ...t.elevation,
    },
    sectionHint: {
      ...t.text(13, '400'),
      color: t.colors.textMuted,
      marginTop: -6,
    },
    sectionGap: {
      marginTop: Spacing.lg,
    },
    group: {
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },
    categoryName: {
      ...t.text(18, '800'),
      color: t.colors.text,
      paddingHorizontal: 4,
    },
    scoreTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: 4,
    },
    chips: {
      gap: Spacing.sm,
      paddingVertical: 2,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.card,
      ...(t.shadow ? {} : { borderWidth: 1, borderColor: t.colors.border }),
    },
    chipActive: {
      backgroundColor: t.colors.primary,
    },
    chipText: {
      ...t.text(13, '700'),
      color: t.colors.text,
    },
    chipCount: {
      ...t.text(12, '600'),
      color: t.colors.textMuted,
    },
    chipTextActive: {
      color: t.colors.onPrimary,
    },
    defaultRow: {
      height: DEFAULT_ROW_HEIGHT,
      paddingVertical: 0,
      paddingLeft: Spacing.sm,
    },
    handle: {
      width: 40,
      height: DEFAULT_ROW_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconButton: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: t.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconButtonDanger: {
      backgroundColor: t.colors.dangerSoft,
    },
    iconButtonDisabled: {
      opacity: 0.3,
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
      borderTopColor: t.colors.border,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: t.colors.control,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxOn: {
      backgroundColor: t.colors.primary,
      borderColor: t.colors.primary,
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
      ...t.text(15, '600'),
      color: t.colors.text,
    },
    inUse: {
      backgroundColor: t.colors.primarySoft,
      borderRadius: t.radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    inUseText: {
      color: t.colors.primaryDark,
      ...t.text(11, '700'),
    },
    rowDetail: {
      ...t.text(12, '400'),
      color: t.colors.textMuted,
      marginTop: 2,
    },
    editButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: t.colors.primarySoft,
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
      backgroundColor: t.colors.card,
      borderRadius: t.radius.lg,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: t.colors.border,
      padding: Spacing.lg,
      alignItems: 'center',
      gap: 6,
    },
    emptyTitle: {
      ...t.text(15, '700'),
      color: t.colors.text,
    },
    emptyBody: {
      ...t.text(13, '400'),
      lineHeight: 18,
      color: t.colors.textMuted,
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
      ...t.text(14, '500'),
      color: t.colors.text,
    },
    legendNote: {
      ...t.text(12, '400'),
      lineHeight: 17,
      color: t.colors.textMuted,
      marginTop: Spacing.xs,
    },
  });
