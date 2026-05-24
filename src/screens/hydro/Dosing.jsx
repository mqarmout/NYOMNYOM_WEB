import { useState, useEffect } from 'react';
import { useHydro } from '../../context/HydroContext';
import { fmtDate } from '../../utils';
import { IClose } from '../../icons';

const DOSE_TYPES = ['nutrient_a', 'nutrient_b', 'ph_up', 'ph_down', 'cal_mag', 'other'];
const DOSE_LABELS = {
  nutrient_a: 'Nutrient A',
  nutrient_b: 'Nutrient B',
  ph_up:      'pH Up',
  ph_down:    'pH Down',
  cal_mag:    'Cal-Mag',
  other:      'Other',
};
const DOSE_COLORS = {
  nutrient_a: '#4ab87a',
  nutrient_b: '#2eb8a0',
  ph_up:      '#e05a5a',
  ph_down:    '#5a9ed4',
  cal_mag:    '#d4a040',
  other:      'var(--fg-dim)',
};

function DosingModal({ onSave, onClose }) {
  const today = new Date().toISOString().split('T')[0];
  const [date,     setDate]     = useState(today);
  const [doseType, setDoseType] = useState('nutrient_a');
  const [amount,   setAmount]   = useState('');
  const [notes,    setNotes]    = useState('');

  const canSave = parseFloat(amount) > 0;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">Log Dosing</div>
          <button className="close-btn" onClick={onClose}><IClose /></button>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Type</label>
            <select value={doseType} onChange={e => setDoseType(e.target.value)} autoFocus>
              {DOSE_TYPES.map(t => <option key={t} value={t}>{DOSE_LABELS[t]}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Amount (ml)</label>
          <input type="number" step="0.5" min="0.1" placeholder="e.g. 5" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div className="field">
          <label>Notes (optional)</label>
          <input type="text" placeholder="Any notes…" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <button className="modal-save-btn" disabled={!canSave}
          onClick={() => onSave({ date, dose_type: doseType, amount_ml: parseFloat(amount), notes: notes || null })}>
          Log Dosing
        </button>
      </div>
    </div>
  );
}

export default function Dosing() {
  const { dosing, loadAll, addDosing, deleteDosing } = useHydro();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const handler = () => setShowModal(true);
    window.addEventListener('shortcut:new', handler);
    return () => window.removeEventListener('shortcut:new', handler);
  }, []);

  const totals = DOSE_TYPES.reduce((acc, t) => {
    acc[t] = dosing.filter(d => d.dose_type === t).reduce((s, d) => s + d.amount_ml, 0);
    return acc;
  }, {});

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <h1>Dosing Log</h1>
          <p>{dosing.length} entries</p>
        </div>
        <button className="sidebar-add-btn" style={{ width: 'auto', padding: '10px 20px', marginTop: 4 }}
          onClick={() => setShowModal(true)}>+ Log Dosing</button>
      </div>

      {dosing.length > 0 && (
        <div className="finance-cards" style={{ marginBottom: 24 }}>
          {DOSE_TYPES.filter(t => totals[t] > 0).map(t => (
            <div key={t} className="finance-card">
              <div className="fc-label">{DOSE_LABELS[t]}</div>
              <div className="fc-amount" style={{ color: DOSE_COLORS[t], fontSize: 20 }}>
                {totals[t].toFixed(1)} <span style={{ fontSize: 13 }}>ml</span>
              </div>
              <div className="fc-sub">total</div>
            </div>
          ))}
        </div>
      )}

      <div className="tx-list">
        {dosing.length === 0 ? (
          <div className="empty-state">No dosing logged yet.<br />Click <strong>+ Log Dosing</strong> to start.</div>
        ) : dosing.map(d => (
          <div className="tx-item" key={d.id}>
            <div className="tx-icon">
              <span style={{ fontSize: 12, fontWeight: 700, color: DOSE_COLORS[d.dose_type] }}>
                {DOSE_LABELS[d.dose_type]?.slice(0, 4).toUpperCase()}
              </span>
            </div>
            <div className="tx-info">
              <div className="tx-name">{DOSE_LABELS[d.dose_type] || d.dose_type}</div>
              <div className="tx-cat">{d.notes || ''}</div>
            </div>
            <div className="tx-right">
              <div className="tx-amount">{d.amount_ml} ml</div>
              <div className="tx-date">{fmtDate(d.date)}</div>
            </div>
            <button className="tx-delete" onClick={() => deleteDosing(d.id)}><IClose /></button>
          </div>
        ))}
      </div>

      {showModal && <DosingModal onSave={async data => { await addDosing(data); setShowModal(false); }} onClose={() => setShowModal(false)} />}
    </div>
  );
}
