import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useStyles, useTheme } from '@/theme/theme-provider';
import type { Theme } from '@/theme/themes';

const PRESETS = [5, 10, 15, 20];

type Props = {
  initial: number | null;
  confirmLabel: string;
  onConfirm: (mg: number) => void;
};

export function DailyLimitEditor({ initial, confirmLabel, onConfirm }: Props) {
  const styles = useStyles(makeStyles);
  const t = useTheme();
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
          placeholderTextColor={t.colors.textMuted}
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

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      gap: Spacing.md,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: t.colors.background,
      borderRadius: t.radius.md,
      paddingHorizontal: Spacing.md,
    },
    input: {
      flex: 1,
      minWidth: 0,
      // Su web il bordo di focus del browser sborda dal contenitore arrotondato.
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
      ...t.text(28, '800'),
      color: t.colors.text,
      paddingVertical: 12,
    },
    unit: {
      ...t.text(14, '600'),
      color: t.colors.textMuted,
    },
    presets: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    chip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: t.radius.sm,
      backgroundColor: t.colors.primarySoft,
    },
    chipActive: {
      backgroundColor: t.colors.primary,
    },
    chipText: {
      color: t.colors.primaryDark,
      ...t.weight('700'),
    },
    chipTextActive: {
      color: t.colors.onPrimary,
    },
    confirm: {
      backgroundColor: t.colors.primary,
      borderRadius: t.radius.md,
      paddingVertical: 16,
      alignItems: 'center',
    },
    confirmDisabled: {
      opacity: 0.4,
    },
    confirmText: {
      color: t.colors.onPrimary,
      ...t.text(16, '700'),
    },
  });
