import { useState, useEffect } from "react";
import { useTheme, glow as glowFn } from "../../context/ThemeContext";
import PixelIcon from "./PixelIcon";
import { useBreakpoint } from "../../hooks/useBreakpoint";

const SECTION_META = [
  { id: "spending", label: "spending", icon: "coins", key: "1" },
  { id: "jobs", label: "jobs", icon: "briefcase", key: "2" },
  { id: "fitness", label: "fitness", icon: "fitness", key: "3" },
  { id: "portfolio", label: "portfolio", icon: "portfolio", key: "4" },
  { id: "climbing", label: "climbing", icon: "climb", key: "5" },
  { id: "projects", label: "projects", icon: "code", key: "6" },
  { id: "hydro", label: "hydro", icon: "drop", key: "7" },
];

// phone bottom tabs — only 4 main + more
const PHONE_TABS = [
  { id: "home", icon: "map", label: "HOME" },
  { id: "spending", icon: "coins", label: "SPEND" },
  { id: "fitness", icon: "fitness", label: "FIT" },
  { id: "climbing", icon: "climb", label: "CLIMB" },
  { id: "more", icon: "plus", label: "MORE" },
];
const PHONE_MAIN = new Set(["home", "spending", "fitness", "climbing"]);
const MORE_SECTIONS = SECTION_META.filter((s) => !PHONE_MAIN.has(s.id));

// ─── effects ───────────────────────────────────────────────────────────────

function Scanlines({ strength, fixed = false }) {
  if (!strength) return null;
  return (
    <div
      style={{
        position: fixed ? "fixed" : "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 80,
        background: `repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,${strength}) 1px, rgba(0,0,0,${strength}) 2px)`,
      }}
    />
  );
}

function Vignette({ strength, fixed = false }) {
  if (!strength) return null;
  return (
    <div
      style={{
        position: fixed ? "fixed" : "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 81,
        background: `radial-gradient(ellipse at center, transparent ${50 - strength * 15}%, rgba(0,0,0,${strength}) 100%)`,
      }}
    />
  );
}

// ─── desktop/tablet chrome ──────────────────────────────────────────────────

function StatusLine({ path, cmd, username }) {
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
        {username || "user"}@nyomnyom
      </span>
      <span style={{ color: theme.muted }}>:</span>
      <span style={{ color: theme.cream }}>~{path || "/dashboard"}</span>
      <span style={{ color: theme.muted }}>$</span>
      <span style={{ color: theme.accentHot, textShadow: glowFn(theme, tweaks.glow * 0.6) }}>
        {cmd || "ls"}
      </span>
      <span style={{ flex: 1 }} />
      <span>
        [<span style={{ color: theme.accent }}>●</span> ONLINE]
      </span>
      <span style={{ color: theme.muted }}>·</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>
        {dateStr} {time}
      </span>
    </div>
  );
}

function FKeyBar({ keys = [], extra = null }) {
  const { theme } = useTheme();
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
      {keys.map(([k, l], i) => (
        <span key={i}>
          <span style={{ color: theme.accent }}>{k}</span> {l}
        </span>
      ))}
      <span style={{ flex: 1 }} />
      {extra}
    </div>
  );
}

