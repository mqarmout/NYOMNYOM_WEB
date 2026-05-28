import { useState, useEffect } from "react";
import { usePortfolio } from "../../context/PortfolioContext";
import { IClose, IEdit, IExtLink } from "../../icons";

function ProjectModal({ initial, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [techStack, setTechStack] = useState(initial?.tech_stack || "");
  const [githubUrl, setGithubUrl] = useState(initial?.github_url || "");
  const [liveUrl, setLiveUrl] = useState(initial?.live_url || "");

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      tech_stack: techStack.trim() || null,
      github_url: githubUrl.trim() || null,
      live_url: liveUrl.trim() || null,
      display_order: initial?.display_order ?? 0,
    });
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{initial ? "Edit Project" : "Add Project"}</div>
          <button className="close-btn" onClick={onClose}>
            <IClose />
          </button>
        </div>
        <div className="field">
          <label>Title</label>
          <input
            type="text"
            placeholder="Project name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus={!initial}
          />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            placeholder="What does it do?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: "12px 14px",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--text)",
              fontSize: 14,
              outline: "none",
              resize: "vertical",
            }}
          />
        </div>
        <div className="field">
          <label>Tech Stack</label>
          <input
            type="text"
            placeholder="e.g. Python, Flask, React"
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
          />
        </div>
        <div className="field">
          <label>GitHub URL</label>
          <input
            type="url"
            placeholder="https://github.com/..."
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Live URL</label>
          <input
            type="url"
            placeholder="https://..."
            value={liveUrl}
            onChange={(e) => setLiveUrl(e.target.value)}
          />
        </div>
        <button className="modal-save-btn" onClick={handleSave} disabled={!title.trim()}>
          {initial ? "Save Changes" : "Add Project"}
        </button>
      </div>
    </div>
  );
}

export default function Projects() {
  const { projects, loadAll, addProject, updateProject, deleteProject } = usePortfolio();
  const [modal, setModal] = useState(null);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSave = async (data) => {
    if (modal.mode === "add") await addProject(data);
    else await updateProject(modal.project.id, data);
    setModal(null);
  };

  const parseTechStack = (ts) =>
    ts
      ? ts
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

  return (
    <div className="screen">
      <div
        className="page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h1>Projects</h1>
          <p>
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          className="sidebar-add-btn"
          style={{ width: "auto", padding: "10px 20px", marginTop: 4 }}
          onClick={() => setModal({ mode: "add" })}
        >
          + Add Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          No projects yet.
          <br />
          Add your first project to get started.
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((p) => (
            <div className="project-card" key={p.id}>
              <div className="project-card-header">
                <div className="project-title">{p.title}</div>
                <div className="project-actions">
                  <button
                    className="cat-item-edit"
                    onClick={() => setModal({ mode: "edit", project: p })}
                  >
                    <IEdit />
                  </button>
                  <button className="cat-item-delete" onClick={() => deleteProject(p.id)}>
                    <IClose />
                  </button>
                </div>
              </div>
              {p.description && <p className="project-desc">{p.description}</p>}
              {p.tech_stack && (
                <div className="project-tags">
                  {parseTechStack(p.tech_stack).map((t) => (
                    <span className="project-tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="project-links">
                {p.github_url && (
                  <a href={p.github_url} target="_blank" rel="noreferrer" className="project-link">
                    GitHub <IExtLink />
                  </a>
                )}
                {p.live_url && (
                  <a href={p.live_url} target="_blank" rel="noreferrer" className="project-link">
                    Live <IExtLink />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ProjectModal
          initial={modal.mode === "edit" ? modal.project : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
