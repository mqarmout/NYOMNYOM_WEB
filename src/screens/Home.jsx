import { useMemo } from "react";
import { useTheme, glow as glowFn, STATUS } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { useJob } from "../context/JobContext";
import { useFitness } from "../context/FitnessContext";
import { useClimbing } from "../context/ClimbingContext";
import { useDevProjects } from "../context/ProjectsContext";
import { useHydro } from "../context/HydroContext";
import { usePortfolio } from "../context/PortfolioContext";
import Box from "../components/crt/Box";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { AreaChart } from "../Charts";

function StatTile({ label, value, sub, hot = false, warn = false }) {
  const { theme, tweaks } = useTheme();
  const color = warn ? STATUS.amber : hot ? theme.accentHot : theme.cream;
  return (
    <div
      style={{
        padding: "12px 14px",
        background: theme.surface,
        border: `1px solid ${hot ? theme.accent : theme.borderHi}`,
        boxShadow: hot ? `inset 0 0 14px ${theme.accent}14` : "none",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          color: theme.muted,
          letterSpacing: "0.16em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 24,
          color,
          marginTop: 6,
          lineHeight: 1,
          textShadow: hot ? glowFn(theme, tweaks.glow) : glowFn(theme, tweaks.glow * 0.4),
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: hot ? theme.accent : theme.accentDim,
            marginTop: 4,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function BlinkingCursor({ _theme }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 2,
        height: "1em",
        background: "currentColor",
        verticalAlign: "text-bottom",
        marginLeft: 1,
        animation: "crt-blink 0.8s step-end infinite",
      }}
    />
  );
}

function WeightMiniChart({ history, theme, tweaks }) {
  if (!history || history.length < 2) return null;
  const pts90 = history.slice(0, 90);
  const weights = pts90
    .map((m) => m.weight)
    .filter(Boolean)
    .reverse();
  if (weights.length < 2) return null;

  const latest = weights[weights.length - 1];
  const earliest = weights[0];
  const delta = (latest - earliest).toFixed(1);
  const unit = latest > 100 ? "lbs" : "kg";
  const trendUp = delta > 0;

  const min = Math.min(...weights) - 0.5;
  const max = Math.max(...weights) + 0.5;
  const pts = weights.map((v, i) => [
    (i / (weights.length - 1)) * 232 + 4,
    56 - ((v - min) / (max - min)) * 48,
  ]);
  const s = pts.map((p) => p.join(",")).join(" ");

  return (
    <Box title="WEIGHT.90D" padding="14px 16px">
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 18,
          color: theme.accentHot,
          textShadow: glowFn(theme, tweaks.glow * 0.6),
        }}
      >
        {latest.toFixed(1)}
        <span style={{ fontSize: 10, color: theme.accentDim }}> {unit}</span>
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          color: trendUp ? STATUS.amber : theme.accent,
          marginBottom: 4,
        }}
      >
        {trendUp ? "↑" : "↓"} {Math.abs(delta)} last 90d
      </div>
      <svg viewBox="0 0 240 64" width="100%" height="56" preserveAspectRatio="none">
        <defs>
          <linearGradient id="hw-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={theme.accent} stopOpacity="0.3" />
            <stop offset="1" stopColor={theme.accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`${s} 236,64 4,64`} fill="url(#hw-area)" stroke="none" />
        <polyline points={s} fill="none" stroke={theme.accent} strokeWidth="1.4" />
        <circle
          cx={pts[pts.length - 1][0]}
          cy={pts[pts.length - 1][1]}
          r="3"
          fill={theme.accentHot}
        />
      </svg>
    </Box>
  );
}

