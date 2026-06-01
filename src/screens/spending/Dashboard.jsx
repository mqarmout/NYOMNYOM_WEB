import { useState, useEffect, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { useTheme, glow as glowFn, STATUS } from "../../context/ThemeContext";
import { fmt, fmtDate, apiFetch } from "../../utils";
import AddExpense from "./AddExpense";
import AddIncome from "./AddIncome";
import SpendingHero from "./SpendingHero";
import Box from "../../components/crt/Box";
import BlockBar from "../../components/crt/BlockBar";
import { useBreakpoint } from "../../hooks/useBreakpoint";

export default function Dashboard() {
  const { categories, expenses, income, profile, deleteExpense, deleteIncome } = useApp();
  const { theme, tweaks } = useTheme();
  const bp = useBreakpoint();
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const mono = { fontFamily: "var(--font-mono)" };

  useEffect(() => {
    const d = new Date();
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    apiFetch("/api/analytics?month=" + month).then(res => {
      if (!res.error) setAnalytics(res);
    });
  }, [expenses]);

  useEffect(() => {
    const onExpense = () => setModal({ type: "expense", item: null });
    const onIncome = () => setModal({ type: "income", item: null });
    const onKey = e => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "i") { e.preventDefault(); setModal({ type: "income", item: null }); }
    };
    window.addEventListener("shortcut:new", onExpense);
    window.addEventListener("shortcut:new-income", onIncome);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("shortcut:new", onExpense);
      window.removeEventListener("shortcut:new-income", onIncome);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const currency = profile.currency || "$";
  const now = new Date();
  const mo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Transaction log
  const allTx = useMemo(() => [
    ...expenses.map(e => ({ ...e, _type: "expense" })),
    ...income.map(i => ({ ...i, _type: "income" })),
  ].sort((a, b) => b.date > a.date ? 1 : b.date < a.date ? -1 : 0), [expenses, income]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return allTx;
    const q = filter.toLowerCase();
    return allTx.filter(tx =>
      (tx.description || tx.merchant || "").toLowerCase().includes(q) ||
      (tx.category_name || tx.source || "").toLowerCase().includes(q)
    );
  }, [allTx, filter]);

  // Top categories — use analytics.by_category (server-aggregated) when available
  const topCats = useMemo(() => {
    if (analytics?.by_category) {
      return analytics.by_category
        .filter(c => (c.spent || 0) > 0 || (c.budget || 0) > 0)
        .sort((a, b) => (b.spent || 0) - (a.spent || 0))
        .slice(0, 5);
    }
    return categories
      .map(c => {
        const spent = expenses.filter(e => e.category_id === c.id && e.date?.startsWith(mo)).reduce((s, e) => s + e.amount, 0);
        return { ...c, spent };
      })
      .filter(c => c.spent > 0 || (c.budget || 0) > 0)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);
  }, [categories, expenses, mo, analytics]);

  // Daily 30D histogram — use analytics.daily (server-aggregated) when available
  const dailyBars = useMemo(() => {
    const lookup = {};
    if (analytics?.daily) {
      for (const { date, total } of analytics.daily) lookup[date] = total;
    }
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const v = analytics
        ? (lookup[ds] || 0)
        : expenses.filter(e => e.date === ds).reduce((s, e) => s + e.amount, 0);
      days.push({ ds, v, lbl: ds.slice(5) });
    }
    return days;
  }, [expenses, analytics]);

  const maxDay = Math.max(...dailyBars.map(d => d.v), 1);
  const svgW = 760, svgH = 120;
  const barW = svgW / 30 - 2;

  return (
    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, ...mono }}>
      <style>{`@keyframes crt-blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
      <SpendingHero data={analytics} expenses={expenses} categories={categories} profile={profile} />

      <div style={{
        display: "grid",
        gridTemplateColumns: bp === "phone" ? "1fr" : "1fr 420px",
        gap: 14,
        flex: 1,
        minHeight: 0,
      }}>
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {/* Daily histogram */}
          <Box title="DAILY.HISTOGRAM · 30D" padding="14px 18px">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" height={svgH} preserveAspectRatio="none">
              <defs>
                <filter id="sp-glow-db">
                  <feGaussianBlur stdDeviation={1 * tweaks.glow} result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              {dailyBars.map((d, i) => {
                const h = Math.max((d.v / maxDay) * (svgH - 16), 2);
                const isLast = i === dailyBars.length - 1;
                return (
                  <rect
                    key={i}
                    x={i * (barW + 2) + 2}
                    y={svgH - h}
                    width={barW}
                    height={h}
                    fill={isLast ? theme.accentHot : theme.accent}
                    opacity={isLast ? 1 : 0.55}
                    filter={isLast && tweaks.glow > 0 ? "url(#sp-glow-db)" : undefined}
                  />
                );
              })}
              <line x1="0" y1={svgH} x2={svgW} y2={svgH} stroke={theme.borderHi} strokeWidth="0.6" />
            </svg>
            <div style={{ ...mono, fontSize: 10, color: theme.accentDim, display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              {[0, 7, 14, 21, 29].map(i => (
                <span key={i} style={{ color: i === 29 ? theme.accentHot : theme.muted }}>
                  {dailyBars[i]?.lbl || ""}
                </span>
              ))}
            </div>
          </Box>

          {/* Top categories */}
          <Box title="TOP.CATEGORIES" padding="16px 20px" style={{ flex: 1 }}>
            <div style={{
              ...mono, fontSize: 10, color: theme.muted, letterSpacing: "0.08em",
              display: "grid", gridTemplateColumns: "1fr auto auto auto",
              gap: 10, paddingBottom: 6,
              borderBottom: `1px dashed ${theme.border}`, marginBottom: 8,
            }}>
              <span>category</span>
              <span>utilization</span>
              <span>spent / budget</span>
              <span style={{ textAlign: "right" }}>%</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {topCats.length === 0 ? (
                <div style={{ ...mono, fontSize: 12, color: theme.muted }}>no spending this month</div>
              ) : topCats.map(c => {
                const over = c.budget > 0 && c.spent > c.budget;
                const pct = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
                const blocks = c.budget > 0 ? Math.min(20, Math.round((c.spent / c.budget) * 20)) : 0;
                return (
                  <div key={c.id} style={{
                    ...mono, fontSize: 11, color: theme.cream,
                    display: "grid", gridTemplateColumns: "1fr auto auto auto",
                    gap: 10, alignItems: "center",
                  }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.name}
                    </span>
                    <span style={{ color: over ? STATUS.red : theme.accent, whiteSpace: "nowrap" }}>
                      {"█".repeat(blocks)}
                      <span style={{ color: theme.faint }}>{"░".repeat(Math.max(0, 20 - blocks))}</span>
                    </span>
                    <span style={{ color: theme.muted, whiteSpace: "nowrap" }}>
                      {fmt(c.spent, currency)} {c.budget > 0 ? `/ ${fmt(c.budget, currency)}` : ""}
                    </span>
                    <span style={{ color: over ? STATUS.red : theme.cream, textAlign: "right" }}>
                      {c.budget > 0 ? `${pct}%` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => {}}
              style={{
                marginTop: 10, ...mono, fontSize: 10, color: theme.accent,
                background: "none", border: "none", cursor: "pointer", letterSpacing: "0.1em",
              }}
            >
              SEE ALL {categories.length} CATEGORIES →
            </button>
          </Box>
        </div>

        {/* RIGHT — TXN.LOG */}
        <Box title="TXN.LOG" padding="14px 18px" style={{ display: "flex", flexDirection: "column", minHeight: 360, maxHeight: 600 }}>
          {/* Search */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "6px 8px",
            background: theme.surface2, border: `1px solid ${theme.border}`,
            marginBottom: 10,
          }}>
            <span style={{ color: theme.accent, ...mono, fontSize: 12 }}>/</span>
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="filter merchant | category…"
              style={{
                ...mono, fontSize: 11, color: theme.cream,
                background: "none", border: "none", outline: "none", flex: 1,
              }}
            />
            <span style={{
              background: theme.accent, color: theme.bg,
              padding: "0 4px", ...mono, fontSize: 11,
              animation: !filter ? "crt-blink 0.8s step-end infinite" : "none",
            }}>_</span>
          </div>

          {/* Header row */}
          <div style={{
            ...mono, fontSize: 10, color: theme.accentDim,
            display: "grid", gridTemplateColumns: "56px 1fr 70px 70px",
            gap: 6, padding: "4px 0",
            borderBottom: `1px dashed ${theme.border}`, marginBottom: 4,
          }}>
            <span>date</span><span>desc</span><span>cat</span><span style={{ textAlign: "right" }}>amount</span>
          </div>

          {/* Transaction rows */}
          <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            {filtered.length === 0 ? (
              <div style={{ ...mono, fontSize: 12, color: theme.muted, padding: "12px 0" }}>no transactions</div>
            ) : filtered.slice(0, 80).map(tx => {
              const isIncome = tx._type === "income";
              return (
                <div
                  key={`${tx._type}-${tx.id}`}
                  onClick={() => setModal({ type: tx._type, item: tx })}
                  style={{
                    ...mono, fontSize: 11,
                    color: isIncome ? theme.accent : theme.cream,
                    padding: "5px 0",
                    display: "grid",
                    gridTemplateColumns: "56px 1fr 70px 70px",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    borderBottom: `1px solid ${theme.border}`,
                  }}
                >
                  <span style={{ color: theme.muted, fontSize: 10 }}>{fmtDate(tx.date)}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {isIncome ? (tx.description || tx.source) : (tx.description || tx.merchant || "—")}
                  </span>
                  <span style={{ color: theme.muted, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {isIncome ? (tx.source || "income") : (tx.category_name || "—")}
                  </span>
                  <span style={{
                    color: isIncome ? theme.accent : theme.accentHot,
                    textAlign: "right",
                  }}>
                    {isIncome ? "+" : "-"}{fmt(tx.amount, currency)}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 8, ...mono, fontSize: 10, color: theme.muted }}>
            {filtered.length} of {allTx.length} ·{" "}
            <button
              onClick={() => setModal({ type: "income", item: null })}
              style={{ ...mono, fontSize: 10, color: theme.accent, background: "none", border: "none", cursor: "pointer" }}
            >
              [+] income
            </button>
          </div>
        </Box>
      </div>

      {/* Modals */}
      {modal?.type === "expense" && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-box">
            <AddExpense onClose={() => setModal(null)} initial={modal.item} />
          </div>
        </div>
      )}
      {modal?.type === "income" && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-box">
            <AddIncome onClose={() => setModal(null)} initial={modal.item} />
          </div>
        </div>
      )}
    </div>
  );
}
