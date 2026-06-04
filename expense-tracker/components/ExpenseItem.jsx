// ─────────────────────────────────────────────────────────────
//  components/ExpenseItem.jsx
//  A single expense row. Long-press triggers a delete confirmation.
//
//  WHY long-press instead of a delete button?
//  It keeps the row clean and is a common mobile pattern. We use
//  Alert.alert for the native confirmation dialog — there's no
//  window.confirm() in React Native.
// ─────────────────────────────────────────────────────────────
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getCategoryById } from '../constants/categories';
import { colors, spacing, font, radius } from '../constants/theme';

export default function ExpenseItem({ expense, onDelete }) {
  const cat = getCategoryById(expense.categoryId);
  const fmt = (n) => `R ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  const confirmDelete = () => {
    Alert.alert(
      'Delete expense?',
      `${cat.label} — ${fmt(expense.amount)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  // Format the date as e.g. "4 Jun"
  const dateLabel = (() => {
    const d = new Date(expense.date);
    return isNaN(d) ? expense.date : d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  })();

  return (
    <TouchableOpacity style={styles.row} onLongPress={confirmDelete} activeOpacity={0.7}>
      {/* Coloured icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: cat.color + '22' }]}>
        <Text style={styles.icon}>{cat.icon}</Text>
      </View>

      {/* Middle: category + description */}
      <View style={styles.middle}>
        <Text style={styles.category}>{cat.label}</Text>
        {expense.description ? (
          <Text style={styles.description} numberOfLines={1}>{expense.description}</Text>
        ) : (
          <Text style={styles.dateOnly}>{dateLabel}</Text>
        )}
      </View>

      {/* Right: amount + date */}
      <View style={styles.right}>
        <Text style={styles.amount}>{fmt(expense.amount)}</Text>
        {expense.description ? <Text style={styles.date}>{dateLabel}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm + 2, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  iconCircle: { width: 42, height: 42, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  icon:       { fontSize: 20 },
  middle:     { flex: 1 },
  category:   { fontSize: font.base, fontWeight: '600', color: colors.text },
  description:{ fontSize: font.sm, color: colors.muted, marginTop: 1 },
  dateOnly:   { fontSize: font.sm, color: colors.muted, marginTop: 1 },
  right:      { alignItems: 'flex-end' },
  amount:     { fontSize: font.base, fontWeight: '700', color: colors.text },
  date:       { fontSize: 11, color: colors.muted, marginTop: 1 },
});
