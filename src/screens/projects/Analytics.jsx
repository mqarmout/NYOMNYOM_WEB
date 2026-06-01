import { useEffect, useMemo } from "react";
import { useTheme, STATUS, glow as glowFn } from "../../context/ThemeContext";
import Box from "../../components/crt/Box";
import { useDevProjects } from "../../context/ProjectsContext";

const PRIORITY_COLOR = (theme) => ({
  critical: STATUS.red,
  high: STATUS.amber,
  medium: theme.muted,
  low: theme.faint,
});

const STATUS_ORDER = ["active", "paused", "idea", "completed"];
const STATUS_LABELS = { active: "ACTIVE", paused: "PAUSED", idea: "IDEA", completed: "DONE" };
const STATUS_COLOR = (theme) => ({
  active: theme.accentHot,
  paused: STATUS.amber,
  idea: theme.accentDim,
  completed: theme.muted,
});

function taskCountsFor(projectId, kanbanTasks) {
  const linked = (kanbanTasks || []).filter((t) => {
    try {
      const ids =
        typeof t.project_ids === "string" ? JSON.parse(t.project_ids || "[]") : t.project_ids || [];
      return ids.includes(String(projectId)) || ids.includes(projectId);
    } catch {
      return false;
    }
  });
  return {
    backlog: linked.filter((t) => t.status === "backlog").length,
    in_progress: linked.filter((t) => t.status === "in_progress").length,
    done: linked.filter((t) => t.status === "done").length,
    total: linked.length,
  };
}

