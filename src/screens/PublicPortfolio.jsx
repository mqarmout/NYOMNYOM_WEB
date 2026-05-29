import { useState, useEffect } from "react";
import { apiFetch, getInitials } from "../utils";
import SignIn from "./SignIn";
import Box from "../components/crt/Box";
import { useTheme, glow as glowFn } from "../context/ThemeContext";
import { IExtLink } from "../icons";
import { useBreakpoint } from "../hooks/useBreakpoint";

function formatDateRange(start, end) {
  if (!start) return "";
  const fmt = (d) => {
    const [y, m] = d.split("-");
    return new Date(y, parseInt(m) - 1).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };
  return fmt(start) + (end ? " – " + fmt(end) : " – Present");
}

function Scanlines({ strength }) {
  if (!strength) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 80,
        background: `repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,${strength}) 1px, rgba(0,0,0,${strength}) 2px)`,
      }}
    />
  );
}

function Vignette({ strength }) {
  if (!strength) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 81,
        background: `radial-gradient(ellipse at center, transparent ${50 - strength * 15}%, rgba(0,0,0,${strength}) 100%)`,
      }}
    />
  );
}

function StatusLine({ onSignIn }) {
  const { theme, tweaks } = useTheme();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toTimeString().slice(0, 8);
  const dateStr = now
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase()
    .replace(/ /g, "·");

  return (
    <div
      style={{
        position: "relative",
        zIndex: 2,
        padding: "0 16px",
        height: 28,
        display: "flex",
        alignItems: "center",
        gap: 14,
        borderBottom: `1px solid ${theme.border}`,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: theme.accentDim,
        background: theme.bg,
        flexShrink: 0,
      }}
    >
      <span style={{ color: theme.accent, textShadow: glowFn(theme, tweaks.glow * 0.4) }}>
        guest@nyomnyom
      </span>
      <span style={{ color: theme.muted }}>:</span>
      <span style={{ color: theme.cream }}>~/portfolio</span>
      <span style={{ color: theme.muted }}>$</span>
      <span style={{ color: theme.accentHot, textShadow: glowFn(theme, tweaks.glow * 0.6) }}>
        cat README.md
      </span>
      <span style={{ flex: 1 }} />
      <button
        onClick={onSignIn}
        style={{
          background: "none",
          border: `1px solid ${theme.borderHi}`,
          color: theme.accentDim,
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          cursor: "pointer",
          padding: "2px 10px",
          letterSpacing: "0.08em",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = theme.accentHot;
          e.currentTarget.style.borderColor = theme.accent;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = theme.accentDim;
          e.currentTarget.style.borderColor = theme.borderHi;
        }}
      >
        [F1] SIGN IN
      </button>
      <span style={{ color: theme.muted }}>·</span>
      <span>
        [<span style={{ color: theme.accent }}>●</span> PUBLIC]
      </span>
      <span style={{ color: theme.muted }}>·</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>
        {dateStr} {time}
      </span>
    </div>
  );
}

function FKeyBar({ about }) {
  const { theme } = useTheme();
  const keys = [
    ["F2", "projects"],
    ["F3", "skills"],
    ["F4", "experience"],
  ];
  return (
    <div
      style={{
        position: "relative",
        zIndex: 2,
        padding: "0 16px",
        height: 28,
        borderTop: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        gap: 24,
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        color: theme.accentDim,
        background: theme.bg,
        flexShrink: 0,
      }}
    >
      {keys.map(([k, l]) => (
        <span key={k}>
          <span style={{ color: theme.accent }}>{k}</span> {l}
        </span>
      ))}
      <span style={{ flex: 1 }} />
      {about?.github && (
        <a
          href={"https://github.com/" + about.github}
          target="_blank"
          rel="noreferrer"
          style={{
            color: theme.muted,
            textDecoration: "none",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
          }}
        >
          github/{about.github}
        </a>
      )}
    </div>
  );
}

