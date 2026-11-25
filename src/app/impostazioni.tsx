import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DailyLimitEditor } from '@/components/daily-limit-editor';
import { Spacing } from '@/constants/theme';
import { useNicotine } from '@/store/nicotine-store';
import { useAppearance, useStyles, useTheme } from '@/theme/theme-provider';
import type { Appearance, Theme } from '@/theme/themes';

type IconName = 'flag-outline' | 'contrast-outline' | 'trash-outline';

const APPEARANCES: { id: Appearance; label: string; icon: 'sunny' | 'moon' }[] = [
  { id: 'giorno', label: 'Giorno', icon: 'sunny' },
  { id: 'notte', label: 'Notte', icon: 'moon' },
];

export default function ImpostazioniScreen() {
  const styles = useStyles(makeStyles);
  const t = useTheme();
  const { dailyLimitMg, setDailyLimit, resetAll, loaded } = useNicotine();
  const { appearance, setAppearance } = useAppearance();
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Impostazioni</Text>

        <View style={styles.card}>
          <SectionHeader icon="contrast-outline" title="Aspetto" />
          <View style={styles.segments}>
            {APPEARANCES.map(({ id, label, icon }) => {
              const active = id === appearance;
              return (
                <Pressable
                  key={id}
                  onPress={() => setAppearance(id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  style={({ pressed }) => [styles.segment, active && styles.segmentActive, pressed && styles.pressed]}>
                  <Ionicons
                    name={active ? icon : (`${icon}-outline` as const)}
                    size={20}
                    color={active ? t.colors.primary : t.colors.textMuted}
                  />
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <SectionHeader icon="flag-outline" title="Limite giornaliero" />
          <Text style={styles.cardBody}>
            Quando lo superi, l’anello nella Home inizia a riempirsi di rosso.
          </Text>
          {loaded && (
            <DailyLimitEditor
              key={dailyLimitMg ?? 'none'}
              initial={dailyLimitMg}
              confirmLabel={saved ? 'Salvato ✓' : 'Salva'}
              onConfirm={(mg) => {
                setDailyLimit(mg);
                setSaved(true);
                setTimeout(() => setSaved(false), 1500);
              }}
            />
          )}
        </View>

        <View style={styles.card}>
          <SectionHeader icon="trash-outline" title="Dati" />
          {confirmReset ? (
            <>
              <Text style={styles.cardBody}>
                Verranno cancellati tutti i tiri, i prodotti creati e il limite giornaliero.
              </Text>
              <View style={styles.confirmRow}>
                <Pressable
                  onPress={() => setConfirmReset(false)}
                  style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
                  <Text style={styles.secondaryText}>Annulla</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    resetAll();
                    setConfirmReset(false);
                  }}
                  style={({ pressed }) => [styles.danger, styles.flex, pressed && styles.pressed]}>
                  <Text style={styles.dangerText}>Sì, cancella tutto</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Pressable
              onPress={() => setConfirmReset(true)}
              style={({ pressed }) => [styles.danger, pressed && styles.pressed]}>
              <Text style={styles.dangerText}>Cancella tutti i dati</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.disclaimer}>
          I valori di nicotina sono stime indicative e non costituiscono un parere medico.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ icon, title }: { icon: IconName; title: string }) {
  const styles = useStyles(makeStyles);
  const t = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={16} color={t.colors.primary} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
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
      gap: Spacing.md,
      width: '100%',
      maxWidth: 520,
      alignSelf: 'center',
    },
    title: {
      ...t.text(28, '800'),
      color: t.colors.text,
      marginBottom: Spacing.xs,
    },
    card: {
      backgroundColor: t.colors.card,
      borderRadius: t.radius.lg,
      padding: Spacing.md,
      gap: Spacing.sm + 4,
      ...t.elevation,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    sectionIcon: {
      width: 30,
      height: 30,
      borderRadius: 10,
      backgroundColor: t.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: {
      ...t.text(17, '700'),
      color: t.colors.text,
    },
    cardBody: {
      ...t.text(13, '400'),
      lineHeight: 19,
      color: t.colors.textMuted,
    },
    segments: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    segment: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: t.button.radius,
      backgroundColor: t.colors.surface,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    segmentActive: {
      backgroundColor: t.colors.primarySoft,
      borderColor: t.colors.primary,
    },
    segmentText: {
      ...t.text(15, '700'),
      color: t.colors.textMuted,
    },
    segmentTextActive: {
      color: t.colors.primaryDark,
    },
    confirmRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    secondary: {
      backgroundColor: t.colors.surface,
      borderRadius: t.button.radius,
      paddingVertical: 14,
      paddingHorizontal: Spacing.md,
      alignItems: 'center',
    },
    secondaryText: {
      ...t.text(15, '700'),
      ...t.button.label,
      color: t.colors.text,
    },
    danger: {
      backgroundColor: t.colors.dangerSoft,
      borderRadius: t.button.radius,
      paddingVertical: 14,
      alignItems: 'center',
    },
    dangerText: {
      ...t.text(15, '700'),
      ...t.button.label,
      color: t.colors.danger,
    },
    flex: {
      flex: 1,
    },
    pressed: {
      opacity: 0.7,
    },
    disclaimer: {
      ...t.text(12, '400'),
      color: t.colors.textMuted,
      textAlign: 'center',
      marginTop: Spacing.sm,
    },
  });
