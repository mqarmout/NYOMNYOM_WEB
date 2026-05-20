import { useState, useEffect } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { IClose, IEdit } from '../../icons';

function ExperienceModal({ initial, onSave, onClose }) {
  const [company,     setCompany]     = useState(initial?.company     || '');
  const [role,        setRole]        = useState(initial?.role        || '');
  const [startDate,   setStartDate]   = useState(initial?.start_date  || '');
  const [endDate,     setEndDate]     = useState(initial?.end_date    || '');
  const [current,     setCurrent]     = useState(!initial?.end_date && !!initial);
  const [description, setDescription] = useState(initial?.description || '');

  const handleSave = () => {
    if (!company.trim() || !role.trim()) return;
    onSave({
      company:     company.trim(),
      role:        role.trim(),
      start_date:  startDate  || null,
      end_date:    current ? null : (endDate || null),
      description: description.trim() || null,
      display_order: initial?.display_order ?? 0,
    });
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{initial ? 'Edit Experience' : 'Add Experience'}</div>
          <button className="close-btn" onClick={onClose}><IClose /></button>
        </div>
        <div className="field">
          <label>Company</label>
          <input type="text" placeholder="Company name" value={company} onChange={e => setCompany(e.target.value)} autoFocus={!initial} />
        </div>
        <div className="field">
          <label>Role</label>
          <input type="text" placeholder="Job title" value={role} onChange={e => setRole(e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Start Date</label>
            <input type="month" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="field">
            <label>End Date</label>
            <input type="month" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={current} style={{ opacity: current ? 0.4 : 1 }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <input type="checkbox" id="current-role" checked={current} onChange={e => setCurrent(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
          <label htmlFor="current-role" style={{ fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>Current position</label>
        </div>
        <div className="field">
          <label>Description</label>
          <textarea placeholder="What did you do?" value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontSize: 14, outline: 'none', resize: 'vertical' }} />
        </div>
        <button className="modal-save-btn" onClick={handleSave} disabled={!company.trim() || !role.trim()}>
          {initial ? 'Save Changes' : 'Add Experience'}
        </button>
      </div>
    </div>
  );
}

export default function Experience() {
  const { experience, loadAll, addExperience, updateExperience, deleteExperience } = usePortfolio();
  const [modal, setModal] = useState(null);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSave = async (data) => {
    if (modal.mode === 'add') await addExperience(data);
    else await updateExperience(modal.exp.id, data);
    setModal(null);
  };

  const formatDateRange = (start, end) => {
    if (!start && !end) return '';
    const fmt = (d) => {
      if (!d) return '';
      const [y, m] = d.split('-');
      return new Date(y, parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };
    return fmt(start) + (end ? ' – ' + fmt(end) : ' – Present');
  };

  return (
    <div className="screen">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Experience</h1>
          <p>{experience.length} position{experience.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="sidebar-add-btn" style={{ width: 'auto', padding: '10px 20px', marginTop: 4 }}
          onClick={() => setModal({ mode: 'add' })}>+ Add Experience</button>
      </div>

      {experience.length === 0 ? (
        <div className="empty-state">No experience yet.</div>
      ) : (
        <div className="timeline">
          {experience.map(e => (
            <div className="timeline-item" key={e.id}>
              <div className="timeline-dot" />
              <div className="timeline-content">
                <div className="timeline-header">
                  <div>
                    <div className="timeline-role">{e.role}</div>
                    <div className="timeline-company">{e.company}</div>
                    <div className="timeline-dates">{formatDateRange(e.start_date, e.end_date)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button className="cat-item-edit" onClick={() => setModal({ mode: 'edit', exp: e })}><IEdit /></button>
                    <button className="cat-item-delete" onClick={() => deleteExperience(e.id)}><IClose /></button>
                  </div>
                </div>
                {e.description && <p className="timeline-desc">{e.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ExperienceModal
          initial={modal.mode === 'edit' ? modal.exp : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
