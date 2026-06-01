import { useState, useEffect } from "react";
import { useClimbing } from "../../context/ClimbingContext";
import { useTheme, STATUS, glow as glowFn } from "../../context/ThemeContext";
import Box from "../../components/crt/Box";
import { ClimbModal } from "./Climbs";

const VGRADE_ORDER = ["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10"];

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
    .filter((c) => c.my_grade)
    .map((c) => parseInt(c.my_grade.match(/V(\d+)/i)?.[1] ?? "-1"))
    .filter((n) => n >= 0);
  if (!nums.length) return "—";
  return `V${Math.max(...nums)}`;
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
  sent
    .filter((c) => c.my_grade)
    .forEach((c) => {
      const g = c.my_grade.trim().toUpperCase();
      gradeMap[g] = (gradeMap[g] || 0) + 1;
    });
  const usedGrades = VGRADE_ORDER.filter((g) => gradeMap[g]);
  const pyramid = [...usedGrades].reverse();
  const maxCount = Math.max(...usedGrades.map((g) => gradeMap[g] || 0), 1);

  // Recent: all climbs newest-first (climbs from API are newest-first)
  const recentSent = sent.slice(0, 14);
  // Stats for selected target grade
  const targetAttempts = climbs
    .filter((c) => c.my_grade?.trim().toUpperCase() === activeTarget)
    .reduce((s, c) => s + (c.attempts || 1), 0);
  const targetProjects = climbs.filter(
    (c) => c.my_grade?.trim().toUpperCase() === activeTarget && !c.sent
  ).length;
  const targetSends = climbs.filter(
    (c) => c.my_grade?.trim().toUpperCase() === activeTarget && c.sent
  ).length;

  const monthName = now.toLocaleString("en", { month: "long" }).toUpperCase();
  const year = now.getFullYear();

  return (
    <div
      style={{
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        fontFamily: "var(--font-mono)",
      }}
    >
      {/* Hero */}
      <Box glowing padding="18px 22px">
        <div style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.18em", marginBottom: 8 }}>
          {`// CLIMBING · ${monthName} · ${year}`}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
            gap: 14,
            alignItems: "end",
          }}
        >
          {[
            ["SENT", String(sent.length)],
            ["MAX", maxG],
            ["FLASHES", String(flashes)],
            ["PROJECTS", String(projects)],
          ].map(([l, v]) => (
            <div key={l}>
              <div style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.14em" }}>{l}</div>
              <div
                style={{
                  fontSize: 40,
                  color: theme.accentHot,
                  lineHeight: 0.95,
                  textShadow: glowFn(theme, tweaks.glow * 1.4),
                  marginTop: 4,
                }}
              >
                {v}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: "9px 16px",
                background: theme.accent,
                border: "none",
                borderRadius: 0,
                color: theme.bg,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
              }}
            >
              [+] LOG CLIMB
            </button>
          </div>
        </div>
      </Box>

      {/* Two-column: grade pyramid | recent sends */}
      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 14 }}>
        {/* Grade pyramid */}
        <Box
          title="GRADE.PYRAMID"
          padding="16px 20px"
          style={{ display: "flex", flexDirection: "column" }}
        >
          {usedGrades.length === 0 ? (
            <div style={{ color: theme.muted, fontSize: 12, padding: "12px 0" }}>
              no sends logged yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
              {pyramid.map((g) => {
                const n = gradeMap[g] || 0;
                const c = gradeColor(g, theme);
                return (
                  <div
                    key={g}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "34px 1fr 26px",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 12, color: theme.cream, fontWeight: 600 }}>{g}</span>
                    <div
                      style={{
                        position: "relative",
                        height: 16,
                        background: theme.surface2,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          bottom: 0,
                          width: `${(n / maxCount) * 100}%`,
                          background: c,
                          boxShadow: `0 0 6px ${c}70`,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 11, color: theme.cream, textAlign: "right" }}>
                      {n}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              background: theme.surface2,
              borderTop: `1px dashed ${theme.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div
                style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.1em" }}
              >{`// TARGET`}</div>
              <div
                style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}
              >
                {VGRADE_ORDER.map((g) => (
                  <button
                    key={g}
                    onClick={() => setTargetGrade(g === autoNext && targetGrade === g ? null : g)}
                    style={{
                      padding: "2px 6px",
                      fontSize: 9,
                      fontFamily: "var(--font-mono)",
                      background: activeTarget === g ? gradeColor(g, theme) : "transparent",
                      color: activeTarget === g ? theme.bg : theme.muted,
                      border: `1px solid ${activeTarget === g ? gradeColor(g, theme) : theme.border}`,
                      cursor: "pointer",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, fontSize: 11, color: theme.cream }}>
              <div>
                <div style={{ fontSize: 10, color: theme.muted }}>projects</div>
                <div
                  style={{
                    fontSize: 22,
                    color: targetProjects > 0 ? STATUS.amber : theme.faint,
                    lineHeight: 1,
                  }}
                >
                  {targetProjects}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: theme.muted }}>sends</div>
                <div
                  style={{
                    fontSize: 22,
                    color: targetSends > 0 ? theme.accentHot : theme.faint,
                    lineHeight: 1,
                  }}
                >
                  {targetSends}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: theme.muted }}>attempts</div>
                <div
                  style={{
                    fontSize: 22,
                    color: targetAttempts > 0 ? theme.accent : theme.faint,
                    lineHeight: 1,
                  }}
                >
                  {targetAttempts}
                </div>
              </div>
              {targetGrade === null && (
                <div
                  style={{
                    marginLeft: "auto",
                    fontSize: 10,
                    color: theme.faint,
                    alignSelf: "flex-end",
                  }}
                >
                  auto · {autoNext}
                </div>
              )}
            </div>
          </div>
        </Box>

        {/* Recent sends */}
        <Box
          title="RECENT.SENDS"
          padding="14px 18px"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <div
            style={{
              fontSize: 10,
              color: theme.muted,
              letterSpacing: "0.08em",
              display: "grid",
              gridTemplateColumns: "56px 1fr 120px 36px 70px",
              gap: 8,
              padding: "6px 0",
              borderBottom: `1px dashed ${theme.border}`,
              marginBottom: 4,
            }}
          >
            <span>date</span>
            <span>gym/crag</span>
            <span>route</span>
            <span>grd</span>
            <span style={{ textAlign: "right" }}>style</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {recentSent.length === 0 ? (
              <div style={{ color: theme.muted, fontSize: 12, padding: "12px 0" }}>
                no sends yet · log your first send
              </div>
            ) : (
              recentSent.map((c) => (
                <div
                  key={c.id}
                  style={{
                    fontSize: 11,
                    color: theme.cream,
                    padding: "7px 0",
                    display: "grid",
                    gridTemplateColumns: "56px 1fr 120px 36px 70px",
                    gap: 8,
                    alignItems: "center",
                    borderBottom: `1px dashed ${theme.border}`,
                  }}
                >
                  <span style={{ color: theme.muted }}>{c.date?.slice(5) || "—"}</span>
                  <span
                    style={{
                      color: theme.accent,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.location || "—"}
                  </span>
                  <span
                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {c.name || "(unnamed)"}
                  </span>
                  <span
                    style={{ color: gradeColor(c.my_grade, theme), fontWeight: 600, fontSize: 11 }}
                  >
                    {c.my_grade || "?"}
                  </span>
                  <span
                    style={{
                      color: c.flash ? theme.accentHot : theme.accentDim,
                      textAlign: "right",
                      fontSize: 10,
                    }}
                  >
                    {c.flash ? "flash" : "redpoint"}
                  </span>
                </div>
              ))
            )}
          </div>
          {sent.length > 0 && (
            <div
              style={{
                marginTop: 10,
                fontSize: 10,
                color: theme.muted,
                borderTop: `1px dashed ${theme.border}`,
                paddingTop: 8,
              }}
            >
              {sent.length} sends · {flashes} flashes · {projects} projects
            </div>
          )}
        </Box>
      </div>

      {showModal && (
        <ClimbModal
          onSave={async (data, photo) => {
            await addClimb(data, photo);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
