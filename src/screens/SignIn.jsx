import { useState, useEffect } from "react";
import { apiFetch } from "../utils";
import { useTheme, glow as glowFn } from "../context/ThemeContext";

const BOOT_LINES = [
  "NYOMNYOM v2.4 · personal OS",
  "loading kernel modules…",
  "mounting filesystems…",
  "  /dev/spending  [OK]",
  "  /dev/jobs      [OK]",
  "  /dev/fitness   [OK]",
  "  /dev/portfolio [OK]",
  "  /dev/climbing  [OK]",
  "  /dev/projects  [OK]",
  "  /dev/hydro     [OK]",
  "starting services…",
  "auth daemon: ready",
  "",
  "login:",
];

function BootSequence() {
  const { theme, tweaks } = useTheme();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= BOOT_LINES.length) return;
    const delay = shown < 3 ? 160 : shown < 11 ? 80 : 200;
    const id = setTimeout(() => setShown((n) => n + 1), delay);
    return () => clearTimeout(id);
  }, [shown]);

  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        lineHeight: 1.7,
        color: theme.accentDim,
      }}
    >
      {BOOT_LINES.slice(0, shown).map((line, i) => {
        const isOk = line.includes("[OK]");
        const isMount = line.startsWith("  /dev/");
        return (
          <div key={i} style={{ whiteSpace: "pre" }}>
            {isMount ? (
              <>
                <span style={{ color: theme.muted }}>{line.replace("[OK]", "")}</span>
                {isOk && <span style={{ color: theme.accent }}>[OK]</span>}
              </>
            ) : line === "login:" ? (
              <span style={{ color: theme.accentHot, textShadow: glowFn(theme, tweaks.glow * 0.6) }}>
                {line}
              </span>
            ) : (
              <span>{line}</span>
            )}
          </div>
        );
      })}
      {shown < BOOT_LINES.length && (
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 14,
            background: theme.accent,
            verticalAlign: "text-bottom",
            animation: "crt-blink 0.8s step-end infinite",
          }}
        />
      )}
    </div>
  );
}

export default function SignIn({ onLogin, onClose }) {
  const { theme, tweaks } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    background: theme.surface2,
    border: `1px solid ${theme.borderHi}`,
    color: theme.cream,
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    outline: "none",
    letterSpacing: "0.04em",
  };

  return (
    <>
      <style>{`
        @keyframes crt-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      {/* Scanlines */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 9,
          background: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.18) 1px, rgba(0,0,0,0.18) 2px)",
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 10,
          background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: theme.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            width: "min(880px, 95vw)",
            border: `1px solid ${theme.borderHi}`,
            background: theme.surface,
          }}
        >
          {/* Left — ASCII logo + boot sequence */}
          <div
            style={{
              padding: "36px 32px",
              borderRight: `1px solid ${theme.border}`,
              background: theme.bg,
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            {/* ASCII logo */}
            <div>
              <pre
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: theme.accent,
                  lineHeight: 1.2,
                  textShadow: glowFn(theme, tweaks.glow * 0.6),
                  margin: 0,
                }}
              >{`
 ███╗  ██╗██╗   ██╗ ██████╗ ███╗  ██╗
 ████╗ ██║╚██╗ ██╔╝██╔═══██╗████╗ ██║
 ██╔██╗██║ ╚████╔╝ ██║   ██║██╔██╗██║
 ██║╚████║  ╚██╔╝  ██║   ██║██║╚████║
 ██║ ╚███║   ██║   ╚██████╔╝██║ ╚███║
 ╚═╝  ╚══╝   ╚═╝    ╚═════╝ ╚═╝  ╚══╝`}</pre>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: theme.muted,
                  letterSpacing: "0.18em",
                  marginTop: 8,
                }}
              >
                personal life-OS · v2.4
              </div>
            </div>

            <BootSequence />
          </div>

          {/* Right — auth form */}
          <div style={{ padding: "36px 32px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: theme.muted,
                  letterSpacing: "0.18em",
                }}
              >
                AUTH.PROMPT
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  style={{
                    background: "none",
                    border: "none",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: theme.muted,
                    cursor: "pointer",
                    letterSpacing: "0.1em",
                  }}
                >
                  ← back
                </button>
              )}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 22,
                color: theme.accentHot,
                textShadow: glowFn(theme, tweaks.glow * 0.8),
                marginBottom: 24,
              }}
            >
              &gt; sign in
            </div>

            {error && (
              <div
                style={{
                  padding: "8px 12px",
                  border: `1px solid ${theme.borderHi}`,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "#ff6a5a",
                  marginBottom: 16,
                  background: "rgba(255,106,90,0.06)",
                }}
              >
                ✗ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: theme.accentDim,
                    letterSpacing: "0.14em",
                    marginBottom: 6,
                  }}
                >
                  USERNAME
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  autoComplete="username"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: theme.accentDim,
                    letterSpacing: "0.14em",
                    marginBottom: 6,
                  }}
                >
                  PASSWORD
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !username.trim() || !password}
                style={{
                  marginTop: 8,
                  padding: "10px 14px",
                  background: theme.accent,
                  color: theme.bg,
                  border: "none",
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  cursor: loading || !username.trim() || !password ? "not-allowed" : "pointer",
                  opacity: loading || !username.trim() || !password ? 0.5 : 1,
                  textShadow: "none",
                }}
              >
                {loading ? "authenticating…" : "[ENTER] SIGN IN"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
