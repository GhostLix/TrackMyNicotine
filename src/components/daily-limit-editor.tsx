import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

const PRESETS = [5, 10, 15, 20];

type Props = {
  initial: number | null;
  confirmLabel: string;
  onConfirm: (mg: number) => void;
};

export function DailyLimitEditor({ initial, confirmLabel, onConfirm }: Props) {
  const [text, setText] = useState(initial != null ? String(initial) : '');
  const value = Number(text.replace(',', '.'));
  const valid = Number.isFinite(value) && value > 0 && value <= 200;

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          keyboardType="decimal-pad"
          placeholder="10"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          accessibilityLabel="Limite giornaliero in milligrammi"
        />
        <Text style={styles.unit}>mg / giorno</Text>
      </View>

      <View style={styles.presets}>
        {PRESETS.map((p) => {
          const active = value === p;
          return (
            <Pressable
              key={p}
              onPress={() => setText(String(p))}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{p} mg</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        disabled={!valid}
        onPress={() => onConfirm(value)}
        style={({ pressed }) => [
          styles.confirm,
          !valid && styles.confirmDisabled,
          pressed && { opacity: 0.85 },
        ]}>
        <Text style={styles.confirmText}>{confirmLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    minWidth: 0,
    // Su web il bordo di focus del browser sborda dal contenitore arrotondato.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    paddingVertical: 12,
  },
  unit: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  presets: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primarySoft,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  confirm: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
