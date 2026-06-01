import { useId } from "react";
import { useTheme, STATUS } from "./context/ThemeContext";

// CRT-friendly donut color ramp: derived from active theme + STATUS colors
function crtRamp(theme) {
  return [
    theme.accent,
    theme.accentDim,
    STATUS.blue,
    STATUS.amber,
    theme.accentHot,
    STATUS.red,
    theme.faint,
    theme.muted,
  ];
}

// ── Area line chart ────────────────────────────────────────────────────────────
export function AreaChart({ data }) {
  const { theme, tweaks } = useTheme();
  const uid = useId();
  const gradId = `ag-${uid}`;
  const glowId = `agl-${uid}`;

  const W = 340, H = 110, pL = 10, pR = 10, pT = 10, pB = 24;
  const iW = W - pL - pR, iH = H - pT - pB;

  if (!data.length)
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="svg-chart">
        <text x={W / 2} y={H / 2} textAnchor="middle" fill={theme.muted} fontSize="12">
          No data yet
        </text>
      </svg>
    );

  const max = Math.max(...data.map((d) => d.v), 1);
  const coords = data.map((d, i) => ({
    x: +(pL + (data.length === 1 ? iW / 2 : (i / (data.length - 1)) * iW)).toFixed(2),
    y: +(pT + iH - (d.v / max) * iH).toFixed(2),
    lbl: d.lbl,
  }));

  let line = `M${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const cpx = +((coords[i - 1].x + coords[i].x) / 2).toFixed(2);
    line += ` C${cpx} ${coords[i - 1].y} ${cpx} ${coords[i].y} ${coords[i].x} ${coords[i].y}`;
  }
  const area = line + ` L${coords[coords.length - 1].x} ${pT + iH} L${coords[0].x} ${pT + iH}Z`;

  const step = Math.ceil(coords.length / 7);
  const lblCoords = coords.filter((_, i) => i % step === 0 || i === coords.length - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="svg-chart">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
        </linearGradient>
        {tweaks.glow > 0 && (
          <filter id={glowId}>
            <feGaussianBlur stdDeviation={1 * tweaks.glow} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={line}
        fill="none"
        stroke={theme.accent}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={tweaks.glow > 0 ? `url(#${glowId})` : undefined}
      />
      {coords.map((p, i) => {
        const isLast = i === coords.length - 1;
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={isLast ? 3.5 : 2.5}
            fill={isLast ? theme.accentHot : theme.accent}
          />
        );
      })}
      {lblCoords.map((p, i) => (
        <text key={i} x={p.x} y={H - 4} textAnchor="middle" fill={theme.muted} fontSize="9">
          {p.lbl}
        </text>
      ))}
    </svg>
  );
}

// ── Donut chart ────────────────────────────────────────────────────────────────
function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: +(cx + r * Math.cos(rad)).toFixed(3), y: +(cy + r * Math.sin(rad)).toFixed(3) };
}

function donutArc(cx, cy, R, r, a1, a2) {
  if (a2 - a1 >= 360) a2 = a1 + 359.99;
  const s1 = polar(cx, cy, R, a1), e1 = polar(cx, cy, R, a2);
  const s2 = polar(cx, cy, r, a2), e2 = polar(cx, cy, r, a1);
  const lg = a2 - a1 > 180 ? 1 : 0;
  return `M${s1.x} ${s1.y} A${R} ${R} 0 ${lg} 1 ${e1.x} ${e1.y} L${s2.x} ${s2.y} A${r} ${r} 0 ${lg} 0 ${e2.x} ${e2.y}Z`;
}

