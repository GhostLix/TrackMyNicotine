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

/**
 * Flusso in due passi:
 * 1. modulo con nome, tipo e — facoltativa — la nicotina per tiro;
 * 2. se la nicotina è vuota, l'AI cerca le specifiche e mostra cosa ha trovato prima di salvare.
 */
type Step =
  | { kind: 'form'; message?: string }
  | { kind: 'searching' }
  | { kind: 'review'; outcome: AiLookupOutcome };

function EditorBody({ product, onSave, onDelete, onClose }: Omit<Props, 'visible'>) {
  const styles = useStyles(makeStyles);
  const t = useTheme();
  const [name, setName] = useState(product?.name ?? '');
  const [category, setCategory] = useState<Category | null>(product?.category ?? null);
  const [mgText, setMgText] = useState(product ? String(product.mgPerPuff) : '');
  const [detail, setDetail] = useState(product?.detail ?? '');
  const [step, setStep] = useState<Step>({ kind: 'form' });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let alive = true;
    isAiLookupAvailable().then((ok) => alive && setAiAvailable(ok));
    return () => {
      alive = false;
      abortRef.current?.abort();
    };
  }, []);

  const trimmedName = name.trim();
  const mgEmpty = mgText.trim() === '';
  const mg = Number(mgText.replace(',', '.'));
  const mgValid = !mgEmpty && Number.isFinite(mg) && mg >= 0 && mg <= MAX_MG_PER_PUFF;
  const useAi = mgEmpty && aiAvailable === true;

  // Con la nicotina inserita a mano serve anche il tipo; con l'AI il tipo lo trova lei.
  const canSubmit = trimmedName !== '' && (useAi || (mgValid && category !== null));
  const missing =
    trimmedName === ''
      ? 'Scrivi il nome del prodotto.'
      : mgEmpty && aiAvailable === false
        ? 'Inserisci la nicotina per tiro: la ricerca AI qui non è disponibile.'
        : !mgEmpty && !mgValid
          ? `La nicotina per tiro deve essere tra 0 e ${MAX_MG_PER_PUFF} mg.`
          : !useAi && category === null
            ? 'Scegli il tipo di prodotto.'
            : null;

  const save = (input: ProductInput) => {
    onSave(input);
  };

  const submit = async () => {
    if (!canSubmit) return;
    if (!useAi) {
      save({ name: trimmedName, category: category!, mgPerPuff: mg, detail });
      return;
    }
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    setStep({ kind: 'searching' });
    const query = category ? `${trimmedName} (${CATEGORY_LABELS[category]})` : trimmedName;
    try {
      const outcome = await lookupNicotine(query, ctl.signal);
      if (ctl.signal.aborted) return;
      if (!outcome.result.found || outcome.mgPerPuff === null) {
        setStep({
          kind: 'form',
          message:
            'L’AI non ha trovato dati affidabili su questo prodotto. Controlla il nome oppure inserisci la nicotina a mano.',
        });
        return;
      }
      setStep({ kind: 'review', outcome });
    } catch (e) {
      if (ctl.signal.aborted) return;
      setStep({
        kind: 'form',
        message: e instanceof AiLookupError ? e.message : 'Ricerca non riuscita, riprova.',
      });
    }
  };

  const cancelSearch = () => {
    abortRef.current?.abort();
    setStep({ kind: 'form' });
  };

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>
        {step.kind === 'review' ? 'Ecco cosa ho trovato' : product ? 'Modifica prodotto' : 'Nuovo prodotto'}
      </Text>
      <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Chiudi" style={styles.close}>
        <Ionicons name="close" size={20} color={t.colors.textMuted} />
      </Pressable>
    </View>
  );

  let body: React.ReactNode;
  if (step.kind === 'searching') {
    body = (
      <View style={styles.searching}>
        <View style={styles.searchingIcon}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
        <Text style={styles.searchingTitle}>Cerco “{trimmedName}”…</Text>
        <Text style={styles.muted}>L’AI sta cercando le specifiche del prodotto. Può volerci qualche secondo.</Text>
        <Pressable onPress={cancelSearch} hitSlop={8} style={styles.textButton}>
          <Text style={styles.textButtonLabel}>Annulla</Text>
        </Pressable>
      </View>
    );
  } else if (step.kind === 'review') {
    const { result, mgPerPuff, webSearch } = step.outcome;
    const specs = specsFromResult(result)!;
    const mgFound = mgPerPuff!;
    body = (
      <>
        <View style={styles.resultCard}>
          <View style={styles.resultTop}>
            <ScoreBadge score={scoreFor(mgFound)} size="lg" />
            <View style={styles.flex}>
              <Text style={styles.resultName}>{trimmedName}</Text>
              <Text style={styles.muted}>
                {CATEGORY_LABELS[result.category]} · {describeSpecs(specs)}
              </Text>
            </View>
          </View>
          <View style={styles.resultMgRow}>
            <Text style={styles.resultMg}>≈ {formatMgPerPuff(mgFound)}</Text>
            <Text style={styles.unit}>mg di nicotina per tiro</Text>
          </View>
          {result.name !== '' && result.name.toLowerCase() !== trimmedName.toLowerCase() && (
            <Text style={styles.muted}>Riconosciuto come: {result.name}</Text>
          )}
          {result.notes !== '' && <Text style={styles.muted}>{result.notes}</Text>}
          <View style={styles.metaRow}>
            <View style={[styles.confidence, result.confidence === 'bassa' && styles.confidenceLow]}>
              <Text style={[styles.confidenceText, result.confidence === 'bassa' && styles.confidenceTextLow]}>
                Affidabilità {result.confidence}
              </Text>
            </View>
            {!webSearch && <Text style={styles.metaNote}>senza ricerca web</Text>}
          </View>
          {result.sources.map((s) => (
            <Pressable key={s.url} onPress={() => Linking.openURL(s.url)} accessibilityRole="link" style={styles.source}>
              <Ionicons name="open-outline" size={13} color={t.colors.primary} />
              <Text style={styles.sourceText} numberOfLines={1}>
                {s.title}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() =>
            save({
              name: trimmedName,
              category: result.category,
              mgPerPuff: mgFound,
              detail: describeSpecs(specs),
            })
          }
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>{product ? 'Salva modifiche' : 'Aggiungi prodotto'}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            // Riporta al modulo con i valori trovati, da correggere a mano.
            setCategory(result.category);
            setMgText(String(mgFound));
            setDetail(describeSpecs(specs));
            setStep({ kind: 'form' });
          }}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>Correggi a mano</Text>
        </Pressable>
      </>
    );
  } else {
    body = (
      <>
        <View style={styles.field}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            value={name}
            onChangeText={(v) => {
              setName(v);
              if (step.kind === 'form' && step.message) setStep({ kind: 'form' });
            }}
            placeholder="Es. Elf Bar 600 Mirtillo"
            placeholderTextColor={t.colors.textMuted}
            style={[styles.input, noWebOutline]}
            maxLength={60}
            autoFocus={!product}
            accessibilityLabel="Nome del prodotto"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            Tipo{useAi ? <Text style={styles.optional}>  facoltativo</Text> : null}
          </Text>
          <View style={styles.chips}>
            {CATEGORY_ORDER.map((c) => {
              const active = c === category;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(active ? null : c)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{CATEGORY_LABELS[c]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            Nicotina per tiro<Text style={styles.optional}>  facoltativa</Text>
          </Text>
          <View style={styles.mgRow}>
            <TextInput
              value={mgText}
              onChangeText={(v) => {
                setMgText(v);
                // Le specifiche trovate dall'AI non valgono più per un valore scritto a mano.
                setDetail('');
                if (step.kind === 'form' && step.message) setStep({ kind: 'form' });
              }}
              placeholder={aiAvailable === false ? '0.05' : 'La cerca l’AI'}
              placeholderTextColor={t.colors.textMuted}
              keyboardType="decimal-pad"
              style={[styles.input, styles.mgInput, noWebOutline]}
              accessibilityLabel="Milligrammi di nicotina per tiro"
            />
            <Text style={styles.unit}>mg</Text>
            {mgValid && <ScoreBadge score={scoreFor(mg)} />}
          </View>
          <Text style={styles.help}>
            {aiAvailable === false
              ? 'Indicativamente: sigaretta ~0.1, usa e getta 20 mg/ml ~0.04.'
              : 'Non la sai? Lasciala vuota: quando salvi la cerca l’AI.'}
          </Text>
        </View>

        {step.message && (
          <View style={styles.notice}>
            <Ionicons name="information-circle" size={18} color={t.colors.danger} />
            <Text style={styles.noticeText}>{step.message}</Text>
          </View>
        )}

        <Pressable
          onPress={submit}
          disabled={!canSubmit}
          accessibilityRole="button"
          style={({ pressed }) => [styles.primary, !canSubmit && styles.disabled, pressed && styles.pressed]}>
          {useAi && <Ionicons name="sparkles" size={17} color={t.colors.onPrimary} />}
          <Text style={styles.primaryText}>
            {useAi ? 'Aggiungi e cerca con l’AI' : product ? 'Salva modifiche' : 'Aggiungi prodotto'}
          </Text>
        </Pressable>
        {missing && trimmedName !== '' && <Text style={styles.missing}>{missing}</Text>}

        {onDelete &&
          (confirmDelete ? (
            <View style={styles.confirmRow}>
              <Text style={[styles.muted, styles.flex]}>Eliminare questo prodotto?</Text>
              <Pressable onPress={() => setConfirmDelete(false)} hitSlop={8} style={styles.textButton}>
                <Text style={styles.textButtonLabel}>No</Text>
              </Pressable>
              <Pressable onPress={onDelete} hitSlop={8} style={styles.textButton}>
                <Text style={[styles.textButtonLabel, styles.dangerLabel]}>Sì, elimina</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setConfirmDelete(true)} hitSlop={8} style={styles.textButton}>
              <Text style={[styles.textButtonLabel, styles.dangerLabel]}>Elimina prodotto</Text>
            </Pressable>
          ))}
      </>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Chiudi" />
      <View style={styles.card}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {header}
          {body}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
      gap: Spacing.md + 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    title: {
      ...t.text(22, '800'),
      color: t.colors.text,
      flex: 1,
    },
    close: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: t.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    field: {
      gap: 8,
    },
    label: {
      ...t.text(14, '700'),
      color: t.colors.text,
    },
    optional: {
      ...t.text(12, '500'),
      color: t.colors.textMuted,
    },
    input: {
      ...t.text(16, '600'),
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: 14,
      color: t.colors.text,
      minWidth: 0,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: t.button.radius,
      backgroundColor: t.colors.surface,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    chipActive: {
      backgroundColor: t.colors.primarySoft,
      borderColor: t.colors.primary,
    },
    chipText: {
      ...t.text(13, '600'),
      color: t.colors.text,
    },
    chipTextActive: {
      color: t.colors.primaryDark,
    },
    mgRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    mgInput: {
      flex: 1,
      ...t.text(18, '700'),
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
    notice: {
      flexDirection: 'row',
      gap: 8,
      padding: 12,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.dangerSoft,
    },
    noticeText: {
      ...t.text(13, '500'),
      lineHeight: 18,
      color: t.colors.text,
      flex: 1,
    },
    primary: {
      flexDirection: 'row',
      gap: 8,
      backgroundColor: t.colors.primary,
      borderRadius: t.button.radius,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryText: {
      ...t.text(16, '700'),
      ...t.button.label,
      color: t.colors.onPrimary,
    },
    secondary: {
      borderRadius: t.button.radius,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: t.colors.surface,
      marginTop: -6,
    },
    secondaryText: {
      ...t.text(15, '700'),
      ...t.button.label,
      color: t.colors.text,
    },
    disabled: {
      opacity: 0.4,
    },
    pressed: {
      opacity: 0.75,
    },
    missing: {
      ...t.text(12, '500'),
      color: t.colors.textMuted,
      textAlign: 'center',
      marginTop: -8,
    },
    textButton: {
      alignSelf: 'center',
      paddingVertical: 4,
      paddingHorizontal: 6,
    },
    textButtonLabel: {
      ...t.text(14, '700'),
      color: t.colors.textMuted,
    },
    dangerLabel: {
      color: t.colors.danger,
    },
    confirmRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    flex: {
      flex: 1,
      minWidth: 0,
    },
    muted: {
      ...t.text(13, '400'),
      lineHeight: 18,
      color: t.colors.textMuted,
    },
    searching: {
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.lg,
    },
    searchingIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: t.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    searchingTitle: {
      ...t.text(17, '700'),
      color: t.colors.text,
      textAlign: 'center',
    },
    resultCard: {
      gap: 10,
      padding: Spacing.md,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.surface,
    },
    resultTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    resultName: {
      ...t.text(17, '700'),
      color: t.colors.text,
    },
    resultMgRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
    },
    resultMg: {
      ...t.text(30, '800'),
      color: t.colors.text,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    confidence: {
      backgroundColor: t.colors.primarySoft,
      borderRadius: t.radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    confidenceLow: {
      backgroundColor: t.colors.dangerSoft,
    },
    confidenceText: {
      ...t.text(12, '700'),
      color: t.colors.primaryDark,
    },
    confidenceTextLow: {
      color: t.colors.danger,
    },
    metaNote: {
      ...t.text(12, '400'),
      color: t.colors.textMuted,
      fontStyle: 'italic',
    },
    source: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    sourceText: {
      ...t.text(12, '500'),
      color: t.colors.primary,
      flex: 1,
    },
  });
