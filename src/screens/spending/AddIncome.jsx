import { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { apiFetch } from "../../utils";
import { IClose } from "../../icons";
import AutocompleteInput from "./AutocompleteInput";
import styles from "./spending.module.css";

export default function AddIncome({ onClose, initial }) {
  const { addIncome, updateIncome, deleteIncome, showToast, profile } = useApp();
  const today = new Date().toISOString().split("T")[0];
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [source, setSource] = useState(initial?.source ?? "");
  const [date, setDate] = useState(initial?.date ?? today);
  const [saving, setSaving] = useState(false);
  const [recurring, setRecurring] = useState(initial?.recurring ? true : false);
  const [recurringPeriod, setRecurringPeriod] = useState(initial?.recurring_period ?? "monthly");
  const [recurringStart, setRecurringStart] = useState(initial?.recurring_start ?? today);
  const [sourceSuggestions, setSourceSuggestions] = useState([]);

  useEffect(() => {
    apiFetch("/api/income/sources").then((r) => {
      if (!r.error) setSourceSuggestions(r);
    });
  }, []);

  const isEdit = !!initial;

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) return showToast("Enter a valid amount");
    if (!desc.trim()) return showToast("Enter a description");
    if (!date) return showToast("Select a date");
    setSaving(true);
    const data = {
      amount: parseFloat(amount),
      description: desc.trim(),
      source: source.trim() || null,
      date,
      ...(recurring
        ? { recurring: true, recurring_period: recurringPeriod, recurring_start: recurringStart }
        : { recurring: false, recurring_period: null, recurring_start: null }),
    };
    if (isEdit) {
      await updateIncome(initial.id, data);
    } else {
      await addIncome(data);
    }
    setSaving(false);
    onClose();
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
    <>
      <div className="modal-header">
        <div className="modal-title">{isEdit ? "Edit Income" : "Add Income"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isEdit && (
            <button
              style={{ padding: "4px 10px", background: "transparent", border: "1px solid #ff6a5a", color: "#ff6a5a", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-mono)" }}
              onClick={async () => { await deleteIncome(initial.id); onClose(); }}
              disabled={saving}
            >
              Delete
            </button>
          )}
          <button className="close-btn" onClick={onClose}>
            <IClose />
          </button>
        </div>
      </div>

      <div className={styles.amountWrap}>
        <div className={styles.amountRow}>
          <span className={`${styles.currencySym} ${styles.incomeSym}`}>
            {profile.currency || "$"}
          </span>
          <input
            className={`${styles.amountBig} ${styles.incomeAmount}`}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
        </div>
        <div className={styles.amountHint}>Enter amount received</div>
      </div>

      <div className="field">
        <label>Description</label>
        <input
          type="text"
          placeholder="e.g. June salary"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div className="field" style={{ flex: 1 }}>
          <label>
            Source{" "}
            <span style={{ opacity: 0.5, fontWeight: 400, fontSize: "0.85em" }}>(optional)</span>
          </label>
          <AutocompleteInput
            value={source}
            onChange={setSource}
            suggestions={sourceSuggestions}
            placeholder="e.g. Employer, Client"
          />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            style={{ width: "auto", margin: 0 }}
          />
          Recurring payment
        </label>
      </div>

      {recurring && (
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Period</label>
            <select value={recurringPeriod} onChange={(e) => setRecurringPeriod(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Start Date</label>
            <input
              type="date"
              value={recurringStart}
              onChange={(e) => setRecurringStart(e.target.value)}
            />
          </div>
        </div>
      )}

      <button
        className={`modal-save-btn ${styles.incomeSaveBtn}`}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving…" : isEdit ? "Save Changes" : "Save Income"}
      </button>
    </>
  );
}
