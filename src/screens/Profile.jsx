import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useTheme, PALETTES } from "../context/ThemeContext";
import { fmt, fmtDate, getInitials } from "../utils";
import Box from "../components/crt/Box";

const FONT_OPTIONS = [
  { key: "jetbrains", label: "JetBrains Mono" },
  { key: "plex", label: "IBM Plex Mono" },
  { key: "fira", label: "Fira Code" },
];

export default function Profile() {
  const { profile, categories, expenses, saveProfile } = useApp();
  const { theme, tweaks, setTweak } = useTheme();
  const [name, setName] = useState(profile.name || "");
  const [curr, setCurr] = useState(profile.currency || "$");
  const [monthlyBudget, setMonthlyBudget] = useState(profile.monthly_budget || "");
  const [rolloverPct, setRolloverPct] = useState(profile.rollover_pct || "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(profile.name || "");
    setCurr(profile.currency || "$");
    setMonthlyBudget(profile.monthly_budget || "");
    setRolloverPct(profile.rollover_pct || "");
  }, [profile]);

  const monthTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const currency = profile.currency || "$";

  const handleSave = () => {
    saveProfile({
      name: name.trim(),
      currency: curr,
      monthly_budget: parseFloat(monthlyBudget) || 0,
      rollover_pct: Math.min(100, Math.max(0, parseFloat(rolloverPct) || 0)),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const inputStyle = {
    width: "100%",
    background: theme.surface2,
    border: `1px solid ${theme.borderHi}`,
    borderRadius: 0,
    color: theme.accentHot,
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    padding: "8px 10px",
    outline: "none",
    caretColor: theme.accent,
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: theme.muted,
    letterSpacing: "0.1em",
    marginBottom: 5,
    display: "block",
  };

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  };

  const statStyle = {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    padding: "10px 14px",
    flex: 1,
  };

  return (
    <div className="screen">
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: theme.muted,
          letterSpacing: "0.1em",
          marginBottom: 4,
        }}
      >
        // PROFILE · {profile.name?.toUpperCase() || "AGENT"}
      </div>
      <h1 style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: theme.accentHot, margin: "0 0 4px" }}>
        {profile.name || "Your Profile"}
      </h1>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: theme.muted, marginBottom: 24 }}>
        {profile.since ? `tracking since ${fmtDate(profile.since)}` : "no expenses logged yet"}
      </p>

      {/* Stats strip */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { label: "THIS MONTH", value: fmt(monthTotal, currency) },
          { label: "ALL TIME", value: fmt(profile.total_all_time || 0, currency) },
          { label: "TRANSACTIONS", value: String(profile.tx_count || 0) },
          { label: "CATEGORIES", value: String(categories.length) },
        ].map(({ label, value }) => (
          <div key={label} style={statStyle}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: theme.muted, letterSpacing: "0.12em", marginBottom: 6 }}>
              {label}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: theme.accentHot }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        {/* Account settings */}
        <Box title="ACCOUNT.SETTINGS">
          <div style={{ paddingTop: 8 }}>
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>DISPLAY NAME</label>
                <div style={{ display: "flex", alignItems: "center", background: theme.surface2, border: `1px solid ${theme.borderHi}` }}>
                  <span style={{ color: theme.accent, fontFamily: "var(--font-mono)", fontSize: 13, padding: "8px 8px 8px 10px" }}>{">"}</span>
                  <input
                    type="text"
                    placeholder="your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ ...inputStyle, background: "transparent", border: "none", paddingLeft: 4, flex: 1 }}
                  />
                </div>
              </div>
            </div>

            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>CURRENCY</label>
                <select
                  value={curr}
                  onChange={(e) => setCurr(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="$">$ Dollar</option>
                  <option value="€">€ Euro</option>
                  <option value="£">£ Pound</option>
                  <option value="¥">¥ Yen</option>
                  <option value="₹">₹ Rupee</option>
                  <option value="ر.س">ر.س Riyal</option>
                </select>
              </div>
            </div>

            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>MONTHLY BUDGET</label>
                <div style={{ display: "flex", alignItems: "center", background: theme.surface2, border: `1px solid ${theme.borderHi}` }}>
                  <span style={{ color: theme.accentDim, fontFamily: "var(--font-mono)", fontSize: 13, padding: "8px 8px 8px 10px" }}>{">"}</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0 = disabled"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    style={{ ...inputStyle, background: "transparent", border: "none", paddingLeft: 4, flex: 1 }}
                  />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>ROLLOVER %</label>
                <div style={{ display: "flex", alignItems: "center", background: theme.surface2, border: `1px solid ${theme.borderHi}` }}>
                  <span style={{ color: theme.accentDim, fontFamily: "var(--font-mono)", fontSize: 13, padding: "8px 8px 8px 10px" }}>{">"}</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="% of leftover"
                    value={rolloverPct}
                    onChange={(e) => setRolloverPct(e.target.value)}
                    style={{ ...inputStyle, background: "transparent", border: "none", paddingLeft: 4, flex: 1 }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              style={{
                width: "100%",
                padding: "10px",
                background: saved ? theme.accentDim : theme.accent,
                border: "none",
                borderRadius: 0,
                color: theme.bg,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.1em",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              {saved ? "✓ SAVED" : "⏎ SAVE PROFILE"}
            </button>
          </div>
        </Box>

        {/* Appearance / tweaks */}
        <Box title="APPEARANCE.TWEAKS" glowing>
          <div style={{ paddingTop: 8 }}>
            {/* Palette */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>PALETTE</label>
              <div style={{ display: "flex", gap: 6 }}>
                {Object.values(PALETTES).map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setTweak("palette", p.key)}
                    style={{
                      flex: 1,
                      padding: "8px 4px",
                      background: tweaks.palette === p.key ? p.accent : theme.surface2,
                      border: `1px solid ${tweaks.palette === p.key ? p.accent : theme.border}`,
                      borderRadius: 0,
                      color: tweaks.palette === p.key ? theme.bg : theme.muted,
                      fontFamily: "var(--font-mono)",
                      fontSize: 9,
                      letterSpacing: "0.08em",
                      cursor: "pointer",
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Font */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>FONT</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {FONT_OPTIONS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setTweak("font", f.key)}
                    style={{
                      padding: "7px 10px",
                      background: tweaks.font === f.key ? theme.accentFaint : theme.surface2,
                      border: `1px solid ${tweaks.font === f.key ? theme.accent : theme.border}`,
                      borderRadius: 0,
                      color: tweaks.font === f.key ? theme.accent : theme.muted,
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {tweaks.font === f.key ? "● " : "○ "}{f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Glow */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ ...labelStyle, display: "flex", justifyContent: "space-between" }}>
                <span>GLOW</span>
                <span style={{ color: theme.accentHot }}>{tweaks.glow.toFixed(1)}×</span>
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={tweaks.glow}
                onChange={(e) => setTweak("glow", parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: theme.accent }}
              />
            </div>

            {/* Scanlines */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ ...labelStyle, display: "flex", justifyContent: "space-between" }}>
                <span>SCANLINES</span>
                <span style={{ color: theme.accentHot }}>{Math.round(tweaks.scanlines * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.01"
                value={tweaks.scanlines}
                onChange={(e) => setTweak("scanlines", parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: theme.accent }}
              />
            </div>

            {/* Vignette */}
            <div style={{ marginBottom: 4 }}>
              <label style={{ ...labelStyle, display: "flex", justifyContent: "space-between" }}>
                <span>VIGNETTE</span>
                <span style={{ color: theme.accentHot }}>{Math.round(tweaks.vignette * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={tweaks.vignette}
                onChange={(e) => setTweak("vignette", parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: theme.accent }}
              />
            </div>
          </div>
        </Box>
      </div>
    </div>
  );
}
