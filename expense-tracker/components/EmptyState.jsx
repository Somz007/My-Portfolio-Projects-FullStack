import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, font } from '../constants/theme';

export default function EmptyState({ message = 'No expenses yet' }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>💸</Text>
      <Text style={styles.title}>{message}</Text>
      <Text style={styles.sub}>Tap the Add tab to record your first expense.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:  { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl * 2 },
  icon:  { fontSize: 48, marginBottom: spacing.md },
  title: { fontSize: font.md, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  sub:   { fontSize: font.sm, color: colors.muted, textAlign: 'center' },
});
