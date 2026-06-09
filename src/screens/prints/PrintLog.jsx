import { useEffect, useState } from "react";
import { usePrints } from "../../context/PrintsContext";
import { useTheme, STATUS } from "../../context/ThemeContext";
import { fmtDate } from "../../utils";
import Box from "../../components/crt/Box";
import { IClose, IEdit } from "../../icons";
import AddPrint from "./AddPrint";

const MATERIAL_COLORS = {
  PLA: STATUS.blue, PETG: STATUS.amber, ABS: STATUS.red,
  ASA: "#c084fc", TPU: "#34d399", Nylon: "#fb923c", Resin: "#a78bfa",
};

export default function PrintLog() {
  const { prints, loadAll, deletePrint } = usePrints();
  const { theme } = useTheme();
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState("all");
  const mono = { fontFamily: "var(--font-mono)" };

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const handler = () => setModal({ mode: "add" });
    window.addEventListener("shortcut:new", handler);
    return () => window.removeEventListener("shortcut:new", handler);
  }, []);

  const filtered = filter === "all" ? prints
    : prints.filter((p) => p.status === filter);

  const fmtTime = (min) => {
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60), m = min % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, ...mono }}>
      <Box title={`PRINT.LOG · ${filtered.length}`} padding="14px 18px">
        {/* Toolbar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          {["all", "success", "failed", "in_progress"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ ...mono, fontSize: 10, padding: "4px 10px", cursor: "pointer",
                background: filter === s ? theme.accent : "transparent",
                color: filter === s ? theme.bg : theme.accentDim,
                border: `1px solid ${filter === s ? theme.accent : theme.border}`,
                letterSpacing: "0.08em" }}>
              {s.replace("_", " ")}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={() => setModal({ mode: "add" })}
            style={{ ...mono, fontSize: 11, padding: "6px 14px",
              background: theme.accent, color: theme.bg, border: "none",
              fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer" }}>
            [+] LOG PRINT
          </button>
        </div>

        {/* Header */}
        <div style={{ display: "grid",
          gridTemplateColumns: "1fr 60px 60px 70px 60px 80px 80px 60px",
          gap: 8, fontSize: 9, color: theme.muted, letterSpacing: "0.08em",
          paddingBottom: 6, borderBottom: `1px dashed ${theme.border}`, marginBottom: 4 }}>
          <span>name</span>
          <span>mat</span>
          <span>status</span>
          <span style={{ textAlign: "right" }}>time</span>
          <span style={{ textAlign: "right" }}>filament</span>
          <span style={{ textAlign: "right" }}>elec $</span>
          <span style={{ textAlign: "right" }}>total $</span>
          <span></span>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ fontSize: 12, color: theme.muted, padding: "12px 0" }}>no prints</div>
        ) : (
          filtered.map((p) => {
            const statusColor = p.status === "success" ? theme.accent
              : p.status === "failed" ? STATUS.red : STATUS.amber;
            return (
              <div key={p.id}
                style={{ display: "grid",
                  gridTemplateColumns: "1fr 60px 60px 70px 60px 80px 80px 60px",
                  gap: 8, fontSize: 11, color: theme.cream,
                  padding: "6px 0", borderBottom: `1px solid ${theme.border}`,
                  alignItems: "center" }}>
                <div>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 9, color: theme.muted }}>
                    {fmtDate(p.date)}{p.color && <span> · {p.color}</span>}
                  </div>
                </div>
                <span style={{ fontSize: 10, color: MATERIAL_COLORS[p.material] || theme.accent }}>{p.material}</span>
                <span style={{ fontSize: 9, color: statusColor }}>{p.status.replace("_", " ")}</span>
                <span style={{ color: theme.muted, textAlign: "right" }}>{fmtTime(p.print_time_min)}</span>
                <span style={{ color: theme.muted, textAlign: "right" }}>{p.filament_used_g}g</span>
                <span style={{ color: theme.accentDim, textAlign: "right" }}>${p.electricity_cost.toFixed(3)}</span>
                <span style={{ color: theme.accentHot, textAlign: "right", fontWeight: 600 }}>${p.total_cost.toFixed(2)}</span>
                <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                  <button onClick={() => setModal({ mode: "edit", print: p })}
                    style={{ background: "none", border: `1px solid ${theme.border}`,
                      cursor: "pointer", color: theme.accent, padding: "2px 5px",
                      display: "flex", alignItems: "center" }}>
                    <IEdit size={10} />
                  </button>
                  <button onClick={() => deletePrint(p.id)}
                    style={{ background: "none", border: "none", cursor: "pointer",
                      color: theme.muted, padding: 2, display: "flex", alignItems: "center" }}>
                    <IClose size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </Box>

      {modal && (
        <AddPrint
          initial={modal.mode === "edit" ? modal.print : null}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
