import { useTheme } from "../../context/ThemeContext";
import { STATUS } from "../../context/ThemeContext";

export default function BlockBar({ value, max, width = 32, over = false }) {
  const { theme } = useTheme();
  const pct = Math.min(1, value / max);
  const filled = Math.round(pct * width);
  const empty = width - filled;
  const color = over ? STATUS.red : theme.accent;
  return (
    <span style={{ fontFamily: "var(--font-mono)", whiteSpace: "pre" }}>
      <span style={{ color }}>{"█".repeat(filled)}</span>
      <span style={{ color: theme.faint }}>{"░".repeat(empty)}</span>
    </span>
  );
}
