import { COLORS } from './utils';

// ── Area line chart ────────────────────────────────────────────────────────────
export function AreaChart({ data, color = '#7c6fef' }) {
  const W = 340, H = 110, pL = 10, pR = 10, pT = 10, pB = 24;
  const iW = W - pL - pR, iH = H - pT - pB;

  if (!data.length) return (
    <svg viewBox={`0 0 ${W} ${H}`} className="svg-chart">
      <text x={W / 2} y={H / 2} textAnchor="middle" fill="#555" fontSize="12">No data yet</text>
    </svg>
  );

  const max = Math.max(...data.map(d => d.v), 1);
  const coords = data.map((d, i) => ({
    x: +(pL + (data.length === 1 ? iW / 2 : i / (data.length - 1) * iW)).toFixed(2),
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
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#ag)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} />)}
      {lblCoords.map((p, i) => (
        <text key={i} x={p.x} y={H - 4} textAnchor="middle" fill="#555" fontSize="9">{p.lbl}</text>
      ))}
    </svg>
  );
}

// ── Donut chart ────────────────────────────────────────────────────────────────
function polar(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: +(cx + r * Math.cos(rad)).toFixed(3), y: +(cy + r * Math.sin(rad)).toFixed(3) };
}

function donutArc(cx, cy, R, r, a1, a2) {
  if (a2 - a1 >= 360) a2 = a1 + 359.99;
  const s1 = polar(cx, cy, R, a1), e1 = polar(cx, cy, R, a2);
  const s2 = polar(cx, cy, r, a2), e2 = polar(cx, cy, r, a1);
  const lg = (a2 - a1) > 180 ? 1 : 0;
  return `M${s1.x} ${s1.y} A${R} ${R} 0 ${lg} 1 ${e1.x} ${e1.y} L${s2.x} ${s2.y} A${r} ${r} 0 ${lg} 0 ${e2.x} ${e2.y}Z`;
}

export function DonutChart({ segments, total, currency = '$' }) {
  const size = 160, cx = 80, cy = 80, R = 66, r = 46;

  if (!segments.length || total === 0) return (
    <svg viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke="#2a2a3a" strokeWidth={R - r} />
      <text x={cx} y={cy + 5} textAnchor="middle" fill="#555" fontSize="11">No data</text>
    </svg>
  );

  let angle = 0;
  const totalFmt = currency + Number(total).toLocaleString('en-US', { maximumFractionDigits: 0 });

  return (
    <svg viewBox={`0 0 ${size} ${size}`}>
      {segments.map((s, i) => {
        const sweep = (s.spent / total) * 360;
        const d = donutArc(cx, cy, R, r, angle, angle + sweep);
        angle += sweep;
        return <path key={i} d={d} fill={COLORS[i % COLORS.length]} />;
      })}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#888" fontSize="10">TOTAL</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#e0e0ee" fontSize="15" fontWeight="800">{totalFmt}</text>
    </svg>
  );
}

// ── Monthly history bar chart ──────────────────────────────────────────────────
export function HistoryBars({ months, color = '#5b8dee' }) {
  const W = 340, H = 110, pL = 10, pR = 10, pT = 10, pB = 28;
  const iW = W - pL - pR, iH = H - pT - pB;

  if (!months.length) return (
    <svg viewBox={`0 0 ${W} ${H}`} className="svg-chart">
      <text x={W / 2} y={H / 2} textAnchor="middle" fill="#555" fontSize="12">No data yet</text>
    </svg>
  );

  const max  = Math.max(...months.map(m => m.total), 1);
  const slot = iW / months.length;
  const bW   = slot * 0.55;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="svg-chart">
      {months.map((m, i) => {
        const bH  = Math.max((m.total / max) * iH, 2);
        const x   = +(pL + i * slot + (slot - bW) / 2).toFixed(2);
        const y   = +(pT + iH - bH).toFixed(2);
        const lbl = m.month.slice(5, 7) + '/' + m.month.slice(2, 4);
        return (
          <g key={i}>
            <rect x={x} y={y} width={+bW.toFixed(2)} height={+bH.toFixed(2)} rx="4" fill={color} />
            <text x={+(x + bW / 2).toFixed(2)} y={H - 6} textAnchor="middle" fill="#555" fontSize="9">{lbl}</text>
          </g>
        );
      })}
    </svg>
  );
}
