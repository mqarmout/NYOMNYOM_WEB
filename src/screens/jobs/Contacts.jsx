import { useState, useEffect, useRef } from 'react';
import { useJob } from '../../context/JobContext';
import { IClose } from '../../icons';

function ContactModal({ initial, jobs, onSave, onClose }) {
  const [name,  setName]  = useState(initial?.name  || '');
  const [role,  setRole]  = useState(initial?.role  || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [jobId, setJobId] = useState(initial?.job_id || (jobs[0]?.id ?? null));

  const handleSave = () => {
    if (!name.trim() || !jobId) return;
    onSave({ name: name.trim(), role: role.trim() || null, email: email.trim() || null, phone: phone.trim() || null, notes: notes.trim() || null, job_id: jobId });
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
          <div className="modal-title">{initial ? 'Edit Contact' : 'Add Contact'}</div>
          <button className="close-btn" onClick={onClose}><IClose /></button>
        </div>

        <div className="field">
          <label>Linked Application</label>
          <select value={jobId || ''} onChange={e => setJobId(parseInt(e.target.value))}>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.company} — {j.role}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Name</label>
          <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} autoFocus={!initial} />
        </div>
        <div className="field">
          <label>Title / Role</label>
          <input type="text" placeholder="e.g. Recruiter, Hiring Manager" value={role} onChange={e => setRole(e.target.value)} />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" placeholder="email@company.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Phone</label>
          <input type="tel" placeholder="+1 555 000 0000" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="field">
          <label>Notes</label>
          <textarea placeholder="Any notes..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ width: '100%', padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontSize: 14, outline: 'none', resize: 'vertical' }} />
        </div>

        <button className="modal-save-btn" onClick={handleSave} disabled={!name.trim() || !jobId}>
          {initial ? 'Save Changes' : 'Add Contact'}
        </button>
      </div>
    </div>
  );
}

export default function Contacts() {
  const { contacts, jobs, loadAll, addContact, updateContact, deleteContact } = useJob();
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { loadAll(); }, [loadAll]);

  const jobsRef = useRef(jobs);
  useEffect(() => { jobsRef.current = jobs; }, [jobs]);

  useEffect(() => {
    const handler = () => { if (jobsRef.current.length > 0) setModal({ mode: 'add' }); };
    window.addEventListener('shortcut:new', handler);
    return () => window.removeEventListener('shortcut:new', handler);
  }, []);

  const filtered = search.trim()
    ? contacts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.company || '').toLowerCase().includes(search.toLowerCase())
      )
    : contacts;

  const handleSave = async (data) => {
    if (modal.mode === 'add') await addContact(data.job_id, data);
    else await updateContact(modal.contact.id, data);
    setModal(null);
  };

  const getInitials = (name) => name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="screen">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Contacts</h1>
          <p>{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
        </div>
        {jobs.length > 0 && (
          <button className="sidebar-add-btn" style={{ width: 'auto', padding: '10px 20px', marginTop: 4 }}
            onClick={() => setModal({ mode: 'add' })}>+ Add Contact</button>
        )}
      </div>

      {contacts.length > 0 && (
        <div className="field" style={{ marginBottom: 20 }}>
          <input type="text" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          {contacts.length === 0
            ? 'No contacts yet.\nAdd an application first, then add contacts to it.'
            : 'No contacts match your search.'}
        </div>
      ) : (
        <div className="contact-list">
          {filtered.map(c => (
            <div className="contact-item" key={c.id} onClick={() => setModal({ mode: 'edit', contact: c })}>
              <div className="contact-avatar">{getInitials(c.name)}</div>
              <div className="contact-info">
                <div className="contact-name">{c.name}</div>
                <div className="contact-meta">
                  {c.role && <span>{c.role}</span>}
                  {c.company && <span>@ {c.company}</span>}
                </div>
                <div className="contact-details">
                  {c.email && <a href={'mailto:' + c.email} onClick={e => e.stopPropagation()}>{c.email}</a>}
                  {c.phone && <span>{c.phone}</span>}
                </div>
              </div>
              <button className="tx-delete" onClick={e => { e.stopPropagation(); deleteContact(c.id); }}><IClose /></button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ContactModal
          initial={modal.mode === 'edit' ? modal.contact : null}
          jobs={jobs}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