export default function ProjectsAnalytics() {
  const { theme, tweaks } = useTheme();
  const { projects, kanbanTasks, commits, fetchCommit } = useDevProjects();

  const now = new Date();
  const monthName = now.toLocaleString("en", { month: "long" }).toUpperCase();
  const year = now.getFullYear();

  const activeProjects = (projects || []).filter((p) => p.status === "active");
  const totalActive = activeProjects.length;
  const totalInProgress = (kanbanTasks || []).filter((t) => t.status === "in_progress").length;
  const totalBacklog = (kanbanTasks || []).filter((t) => t.status === "backlog").length;
  const totalDone = (kanbanTasks || []).filter((t) => t.status === "done").length;

  useEffect(() => {
    activeProjects.forEach((p) => {
      if (p.github_url && !commits[p.id]) fetchCommit(p.id);
    });
  }, [projects]);

  const statusBars = useMemo(() => {
    const colors = STATUS_COLOR(theme);
    return STATUS_ORDER.map((s) => ({
      status: s,
      count: (projects || []).filter((p) => p.status === s).length,
      color: colors[s],
    })).filter((d) => d.count > 0);
  }, [projects, theme]);
  const maxStatus = Math.max(...statusBars.map((d) => d.count), 1);

  const openTasks = useMemo(() => {
    const PRIO = { critical: 0, high: 1, medium: 2, low: 3 };
    return (kanbanTasks || [])
      .filter((t) => t.status !== "done")
      .sort((a, b) => {
        const pd = (PRIO[a.priority] ?? 4) - (PRIO[b.priority] ?? 4);
        if (pd !== 0) return pd;
        return (a.status === "in_progress" ? 0 : 1) - (b.status === "in_progress" ? 0 : 1);
      })
      .slice(0, 14);
  }, [kanbanTasks]);

  const priorityColors = PRIORITY_COLOR(theme);

  function linkedProjectNames(task) {
    try {
      const ids =
        typeof task.project_ids === "string"
          ? JSON.parse(task.project_ids || "[]")
          : task.project_ids || [];
      return ids
        .map((id) => (projects || []).find((p) => String(p.id) === String(id))?.name)
        .filter(Boolean);
    } catch {
      return [];
    }
  }

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
      <Box glowing padding="16px 20px">
        <div style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.18em", marginBottom: 8 }}>
          {`// PROJECTS · ${monthName} · ${year}`}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 14,
          }}
        >
          {[
            ["ACTIVE", String(totalActive), "projects"],
            ["IN PROGRESS", String(totalInProgress), "tasks"],
            ["BACKLOG", String(totalBacklog), "queued"],
            ["DONE", String(totalDone), "completed"],
          ].map(([l, v, s]) => (
            <div key={l}>
              <div style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.14em" }}>{l}</div>
              <div
                style={{
                  fontSize: 34,
                  color: theme.accentHot,
                  lineHeight: 1,
                  textShadow: glowFn(theme, tweaks.glow * 1.2),
                  marginTop: 2,
                }}
              >
                {v}
              </div>
              <div style={{ fontSize: 10, color: theme.accentDim, marginTop: 3 }}>{s}</div>
            </div>
          ))}
        </div>
      </Box>

      {/* Two-column */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Left: active project cards + status breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Box title="ACTIVE.PROJECTS" padding="14px 18px">
            {activeProjects.length === 0 ? (
              <div style={{ color: theme.muted, fontSize: 11, padding: "8px 0" }}>
                no active projects
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activeProjects.map((p) => {
                  const counts = taskCountsFor(p.id, kanbanTasks);
                  const commit = commits[p.id];
                  return (
                    <div
                      key={p.id}
                      style={{
                        padding: "10px 12px",
                        background: theme.surface2,
                        border: `1px solid ${theme.border}`,
                        borderLeft: `3px solid ${theme.accentHot}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: theme.accentHot,
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                          }}
                        >
                          {p.name}
                        </span>
                        <span style={{ fontSize: 9, color: theme.muted, letterSpacing: "0.04em" }}>
                          {p.tech_stack?.split(",")[0]?.trim() || ""}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 12, fontSize: 10 }}>
                        <span style={{ color: theme.muted }}>
                          backlog <span style={{ color: theme.cream }}>{counts.backlog}</span>
                        </span>
                        <span style={{ color: theme.accent }}>
                          doing <span style={{ color: theme.cream }}>{counts.in_progress}</span>
                        </span>
                        <span style={{ color: theme.accentDim }}>
                          done <span style={{ color: theme.cream }}>{counts.done}</span>
                        </span>
                        {commit?.date && (
                          <span style={{ color: theme.faint, marginLeft: "auto" }}>
                            ↑{" "}
                            {new Date(commit.date).toLocaleDateString("en", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Box>

          <Box title="STATUS.BREAKDOWN" padding="14px 18px">
            {statusBars.length === 0 ? (
              <div style={{ color: theme.muted, fontSize: 11 }}>no projects yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {statusBars.map(({ status, count, color }) => (
                  <div
                    key={status}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "70px 1fr 26px",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 10, color, letterSpacing: "0.06em" }}>
                      <span style={{ marginRight: 5 }}>●</span>
                      {STATUS_LABELS[status]}
                    </span>
                    <div
                      style={{
                        position: "relative",
                        height: 14,
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
                          width: `${(count / maxStatus) * 100}%`,
                          background: color,
                          boxShadow: `0 0 6px ${color}60`,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 11, color: theme.cream, textAlign: "right" }}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {(projects || []).length > 0 && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 10,
                  color: theme.muted,
                  borderTop: `1px dashed ${theme.border}`,
                  paddingTop: 8,
                }}
              >
                {(projects || []).length} total · {totalActive} active
              </div>
            )}
          </Box>
        </div>

        {/* Right: open tasks */}
        <Box
          title="OPEN.TASKS"
          padding="14px 18px"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <div
            style={{
              fontSize: 10,
              color: theme.muted,
              letterSpacing: "0.08em",
              display: "grid",
              gridTemplateColumns: "60px 1fr 60px",
              gap: 8,
              padding: "4px 0",
              borderBottom: `1px dashed ${theme.border}`,
              marginBottom: 4,
            }}
          >
            <span>priority</span>
            <span>task</span>
            <span style={{ textAlign: "right" }}>status</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {openTasks.length === 0 ? (
              <div style={{ color: theme.muted, fontSize: 11, padding: "12px 0" }}>
                no open tasks · use the Kanban tab to add
              </div>
            ) : (
              openTasks.map((t) => {
                const pColor = priorityColors[t.priority] || theme.muted;
                const names = linkedProjectNames(t);
                return (
                  <div
                    key={t.id}
                    style={{
                      fontSize: 11,
                      color: theme.cream,
                      padding: "7px 0",
                      display: "grid",
                      gridTemplateColumns: "60px 1fr 60px",
                      gap: 8,
                      alignItems: "start",
                      borderBottom: `1px dashed ${theme.border}`,
                    }}
                  >
                    <span
                      style={{
                        color: pColor,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        paddingTop: 1,
                      }}
                    >
                      {(t.priority || "medium").toUpperCase()}
                    </span>
                    <div>
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.title}
                      </div>
                      {names.length > 0 && (
                        <div style={{ fontSize: 9, color: theme.accentDim, marginTop: 2 }}>
                          {names.join(", ")}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        textAlign: "right",
                        fontSize: 9,
                        fontWeight: 600,
                        color: t.status === "in_progress" ? theme.accent : theme.muted,
                      }}
                    >
                      {t.status === "in_progress" ? "DOING" : "BACKLOG"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          {(kanbanTasks || []).length > 0 && (
            <div
              style={{
                marginTop: 10,
                fontSize: 10,
                color: theme.muted,
                borderTop: `1px dashed ${theme.border}`,
                paddingTop: 8,
              }}
            >
              {openTasks.length} open · {totalDone} done · {(kanbanTasks || []).length} total
            </div>
          )}
        </Box>
      </div>
    </div>
  );
}
