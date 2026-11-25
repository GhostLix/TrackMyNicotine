import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

type Props = {
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};

export function PlaceholderScreen({ title, icon }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.center}>
        <Ionicons name={icon} size={40} color={Colors.primary} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>In arrivo nelle prossime versioni.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  body: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
