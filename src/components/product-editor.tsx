import { useState } from 'react';
import {
  KeyboardAvoidingView,
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
import { Colors, Radius, Spacing } from '@/constants/theme';
import { scoreFor, type Product } from '@/data/products';
import type { ProductInput } from '@/store/nicotine-store';

type Props = {
  visible: boolean;
  /** Prodotto da modificare; undefined = nuovo prodotto. */
  product?: Product;
  onSave: (input: ProductInput) => void;
  onDelete?: () => void;
  onClose: () => void;
};

const MAX_MG_PER_PUFF = 1;
// Stesso stile dei campi delle Impostazioni: su web il bordo di focus sborderebbe.
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

function EditorBody({ product, onSave, onDelete, onClose }: Omit<Props, 'visible'>) {
  const [name, setName] = useState(product?.name ?? '');
  const [detail, setDetail] = useState(product?.detail ?? '');
  const [mgText, setMgText] = useState(product ? String(product.mgPerPuff) : '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const mg = Number(mgText.replace(',', '.'));
  const mgValid = mgText.trim() !== '' && Number.isFinite(mg) && mg > 0 && mg <= MAX_MG_PER_PUFF;
  const nameValid = name.trim().length > 0;
  const valid = mgValid && nameValid;

  const save = () => {
    if (!valid) return;
    onSave({ name: name.trim(), detail: detail.trim(), mgPerPuff: mg });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Chiudi" />
      <View style={styles.card}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{product ? 'Modifica prodotto' : 'Nuovo prodotto'}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Es. Pod alla menta"
              placeholderTextColor={Colors.textMuted}
              style={[styles.input, noWebOutline]}
              maxLength={40}
              accessibilityLabel="Nome del prodotto"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Descrizione (facoltativa)</Text>
            <TextInput
              value={detail}
              onChangeText={setDetail}
              placeholder="Es. Liquido 12 mg/ml"
              placeholderTextColor={Colors.textMuted}
              style={[styles.input, noWebOutline]}
              maxLength={40}
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
                placeholderTextColor={Colors.textMuted}
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
                : 'Nicotina assorbita in un tiro. Indicativamente: sigaretta ~0.1, svapo 20 mg/ml ~0.06.'}
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(27, 35, 64, 0.45)',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    alignSelf: 'center',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    minWidth: 0,
  },
  mgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mgInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
  },
  unit: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  help: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textMuted,
  },
  error: {
    color: Colors.danger,
  },
  primary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  secondaryText: {
    color: Colors.text,
    fontWeight: '700',
  },
  danger: {
    backgroundColor: Colors.dangerSoft,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
  dangerText: {
    color: Colors.danger,
    fontWeight: '700',
  },
  cancel: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  cancelText: {
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
