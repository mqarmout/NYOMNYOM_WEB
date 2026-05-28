import { useState, useEffect, useRef } from "react";
import { IClose, ICal, IBoard } from "../../icons";

const COLUMNS = [
  { id: "backlog", label: "BACKLOG", accentVar: "rgba(150,150,150,0.25)" },
  { id: "in_progress", label: "IN PROGRESS", accentVar: "rgba(224,180,58,0.25)" },
  { id: "done", label: "DONE", accentVar: "rgba(74,184,122,0.25)" },
];

const PRIORITY_LABELS = { high: "HIGH+", medium: "MED", low: "LOW-" };

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

// ── Add / Edit modal ──────────────────────────────────────────────────────────

function TaskModal({ initial, projects, defaultProjectIds, onSave, onClose }) {
  const isEdit = Boolean(initial);

  const initProjectIds = () => {
    if (initial?.project_ids?.length) return initial.project_ids;
    if (defaultProjectIds?.length) return defaultProjectIds;
    return [];
  };

  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [priority, setPriority] = useState(initial?.priority || "medium");
  const [dueDate, setDueDate] = useState(initial?.due_date || "");
  const [projectIds, setProjectIds] = useState(initProjectIds);

  const toggleProject = (id) =>
    setProjectIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      due_date: dueDate || null,
      project_ids: projectIds,
      ...(isEdit
        ? { status: initial.status, started_at: initial.started_at }
        : { status: "backlog" }),
    });
  };

  const saveRef = useRef(null);
  saveRef.current = handleSave;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        onClose();
        return;
      }
      if (e.key === "Enter" && !["TEXTAREA", "SELECT", "BUTTON"].includes(e.target.tagName)) {
        e.preventDefault();
        saveRef.current?.();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width: 420 }}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? "EDIT TASK" : "ADD TASK"}</span>
          <button className="close-btn" onClick={onClose}>
            <IClose />
          </button>
        </div>

        <div className="field">
          <label>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
          />
        </div>

        <div className="field">
          <label>
            Description{" "}
            <span style={{ color: "var(--muted)", fontWeight: "normal" }}>(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more context, links, or steps…"
            rows={4}
          />
        </div>

        <div className="field">
          <label>Priority</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["high", "medium", "low"].map((p) => (
              <button
                key={p}
                className={`chip ${priority === p ? "active" : "inactive"}`}
                style={{ flex: 1 }}
                onClick={() => setPriority(p)}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>
            Due Date <span style={{ color: "var(--muted)", fontWeight: "normal" }}>(optional)</span>
          </label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        {projects.length > 0 && (
          <div className="field">
            <label>
              Projects{" "}
              <span style={{ color: "var(--muted)", fontWeight: "normal" }}>(optional)</span>
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {projects.map((p) => (
                <button
                  key={p.id}
                  className={`chip ${projectIds.includes(p.id) ? "active" : "inactive"}`}
                  onClick={() => toggleProject(p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="modal-save-btn" onClick={handleSave} disabled={!title.trim()}>
          {isEdit ? "SAVE CHANGES" : "ADD TO BACKLOG"}
        </button>
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function KanbanCard({ task, showProject, projects, onEdit, onDelete, dragHandlers }) {
  const taskProjects = (task.project_ids || [])
    .map((id) => projects.find((p) => p.id === id))
    .filter(Boolean);
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = task.due_date && task.due_date < today && task.status !== "done";
  const startedDays = task.started_at ? daysSince(task.started_at.slice(0, 10)) : null;

  return (
    <div
      className="kb-card"
      draggable
      onClick={() => onEdit(task)}
      onDragStart={(e) => {
        e.dataTransfer.setData("taskId", String(task.id));
        dragHandlers.start(task.id);
      }}
      onDragEnd={dragHandlers.end}
    >
      <div className="kb-card-top">
        <span className="kb-card-title">{task.title}</span>
        <button
          className="kb-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
        >
          <IClose />
        </button>
      </div>
      <div className="kb-card-meta">
        {showProject &&
          taskProjects.map((p) => (
            <span key={p.id} className="kb-card-project">
              {p.name}
            </span>
          ))}
        <span className={`devp-priority-badge p-${task.priority}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
        {task.due_date && (
          <span className={`kb-card-due${isOverdue ? " overdue" : ""}`}>
            <ICal /> {task.due_date}
          </span>
        )}
        {startedDays !== null && (
          <span className="kb-card-started">
            ▶ {startedDays === 0 ? "today" : `${startedDays}d`}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────

function KanbanColumn({
  col,
  tasks,
  showProject,
  projects,
  onEdit,
  onMove,
  onDelete,
  dragHandlers,
}) {
  const [over, setOver] = useState(false);

  return (
    <div
      className={`kb-col${over ? " kb-col-over" : ""}`}
      style={{ borderTopColor: col.accentVar }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = parseInt(e.dataTransfer.getData("taskId"));
        if (id) onMove(id, col.id);
      }}
    >
      <div className="kb-col-header">
        <span className="kb-col-title">{col.label}</span>
        <span className="kb-col-count">{tasks.length}</span>
      </div>
      <div className="kb-col-body">
        {tasks.map((t) => (
          <KanbanCard
            key={t.id}
            task={t}
            showProject={showProject}
            projects={projects}
            onEdit={onEdit}
            onDelete={onDelete}
            dragHandlers={dragHandlers}
          />
        ))}
        {tasks.length === 0 && <div className="kb-col-empty">Drop tasks here</div>}
      </div>
    </div>
  );
}

// ── Board ─────────────────────────────────────────────────────────────────────

export function KanbanBoard({
  tasks,
  projects,
  showProject,
  onAdd,
  onUpdate,
  onMove,
  onDelete,
  defaultProjectIds,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [draggingId, setDraggingId] = useState(null);

  useEffect(() => {
    const handler = () => setShowAdd(true);
    window.addEventListener("shortcut:new", handler);
    return () => window.removeEventListener("shortcut:new", handler);
  }, []);

  const dragHandlers = {
    start: (id) => setDraggingId(id),
    end: () => setDraggingId(null),
  };

  return (
    <div className="kb-board">
      <div className="kb-board-topbar">
        <button
          className="sidebar-add-btn"
          style={{ width: "auto", padding: "10px 20px" }}
          onClick={() => setShowAdd(true)}
        >
          + ADD TASK
        </button>
      </div>

      <div className="kb-columns">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            col={col}
            tasks={tasks.filter((t) => t.status === col.id)}
            showProject={showProject}
            projects={projects}
            onEdit={setEditingTask}
            onMove={onMove}
            onDelete={onDelete}
            dragHandlers={dragHandlers}
          />
        ))}
      </div>

      {showAdd && (
        <TaskModal
          projects={projects}
          defaultProjectIds={defaultProjectIds ?? []}
          onSave={(fields) => {
            onAdd(fields);
            setShowAdd(false);
          }}
          onClose={() => setShowAdd(false)}
        />
      )}

      {editingTask && (
        <TaskModal
          initial={editingTask}
          projects={projects}
          defaultProjectIds={[]}
          onSave={(fields) => {
            onUpdate(editingTask.id, fields);
            setEditingTask(null);
          }}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}

// ── Project-scoped modal ──────────────────────────────────────────────────────

export function KanbanModal({
  project,
  tasks,
  projects,
  onAdd,
  onUpdate,
  onMove,
  onDelete,
  onClose,
}) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        if (document.querySelectorAll(".modal-overlay").length <= 1) onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="kb-modal-box">
        <div className="modal-header" style={{ padding: "14px 20px" }}>
          <span className="modal-title">
            <IBoard size={13} /> {project.name.toUpperCase()}
          </span>
          <button className="close-btn" onClick={onClose}>
            <IClose />
          </button>
        </div>
        <div className="kb-modal-body">
          <KanbanBoard
            tasks={tasks.filter((t) => (t.project_ids || []).includes(project.id))}
            projects={projects}
            showProject={false}
            onAdd={onAdd}
            onUpdate={onUpdate}
            onMove={onMove}
            onDelete={onDelete}
            defaultProjectIds={[project.id]}
          />
        </div>
      </div>
    </div>
  );
}
