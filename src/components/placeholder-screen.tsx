import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useStyles, useTheme } from '@/theme/theme-provider';
import type { Theme } from '@/theme/themes';

type Props = {
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};

export function PlaceholderScreen({ title, icon }: Props) {
  const styles = useStyles(makeStyles);
  const t = useTheme();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.center}>
        <Ionicons name={icon} size={40} color={t.colors.primary} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>In arrivo nelle prossime versioni.</Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
    },
    title: {
      ...t.text(20, '800'),
      color: t.colors.text,
    },
    body: {
      ...t.text(14, '400'),
      color: t.colors.textMuted,
    },
  });
