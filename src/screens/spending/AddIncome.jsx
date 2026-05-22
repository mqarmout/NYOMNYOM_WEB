import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { IClose } from '../../icons';

const SOURCES = [
  { value: 'salary',     label: 'Salary' },
  { value: 'freelance',  label: 'Freelance' },
  { value: 'e-transfer', label: 'E-Transfer' },
  { value: 'gift',       label: 'Gift' },
  { value: 'refund',     label: 'Refund' },
  { value: 'other',      label: 'Other' },
];

export default function AddIncome({ onClose }) {
  const { addIncome, showToast, profile } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const [amount,          setAmount]          = useState('');
  const [desc,            setDesc]            = useState('');
  const [source,          setSource]          = useState('salary');
  const [date,            setDate]            = useState(today);
  const [saving,          setSaving]          = useState(false);
  const [recurring,       setRecurring]       = useState(false);
  const [recurringPeriod, setRecurringPeriod] = useState('monthly');
  const [recurringStart,  setRecurringStart]  = useState(today);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) return showToast('Enter a valid amount');
    if (!desc.trim()) return showToast('Enter a description');
    if (!date)        return showToast('Select a date');
    setSaving(true);
    await addIncome({
      amount: parseFloat(amount), description: desc.trim(), source, date,
      ...(recurring && { recurring: true, recurring_period: recurringPeriod, recurring_start: recurringStart }),
    });
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
        <div className="modal-title">Add Income</div>
        <button className="close-btn" onClick={onClose}><IClose /></button>
      </div>

      <div className="amount-wrap">
        <div className="amount-row">
          <span className="currency-sym income-sym">{profile.currency || '$'}</span>
          <input
            className="amount-big income-amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            autoFocus
          />
        </div>
        <div className="amount-hint">Enter amount received</div>
      </div>

      <div className="field">
        <label>Description</label>
        <input
          type="text"
          placeholder="e.g. June salary"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Source</label>
          <select value={source} onChange={e => setSource(e.target.value)}>
            {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
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

      <button className="modal-save-btn income-save-btn" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Income'}
      </button>
    </>
  );
}
