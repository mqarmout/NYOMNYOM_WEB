import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { apiFetch } from '../utils';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [expenses,   setExpenses]   = useState([]);
  const [profile,    setProfile]    = useState({
    name: '', currency: '$', tx_count: 0, total_all_time: 0, since: null,
  });
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  }, []);

  const loadAll = useCallback(async () => {
    const month = new Date().toISOString().slice(0, 7);
    const [cats, exps, prof] = await Promise.all([
      apiFetch('/api/categories'),
      apiFetch('/api/expenses?month=' + month),
      apiFetch('/api/profile'),
    ]);
    setCategories(cats);
    setExpenses(exps);
    setProfile(prof);
  }, []);

  const addExpense = useCallback(async (data) => {
    await apiFetch('/api/expenses', { method: 'POST', body: JSON.stringify(data) });
    const month = new Date().toISOString().slice(0, 7);
    setExpenses(await apiFetch('/api/expenses?month=' + month));
    showToast('Expense saved ✓');
  }, [showToast]);

  const deleteExpense = useCallback(async (id) => {
    await apiFetch('/api/expenses/' + id, { method: 'DELETE' });
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast('Deleted');
  }, [showToast]);

  const addCategory = useCallback(async (data) => {
    await apiFetch('/api/categories', { method: 'POST', body: JSON.stringify(data) });
    setCategories(await apiFetch('/api/categories'));
    showToast('Category added ✓');
  }, [showToast]);

  const updateCategory = useCallback(async (id, data) => {
    await apiFetch('/api/categories/' + id, { method: 'PUT', body: JSON.stringify(data) });
    setCategories(await apiFetch('/api/categories'));
    showToast('Category updated ✓');
  }, [showToast]);

  const deleteCategory = useCallback(async (id) => {
    const res = await apiFetch('/api/categories/' + id, { method: 'DELETE' });
    if (res.error) { showToast(res.error); return; }
    setCategories(prev => prev.filter(c => c.id !== id));
    showToast('Category deleted');
  }, [showToast]);

  const saveProfile = useCallback(async (data) => {
    await apiFetch('/api/profile', { method: 'POST', body: JSON.stringify(data) });
    setProfile(prev => ({ ...prev, ...data }));
    showToast('Profile saved ✓');
  }, [showToast]);

  return (
    <AppContext.Provider value={{
      categories, expenses, profile, toast,
      loadAll, addExpense, deleteExpense, addCategory, updateCategory, deleteCategory, saveProfile, showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