function Sidebar({ active, onNav, username, onLogout }) {
  const { theme, tweaks } = useTheme();
  return (
    <aside
      style={{
        width: 260,
        borderRight: `1px solid ${theme.border}`,
        padding: "18px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        background: theme.bg,
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "0 8px 14px",
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: theme.muted,
            letterSpacing: "0.16em",
          }}
        >
          {"// SECTIONS · 7"}
        </span>
      </div>

      <button
        onClick={() => onNav("home")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 10px",
          width: "100%",
          background: active === "home" ? theme.surface2 : "transparent",
          border: "none",
          borderLeft: active === "home" ? `2px solid ${theme.accent}` : "2px solid transparent",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: active === "home" ? theme.accentHot : theme.cream,
          textAlign: "left",
          cursor: "pointer",
          textShadow: active === "home" ? glowFn(theme, tweaks.glow * 0.5) : "none",
        }}
      >
        <span
          style={{
            color: active === "home" ? theme.accent : theme.muted,
            width: 22,
            fontFamily: "var(--font-mono)",
          }}
        >
          {active === "home" ? "▸ 0" : "  0"}
        </span>
        <PixelIcon
          kind="map"
          size={11}
          color={active === "home" ? theme.accent : theme.accentDim}
        />
        <span style={{ flex: 1 }}>home</span>
        <span style={{ color: theme.muted, fontSize: 10 }}>[h]</span>
      </button>

      <div style={{ height: 8 }} />

      {SECTION_META.map((s, i) => {
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onNav(s.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              width: "100%",
              background: isActive ? theme.surface2 : "transparent",
              border: "none",
              borderLeft: isActive ? `2px solid ${theme.accent}` : "2px solid transparent",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: isActive ? theme.accentHot : theme.cream,
              textAlign: "left",
              cursor: "pointer",
              textShadow: isActive ? glowFn(theme, tweaks.glow * 0.5) : "none",
            }}
          >
            <span
              style={{
                color: isActive ? theme.accent : theme.muted,
                width: 22,
                fontFamily: "var(--font-mono)",
              }}
            >
              {isActive ? `▸ ${i + 1}` : `  ${i + 1}`}
            </span>
            <PixelIcon kind={s.icon} size={11} color={isActive ? theme.accent : theme.accentDim} />
            <span style={{ flex: 1 }}>{s.label}</span>
            <span style={{ color: theme.muted, fontSize: 10 }}>[{s.key}]</span>
          </button>
        );
      })}

      <div
        style={{
          marginTop: 14,
          padding: "10px 8px",
          border: `1px dashed ${theme.borderHi}`,
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: theme.accentDim,
          lineHeight: 1.7,
        }}
      >
        <div style={{ color: theme.muted, letterSpacing: "0.14em" }}>{"// HOTKEYS"}</div>
        <div>
          <span style={{ color: theme.accent }}>1-7</span> section
        </div>
        <div>
          <span style={{ color: theme.accent }}>h</span> home
        </div>
        <div>
          <span style={{ color: theme.accent }}>/</span> search
        </div>
        <div>
          <span style={{ color: theme.accent }}>?</span> help
        </div>
      </div>

      <div
        style={{
          marginTop: "auto",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: theme.muted,
          padding: "12px 8px",
          borderTop: `1px dashed ${theme.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 22,
              height: 22,
              background: theme.accent,
              color: theme.bg,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {username ? username.slice(0, 2).toUpperCase() : "??"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: theme.cream, fontSize: 11 }}>{username || "user"}</div>
            <button
              onClick={onLogout}
              style={{
                background: "none",
                border: "none",
                color: theme.muted,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                cursor: "pointer",
                padding: 0,
              }}
            >
              sign out →
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── tablet chrome ──────────────────────────────────────────────────────────

function TabRail({ active, onNav }) {
  const { theme } = useTheme();
  const items = [{ id: "home", icon: "map" }, ...SECTION_META.map((s) => ({ id: s.id, icon: s.icon }))];
  return (
    <aside
      style={{
        width: 58,
        borderRight: `1px solid ${theme.border}`,
        background: theme.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "14px 0",
        gap: 4,
        flexShrink: 0,
        position: "relative",
        zIndex: 6,
        overflowY: "auto",
      }}
    >
      {/* logo */}
      <div
        style={{
          width: 30,
          height: 30,
          background: theme.accent,
          color: theme.bg,
          fontFamily: "var(--font-mono)",
          fontSize: 15,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
          flexShrink: 0,
        }}
      >
        N
      </div>

      {items.map(({ id, icon }) => {
        const on = active === id;
        return (
          <button
            key={id}
            title={id}
            onClick={() => onNav(id)}
            style={{
              width: 42,
              height: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              background: on ? theme.surface2 : "transparent",
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {on && (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 8,
                  bottom: 8,
                  width: 2,
                  background: theme.accent,
                  boxShadow: `0 0 6px ${theme.accent}`,
                }}
              />
            )}
            <PixelIcon kind={icon} size={18} color={on ? theme.accent : theme.accentDim} />
          </button>
        );
      })}
    </aside>
  );
}

// ─── phone chrome ───────────────────────────────────────────────────────────

function PhoneContextStrip({ path, cmd, username }) {
  const { theme, tweaks } = useTheme();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toTimeString().slice(0, 5);

  return (
    <div
      style={{
        height: 36,
        padding: "0 14px",
        display: "flex",
        alignItems: "center",
        gap: 6,
        borderBottom: `1px solid ${theme.border}`,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: theme.accentDim,
        background: theme.bg,
        flexShrink: 0,
        position: "relative",
        zIndex: 6,
        overflow: "hidden",
      }}
    >
      <span style={{ color: theme.accent, textShadow: glowFn(theme, tweaks.glow * 0.4) }}>
        {username || "user"}@nyomnyom
      </span>
      <span style={{ color: theme.muted }}>:</span>
      <span style={{ color: theme.cream, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        ~{path || "/dashboard"}
      </span>
      <span style={{ fontVariantNumeric: "tabular-nums", color: theme.muted, flexShrink: 0 }}>
        {time}
      </span>
    </div>
  );
}

function PhoneTabBar({ phoneActive, onNav, onMore }) {
  const { theme, tweaks } = useTheme();
  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        justifyContent: "space-around",
        padding: "8px 0 env(safe-area-inset-bottom, 10px)",
        borderTop: `1px solid ${theme.border}`,
        background: theme.bg,
        position: "relative",
        zIndex: 6,
      }}
    >
      {PHONE_TABS.map(({ id, icon, label }) => {
        const on = phoneActive === id;
        return (
          <button
            key={id}
            onClick={() => (id === "more" ? onMore() : onNav(id))}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: on ? theme.accent : theme.muted,
              minWidth: 44,
            }}
          >
            <PixelIcon kind={icon} size={18} color={on ? theme.accent : theme.muted} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 8,
                letterSpacing: "0.12em",
                textShadow: on ? glowFn(theme, tweaks.glow * 0.5) : "none",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MoreSheet({ onNav, onClose, onLogout }) {
  const { theme } = useTheme();
  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 50,
        }}
      />
      {/* sheet */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: theme.bg,
          borderTop: `1px solid ${theme.accent}`,
          zIndex: 51,
          fontFamily: "var(--font-mono)",
          padding: "14px 0 env(safe-area-inset-bottom, 14px)",
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: theme.muted,
            letterSpacing: "0.16em",
            padding: "0 18px 10px",
          }}
        >
          {"// MORE SECTIONS"}
        </div>
        {MORE_SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              onNav(s.id);
              onClose();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              width: "100%",
              padding: "14px 18px",
              background: "transparent",
              border: "none",
              borderBottom: `1px solid ${theme.border}`,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <PixelIcon kind={s.icon} size={16} color={theme.accentDim} />
            <span style={{ fontSize: 13, color: theme.cream }}>{s.label}</span>
            <span style={{ marginLeft: "auto", color: theme.muted, fontSize: 11 }}>→</span>
          </button>
        ))}
        <button
          onClick={() => { onNav("profile"); onClose(); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            width: "100%",
            padding: "14px 18px",
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${theme.border}`,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <PixelIcon kind="user" size={16} color={theme.accentDim} />
          <span style={{ fontSize: 13, color: theme.cream }}>profile</span>
          <span style={{ marginLeft: "auto", color: theme.muted, fontSize: 11 }}>→</span>
        </button>
        <button
          onClick={() => { onLogout(); onClose(); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            width: "100%",
            padding: "14px 18px",
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${theme.border}`,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <PixelIcon kind="power" size={16} color={theme.muted} />
          <span style={{ fontSize: 13, color: theme.muted }}>sign out</span>
        </button>
        <button
          onClick={onClose}
          style={{
            display: "block",
            width: "100%",
            padding: "14px 18px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: theme.muted,
            textAlign: "center",
            letterSpacing: "0.1em",
          }}
        >
          cancel
        </button>
      </div>
    </>
  );
}

// ─── shell ──────────────────────────────────────────────────────────────────

export default function Shell({
  active,
  onNav,
  path,
  cmd,
  fkeys,
  username,
  onLogout,
  footerExtra,
  children,
}) {
  const { theme, tweaks } = useTheme();
  const bp = useBreakpoint();
  const [showMore, setShowMore] = useState(false);

  const phoneActive = PHONE_MAIN.has(active) || active === "home" ? active : "more";

  if (bp === "phone") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: theme.bg,
          color: theme.cream,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <PhoneContextStrip path={path} cmd={cmd} username={username} />
        <main style={{ flex: 1, overflow: "auto", minWidth: 0, position: "relative", zIndex: 2 }}>
          {children}
        </main>
        <PhoneTabBar
          phoneActive={phoneActive}
          onNav={onNav}
          onMore={() => setShowMore(true)}
        />
        {showMore && (
          <MoreSheet onNav={onNav} onClose={() => setShowMore(false)} onLogout={onLogout} />
        )}
        <Scanlines strength={tweaks.scanlines} />
        <Vignette strength={tweaks.vignette} />
      </div>
    );
  }

  if (bp === "tablet") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: theme.bg,
          color: theme.cream,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <StatusLine path={path} cmd={cmd} username={username} />
        <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative", zIndex: 2 }}>
          <TabRail active={active} onNav={onNav} />
          <main style={{ flex: 1, overflow: "auto", minWidth: 0, position: "relative" }}>
            {children}
          </main>
        </div>
        <FKeyBar keys={fkeys} extra={footerExtra} />
        <Scanlines strength={tweaks.scanlines} />
        <Vignette strength={tweaks.vignette} />
      </div>
    );
  }

  // desktop
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: theme.bg,
        color: theme.cream,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <StatusLine path={path} cmd={cmd} username={username} />
      <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative", zIndex: 2 }}>
        <Sidebar active={active} onNav={onNav} username={username} onLogout={onLogout} />
        <main style={{ flex: 1, overflow: "auto", minWidth: 0, position: "relative" }}>
          {children}
        </main>
      </div>
      <FKeyBar keys={fkeys} extra={footerExtra} />
      <Scanlines strength={tweaks.scanlines} />
      <Vignette strength={tweaks.vignette} />
    </div>
  );
}
