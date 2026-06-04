# Expense Tracker (React Native + Expo)

A mobile expense tracking app for Android, built with **React Native**, **Expo**, and **Expo Router**. Add expenses by category, view your spending history, and see a visual breakdown of where your money goes — all stored locally on the device with AsyncStorage.

---

## ✨ Features

- 💸 **Add expenses** with amount, category, description, and date
- 📋 **Expense list** showing total spend and every transaction, newest first
- 🗑️ **Long-press to delete** with a native confirmation dialog
- 📊 **Stats screen** — spending breakdown by category and by month, with visual bars
- 🏷️ **10 categories** each with its own emoji icon and accent colour
- 💾 **Offline-first** — all data persists locally via AsyncStorage (no backend, no internet needed)
- 🎨 **Dark theme** with bottom tab navigation
- 🇿🇦 Amounts formatted in South African Rand

---

## 🛠️ Tech Stack

| Tool | Purpose |
|------|---------|
| React Native | Cross-platform native UI |
| Expo | Build tooling + dev runtime |
| Expo Router | File-based navigation (tabs) |
| AsyncStorage | Local key-value persistence |
| @expo/vector-icons | Tab bar icons (Ionicons) |

---

## 📁 Project Structure

```
expense-tracker/
├── app/                       # Expo Router — files map to routes
│   ├── _layout.jsx            # Root layout + shared ExpenseContext
│   └── (tabs)/
│       ├── _layout.jsx        # Bottom tab bar config
│       ├── index.jsx          # Expenses list screen
│       ├── add.jsx            # Add expense form
│       └── stats.jsx          # Spending breakdown
├── components/
│   ├── ExpenseItem.jsx        # One expense row (long-press to delete)
│   ├── EmptyState.jsx         # Placeholder when no data
│   └── StatBar.jsx            # Category bar in stats
├── hooks/
│   └── useExpenses.js         # AsyncStorage CRUD + computed totals
├── constants/
│   ├── categories.js          # 10 categories (icon + colour)
│   └── theme.js               # Dark theme tokens
├── app.json                   # Expo config
└── package.json
```

---

## 🚀 Running the App

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- The **Expo Go** app on your Android phone ([Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Steps
```bash
cd expense-tracker
npm install
npx expo start
```

A QR code appears in the terminal. Open **Expo Go** on your phone and scan it (phone and computer must be on the same WiFi). The app loads live — edit a file and it hot-reloads instantly.

> No Android emulator needed — Expo Go runs the real app on your physical device. To run on an emulator instead, press `a` in the terminal (requires Android Studio).

---

## 🧠 Key React Native Concepts Demonstrated

**Web → Native translation.** This project maps the React knowledge from the web projects onto native primitives:

| Web | Here |
|-----|------|
| `<div>` / `<span>` | `<View>` / `<Text>` |
| `<button>` / `onClick` | `<TouchableOpacity>` / `onPress` |
| CSS files | `StyleSheet.create({})` objects |
| `localStorage` | `AsyncStorage` (async, `await` required) |
| `window.confirm()` | `Alert.alert()` native dialog |
| React Router | Expo Router (file-based) |

**State management.** A single `useExpenses` hook owns all data and is shared across tabs via React Context (`ExpenseContext` in `app/_layout.jsx`) — no prop-drilling, and the same pattern as the web projects' `AuthContext`.

**Persistence.** Because AsyncStorage is asynchronous, the hook loads data in a `useEffect` on mount (with an `isLoading` guard) and saves on every change — the offline-first equivalent of an API layer.

---

## 📦 Build Verification

The full JS bundle compiles cleanly via `npx expo export --platform android` (Metro → Hermes bytecode), confirming all screens, components, hooks, and imports resolve without errors.

---

## 📄 License

MIT — part of my full-stack portfolio (Phase 3).
