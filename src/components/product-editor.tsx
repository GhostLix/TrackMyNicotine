import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScoreBadge } from '@/components/score-badge';
import { Spacing } from '@/constants/theme';
import { CATEGORY_LABELS, CATEGORY_ORDER, describeSpecs, type Category } from '@/data/nicotine-model';
import { formatMgPerPuff, scoreFor, type Product } from '@/data/products';
import {
  AiLookupError,
  isAiLookupAvailable,
  lookupNicotine,
  specsFromResult,
  type AiLookupOutcome,
} from '@/lib/ai-lookup';
import type { ProductInput } from '@/store/nicotine-store';
import { useStyles, useTheme } from '@/theme/theme-provider';
import type { Theme } from '@/theme/themes';

type Props = {
  visible: boolean;
  /** Prodotto da modificare; undefined = nuovo prodotto. */
  product?: Product;
  onSave: (input: ProductInput) => void;
  onDelete?: () => void;
  onClose: () => void;
};

const MAX_MG_PER_PUFF = 1;
// Su web il bordo di focus del browser sborderebbe dai campi arrotondati.
const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

export function ProductEditor({ visible, product, onSave, onDelete, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* key: ogni apertura riparte dai valori del prodotto scelto */}
      {visible && (
        <EditorBody
          key={product?.id ?? 'new'}
          product={product}
          onSave={onSave}
          onDelete={onDelete}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

type AiState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; outcome: AiLookupOutcome }
  | { status: 'error'; message: string };

function EditorBody({ product, onSave, onDelete, onClose }: Omit<Props, 'visible'>) {
  const styles = useStyles(makeStyles);
  const t = useTheme();
  const [name, setName] = useState(product?.name ?? '');
  const [detail, setDetail] = useState(product?.detail ?? '');
  const [category, setCategory] = useState<Category>(product?.category ?? 'usa_e_getta');
  const [mgText, setMgText] = useState(product ? String(product.mgPerPuff) : '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [aiQuery, setAiQuery] = useState(product?.name ?? '');
  const [ai, setAi] = useState<AiState>({ status: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let alive = true;
    isAiLookupAvailable().then((ok) => alive && setAiAvailable(ok));
    return () => {
      alive = false;
      abortRef.current?.abort();
    };
  }, []);

  const mg = Number(mgText.replace(',', '.'));
  const mgValid = mgText.trim() !== '' && Number.isFinite(mg) && mg >= 0 && mg <= MAX_MG_PER_PUFF;
  const nameValid = name.trim().length > 0;
  const valid = mgValid && nameValid;

  const save = () => {
    if (!valid) return;
    onSave({ name: name.trim(), detail: detail.trim(), mgPerPuff: mg, category });
  };

  const askAi = async () => {
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    setAi({ status: 'loading' });
    try {
      const outcome = await lookupNicotine(aiQuery, ctl.signal);
      if (!ctl.signal.aborted) setAi({ status: 'done', outcome });
    } catch (e) {
      if (ctl.signal.aborted) return;
      setAi({
        status: 'error',
        message: e instanceof AiLookupError ? e.message : 'Ricerca non riuscita, riprova.',
      });
    }
  };

  const applyAi = (outcome: AiLookupOutcome) => {
    const specs = specsFromResult(outcome.result);
    if (!specs || outcome.mgPerPuff === null) return;
    setName(outcome.result.name || aiQuery.trim());
    setCategory(outcome.result.category);
    setDetail(describeSpecs(specs));
    setMgText(String(outcome.mgPerPuff));
    setAi({ status: 'idle' });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Chiudi" />
      <View style={styles.card}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{product ? 'Modifica prodotto' : 'Nuovo prodotto'}</Text>

          {aiAvailable !== false && (
            <View style={styles.aiBox}>
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={16} color={t.colors.primary} />
                <Text style={styles.aiTitle}>Non sai quanta nicotina contiene?</Text>
              </View>
              <Text style={styles.aiBody}>Scrivi il nome del prodotto: l’AI cerca le specifiche per te.</Text>
              <View style={styles.aiRow}>
                <TextInput
                  value={aiQuery}
                  onChangeText={setAiQuery}
                  placeholder="Es. Elf Bar 600 mirtillo"
                  placeholderTextColor={t.colors.textMuted}
                  style={[styles.input, styles.flex, noWebOutline]}
                  maxLength={120}
                  returnKeyType="search"
                  onSubmitEditing={askAi}
                  accessibilityLabel="Prodotto da cercare con l'AI"
                />
                <Pressable
                  onPress={askAi}
                  disabled={aiQuery.trim() === '' || ai.status === 'loading' || aiAvailable === null}
                  accessibilityRole="button"
                  accessibilityLabel="Cerca con l'AI"
                  style={({ pressed }) => [
                    styles.aiButton,
                    (aiQuery.trim() === '' || ai.status === 'loading' || aiAvailable === null) &&
                      styles.disabled,
                    pressed && styles.pressed,
                  ]}>
                  {ai.status === 'loading' ? (
                    <ActivityIndicator size="small" color={t.colors.onPrimary} />
                  ) : (
                    <Text style={styles.aiButtonText}>Cerca</Text>
                  )}
                </Pressable>
              </View>

              {ai.status === 'loading' && (
                <Text style={styles.aiBody}>Sto cercando… può volerci qualche secondo.</Text>
              )}
              {ai.status === 'error' && <Text style={[styles.aiBody, styles.error]}>{ai.message}</Text>}
              {ai.status === 'done' && <AiResultCard outcome={ai.outcome} onApply={applyAi} />}
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Es. Pod alla menta"
              placeholderTextColor={t.colors.textMuted}
              style={[styles.input, noWebOutline]}
              maxLength={60}
              accessibilityLabel="Nome del prodotto"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tipo</Text>
            <View style={styles.chips}>
              {CATEGORY_ORDER.map((c) => {
                const active = c === category;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {CATEGORY_LABELS[c]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Descrizione (facoltativa)</Text>
            <TextInput
              value={detail}
              onChangeText={setDetail}
              placeholder="Es. 12 mg/ml"
              placeholderTextColor={t.colors.textMuted}
              style={[styles.input, noWebOutline]}
              maxLength={60}
              accessibilityLabel="Descrizione del prodotto"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nicotina per tiro</Text>
            <View style={styles.mgRow}>
              <TextInput
                value={mgText}
                onChangeText={setMgText}
                placeholder="0.05"
                placeholderTextColor={t.colors.textMuted}
                keyboardType="decimal-pad"
                style={[styles.input, styles.mgInput, noWebOutline]}
                accessibilityLabel="Milligrammi di nicotina per tiro"
              />
              <Text style={styles.unit}>mg/tiro</Text>
              {mgValid && <ScoreBadge score={scoreFor(mg)} />}
            </View>
            <Text style={[styles.help, mgText !== '' && !mgValid && styles.error]}>
              {mgText !== '' && !mgValid
                ? `Inserisci un valore tra 0 e ${MAX_MG_PER_PUFF} mg.`
                : 'Nicotina assorbita in un tiro. Indicativamente: sigaretta ~0.1, usa e getta 20 mg/ml ~0.04.'}
            </Text>
          </View>

          <Pressable
            onPress={save}
            disabled={!valid}
            style={({ pressed }) => [styles.primary, !valid && styles.disabled, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>{product ? 'Salva modifiche' : 'Aggiungi prodotto'}</Text>
          </Pressable>

          {onDelete &&
            (confirmDelete ? (
              <View style={styles.confirmRow}>
                <Pressable
                  onPress={() => setConfirmDelete(false)}
                  style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
                  <Text style={styles.secondaryText}>Annulla</Text>
                </Pressable>
                <Pressable
                  onPress={onDelete}
                  style={({ pressed }) => [styles.danger, styles.flex, pressed && styles.pressed]}>
                  <Text style={styles.dangerText}>Conferma eliminazione</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setConfirmDelete(true)}
                style={({ pressed }) => [styles.danger, pressed && styles.pressed]}>
                <Text style={styles.dangerText}>Elimina prodotto</Text>
              </Pressable>
            ))}

          <Pressable onPress={onClose} hitSlop={8} style={styles.cancel}>
            <Text style={styles.cancelText}>Chiudi</Text>
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function AiResultCard({
  outcome,
  onApply,
}: {
  outcome: AiLookupOutcome;
  onApply: (o: AiLookupOutcome) => void;
}) {
  const styles = useStyles(makeStyles);
  const t = useTheme();
  const { result, mgPerPuff, webSearch } = outcome;
  const specs = specsFromResult(result);

  if (!result.found) {
    return (
      <View style={styles.aiResult}>
        <Text style={styles.aiResultName}>Prodotto non trovato</Text>
        <Text style={styles.aiBody}>
          {result.notes || 'Prova con il nome esatto riportato sulla confezione.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.aiResult}>
      <View style={styles.aiResultTop}>
        <View style={styles.flex}>
          <Text style={styles.aiResultName}>{result.name}</Text>
          <Text style={styles.aiBody}>
            {CATEGORY_LABELS[result.category]}
            {specs ? ` · ${describeSpecs(specs)}` : ''}
          </Text>
        </View>
        {mgPerPuff !== null && <ScoreBadge score={scoreFor(mgPerPuff)} />}
      </View>

      {mgPerPuff !== null ? (
        <Text style={styles.aiMg}>
          ≈ {formatMgPerPuff(mgPerPuff)} <Text style={styles.unit}>mg per tiro (stima)</Text>
        </Text>
      ) : (
        <Text style={[styles.aiBody, styles.error]}>
          Specifiche insufficienti per stimare la nicotina per tiro.
        </Text>
      )}

      {result.notes !== '' && <Text style={styles.aiBody}>{result.notes}</Text>}
      <Text style={styles.aiMeta}>
        Affidabilità {result.confidence}
        {webSearch ? '' : ' · senza ricerca web, dalla conoscenza dell’AI'}
      </Text>

      {result.sources.map((s) => (
        <Pressable
          key={s.url}
          onPress={() => Linking.openURL(s.url)}
          accessibilityRole="link"
          style={styles.source}>
          <Ionicons name="open-outline" size={13} color={t.colors.primary} />
          <Text style={styles.sourceText} numberOfLines={1}>
            {s.title}
          </Text>
        </Pressable>
      ))}

      {mgPerPuff !== null && (
        <Pressable
          onPress={() => onApply(outcome)}
          style={({ pressed }) => [styles.applyButton, pressed && styles.pressed]}>
          <Text style={styles.applyText}>Usa questi valori</Text>
        </Pressable>
      )}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: t.colors.backdrop,
      justifyContent: 'center',
      padding: Spacing.md,
    },
    card: {
      backgroundColor: t.colors.card,
      borderRadius: t.radius.lg,
      width: '100%',
      maxWidth: 440,
      maxHeight: '92%',
      alignSelf: 'center',
    },
    content: {
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    title: {
      ...t.text(20, '800'),
      color: t.colors.text,
    },
    aiBox: {
      backgroundColor: t.colors.primarySoft,
      borderRadius: t.radius.md,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    aiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    aiTitle: {
      ...t.text(14, '700'),
      color: t.colors.primaryDark,
    },
    aiBody: {
      ...t.text(12, '400'),
      lineHeight: 17,
      color: t.colors.textMuted,
    },
    aiRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    aiButton: {
      backgroundColor: t.colors.primary,
      borderRadius: t.radius.md,
      paddingHorizontal: Spacing.md,
      justifyContent: 'center',
      minWidth: 72,
      alignItems: 'center',
    },
    aiButtonText: {
      color: t.colors.onPrimary,
      ...t.weight('700'),
    },
    aiResult: {
      backgroundColor: t.colors.card,
      borderRadius: t.radius.md,
      padding: Spacing.md,
      gap: 6,
    },
    aiResultTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    aiResultName: {
      ...t.text(15, '700'),
      color: t.colors.text,
    },
    aiMg: {
      ...t.text(20, '800'),
      color: t.colors.text,
    },
    aiMeta: {
      ...t.text(11, '400'),
      color: t.colors.textMuted,
      fontStyle: 'italic',
    },
    source: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    sourceText: {
      flex: 1,
      ...t.text(12, '400'),
      color: t.colors.primary,
    },
    applyButton: {
      marginTop: 4,
      borderRadius: t.radius.sm,
      borderWidth: 1.5,
      borderColor: t.colors.primary,
      paddingVertical: 10,
      alignItems: 'center',
    },
    applyText: {
      color: t.colors.primary,
      ...t.weight('700'),
    },
    field: {
      gap: 6,
    },
    label: {
      ...t.text(12, '700'),
      color: t.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: t.colors.background,
      borderRadius: t.radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      ...t.text(16, '600'),
      color: t.colors.text,
      minWidth: 0,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.background,
    },
    chipActive: {
      backgroundColor: t.colors.primary,
    },
    chipText: {
      ...t.text(13, '600'),
      color: t.colors.text,
    },
    chipTextActive: {
      color: t.colors.onPrimary,
    },
    mgRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    mgInput: {
      flex: 1,
      ...t.text(20, '800'),
    },
    unit: {
      ...t.text(14, '600'),
      color: t.colors.textMuted,
    },
    help: {
      ...t.text(12, '400'),
      lineHeight: 17,
      color: t.colors.textMuted,
    },
    error: {
      color: t.colors.danger,
    },
    primary: {
      backgroundColor: t.colors.primary,
      borderRadius: t.radius.md,
      paddingVertical: 16,
      alignItems: 'center',
    },
    primaryText: {
      color: t.colors.onPrimary,
      ...t.text(16, '700'),
    },
    disabled: {
      opacity: 0.4,
    },
    pressed: {
      opacity: 0.75,
    },
    confirmRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    secondary: {
      backgroundColor: t.colors.background,
      borderRadius: t.radius.md,
      paddingVertical: 14,
      paddingHorizontal: Spacing.md,
      alignItems: 'center',
    },
    secondaryText: {
      color: t.colors.text,
      ...t.weight('700'),
    },
    danger: {
      backgroundColor: t.colors.dangerSoft,
      borderRadius: t.radius.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    flex: {
      flex: 1,
      minWidth: 0,
    },
    dangerText: {
      color: t.colors.danger,
      ...t.weight('700'),
    },
    cancel: {
      alignSelf: 'center',
      paddingVertical: 4,
    },
    cancelText: {
      color: t.colors.textMuted,
      ...t.weight('600'),
    },
  });
