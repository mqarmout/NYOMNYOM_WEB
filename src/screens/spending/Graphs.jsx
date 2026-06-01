import { useEffect, useState, useMemo, useId } from "react";
import { useApp } from "../../context/AppContext";
import { useTheme, glow as glowFn, STATUS } from "../../context/ThemeContext";
import { AreaChart, DonutChart, HistoryBars } from "../../Charts";
import { apiFetch, fmt } from "../../utils";
import Box from "../../components/crt/Box";
import SpendingHero from "./SpendingHero";

export default function Graphs() {
  const { expenses, categories, profile } = useApp();
  const { theme, tweaks } = useTheme();
  const uid = useId();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7);
    Promise.all([
      apiFetch("/api/analytics?month=" + month),
      apiFetch("/api/graphs/history?months=6"),
    ]).then(([d, h]) => {
      if (!d.error) setData(d);
      if (!h.error) setHistory(h);
    });
  }, [expenses]);

  const currency = profile.currency || "$";
  const crtColors = [theme.accent, theme.accentDim, STATUS.blue, STATUS.amber, theme.accentHot, STATUS.red, theme.faint, theme.muted];
  const mono = { fontFamily: "var(--font-mono)" };

  const total = data?.total || 0;
  const effBudget = data?.effective_budget || 0;
  const rolloverIn = data?.rollover_carried_in || 0;
  const active = data ? data.by_category.filter(c => c.spent > 0) : [];

  // 30-day daily bars
  const dailyData = useMemo(() => {
    if (!data?.daily) return [];
    return data.daily.map(d => ({ v: d.total, lbl: d.date.split("-")[2] }));
  }, [data]);

  // Cumulative 30D area chart
  const cumulativeData = useMemo(() => {
    let cum = 0;
    return dailyData.map(d => ({ v: (cum += d.v), lbl: d.lbl }));
  }, [dailyData]);

  // Inline daily bars SVG
  const svgW = 720, svgH = 140;
  const maxDay = Math.max(...dailyData.map(d => d.v), 1);
  const barW = dailyData.length > 0 ? (svgW / dailyData.length) - 2 : 20;

  return (
    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, ...mono }}>
      <SpendingHero data={data} expenses={expenses} categories={categories} profile={profile} />

      {/* Daily 30D bars */}
      <Box title="DAILY · 30D" padding="14px 18px">
        {dailyData.length > 0 ? (
          <>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" height={svgH} preserveAspectRatio="none">
              <defs>
                <filter id={`${uid}-glow`}>
                  <feGaussianBlur stdDeviation={1 * tweaks.glow} result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              {dailyData.map((d, i) => {
                const h = Math.max((d.v / maxDay) * (svgH - 12), 2);
                const isLast = i === dailyData.length - 1;
                return (
                  <rect
                    key={i}
                    x={i * (barW + 2) + 2}
                    y={svgH - h}
                    width={barW}
                    height={h}
                    fill={isLast ? theme.accentHot : theme.accent}
                    opacity={isLast ? 1 : 0.55}
                    filter={isLast && tweaks.glow > 0 ? `url(#${uid}-glow)` : undefined}
                  />
                );
              })}
              <line x1="0" y1={svgH} x2={svgW} y2={svgH} stroke={theme.borderHi} strokeWidth="0.6" />
            </svg>
            <div style={{ ...mono, fontSize: 9, color: theme.muted, display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              {[0, 7, 14, 21, dailyData.length - 1].map(i => (
                <span key={i} style={{ color: i === dailyData.length - 1 ? theme.accentHot : undefined }}>
                  {dailyData[i]?.lbl || ""}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div style={{ ...mono, fontSize: 12, color: theme.muted, padding: "20px 0" }}>no data yet</div>
        )}
      </Box>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Cumulative 30D */}
        <Box title="CUMULATIVE · 30D" padding="14px 18px">
          {cumulativeData.length > 0 ? (
            <>
              <AreaChart data={cumulativeData} />
              {effBudget > 0 && (
                <div style={{ marginTop: 6, ...mono, fontSize: 10, color: theme.muted, display: "flex", gap: 16 }}>
                  <span style={{ borderBottom: `1px dashed ${theme.muted}` }}>{fmt(effBudget, currency)} budget</span>
                  {rolloverIn > 0 && <span style={{ color: theme.accent }}>+{fmt(rolloverIn, currency)} rollover</span>}
                </div>
              )}
            </>
          ) : (
            <div style={{ ...mono, fontSize: 12, color: theme.muted, padding: "20px 0" }}>no data yet</div>
          )}
        </Box>

        {/* By Category donut */}
        <Box title="BY CATEGORY" padding="14px 18px">
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ width: 130, flexShrink: 0 }}>
              <DonutChart segments={active} total={total} currency={currency} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {active.length === 0 ? (
                <div style={{ ...mono, fontSize: 12, color: theme.muted }}>no spending yet</div>
              ) : active.slice(0, 7).map((c, i) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 7, height: 7, flexShrink: 0, background: crtColors[i % crtColors.length] }} />
                  <div style={{ ...mono, fontSize: 11, color: theme.muted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name}
                  </div>
                  <div style={{ ...mono, fontSize: 11, color: theme.cream }}>
                    {total > 0 ? Math.round((c.spent / total) * 100) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Box>
      </div>

      {/* Monthly history */}
      <Box title="MONTHLY HISTORY · 6MO" padding="14px 18px">
        <HistoryBars months={history} />
      </Box>
    </div>
  );
}