export function DonutChart({ segments, total, currency = "$" }) {
  const { theme } = useTheme();
  const size = 160, cx = 80, cy = 80, R = 66, r = 46;
  const COLORS = crtRamp(theme);

  if (!segments.length || total === 0)
    return (
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke={theme.border} strokeWidth={R - r} />
        <text x={cx} y={cy + 5} textAnchor="middle" fill={theme.muted} fontSize="11">
          No data
        </text>
      </svg>
    );

  let angle = 0;
  const totalFmt = currency + Number(total).toLocaleString("en-US", { maximumFractionDigits: 0 });

  return (
    <svg viewBox={`0 0 ${size} ${size}`}>
      {segments.map((s, i) => {
        const sweep = (s.spent / total) * 360;
        const d = donutArc(cx, cy, R, r, angle, angle + sweep);
        angle += sweep;
        return <path key={i} d={d} fill={COLORS[i % COLORS.length]} />;
      })}
      <text x={cx} y={cy - 8} textAnchor="middle" fill={theme.muted} fontSize="10">
        TOTAL
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={theme.cream} fontSize="15" fontWeight="800">
        {totalFmt}
      </text>
    </svg>
  );
}

// ── Monthly history bar chart ──────────────────────────────────────────────────
export function HistoryBars({ months }) {
  const { theme, tweaks } = useTheme();
  const uid = useId();
  const glowId = `hbl-${uid}`;

  const W = 340, H = 110, pL = 10, pR = 10, pT = 10, pB = 28;
  const iW = W - pL - pR, iH = H - pT - pB;

  if (!months.length)
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="svg-chart">
        <text x={W / 2} y={H / 2} textAnchor="middle" fill={theme.muted} fontSize="12">
          No data yet
        </text>
      </svg>
    );

  const hasIncome = months.some((m) => (m.income || 0) > 0);
  const max = Math.max(...months.map((m) => Math.max(m.total, m.income || 0)), 1);
  const slot = iW / months.length;
  const bW = hasIncome ? slot * 0.38 : slot * 0.55;
  const gap = hasIncome ? slot * 0.06 : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="svg-chart">
      <defs>
        {tweaks.glow > 0 && (
          <filter id={glowId}>
            <feGaussianBlur stdDeviation={0.8 * tweaks.glow} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      {hasIncome && (
        <g>
          <rect x={12} y={pT} width={8} height={4} fill={STATUS.blue} />
          <text x={23} y={pT + 4} fill={theme.muted} fontSize="8">
            Income
          </text>
          <rect x={65} y={pT} width={8} height={4} fill={theme.accent} />
          <text x={76} y={pT + 4} fill={theme.muted} fontSize="8">
            Spent
          </text>
        </g>
      )}
      {months.map((m, i) => {
        const isLast = i === months.length - 1;
        const expH = Math.max((m.total / max) * iH, 2);
        const incH = Math.max(((m.income || 0) / max) * iH, m.income ? 2 : 0);
        const slotX = pL + i * slot + (slot - (hasIncome ? bW * 2 + gap : bW)) / 2;
        const lbl = m.month.slice(5, 7) + "/" + m.month.slice(2, 4);
        const barColor = isLast ? theme.accentHot : theme.accent;
        const barOpacity = isLast ? 1 : 0.55;
        return (
          <g key={i}>
            {hasIncome && incH > 0 && (
              <rect
                x={+slotX.toFixed(2)}
                y={+(pT + iH - incH).toFixed(2)}
                width={+bW.toFixed(2)}
                height={+incH.toFixed(2)}
                fill={STATUS.blue}
                opacity={isLast ? 1 : 0.55}
              />
            )}
            <rect
              x={+(slotX + (hasIncome ? bW + gap : 0)).toFixed(2)}
              y={+(pT + iH - expH).toFixed(2)}
              width={+bW.toFixed(2)}
              height={+expH.toFixed(2)}
              fill={barColor}
              opacity={barOpacity}
              filter={isLast && tweaks.glow > 0 ? `url(#${glowId})` : undefined}
            />
            <text
              x={+(slotX + (hasIncome ? bW + gap / 2 : bW / 2)).toFixed(2)}
              y={H - 6}
              textAnchor="middle"
              fill={isLast ? theme.accentHot : theme.muted}
              fontSize="9"
            >
              {lbl}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
