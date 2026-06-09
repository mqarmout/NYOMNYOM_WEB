import { useState, useEffect, useRef } from "react";
import { useFitness } from "../../context/FitnessContext";
import { useTheme, glow as glowFn } from "../../context/ThemeContext";
import { AreaChart } from "../../Charts";
import { fmtDate } from "../../utils";
import { IClose } from "../../icons";
import Box from "../../components/crt/Box";

export default function BodyMetrics() {
  const { metrics, history, loadAll, addMetric, deleteMetric } = useFitness();
  const { theme, tweaks } = useTheme();
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const weightRef = useRef(null);
  const mono = { fontFamily: "var(--font-mono)" };

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const onKey = (e) => {
      if (
        e.key === "n" &&
        document.activeElement.tagName !== "INPUT" &&
        document.activeElement.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        weightRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleAdd = async () => {
    if (!weight || parseFloat(weight) <= 0) return;
    setSaving(true);
    await addMetric({ weight: parseFloat(weight), date });
    setWeight("");
    setSaving(false);
    weightRef.current?.blur();
  };

  const latest = metrics[0];
  const chartData = history.map((h) => ({ v: h.weight, lbl: h.date.slice(5) }));

  return (
    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, ...mono }}>
      {/* Hero */}
      <Box glowing padding="20px 24px">
        <div style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.18em" }}>
          // BODY.METRICS · {metrics.length} LOG{metrics.length !== 1 ? "S" : ""}
        </div>
        {latest ? (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18, marginTop: 8, flexWrap: "wrap" }}>
            <div>
              <div
                style={{
                  fontSize: 52,
                  color: theme.accentHot,
                  lineHeight: 0.95,
                  textShadow: glowFn(theme, tweaks.glow * 1.6),
                }}
              >
                {latest.weight}
                <span style={{ fontSize: 20, color: theme.muted }}> lbs</span>
              </div>
              <div style={{ fontSize: 11, color: theme.accentDim, marginTop: 4 }}>
                latest · {fmtDate(latest.date)}
              </div>
            </div>
            {metrics.length > 1 && (
              <div style={{ fontSize: 11, color: theme.cream, lineHeight: 1.8 }}>
                <div style={{ color: theme.muted }}>
                  prev · {metrics[1].weight} lbs on {fmtDate(metrics[1].date)}
                </div>
                <div style={{
                  color: metrics[0].weight <= metrics[1].weight ? theme.accent : theme.accentHot,
                }}>
                  {metrics[0].weight <= metrics[1].weight ? "↓" : "↑"}{" "}
                  {Math.abs(metrics[0].weight - metrics[1].weight).toFixed(1)} lbs
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: theme.muted, marginTop: 10 }}>
            no measurements recorded yet
          </div>
        )}
      </Box>

      {/* Chart */}
      <Box title="WEIGHT.OVER.TIME" padding="14px 18px">
        <AreaChart data={chartData} color={theme.accent} />
      </Box>

      {/* Log measurement */}
      <Box title="LOG.MEASUREMENT" padding="16px 20px">
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="field" style={{ flex: 1, marginBottom: 0, minWidth: 120 }}>
            <label>Weight (lbs)</label>
            <input
              ref={weightRef}
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g. 185"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0, minWidth: 120 }}>
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !weight}
            style={{
              ...mono,
              fontSize: 11,
              padding: "9px 18px",
              background: theme.accent,
              color: theme.bg,
              border: "none",
              fontWeight: 700,
              letterSpacing: "0.1em",
              cursor: saving || !weight ? "default" : "pointer",
              opacity: saving || !weight ? 0.5 : 1,
              alignSelf: "flex-end",
              marginBottom: 0,
            }}
          >
            {saving ? "…" : "[+] SAVE"}
          </button>
        </div>
      </Box>

      {/* History */}
      <Box title={`HISTORY · ${metrics.length}`} padding="14px 18px">
        {metrics.length === 0 ? (
          <div style={{ fontSize: 12, color: theme.muted }}>no measurements yet</div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 32px",
                gap: 8,
                fontSize: 10,
                color: theme.muted,
                letterSpacing: "0.08em",
                paddingBottom: 6,
                borderBottom: `1px dashed ${theme.border}`,
                marginBottom: 4,
              }}
            >
              <span>date</span>
              <span>weight</span>
              <span></span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {metrics.map((m, i) => {
                const prev = metrics[i + 1];
                const delta = prev ? m.weight - prev.weight : null;
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 32px",
                      gap: 8,
                      fontSize: 11,
                      color: theme.cream,
                      padding: "6px 0",
                      borderBottom: `1px solid ${theme.border}`,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ color: theme.muted }}>{fmtDate(m.date)}</span>
                    <span>
                      {m.weight} lbs{" "}
                      {delta !== null && (
                        <span
                          style={{
                            fontSize: 10,
                            color: delta <= 0 ? theme.accent : theme.accentHot,
                          }}
                        >
                          {delta <= 0 ? "↓" : "↑"}
                          {Math.abs(delta).toFixed(1)}
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() => deleteMetric(m.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: theme.muted,
                        padding: 2,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <IClose size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Box>
    </div>
  );
}
