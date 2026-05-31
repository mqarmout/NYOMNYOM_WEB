import { useTheme, glow as glowFn } from "../../context/ThemeContext";
import Box from "../../components/crt/Box";
import { useClimbing } from "../../context/ClimbingContext";

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

function gradeSort(a, b) {
  const vA = a.match(/^V(\d+)/i), vB = b.match(/^V(\d+)/i);
  if (vA && vB) return parseInt(vA[1]) - parseInt(vB[1]);
  return a.localeCompare(b);
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ClimbingAnalytics() {
  const { theme, tweaks } = useTheme();
  const { climbs } = useClimbing();

  const total = climbs.length;
  const sent = climbs.filter(c => c.sent).length;
  const flash = climbs.filter(c => c.flash).length;
  const sendRate = total > 0 ? Math.round((sent / total) * 100) + "%" : "—";

  const gradeMap = {};
  climbs.filter(c => c.sent && c.my_grade).forEach(c => {
    gradeMap[c.my_grade] = (gradeMap[c.my_grade] || 0) + 1;
  });
  const gradeData = Object.entries(gradeMap)
    .sort((a, b) => gradeSort(a[0], b[0]))
    .slice(-10)
    .map(([lbl, v]) => ({ lbl, v }));

  const now = new Date();
  const monthData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = climbs.filter(c => c.date && c.date.startsWith(key)).length;
    monthData.push({ lbl: MONTH_NAMES[d.getMonth()], v: count, hot: i === 0 });
  }

  const typeData = [
    { lbl: "boulder", v: climbs.filter(c => c.climb_type === "boulder").length },
    { lbl: "sport", v: climbs.filter(c => c.climb_type === "sport").length },
    { lbl: "toprope", v: climbs.filter(c => c.climb_type === "toprope").length },
  ];

  return (
    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, height: "100%", overflow: "auto", fontFamily: "var(--font-mono)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <Stat label="TOTAL LOGGED" value={total} theme={theme} tweaks={tweaks} />
        <Stat label="SENT" value={sent} theme={theme} tweaks={tweaks} />
        <Stat label="FLASH" value={flash} hot={flash > 0} theme={theme} tweaks={tweaks} />
        <Stat label="SEND RATE" value={sendRate} hot={sent > 0} theme={theme} tweaks={tweaks} />
      </div>

      <Box title="SENDS BY GRADE">
        {gradeData.length === 0
          ? <div style={{ color: theme.muted, fontSize: 12 }}>no sends yet</div>
          : <HBar data={gradeData} theme={theme} />}
      </Box>

      <Box title="CLIMBS BY MONTH">
        <VBar data={monthData} theme={theme} h={110} />
      </Box>

      <Box title="TYPE BREAKDOWN">
        <HBar data={typeData} theme={theme} />
      </Box>
    </div>
  );
}
