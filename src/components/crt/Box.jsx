import { useTheme, glow as glowFn } from "../../context/ThemeContext";

export default function Box({
  title,
  children,
  glowing = false,
  style = {},
  padding = "14px 18px",
}) {
  const { theme, tweaks } = useTheme();
  return (
    <div
      style={{
        border: `1px solid ${glowing ? theme.accent : theme.borderHi}`,
        background: theme.surface,
        boxShadow: glowing ? `inset 0 0 18px ${theme.accent}14` : "none",
        position: "relative",
        padding,
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            position: "absolute",
            top: -8,
            left: 12,
            padding: "0 8px",
            background: theme.bg,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: glowing ? theme.accent : theme.accentDim,
            letterSpacing: "0.12em",
            textShadow: glowing ? glowFn(theme, 0.4 * tweaks.glow) : "none",
          }}
        >
          [ {title} ]
        </div>
      )}
      {children}
    </div>
  );
}
