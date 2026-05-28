import { useState, useEffect, useRef, useMemo } from "react";
import Fuse from "fuse.js";
import { useApp } from "../../context/AppContext";
import { fmt } from "../../utils";
import { Px, IClose, IEdit, CATEGORY_ICONS } from "../../icons";

const _fuse = new Fuse(CATEGORY_ICONS, { threshold: 0.4, distance: 80 });

function scoreIcon(ic, query) {
  const tokens = ic.split("-");
  let score = 0;
  for (const token of tokens) {
    if (token === query) score += 10;
    else if (token.startsWith(query)) score += 5;
    else if (token.includes(query)) score += 2;
  }
  if (ic === query) score += 20;
  else if (ic.startsWith(query)) score += 8;
  else if (ic.includes(query)) score += 3;
  return score;
}

function searchIcons(query) {
  if (!query.trim()) return CATEGORY_ICONS;
  const q = query.trim().toLowerCase();
  const scored = CATEGORY_ICONS.map((ic) => ({ ic, score: scoreIcon(ic, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.ic);
  if (scored.length > 0) return scored;
  return _fuse.search(q).map((r) => r.item);
}

function CategoryModal({ initial, onSave, onClose }) {
  const [icon, setIcon] = useState(initial?.icon || CATEGORY_ICONS[0]);
  const [name, setName] = useState(initial?.name || "");
  const [budget, setBudget] = useState(initial?.budget != null ? initial.budget : "");
  const [iconSearch, setIconSearch] = useState("");

  const filteredIcons = useMemo(() => searchIcons(iconSearch), [iconSearch]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ icon, name: name.trim(), budget: budget !== "" ? parseFloat(budget) : null });
  };

  const saveRef = useRef(null);
  saveRef.current = handleSave;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Enter" && !["TEXTAREA", "SELECT", "BUTTON"].includes(e.target.tagName)) {
        e.preventDefault();
        saveRef.current?.();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{initial ? "Edit Category" : "Add Category"}</div>
          <button className="close-btn" onClick={onClose}>
            <IClose />
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <Px name={icon} size={48} />
        </div>

        <div className="field">
          <label>Icon</label>
          <input
            type="text"
            placeholder="Search icons…"
            value={iconSearch}
            onChange={(e) => setIconSearch(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <div className="icon-picker">
            {filteredIcons.length === 0 ? (
              <div style={{ fontSize: 11, color: "var(--muted)", padding: "6px 2px" }}>
                No icons match
              </div>
            ) : (
              filteredIcons.map((ic) => (
                <button
                  key={ic}
                  className={"icon-opt " + (icon === ic ? "selected" : "")}
                  onClick={() => setIcon(ic)}
                  title={ic}
                >
                  <Px name={ic} size={18} />
                </button>
              ))
            )}
          </div>
        </div>

        <div className="field">
          <label>Name</label>
          <input
            type="text"
            placeholder="e.g. Food & Drink"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus={!initial}
          />
        </div>

        <div className="field">
          <label>Monthly Budget (optional)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Leave blank for no limit"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>

        <button className="modal-save-btn" onClick={handleSave} disabled={!name.trim()}>
          {initial ? "Save Changes" : "Add Category"}
        </button>
      </div>
    </div>
  );
}

export default function Categories() {
  const { categories, profile, addCategory, updateCategory, deleteCategory } = useApp();
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const handler = () => setModal({ mode: "add" });
    window.addEventListener("shortcut:new", handler);
    return () => window.removeEventListener("shortcut:new", handler);
  }, []);
  const currency = profile.currency || "$";

  const handleSave = async (data) => {
    if (modal.mode === "add") {
      await addCategory(data);
    } else {
      await updateCategory(modal.cat.id, data);
    }
    setModal(null);
  };

  return (
    <div className="screen">
      <div
        className="page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h1>Categories</h1>
          <p>Manage your spending categories</p>
        </div>
        <button
          className="sidebar-add-btn"
          style={{ width: "auto", padding: "10px 20px", marginTop: 4 }}
          onClick={() => setModal({ mode: "add" })}
        >
          + Add Category
        </button>
      </div>

      <div className="cat-card-grid">
        {categories.map((c) => (
          <div className="cat-card" key={c.id}>
            <div className="cat-item-icon">
              <Px name={c.icon} size={22} />
            </div>
            <div className="cat-item-info">
              <div className="cat-item-name">{c.name}</div>
              <div className="cat-item-budget">
                {c.budget != null ? "Budget: " + fmt(c.budget, currency) : "No budget set"}
              </div>
            </div>
            <button
              className="cat-item-edit"
              title="Edit"
              onClick={() => setModal({ mode: "edit", cat: c })}
            >
              <IEdit />
            </button>
            <button className="cat-item-delete" title="Delete" onClick={() => deleteCategory(c.id)}>
              <IClose />
            </button>
          </div>
        ))}
      </div>

      {modal && (
        <CategoryModal
          initial={modal.mode === "edit" ? modal.cat : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
