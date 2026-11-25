import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DailyLimitEditor } from '@/components/daily-limit-editor';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { useNicotine } from '@/store/nicotine-store';

export default function ImpostazioniScreen() {
  const { dailyLimitMg, setDailyLimit, resetAll, loaded } = useNicotine();
  const [saved, setSaved] = useState(false);

  const confirmReset = () => {
    const message = 'Verranno cancellati tutti i tiri registrati e il limite giornaliero.';
    if (Platform.OS === 'web') {
      if (window.confirm(message)) resetAll();
      return;
    }
    Alert.alert('Cancellare tutti i dati?', message, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Cancella', style: 'destructive', onPress: resetAll },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Impostazioni</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Limite giornaliero</Text>
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
          <Text style={styles.cardTitle}>Dati</Text>
          <Pressable onPress={confirmReset} style={({ pressed }) => [styles.danger, pressed && { opacity: 0.7 }]}>
            <Text style={styles.dangerText}>Cancella tutti i dati</Text>
          </Pressable>
        </View>

        <Text style={styles.disclaimer}>
          I valori di nicotina sono stime indicative e non costituiscono un parere medico.
        </Text>
      </ScrollView>
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
    gap: Spacing.md,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  cardBody: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  danger: {
    backgroundColor: Colors.dangerSoft,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerText: {
    color: Colors.danger,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
