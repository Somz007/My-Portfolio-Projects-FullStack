// Stats screen — breakdown of spending by category with visual bars.
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenseContext } from '../_layout';
import StatBar    from '../../components/StatBar';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, font, radius } from '../../constants/theme';

export default function StatsScreen() {
  const { totals, expenses } = useExpenseContext();
  const fmt = (n) => `R ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  // Group expenses by month for the monthly breakdown.
  const byMonth = expenses.reduce((acc, e) => {
    const month = e.date?.slice(0, 7) ?? 'unknown'; // "2026-06"
    if (!acc[month]) acc[month] = 0;
    acc[month] += e.amount;
    return acc;
  }, {});
  const months = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Stats</Text>

        {expenses.length === 0 ? <EmptyState message="Add expenses to see stats" /> : (
          <>
            {/* Summary cards */}
            <View style={styles.row}>
              <View style={[styles.card, { flex: 1 }]}>
                <Text style={styles.cardLabel}>Total Spent</Text>
                <Text style={styles.cardValue}>{fmt(totals.overall)}</Text>
              </View>
              <View style={[styles.card, { flex: 1 }]}>
                <Text style={styles.cardLabel}>Transactions</Text>
                <Text style={styles.cardValue}>{expenses.length}</Text>
              </View>
            </View>

            {totals.overall > 0 && (
              <View style={[styles.card, { marginBottom: spacing.sm }]}>
                <Text style={styles.cardLabel}>Average per Transaction</Text>
                <Text style={styles.cardValue}>{fmt(totals.overall / expenses.length)}</Text>
              </View>
            )}

            {/* Category breakdown */}
            <Text style={styles.sectionTitle}>By Category</Text>
            {totals.byCategory.map((cat) => (
              <StatBar key={cat.id} cat={cat} total={totals.overall} fmt={fmt} />
            ))}

            {/* Monthly breakdown */}
            {months.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>By Month</Text>
                {months.map(([month, amount]) => {
                  const pct = totals.overall > 0 ? amount / totals.overall : 0;
                  const [yr, mo] = month.split('-');
                  const label = new Date(Number(yr), Number(mo) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                  return (
                    <View key={month} style={styles.card}>
                      <View style={styles.barRow}>
                        <Text style={styles.barLabel}>{label}</Text>
                        <Text style={styles.barAmount}>{fmt(amount)}</Text>
                      </View>
                      <View style={styles.track}>
                        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: colors.primary }]} />
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  scroll:       { padding: spacing.md, paddingBottom: spacing.xl },
  title:        { fontSize: font.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  row:          { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  card:         { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  cardLabel:    { fontSize: font.sm, color: colors.muted, marginBottom: 4 },
  cardValue:    { fontSize: font.lg, fontWeight: '700', color: colors.text },
  sectionTitle: { fontSize: font.base, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
  barRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  barLabel:     { fontSize: font.sm, color: colors.text },
  barAmount:    { fontSize: font.sm, color: colors.text, fontWeight: '600' },
  track:        { height: 6, backgroundColor: colors.surface2, borderRadius: radius.full, overflow: 'hidden' },
  fill:         { height: '100%', borderRadius: radius.full },
});
