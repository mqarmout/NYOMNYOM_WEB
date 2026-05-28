import { useState, useEffect, useRef } from "react";
import { useJob } from "../../context/JobContext";
import { apiFetch } from "../../utils";
import { IClose, IExtLink } from "../../icons";

const STATUSES = ["applied", "screening", "interviewing", "offer", "rejected", "withdrawn"];

const STATUS_LABEL = {
  applied: "Applied",
  screening: "Screening",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

// ── client-side text extraction ───────────────────────────────────────────────

function extractFromText(text) {
  let role = null,
    company = null,
    salary = null;

  const salaryM = text.match(
    /\$\s*[\d,]+(?:\.\d+)?\s*[kK]?(?:\s*[-–—]\s*\$?\s*[\d,]+(?:\.\d+)?\s*[kK]?)?(?:\s*\/?\s*(?:year|yr|annual|hr|hour))?/
  );
  if (salaryM) salary = salaryM[0].trim();

  // "Role at Company" — common in pasted descriptions
  const atM = text.match(/^([A-Z][^\n]{2,60}?)\s+at\s+([A-Z][^\n]{2,40})/m);
  if (atM) {
    role = atM[1].trim();
    company = atM[2].trim();
  }

  if (!company) {
    const coM = text.match(/\b(?:company|employer|organization)\s*:\s*([^\n]+)/i);
    if (coM) company = coM[1].trim();
  }
  if (!role) {
    const roleM = text.match(/\b(?:job title|position|role|title)\s*:\s*([^\n]+)/i);
    if (roleM) role = roleM[1].trim();
  }
  if (!role) {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const first = lines.find((l) => l.length >= 3 && l.length <= 80);
    if (first) role = first;
  }

  return { role, company, salary };
}

// ── step 1: URL input ─────────────────────────────────────────────────────────

function UrlStepModal({ onSuccess, onFailed, onSkip, onClose }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExtract = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      onSkip();
      return;
    }
    setLoading(true);
    const res = await apiFetch("/api/jobs/extract", {
      method: "POST",
      body: JSON.stringify({ url: trimmed }),
    });
    setLoading(false);
    if (res.error) {
      onFailed(
        trimmed,
        "The server couldn't fetch that URL — it may require a login or block automated access."
      );
      return;
    }
    onSuccess({ ...res, url: trimmed });
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") handleExtract();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">Add Application</div>
          <button className="close-btn" onClick={onClose}>
            <IClose />
          </button>
        </div>

        <div className="field">
          <label>Paste the job posting URL</label>
          <input
            type="url"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="modal-save-btn"
            onClick={handleExtract}
            disabled={loading}
            style={{ flex: 1 }}
          >
            {loading ? "Extracting…" : "Extract & Continue"}
          </button>
          <button
            className="modal-save-btn"
            onClick={onSkip}
            disabled={loading}
            style={{ flex: 1, background: "var(--surface2)", color: "var(--muted)" }}
          >
            Add Manually
          </button>
        </div>
      </div>
    </div>
  );
}

// ── step 2a: extraction preview (success) ────────────────────────────────────

const FIELD_LABELS = { company: "Company", role: "Role", salary: "Salary", site_used: "Site" };

function PreviewModal({ prefill, onContinue, onClose }) {
  const found = Object.entries(FIELD_LABELS)
    .filter(([k]) => prefill[k])
    .map(([k, label]) => ({ label, value: prefill[k] }));

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">Extraction Result</div>
          <button className="close-btn" onClick={onClose}>
            <IClose />
          </button>
        </div>

        {found.length > 0 ? (
          <>
            <div style={{ fontSize: 12, color: "var(--accent)", marginBottom: 14 }}>
              {found.length} field{found.length !== 1 ? "s" : ""} extracted
              {prefill.site_used ? ` from ${prefill.site_used}` : ""}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
                marginBottom: 20,
                border: "1px solid var(--border)",
              }}
            >
              {found.map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "9px 12px",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "var(--muted)", width: 60, flexShrink: 0, fontSize: 11 }}>
                    {label}
                  </span>
                  <span style={{ color: "var(--text)" }}>{value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
            Nothing specific could be extracted
            {prefill.site_used ? ` from ${prefill.site_used}` : ""}. The URL has been saved — fill
            in the rest manually.
          </div>
        )}

        <button className="modal-save-btn" onClick={onContinue}>
          Continue to Form
        </button>
      </div>
    </div>
  );
}