function RunMiniChart({ runHistory, theme, tweaks }) {
  const weeks = (runHistory || []).slice(-12);
  if (!weeks.length) return null;

  const maxKm = Math.max(...weeks.map((w) => w.total_km), 1);
  const latest = weeks[weeks.length - 1];
  const prev = weeks.length > 1 ? weeks[weeks.length - 2] : null;
  const delta = prev ? (latest.total_km - prev.total_km).toFixed(1) : null;

  return (
    <Box title="RUN.KM/WK" padding="14px 16px">
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 18,
          color: theme.accentHot,
          textShadow: glowFn(theme, tweaks.glow * 0.6),
        }}
      >
        {latest.total_km.toFixed(1)}
        <span style={{ fontSize: 10, color: theme.accentDim }}> km</span>
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          color: theme.accent,
          marginBottom: 4,
        }}
      >
        this week{delta !== null ? ` · ${delta >= 0 ? "+" : ""}${delta}` : ""}
      </div>
      <svg viewBox="0 0 240 64" width="100%" height="56" preserveAspectRatio="none">
        {weeks.map((w, i) => {
          const h = (w.total_km / maxKm) * 56;
          const isLast = i === weeks.length - 1;
          return (
            <rect
              key={i}
              x={i * 20 + 4}
              y={56 - h}
              width="14"
              height={h}
              fill={isLast ? theme.accentHot : theme.accent}
              opacity={isLast ? 1 : 0.5}
            />
          );
        })}
      </svg>
    </Box>
  );
}

const VGRADE_ORDER = ["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10"];

function ClimbMiniChart({ climbs, theme, tweaks }) {
  const sent = climbs.filter((c) => c.sent);
  const boulderSent = sent.filter((c) => c.climb_type === "boulder" && c.my_grade);
  const totalSent = sent.length;
  const flashCount = climbs.filter((c) => c.flash).length;

  const gradeMap = {};
  boulderSent.forEach((c) => {
    const g = c.my_grade;
    gradeMap[g] = (gradeMap[g] || 0) + 1;
  });

  const grades = Object.keys(gradeMap)
    .filter((g) => VGRADE_ORDER.includes(g))
    .sort((a, b) => VGRADE_ORDER.indexOf(b) - VGRADE_ORDER.indexOf(a))
    .slice(0, 5);

  const maxVal = grades.length ? Math.max(...grades.map((g) => gradeMap[g])) : 1;
  const topGrade = grades[0] || "—";

  const gradeColors = [STATUS.red, STATUS.amber, theme.accent, theme.accent, theme.accentDim];

  return (
    <Box title="CLIMB.GRADES" padding="14px 16px">
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 18,
          color: theme.accentHot,
          textShadow: glowFn(theme, tweaks.glow * 0.6),
        }}
      >
        {totalSent}
        <span style={{ fontSize: 10, color: theme.accentDim }}> sent · {topGrade} max</span>
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          color: theme.accent,
          marginBottom: 6,
        }}
      >
        {flashCount} flash{flashCount !== 1 ? "es" : ""}
      </div>
      {grades.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {grades.map((g, i) => (
            <div key={g} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  color: theme.muted,
                  width: 22,
                }}
              >
                {g}
              </span>
              <div
                style={{
                  height: 7,
                  width: `${(gradeMap[g] / maxVal) * 100}%`,
                  background: gradeColors[i] || theme.accentDim,
                  boxShadow: `0 0 5px ${gradeColors[i] || theme.accentDim}80`,
                  minWidth: 4,
                }}
              />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: theme.muted }}>
                {gradeMap[g]}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: theme.muted }}>
          no boulder data
        </div>
      )}
    </Box>
  );
}

