import { useState, useRef, useEffect } from "react";
import { apiFetch } from "../utils";
import { useTheme, glow as glowFn, STATUS } from "../context/ThemeContext";
import Box from "../components/crt/Box";

const BOOT_LINES = [
  { text: "booting NYOMNYOM kernel...", color: "cream" },
  { text: "mounted /home/ethan", ok: true },
  { text: "loaded sections      [7/7]", ok: true },
  { text: "loaded contexts      [7/7]", ok: true },
  { text: "loaded fonts         [3/3]", ok: true },
  { text: "api · localhost:5000", ok: true },
  { text: "scanlines · enabled", ok: true },
  { text: null, special: "phosphor" },
  { text: "awaiting credentials", warn: true },
];

export default function SignIn({ onLogin, onClose }) {
  const { theme, tweaks } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setError("");
    setLoading(true);
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: username.trim(), password }),
    });
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      onLogin(res.user);
    }
  };

  const mono = { fontFamily: "var(--font-mono)" };
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).toUpperCase().replace(/ /g, "·");
  const timeStr = now.toTimeString().slice(0, 5);

  return (
    <>
      <style>{`
        @keyframes crt-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      {/* Scanlines */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 80,
        background: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.18) 1px, rgba(0,0,0,0.18) 2px)",
      }} />
      {/* Vignette */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 81,
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)",
      }} />

      <div style={{
        width: "100%", height: "100%", background: theme.bg, color: theme.cream,
        display: "flex", flexDirection: "column", position: "relative", overflow: "hidden",
      }}>
        {/* Top status strip */}
        <div style={{
          padding: "8px 16px", borderBottom: `1px solid ${theme.border}`,
          ...mono, fontSize: 11, color: theme.accentDim,
          display: "flex", gap: 14, alignItems: "center",
          position: "relative", zIndex: 2,
        }}>
          <span style={{ color: theme.accent, textShadow: glowFn(theme, tweaks.glow * 0.4) }}>nyomnyom@localhost</span>
          <span style={{ color: theme.muted }}>:</span>
          <span style={{ color: theme.cream }}>/login</span>
          <span style={{ color: theme.muted }}>$</span>
          <span style={{ color: theme.accentHot, textShadow: glowFn(theme, tweaks.glow * 0.6) }}>./auth --interactive</span>
          <span style={{ flex: 1 }} />
          <span>[<span style={{ color: theme.accent }}>●</span> secure]</span>
          <span style={{ color: theme.muted }}>·</span>
          <span>tty1</span>
          <span style={{ color: theme.muted }}>·</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{dateStr} {timeStr}</span>
        </div>

        {/* Main content */}
        <div style={{
          flex: 1, padding: 36,
          display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 40,
          minHeight: 0, position: "relative", zIndex: 2,
          overflow: "auto",
        }}>
          {/* LEFT — ASCII logo + boot */}
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <pre style={{
              ...mono, fontSize: 13, color: theme.accentHot, lineHeight: 1.1, margin: 0,
              letterSpacing: "-0.04em", textShadow: glowFn(theme, tweaks.glow * 1.2),
            }}>{` ███▄    █▓██   ██▓ ▒█████   ███▄ ▄███▓
 ██ ▀█   █ ▒██  ██▒▒██▒  ██▒▓██▒▀█▀ ██▒
▓██  ▀█ ██▒ ▒██ ██░▒██░  ██▒▓██    ▓██░
▓██▒  ▐▌██▒ ░ ▐██▓░▒██   ██░▒██    ▒██
▒██░   ▓██░ ░ ██▒▓░░ ████▓▒░▒██▒   ░██▒
░ ▒░   ▒ ▒   ██▒▒▒ ░ ▒░▒░▒░ ░ ▒░   ░  ░
░ ░░   ░ ▒░▓██ ░▒░   ░ ▒ ▒░ ░  ░      ░
   ░   ░ ░ ▒ ▒ ░░  ░ ░ ░ ▒  ░      ░   `}</pre>
            <div style={{ ...mono, fontSize: 11, color: theme.accentDim, marginTop: 8, letterSpacing: "0.18em" }}>
              // PERSONAL · OPERATING · SYSTEM · v2.4.1
            </div>

            <div style={{ marginTop: 24, ...mono, fontSize: 12, color: theme.cream, lineHeight: 1.9 }}>
              <div style={{ color: theme.muted }}>{"─".repeat(46)}</div>
              {BOOT_LINES.map((line, i) => {
                if (line.ok) return (
                  <div key={i}>
                    <span style={{ color: theme.accent, textShadow: glowFn(theme, tweaks.glow * 0.4) }}>[OK]</span>
                    {"   "}{line.text}
                  </div>
                );
                if (line.warn) return (
                  <div key={i}>
                    <span style={{ color: STATUS.amber }}>[?]</span>
                    {"    "}{line.text}
                  </div>
                );
                if (line.special === "phosphor") return (
                  <div key={i}>
                    <span style={{ color: theme.accent, textShadow: glowFn(theme, tweaks.glow * 0.4) }}>[OK]</span>
                    {"   phosphor · "}{theme.name?.toLowerCase() || "green"}
                  </div>
                );
                return <div key={i} style={{ color: line.color === "cream" ? theme.cream : theme.accentDim }}>{line.text}</div>;
              })}
              <div style={{ color: theme.muted }}>{"─".repeat(46)}</div>
            </div>

            <div style={{ marginTop: "auto", ...mono, fontSize: 10, color: theme.muted, lineHeight: 1.7 }}>
              <div>session encrypted · TLS 1.3 · localhost only</div>
            </div>
          </div>

          {/* RIGHT — auth form */}
          <Box title="AUTH.PROMPT" glowing style={{ display: "flex", flexDirection: "column", justifyContent: "center" }} padding="40px 44px">
            <div style={{
              ...mono, fontSize: 36, color: theme.accentHot, lineHeight: 1,
              marginBottom: 6, textShadow: glowFn(theme, tweaks.glow * 1.4),
            }}>
              &gt; login_
            </div>
            <div style={{ ...mono, fontSize: 12, color: theme.accentDim, marginBottom: 28 }}>
              identify yourself, agent.
            </div>

            {error && (
              <div style={{
                padding: "8px 12px", marginBottom: 16,
                border: `1px solid ${STATUS.red}`,
                ...mono, fontSize: 11, color: STATUS.red,
                background: `${STATUS.red}0a`,
              }}>
                ✗ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <div style={{ marginBottom: 18 }}>
                <div style={{ ...mono, fontSize: 10, color: theme.muted, letterSpacing: "0.2em", marginBottom: 6 }}>
                  USERNAME
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", background: theme.surface2,
                  border: `1px solid ${theme.accent}`,
                  boxShadow: `inset 0 0 14px ${theme.accent}1a`,
                }}>
                  <span style={{ color: theme.accent, ...mono, fontSize: 14 }}>&gt;</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    style={{
                      ...mono, fontSize: 16, color: theme.accentHot,
                      background: "none", border: "none", outline: "none", flex: 1,
                      textShadow: glowFn(theme, tweaks.glow * 0.6),
                      caretColor: theme.accent,
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 26 }}>
                <div style={{ ...mono, fontSize: 10, color: theme.muted, letterSpacing: "0.2em", marginBottom: 6 }}>
                  PASSWORD
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", background: theme.surface,
                  border: `1px solid ${theme.borderHi}`,
                }}>
                  <span style={{ color: theme.accentDim, ...mono, fontSize: 14 }}>&gt;</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    style={{
                      ...mono, fontSize: 16, color: theme.accentDim,
                      letterSpacing: "0.3em", background: "none", border: "none", outline: "none", flex: 1,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="submit"
                  disabled={loading || !username.trim() || !password}
                  style={{
                    ...mono, fontSize: 12, padding: "14px 28px",
                    background: theme.accent, color: theme.bg,
                    border: "none", fontWeight: 700, letterSpacing: "0.18em",
                    display: "flex", alignItems: "center", gap: 12,
                    cursor: loading || !username.trim() || !password ? "not-allowed" : "pointer",
                    opacity: loading || !username.trim() || !password ? 0.5 : 1,
                  }}
                >
                  {loading ? "authenticating…" : "⏎ BOOT SYSTEM"}
                </button>
              </div>
            </form>

            <div style={{ marginTop: 30, ...mono, fontSize: 10, color: theme.muted, lineHeight: 1.8 }}>
              <div>↹ TAB autocomplete · ↵ submit · ESC cancel</div>
              {onClose && (
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={onClose}
                    style={{
                      ...mono, fontSize: 11, color: theme.accentHot,
                      background: "none", border: "none", cursor: "pointer",
                      textShadow: glowFn(theme, tweaks.glow * 0.4), padding: 0,
                    }}
                  >
                    ▸ view public site →
                  </button>
                </div>
              )}
            </div>
          </Box>
        </div>

        {/* Bottom F-key strip */}
        <div style={{
          padding: "6px 16px", borderTop: `1px solid ${theme.border}`,
          display: "flex", gap: 24, ...mono, fontSize: 10, color: theme.accentDim,
          position: "relative", zIndex: 2,
        }}>
          <span><span style={{ color: theme.accent }}>F1</span> help</span>
          <span><span style={{ color: theme.accent }}>F2</span> recover</span>
          <span><span style={{ color: theme.accent }}>F10</span> exit</span>
          <span style={{ flex: 1 }} />
          <span>auth.prompt · interactive · safe mode</span>
        </div>
      </div>
    </>
  );
}
