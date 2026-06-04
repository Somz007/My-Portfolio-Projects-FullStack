// ─────────────────────────────────────────────────────────────
//  hooks/useExpenses.js
//  The single source of truth for expense data.
//  Persists to AsyncStorage so data survives app restarts.
//
//  WHY AsyncStorage?
//  React Native has no localStorage. AsyncStorage is the equivalent:
//  a key-value store, but fully async (all operations return Promises).
//  That's why every read/write uses await inside useEffect/callbacks.
//
//  The hook returns:
//    expenses       — full array, newest first
//    totals         — { overall, byCategory: [{ id, label, amount, count }] }
//    addExpense()   — save a new expense
//    deleteExpense()— remove by id
//    isLoading      — true while the first AsyncStorage read is happening
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATEGORIES, getCategoryById } from '../constants/categories';

const STORAGE_KEY = '@expenses_v1';

export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Load from AsyncStorage on mount ──────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setExpenses(JSON.parse(raw));
      } catch (err) {
        console.warn('Failed to load expenses:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── Persist whenever expenses change ─────────────────────
  useEffect(() => {
    if (isLoading) return; // don't overwrite on first render
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)).catch((err) =>
      console.warn('Failed to save expenses:', err)
    );
  }, [expenses, isLoading]);

  // ── Add ───────────────────────────────────────────────────
  const addExpense = useCallback(({ amount, categoryId, description, date }) => {
    const expense = {
      id:          Date.now().toString(),
      amount:      parseFloat(amount),
      categoryId,
      description: description.trim(),
      date:        date || new Date().toISOString().split('T')[0],
      createdAt:   new Date().toISOString(),
    };
    // Prepend so newest appears at top of list
    setExpenses((prev) => [expense, ...prev]);
    return expense;
  }, []);

  // ── Delete ────────────────────────────────────────────────
  const deleteExpense = useCallback((id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ── Computed totals ───────────────────────────────────────
  // This runs on every render but is cheap (small array).
  // In a production app with thousands of expenses you'd useMemo.
  const overall = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = CATEGORIES.map((cat) => {
    const catExpenses = expenses.filter((e) => e.categoryId === cat.id);
    return {
      ...cat,
      amount: catExpenses.reduce((s, e) => s + e.amount, 0),
      count:  catExpenses.length,
    };
  }).filter((c) => c.count > 0)
    .sort((a, b) => b.amount - a.amount);

  return {
    expenses,
    totals: { overall, byCategory },
    addExpense,
    deleteExpense,
    isLoading,
  };
}
