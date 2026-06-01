import { useState, useEffect } from "react";
import { useClimbing } from "../../context/ClimbingContext";
import { useTheme, STATUS, glow as glowFn } from "../../context/ThemeContext";
import Box from "../../components/crt/Box";
import { IClose } from "../../icons";

const VGRADE_ORDER = ["V0","V1","V2","V3","V4","V5","V6","V7","V8","V9","V10"];

function gradeColor(grade, theme) {
  const n = parseInt(grade?.match(/V(\d+)/i)?.[1] ?? "-1");
  if (n >= 5) return STATUS.red;
  if (n === 4) return STATUS.amber;
  if (n >= 2) return theme.accent;
  if (n === 1) return theme.accentDim;
  if (n === 0) return theme.muted;
  return theme.accentDim;
}

function maxGrade(sent) {
  const nums = sent
    .filter(c => c.my_grade)
    .map(c => parseInt(c.my_grade.match(/V(\d+)/i)?.[1] ?? "-1"))
    .filter(n => n >= 0);
  if (!nums.length) return "—";
  return `V${Math.max(...nums)}`;
}

function styleOf(c) {
  if (!c.sent) return "project";
  if (c.flash) return "flash";
  return "redpoint";
}

function QuickLogModal({ onSave, onClose }) {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [grade, setGrade] = useState("V3");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sent, setSent] = useState(true);
  const [flash, setFlash] = useState(false);
  const [attempts, setAttempts] = useState(1);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">LOG CLIMB</span>
          <button className="close-btn" onClick={onClose}><IClose /></button>
        </div>
        <div className="field">
          <label>Route / Problem</label>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="crimp scrunch..." />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field">
            <label>Gym / Crag</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="The Hangar..." />
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Grade (V-scale)</label>
            <select value={grade} onChange={(e) => setGrade(e.target.value)}>
              {VGRADE_ORDER.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Attempts</label>
            <input type="number" min="1" value={attempts} onChange={(e) => setAttempts(e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
            <input type="checkbox" checked={sent} onChange={(e) => { setSent(e.target.checked); if (!e.target.checked) setFlash(false); }} style={{ accentColor: "var(--accent)" }} />
            Sent
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, opacity: sent ? 1 : 0.4 }}>
            <input type="checkbox" checked={flash} disabled={!sent} onChange={(e) => setFlash(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
            Flash
          </label>
        </div>
        <button
          className="modal-save-btn"
          onClick={() => onSave({ climb_type: "boulder", name, location, my_grade: grade, setter_grade: "", wall_type: "", date, sent: sent ? 1 : 0, flash: flash ? 1 : 0, attempts: parseInt(attempts) || 1, notes: "" })}
        >
          LOG CLIMB
        </button>
      </div>
    </div>
  );
}

export default function ClimbingAnalytics() {
  const { theme, tweaks } = useTheme();
  const { climbs, addClimb } = useClimbing();
  const [showModal, setShowModal] = useState(false);
  const [targetGrade, setTargetGrade] = useState(null);

  useEffect(() => {
    const h = () => setShowModal(true);
    window.addEventListener("shortcut:new", h);
    return () => window.removeEventListener("shortcut:new", h);
  }, []);

  const now = new Date();
  const sent = climbs.filter((c) => c.sent);
  const flashes = climbs.filter((c) => c.flash).length;
  const projects = climbs.filter((c) => !c.sent).length;
  const maxG = maxGrade(sent);
  const autoNext = maxG !== "—" ? `V${Math.min(parseInt(maxG.slice(1)) + 1, 10)}` : "V5";
  const activeTarget = targetGrade ?? autoNext;

  // Grade pyramid — only sent climbs with my_grade, sorted highest→lowest for display
  const gradeMap = {};
  sent.filter((c) => c.my_grade).forEach((c) => {
    const g = c.my_grade.trim().toUpperCase();
    gradeMap[g] = (gradeMap[g] || 0) + 1;
  });
  const usedGrades = VGRADE_ORDER.filter((g) => gradeMap[g]);
  const pyramid = [...usedGrades].reverse();
  const maxCount = Math.max(...usedGrades.map((g) => gradeMap[g] || 0), 1);

  // Recent: all climbs newest-first (climbs from API are newest-first)
  const recentSent = sent.slice(0, 14);
  // Stats for selected target grade
  const targetAttempts = climbs.filter((c) => c.my_grade?.trim().toUpperCase() === activeTarget).reduce((s, c) => s + (c.attempts || 1), 0);
  const targetProjects = climbs.filter((c) => c.my_grade?.trim().toUpperCase() === activeTarget && !c.sent).length;
  const targetSends = climbs.filter((c) => c.my_grade?.trim().toUpperCase() === activeTarget && c.sent).length;

  const monthName = now.toLocaleString("en", { month: "long" }).toUpperCase();
  const year = now.getFullYear();

  return (
    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, fontFamily: "var(--font-mono)" }}>
      {/* Hero */}
      <Box glowing padding="18px 22px">
        <div style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.18em", marginBottom: 8 }}>
          // CLIMBING · {monthName} · {year}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 14, alignItems: "end" }}>
          {[
            ["SENT", String(sent.length)],
            ["MAX", maxG],
            ["FLASHES", String(flashes)],
            ["PROJECTS", String(projects)],
          ].map(([l, v]) => (
            <div key={l}>
              <div style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.14em" }}>{l}</div>
              <div style={{ fontSize: 40, color: theme.accentHot, lineHeight: 0.95, textShadow: glowFn(theme, tweaks.glow * 1.4), marginTop: 4 }}>{v}</div>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              onClick={() => setShowModal(true)}
              style={{ padding: "9px 16px", background: theme.accent, border: "none", borderRadius: 0, color: theme.bg, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", fontFamily: "var(--font-mono)" }}
            >
              [+] LOG SEND
            </button>
          </div>
        </div>
      </Box>

      {/* Two-column: grade pyramid | recent sends */}
      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 14 }}>
        {/* Grade pyramid */}
        <Box title="GRADE.PYRAMID" padding="16px 20px" style={{ display: "flex", flexDirection: "column" }}>
          {usedGrades.length === 0 ? (
            <div style={{ color: theme.muted, fontSize: 12, padding: "12px 0" }}>no sends logged yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
              {pyramid.map((g) => {
                const n = gradeMap[g] || 0;
                const c = gradeColor(g, theme);
                return (
                  <div key={g} style={{ display: "grid", gridTemplateColumns: "34px 1fr 26px", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: theme.cream, fontWeight: 600 }}>{g}</span>
                    <div style={{ position: "relative", height: 16, background: theme.surface2, border: `1px solid ${theme.border}` }}>
                      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${(n / maxCount) * 100}%`, background: c, boxShadow: `0 0 6px ${c}70` }} />
                    </div>
                    <span style={{ fontSize: 11, color: theme.cream, textAlign: "right" }}>{n}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: 14, padding: "10px 12px", background: theme.surface2, borderTop: `1px dashed ${theme.border}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.1em" }}>// TARGET</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {VGRADE_ORDER.map((g) => (
                  <button
                    key={g}
                    onClick={() => setTargetGrade(g === autoNext && targetGrade === g ? null : g)}
                    style={{
                      padding: "2px 6px", fontSize: 9, fontFamily: "var(--font-mono)",
                      background: activeTarget === g ? gradeColor(g, theme) : "transparent",
                      color: activeTarget === g ? theme.bg : theme.muted,
                      border: `1px solid ${activeTarget === g ? gradeColor(g, theme) : theme.border}`,
                      cursor: "pointer", letterSpacing: "0.04em",
                    }}
                  >{g}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, fontSize: 11, color: theme.cream }}>
              <div>
                <div style={{ fontSize: 10, color: theme.muted }}>projects</div>
                <div style={{ fontSize: 22, color: targetProjects > 0 ? STATUS.amber : theme.faint, lineHeight: 1 }}>{targetProjects}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: theme.muted }}>sends</div>
                <div style={{ fontSize: 22, color: targetSends > 0 ? theme.accentHot : theme.faint, lineHeight: 1 }}>{targetSends}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: theme.muted }}>attempts</div>
                <div style={{ fontSize: 22, color: targetAttempts > 0 ? theme.accent : theme.faint, lineHeight: 1 }}>{targetAttempts}</div>
              </div>
              {targetGrade === null && (
                <div style={{ marginLeft: "auto", fontSize: 10, color: theme.faint, alignSelf: "flex-end" }}>
                  auto · {autoNext}
                </div>
              )}
            </div>
          </div>
        </Box>

        {/* Recent sends */}
        <Box title="RECENT.SENDS" padding="14px 18px" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{
            fontSize: 10, color: theme.muted, letterSpacing: "0.08em",
            display: "grid", gridTemplateColumns: "56px 1fr 120px 36px 70px",
            gap: 8, padding: "6px 0", borderBottom: `1px dashed ${theme.border}`, marginBottom: 4
          }}>
            <span>date</span><span>gym/crag</span><span>route</span><span>grd</span><span style={{ textAlign: "right" }}>style</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {recentSent.length === 0 ? (
              <div style={{ color: theme.muted, fontSize: 12, padding: "12px 0" }}>no sends yet · log your first send</div>
            ) : (
              recentSent.map((c) => (
                <div key={c.id} style={{
                  fontSize: 11, color: theme.cream, padding: "7px 0",
                  display: "grid", gridTemplateColumns: "56px 1fr 120px 36px 70px",
                  gap: 8, alignItems: "center", borderBottom: `1px dashed ${theme.border}`
                }}>
                  <span style={{ color: theme.muted }}>{c.date?.slice(5) || "—"}</span>
                  <span style={{ color: theme.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.location || "—"}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name || "(unnamed)"}</span>
                  <span style={{ color: gradeColor(c.my_grade, theme), fontWeight: 600, fontSize: 11 }}>{c.my_grade || "?"}</span>
                  <span style={{
                    color: c.flash ? theme.accentHot : theme.accentDim,
                    textAlign: "right", fontSize: 10
                  }}>{c.flash ? "flash" : "redpoint"}</span>
                </div>
              ))
            )}
          </div>
          {sent.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 10, color: theme.muted, borderTop: `1px dashed ${theme.border}`, paddingTop: 8 }}>
              {sent.length} sends · {flashes} flashes · {projects} projects
            </div>
          )}
        </Box>
      </div>

      {showModal && (
        <QuickLogModal
          onSave={async (data) => { await addClimb(data, null); setShowModal(false); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
