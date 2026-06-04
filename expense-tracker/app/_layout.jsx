// Root layout — wraps the whole app. We use ExpenseContext here so all
// tabs share the same expense state without prop-drilling.
import { createContext, useContext } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useExpenses } from '../hooks/useExpenses';
import { colors } from '../constants/theme';

// A simple context so any screen can call useExpenseContext().
export const ExpenseContext = createContext(null);
export const useExpenseContext = () => useContext(ExpenseContext);

export default function RootLayout() {
  const expenses = useExpenses();

  return (
    <ExpenseContext.Provider value={expenses}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </ExpenseContext.Provider>
  );
}
