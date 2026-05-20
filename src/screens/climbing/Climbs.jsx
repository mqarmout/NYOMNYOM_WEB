import { useState, useEffect, useRef } from 'react';
import { useClimbing } from '../../context/ClimbingContext';
import { Px, IClose, IEdit, IZap, ICheck, IMapPin, ICal } from '../../icons';

const WALL_TYPES = ['Overhang', 'Slab', 'Vertical', 'Comp', 'Cave', 'Arete', 'Crimp', 'Dynamic'];
const today = () => new Date().toISOString().slice(0, 10);

const EMPTY = {
  climb_type: 'boulder', name: '', location: '', wall_type: '',
  setter_grade: '', my_grade: '', attempts: 1,
  sent: false, flash: false, date: today(), notes: '',
};

function ClimbModal({ initial, onSave, onClose }) {
  const [form, setForm]     = useState(initial || EMPTY);
  const [photo, setPhoto]   = useState(null);
  const [preview, setPreview] = useState(
    initial?.photo_path ? `/api/climbing/photos/${initial.photo_path}` : null
  );
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setSaving(true);
    await onSave({
      ...form,
      attempts: parseInt(form.attempts) || 1,
      sent:  form.sent  ? 1 : 0,
      flash: form.flash ? 1 : 0,
    }, photo);
    setSaving(false);
  };

  const saveRef = useRef(null);
  saveRef.current = handleSubmit;

  const TYPES = ['boulder', 'sport'];
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        setForm(f => {
          const cur = TYPES.indexOf(f.climb_type);
          const next = TYPES[(cur + (e.key === 'ArrowRight' ? 1 : -1) + TYPES.length) % TYPES.length];
          return { ...f, climb_type: next, ...(next === 'boulder' ? { flash: false } : {}) };
        });
        return;
      }
      if (e.key === 'Enter' && !['TEXTAREA', 'SELECT', 'BUTTON'].includes(e.target.tagName)) {
        e.preventDefault();
        saveRef.current?.();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width: 560 }}>
        <div className="modal-header">
          <span className="modal-title">{initial ? 'EDIT CLIMB' : 'LOG CLIMB'}</span>
          <button className="close-btn" onClick={onClose}><IClose /></button>
        </div>

        {/* Type toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {['boulder', 'sport'].map(t => (
            <button
              key={t}
              className={`chip ${form.climb_type === t ? 'active' : 'inactive'}`}
              style={{ flex: 1, textTransform: 'uppercase' }}
              onClick={() => {
                set('climb_type', t);
                if (t === 'boulder') set('flash', false);
              }}
            >{t === 'boulder' ? <><Px name="target" size={12} /> Boulder</> : <><Px name="arrow-up" size={12} /> Sport</>}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div className="field">
            <label>Name / Problem</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="V5 crimpy roof..." />
          </div>
          <div className="field">
            <label>Location / Gym</label>
            <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="The Hangar..." />
          </div>
          <div className="field">
            <label>Wall Type</label>
            <select value={form.wall_type} onChange={e => set('wall_type', e.target.value)}>
              <option value="">— select —</option>
              {WALL_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div className="field">
            <label>Setter Grade</label>
            <input value={form.setter_grade} onChange={e => set('setter_grade', e.target.value)} placeholder="V4, 5.11a..." />
          </div>
          <div className="field">
            <label>My Grade</label>
            <input value={form.my_grade} onChange={e => set('my_grade', e.target.value)} placeholder="V5, 5.11c..." />
          </div>
          <div className="field">
            <label>Attempts</label>
            <input type="number" min="1" value={form.attempts} onChange={e => set('attempts', e.target.value)} />
          </div>
        </div>

        {/* Sent / Flash checkboxes */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={form.sent} onChange={e => {
              set('sent', e.target.checked);
              if (!e.target.checked) set('flash', false);
            }} style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
            Sent <ICheck size={11} />
          </label>
          {(form.climb_type === 'sport' || form.climb_type === 'boulder') && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, opacity: form.sent ? 1 : 0.4 }}>
              <input type="checkbox" checked={form.flash} disabled={!form.sent}
                onChange={e => set('flash', e.target.checked)}
                style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
              Flash <IZap size={11} />
            </label>
          )}
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Beta, conditions, how it felt..." />
        </div>

        {/* Photo upload */}
        <div className="field">
          <label>Photo</label>
          <div className="climb-photo-upload" onClick={() => fileRef.current?.click()}>
            {preview
              ? <img src={preview} alt="climb" className="climb-photo-preview" />
              : <span className="climb-photo-placeholder"><Px name="camera" size={16} /> Click to attach photo</span>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>

        <button className="modal-save-btn" onClick={handleSubmit} disabled={saving}>
          {saving ? 'SAVING…' : (initial ? 'UPDATE CLIMB' : 'LOG CLIMB')}
        </button>
      </div>
    </div>
  );
}

