// Each category has an emoji icon and a distinct accent colour.
// Using emoji avoids needing an icon library for the icons themselves.
export const CATEGORIES = [
  { id: 'food',          label: 'Food',          icon: '🍔', color: '#fb923c' },
  { id: 'transport',     label: 'Transport',     icon: '🚗', color: '#38bdf8' },
  { id: 'housing',       label: 'Housing',       icon: '🏠', color: '#a78bfa' },
  { id: 'health',        label: 'Health',        icon: '💊', color: '#f472b6' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', color: '#facc15' },
  { id: 'clothing',      label: 'Clothing',      icon: '👔', color: '#34d399' },
  { id: 'education',     label: 'Education',     icon: '📚', color: '#60a5fa' },
  { id: 'shopping',      label: 'Shopping',      icon: '🛒', color: '#e879f9' },
  { id: 'utilities',     label: 'Utilities',     icon: '💡', color: '#fbbf24' },
  { id: 'other',         label: 'Other',         icon: '📌', color: '#94a3b8' },
];

export const getCategoryById = (id) =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
