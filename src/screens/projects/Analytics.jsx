import { useTheme, glow as glowFn } from "../../context/ThemeContext";
import Box from "../../components/crt/Box";
import { useDevProjects } from "../../context/ProjectsContext";

function VBar({ data, theme, h = 100 }) {
  const W = 320, H = h, pL = 6, pR = 6, pT = 8, pB = 20;
  const iW = W - pL - pR, iH = H - pT - pB;
  if (!data.length) return <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }}><text x={W / 2} y={H / 2} textAnchor="middle" fill={theme.muted} fontSize="11">no data</text></svg>;
  const max = Math.max(...data.map(d => d.v), 1);
  const slot = iW / data.length;
  const bW = Math.min(slot * 0.6, 28);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }}>
      {data.map((d, i) => {
        const bH = Math.max((d.v / max) * iH, d.v > 0 ? 2 : 0);
        const x = pL + i * slot + (slot - bW) / 2;
        return (
          <g key={i}>
            <rect x={x} y={pT + iH - bH} width={bW} height={bH} fill={d.hot ? theme.accentHot : theme.accent} opacity={d.hot ? 1 : 0.65} />
            <text x={x + bW / 2} y={H - 4} textAnchor="middle" fill={theme.muted} fontSize="8" fontFamily="monospace">{d.lbl}</text>
          </g>
        );
      })}
    </svg>
  );
}

function HBar({ data, theme, h = 20 }) {
  const W = 300, rowH = h + 10;
  const max = Math.max(...data.map(d => d.v), 1);
  return (
    <svg viewBox={`0 0 ${W} ${data.length * rowH}`} style={{ width: "100%", height: data.length * rowH }}>
      {data.map((d, i) => {
        const bW = (d.v / max) * 200;
        const y = i * rowH;
        return (
          <g key={i}>
            <text x={0} y={y + rowH * 0.65} fill={theme.cream} fontSize="10" fontFamily="monospace">{d.lbl}</text>
            <rect x={90} y={y + 3} width={bW} height={h - 2} fill={theme.accent} opacity={0.7} />
            {bW > 0 && <rect x={90} y={y + 3} width={2} height={h - 2} fill={theme.accentHot} />}
            <text x={296} y={y + rowH * 0.65} textAnchor="end" fill={theme.accentDim} fontSize="10" fontFamily="monospace">{d.v}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Stat({ label, value, sub, hot, theme, tweaks }) {
  return (
    <div style={{ padding: "12px 16px", background: theme.surface, border: `1px solid ${theme.borderHi}`, display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: theme.muted, letterSpacing: "0.14em" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 26, color: hot ? theme.accentHot : theme.cream, lineHeight: 1, textShadow: hot ? glowFn(theme, tweaks.glow * 0.7) : "none" }}>{value}</div>
      {sub && <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: theme.accentDim }}>{sub}</div>}
    </div>
  );
}

export default function ProjectsAnalytics() {
  const { theme, tweaks } = useTheme();
  const { projects, kanbanTasks } = useDevProjects();

  const activeProjects = (projects || []).filter(p => p.status === "active").length;
  const inProgress = (kanbanTasks || []).filter(t => t.status === "in_progress").length;
  const done = (kanbanTasks || []).filter(t => t.status === "done").length;
  const backlog = (kanbanTasks || []).filter(t => t.status === "backlog").length;

  const kanbanData = [
    { lbl: "backlog", v: backlog },
    { lbl: "in_progress", v: inProgress },
    { lbl: "done", v: done },
  ];

  const statusData = [
    { lbl: "active", v: (projects || []).filter(p => p.status === "active").length },
    { lbl: "paused", v: (projects || []).filter(p => p.status === "paused").length },
    { lbl: "completed", v: (projects || []).filter(p => p.status === "completed").length },
  ];

  const nonDone = (kanbanTasks || []).filter(t => t.status !== "done");
  const priorityData = [
    { lbl: "critical", v: nonDone.filter(t => t.priority === "critical").length },
    { lbl: "high", v: nonDone.filter(t => t.priority === "high").length },
    { lbl: "medium", v: nonDone.filter(t => t.priority === "medium").length },
    { lbl: "low", v: nonDone.filter(t => t.priority === "low").length },
  ];

  return (
    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, height: "100%", overflow: "auto", fontFamily: "var(--font-mono)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <Stat label="ACTIVE PROJECTS" value={activeProjects} hot={activeProjects > 0} theme={theme} tweaks={tweaks} />
        <Stat label="IN PROGRESS TASKS" value={inProgress} theme={theme} tweaks={tweaks} />
        <Stat label="DONE TASKS" value={done} theme={theme} tweaks={tweaks} />
        <Stat label="BACKLOG TASKS" value={backlog} theme={theme} tweaks={tweaks} />
      </div>

      <Box title="KANBAN BREAKDOWN">
        <HBar data={kanbanData} theme={theme} />
      </Box>

      <Box title="PROJECTS BY STATUS">
        <HBar data={statusData} theme={theme} />
      </Box>

      <Box title="TASKS BY PRIORITY">
        <HBar data={priorityData} theme={theme} />
      </Box>
    </div>
  );
}
