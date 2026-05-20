import { useState, useEffect, useRef } from 'react';
import { IClose, ICal, IBoard } from '../../icons';

const COLUMNS = [
  { id: 'backlog',     label: 'BACKLOG',      accentVar: 'rgba(150,150,150,0.25)' },
  { id: 'in_progress', label: 'IN PROGRESS',  accentVar: 'rgba(224,180,58,0.25)' },
  { id: 'done',        label: 'DONE',         accentVar: 'rgba(74,184,122,0.25)' },
];

const PRIORITY_LABELS = { high: 'HIGH+', medium: 'MED', low: 'LOW-' };

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function AddTaskModal({ projects, defaultProjectId, onSave, onClose }) {
  const [title,     setTitle]     = useState('');
  const [priority,  setPriority]  = useState('medium');
  const [dueDate,   setDueDate]   = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId ?? '');

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title:      title.trim(),
      priority,
      due_date:   dueDate || null,
      project_id: projectId !== '' ? Number(projectId) : null,
      status:     'backlog',
    });
  };

  const saveRef = useRef(null);
  saveRef.current = handleSave;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { e.stopImmediatePropagation(); onClose(); return; }
      if (e.key === 'Enter' && !['TEXTAREA', 'SELECT', 'BUTTON'].includes(e.target.tagName)) {
        e.preventDefault();
        saveRef.current?.();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width: 420 }}>
        <div className="modal-header">
          <span className="modal-title">ADD TASK</span>
          <button className="close-btn" onClick={onClose}><IClose /></button>
        </div>

        <div className="field">
          <label>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="What needs to be done?" autoFocus />
        </div>

        <div className="field">
          <label>Priority</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['high', 'medium', 'low'].map(p => (
              <button key={p} className={`chip ${priority === p ? 'active' : 'inactive'}`}
                style={{ flex: 1 }} onClick={() => setPriority(p)}>
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Due Date <span style={{ color: 'var(--muted)', fontWeight: 'normal' }}>(optional)</span></label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>

        {defaultProjectId == null && (
          <div className="field">
            <label>Project <span style={{ color: 'var(--muted)', fontWeight: 'normal' }}>(optional)</span></label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)}>
              <option value="">— unlinked —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        <button className="modal-save-btn" onClick={handleSave} disabled={!title.trim()}>
          ADD TO BACKLOG
        </button>
      </div>
    </div>
  );
}

function KanbanCard({ task, showProject, projects, onDelete, dragHandlers }) {
  const project  = projects.find(p => p.id === task.project_id);
  const today    = new Date().toISOString().slice(0, 10);
  const isOverdue = task.due_date && task.due_date < today && task.status !== 'done';
  const startedDays = task.started_at ? daysSince(task.started_at.slice(0, 10)) : null;

  return (
    <div
      className="kb-card"
      draggable
      onDragStart={e => { e.dataTransfer.setData('taskId', String(task.id)); dragHandlers.start(task.id); }}
      onDragEnd={dragHandlers.end}
    >
      <div className="kb-card-top">
        <span className="kb-card-title">{task.title}</span>
        <button className="tx-delete" style={{ flexShrink: 0 }} onClick={() => onDelete(task.id)}><IClose /></button>
      </div>
      <div className="kb-card-meta">
        {showProject && project && (
          <span className="kb-card-project">{project.name}</span>
        )}
        <span className={`devp-priority-badge p-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
        {task.due_date && (
          <span className={`kb-card-due${isOverdue ? ' overdue' : ''}`}>
            <ICal /> {task.due_date}
          </span>
        )}
        {startedDays !== null && (
          <span className="kb-card-started">
            ▶ {startedDays === 0 ? 'today' : `${startedDays}d`}
          </span>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ col, tasks, showProject, projects, onMove, onDelete, dragHandlers }) {
  const [over, setOver] = useState(false);

  return (
    <div
      className={`kb-col${over ? ' kb-col-over' : ''}`}
      style={{ borderTopColor: col.accentVar }}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        e.preventDefault();
        setOver(false);
        const id = parseInt(e.dataTransfer.getData('taskId'));
        if (id) onMove(id, col.id);
      }}
    >
      <div className="kb-col-header">
        <span className="kb-col-title">{col.label}</span>
        <span className="kb-col-count">{tasks.length}</span>
      </div>
      <div className="kb-col-body">
        {tasks.map(t => (
          <KanbanCard
            key={t.id}
            task={t}
            showProject={showProject}
            projects={projects}
            onDelete={onDelete}
            dragHandlers={dragHandlers}
          />
        ))}
        {tasks.length === 0 && (
          <div className="kb-col-empty">Drop tasks here</div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({ tasks, projects, showProject, onAdd, onMove, onDelete, defaultProjectId }) {
  const [showAdd,     setShowAdd]     = useState(false);
  const [draggingId,  setDraggingId]  = useState(null);

  const dragHandlers = {
    start: id => setDraggingId(id),
    end:   ()  => setDraggingId(null),
  };

  return (
    <div className="kb-board">
      <div className="kb-board-topbar">
        <button className="sidebar-add-btn" style={{ width: 'auto', padding: '10px 20px' }}
          onClick={() => setShowAdd(true)}>
          + ADD TASK
        </button>
      </div>

      <div className="kb-columns">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            col={col}
            tasks={tasks.filter(t => t.status === col.id)}
            showProject={showProject}
            projects={projects}
            onMove={onMove}
            onDelete={onDelete}
            dragHandlers={dragHandlers}
          />
        ))}
      </div>

      {showAdd && (
        <AddTaskModal
          projects={projects}
          defaultProjectId={defaultProjectId}
          onSave={fields => { onAdd(fields); setShowAdd(false); }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

export function KanbanModal({ project, tasks, projects, onAdd, onMove, onDelete, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (document.querySelectorAll('.modal-overlay').length <= 1) {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="kb-modal-box">
        <div className="modal-header" style={{ padding: '14px 20px' }}>
          <span className="modal-title"><IBoard size={13} /> {project.name.toUpperCase()}</span>
          <button className="close-btn" onClick={onClose}><IClose /></button>
        </div>
        <div className="kb-modal-body">
          <KanbanBoard
            tasks={tasks.filter(t => t.project_id === project.id)}
            projects={projects}
            showProject={false}
            onAdd={onAdd}
            onMove={onMove}
            onDelete={onDelete}
            defaultProjectId={project.id}
          />
        </div>
      </div>
    </div>
  );
}