function PortfolioShowcase({ projects, onNav, theme, _tweaks }) {
  const liveProjects = projects.filter((p) => p.live_url).slice(0, 4);
  const displayProjects = liveProjects.length ? liveProjects : projects.slice(0, 4);

  return (
    <Box title={`PORTFOLIO · PUBLIC`} padding="16px 20px">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span
          style={{
            width: 7,
            height: 7,
            background: theme.accent,
            boxShadow: `0 0 6px ${theme.accent}`,
          }}
        />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: theme.cream }}>
          serving <span style={{ color: theme.accentHot }}>nyomnyom</span>
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: theme.muted }}>
          · {projects.length} items · {liveProjects.length} live
        </span>
        <span style={{ flex: 1 }} />
        <button
          onClick={() => onNav("portfolio")}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            padding: "5px 12px",
            background: "transparent",
            color: theme.cream,
            border: `1px solid ${theme.borderHi}`,
            cursor: "pointer",
            letterSpacing: "0.06em",
          }}
        >
          manage ›
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 8,
        }}
      >
        {displayProjects.map((p) => {
          const initial = (p.title || "?")[0].toUpperCase();
          const isLive = !!p.live_url;
          const patId = `pp-${p.id}`;
          return (
            <div
              key={p.id}
              style={{
                background: theme.surface2,
                border: `1px solid ${theme.border}`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: 52,
                  position: "relative",
                  borderBottom: `1px solid ${theme.border}`,
                }}
              >
                <svg viewBox="0 0 200 52" width="100%" height="100%" preserveAspectRatio="none">
                  <defs>
                    <pattern id={patId} patternUnits="userSpaceOnUse" width="6" height="6">
                      <line x1="0" y1="0" x2="6" y2="6" stroke={theme.border} strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="200" height="52" fill={`url(#${patId})`} />
                  <text
                    x="100"
                    y="38"
                    textAnchor="middle"
                    fontSize="28"
                    fontFamily="JetBrains Mono, monospace"
                    fill={theme.accentDim}
                    fontWeight="700"
                    opacity="0.6"
                  >
                    {initial}
                  </text>
                </svg>
                <span
                  style={{
                    position: "absolute",
                    top: 5,
                    right: 5,
                    fontFamily: "var(--font-mono)",
                    fontSize: 8,
                    color: isLive ? theme.accent : STATUS.amber,
                    padding: "1px 4px",
                    border: `1px solid ${isLive ? theme.accent : STATUS.amber}`,
                    letterSpacing: "0.1em",
                    background: theme.bg,
                  }}
                >
                  ● {isLive ? "LIVE" : "WIP"}
                </span>
              </div>
              <div style={{ padding: "8px 10px" }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: theme.cream,
                    fontWeight: 600,
                  }}
                >
                  {p.title.length > 14 ? p.title.slice(0, 13) + "…" : p.title}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    color: theme.accent,
                    marginTop: 2,
                  }}
                >
                  {(p.tech_stack || "").split(",")[0]?.trim() || "project"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Box>
  );
}

function AlertsPanel({ expenses, categories, hydroLatest, jobs, theme, _tweaks }) {
  const mo = new Date().toISOString().slice(0, 7);
  const alerts = useMemo(() => {
    const list = [];
    // Over-budget categories
    categories.forEach((cat) => {
      if (!cat.budget) return;
      const spent = expenses
        .filter((e) => e.category_id === cat.id && e.date?.startsWith(mo))
        .reduce((s, e) => s + e.amount, 0);
      if (spent > cat.budget)
        list.push({
          c: STATUS.red,
          sym: "!",
          label: cat.name,
          msg: `+$${(spent - cat.budget).toFixed(0)} over`,
        });
    });
    // Hydro out of range
    if (hydroLatest?.ph != null && (hydroLatest.ph < 5.8 || hydroLatest.ph > 6.4)) {
      list.push({
        c: STATUS.amber,
        sym: "!",
        label: "hydro",
        msg: `pH ${hydroLatest.ph.toFixed(1)} out of range`,
      });
    }
    if (hydroLatest?.water_level != null && hydroLatest.water_level < 30) {
      list.push({
        c: STATUS.red,
        sym: "!",
        label: "hydro",
        msg: `water low ${hydroLatest.water_level.toFixed(0)}%`,
      });
    }
    // Job interviews
    const interviewing = jobs.filter((j) => j.status === "interviewing");
    if (interviewing.length > 0) {
      list.push({
        c: STATUS.amber,
        sym: "?",
        label: interviewing[0].company || "job",
        msg: "interview active",
      });
    }
    // Offers
    const offers = jobs.filter((j) => j.status === "offer");
    if (offers.length > 0) {
      list.push({
        c: theme.accentHot,
        sym: "!",
        label: offers[0].company || "offer",
        msg: "pending decision",
      });
    }
    // OK status
    list.push({ c: theme.accent, sym: "✓", label: "sync", msg: "2m ago" });
    return list.slice(0, 6);
  }, [expenses, categories, hydroLatest, jobs, mo, theme]);

  return (
    <Box title="ALERTS" padding="14px 16px">
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: theme.cream,
          lineHeight: 1.8,
        }}
      >
        {alerts.map((a, i) => (
          <div key={i}>
            [<span style={{ color: a.c }}>{a.sym}</span>] {a.label.padEnd(8)}{" "}
            <span style={{ color: a.c }}>{a.msg}</span>
          </div>
        ))}
      </div>
    </Box>
  );
}

