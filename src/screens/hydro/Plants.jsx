import { useState, useEffect } from "react";
import { useHydro } from "../../context/HydroContext";
import { fmtDate } from "../../utils";
import { IClose, IEdit } from "../../icons";

const STAGES = ["seedling", "vegetative", "fruiting", "harvest", "done"];
const STAGE_COLORS = {
  seedling: "#4ab87a",
  vegetative: "#2eb8a0",
  fruiting: "#d4a040",
  harvest: "#e07b3a",
  done: "var(--fg-dim)",
};

function PlantModal({ initial, onSave, onClose }) {
  const today = new Date().toISOString().split("T")[0];
  const [name, setName] = useState(initial?.name ?? "");
  const [variety, setVariety] = useState(initial?.variety ?? "");
  const [planted, setPlanted] = useState(initial?.date_planted ?? today);
  const [stage, setStage] = useState(initial?.stage ?? "seedling");
  const [harvest, setHarvest] = useState(initial?.expected_harvest ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [active, setActive] = useState(initial?.active !== 0);

  const canSave = name.trim().length > 0;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{initial ? "Edit Plant" : "Add Plant"}</div>
          <button className="close-btn" onClick={onClose}>
            <IClose />
          </button>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 2 }}>
            <label>Name</label>
            <input
              type="text"
              placeholder="e.g. Basil"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Variety (optional)</label>
            <input
              type="text"
              placeholder="e.g. Genovese"
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Date Planted</label>
            <input type="date" value={planted} onChange={(e) => setPlanted(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Expected Harvest</label>
            <input type="date" value={harvest} onChange={(e) => setHarvest(e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Stage</label>
            <select value={stage} onChange={(e) => setStage(e.target.value)}>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {initial && (
            <div className="field" style={{ flex: 1 }}>
              <label>Status</label>
              <select
                value={active ? "1" : "0"}
                onChange={(e) => setActive(e.target.value === "1")}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          )}
        </div>
        <div className="field">
          <label>Notes (optional)</label>
          <input
            type="text"
            placeholder="Any notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <button
          className="modal-save-btn"
          onClick={() =>
            onSave({
              name,
              variety: variety || null,
              date_planted: planted || null,
              stage,
              expected_harvest: harvest || null,
              notes: notes || null,
              active,
            })
          }
          disabled={!canSave}
        >
          {initial ? "Save Changes" : "Add Plant"}
        </button>
      </div>
    </div>
  );
}

export default function Plants() {
  const { plants, loadAll, addPlant, updatePlant, deletePlant } = useHydro();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const handler = () => setShowModal(true);
    window.addEventListener("shortcut:new", handler);
    return () => window.removeEventListener("shortcut:new", handler);
  }, []);

  const active = plants.filter((p) => p.active);
  const inactive = plants.filter((p) => !p.active);

  const PlantList = ({ list }) =>
    list.map((p) => (
      <div className="tx-item" key={p.id}>
        <div className="tx-info">
          <div className="tx-name">
            {p.name}
            {p.variety && (
              <span style={{ color: "var(--fg-dim)", fontWeight: 400 }}> · {p.variety}</span>
            )}
            <span
              style={{
                marginLeft: 8,
                fontSize: 11,
                fontWeight: 700,
                color: STAGE_COLORS[p.stage] || "var(--fg-dim)",
              }}
            >
              {p.stage.toUpperCase()}
            </span>
          </div>
          <div className="tx-cat">
            {p.date_planted && `Planted ${fmtDate(p.date_planted)}`}
            {p.expected_harvest && ` · Harvest ~${fmtDate(p.expected_harvest)}`}
            {p.notes && ` · ${p.notes}`}
          </div>
        </div>
        <button className="tx-delete" onClick={() => setEditing(p)}>
          <IEdit />
        </button>
        <button className="tx-delete" onClick={() => deletePlant(p.id)}>
          <IClose />
        </button>
      </div>
    ));

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <h1>Plants</h1>
          <p>
            {active.length} active · {plants.length} total
          </p>
        </div>
        <button
          className="sidebar-add-btn"
          style={{ width: "auto", padding: "10px 20px", marginTop: 4 }}
          onClick={() => setShowModal(true)}
        >
          + Add Plant
        </button>
      </div>

      {plants.length === 0 ? (
        <div className="empty-state">
          No plants yet.
          <br />
          Click <strong>+ Add Plant</strong> to get started.
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <div className="graph-card-title" style={{ marginBottom: 10 }}>
                ACTIVE
              </div>
              <div className="tx-list" style={{ marginBottom: 24 }}>
                <PlantList list={active} />
              </div>
            </>
          )}
          {inactive.length > 0 && (
            <>
              <div
                className="graph-card-title"
                style={{ marginBottom: 10, color: "var(--fg-dim)" }}
              >
                ARCHIVED
              </div>
              <div className="tx-list">
                <PlantList list={inactive} />
              </div>
            </>
          )}
        </>
      )}

      {showModal && (
        <PlantModal
          onSave={async (d) => {
            await addPlant(d);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
      {editing && (
        <PlantModal
          initial={editing}
          onSave={async (d) => {
            await updatePlant(editing.id, d);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
