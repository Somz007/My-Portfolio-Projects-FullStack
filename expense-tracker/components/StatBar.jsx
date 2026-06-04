// A single category row in the Stats screen: icon, label, amount,
// percentage, and a coloured progress bar showing share of total.
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, font, radius } from '../constants/theme';

export default function StatBar({ cat, total, fmt }) {
  const pct = total > 0 ? cat.amount / total : 0;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.labelGroup}>
          <Text style={styles.icon}>{cat.icon}</Text>
          <Text style={styles.label}>{cat.label}</Text>
          <Text style={styles.count}>({cat.count})</Text>
        </View>
        <View style={styles.amountGroup}>
          <Text style={styles.amount}>{fmt(cat.amount)}</Text>
          <Text style={styles.pct}>{(pct * 100).toFixed(0)}%</Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: cat.color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card:        { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  topRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  labelGroup:  { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  icon:        { fontSize: 16 },
  label:       { fontSize: font.base, color: colors.text, fontWeight: '600' },
  count:       { fontSize: font.sm, color: colors.muted },
  amountGroup: { alignItems: 'flex-end' },
  amount:      { fontSize: font.base, color: colors.text, fontWeight: '700' },
  pct:         { fontSize: 11, color: colors.muted },
  track:       { height: 6, backgroundColor: colors.surface2, borderRadius: radius.full, overflow: 'hidden' },
  fill:        { height: '100%', borderRadius: radius.full },
});
