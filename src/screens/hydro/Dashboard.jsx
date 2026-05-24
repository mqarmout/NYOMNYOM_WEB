import { useState, useEffect } from 'react';
import { useHydro } from '../../context/HydroContext';
import { fmtDate } from '../../utils';
import { IClose } from '../../icons';

const PH_IDEAL  = [5.5, 6.5];
const PH_OK     = [5.0, 7.0];
const TEMP_IDEAL = [18, 24];
const TEMP_OK    = [16, 26];

function statusColor(val, ideal, ok) {
  if (val === null || val === undefined) return 'var(--fg-dim)';
  if (val >= ideal[0] && val <= ideal[1]) return '#4ab87a';
  if (val >= ok[0]    && val <= ok[1])    return '#d4a040';
  return '#e05a5a';
}

function levelColor(pct) {
  if (pct === null || pct === undefined) return 'var(--fg-dim)';
  if (pct >= 50) return '#4ab87a';
  if (pct >= 25) return '#d4a040';
  return '#e05a5a';
}

function MetricCard({ label, value, unit, color, sub }) {
  return (
    <div className="finance-card" style={{ minWidth: 120 }}>
      <div className="fc-label">{label}</div>
      <div className="fc-amount" style={{ color, fontSize: 22 }}>
        {value !== null && value !== undefined ? value : '—'}
        {value !== null && value !== undefined && <span style={{ fontSize: 14 }}> {unit}</span>}
      </div>
      {sub && <div className="fc-sub">{sub}</div>}
    </div>
  );
}

