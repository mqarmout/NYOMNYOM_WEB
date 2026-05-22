import { useState, useEffect, useRef } from 'react';
import { useFitness } from '../../context/FitnessContext';
import { AreaChart } from '../../Charts';
import { fmtDate } from '../../utils';
import { IClose } from '../../icons';

export default function BodyMetrics() {
  const { metrics, history, loadAll, addMetric, deleteMetric } = useFitness();
  const [weight, setWeight] = useState('');
  const [date,   setDate]   = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const weightRef = useRef(null);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'n' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        weightRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleAdd = async () => {
    if (!weight || parseFloat(weight) <= 0) return;
    setSaving(true);
    await addMetric({ weight: parseFloat(weight), date });
    setWeight('');
    setSaving(false);
    weightRef.current?.blur();
  };

  const latest  = metrics[0];
  const chartData = history.map(h => ({ v: h.weight, lbl: h.date.slice(5) }));

  return (
    <div className="screen">
      <div className="page-header">
        <h1>Body Metrics</h1>
        <p>{metrics.length} measurement{metrics.length !== 1 ? 's' : ''} recorded</p>
      </div>

      {latest && (
        <div className="metric-hero">
          <div className="metric-hero-val">{latest.weight} <span className="metric-hero-unit">lbs</span></div>
          <div className="metric-hero-lbl">Latest — {fmtDate(latest.date)}</div>
        </div>
      )}

      <div className="graph-card" style={{ marginBottom: 24 }}>
        <div className="graph-card-title">Weight Over Time</div>
        <AreaChart data={chartData} color="var(--accent)" />
      </div>

      <div className="section-title">Log Measurement</div>
      <div className="metric-add-row">
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label>Weight (lbs)</label>
          <input ref={weightRef} type="number" min="0" step="0.1" placeholder="e.g. 185" value={weight} onChange={e => setWeight(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        </div>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <button className="sidebar-add-btn" style={{ width: 'auto', padding: '12px 20px', alignSelf: 'flex-end' }} onClick={handleAdd} disabled={saving || !weight}>
          {saving ? '…' : 'Save'}
        </button>
      </div>

      <div className="section-title" style={{ marginTop: 28 }}>History</div>
      {metrics.length === 0 ? (
        <div className="empty-state">No measurements yet.</div>
      ) : (
        <div className="metric-table">
          {metrics.map(m => (
            <div className="metric-row" key={m.id}>
              <span className="metric-date">{fmtDate(m.date)}</span>
              <span className="metric-val">{m.weight} lbs</span>
              <button className="tx-delete" onClick={() => deleteMetric(m.id)}><IClose /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
