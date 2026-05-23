import { useState, useEffect, useRef, useCallback } from 'react';
import { useFitness } from '../../context/FitnessContext';
import { AreaChart } from '../../Charts';
import { fmtDate, apiFetch } from '../../utils';
import { IClose, IEdit } from '../../icons';

const RUN_TYPES = ['easy', 'tempo', 'long', 'intervals', 'race'];

const TYPE_COLORS = {
  easy:      'var(--accent)',
  tempo:     '#e07840',
  long:      '#7c6fef',
  intervals: '#d4a040',
  race:      '#e04060',
};

function fmtDuration(secs) {
  if (!secs) return '--';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function fmtPace(secsPerKm) {
  if (!secsPerKm) return '--';
  const m = Math.floor(secsPerKm / 60);
  const s = secsPerKm % 60;
  return `${m}:${String(s).padStart(2, '0')} /km`;
}

function parseDuration(mins, secs) {
  return (parseInt(mins) || 0) * 60 + (parseInt(secs) || 0);
}

function RunModal({ initial, onSave, onClose }) {
  const today = new Date().toISOString().split('T')[0];
  const initMins = initial ? Math.floor(initial.duration_seconds / 60) : '';
  const initSecs = initial ? initial.duration_seconds % 60 : '';

  const [date,     setDate]     = useState(initial?.date      ?? today);
  const [title,    setTitle]    = useState(initial?.title      ?? '');
  const [distance, setDistance] = useState(initial?.distance_km ?? '');
  const [mins,     setMins]     = useState(initMins);
  const [secs,     setSecs]     = useState(initSecs === 0 ? '00' : initSecs);
  const [runType,  setRunType]  = useState(initial?.run_type  ?? 'easy');
  const [effort,   setEffort]   = useState(initial?.effort    ?? '');

  const isEdit = !!initial;

  const durationSecs = parseDuration(mins, secs);
  const canSave = parseFloat(distance) > 0 && durationSecs > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      date,
      title:            title.trim() || null,
      distance_km:      parseFloat(distance),
      duration_seconds: durationSecs,
      run_type:         runType,
      effort:           effort ? parseInt(effort) : null,
    });
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
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Edit Run' : 'Log Run'}</div>
          <button className="close-btn" onClick={onClose}><IClose /></button>
        </div>

        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div className="field">
          <label>Title (optional)</label>
          <input type="text" placeholder="e.g. Morning run, Parkrun" value={title}
            onChange={e => setTitle(e.target.value)} autoFocus />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Distance (km)</label>
            <input type="number" placeholder="e.g. 5.0" min="0.1" step="0.1"
              value={distance} onChange={e => setDistance(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Duration</label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="number" placeholder="min" min="0" value={mins}
                onChange={e => setMins(e.target.value)}
                style={{ flex: 1 }} />
              <span style={{ color: 'var(--fg-dim)', fontSize: 16 }}>:</span>
              <input type="number" placeholder="sec" min="0" max="59" value={secs}
                onChange={e => setSecs(e.target.value)}
                style={{ flex: '0 0 64px' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Run Type</label>
            <select value={runType} onChange={e => setRunType(e.target.value)}>
              {RUN_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Effort (1–5, optional)</label>
            <select value={effort} onChange={e => setEffort(e.target.value)}>
              <option value="">—</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <button className="modal-save-btn" onClick={handleSave} disabled={!canSave}>
          {isEdit ? 'Save Changes' : 'Log Run'}
        </button>
      </div>
    </div>
  );
}

export default function Runs() {
  const { runs, runHistory, loadAll, addRun, updateRun, deleteRun } = useFitness();
  const [showModal,       setShowModal]       = useState(false);
  const [editing,         setEditing]         = useState(null);
  const [toast,           setToast]           = useState(null);
  const [stravaStatus,    setStravaStatus]    = useState(null); // {configured, connected}
  const [importing,       setImporting]       = useState(false);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    apiFetch('/api/strava/status').then(d => setStravaStatus(d));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const strava = params.get('strava');
    if (!strava) return;
    if (strava === 'connected') {
      const count = params.get('count') || '0';
      setStravaStatus(s => ({ ...s, connected: true }));
      setToast({ type: 'ok', msg: `Strava connected! Imported ${count} run${count === '1' ? '' : 's'}.` });
      loadAll();
    } else if (strava === 'denied') {
      setToast({ type: 'err', msg: 'Strava authorization was denied.' });
    } else {
      setToast({ type: 'err', msg: 'Strava connection failed. Please try again.' });
    }
    const clean = new URL(window.location.href);
    clean.searchParams.delete('strava');
    clean.searchParams.delete('count');
    window.history.replaceState({}, '', clean.toString());
  }, [loadAll]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleStravaImport = useCallback(async () => {
    setImporting(true);
    const res = await apiFetch('/api/strava/import', { method: 'POST' });
    setImporting(false);
    if (res.error) {
      setToast({ type: 'err', msg: 'Import failed. Please try again.' });
    } else {
      const n = res.imported ?? 0;
      setToast({ type: 'ok', msg: n > 0 ? `Imported ${n} new run${n === 1 ? '' : 's'} from Strava.` : 'Already up to date.' });
      if (n > 0) loadAll();
    }
  }, [loadAll]);

  useEffect(() => {
    const handler = () => setShowModal(true);
    window.addEventListener('shortcut:new', handler);
    return () => window.removeEventListener('shortcut:new', handler);
  }, []);

  const now   = new Date();
  const mo    = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const month = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  const thisMonth   = runs.filter(r => r.date?.startsWith(mo));
  const totalKm     = thisMonth.reduce((s, r) => s + r.distance_km, 0);
  const totalSecs   = thisMonth.reduce((s, r) => s + r.duration_seconds, 0);
  const avgPaceSecs = totalKm > 0 ? Math.round(totalSecs / totalKm) : null;

  const chartData = runHistory.map(r => ({ v: Math.round(r.total_km * 10) / 10, lbl: r.week.slice(5) }));

  return (
    <div className="screen">
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'ok' ? 'var(--accent)' : '#c0392b',
          color: '#fff', padding: '10px 20px', borderRadius: 8,
          zIndex: 9999, fontWeight: 600, fontSize: 14, pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          {toast.msg}
        </div>
      )}
      <div className="page-header">
        <div>
          <h1>Running</h1>
          <p>{month}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
          {stravaStatus && !stravaStatus.connected && (
            stravaStatus.configured ? (
              <a href="/api/strava/auth" style={{
                padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: '#fc4c02', color: '#fff', textDecoration: 'none', display: 'inline-block',
              }}>
                Connect Strava
              </a>
            ) : (
              <span title="Set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET on the server" style={{
                padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--bg-card)', color: 'var(--fg-dim)',
                border: '1px solid var(--border)', cursor: 'not-allowed', display: 'inline-block',
              }}>
                Strava (not configured)
              </span>
            )
          )}
          {stravaStatus?.connected && (
            <button onClick={handleStravaImport} disabled={importing} style={{
              padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: importing ? '#a33000' : '#fc4c02', color: '#fff',
              border: 'none', cursor: importing ? 'default' : 'pointer',
            }}>
              {importing ? 'Importing…' : 'Import Strava'}
            </button>
          )}
          <button className="sidebar-add-btn" style={{ width: 'auto', padding: '10px 20px' }}
            onClick={() => setShowModal(true)}>+ Log Run</button>
        </div>
      </div>

      <div className="finance-cards">
        <div className="finance-card income-card">
          <div className="fc-label">Distance</div>
          <div className="fc-amount">{totalKm.toFixed(1)} <span style={{ fontSize: 16 }}>km</span></div>
          <div className="fc-sub">{thisMonth.length} run{thisMonth.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="finance-card spent-card">
          <div className="fc-label">Time</div>
          <div className="fc-amount" style={{ fontSize: 22 }}>{fmtDuration(totalSecs)}</div>
          <div className="fc-sub">this month</div>
        </div>
        <div className="finance-card net-card net-positive">
          <div className="fc-label">Avg Pace</div>
          <div className="fc-amount" style={{ fontSize: 20 }}>{avgPaceSecs ? fmtPace(avgPaceSecs) : '--'}</div>
          <div className="fc-sub">min/km</div>
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="graph-card" style={{ marginBottom: 24 }}>
          <div className="graph-card-title">Weekly Distance (km)</div>
          <AreaChart data={chartData} color="var(--accent)" />
        </div>
      )}

      <div className="tx-list">
        {runs.length === 0 ? (
          <div className="empty-state">No runs logged yet.<br />Click <strong>+ Log Run</strong> to get started.</div>
        ) : runs.map(r => (
          <div className="tx-item" key={r.id}>
            <div className="tx-icon">
              <span style={{ fontSize: 14, fontWeight: 700, color: TYPE_COLORS[r.run_type] || 'var(--accent)' }}>
                {r.run_type.slice(0, 3).toUpperCase()}
              </span>
            </div>
            <div className="tx-info">
              <div className="tx-name">
                {r.title || `${r.run_type.charAt(0).toUpperCase() + r.run_type.slice(1)} run`}
                {r.effort ? <span className="tx-recurring-badge">RPE {r.effort}</span> : null}
              </div>
              <div className="tx-cat">{r.distance_km.toFixed(2)} km · {fmtDuration(r.duration_seconds)}</div>
            </div>
            <div className="tx-right">
              <div className="tx-amount" style={{ fontSize: 14 }}>{fmtPace(r.pace_seconds_per_km)}</div>
              <div className="tx-date">{fmtDate(r.date)}</div>
            </div>
            <button className="tx-delete" onClick={() => setEditing(r)}><IEdit /></button>
            <button className="tx-delete" onClick={() => deleteRun(r.id)}><IClose /></button>
          </div>
        ))}
      </div>

      {showModal && <RunModal onSave={async d => { await addRun(d); setShowModal(false); }} onClose={() => setShowModal(false)} />}
      {editing   && <RunModal initial={editing} onSave={async d => { await updateRun(editing.id, d); setEditing(null); }} onClose={() => setEditing(null)} />}
    </div>
  );
}
