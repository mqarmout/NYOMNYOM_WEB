import { useState } from "react";
import { useTheme, glow as glowFn, STATUS } from "../../context/ThemeContext";
import { fmt } from "../../utils";
import Box from "../../components/crt/Box";
import AddExpense from "./AddExpense";

export default function SpendingHero({ data, expenses, categories, profile }) {
  const { theme, tweaks } = useTheme();
  const [showAdd, setShowAdd] = useState(false);
  const mono = { fontFamily: "var(--font-mono)" };

  const currency = profile?.currency || "$";
  const now = new Date();
  const mo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthName = now.toLocaleString("default", { month: "long" }).toUpperCase();
  const year = now.getFullYear();
  const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();

  const total =
    data?.total ??
    expenses?.filter((e) => e.date?.startsWith(mo)).reduce((s, e) => s + e.amount, 0) ??
    0;
  const effBudget =
    data?.effective_budget || categories?.reduce((s, c) => s + (c.budget || 0), 0) || 0;
  const rolloverIn = data?.rollover_carried_in || 0;
  const budgetPct = effBudget > 0 ? Math.min(200, (total / effBudget) * 100) : 0;
  const remaining = effBudget - total;

  // vs last month
  const prevMo = (() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();
  const prevTotal =
    expenses?.filter((e) => e.date?.startsWith(prevMo)).reduce((s, e) => s + e.amount, 0) || 0;
  const vsPrev = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null;

  return (
    <>
      <Box glowing padding="18px 22px">
        <div style={{ ...mono, fontSize: 10, color: theme.muted, letterSpacing: "0.18em" }}>
          {`// SPENDING · ${monthName} · ${year}`}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 22,
            marginTop: 6,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              ...mono,
              fontSize: 48,
              color: theme.accentHot,
              lineHeight: 0.95,
              textShadow: glowFn(theme, tweaks.glow * 1.6),
            }}
          >
            {currency}
            {Math.floor(total).toLocaleString()}
            <span style={{ fontSize: 24 }}>.{(total % 1).toFixed(2).slice(1)}</span>
          </div>
          <div style={{ ...mono, fontSize: 12, color: theme.cream, lineHeight: 1.6 }}>
            {effBudget > 0 && (
              <div>
                of <span style={{ color: theme.accentHot }}>{fmt(effBudget, currency)}</span>
                {rolloverIn > 0 && (
                  <span style={{ color: theme.accentDim, fontSize: 10 }}>
                    {" "}
                    (+{fmt(rolloverIn, currency)} rollover)
                  </span>
                )}{" "}
                budget
              </div>
            )}
            <div style={{ color: theme.accentDim }}>
              {effBudget > 0 ? `${budgetPct.toFixed(0)}% used · ` : ""}
              {effBudget > 0 && remaining > 0 ? `${fmt(remaining, currency)} left · ` : ""}
              {daysLeft}d left
            </div>
            {vsPrev !== null && (
              <div style={{ color: vsPrev <= 0 ? theme.accent : STATUS.amber }}>
                {vsPrev <= 0 ? "↓" : "↑"} {Math.abs(vsPrev).toFixed(0)}% vs last month
                {vsPrev <= 0 ? " · on track" : ""}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              alignSelf: "flex-start",
              marginTop: 8,
            }}
          >
            <button
              onClick={() => setShowAdd(true)}
              style={{
                ...mono,
                fontSize: 11,
                padding: "8px 16px",
                background: theme.accent,
                color: theme.bg,
                border: "none",
                fontWeight: 700,
                letterSpacing: "0.1em",
                cursor: "pointer",
              }}
            >
              [+] EXPENSE
            </button>
          </div>
        </div>
      </Box>

      {showAdd && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAdd(false);
          }}
        >
          <div className="modal-box">
            <AddExpense onClose={() => setShowAdd(false)} />
          </div>
        </div>
      )}
    </>
  );
}