export default function PublicPortfolio({ onLogin }) {
  const { theme, tweaks } = useTheme();
  const bp = useBreakpoint();
  const [data, setData] = useState(null);
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    apiFetch("/api/public/portfolio").then((res) => {
      if (!res.error) setData(res);
    });
  }, []);

  if (!data) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: theme.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: theme.muted,
        }}
      >
        <span>
          loading
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 14,
              marginLeft: 6,
              background: theme.accent,
              verticalAlign: "text-bottom",
              animation: "crt-blink 0.8s step-end infinite",
            }}
          />
        </span>
        <style>{`@keyframes crt-blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
      </div>
    );
  }

  const { about, projects, skills, experience } = data;

  const grouped = skills.reduce((acc, s) => {
    const cat = s.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const isPhone = bp === "phone";

  return (
    <>
      {/* Fixed chrome — always at viewport top/bottom */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 90 }}>
        <StatusLine onSignIn={() => setShowSignIn(true)} />
      </div>
      {!isPhone && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90 }}>
          <FKeyBar about={about} />
        </div>
      )}

      <Scanlines strength={tweaks.scanlines} />
      <Vignette strength={tweaks.vignette} />

      {/* Scrollable content — padded to clear the fixed bars */}
      <div
        style={{
          minHeight: "100vh",
          background: theme.bg,
          color: theme.cream,
          fontFamily: "var(--font-mono)",
          paddingTop: 28,
          paddingBottom: isPhone ? 16 : 28,
        }}
      >
        <main
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            margin: isPhone ? "12px 4%" : "2% 5%",
          }}
        >
          {/* Hero */}
          <Box glowing padding="24px 28px">
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: theme.accent,
                  color: theme.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: 16,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {getInitials(about.display_name || "?")}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 22,
                    color: theme.accentHot,
                    lineHeight: 1.1,
                    textShadow: glowFn(theme, tweaks.glow * 0.9),
                  }}
                >
                  &gt; {about.display_name || "Portfolio"}
                </div>
                {about.headline && (
                  <div style={{ fontSize: 12, color: theme.accentDim, marginTop: 4 }}>
                    {about.headline}
                  </div>
                )}
              </div>
            </div>

            {about.location && (
              <div style={{ fontSize: 11, color: theme.muted, marginBottom: 8 }}>
                📍 {about.location}
              </div>
            )}

            {about.bio && (
              <p
                style={{
                  fontSize: 13,
                  color: theme.cream,
                  lineHeight: 1.7,
                  margin: "0 0 16px",
                }}
              >
                {about.bio}
              </p>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {about.website && (
                <a href={about.website} target="_blank" rel="noreferrer" style={linkStyle(theme)}>
                  website <IExtLink />
                </a>
              )}
              {about.github && (
                <a
                  href={"https://github.com/" + about.github}
                  target="_blank"
                  rel="noreferrer"
                  style={linkStyle(theme)}
                >
                  github/{about.github} <IExtLink />
                </a>
              )}
              {about.linkedin && (
                <a
                  href={"https://linkedin.com/in/" + about.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  style={linkStyle(theme)}
                >
                  linkedin/{about.linkedin} <IExtLink />
                </a>
              )}
            </div>
          </Box>

          {/* Projects */}
          {projects.length > 0 && (
            <Box title="PROJECTS">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isPhone
                    ? "1fr"
                    : "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 12,
                }}
              >
                {projects.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: "14px 16px",
                      border: `1px solid ${theme.border}`,
                      background: theme.bg,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: theme.accentHot,
                        textShadow: glowFn(theme, tweaks.glow * 0.4),
                      }}
                    >
                      {p.title}
                    </div>
                    {p.description && (
                      <p style={{ fontSize: 11, color: theme.cream, lineHeight: 1.6, margin: 0 }}>
                        {p.description}
                      </p>
                    )}
                    {p.tech_stack && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                        {p.tech_stack
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean)
                          .map((t) => (
                            <span
                              key={t}
                              style={{
                                fontSize: 10,
                                padding: "1px 7px",
                                border: `1px solid ${theme.borderHi}`,
                                color: theme.accentDim,
                                letterSpacing: "0.06em",
                              }}
                            >
                              {t}
                            </span>
                          ))}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 12, marginTop: "auto" }}>
                      {p.github_url && (
                        <a
                          href={p.github_url}
                          target="_blank"
                          rel="noreferrer"
                          style={linkStyle(theme)}
                        >
                          github <IExtLink />
                        </a>
                      )}
                      {p.live_url && (
                        <a
                          href={p.live_url}
                          target="_blank"
                          rel="noreferrer"
                          style={linkStyle(theme)}
                        >
                          live <IExtLink />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Box>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <Box title="SKILLS">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {Object.keys(grouped)
                  .sort()
                  .map((cat) => (
                    <div key={cat}>
                      <div
                        style={{
                          fontSize: 10,
                          color: theme.muted,
                          letterSpacing: "0.14em",
                          marginBottom: 8,
                        }}
                      >
                        {cat.toUpperCase()}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {grouped[cat].map((s) => (
                          <span
                            key={s.id}
                            style={{
                              fontSize: 11,
                              padding: "3px 10px",
                              border: `1px solid ${theme.borderHi}`,
                              color: theme.cream,
                              background: theme.surface2,
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </Box>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <Box title="EXPERIENCE">
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {experience.map((e, i) => (
                  <div
                    key={e.id}
                    style={{
                      display: "flex",
                      gap: 16,
                      paddingBottom: i < experience.length - 1 ? 18 : 0,
                      borderBottom:
                        i < experience.length - 1 ? `1px solid ${theme.border}` : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 2,
                        background: theme.accent,
                        flexShrink: 0,
                        alignSelf: "stretch",
                        boxShadow: `0 0 6px ${theme.accent}60`,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          color: theme.accentHot,
                          textShadow: glowFn(theme, tweaks.glow * 0.4),
                        }}
                      >
                        {e.role}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "baseline",
                          marginTop: 3,
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ fontSize: 12, color: theme.cream }}>{e.company}</span>
                        <span style={{ fontSize: 10, color: theme.muted }}>
                          {formatDateRange(e.start_date, e.end_date)}
                        </span>
                      </div>
                      {e.description && (
                        <p
                          style={{
                            fontSize: 11,
                            color: theme.accentDim,
                            lineHeight: 1.6,
                            margin: "8px 0 0",
                          }}
                        >
                          {e.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Box>
          )}
        </main>
      </div>

      {showSignIn && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <SignIn onLogin={onLogin} onClose={() => setShowSignIn(false)} />
        </div>
      )}
    </>
  );
}

function linkStyle(theme) {
  return {
    fontSize: 11,
    color: theme.accentDim,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontFamily: "var(--font-mono)",
    borderBottom: `1px solid ${theme.borderHi}`,
    paddingBottom: 1,
  };
}
