import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";

export default function CRTButton({ children, onClick, primary = false, hot = false, style = {} }) {
  const { theme } = useTheme();
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        padding: "7px 14px",
        background: primary ? theme.accent : hover ? theme.surface2 : "transparent",
        color: primary ? theme.bg : hot ? theme.accent : theme.cream,
        border: `1px solid ${primary ? theme.accent : hot ? theme.accent : theme.borderHi}`,
        fontWeight: primary ? 700 : 500,
        letterSpacing: "0.08em",
        cursor: "pointer",
        transition: "background 0.1s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