function ClimbCard({ climb, onEdit, onDelete }) {
  const sent  = Boolean(climb.sent);
  const flash = Boolean(climb.flash);

  return (
    <div className="climb-card">
      {climb.photo_path && (
        <div className="climb-card-photo">
          <img src={`/api/climbing/photos/${climb.photo_path}`} alt="climb" />
        </div>
      )}
      <div className="climb-card-body">
        <div className="climb-card-top">
          <span className={`climb-type-badge ${climb.climb_type}`}>
            {climb.climb_type === 'boulder' ? <Px name="target" size={12} /> : <Px name="arrow-up" size={12} />} {climb.climb_type.toUpperCase()}
          </span>
          {sent  && <span className="climb-status-badge sent">{flash ? <><IZap /> FLASH</> : <><ICheck /> SENT</>}</span>}
          {!sent && <span className="climb-status-badge proj">PROJECT</span>}
          <div style={{ flex: 1 }} />
          <button className="climb-card-action" onClick={onEdit} title="Edit"><IEdit /></button>
          <button className="climb-card-action danger" onClick={onDelete} title="Delete"><IClose /></button>
        </div>

        <div className="climb-card-name">{climb.name || '(unnamed)'}</div>

        <div className="climb-card-meta">
          {climb.location && <span><IMapPin /> {climb.location}</span>}
          {climb.wall_type && <span><Px name="wall" size={11} /> {climb.wall_type}</span>}
          <span><ICal /> {climb.date}</span>
        </div>

        <div className="climb-grade-row">
          {climb.setter_grade && (
            <div className="climb-grade-box">
              <span className="climb-grade-lbl">SETTER</span>
              <span className="climb-grade-val">{climb.setter_grade}</span>
            </div>
          )}
          {climb.my_grade && (
            <div className="climb-grade-box my">
              <span className="climb-grade-lbl">MINE</span>
              <span className="climb-grade-val">{climb.my_grade}</span>
            </div>
          )}
          <div className="climb-grade-box attempts">
            <span className="climb-grade-lbl">ATTEMPTS</span>
            <span className="climb-grade-val">{climb.attempts}</span>
          </div>
        </div>

        {climb.notes && <div className="climb-card-notes">{climb.notes}</div>}
      </div>
    </div>
  );
}

export default function Climbs() {
  const { climbs, addClimb, updateClimb, deleteClimb } = useClimbing();
  const [filter,  setFilter]  = useState('all');
  const [modal,   setModal]   = useState(null); // null | 'new' | climbObj

  useEffect(() => {
    const handler = () => setModal('new');
    window.addEventListener('shortcut:new', handler);
    return () => window.removeEventListener('shortcut:new', handler);
  }, []);

  const filtered = filter === 'all' ? climbs
    : climbs.filter(c => c.climb_type === filter);

  const total    = climbs.length;
  const sent     = climbs.filter(c => c.sent).length;
  const flashed  = climbs.filter(c => c.flash).length;
  const sendRate = total > 0 ? Math.round(sent / total * 100) : 0;
  const mo       = new Date().toISOString().slice(0, 7);
  const thisMonth = climbs.filter(c => c.date?.startsWith(mo)).length;

  const handleSave = async (fields, photo) => {
    if (modal === 'new') await addClimb(fields, photo);
    else await updateClimb(modal.id, fields, photo);
    setModal(null);
  };

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <h1>CLIMBING LOG</h1>
          <p>{total} climbs logged</p>
        </div>
        <button className="sidebar-add-btn" onClick={() => setModal('new')}>+ LOG CLIMB</button>
      </div>

      {/* Stats */}
      <div className="climb-stats-row">
        {[
          { l: 'TOTAL', v: total },
          { l: 'SENT', v: sent },
          { l: 'SEND RATE', v: `${sendRate}%` },
          { l: 'FLASH', v: flashed },
          { l: 'THIS MONTH', v: thisMonth },
        ].map(({ l, v }) => (
          <div key={l} className="climb-stat-box">
            <div className="climb-stat-val">{v}</div>
            <div className="climb-stat-lbl">{l}</div>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="chips">
        {['all', 'boulder', 'sport'].map(f => (
          <button key={f} className={`chip ${filter === f ? 'active' : 'inactive'}`}
            onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'boulder' ? <><Px name="target" size={12} /> Boulder</> : <><Px name="arrow-up" size={12} /> Sport</>}
          </button>
        ))}
      </div>

      {filtered.length === 0
        ? <div className="empty-state">No climbs yet.<br/>Log your first send!</div>
        : <div className="climb-grid">
            {filtered.map(c => (
              <ClimbCard
                key={c.id}
                climb={c}
                onEdit={() => setModal(c)}
                onDelete={() => deleteClimb(c.id)}
              />
            ))}
          </div>
      }

      {modal && (
        <ClimbModal
          initial={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