function ReadingModal({ onSave, onClose }) {
  const [ph,         setPh]         = useState('');
  const [ec,         setEc]         = useState('');
  const [waterTemp,  setWaterTemp]  = useState('');
  const [waterLevel, setWaterLevel] = useState('');
  const [airTemp,    setAirTemp]    = useState('');
  const [humidity,   setHumidity]   = useState('');

  const handleSave = () => {
    onSave({
      ph:          ph         ? parseFloat(ph)         : null,
      ec_ppm:      ec         ? parseFloat(ec)         : null,
      water_temp:  waterTemp  ? parseFloat(waterTemp)  : null,
      water_level: waterLevel ? parseFloat(waterLevel) : null,
      air_temp:    airTemp    ? parseFloat(airTemp)    : null,
      humidity:    humidity   ? parseFloat(humidity)   : null,
    });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">Log Reading</div>
          <button className="close-btn" onClick={onClose}><IClose /></button>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>pH</label>
            <input type="number" step="0.1" placeholder="e.g. 6.0" value={ph} onChange={e => setPh(e.target.value)} autoFocus />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>EC (ppm)</label>
            <input type="number" placeholder="e.g. 800" value={ec} onChange={e => setEc(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Water Temp (°C)</label>
            <input type="number" step="0.1" placeholder="e.g. 21" value={waterTemp} onChange={e => setWaterTemp(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Water Level (%)</label>
            <input type="number" min="0" max="100" placeholder="e.g. 80" value={waterLevel} onChange={e => setWaterLevel(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Air Temp (°C)</label>
            <input type="number" step="0.1" placeholder="e.g. 23" value={airTemp} onChange={e => setAirTemp(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Humidity (%)</label>
            <input type="number" min="0" max="100" placeholder="e.g. 65" value={humidity} onChange={e => setHumidity(e.target.value)} />
          </div>
        </div>
        <button className="modal-save-btn" onClick={handleSave}>Log Reading</button>
      </div>
    </div>
  );
}

function PumpScheduleModal({ pump, onSave, onClose }) {
  const [enabled, setEnabled] = useState(pump?.enabled ?? 1);
  const [onMin,   setOnMin]   = useState(pump?.on_duration_min  ?? 15);
  const [offMin,  setOffMin]  = useState(pump?.off_duration_min ?? 45);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">Pump Schedule</div>
          <button className="close-btn" onClick={onClose}><IClose /></button>
        </div>
        <div className="field">
          <label>Schedule</label>
          <select value={enabled} onChange={e => setEnabled(+e.target.value)}>
            <option value={1}>Enabled</option>
            <option value={0}>Disabled</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>On Duration (min)</label>
            <input type="number" min="1" value={onMin} onChange={e => setOnMin(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Off Duration (min)</label>
            <input type="number" min="1" value={offMin} onChange={e => setOffMin(e.target.value)} />
          </div>
        </div>
        <button className="modal-save-btn"
          onClick={() => onSave({ enabled: !!enabled, on_duration_min: +onMin, off_duration_min: +offMin })}>
          Save Schedule
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { latest, pumpLog, pump, plants, loadAll, addReading, updatePump, triggerPump } = useHydro();
  const [showReading,  setShowReading]  = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const handler = () => setShowReading(true);
    window.addEventListener('shortcut:new', handler);
    return () => window.removeEventListener('shortcut:new', handler);
  }, []);

  const r = latest;
  const phColor  = r ? statusColor(r.ph, PH_IDEAL, PH_OK) : 'var(--fg-dim)';
  const tmpColor = r ? statusColor(r.water_temp, TEMP_IDEAL, TEMP_OK) : 'var(--fg-dim)';
  const lvlColor = r ? levelColor(r.water_level) : 'var(--fg-dim)';

  const activePlants = plants.filter(p => p.active);
  const recentPumps  = pumpLog.slice(0, 5);

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <h1>Hydroponics</h1>
          <p>{r ? `Last reading: ${r.recorded_at?.slice(0, 16).replace('T', ' ')}` : 'No readings yet'}</p>
        </div>
        <button className="sidebar-add-btn" style={{ width: 'auto', padding: '10px 20px', marginTop: 4 }}
          onClick={() => setShowReading(true)}>+ Log Reading</button>
      </div>

      <div className="graph-card-title" style={{ marginBottom: 10 }}>WATER &amp; NUTRIENTS</div>
      <div className="finance-cards" style={{ marginBottom: 24 }}>
        <MetricCard label="pH" value={r?.ph?.toFixed(1)} unit="" color={phColor}
          sub={r ? (r.ph < PH_IDEAL[0] || r.ph > PH_IDEAL[1] ? 'out of range' : 'ideal') : 'target 5.5–6.5'} />
        <MetricCard label="EC" value={r?.ec_ppm?.toFixed(0)} unit="ppm" color="var(--accent)"
          sub="nutrient concentration" />
        <MetricCard label="Water Temp" value={r?.water_temp?.toFixed(1)} unit="°C" color={tmpColor}
          sub="target 18–24°C" />
        <MetricCard label="Water Level" value={r?.water_level?.toFixed(0)} unit="%" color={lvlColor}
          sub={r?.water_level < 25 ? 'low — refill soon' : 'reservoir'} />
      </div>

      <div className="graph-card-title" style={{ marginBottom: 10 }}>ENVIRONMENT</div>
      <div className="finance-cards" style={{ marginBottom: 24 }}>
        <MetricCard label="Air Temp" value={r?.air_temp?.toFixed(1)} unit="°C" color="var(--accent)" sub="ambient" />
        <MetricCard label="Humidity" value={r?.humidity?.toFixed(0)} unit="%" color="var(--accent)" sub="relative" />
        <div className="finance-card" style={{ flex: 2 }}>
          <div className="fc-label">ACTIVE PLANTS</div>
          <div className="fc-amount" style={{ fontSize: 28 }}>{activePlants.length}</div>
          <div className="fc-sub">
            {activePlants.slice(0, 3).map(p => p.name).join(', ') || 'none planted'}
            {activePlants.length > 3 ? ` +${activePlants.length - 3} more` : ''}
          </div>
        </div>
      </div>

      <div className="graph-card-title" style={{ marginBottom: 10 }}>PUMP CONTROL</div>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
        padding: 20, marginBottom: 24, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 12, color: 'var(--fg-dim)', marginBottom: 4 }}>SCHEDULE</div>
          {pump ? (
            <div>
              <span style={{ color: pump.enabled ? '#4ab87a' : '#e05a5a', fontWeight: 700 }}>
                {pump.enabled ? 'ENABLED' : 'DISABLED'}
              </span>
              <span style={{ color: 'var(--fg-dim)', fontSize: 13, marginLeft: 10 }}>
                {pump.on_duration_min}min on / {pump.off_duration_min}min off
              </span>
            </div>
          ) : <span style={{ color: 'var(--fg-dim)' }}>Not configured</span>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowSchedule(true)} style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--fg)', cursor: 'pointer',
          }}>Edit Schedule</button>
          <button onClick={triggerPump} style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'var(--accent)', border: 'none', color: '#000', cursor: 'pointer',
          }}>▶ Run Now</button>
        </div>
      </div>

      {recentPumps.length > 0 && (
        <>
          <div className="graph-card-title" style={{ marginBottom: 10 }}>RECENT PUMP RUNS</div>
          <div className="tx-list">
            {recentPumps.map(log => (
              <div className="tx-item" key={log.id}>
                <div className="tx-info">
                  <div className="tx-name">{log.trigger_type === 'manual' ? 'Manual trigger' : 'Scheduled run'}</div>
                  <div className="tx-cat">{log.started_at?.slice(0, 16).replace('T', ' ')}</div>
                </div>
                <div className="tx-right">
                  <div className="tx-amount" style={{ fontSize: 13 }}>
                    {log.duration_sec ? `${log.duration_sec}s` : '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showReading  && <ReadingModal onSave={async d => { await addReading(d); setShowReading(false); }} onClose={() => setShowReading(false)} />}
      {showSchedule && <PumpScheduleModal pump={pump} onSave={async d => { await updatePump(d); setShowSchedule(false); }} onClose={() => setShowSchedule(false)} />}
    </div>
  );
}