function ReplPanel({ expenses, workouts, climbs, runs, theme, _tweaks }) {
  const entries = useMemo(() => {
    const list = [];
    const today = new Date().toISOString().slice(0, 10);

    // Today's expenses
    expenses
      .filter((e) => e.date === today)
      .slice(0, 3)
      .forEach((e) => {
        list.push({ t: "spend", m: `${e.merchant || "expense"} · $${e.amount.toFixed(2)}` });
      });
    // Today's workouts
    workouts
      .filter((w) => w.date === today)
      .slice(0, 2)
      .forEach((w) => {
        list.push({
          t: "fit",
          m: `${w.name || "workout"} · ${w.duration ? w.duration + " min" : "—"}`,
        });
      });
    // Today's climbs
    climbs
      .filter((c) => c.date === today)
      .slice(0, 2)
      .forEach((c) => {
        list.push({ t: "climb", m: `${c.name || "climb"} · ${c.sent ? "sent" : "attempt"}` });
      });
    // Today's runs
    runs
      .filter((r) => r.date === today)
      .slice(0, 1)
      .forEach((r) => {
        list.push({ t: "run", m: `${r.distance_km?.toFixed(1)}km run` });
      });

    list.sort(() => Math.random() - 0.5);
    return list.length ? list : [{ t: "sys", m: "no activity logged today" }];
  }, [expenses, workouts, climbs, runs]);

  return (
    <Box
      title="REPL"
      padding="14px 16px"
      style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: theme.cream,
          lineHeight: 1.8,
          flex: 1,
          overflow: "auto",
        }}
      >
        <div>
          <span style={{ color: theme.accent }}>$</span> cat today.log
        </div>
        <div style={{ color: theme.muted }}>{"─".repeat(25)}</div>
        {entries.map((e, i) => (
          <div key={i}>
            <span style={{ color: theme.accent }}>{e.t.padEnd(5)}</span>
            {"  "}
            {e.m}
          </div>
        ))}
        <div style={{ color: theme.muted }}>{"─".repeat(25)}</div>
        <div>
          <span style={{ color: theme.accent }}>$ </span>
          <span style={{ background: theme.accent, color: theme.bg, padding: "0 4px" }}>_</span>
        </div>
      </div>
    </Box>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "good morning";
  if (h < 18) return "good afternoon";
  return "good evening";
}

