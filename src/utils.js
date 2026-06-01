// CRT-palette safe fallback colors (used where dynamic theme access isn't available).
// Prefer theme.accent / STATUS.* via useTheme() in components.
export const COLORS = [
  "var(--accent)",
  "var(--accent-dim)",
  "#7ab5ff",
  "#ffc55a",
  "var(--accent-hot)",
  "#ff6a5a",
  "var(--faint)",
  "var(--muted)",
];

export function fmt(n, currency = "$") {
  return (
    currency +
    Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

function localDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fmtDate(d) {
  const now = new Date();
  const today = localDateStr(now);
  const yest = localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  if (d === today) return "Today";
  if (d === yest) return "Yesterday";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getInitials(name) {
  if (!name || !name.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export async function apiFetch(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  try {
    return await res.json();
  } catch {
    return { error: `HTTP ${res.status}` };
  }
}