// ── step 2b: description paste (failure) ─────────────────────────────────────

function DescriptionModal({ url, errorMsg, onContinue, onClose }) {
  const [text, setText] = useState("");

  const handleContinue = () => {
    const extracted = text.trim() ? extractFromText(text) : {};
    onContinue({ url, ...extracted, notes: text.trim() || null });
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">Paste Job Description</div>
          <button className="close-btn" onClick={onClose}>
            <IClose />
          </button>
        </div>

        <div
          style={{
            fontSize: 12,
            color: "var(--danger)",
            background: "rgba(255,48,48,0.06)",
            border: "1px solid rgba(255,48,48,0.2)",
            padding: "10px 12px",
            marginBottom: 16,
          }}
        >
          {errorMsg}
        </div>

        <div className="field">
          <label>Job description</label>
          <textarea
            placeholder="Paste the full job posting text here — company, role, and salary will be extracted automatically…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            autoFocus
            style={{
              width: "100%",
              padding: "12px 14px",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--text)",
              fontSize: 13,
              outline: "none",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="modal-save-btn"
            onClick={handleContinue}
            style={{ flex: 1 }}
            disabled={!text.trim()}
          >
            Extract & Continue
          </button>
          <button
            className="modal-save-btn"
            onClick={() => onContinue({ url })}
            style={{ flex: 1, background: "var(--surface2)", color: "var(--muted)" }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

// ── step 3: full job form ────────────────────────────────────────────────────

function JobModal({ initial, onSave, onClose }) {
  const [company, setCompany] = useState(initial?.company || "");
  const [role, setRole] = useState(initial?.role || "");
  const [status, setStatus] = useState(initial?.status || "applied");
  const [dateApplied, setDateApplied] = useState(
    initial?.date_applied || new Date().toISOString().slice(0, 10)
  );
  const [salary, setSalary] = useState(initial?.salary || "");
  const [siteUsed, setSiteUsed] = useState(initial?.site_used || "");
  const [url, setUrl] = useState(initial?.url || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  const handleSave = () => {
    if (!company.trim() || !role.trim()) return;
    onSave({
      company: company.trim(),
      role: role.trim(),
      status,
      date_applied: dateApplied || null,
      salary: salary.trim() || null,
      site_used: siteUsed.trim() || null,
      url: url.trim() || null,
      notes: notes.trim() || null,
    });
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
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{initial?.id ? "Edit Application" : "Add Application"}</div>
          <button className="close-btn" onClick={onClose}>
            <IClose />
          </button>
        </div>

        <div className="field">
          <label>Company</label>
          <input
            type="text"
            placeholder="Company name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            autoFocus={!initial?.id}
          />
        </div>
        <div className="field">
          <label>Role</label>
          <input
            type="text"
            placeholder="Job title"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Date Applied</label>
          <input type="date" value={dateApplied} onChange={(e) => setDateApplied(e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field">
            <label>Salary</label>
            <input
              type="text"
              placeholder="e.g. $80k – $100k"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Site Used</label>
            <input
              type="text"
              placeholder="e.g. LinkedIn"
              value={siteUsed}
              onChange={(e) => setSiteUsed(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label>Job URL</label>
          <input
            type="url"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Notes</label>
          <textarea
            placeholder="Any notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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

        <button
          className="modal-save-btn"
          onClick={handleSave}
          disabled={!company.trim() || !role.trim()}
        >
          {initial?.id ? "Save Changes" : "Add Application"}
        </button>
      </div>
    </div>
  );
}

// ── main screen ───────────────────────────────────────────────────────────────

export default function Applications() {
  const { jobs, loadAll, addJob, updateJob, deleteJob } = useJob();
  // modal: null | { mode: 'url' | 'preview' | 'description' | 'add' | 'edit', ...data }
  const [modal, setModal] = useState(null);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const handler = () => setModal({ mode: "url" });
    window.addEventListener("shortcut:new", handler);
    return () => window.removeEventListener("shortcut:new", handler);
  }, []);

  const handleSave = async (data) => {
    if (modal.mode === "add") await addJob(data);
    else await updateJob(modal.job.id, data);
    setModal(null);
  };

  const boardJobs = jobs.filter((j) => j.status !== "withdrawn");
  const archivedJobs = jobs.filter((j) => j.status === "withdrawn");

  const JobCard = ({ job }) => (
    <div className="job-card" onClick={() => setModal({ mode: "edit", job })}>
      <div className="job-card-header">
        <div className="job-card-company">{job.company}</div>
        <button
          className="tx-delete"
          onClick={(e) => {
            e.stopPropagation();
            deleteJob(job.id);
          }}
        >
          <IClose />
        </button>
      </div>
      <div className="job-card-role">{job.role}</div>
      <div className="job-card-meta">
        {job.date_applied && <span>{job.date_applied}</span>}
        {job.salary && <span>{job.salary}</span>}
        {job.site_used && <span>{job.site_used}</span>}
      </div>
      {job.url && (
        <a
          className="job-card-link"
          href={job.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          View posting <IExtLink />
        </a>
      )}
    </div>
  );

  const Column = ({ status, label }) => {
    const col = boardJobs.filter((j) => j.status === status);
    return (
      <div className="job-column">
        <div className="job-column-header">
          <span className="job-column-label">{label}</span>
          <span className="job-column-count">{col.length}</span>
        </div>
        <div className="job-column-body">
          {col.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="screen">
      <div
        className="page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h1>Applications</h1>
          <p>
            {jobs.length} total · {boardJobs.filter((j) => j.status !== "rejected").length} active
          </p>
        </div>
        <button
          className="sidebar-add-btn"
          style={{ width: "auto", padding: "10px 20px", marginTop: 4 }}
          onClick={() => setModal({ mode: "url" })}
        >
          + Add Application
        </button>
      </div>

      <div className="job-board">
        {["applied", "screening", "interviewing", "offer", "rejected"].map((s) => (
          <Column key={s} status={s} label={STATUS_LABEL[s]} />
        ))}
      </div>

      {archivedJobs.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 32 }}>
            Withdrawn
          </div>
          <div className="job-archive-list">
            {archivedJobs.map((j) => (
              <div
                className="job-archive-item"
                key={j.id}
                onClick={() => setModal({ mode: "edit", job: j })}
              >
                <div className="job-archive-info">
                  <span className="job-archive-company">{j.company}</span>
                  <span className="job-archive-role">{j.role}</span>
                </div>
                <div className="job-archive-right">
                  <span className={"job-status-badge status-" + j.status}>
                    {STATUS_LABEL[j.status]}
                  </span>
                  <button
                    className="tx-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteJob(j.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modal?.mode === "url" && (
        <UrlStepModal
          onSuccess={(prefill) => setModal({ mode: "preview", prefill })}
          onFailed={(url, errorMsg) => setModal({ mode: "description", url, errorMsg })}
          onSkip={() => setModal({ mode: "add", prefill: {} })}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.mode === "preview" && (
        <PreviewModal
          prefill={modal.prefill}
          onContinue={() => setModal({ mode: "add", prefill: modal.prefill })}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.mode === "description" && (
        <DescriptionModal
          url={modal.url}
          errorMsg={modal.errorMsg}
          onContinue={(prefill) => setModal({ mode: "add", prefill })}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.mode === "add" && (
        <JobModal initial={modal.prefill} onSave={handleSave} onClose={() => setModal(null)} />
      )}

      {modal?.mode === "edit" && (
        <JobModal initial={modal.job} onSave={handleSave} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
