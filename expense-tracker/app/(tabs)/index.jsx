// ─────────────────────────────────────────────────────────────
//  screens/Expenses — the main list screen.
//  Shows total spend and a scrollable list of expenses.
//  Swipe left on an item (or long-press) to delete.
// ─────────────────────────────────────────────────────────────
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenseContext } from '../_layout';
import ExpenseItem from '../../components/ExpenseItem';
import EmptyState  from '../../components/EmptyState';
import { colors, spacing, font, radius } from '../../constants/theme';

export default function ExpensesScreen() {
  const { expenses, totals, deleteExpense, isLoading } = useExpenseContext();

  // Format amount as South African Rand.
  const fmt = (n) => `R ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expenses</Text>
        <Text style={styles.headerSub}>{expenses.length} transaction{expenses.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* ── Total card ── */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Spent</Text>
        <Text style={styles.totalAmount}>{fmt(totals.overall)}</Text>
      </View>

      {/* ── List ── */}
      {isLoading ? (
        <Text style={styles.loading}>Loading…</Text>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExpenseItem expense={item} onDelete={() => deleteExpense(item.id)} />
          )}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  header:       { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  headerTitle:  { fontSize: font.xl, fontWeight: '700', color: colors.text },
  headerSub:    { fontSize: font.sm, color: colors.muted, marginTop: 2 },
  totalCard:    { marginHorizontal: spacing.md, marginBottom: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md },
  totalLabel:   { fontSize: font.sm, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  totalAmount:  { fontSize: font.xxl, fontWeight: '800', color: '#fff' },
  list:         { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  loading:      { color: colors.muted, textAlign: 'center', marginTop: spacing.xl },
});
