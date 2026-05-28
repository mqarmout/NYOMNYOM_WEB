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

  return (
    <div className="screen">
      <div className="page-header">
        <h1>Graphs</h1>
        <p>{month}</p>
      </div>

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
