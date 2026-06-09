import { useEffect, useState } from "react";
import { usePrints } from "../../context/PrintsContext";
import { useTheme, glow as glowFn, STATUS } from "../../context/ThemeContext";
import { fmt, fmtDate } from "../../utils";
import Box from "../../components/crt/Box";
import { IClose, IEdit } from "../../icons";
import AddPrint from "./AddPrint";

const MATERIAL_COLORS = {
  PLA: STATUS.blue, PETG: STATUS.amber, ABS: STATUS.red,
  ASA: "#c084fc", TPU: "#34d399", Nylon: "#fb923c", Resin: "#a78bfa",
};

export default function PrintsDashboard() {
  const { prints, stats, loadAll, deletePrint } = usePrints();
  const { theme, tweaks } = useTheme();
  const [modal, setModal] = useState(null);
  const mono = { fontFamily: "var(--font-mono)" };

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const handler = () => setModal({ mode: "add" });
    window.addEventListener("shortcut:new", handler);
    return () => window.removeEventListener("shortcut:new", handler);
  }, []);

  const recent = prints.slice(0, 5);

  const fmtTime = (min) => {
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60), m = min % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, ...mono }}>
      {/* Stats hero */}
      <Box glowing padding="20px 24px">
        <div style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.18em" }}>
          // 3D.PRINTS · OVERVIEW
        </div>
        {stats ? (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 22, marginTop: 8, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 52, color: theme.accentHot, lineHeight: 0.95,
                textShadow: glowFn(theme, tweaks.glow * 1.6) }}>
                {stats.total_prints}
                <span style={{ fontSize: 20, color: theme.muted }}> prints</span>
              </div>
              <div style={{ fontSize: 11, color: theme.accentDim, marginTop: 4 }}>
                {stats.success_rate}% success rate
              </div>
            </div>
            <div style={{ fontSize: 11, color: theme.cream, lineHeight: 2 }}>
              <div><span style={{ color: theme.muted }}>filament used · </span>
                <span style={{ color: theme.accent }}>{stats.total_filament_g}g</span>
              </div>
              <div><span style={{ color: theme.muted }}>total cost · </span>
                <span style={{ color: theme.accentHot }}>${stats.total_cost.toFixed(2)}</span>
              </div>
              <div><span style={{ color: theme.muted }}>print time · </span>
                {fmtTime(stats.total_print_time_min)}
              </div>
            </div>
            {Object.keys(stats.by_material).length > 0 && (
              <div style={{ fontSize: 11, color: theme.cream, lineHeight: 2 }}>
                <div style={{ color: theme.muted, marginBottom: 2 }}>by material</div>
                {Object.entries(stats.by_material).map(([mat, cnt]) => (
                  <div key={mat}>
                    <span style={{ color: MATERIAL_COLORS[mat] || theme.accent }}>{mat}</span>
                    <span style={{ color: theme.muted }}> · {cnt}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ flex: 1 }} />
            <button
              onClick={() => setModal({ mode: "add" })}
              style={{ ...mono, fontSize: 11, padding: "8px 16px",
                background: theme.accent, color: theme.bg, border: "none",
                fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", alignSelf: "flex-start" }}
            >
              [+] LOG PRINT
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 13, color: theme.muted }}>no prints logged yet</div>
            <button
              onClick={() => setModal({ mode: "add" })}
              style={{ ...mono, fontSize: 11, padding: "8px 16px", marginTop: 12,
                background: theme.accent, color: theme.bg, border: "none",
                fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer" }}
            >
              [+] LOG FIRST PRINT
            </button>
          </div>
        )}
      </Box>

      {/* Recent prints */}
      {recent.length > 0 && (
        <Box title={`RECENT.PRINTS · ${recent.length} of ${prints.length}`} padding="14px 18px">
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto",
            gap: 8, fontSize: 10, color: theme.muted, letterSpacing: "0.08em",
            paddingBottom: 6, borderBottom: `1px dashed ${theme.border}`, marginBottom: 4 }}>
            <span>name</span>
            <span>material</span>
            <span style={{ textAlign: "right" }}>time</span>
            <span style={{ textAlign: "right" }}>cost</span>
            <span></span>
          </div>
          {recent.map((p) => {
            const over = p.status === "failed";
            return (
              <div key={p.id} style={{ display: "grid",
                gridTemplateColumns: "1fr auto auto auto auto",
                gap: 8, fontSize: 11, color: theme.cream,
                padding: "6px 0", borderBottom: `1px solid ${theme.border}`,
                alignItems: "center" }}>
                <div>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    display: "block", color: over ? STATUS.red : theme.cream }}>{p.name}</span>
                  <span style={{ fontSize: 9, color: theme.muted }}>{fmtDate(p.date)}</span>
                </div>
                <span style={{ fontSize: 10, color: MATERIAL_COLORS[p.material] || theme.accent }}>{p.material}</span>
                <span style={{ color: theme.muted, textAlign: "right" }}>{fmtTime(p.print_time_min)}</span>
                <span style={{ color: theme.accentHot, textAlign: "right" }}>${p.total_cost.toFixed(2)}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => setModal({ mode: "edit", print: p })}
                    style={{ background: "none", border: `1px solid ${theme.border}`,
                      cursor: "pointer", color: theme.accent, padding: "2px 6px", ...mono, fontSize: 10,
                      display: "flex", alignItems: "center", gap: 3 }}>
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
          })}
        </Box>
      )}

      {modal && (
        <AddPrint
          initial={modal.mode === "edit" ? modal.print : null}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
