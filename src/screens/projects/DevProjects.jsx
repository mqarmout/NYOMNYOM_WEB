import { useState, useEffect, useRef } from "react";
import { useDevProjects } from "../../context/ProjectsContext";
import { KanbanModal } from "./KanbanBoard";
import {
  Px,
  IClose,
  IEdit,
  IChevDown,
  IChevUp,
  IWarning,
  IBoard,
  ICal,
  IExtLink,
  IRefresh,
} from "../../icons";
import styles from "./projects.module.css";

const STATUSES = ["active", "paused", "completed", "idea"];
const PRIORITIES = ["high", "medium", "low"];

const STATUS_LABELS = { active: "ACTIVE", paused: "PAUSED", completed: "DONE", idea: "IDEA" };
const PRIORITY_LABELS = { high: "HIGH ↑", medium: "MED", low: "LOW ↓" };

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY = {
  name: "",
  description: "",
  status: "active",
  priority: "medium",
  tech_stack: "",
  github_url: "",
  live_url: "",
  start_date: today(),
  notes: "",
};

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function ProjectModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial
      ? {
          ...initial,
          tech_stack: initial.tech_stack || "",
          github_url: initial.github_url || "",
          live_url: initial.live_url || "",
          start_date: initial.start_date || today(),
          notes: initial.notes || "",
          description: initial.description || "",
        }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const saveRef = useRef(null);
  saveRef.current = handleSave;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
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
      <div className="modal-box" style={{ width: 580 }}>
        <div className="modal-header">
          <span className="modal-title">{initial ? "EDIT PROJECT" : "NEW PROJECT"}</span>
          <button className="close-btn" onClick={onClose}>
            <IClose />
          </button>
        </div>

        <div className="field">
          <label>Project Name</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="NYOMNYOM, my-cli-tool..."
            autoFocus
          />
        </div>

        <div className="field">
          <label>Status</label>
          <div style={{ display: "flex", gap: 8 }}>
            {STATUSES.map((s) => (
              <button
                key={s}
                className={`chip ${form.status === s ? "active" : "inactive"}`}
                style={{ flex: 1 }}
                onClick={() => set("status", s)}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Priority</label>
          <div style={{ display: "flex", gap: 8 }}>
            {PRIORITIES.map((p) => (
              <button
                key={p}
                className={`chip ${form.priority === p ? "active" : "inactive"}`}
                style={{ flex: 1 }}
                onClick={() => set("priority", p)}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Description</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What is this project?"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <div className="field">
            <label>Tech Stack</label>
            <input
              value={form.tech_stack}
              onChange={(e) => set("tech_stack", e.target.value)}
              placeholder="React, Python, SQLite..."
            />
          </div>
          <div className="field">
            <label>Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => set("start_date", e.target.value)}
            />
          </div>
          <div className="field">
            <label>GitHub URL</label>
            <input
              value={form.github_url}
              onChange={(e) => set("github_url", e.target.value)}
              placeholder="https://github.com/..."
            />
          </div>
          <div className="field">
            <label>Live URL</label>
            <input
              value={form.live_url}
              onChange={(e) => set("live_url", e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Ideas, blockers, context..."
          />
        </div>

        <button
          className="modal-save-btn"
          onClick={handleSave}
          disabled={saving || !form.name.trim()}
        >
          {saving ? "SAVING…" : initial ? "UPDATE PROJECT" : "ADD PROJECT"}
        </button>
      </div>
    </div>
  );
}

function ProjectCard({ project, onEdit, onDelete, onOpenBoard }) {
  const { commits, fetchCommit } = useDevProjects();
  const [expanded, setExpanded] = useState(false);
  const [fetchingCommit, setFetchingCommit] = useState(false);

  const commit = commits[project.id];
  const daysActive = daysSince(project.start_date);
  const commitDaysAgo = commit ? daysSince(commit.date.slice(0, 10)) : null;
  const isStale = commitDaysAgo !== null && commitDaysAgo > 14;

  useEffect(() => {
    if (expanded && project.github_url && !commit && !fetchingCommit) {
      setFetchingCommit(true);
      fetchCommit(project.id).finally(() => setFetchingCommit(false));
    }
  }, [expanded]);

  const techChips = (project.tech_stack || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div className={styles.devpCard}>
      <div className={styles.devpCardHeader} onClick={() => setExpanded((e) => !e)}>
        <div className={styles.devpCardHeaderLeft}>
          <span className={styles.devpName}>{project.name}</span>
          <span className={`${styles.devpStatusBadge} ${styles["s-" + project.status]}`}>
            {STATUS_LABELS[project.status]}
          </span>
          <span className={`${styles.devpPriorityBadge} ${styles["p-" + project.priority]}`}>
            {PRIORITY_LABELS[project.priority]}
          </span>
          {isStale && (
            <span className={styles.devpStaleBadge}>
              <IWarning /> STALE
            </span>
          )}
        </div>
        <div className={styles.devpCardHeaderRight}>
          <button
            className={styles.devpBoardBtn}
            onClick={(e) => {
              e.stopPropagation();
              onOpenBoard(project);
            }}
            title="Open kanban board"
          >
            <IBoard /> BOARD
          </button>
          <span className={styles.devpChevron}>{expanded ? <IChevUp /> : <IChevDown />}</span>
          <button
            className="climb-card-action"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edit"
          >
            <IEdit />
          </button>
          <button
            className="climb-card-action danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete"
          >
            <IClose />
          </button>
        </div>
      </div>

      {expanded && (
        <div className={styles.devpCardBody}>
          {project.description && <div className={styles.devpDesc}>{project.description}</div>}

          {techChips.length > 0 && (
            <div className={styles.devpTechChips}>
              {techChips.map((t) => (
                <span key={t} className={styles.devpTechChip}>
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className={styles.devpMeta}>
            {daysActive !== null && (
              <span>
                <ICal /> {daysActive}d active
              </span>
            )}
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noreferrer"
                className={styles.devpLink}
                onClick={(e) => e.stopPropagation()}
              >
                GitHub <IExtLink />
              </a>
            )}
            {project.live_url && (
              <a
                href={project.live_url}
                target="_blank"
                rel="noreferrer"
                className={styles.devpLink}
                onClick={(e) => e.stopPropagation()}
              >
                Live <IExtLink />
              </a>
            )}
          </div>

          {project.github_url && (
            <div className={styles.devpCommit}>
              {fetchingCommit && <span className={styles.devpCommitLoading}>fetching commit…</span>}
              {!fetchingCommit && commit && (
                <>
                  <span className={styles.devpCommitSha}>{commit.sha}</span>
                  <span className={styles.devpCommitMsg}>{commit.message}</span>
                  <span className={`${styles.devpCommitAge}${isStale ? " " + styles.stale : ""}`}>
                    {commitDaysAgo === 0 ? "today" : `${commitDaysAgo}d ago`}
                  </span>
                </>
              )}
              {!fetchingCommit && !commit && (
                <button
                  className={styles.devpFetchBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFetchingCommit(true);
                    fetchCommit(project.id).finally(() => setFetchingCommit(false));
                  }}
                >
                  <IRefresh /> fetch commit
                </button>
              )}
            </div>
          )}

          {project.notes && <div className={styles.devpNotes}>{project.notes}</div>}
        </div>
      )}
    </div>
  );
}

export default function DevProjects() {
  const {
    projects,
    kanbanTasks,
    loadAll,
    addProject,
    updateProject,
    deleteProject,
    addKanbanTask,
    updateKanbanTask,
    deleteKanbanTask,
  } = useDevProjects();

  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [boardProject, setBoardProject] = useState(null);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const handler = () => setModal("new");
    window.addEventListener("shortcut:new", handler);
    return () => window.removeEventListener("shortcut:new", handler);
  }, []);

  const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter);
  const activeCount = projects.filter((p) => p.status === "active").length;
  const inProgress = kanbanTasks.filter((t) => t.status === "in_progress").length;
  const done = kanbanTasks.filter((t) => t.status === "done").length;

  const handleSave = async (fields) => {
    if (modal === "new") await addProject(fields);
    else await updateProject(modal.id, fields);
    setModal(null);
  };

  const handleKanbanMove = async (taskId, newStatus) => {
    const task = kanbanTasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    const started_at =
      newStatus === "in_progress" && !task.started_at
        ? new Date().toISOString().slice(0, 19)
        : task.started_at;
    await updateKanbanTask(taskId, { ...task, status: newStatus, started_at });
  };

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <h1>PROJECTS</h1>
          <p>
            {projects.length} project{projects.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <button className="sidebar-add-btn" onClick={() => setModal("new")}>
          + NEW PROJECT
        </button>
      </div>

      <div className="climb-stats-row">
        {[
          { l: "TOTAL", v: projects.length },
          { l: "ACTIVE", v: activeCount },
          { l: "IN PROGRESS", v: inProgress },
          { l: "DONE", v: done },
        ].map(({ l, v }) => (
          <div key={l} className="climb-stat-box">
            <div className="climb-stat-val">{v}</div>
            <div className="climb-stat-lbl">{l}</div>
          </div>
        ))}
      </div>

      <div className="chips">
        {["all", ...STATUSES].map((f) => (
          <button
            key={f}
            className={`chip ${filter === f ? "active" : "inactive"}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          No projects here.
          <br />
          Click + NEW PROJECT to get started.
        </div>
      ) : (
        <div className={styles.devpList}>
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onEdit={() => setModal(p)}
              onDelete={() => deleteProject(p.id)}
              onOpenBoard={setBoardProject}
            />
          ))}
        </div>
      )}

      {modal && (
        <ProjectModal
          initial={modal === "new" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {boardProject && (
        <KanbanModal
          project={boardProject}
          tasks={kanbanTasks}
          projects={projects}
          onAdd={addKanbanTask}
          onUpdate={updateKanbanTask}
          onMove={handleKanbanMove}
          onDelete={deleteKanbanTask}
          onClose={() => setBoardProject(null)}
        />
      )}
    </div>
  );
}
