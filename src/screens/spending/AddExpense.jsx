import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Px, IClose } from '../../icons';

export default function AddExpense({ onClose }) {
  const { categories, addExpense, showToast, profile } = useApp();
  const [amount,  setAmount]  = useState('');
  const [desc,    setDesc]    = useState('');
  const [date,    setDate]    = useState(new Date().toISOString().split('T')[0]);
  const [catId,   setCatId]   = useState(null);
  const [saving,  setSaving]  = useState(false);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) return showToast('Enter a valid amount');
    if (!desc.trim())   return showToast('Enter a description');
    if (!catId)         return showToast('Select a category');
    if (!date)          return showToast('Select a date');

    setSaving(true);
    await addExpense({ amount: parseFloat(amount), description: desc.trim(), category_id: catId, date });
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
        <div className="modal-title">Add Expense</div>
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

      <div className="section-title" style={{ marginBottom: 12 }}>Category</div>
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
        {saving ? 'Saving…' : 'Save Expense'}
      </button>
    </>
  );
}
