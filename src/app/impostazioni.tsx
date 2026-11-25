import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DailyLimitEditor } from '@/components/daily-limit-editor';
import { Spacing } from '@/constants/theme';
import { useNicotine } from '@/store/nicotine-store';
import { useDevSettings, useStyles, useTheme } from '@/theme/theme-provider';
import {
  NAVS,
  PRODUCT_LAYOUTS,
  STYLES,
  TEXTS,
  type Theme,
} from '@/theme/themes';

type Choice = 1 | 2 | 3;
type OptionMeta = { name: string; description: string };

export default function ImpostazioniScreen() {
  const styles = useStyles(makeStyles);
  const t = useTheme();
  const { dailyLimitMg, setDailyLimit, resetAll, loaded } = useNicotine();
  const { dev, setDev } = useDevSettings();
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Impostazioni</Text>

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
          <SectionHeader icon="construct-outline" title="Impostazioni developer" />
          <Text style={styles.cardBody}>
            Prova le varianti di aspetto una per una: si applicano subito a tutta l’app.
          </Text>

          <OptionGroup
            label="Stile"
            value={dev.style}
            options={STYLES}
            onChange={(style) => setDev({ style })}
            renderExtra={(id) => (
              <View style={styles.swatches}>
                {[STYLES[id].colors.background, STYLES[id].colors.card, STYLES[id].colors.primary].map(
                  (c, i) => (
                    <View key={i} style={[styles.swatch, { backgroundColor: c }]} />
                  ),
                )}
              </View>
            )}
          />
          <OptionGroup
            label="Testi"
            value={dev.text}
            options={TEXTS}
            onChange={(text) => setDev({ text })}
            renderExtra={(id) => (
              <Text
                style={[
                  styles.fontSample,
                  TEXTS[id].families ? { fontFamily: TEXTS[id].families!['700'] } : { fontWeight: '700' },
                ]}>
                Aa 12
              </Text>
            )}
          />
          <OptionGroup
            label="Barra di navigazione"
            value={dev.nav}
            options={NAVS}
            onChange={(nav) => setDev({ nav })}
          />
          <OptionGroup
            label="Organizzazione prodotti"
            value={dev.products}
            options={PRODUCT_LAYOUTS}
            onChange={(products) => setDev({ products })}
          />

          <Pressable
            onPress={() => setDev({ style: 1, text: 1, nav: 1, products: 1 })}
            style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}>
            <Ionicons name="refresh" size={15} color={t.colors.primary} />
            <Text style={styles.linkText}>Torna alle varianti 1</Text>
          </Pressable>
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

function SectionHeader({
  icon,
  title,
}: {
  icon: 'flag-outline' | 'construct-outline' | 'trash-outline';
  title: string;
}) {
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

function OptionGroup<T extends Choice>({
  label,
  value,
  options,
  onChange,
  renderExtra,
}: {
  label: string;
  value: T;
  options: Record<T, OptionMeta>;
  onChange: (v: T) => void;
  renderExtra?: (id: T) => React.ReactNode;
}) {
  const styles = useStyles(makeStyles);
  const ids = [1, 2, 3] as T[];
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.segments}>
        {ids.map((id) => {
          const active = id === value;
          return (
            <Pressable
              key={id}
              onPress={() => onChange(id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`${label}: ${id} ${options[id].name}`}
              style={({ pressed }) => [
                styles.segment,
                active && styles.segmentActive,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.segmentNumber, active && styles.segmentTextActive]}>{id}</Text>
              <Text
                style={[styles.segmentName, active && styles.segmentTextActive]}
                numberOfLines={1}>
                {options[id].name}
              </Text>
              {renderExtra?.(id)}
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.groupDescription}>{options[value].description}</Text>
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
    group: {
      gap: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.border,
    },
    groupLabel: {
      ...t.text(12, '700'),
      color: t.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    segments: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    segment: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      gap: 2,
      paddingVertical: 10,
      paddingHorizontal: 6,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.surface,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    segmentActive: {
      backgroundColor: t.colors.primarySoft,
      borderColor: t.colors.primary,
    },
    segmentNumber: {
      ...t.text(18, '800'),
      color: t.colors.textMuted,
    },
    segmentName: {
      ...t.text(12, '600'),
      color: t.colors.text,
    },
    segmentTextActive: {
      color: t.colors.primaryDark,
    },
    groupDescription: {
      ...t.text(12, '400'),
      lineHeight: 17,
      color: t.colors.textMuted,
    },
    swatches: {
      flexDirection: 'row',
      gap: 3,
      marginTop: 4,
    },
    swatch: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'rgba(127, 127, 127, 0.35)',
    },
    fontSample: {
      fontSize: 15,
      color: t.colors.text,
      marginTop: 2,
    },
    linkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
    },
    linkText: {
      ...t.text(13, '700'),
      color: t.colors.primary,
    },
    confirmRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    secondary: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.md,
      paddingVertical: 14,
      paddingHorizontal: Spacing.md,
      alignItems: 'center',
    },
    secondaryText: {
      ...t.text(15, '700'),
      color: t.colors.text,
    },
    danger: {
      backgroundColor: t.colors.dangerSoft,
      borderRadius: t.radius.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    dangerText: {
      ...t.text(15, '700'),
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
