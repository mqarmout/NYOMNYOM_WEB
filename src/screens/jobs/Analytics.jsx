import { useJob } from "../../context/JobContext";
import { useTheme, STATUS, glow as glowFn } from "../../context/ThemeContext";
import Box from "../../components/crt/Box";

const STATUS_COLORS = (theme) => ({
  applied: theme.muted,
  screening: STATUS.amber,
  interviewing: theme.accent,
  offer: theme.accentHot,
  rejected: STATUS.red,
  withdrawn: theme.faint,
});

const STATUS_LABELS = {
  applied: "APPLIED",
  screening: "SCREENING",
  interviewing: "INTERVIEW",
  offer: "OFFER",
  rejected: "REJECTED",
  withdrawn: "WITHDRAWN",
};

const PIPELINE_ORDER = ["applied", "screening", "interviewing", "offer", "rejected", "withdrawn"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function JobsAnalytics() {
  const { theme, tweaks } = useTheme();
  const { jobs } = useJob();
  const colors = STATUS_COLORS(theme);

  const now = new Date();
  const monthName = now.toLocaleString("en", { month: "long" }).toUpperCase();
  const year = now.getFullYear();

  const active = jobs.filter((j) => j.status !== "rejected" && j.status !== "withdrawn").length;
  const interviewing = jobs.filter((j) => j.status === "interviewing").length;
  const offers = jobs.filter((j) => j.status === "offer").length;
  const applied = jobs.filter((j) => j.status === "applied").length;

  // Pipeline horizontal bars
  const pipelineCounts = PIPELINE_ORDER.map((s) => ({
    status: s,
    count: jobs.filter((j) => j.status === s).length,
    color: colors[s],
  })).filter((d) => d.count > 0);
  const maxPipeline = Math.max(...pipelineCounts.map((d) => d.count), 1);

  // Applications by month (6m)
  const monthBars = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = jobs.filter((j) => j.date_applied?.startsWith(key)).length;
    monthBars.push({ lbl: MONTH_NAMES[d.getMonth()], v: count, hot: i === 0 });
  }
  const maxMonth = Math.max(...monthBars.map((d) => d.v), 1);

  // Recent applications (newest first)
  const recent = [...jobs]
    .sort((a, b) => (b.date_applied || "").localeCompare(a.date_applied || ""))
    .slice(0, 8);

  return (
    <div
      style={{
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        fontFamily: "var(--font-mono)",
      }}
    >
      {/* Hero */}
      <Box glowing padding="18px 22px">
        <div style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.18em", marginBottom: 8 }}>
          {`// JOBS · ${monthName} · ${year}`}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 32 }}>
          {[
            ["PIPELINE", String(active), theme.accentHot],
            ["INTERVIEWING", String(interviewing), interviewing > 0 ? theme.accent : theme.muted],
            ["OFFERS", String(offers), offers > 0 ? STATUS.amber : theme.muted],
            ["APPLIED", String(applied), theme.muted],
          ].map(([l, v, c]) => (
            <div key={l}>
              <div style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.14em" }}>{l}</div>
              <div
                style={{
                  fontSize: 44,
                  color: c,
                  lineHeight: 0.95,
                  textShadow: glowFn(theme, tweaks.glow * 1.2),
                  marginTop: 4,
                }}
              >
                {v}
              </div>
            </div>
          ))}
        </div>
      </Box>

      {/* Two-column: pipeline funnel + recent apps (2:1) */}
      <div
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, alignItems: "stretch" }}
      >
        {/* Pipeline funnel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Box title="PIPELINE · STATUS" padding="16px 20px">
            {pipelineCounts.length === 0 ? (
              <div style={{ color: theme.muted, fontSize: 11 }}>no applications yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pipelineCounts.map(({ status, count, color }) => (
                  <div
                    key={status}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "80px 1fr 26px",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 10, color, letterSpacing: "0.06em" }}>
                      <span style={{ marginRight: 5 }}>●</span>
                      {STATUS_LABELS[status]}
                    </span>
                    <div
                      style={{
                        position: "relative",
                        height: 14,
                        background: theme.surface2,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          bottom: 0,
                          width: `${(count / maxPipeline) * 100}%`,
                          background: color,
                          boxShadow: `0 0 6px ${color}60`,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 11, color: theme.cream, textAlign: "right" }}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Box>

          {/* Applications over time */}
          <Box title="APPLICATIONS · 6 MONTHS" padding="14px 18px">
            {monthBars.every((d) => d.v === 0) ? (
              <div style={{ color: theme.muted, fontSize: 11 }}>no applications yet</div>
            ) : (
              <svg viewBox="0 0 760 100" width="100%" height="100" preserveAspectRatio="none">
                <line x1="0" y1="80" x2="760" y2="80" stroke={theme.borderHi} strokeWidth="0.5" />
                {monthBars.map((d, i) => {
                  const slot = 760 / 6;
                  const bW = Math.min(slot * 0.55, 80);
                  const x = i * slot + (slot - bW) / 2;
                  const bH = Math.max((d.v / maxMonth) * 72, d.v > 0 ? 2 : 0);
                  return (
                    <g key={i}>
                      <rect
                        x={x}
                        y={80 - bH}
                        width={bW}
                        height={bH}
                        fill={d.hot ? theme.accentHot : theme.accent}
                        opacity={d.hot ? 1 : 0.55}
                      />
                      <text
                        x={x + bW / 2}
                        y={95}
                        textAnchor="middle"
                        fill={theme.muted}
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {d.lbl}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </Box>
        </div>

        {/* Recent applications */}
        <Box
          title="RECENT.APPLICATIONS"
          padding="14px 18px"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <div
            style={{
              fontSize: 10,
              color: theme.muted,
              letterSpacing: "0.08em",
              display: "grid",
              gridTemplateColumns: "56px 1fr 100px 80px",
              gap: 8,
              padding: "6px 0",
              borderBottom: `1px dashed ${theme.border}`,
              marginBottom: 4,
            }}
          >
            <span>date</span>
            <span>company</span>
            <span>role</span>
            <span style={{ textAlign: "right" }}>status</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {recent.length === 0 ? (
              <div style={{ color: theme.muted, fontSize: 11, padding: "12px 0" }}>
                no applications yet · use the Applications tab to add
              </div>
            ) : (
              recent.map((j) => {
                const c = colors[j.status] || theme.muted;
                return (
                  <div
                    key={j.id}
                    style={{
                      fontSize: 11,
                      color: theme.cream,
                      padding: "8px 0",
                      display: "grid",
                      gridTemplateColumns: "56px 1fr 100px 80px",
                      gap: 8,
                      alignItems: "center",
                      borderBottom: `1px dashed ${theme.border}`,
                    }}
                  >
                    <span style={{ color: theme.muted, fontSize: 10 }}>
                      {j.date_applied ? j.date_applied.slice(5) : "—"}
                    </span>
                    <span
                      style={{
                        color: theme.accentHot,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {j.company}
                    </span>
                    <span
                      style={{
                        color: theme.cream,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: 10,
                      }}
                    >
                      {j.role}
                    </span>
                    <span style={{ color: c, textAlign: "right", fontSize: 10, fontWeight: 600 }}>
                      {STATUS_LABELS[j.status] || j.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          {jobs.length > 0 && (
            <div
              style={{
                marginTop: 10,
                fontSize: 10,
                color: theme.muted,
                borderTop: `1px dashed ${theme.border}`,
                paddingTop: 8,
              }}
            >
              {jobs.length} total · {active} active ·{" "}
              {((active / Math.max(jobs.length, 1)) * 100).toFixed(0)}% active rate
            </div>
          )}
        </Box>
      </div>
    </div>
  );
}