export default function Home({ username, onNav }) {
  const { theme, tweaks } = useTheme();
  const bp = useBreakpoint();
  const mono = { fontFamily: "var(--font-mono)" };

  const { expenses, categories, profile } = useApp();
  const { jobs } = useJob();
  const { workouts, metrics, history, runs, runHistory } = useFitness();
  const { climbs } = useClimbing();
  const { projects: devProjects, kanbanTasks } = useDevProjects();
  const { latest: hydroLatest, plants: hydroPlants } = useHydro();
  const { projects: portfolioProjects } = usePortfolio();

  const currency = profile.currency || "$";
  const mo = new Date().toISOString().slice(0, 7);

  // Spending stats
  const thisMonthExp = expenses.filter((e) => e.date?.startsWith(mo));
  const totalSpent = thisMonthExp.reduce((s, e) => s + e.amount, 0);
  const totalBudget = categories.reduce((s, c) => s + (c.budget || 0), 0);
  const budgetPct = totalBudget > 0 ? Math.min(200, (totalSpent / totalBudget) * 100) : 0;
  const overBudget = totalBudget > 0 && totalSpent > totalBudget;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - new Date().getDate();

  // 30-day daily totals for area chart
  const spendingChartData = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const v = expenses.filter((e) => e.date === ds).reduce((s, e) => s + e.amount, 0);
      days.push({ v, lbl: ds.slice(5) });
    }
    return days;
  }, [expenses]);

  // Prev month comparison
  const prevMo = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  })();
  const prevMonthExp = expenses.filter((e) => e.date?.startsWith(prevMo));
  const prevSpent = prevMonthExp.reduce((s, e) => s + e.amount, 0);
  const vsPrev = prevSpent > 0 ? (((totalSpent - prevSpent) / prevSpent) * 100).toFixed(0) : null;

  // Jobs
  const activeJobs = jobs.filter((j) => !["rejected", "withdrawn"].includes(j.status));
  const interviewing = jobs.filter((j) => j.status === "interviewing").length;
  const offers = jobs.filter((j) => j.status === "offer").length;

  // Fitness
  const latestWeight = metrics[0]?.weight;
  const workoutsThisMonth = workouts.filter((w) => w.date?.startsWith(mo)).length;
  const runKm = runs
    .filter((r) => r.date?.startsWith(mo))
    .reduce((s, r) => s + (r.distance_km || 0), 0);

  // Climbing
  const sentCount = climbs.filter((c) => c.sent).length;
  const thisMonthClimbs = climbs.filter((c) => c.date?.startsWith(mo)).length;

  // Projects
  const inProgress = kanbanTasks.filter((t) => t.status === "in_progress").length;
  const activeDevProjects = devProjects.filter((p) => p.status === "active").length;

  // Hydro
  const activePlants = hydroPlants.filter((p) => p.active).length;
  const phOk = hydroLatest?.ph != null && hydroLatest.ph >= 5.8 && hydroLatest.ph <= 6.4;

  // Sections grid
  const SECTION_META = [
    {
      id: "spending",
      ic: "coins",
      key: "1",
      label: "SPENDING",
      v: totalSpent > 0 ? `${currency}${totalSpent.toFixed(0)}` : "—",
      sub: totalBudget > 0 ? `${budgetPct.toFixed(0)}% budget` : "no budget",
      hot: overBudget || budgetPct > 80,
    },
    {
      id: "jobs",
      ic: "briefcase",
      key: "2",
      label: "JOBS",
      v: activeJobs.length > 0 ? String(activeJobs.length) : "—",
      sub:
        offers > 0
          ? `${offers} offer`
          : interviewing > 0
            ? `${interviewing} interview`
            : "pipeline",
      hot: offers > 0 || interviewing > 0,
    },
    {
      id: "fitness",
      ic: "fitness",
      key: "3",
      label: "FITNESS",
      v: latestWeight ? `${latestWeight}` : workoutsThisMonth > 0 ? String(workoutsThisMonth) : "—",
      sub: latestWeight ? "current wt" : "workouts",
      hot: false,
    },
    {
      id: "portfolio",
      ic: "portfolio",
      key: "4",
      label: "PORTFOLIO",
      v: portfolioProjects.length > 0 ? String(portfolioProjects.length) : "—",
      sub: `${portfolioProjects.filter((p) => p.live_url).length} live`,
      hot: false,
    },
    {
      id: "climbing",
      ic: "climb",
      key: "5",
      label: "CLIMBING",
      v: sentCount > 0 ? String(sentCount) : "—",
      sub: `${thisMonthClimbs} this month`,
      hot: false,
    },
    {
      id: "projects",
      ic: "code",
      key: "6",
      label: "PROJECTS",
      v: inProgress > 0 ? String(inProgress) : "—",
      sub: `${activeDevProjects} active`,
      hot: inProgress === 0 && activeDevProjects > 0,
    },
    {
      id: "hydro",
      ic: "drop",
      key: "7",
      label: "HYDRO",
      v: hydroLatest?.ph != null ? `pH ${hydroLatest.ph.toFixed(1)}` : "—",
      sub: `${activePlants} plant${activePlants !== 1 ? "s" : ""}`,
      hot: !phOk,
    },
  ];

  const dateStr = new Date()
    .toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();

  const isPhone = bp === "phone";
  const isTablet = bp === "tablet";

  return (
    <>
      <style>{`
        @keyframes crt-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
      <div
        style={{
          padding: isPhone ? 12 : 18,
          display: isPhone || isTablet ? "flex" : "grid",
          gridTemplateColumns: isPhone || isTablet ? undefined : "1fr 320px",
          flexDirection: isPhone || isTablet ? "column" : undefined,
          gap: 14,
          height: "100%",
          overflow: "auto",
          ...mono,
        }}
      >
        {/* LEFT / MAIN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {/* Greeting */}
          <Box glowing padding="20px 22px">
            <div style={{ fontSize: 11, color: theme.accentDim, letterSpacing: "0.16em" }}>
              {`// SESSION · ${dateStr}`}
            </div>
            <div
              style={{
                fontSize: isPhone ? 22 : 30,
                color: theme.accentHot,
                marginTop: 6,
                lineHeight: 1.1,
                textShadow: glowFn(theme, tweaks.glow * 1.2),
              }}
            >
              &gt; {greeting()}, {username || "user"}
              <BlinkingCursor theme={theme} />
            </div>
            <div style={{ fontSize: 12, color: theme.cream, marginTop: 6 }}>
              <span style={{ color: theme.muted }}>summary:</span>{" "}
              {overBudget ? <span style={{ color: STATUS.amber }}>over budget</span> : "on track"}
              {interviewing > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <span style={{ color: STATUS.amber }}>
                    {interviewing} interview{interviewing > 1 ? "s" : ""}
                  </span>
                </>
              )}
              {" · "}
              <span style={{ color: theme.accent }}>
                {currency}
                {totalSpent.toFixed(0)}
              </span>{" "}
              spent
              {" · last sync "}
              <span style={{ color: theme.accent }}>just now</span>
            </div>
          </Box>

          {/* Stats row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isPhone ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
              gap: 10,
            }}
          >
            <StatTile
              label="NET·MAY"
              value={`${totalSpent > 0 ? "-" : "+"}${currency}${Math.abs(totalSpent - (totalBudget || totalSpent)).toFixed(0)}`}
              sub={
                vsPrev !== null
                  ? `${vsPrev >= 0 ? "+" : ""}${vsPrev}% vs last mo`
                  : `${budgetPct.toFixed(0)}% used`
              }
              hot={!overBudget && totalBudget > 0}
              warn={overBudget}
            />
            <StatTile
              label="WORKOUTS"
              value={workoutsThisMonth || "—"}
              sub={runKm > 0 ? `${runKm.toFixed(0)} km run` : "this month"}
            />
            <StatTile
              label="CLIMBS"
              value={sentCount || "—"}
              sub={`${thisMonthClimbs} this month`}
            />
            <StatTile
              label={hydroLatest ? "TANK·1" : "JOBS"}
              value={
                hydroLatest ? `pH ${hydroLatest.ph?.toFixed(1) ?? "—"}` : activeJobs.length || "—"
              }
              sub={hydroLatest ? (phOk ? "stable" : "check") : `${offers} offer`}
              hot={!hydroLatest ? offers > 0 : phOk}
              warn={hydroLatest ? !phOk : false}
            />
          </div>

          {/* Spending chart */}
          <Box title="SPENDING · 30D" padding="18px 20px">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 20,
                    color: theme.accentHot,
                    textShadow: glowFn(theme, tweaks.glow * 0.8),
                  }}
                >
                  {currency}
                  {totalSpent.toFixed(0)}
                  {totalBudget > 0 && (
                    <span style={{ color: theme.muted, fontSize: 12 }}>
                      {" "}
                      / {currency}
                      {totalBudget.toFixed(0)}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: theme.accentDim, marginTop: 3 }}>
                  {budgetPct.toFixed(0)}% used · {daysLeft}d remaining
                  {vsPrev !== null &&
                    ` · ${Number(vsPrev) <= 0 ? "↓" : "↑"}${Math.abs(vsPrev)}% vs last mo`}
                </div>
              </div>
              <button
                onClick={() => onNav("spending")}
                style={{
                  ...mono,
                  fontSize: 11,
                  padding: "5px 12px",
                  background: "transparent",
                  color: theme.cream,
                  border: `1px solid ${theme.borderHi}`,
                  cursor: "pointer",
                }}
              >
                open ›
              </button>
            </div>
            <AreaChart data={spendingChartData} />
          </Box>

          {/* Mini-graph row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isPhone ? "1fr" : "repeat(3, 1fr)",
              gap: 14,
            }}
          >
            <WeightMiniChart history={history} theme={theme} tweaks={tweaks} />
            <RunMiniChart runHistory={runHistory} theme={theme} tweaks={tweaks} />
            <ClimbMiniChart climbs={climbs} theme={theme} tweaks={tweaks} />
          </div>

          {/* Portfolio showcase */}
          {portfolioProjects.length > 0 && (
            <PortfolioShowcase
              projects={portfolioProjects}
              onNav={onNav}
              theme={theme}
              tweaks={tweaks}
            />
          )}

          {/* Sections grid */}
          <Box title="SECTIONS" padding="16px 20px">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isPhone
                  ? "repeat(2, 1fr)"
                  : isTablet
                    ? "repeat(4, 1fr)"
                    : "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 8,
              }}
            >
              {SECTION_META.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onNav(s.id)}
                  style={{
                    padding: "12px 14px",
                    background: theme.surface,
                    border: `1px solid ${s.hot ? theme.accent : theme.borderHi}`,
                    color: theme.cream,
                    textAlign: "left",
                    ...mono,
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.accent;
                    e.currentTarget.style.background = theme.surface2;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = s.hot ? theme.accent : theme.borderHi;
                    e.currentTarget.style.background = theme.surface;
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: theme.muted, fontSize: 10 }}>[{s.key}]</span>
                    <span style={{ flex: 1 }} />
                    {s.hot && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          background: theme.accent,
                          boxShadow: `0 0 6px ${theme.accent}`,
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: theme.cream,
                      marginTop: 8,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      color: s.hot ? theme.accentHot : theme.cream,
                      marginTop: 4,
                      textShadow: s.hot ? glowFn(theme, tweaks.glow * 0.6) : "none",
                    }}
                  >
                    {s.v}
                  </div>
                  <div style={{ fontSize: 9, color: theme.muted, marginTop: 2 }}>{s.sub}</div>
                </button>
              ))}
            </div>
          </Box>
        </div>

        {/* RIGHT column — only on desktop */}
        {!isPhone && !isTablet && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
            <AlertsPanel
              expenses={expenses}
              categories={categories}
              hydroLatest={hydroLatest}
              jobs={jobs}
              theme={theme}
              tweaks={tweaks}
            />
            <ReplPanel
              expenses={expenses}
              workouts={workouts}
              climbs={climbs}
              runs={runs}
              theme={theme}
              tweaks={tweaks}
            />
          </div>
        )}

        {/* Phone: snapshots below sections */}
        {(isPhone || isTablet) && hydroLatest && (
          <Box title="HYDRO · LIVE">
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[
                ["pH", hydroLatest.ph?.toFixed(1) ?? "—", phOk],
                ["EC", hydroLatest.ec_ppm?.toFixed(0) ?? "—", true],
                [
                  "H₂O",
                  hydroLatest.water_level != null ? hydroLatest.water_level.toFixed(0) + "%" : "—",
                  hydroLatest.water_level > 30,
                ],
                [
                  "TEMP",
                  hydroLatest.water_temp != null ? hydroLatest.water_temp.toFixed(1) + "°C" : "—",
                  true,
                ],
              ].map(([k, v, ok]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.12em" }}>
                    {k}
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      color: ok ? theme.accentHot : STATUS.amber,
                      lineHeight: 1.1,
                    }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </Box>
        )}
      </div>
    </>
  );
}
