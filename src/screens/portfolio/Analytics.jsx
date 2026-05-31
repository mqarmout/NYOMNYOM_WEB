import { useTheme, glow as glowFn } from "../../context/ThemeContext";
import Box from "../../components/crt/Box";
import { usePortfolio } from "../../context/PortfolioContext";

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

function monthsBetween(startStr, endStr) {
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : new Date();
  return Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
}

export default function PortfolioAnalytics() {
  const { theme, tweaks } = useTheme();
  const { projects, skills, experience } = usePortfolio();

  const totalYears = experience.reduce((sum, e) => {
    const months = monthsBetween(e.start_date, e.end_date);
    return sum + months / 12;
  }, 0);

  const categoryMap = {};
  (skills || []).forEach(s => {
    const cat = s.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const skillCatData = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([lbl, v]) => ({ lbl, v }));

  const techMap = {};
  (projects || []).forEach(p => {
    if (!p.tech_stack) return;
    p.tech_stack.split(",").forEach(t => {
      const tech = t.trim();
      if (tech) techMap[tech] = (techMap[tech] || 0) + 1;
    });
  });
  const techData = Object.entries(techMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lbl, v]) => ({ lbl, v }));

  const expData = [...(experience || [])]
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 10)
    .map(e => ({
      lbl: e.company.length > 12 ? e.company.slice(0, 11) + "…" : e.company,
      v: monthsBetween(e.start_date, e.end_date),
    }));

  return (
    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, height: "100%", overflow: "auto", fontFamily: "var(--font-mono)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <Stat label="PROJECTS" value={(projects || []).length} theme={theme} tweaks={tweaks} />
        <Stat label="SKILLS" value={(skills || []).length} theme={theme} tweaks={tweaks} />
        <Stat label="EXPERIENCE" value={(experience || []).length} sub="jobs" theme={theme} tweaks={tweaks} />
        <Stat label="YEARS" value={totalYears.toFixed(1)} sub="experience" hot theme={theme} tweaks={tweaks} />
      </div>

      <Box title="SKILLS BY CATEGORY">
        {skillCatData.length === 0
          ? <div style={{ color: theme.muted, fontSize: 12 }}>no skills yet</div>
          : <HBar data={skillCatData} theme={theme} />}
      </Box>

      <Box title="TOP TECHNOLOGIES">
        {techData.length === 0
          ? <div style={{ color: theme.muted, fontSize: 12 }}>no projects with tech stack yet</div>
          : <HBar data={techData} theme={theme} />}
      </Box>

      <Box title="EXPERIENCE TIMELINE">
        {expData.length === 0
          ? <div style={{ color: theme.muted, fontSize: 12 }}>no experience yet</div>
          : <HBar data={expData} theme={theme} />}
      </Box>
    </div>
  );
}
