import { createContext, useContext, useState, useEffect, useCallback } from "react";

export const PALETTES = {
  green: {
    key: "green",
    name: "P1·GREEN",
    bg:          "#020a06",
    surface:     "#041208",
    surface2:    "#08200e",
    surface3:    "#0c2818",
    border:      "#0e3a1a",
    borderHi:    "#1c5a2c",
    accent:      "#3aff7a",
    accentHot:   "#9affb8",
    accentDim:   "#1ea050",
    accentFaint: "#0e5a2a",
    cream:       "#cfffd9",
    muted:       "#3c8a52",
    faint:       "#1e4a2a",
  },
  amber: {
    key: "amber",
    name: "P3·AMBER",
    bg:          "#0a0604",
    surface:     "#160d04",
    surface2:    "#221608",
    surface3:    "#2e1f0e",
    border:      "#3a2812",
    borderHi:    "#5a4020",
    accent:      "#ffa83c",
    accentHot:   "#ffc97a",
    accentDim:   "#c47b1c",
    accentFaint: "#7a4f14",
    cream:       "#ffeacb",
    muted:       "#7e6b48",
    faint:       "#4a3f2a",
  },
  cyan: {
    key: "cyan",
    name: "P2·CYAN",
    bg:          "#020c10",
    surface:     "#062028",
    surface2:    "#0a3038",
    surface3:    "#104048",
    border:      "#0e4858",
    borderHi:    "#1c6878",
    accent:      "#4ce4e4",
    accentHot:   "#8af0f0",
    accentDim:   "#28a8b8",
    accentFaint: "#0e5868",
    cream:       "#cff7fa",
    muted:       "#5a9ca8",
    faint:       "#1c5868",
  },
};

export const STATUS = {
  red:   "#ff6a5a",
  amber: "#ffc55a",
  blue:  "#7ab5ff",
};

const FONT_FAMILIES = {
  jetbrains: '"JetBrains Mono", monospace',
  plex:      '"IBM Plex Mono", monospace',
  fira:      '"Fira Code", monospace',
};

const DEFAULTS = {
  palette:   "green",
  glow:      1,
  scanlines: 0.18,
  vignette:  0.5,
  font:      "jetbrains",
};

const LS_KEY = "nyomnyom_crt_theme";

function load() {
  try {
    const s = localStorage.getItem(LS_KEY);
    return s ? { ...DEFAULTS, ...JSON.parse(s) } : DEFAULTS;
  } catch (_e) {
    return DEFAULTS;
  }
}

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [tweaks, setTweaksState] = useState(load);

  const theme = PALETTES[tweaks.palette] ?? PALETTES.green;

  const setTweak = useCallback((key, value) => {
    setTweaksState((prev) => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch (_e) { /* ignore */ }
      return next;
    });
  }, []);

  // Apply CSS variables whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--bg",           theme.bg);
    root.style.setProperty("--surface",      theme.surface);
    root.style.setProperty("--surface2",     theme.surface2);
    root.style.setProperty("--surface3",     theme.surface3);
    root.style.setProperty("--border",       theme.border);
    root.style.setProperty("--border-hi",    theme.borderHi);
    root.style.setProperty("--accent",       theme.accent);
    root.style.setProperty("--accent-hot",   theme.accentHot);
    root.style.setProperty("--accent-dim",   theme.accentDim);
    root.style.setProperty("--accent-faint", theme.accentFaint);
    root.style.setProperty("--cream",        theme.cream);
    root.style.setProperty("--muted",        theme.muted);
    root.style.setProperty("--faint",        theme.faint);
    root.style.setProperty("--text",         theme.cream);
    root.style.setProperty("--glow-mult",    String(tweaks.glow));
    root.style.setProperty("--font-mono",    FONT_FAMILIES[tweaks.font] ?? FONT_FAMILIES.jetbrains);
  }, [theme, tweaks.glow, tweaks.font]);

  return (
    <ThemeCtx.Provider value={{ theme, tweaks, setTweak }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}

export function glow(theme, intensity = 1) {
  if (intensity <= 0) return "none";
  return `0 0 ${4 * intensity}px ${theme.accent}, 0 0 ${10 * intensity}px ${theme.accent}40`;
}
