import { StyleSheet, Text, View } from 'react-native';

import { SCORE_COLORS, type Score } from '@/data/products';

type Props = {
  score: Score;
  size?: 'sm' | 'lg';
};

export function ScoreBadge({ score, size = 'sm' }: Props) {
  const lg = size === 'lg';
  return (
    <View
      accessibilityLabel={`Punteggio ${score}`}
      style={[
        styles.badge,
        lg ? styles.lg : styles.sm,
        { backgroundColor: SCORE_COLORS[score] },
      ]}>
      <Text style={[styles.text, lg ? styles.textLg : styles.textSm, { color: '#FFFFFF' }]}>
        {score}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  lg: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  text: {
    fontWeight: '800',
  },
  textSm: {
    fontSize: 15,
  },
  textLg: {
    fontSize: 26,
  },
});
