import { useState, useEffect, useRef } from "react";
import { usePrints } from "../../context/PrintsContext";
import { useTheme, STATUS } from "../../context/ThemeContext";
import { IClose } from "../../icons";

const MATERIALS = ["PLA", "PETG", "ABS", "ASA", "TPU", "Nylon", "Resin"];
const STATUSES = ["success", "failed", "in_progress"];

function calcCosts(printTimeMin, filamentG, costPerKg, wattage, elecRate) {
  const ptm = parseFloat(printTimeMin) || 0;
  const fg = parseFloat(filamentG) || 0;
  const cpkg = parseFloat(costPerKg) || 0;
  const pw = parseFloat(wattage) || 0;
  const er = parseFloat(elecRate) || 0;
  const elec = (ptm / 60) * (pw / 1000) * er;
  const fil = (fg / 1000) * cpkg;
  return { elec, fil, total: elec + fil };
}

export default function AddPrint({ initial, onClose }) {
  const { addPrint, updatePrint } = usePrints();
  const { theme } = useTheme();
  const isEdit = !!initial;
  const today = new Date().toISOString().split("T")[0];
  const mono = { fontFamily: "var(--font-mono)" };

  const [name, setName] = useState(initial?.name ?? "");
  const [printTimeMin, setPrintTimeMin] = useState(initial ? String(initial.print_time_min) : "");
  const [filamentG, setFilamentG] = useState(initial ? String(initial.filament_used_g) : "");
  const [costPerKg, setCostPerKg] = useState(initial ? String(initial.filament_cost_per_kg) : "25");
  const [wattage, setWattage] = useState(initial ? String(initial.printer_wattage) : "200");
  const [elecRate, setElecRate] = useState(initial ? String(initial.electricity_rate) : "0.20");
  const [material, setMaterial] = useState(initial?.material ?? "PLA");
  const [color, setColor] = useState(initial?.color ?? "");
  const [status, setStatus] = useState(initial?.status ?? "success");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [date, setDate] = useState(initial?.date ?? today);
  const [saving, setSaving] = useState(false);

  const costs = calcCosts(printTimeMin, filamentG, costPerKg, wattage, elecRate);

  const saveRef = useRef(null);
  const handleSave = async () => {
    if (!name.trim() || !printTimeMin || !filamentG) return;
    setSaving(true);
    const data = {
      name: name.trim(), print_time_min: parseInt(printTimeMin),
      filament_used_g: parseFloat(filamentG),
      filament_cost_per_kg: parseFloat(costPerKg),
      printer_wattage: parseFloat(wattage),
      electricity_rate: parseFloat(elecRate),
      material, color: color.trim() || null,
      status, notes: notes.trim() || null, date,
    };
    if (isEdit) await updatePrint(initial.id, data);
    else await addPrint(data);
    setSaving(false);
    onClose();
  };

  useEffect(() => { saveRef.current = handleSave; });
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "Enter" && !["TEXTAREA","SELECT","BUTTON"].includes(e.target.tagName)) {
        e.preventDefault(); saveRef.current?.();
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div className="modal-title">{isEdit ? "Edit Print" : "Log 3D Print"}</div>
          <button className="close-btn" onClick={onClose}><IClose /></button>
        </div>

        {/* Cost preview bar */}
        <div style={{ background: theme.surface2, border: `1px solid ${theme.border}`,
          padding: "10px 14px", marginBottom: 16, ...mono, fontSize: 11 }}>
          <div style={{ color: theme.muted, fontSize: 9, letterSpacing: "0.12em", marginBottom: 4 }}>
            // COST PREVIEW
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div><span style={{ color: theme.muted }}>electricity · </span>
              <span style={{ color: theme.accentDim }}>${costs.elec.toFixed(3)}</span></div>
            <div><span style={{ color: theme.muted }}>filament · </span>
              <span style={{ color: theme.accentDim }}>${costs.fil.toFixed(3)}</span></div>
            <div><span style={{ color: theme.muted }}>total · </span>
              <span style={{ color: theme.accentHot, fontWeight: 700 }}>${costs.total.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="field">
          <label>Object Name</label>
          <input type="text" placeholder="e.g. Raspberry Pi case" value={name}
            onChange={(e) => setName(e.target.value)} autoFocus={!isEdit} />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Print Time (minutes)</label>
            <input type="number" min="1" placeholder="e.g. 180" value={printTimeMin}
              onChange={(e) => setPrintTimeMin(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Filament Used (g)</label>
            <input type="number" min="0" step="0.1" placeholder="e.g. 45" value={filamentG}
              onChange={(e) => setFilamentG(e.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Filament Cost ($/kg)</label>
            <input type="number" min="0" step="0.01" placeholder="25.00" value={costPerKg}
              onChange={(e) => setCostPerKg(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Printer Wattage (W)</label>
            <input type="number" min="0" step="1" placeholder="200" value={wattage}
              onChange={(e) => setWattage(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Electricity ($/kWh)</label>
            <input type="number" min="0" step="0.01" placeholder="0.20" value={elecRate}
              onChange={(e) => setElecRate(e.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Material</label>
            <select value={material} onChange={(e) => setMaterial(e.target.value)}>
              {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Color <span style={{ opacity: 0.5, fontWeight: 400, fontSize: "0.85em" }}>(optional)</span></label>
            <input type="text" placeholder="e.g. Black" value={color}
              onChange={(e) => setColor(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 2, marginBottom: 0 }}>
            <label>Notes <span style={{ opacity: 0.5, fontWeight: 400, fontSize: "0.85em" }}>(optional)</span></label>
            <input type="text" placeholder="e.g. Needed supports, 0.2mm layer height"
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <button className="modal-save-btn" style={{ marginTop: 20 }}
          onClick={handleSave}
          disabled={saving || !name.trim() || !printTimeMin || !filamentG}>
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Log Print"}
        </button>
      </div>
    </div>
  );
}
