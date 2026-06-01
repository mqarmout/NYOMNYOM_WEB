import { useState, useEffect, useRef, useMemo } from "react";
import Fuse from "fuse.js";
import { useApp } from "../../context/AppContext";
import { useTheme, STATUS } from "../../context/ThemeContext";
import { fmt } from "../../utils";
import { Px, IClose, CATEGORY_ICONS } from "../../icons";
import Box from "../../components/crt/Box";
import SpendingHero from "./SpendingHero";
import styles from "./spending.module.css";

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
  return scored.length > 0 ? scored : _fuse.search(q).map((r) => r.item);
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
  useEffect(() => {
    saveRef.current = handleSave;
  });

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
          <div className={styles.iconPicker}>
            {filteredIcons.length === 0 ? (
              <div style={{ fontSize: 11, color: "var(--muted)", padding: "6px 2px" }}>
                No icons match
              </div>
            ) : (
              filteredIcons.map((ic) => (
                <button
                  key={ic}
                  className={`${styles.iconOpt}${icon === ic ? " selected" : ""}`}
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
  const { categories, expenses, profile, addCategory, updateCategory } = useApp();
  const { theme } = useTheme();
  const [modal, setModal] = useState(null);
  const mono = { fontFamily: "var(--font-mono)" };

  useEffect(() => {
    const handler = () => setModal({ mode: "add" });
    window.addEventListener("shortcut:new", handler);
    return () => window.removeEventListener("shortcut:new", handler);
  }, []);

  const currency = profile.currency || "$";
  const mo = new Date().toISOString().slice(0, 7);

  const catsWithSpent = useMemo(() => {
    return categories.map((c) => {
      const spent = expenses
        .filter((e) => e.category_id === c.id && e.date?.startsWith(mo))
        .reduce((s, e) => s + e.amount, 0);
      return { ...c, spent };
    });
  }, [categories, expenses, mo]);

  const totalSpent = catsWithSpent.reduce((s, c) => s + c.spent, 0);
  const totalBudget = catsWithSpent.reduce((s, c) => s + (c.budget || 0), 0);
  const totalPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const handleSave = async (data) => {
    if (modal.mode === "add") await addCategory(data);
    else await updateCategory(modal.cat.id, data);
    setModal(null);
  };

  return (
    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, ...mono }}>
      <SpendingHero data={null} expenses={expenses} categories={categories} profile={profile} />

      <Box title={`ALL.CATEGORIES · ${categories.length}`} padding="16px 22px">
        {/* Header row */}
        <div
          style={{
            ...mono,
            fontSize: 10,
            color: theme.muted,
            letterSpacing: "0.08em",
            display: "grid",
            gridTemplateColumns: "24px 1fr 1fr 80px 50px 60px",
            gap: 10,
            paddingBottom: 6,
            borderBottom: `1px dashed ${theme.border}`,
            marginBottom: 8,
            alignItems: "center",
          }}
        >
          <span></span>
          <span>category</span>
          <span>utilization</span>
          <span>spent / budget</span>
          <span style={{ textAlign: "right" }}>%</span>
          <span style={{ textAlign: "right" }}>edit</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {catsWithSpent.length === 0 ? (
            <div style={{ ...mono, fontSize: 12, color: theme.muted, padding: "12px 0" }}>
              no categories yet
            </div>
          ) : (
            catsWithSpent.map((c) => {
              const over = c.budget > 0 && c.spent > c.budget;
              const pct = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : null;
              const blocks = c.budget > 0 ? Math.min(24, Math.round((c.spent / c.budget) * 24)) : 0;
              return (
                <div
                  key={c.id}
                  style={{
                    ...mono,
                    fontSize: 11,
                    color: theme.cream,
                    display: "grid",
                    gridTemplateColumns: "24px 1fr 1fr 80px 50px 60px",
                    gap: 10,
                    padding: "4px 0",
                    borderBottom: `1px solid ${theme.border}`,
                    alignItems: "center",
                  }}
                >
                  <span>
                    <Px name={c.icon} size={14} />
                  </span>
                  <span
                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {c.name}
                  </span>
                  <span style={{ color: over ? STATUS.red : theme.accent }}>
                    {"█".repeat(blocks)}
                    <span style={{ color: theme.faint }}>
                      {"░".repeat(Math.max(0, 24 - blocks))}
                    </span>
                  </span>
                  <span style={{ color: theme.muted, whiteSpace: "nowrap" }}>
                    {fmt(c.spent, currency)}
                    {c.budget > 0 ? ` / ${fmt(c.budget, currency)}` : ""}
                  </span>
                  <span style={{ color: over ? STATUS.red : theme.cream, textAlign: "right" }}>
                    {pct !== null ? `${pct}%` : "—"}
                  </span>
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setModal({ mode: "edit", cat: c })}
                      style={{
                        ...mono,
                        fontSize: 10,
                        color: theme.accent,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      set →
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer totals */}
        <div
          style={{
            marginTop: 14,
            paddingTop: 10,
            borderTop: `1px dashed ${theme.border}`,
            display: "grid",
            gridTemplateColumns: "24px 1fr 1fr 80px 50px 60px",
            gap: 10,
            alignItems: "center",
            ...mono,
            fontSize: 12,
            color: theme.accentHot,
          }}
        >
          <span></span>
          <span>TOTAL</span>
          <span></span>
          <span style={{ color: theme.muted }}>
            {fmt(totalSpent, currency)} / {fmt(totalBudget, currency)}
          </span>
          <span style={{ textAlign: "right" }}>{totalPct}%</span>
          <span></span>
        </div>

        <button
          onClick={() => setModal({ mode: "add" })}
          style={{
            marginTop: 14,
            ...mono,
            fontSize: 11,
            padding: "8px 16px",
            background: "transparent",
            color: theme.accent,
            border: `1px solid ${theme.accent}`,
            cursor: "pointer",
            letterSpacing: "0.1em",
          }}
        >
          [+] NEW CATEGORY
        </button>
      </Box>

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
