import { useTheme, glow as glowFn, STATUS } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { useJob } from "../context/JobContext";
import { useFitness } from "../context/FitnessContext";
import { useClimbing } from "../context/ClimbingContext";
import { useDevProjects } from "../context/ProjectsContext";
import { useHydro } from "../context/HydroContext";
import Box from "../components/crt/Box";
import BlockBar from "../components/crt/BlockBar";

function StatTile({ label, value, unit = "", hot = false, warn = false }) {
  const { theme, tweaks } = useTheme();
  const color = warn ? STATUS.amber : hot ? theme.accentHot : theme.cream;
  return (
    <div
      style={{
        padding: "12px 16px",
        background: theme.surface,
        border: `1px solid ${theme.borderHi}`,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: theme.muted,
          letterSpacing: "0.14em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 28,
          color,
          lineHeight: 1,
          textShadow: hot ? glowFn(theme, tweaks.glow * 0.8) : "none",
        }}
      >
        {value}
        {unit && <span style={{ fontSize: 13, color: theme.muted, marginLeft: 4 }}>{unit}</span>}
      </div>
    </div>
  );
}

export default function Home({ username, onNav }) {
  const { theme, tweaks } = useTheme();

  // pull live data from all contexts
  const { expenses, categories, profile } = useApp();
  const { jobs } = useJob();
  const { workouts, metrics, runs } = useFitness();
  const { climbs } = useClimbing();
  const { projects: devProjects, kanbanTasks } = useDevProjects();
  const { latest: hydroLatest, plants: hydroPlants } = useHydro();

  const currency = profile.currency || "$";
  const mo = new Date().toISOString().slice(0, 7);

  // spending stats
  const thisMonthExp = expenses.filter((e) => e.date?.startsWith(mo));
  const totalSpent = thisMonthExp.reduce((s, e) => s + e.amount, 0);
  const totalBudget = categories.reduce((s, c) => s + (c.budget || 0), 0);
  const budgetPct = totalBudget > 0 ? Math.min(200, (totalSpent / totalBudget) * 100) : 0;
  const overBudget = totalBudget > 0 && totalSpent > totalBudget;

  // jobs stats
  const activeJobs = jobs.filter((j) => !["rejected", "withdrawn"].includes(j.status));
  const interviewing = jobs.filter((j) => j.status === "interviewing").length;
  const offers = jobs.filter((j) => j.status === "offer").length;

  // fitness stats
  const latestWeight = metrics[0]?.weight;
  const workoutsThisMonth = workouts.filter((w) => w.date?.startsWith(mo)).length;
  const runKm = runs.filter((r) => r.date?.startsWith(mo)).reduce((s, r) => s + r.distance_km, 0);

  // climbing stats
  const sentCount = climbs.filter((c) => c.sent).length;
  const thisMonthC = climbs.filter((c) => c.date?.startsWith(mo)).length;

  // projects stats
  const inProgress = kanbanTasks.filter((t) => t.status === "in_progress").length;
  const activeProjects = devProjects.filter((p) => p.status === "active").length;

  // hydro
  const activePlants = hydroPlants.filter((p) => p.active).length;

  // sections grid row
  const sectionStats = [
    {
      id: "spending",
      v: totalSpent > 0 ? `${currency}${totalSpent.toFixed(0)}` : "—",
      sub: totalBudget > 0 ? `${budgetPct.toFixed(0)}% budget` : "no budget",
    },
    {
      id: "jobs",
      v: activeJobs.length > 0 ? String(activeJobs.length) : "—",
      sub:
        offers > 0
          ? `${offers} offer`
          : interviewing > 0
            ? `${interviewing} interviewing`
            : "pipeline",
    },
    {
      id: "fitness",
      v: latestWeight ? `${latestWeight}` : workoutsThisMonth > 0 ? String(workoutsThisMonth) : "—",
      sub: latestWeight ? "lbs" : "workouts",
    },
    {
      id: "portfolio",
      v: devProjects.length > 0 ? String(devProjects.length) : "—",
      sub: "projects",
    },
    { id: "climbing", v: sentCount > 0 ? String(sentCount) : "—", sub: `${thisMonthC} this month` },
    {
      id: "projects",
      v: inProgress > 0 ? String(inProgress) : "—",
      sub: `${activeProjects} active`,
    },
    {
      id: "hydro",
      v: hydroLatest?.ph != null ? hydroLatest.ph.toFixed(1) : "—",
      sub: `${activePlants} plants`,
    },
  ];

  return (
    <div
      style={{
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        height: "100%",
        overflow: "auto",
        fontFamily: "var(--font-mono)",
      }}
    >
      {/* Greeting */}
      <Box glowing padding="18px 24px">
        <div style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.18em", marginBottom: 8 }}>
          {"// SYSTEM · LIVE"}
        </div>
        <div
          style={{
            fontSize: 32,
            color: theme.accentHot,
            lineHeight: 1.1,
            textShadow: glowFn(theme, tweaks.glow * 1.2),
          }}
        >
          &gt; hello, {username || "user"}
        </div>
        <div style={{ fontSize: 12, color: theme.accentDim, marginTop: 8 }}>
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </Box>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <StatTile
          label="SPENT THIS MONTH"
          value={`${currency}${totalSpent.toFixed(0)}`}
          hot={!overBudget}
          warn={overBudget}
        />
        <StatTile label="ACTIVE JOBS" value={activeJobs.length} hot />
        <StatTile label="WORKOUTS THIS MONTH" value={workoutsThisMonth} hot />
        <StatTile label="CLIMBS SENT" value={sentCount} hot />
      </div>

      {/* Spending budget bar */}
      {totalBudget > 0 && (
        <Box title="BUDGET · THIS MONTH" padding="14px 18px">
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: theme.cream }}>
              {currency}
              {totalSpent.toFixed(0)} / {currency}
              {totalBudget.toFixed(0)}
            </span>
            <span style={{ fontSize: 11, color: overBudget ? STATUS.red : theme.muted }}>
              {overBudget ? "OVER BUDGET" : `${(totalBudget - totalSpent).toFixed(0)} remaining`}
            </span>
          </div>
          <BlockBar value={totalSpent} max={totalBudget} width={48} over={overBudget} />
        </Box>
      )}

      {/* Sections grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginTop: 4 }}>
        {sectionStats.map((s) => (
          <button
            key={s.id}
            onClick={() => onNav(s.id)}
            style={{
              padding: "14px 12px",
              background: theme.surface,
              border: `1px solid ${theme.borderHi}`,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              transition: "border-color 0.1s, background 0.1s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.accent;
              e.currentTarget.style.background = theme.surface2;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.borderHi;
              e.currentTarget.style.background = theme.surface;
            }}
          >
            <div style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.14em" }}>
              {s.id.toUpperCase()}
            </div>
            <div
              style={{
                fontSize: 24,
                color: theme.accentHot,
                lineHeight: 1,
                textShadow: glowFn(theme, tweaks.glow * 0.6),
                fontWeight: 600,
              }}
            >
              {s.v}
            </div>
            <div style={{ fontSize: 10, color: theme.accentDim }}>{s.sub}</div>
          </button>
        ))}
      </div>

      {/* Hydro mini card if live */}
      {hydroLatest && (
        <Box title="HYDRO · LIVE">
          <div style={{ display: "flex", gap: 28 }}>
            {[
              [
                "pH",
                hydroLatest.ph?.toFixed(1) ?? "—",
                hydroLatest.ph >= 5.8 && hydroLatest.ph <= 6.4,
              ],
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
                <div style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.12em" }}>{k}</div>
                <div
                  style={{
                    fontSize: 22,
                    color: ok ? theme.accentHot : STATUS.amber,
                    lineHeight: 1.1,
                    textShadow: ok ? glowFn(theme, tweaks.glow * 0.5) : "none",
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
            <div
              style={{
                marginLeft: "auto",
                fontSize: 10,
                color: theme.muted,
                alignSelf: "flex-end",
              }}
            >
              {activePlants} plant{activePlants !== 1 ? "s" : ""} active
            </div>
          </div>
        </Box>
      )}

      {/* Jobs snapshot */}
      {jobs.length > 0 && (
        <Box title="JOBS · PIPELINE">
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              ["APPLIED", jobs.filter((j) => j.status === "applied").length, theme.muted],
              ["SCREENING", jobs.filter((j) => j.status === "screening").length, STATUS.amber],
              [
                "INTERVIEWING",
                jobs.filter((j) => j.status === "interviewing").length,
                theme.accent,
              ],
              ["OFFERS", jobs.filter((j) => j.status === "offer").length, theme.accentHot],
              ["REJECTED", jobs.filter((j) => j.status === "rejected").length, STATUS.red],
            ].map(([label, count, color]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.12em" }}>
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    color,
                    lineHeight: 1,
                    textShadow: count > 0 ? `0 0 8px ${color}80` : "none",
                  }}
                >
                  {count}
                </div>
              </div>
            ))}
          </div>
        </Box>
      )}

      {/* Run distance this month */}
      {runKm > 0 && (
        <Box title="RUNNING · THIS MONTH">
          <div
            style={{
              fontSize: 28,
              color: theme.accentHot,
              textShadow: glowFn(theme, tweaks.glow * 0.8),
            }}
          >
            {runKm.toFixed(1)}
            <span style={{ fontSize: 13, color: theme.muted, marginLeft: 4 }}>km</span>
          </div>
        </Box>
      )}
    </div>
  );
}
