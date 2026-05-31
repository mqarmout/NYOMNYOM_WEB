import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { AreaChart, DonutChart, HistoryBars } from "../../Charts";
import { COLORS, apiFetch } from "../../utils";

export default function Graphs() {
  const { profile } = useApp();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7);
    Promise.all([
      apiFetch("/api/analytics?month=" + month),
      apiFetch("/api/graphs/history?months=6"),
    ]).then(([d, h]) => {
      setData(d);
      setHistory(h);
    });
  }, []);

  const currency = profile.currency || "$";
  const month = new Date().toLocaleString("default", { month: "long", year: "numeric" });
  const active = data ? data.by_category.filter((c) => c.spent > 0) : [];
  const total = data ? data.total : 0;

  const effBudget = data?.effective_budget || 0;
  const baseBudget = data?.base_budget || 0;
  const rolloverIn = data?.rollover_carried_in || 0;
  const budgetPct = effBudget > 0 ? Math.min(100, Math.round((total / effBudget) * 100)) : 0;

  return (
    <div className="screen">
      <div className="page-header">
        <h1>Graphs</h1>
        <p>{month}</p>
      </div>

      {effBudget > 0 && (
        <div className="graph-card" style={{ marginBottom: 16 }}>
          <div className="graph-card-title">Monthly Budget</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8, color: "var(--muted)" }}>
            <span>
              {fmt(baseBudget, currency)} base
              {rolloverIn > 0 && (
                <span style={{ marginLeft: 6, color: "var(--accent)", fontSize: 11 }}>
                  +{fmt(rolloverIn, currency)} rollover = {fmt(effBudget, currency)}
                </span>
              )}
            </span>
            <span style={{ color: budgetPct > 85 ? "var(--danger)" : "inherit" }}>
              {fmt(total, currency)} / {fmt(effBudget, currency)} ({budgetPct}%)
            </span>
          </div>
          <div className="prog-wrap">
            <div
              className="prog-fill"
              style={{
                width: budgetPct + "%",
                background: budgetPct > 85 ? "var(--danger)" : "var(--accent)",
              }}
            />
          </div>
          {effBudget > total && (
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
              {fmt(effBudget - total, currency)} remaining ·{" "}
              {Math.round(((effBudget - total) * (profile.rollover_pct || 0)) / 100) > 0
                ? `${fmt(Math.round(((effBudget - total) * (profile.rollover_pct || 0)) / 100), currency)} will roll over next month`
                : "no rollover configured"}
            </div>
          )}
        </div>
      )}

      <div className="graphs-grid">
        <div className="graph-card span-2">
          <div className="graph-card-title">Spending Trend</div>
          <AreaChart
            data={data ? data.daily.map((d) => ({ v: d.total, lbl: d.date.split("-")[2] })) : []}
            color="#7c6fef"
          />
        </div>

        <div className="graph-card">
          <div className="graph-card-title">By Category</div>
          <div className="donut-row">
            <div className="donut-svg-wrap">
              <DonutChart segments={active} total={total} currency={currency} />
            </div>
            <div className="donut-legend">
              {active.length === 0 ? (
                <div style={{ color: "var(--muted)", fontSize: 13 }}>No spending yet</div>
              ) : (
                active.map((c, i) => (
                  <div className="legend-item" key={c.id}>
                    <div className="legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                    <div className="legend-name">
                      {c.icon} {c.name}
                    </div>
                    <div className="legend-pct">
                      {total > 0 ? Math.round((c.spent / total) * 100) : 0}%
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="graph-card">
          <div className="graph-card-title">Monthly History</div>
          <HistoryBars months={history} color="#5b8dee" />
        </div>
      </div>
    </div>
  );
}
