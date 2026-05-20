import { useState, useEffect, useRef } from 'react';
import { useJob } from '../../context/JobContext';
import { IClose, IExtLink } from '../../icons';

const STATUSES = ['applied', 'screening', 'interviewing', 'offer', 'rejected', 'withdrawn'];

const STATUS_LABEL = {
  applied:      'Applied',
  screening:    'Screening',
  interviewing: 'Interviewing',
  offer:        'Offer',
  rejected:     'Rejected',
  withdrawn:    'Withdrawn',
};

function JobModal({ initial, onSave, onClose }) {
  const [company,      setCompany]      = useState(initial?.company      || '');
  const [role,         setRole]         = useState(initial?.role         || '');
  const [status,       setStatus]       = useState(initial?.status       || 'applied');
  const [dateApplied,  setDateApplied]  = useState(initial?.date_applied || '');
  const [salaryMin,    setSalaryMin]    = useState(initial?.salary_min   != null ? initial.salary_min : '');
  const [salaryMax,    setSalaryMax]    = useState(initial?.salary_max   != null ? initial.salary_max : '');
  const [url,          setUrl]          = useState(initial?.url          || '');
  const [notes,        setNotes]        = useState(initial?.notes        || '');

  const handleSave = () => {
    if (!company.trim() || !role.trim()) return;
    onSave({
      company: company.trim(), role: role.trim(), status,
      date_applied:  dateApplied  || null,
      salary_min:    salaryMin    !== '' ? parseFloat(salaryMin)  : null,
      salary_max:    salaryMax    !== '' ? parseFloat(salaryMax)  : null,
      url:           url.trim()   || null,
      notes:         notes.trim() || null,
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
          <div className="modal-title">{initial ? 'Edit Application' : 'Add Application'}</div>
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
        <div className="field">
          <label>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Date Applied</label>
          <input type="date" value={dateApplied} onChange={e => setDateApplied(e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Salary Min</label>
            <input type="number" min="0" placeholder="e.g. 60000" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} />
          </div>
          <div className="field">
            <label>Salary Max</label>
            <input type="number" min="0" placeholder="e.g. 90000" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Job URL</label>
          <input type="url" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
        </div>
        <div className="field">
          <label>Notes</label>
          <textarea placeholder="Any notes..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ width: '100%', padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontSize: 14, outline: 'none', resize: 'vertical' }} />
        </div>

        <button className="modal-save-btn" onClick={handleSave} disabled={!company.trim() || !role.trim()}>
          {initial ? 'Save Changes' : 'Add Application'}
        </button>
      </div>
    </div>
  );
}

export default function Applications() {
  const { jobs, loadAll, addJob, updateJob, deleteJob, showToast } = useJob();
  const [modal, setModal] = useState(null);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const handler = () => setModal({ mode: 'add' });
    window.addEventListener('shortcut:new', handler);
    return () => window.removeEventListener('shortcut:new', handler);
  }, []);

  const handleSave = async (data) => {
    if (modal.mode === 'add') await addJob(data);
    else await updateJob(modal.job.id, data);
    setModal(null);
  };

  const activeJobs   = jobs.filter(j => !['rejected', 'withdrawn'].includes(j.status));
  const archivedJobs = jobs.filter(j =>  ['rejected', 'withdrawn'].includes(j.status));

  const salaryRange = (j) => {
    if (!j.salary_min && !j.salary_max) return null;
    if (j.salary_min && j.salary_max) return `$${(j.salary_min/1000).toFixed(0)}k–$${(j.salary_max/1000).toFixed(0)}k`;
    return `$${((j.salary_min || j.salary_max)/1000).toFixed(0)}k`;
  };

  const JobCard = ({ job }) => (
    <div className="job-card" onClick={() => setModal({ mode: 'edit', job })}>
      <div className="job-card-header">
        <div className="job-card-company">{job.company}</div>
        <button className="tx-delete" onClick={e => { e.stopPropagation(); deleteJob(job.id); }}><IClose /></button>
      </div>
      <div className="job-card-role">{job.role}</div>
      <div className="job-card-meta">
        {job.date_applied && <span>{job.date_applied}</span>}
        {salaryRange(job) && <span>{salaryRange(job)}</span>}
      </div>
      {job.url && <a className="job-card-link" href={job.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>View posting <IExtLink /></a>}
    </div>
  );

  const Column = ({ status, label }) => {
    const col = activeJobs.filter(j => j.status === status);
    return (
      <div className="job-column">
        <div className="job-column-header">
          <span className="job-column-label">{label}</span>
          <span className="job-column-count">{col.length}</span>
        </div>
        <div className="job-column-body">
          {col.map(j => <JobCard key={j.id} job={j} />)}
        </div>
      </div>
    );
  };

  return (
    <div className="screen">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Applications</h1>
          <p>{jobs.length} total · {activeJobs.length} active</p>
        </div>
        <button className="sidebar-add-btn" style={{ width: 'auto', padding: '10px 20px', marginTop: 4 }}
          onClick={() => setModal({ mode: 'add' })}>+ Add Application</button>
      </div>

      <div className="job-board">
        {['applied', 'screening', 'interviewing', 'offer'].map(s => (
          <Column key={s} status={s} label={STATUS_LABEL[s]} />
        ))}
      </div>

      {archivedJobs.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 32 }}>Archived</div>
          <div className="job-archive-list">
            {archivedJobs.map(j => (
              <div className="job-archive-item" key={j.id} onClick={() => setModal({ mode: 'edit', job: j })}>
                <div className="job-archive-info">
                  <span className="job-archive-company">{j.company}</span>
                  <span className="job-archive-role">{j.role}</span>
                </div>
                <div className="job-archive-right">
                  <span className={'job-status-badge status-' + j.status}>{STATUS_LABEL[j.status]}</span>
                  <button className="tx-delete" onClick={e => { e.stopPropagation(); deleteJob(j.id); }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modal && (
        <JobModal
          initial={modal.mode === 'edit' ? modal.job : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
