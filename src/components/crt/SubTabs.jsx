import { useTheme, glow as glowFn } from "../../context/ThemeContext";

export default function SubTabs({ tabs, active, onChange }) {
  const { theme, tweaks } = useTheme();
  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        borderBottom: `1px solid ${theme.border}`,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
      }}
    >
      {tabs.map(([id, label]) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              padding: "10px 18px",
              cursor: "pointer",
              background: "transparent",
              color: isActive ? theme.accentHot : theme.accentDim,
              border: "none",
              borderBottom: isActive ? `2px solid ${theme.accent}` : "2px solid transparent",
              marginBottom: -1,
              letterSpacing: "0.1em",
              fontWeight: isActive ? 600 : 500,
              textShadow: isActive ? glowFn(theme, tweaks.glow * 0.4) : "none",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
