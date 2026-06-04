// ─────────────────────────────────────────────────────────────
//  screens/Add — form to record a new expense.
//  Demonstrates React Native form patterns:
//    TextInput for text/number entry
//    ScrollView so keyboard doesn't cover inputs
//    TouchableOpacity for custom buttons (no <button> in RN)
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useExpenseContext } from '../_layout';
import { CATEGORIES } from '../../constants/categories';
import { colors, spacing, font, radius } from '../../constants/theme';

export default function AddScreen() {
  const { addExpense } = useExpenseContext();
  const [amount,      setAmount]      = useState('');
  const [categoryId,  setCategoryId]  = useState('food');
  const [description, setDescription] = useState('');
  const [date,        setDate]        = useState(new Date().toISOString().split('T')[0]);

  const handleSave = () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid amount', 'Please enter a positive number.');
      return;
    }
    addExpense({ amount: parsed, categoryId, description, date });
    // Reset form and jump to the list tab.
    setAmount(''); setDescription(''); setCategoryId('food');
    router.replace('/(tabs)/');
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* KeyboardAvoidingView pushes content up when the soft keyboard opens */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Add Expense</Text>

          {/* Amount */}
          <View style={styles.field}>
            <Text style={styles.label}>Amount (R)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>

          {/* Category picker */}
          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catBtn,
                    categoryId === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '22' },
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.catIcon}>{cat.icon}</Text>
                  <Text style={[styles.catLabel, categoryId === cat.id && { color: cat.color }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="What was this for?"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />
          </View>

          {/* Date */}
          <View style={styles.field}>
            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="2026-06-04"
              placeholderTextColor={colors.muted}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Save Expense</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  scroll:    { padding: spacing.md, paddingBottom: spacing.xl },
  title:     { fontSize: font.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  field:     { marginBottom: spacing.lg },
  label:     { fontSize: font.sm, color: colors.muted, marginBottom: spacing.sm, fontWeight: '500' },
  input:     { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.text, fontSize: font.base },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catBtn:    { width: '30%', alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  catIcon:   { fontSize: 20, marginBottom: 2 },
  catLabel:  { fontSize: 11, color: colors.muted, textAlign: 'center' },
  saveBtn:   { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
  saveBtnText: { color: '#fff', fontSize: font.base, fontWeight: '700' },
});
