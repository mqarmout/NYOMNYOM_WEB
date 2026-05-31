import { useTheme, glow as glowFn } from "../../context/ThemeContext";
import Box from "../../components/crt/Box";
import { useFitness } from "../../context/FitnessContext";

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

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function FitnessAnalytics() {
  const { theme, tweaks } = useTheme();
  const { workouts, metrics, runs } = useFitness();

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const workoutsThisMonth = workouts.filter(w => w.date && w.date.startsWith(thisMonthKey)).length;
  const runsThisMonth = (runs || []).filter(r => r.date && r.date.startsWith(thisMonthKey)).length;
  const kmThisMonth = (runs || [])
    .filter(r => r.date && r.date.startsWith(thisMonthKey))
    .reduce((s, r) => s + (r.distance_m || 0), 0) / 1000;
  const latestWeight = metrics && metrics.length > 0 ? metrics[0].weight : null;

  const monthBars = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = workouts.filter(w => w.date && w.date.startsWith(key)).length;
    monthBars.push({ lbl: MONTH_NAMES[d.getMonth()], v: count, hot: i === 0 });
  }

  const runBars = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const km = (runs || [])
      .filter(r => r.date && r.date.startsWith(key))
      .reduce((s, r) => s + (r.distance_m || 0), 0) / 1000;
    runBars.push({ lbl: MONTH_NAMES[d.getMonth()], v: parseFloat(km.toFixed(1)), hot: i === 0 });
  }

  const weightPts = metrics ? metrics.slice(0, 12).reverse() : [];
  const showWeight = weightPts.length >= 2;
  const W = 320, H = 80, pL = 6, pR = 6, pT = 8, pB = 8;
  const iW = W - pL - pR, iH = H - pT - pB;
  let polyline = null;
  let areaPoly = null;
  if (showWeight) {
    const wMin = Math.min(...weightPts.map(p => p.weight));
    const wMax = Math.max(...weightPts.map(p => p.weight));
    const wRange = wMax - wMin || 1;
    const pts = weightPts.map((p, i) => {
      const x = pL + (i / (weightPts.length - 1)) * iW;
      const y = pT + iH - ((p.weight - wMin) / wRange) * iH;
      return [x, y];
    });
    polyline = pts.map(p => p.join(",")).join(" ");
    areaPoly = [
      `${pts[0][0]},${pT + iH}`,
      ...pts.map(p => p.join(",")),
      `${pts[pts.length - 1][0]},${pT + iH}`,
    ].join(" ");
  }

  return (
    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, height: "100%", overflow: "auto", fontFamily: "var(--font-mono)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <Stat label="WORKOUTS THIS MONTH" value={workoutsThisMonth} theme={theme} tweaks={tweaks} />
        <Stat label="RUNS THIS MONTH" value={runsThisMonth} theme={theme} tweaks={tweaks} />
        <Stat label="THIS MONTH KM" value={kmThisMonth.toFixed(1)} sub="km" theme={theme} tweaks={tweaks} />
        <Stat label="LATEST WEIGHT" value={latestWeight !== null ? latestWeight : "—"} sub={latestWeight !== null ? "lbs" : undefined} theme={theme} tweaks={tweaks} />
      </div>

      <Box title="WORKOUTS / MONTH">
        <VBar data={monthBars} theme={theme} h={110} />
      </Box>

      <Box title="RUNNING KM / MONTH">
        <VBar data={runBars} theme={theme} h={110} />
      </Box>

      {showWeight && (
        <Box title="BODY WEIGHT TREND">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, color: theme.accentHot, textShadow: glowFn(theme, tweaks.glow * 0.6) }}>
              {weightPts[weightPts.length - 1].weight}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: theme.accentDim }}>lbs latest</span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }}>
            <defs>
              <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.accent} stopOpacity="0.3" />
                <stop offset="100%" stopColor={theme.accent} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <polygon points={areaPoly} fill="url(#wgrad)" />
            <polyline points={polyline} fill="none" stroke={theme.accent} strokeWidth="1.5" />
            {weightPts.map((p, i) => {
              const x = pL + (i / (weightPts.length - 1)) * iW;
              const wMin = Math.min(...weightPts.map(q => q.weight));
              const wMax = Math.max(...weightPts.map(q => q.weight));
              const wRange = wMax - wMin || 1;
              const y = pT + iH - ((p.weight - wMin) / wRange) * iH;
              return <circle key={i} cx={x} cy={y} r="2" fill={theme.accentHot} />;
            })}
          </svg>
        </Box>
      )}
    </div>
  );
}
