import { useMemo } from "react";
import { useFitness } from "../../context/FitnessContext";
import { useTheme, glow as glowFn } from "../../context/ThemeContext";
import Box from "../../components/crt/Box";

function weekStart(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
}

function BarChart({ data, h = 110, theme }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.v), 1);
  const W = 760,
    H = h;
  const slot = W / data.length;
  const bW = Math.min(slot * 0.55, 32);
  const pB = 16;
  const iH = H - pB;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={h} preserveAspectRatio="none">
      <line x1="0" y1={iH} x2={W} y2={iH} stroke={theme.borderHi} strokeWidth="0.5" />
      {data.map((d, i) => {
        const bH = Math.max((d.v / max) * iH, d.v > 0 ? 2 : 0);
        const x = i * slot + (slot - bW) / 2;
        const isHot = d.hot || i === data.length - 1;
        return (
          <g key={i}>
            <rect
              x={x}
              y={iH - bH}
              width={bW}
              height={bH}
              fill={isHot ? theme.accentHot : theme.accent}
              opacity={isHot ? 1 : 0.55}
            />
            {d.lbl && (
              <text
                x={x + bW / 2}
                y={H - 2}
                textAnchor="middle"
                fill={theme.muted}
                fontSize="8"
                fontFamily="monospace"
              >
                {d.lbl}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function WeightLine({ data, h = 110, theme }) {
  if (data.length < 2)
    return (
      <div
        style={{
          height: h,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.muted,
          fontSize: 11,
        }}
      >
        need 2+ entries
      </div>
    );
  const W = 760,
    H = h;
  const pT = 10,
    pB = 10,
    pL = 4,
    pR = 4;
  const iW = W - pL - pR,
    iH = H - pT - pB;
  const vals = data.map((d) => d.weight);
  const minV = Math.min(...vals) - 0.5;
  const maxV = Math.max(...vals) + 0.5;
  const range = maxV - minV || 1;
  const pts = data.map((d, i) => [
    pL + (i / (data.length - 1)) * iW,
    pT + iH - ((d.weight - minV) / range) * iH,
  ]);
  const line = pts.map((p) => p.join(",")).join(" ");
  const area = [
    `${pts[0][0]},${pT + iH}`,
    ...pts.map((p) => p.join(",")),
    `${pts[pts.length - 1][0]},${pT + iH}`,
  ].join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={h} preserveAspectRatio="none">
      <defs>
        <linearGradient id="wt-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#wt-grad)" />
      <polyline points={line} fill="none" stroke={theme.accent} strokeWidth="1.6" />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p[0]}
          cy={p[1]}
          r={i === pts.length - 1 ? 4 : 2}
          fill={i === pts.length - 1 ? theme.accentHot : theme.accent}
        />
      ))}
      <text
        x={last[0] - 6}
        y={last[1] - 8}
        textAnchor="end"
        fontSize="10"
        fontFamily="monospace"
        fill={theme.accentHot}
      >
        {data[data.length - 1].weight} lbs
      </text>
    </svg>
  );
}

export default function FitnessAnalytics() {
  const { theme, tweaks } = useTheme();
  const { workouts, history, runs, runHistory } = useFitness();

  const now = new Date();
  const mo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthName = now.toLocaleString("en", { month: "long" }).toUpperCase();
  const year = now.getFullYear();

  // Hero stats
  const workoutsThisMo = workouts.filter((w) => w.date?.startsWith(mo)).length;
  const runsThisMo = (runs || []).filter((r) => (r.start_date || r.date)?.slice(0, 7) === mo);
  const kmThisMo = runsThisMo.reduce((s, r) => s + (r.distance_m || 0), 0) / 1000;
  const latestWeight = history && history.length > 0 ? history[history.length - 1]?.weight : null;
  const firstWeight = history && history.length > 0 ? history[0]?.weight : null;
  const weightDelta =
    latestWeight !== null && firstWeight !== null ? (latestWeight - firstWeight).toFixed(1) : null;

  // Streak (consecutive days with workout or run)
  const activeDays = useMemo(() => {
    const days = new Set();
    workouts.forEach((w) => {
      if (w.date) days.add(w.date.slice(0, 10));
    });
    (runs || []).forEach((r) => {
      const d = (r.start_date || r.date)?.slice(0, 10);
      if (d) days.add(d);
    });
    return days;
  }, [workouts, runs]);

  const streak = useMemo(() => {
    let s = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (!activeDays.has(key)) break;
      s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  }, [activeDays]);

  // Sessions per week — 12 weeks
  const sessionsPerWk = useMemo(() => {
    const bars = [];
    for (let i = 11; i >= 0; i--) {
      const refDate = new Date(now);
      refDate.setDate(refDate.getDate() - i * 7);
      const ws = weekStart(refDate.toISOString().slice(0, 10));
      const we = new Date(ws + "T00:00:00");
      we.setDate(we.getDate() + 6);
      const weStr = we.toISOString().slice(0, 10);
      const count = workouts.filter((w) => w.date >= ws && w.date <= weStr).length;
      bars.push({ v: count, hot: i === 0, lbl: i === 11 || i === 0 ? ws.slice(5) : "" });
    }
    return bars;
  }, [workouts]);

  // Run KM per week from runHistory (already weekly from API)
  const runKmBars = useMemo(() => {
    if (!runHistory || !runHistory.length) return [];
    const slice = runHistory.slice(-12);
    return slice.map((r, i) => ({
      v: parseFloat((r.total_km || 0).toFixed(1)),
      hot: i === slice.length - 1,
      lbl: i === 0 || i === slice.length - 1 ? (r.week || "").slice(5) : "",
    }));
  }, [runHistory]);

  // Weight 90d from history (sorted oldest→newest)
  const weight90d = useMemo(() => {
    if (!history || history.length < 2) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutStr = cutoff.toISOString().slice(0, 10);
    return history.filter((h) => (h.date || h.recorded_at || "").slice(0, 10) >= cutStr);
  }, [history]);

  const totalSets = workouts.reduce((s, w) => s + (w.sets?.length || 0), 0);

  const heroStats = [
    ["WORKOUTS", String(workoutsThisMo), "this month"],
    ["RUNS", `${runsThisMo.length}`, `${kmThisMo.toFixed(1)} km`],
    [
      "WEIGHT",
      latestWeight !== null ? String(latestWeight) : "—",
      latestWeight !== null
        ? `lbs${weightDelta !== null ? ` · ${parseFloat(weightDelta) > 0 ? "+" : ""}${weightDelta}` : ""}`
        : "no data",
    ],
    [
      "STREAK",
      streak > 0 ? `${streak}d` : String(totalSets),
      streak > 0 ? "active days" : "total sets",
    ],
  ];

  return (
    <div
      style={{
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        fontFamily: "var(--font-mono)",
        overflowY: "auto",
      }}
    >
      {/* Hero */}
      <Box glowing padding="16px 20px">
        <div style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.18em", marginBottom: 8 }}>
          {`// FITNESS · ${monthName} · ${year}`}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 14,
          }}
        >
          {heroStats.map(([l, v, s]) => (
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

      {/* Two-column: charts left | log right */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Left column: session bars + run bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Box title="SESSIONS · PER WEEK · 12W" padding="14px 18px">
            {sessionsPerWk.every((d) => d.v === 0) ? (
              <div style={{ color: theme.muted, fontSize: 11, padding: "8px 0" }}>
                no workouts yet
              </div>
            ) : (
              <BarChart data={sessionsPerWk} h={100} theme={theme} />
            )}
            <div
              style={{
                fontSize: 10,
                color: theme.accentDim,
                display: "flex",
                justifyContent: "space-between",
                marginTop: 4,
              }}
            >
              <span>{sessionsPerWk[0]?.lbl}</span>
              <span style={{ color: theme.accentHot }}>
                now · {sessionsPerWk[sessionsPerWk.length - 1]?.v} sessions
              </span>
              <span>{sessionsPerWk[sessionsPerWk.length - 1]?.lbl}</span>
            </div>
          </Box>

          <Box title="RUN KM · PER WEEK" padding="14px 18px">
            {!runKmBars.length || runKmBars.every((d) => d.v === 0) ? (
              <div style={{ color: theme.muted, fontSize: 11, padding: "8px 0" }}>
                no runs logged yet
              </div>
            ) : (
              <BarChart data={runKmBars} h={100} theme={theme} />
            )}
            {runKmBars.length > 0 && (
              <div
                style={{
                  fontSize: 10,
                  color: theme.accentDim,
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 4,
                }}
              >
                <span>{runKmBars[0]?.lbl}</span>
                <span style={{ color: theme.accentHot }}>
                  {runKmBars[runKmBars.length - 1]?.v} km this week
                </span>
                <span>{runKmBars[runKmBars.length - 1]?.lbl}</span>
              </div>
            )}
          </Box>
        </div>

        {/* Right column: weight 90d + latest + recent workouts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Box title="WEIGHT · 90D" padding="14px 18px">
            <WeightLine data={weight90d} h={100} theme={theme} />
            {weight90d.length >= 2 && (
              <div
                style={{
                  fontSize: 10,
                  color: theme.accentDim,
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 4,
                }}
              >
                <span>{weight90d[0]?.weight} lbs</span>
                <span style={{ color: theme.accentHot }}>
                  {weightDelta !== null
                    ? `${parseFloat(weightDelta) > 0 ? "↑" : "↓"} ${Math.abs(parseFloat(weightDelta))} lbs`
                    : ""}
                </span>
                <span>{weight90d[weight90d.length - 1]?.weight} lbs</span>
              </div>
            )}
            {weight90d.length < 2 && (
              <div style={{ fontSize: 10, color: theme.muted, marginTop: 4 }}>
                log weight entries to see trend
              </div>
            )}
          </Box>

          <Box title="RECENT.WORKOUTS" padding="14px 18px" style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                color: theme.accentDim,
                letterSpacing: "0.08em",
                display: "grid",
                gridTemplateColumns: "56px 1fr 44px",
                gap: 8,
                padding: "4px 0",
                borderBottom: `1px dashed ${theme.border}`,
                marginBottom: 4,
              }}
            >
              <span>date</span>
              <span>workout</span>
              <span style={{ textAlign: "right" }}>min</span>
            </div>
            {workouts.length === 0 ? (
              <div style={{ color: theme.muted, fontSize: 11, padding: "8px 0" }}>
                no workouts yet
              </div>
            ) : (
              workouts.slice(0, 8).map((w, i) => (
                <div
                  key={w.id || i}
                  style={{
                    fontSize: 11,
                    color: theme.cream,
                    padding: "6px 0",
                    display: "grid",
                    gridTemplateColumns: "56px 1fr 44px",
                    gap: 8,
                    alignItems: "center",
                    borderBottom: `1px dashed ${theme.border}`,
                  }}
                >
                  <span style={{ color: theme.muted, fontSize: 10 }}>
                    {w.date?.slice(5) || "—"}
                  </span>
                  <span
                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {w.title || w.name || "workout"}
                  </span>
                  <span style={{ textAlign: "right", color: theme.accent }}>
                    {w.duration || "—"}
                  </span>
                </div>
              ))
            )}
          </Box>
        </div>
      </div>
    </div>
  );
}
