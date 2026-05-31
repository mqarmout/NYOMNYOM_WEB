import { useTheme, glow as glowFn } from "../../context/ThemeContext";
import Box from "../../components/crt/Box";
import { useJob } from "../../context/JobContext";

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

const STATUS_ORDER = ["applied", "screening", "interviewing", "offer", "rejected", "withdrawn"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function JobsAnalytics() {
  const { theme, tweaks } = useTheme();
  const { jobs } = useJob();

  const total = jobs.length;
  const active = jobs.filter(j => j.status !== "rejected" && j.status !== "withdrawn").length;
  const interviewing = jobs.filter(j => j.status === "interviewing").length;
  const offers = jobs.filter(j => j.status === "offer").length;

  const pipelineData = STATUS_ORDER
    .map(s => ({ lbl: s.slice(0, 5), v: jobs.filter(j => j.status === s).length }))
    .filter(d => d.v > 0);

  const now = new Date();
  const monthData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = jobs.filter(j => j.date_applied && j.date_applied.startsWith(key)).length;
    monthData.push({ lbl: MONTH_NAMES[d.getMonth()], v: count, hot: i === 0 });
  }

  const sourceCounts = {};
  jobs.forEach(j => {
    if (j.site_used) sourceCounts[j.site_used] = (sourceCounts[j.site_used] || 0) + 1;
  });
  const sourceData = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([lbl, v]) => ({ lbl, v }));

  return (
    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, height: "100%", overflow: "auto", fontFamily: "var(--font-mono)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <Stat label="TOTAL APPLICATIONS" value={total} theme={theme} tweaks={tweaks} />
        <Stat label="ACTIVE" value={active} theme={theme} tweaks={tweaks} />
        <Stat label="INTERVIEWING" value={interviewing} hot={interviewing > 0} theme={theme} tweaks={tweaks} />
        <Stat label="OFFERS" value={offers} hot={offers > 0} theme={theme} tweaks={tweaks} />
      </div>

      <Box title="PIPELINE">
        {pipelineData.length === 0
          ? <div style={{ color: theme.muted, fontSize: 12 }}>no applications yet</div>
          : <HBar data={pipelineData} theme={theme} />}
      </Box>

      <Box title="APPLICATIONS BY MONTH">
        <VBar data={monthData} theme={theme} h={110} />
      </Box>

      {sourceData.length > 0 && (
        <Box title="SOURCES">
          <HBar data={sourceData} theme={theme} />
        </Box>
      )}
    </div>
  );
}
