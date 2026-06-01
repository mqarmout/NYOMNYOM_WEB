import { useState, useEffect, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { useTheme, STATUS } from "../../context/ThemeContext";
import { fmt, fmtDate, apiFetch } from "../../utils";
import AddExpense from "./AddExpense";
import AddIncome from "./AddIncome";
import Box from "../../components/crt/Box";

export default function SpendingHistory() {
  const { profile } = useApp();
  const { theme } = useTheme();
  const [allExpenses, setAllExpenses] = useState(null);
  const [allIncome, setAllIncome] = useState(null);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const mono = { fontFamily: "var(--font-mono)" };

  const currency = profile?.currency || "$";

  const load = () => {
    Promise.all([apiFetch("/api/expenses"), apiFetch("/api/income")]).then(([exps, inc]) => {
      if (!exps.error) setAllExpenses(exps);
      if (!inc.error) setAllIncome(inc);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const allTx = useMemo(() => {
    const exps = (allExpenses || []).map((e) => ({ ...e, _type: "expense" }));
    const inc = (allIncome || []).map((i) => ({ ...i, _type: "income" }));
    return [...exps, ...inc].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  }, [allExpenses, allIncome]);

  const months = useMemo(() => {
    const set = new Set(allTx.map((tx) => tx.date?.slice(0, 7)).filter(Boolean));
    return [...set].sort().reverse();
  }, [allTx]);

  const filtered = useMemo(() => {
    let r = allTx;
    if (typeFilter !== "all") r = r.filter((tx) => tx._type === typeFilter);
    if (monthFilter !== "all") r = r.filter((tx) => tx.date?.startsWith(monthFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (tx) =>
          (tx.description || tx.merchant || "").toLowerCase().includes(q) ||
          (tx.category_name || tx.source || "").toLowerCase().includes(q)
      );
    }
    return r;
  }, [allTx, typeFilter, monthFilter, search]);

  const totalOut = filtered
    .filter((tx) => tx._type === "expense")
    .reduce((s, tx) => s + tx.amount, 0);
  const totalIn = filtered
    .filter((tx) => tx._type === "income")
    .reduce((s, tx) => s + tx.amount, 0);
  const net = totalIn - totalOut;
  const loading = allExpenses === null || allIncome === null;

  const handleClose = () => {
    setModal(null);
    load();
  };

  return (
    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, ...mono }}>
      {/* Summary */}
      <Box glowing padding="14px 22px">
        <div
          style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.18em", marginBottom: 10 }}
        >
          {`// SPENDING · FULL HISTORY`}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 14,
          }}
        >
          {[
            ["TOTAL.OUT", fmt(totalOut, currency), theme.accentHot],
            ["TOTAL.IN", fmt(totalIn, currency), theme.accent],
            [
              "NET",
              (net >= 0 ? "+" : "") + fmt(Math.abs(net), currency),
              net >= 0 ? theme.accent : STATUS.red,
            ],
            ["ENTRIES", String(filtered.length), theme.accentDim],
          ].map(([l, v, c]) => (
            <div key={l}>
              <div style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.12em" }}>{l}</div>
              <div style={{ fontSize: 28, color: c, lineHeight: 1.1, marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>
      </Box>

      {/* Filters + list */}
      <Box
        title="ALL.TRANSACTIONS"
        padding="14px 18px"
        style={{ display: "flex", flexDirection: "column" }}
      >
        {/* Filter bar */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: 1,
              minWidth: 160,
              padding: "6px 10px",
              background: theme.surface2,
              border: `1px solid ${theme.border}`,
            }}
          >
            <span style={{ color: theme.accent, fontSize: 12 }}>/</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search description, category…"
              style={{
                ...mono,
                fontSize: 11,
                color: theme.cream,
                background: "none",
                border: "none",
                outline: "none",
                flex: 1,
              }}
            />
          </div>

          {["all", "expense", "income"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                ...mono,
                fontSize: 10,
                padding: "6px 12px",
                letterSpacing: "0.08em",
                background: typeFilter === t ? theme.accent : "transparent",
                color: typeFilter === t ? theme.bg : theme.muted,
                border: `1px solid ${typeFilter === t ? theme.accent : theme.border}`,
                cursor: "pointer",
              }}
            >
              {t.toUpperCase()}
            </button>
          ))}

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            style={{
              ...mono,
              fontSize: 10,
              padding: "6px 10px 6px 10px",
              background: theme.surface2,
              border: `1px solid ${theme.border}`,
              color: theme.cream,
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="all">ALL MONTHS</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Header row */}
        <div
          style={{
            ...mono,
            fontSize: 10,
            color: theme.accentDim,
            display: "grid",
            gridTemplateColumns: "70px 1fr 90px 80px",
            gap: 8,
            padding: "4px 0",
            borderBottom: `1px dashed ${theme.border}`,
            marginBottom: 4,
          }}
        >
          <span>date</span>
          <span>description</span>
          <span>category</span>
          <span style={{ textAlign: "right" }}>amount</span>
        </div>

        {/* Transaction list */}
        <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 360px)", minHeight: 200 }}>
          {loading ? (
            <div style={{ ...mono, fontSize: 12, color: theme.muted, padding: "12px 0" }}>
              loading…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ ...mono, fontSize: 12, color: theme.muted, padding: "12px 0" }}>
              no entries match
            </div>
          ) : (
            filtered.map((tx) => {
              const isIncome = tx._type === "income";
              return (
                <div
                  key={`${tx._type}-${tx.id}`}
                  onClick={() => setModal({ type: tx._type, item: tx })}
                  style={{
                    ...mono,
                    fontSize: 11,
                    color: isIncome ? theme.accent : theme.cream,
                    padding: "6px 0",
                    display: "grid",
                    gridTemplateColumns: "70px 1fr 90px 80px",
                    gap: 8,
                    alignItems: "center",
                    borderBottom: `1px solid ${theme.border}`,
                    cursor: "pointer",
                  }}
                >
                  <span style={{ color: theme.muted, fontSize: 10 }}>{fmtDate(tx.date)}</span>
                  <span
                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {isIncome ? tx.description || tx.source : tx.description || "—"}
                  </span>
                  <span
                    style={{
                      color: theme.muted,
                      fontSize: 10,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isIncome ? tx.source || "income" : tx.category_name || "—"}
                  </span>
                  <span
                    style={{ color: isIncome ? theme.accent : theme.accentHot, textAlign: "right" }}
                  >
                    {isIncome ? "+" : "-"}
                    {fmt(tx.amount, currency)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer totals */}
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: `1px dashed ${theme.border}`,
            ...mono,
            fontSize: 10,
            color: theme.muted,
            display: "flex",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <span>{filtered.length} entries</span>
          <span>
            out: <span style={{ color: theme.accentHot }}>{fmt(totalOut, currency)}</span>
          </span>
          <span>
            in: <span style={{ color: theme.accent }}>{fmt(totalIn, currency)}</span>
          </span>
          <span>
            net:{" "}
            <span style={{ color: net >= 0 ? theme.accent : STATUS.red }}>
              {net >= 0 ? "+" : ""}
              {fmt(Math.abs(net), currency)}
            </span>
          </span>
        </div>
      </Box>

      {modal?.type === "expense" && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="modal-box">
            <AddExpense onClose={handleClose} initial={modal.item} />
          </div>
        </div>
      )}
      {modal?.type === "income" && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="modal-box">
            <AddIncome onClose={handleClose} initial={modal.item} />
          </div>
        </div>
      )}
    </div>
  );
}
