import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Px, IClose } from '../../icons';

export default function AddExpense({ onClose, initial }) {
  const { categories, addExpense, updateExpense, showToast, profile } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const [amount,          setAmount]          = useState(initial ? String(initial.amount) : '');
  const [desc,            setDesc]            = useState(initial?.description ?? '');
  const [date,            setDate]            = useState(initial?.date ?? today);
  const [catId,           setCatId]           = useState(initial?.category_id ?? null);
  const [saving,          setSaving]          = useState(false);
  const [recurring,       setRecurring]       = useState(initial?.recurring ? true : false);
  const [recurringPeriod, setRecurringPeriod] = useState(initial?.recurring_period ?? 'monthly');
  const [recurringStart,  setRecurringStart]  = useState(initial?.recurring_start ?? today);

  const isEdit = !!initial;

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) return showToast('Enter a valid amount');
    if (!desc.trim())   return showToast('Enter a description');
    if (!catId)         return showToast('Select a category');
    if (!date)          return showToast('Select a date');

    setSaving(true);
    const data = {
      amount: parseFloat(amount), description: desc.trim(), category_id: catId, date,
      ...(recurring
        ? { recurring: true, recurring_period: recurringPeriod, recurring_start: recurringStart }
        : { recurring: false, recurring_period: null, recurring_start: null }),
    };
    if (isEdit) {
      await updateExpense(initial.id, data);
    } else {
      await addExpense(data);
    }
    setSaving(false);
    onClose();
  };

  const saveRef = useRef(null);
  saveRef.current = handleSave;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Enter' && !['TEXTAREA', 'SELECT', 'BUTTON'].includes(e.target.tagName)) {
        e.preventDefault();
        saveRef.current?.();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <div className="modal-header">
        <div className="modal-title">{isEdit ? 'Edit Expense' : 'Add Expense'}</div>
        <button className="close-btn" onClick={onClose}><IClose /></button>
      </div>

      <div className="amount-wrap">
        <div className="amount-row">
          <span className="currency-sym">{profile.currency || '$'}</span>
          <input
            className="amount-big"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            autoFocus
          />
        </div>
        <div className="amount-hint">Enter amount</div>
      </div>

      <div className="field">
        <label>Description</label>
        <input
          type="text"
          placeholder="e.g. Lunch at Subway"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <div className="field">
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} style={{ width: 'auto', margin: 0 }} />
          Recurring payment
        </label>
      </div>

      {recurring && (
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Period</label>
            <select value={recurringPeriod} onChange={e => setRecurringPeriod(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Start Date</label>
            <input type="date" value={recurringStart} onChange={e => setRecurringStart(e.target.value)} />
          </div>
        </div>
      )}

      <div className="section-title" style={{ marginBottom: 12, marginTop: recurring ? 16 : 0 }}>Category</div>
      <div className="cat-grid">
        {categories.map(c => (
          <div
            key={c.id}
            className={'cat-tile ' + (catId === c.id ? 'selected' : '')}
            onClick={() => setCatId(c.id)}
          >
            <div className="cat-tile-icon"><Px name={c.icon} size={24} /></div>
            <div className="cat-tile-label">{c.name}</div>
          </div>
        ))}
      </div>

      <button className="modal-save-btn" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Expense'}
      </button>
    </>
  );
}
