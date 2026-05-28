import { useState, useEffect, useRef } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { JobProvider, useJob } from "./context/JobContext";
import { FitnessProvider, useFitness } from "./context/FitnessContext";
import { PortfolioProvider, usePortfolio } from "./context/PortfolioContext";
import { ClimbingProvider, useClimbing } from "./context/ClimbingContext";
import { ProjectsProvider, useDevProjects } from "./context/ProjectsContext";
import { HydroProvider, useHydro } from "./context/HydroContext";

import Dashboard from "./screens/spending/Dashboard";
import Graphs from "./screens/spending/Graphs";
import Categories from "./screens/spending/Categories";
import Applications from "./screens/jobs/Applications";
import Contacts from "./screens/jobs/Contacts";
import Workouts from "./screens/fitness/Workouts";
import BodyMetrics from "./screens/fitness/BodyMetrics";
import Runs from "./screens/fitness/Runs";
import Projects from "./screens/portfolio/Projects";
import Skills from "./screens/portfolio/Skills";
import Experience from "./screens/portfolio/Experience";
import About from "./screens/portfolio/About";
import Climbs from "./screens/climbing/Climbs";
import DevProjects from "./screens/projects/DevProjects";
import KanbanScreen from "./screens/projects/KanbanScreen";
import HydroDashboard from "./screens/hydro/Dashboard";
import HydroHistory from "./screens/hydro/History";
import HydroPlants from "./screens/hydro/Plants";
import HydroDosing from "./screens/hydro/Dosing";
import Profile from "./screens/Profile";
import SignIn from "./screens/SignIn";
import PublicPortfolio from "./screens/PublicPortfolio";
import { apiFetch, getInitials } from "./utils";
import { Px, IClose, IArrowLeft, IChevDown } from "./icons";

/*
 * All positions are in a 1000×600 viewBox with preserveAspectRatio="none".
 * SVG coord (x,y) → CSS left: x/10 %, top: y/6 % — guaranteed alignment.
 *
 * Single mountain path switchbacks (base → fitness → jobs → portfolio → climbing → spending):
 * M 380 450  Q 250 420 120 340   ← fitness
 *            Q 200 305 260 255   ← jobs
 *            Q 230 215 200 180   ← portfolio
 *            Q 290 200 380 230   ← climbing
 *            Q 320 165 290 100   ← spending
 */
/* Projects spur: M 380 450 Q 410 395 430 340 (right from base)
 * Right face at x=430: y=275; point y=340 > 275 ✓
 * Hydro spur: M 380 450 Q 450 435 490 410 (further right/lower)
 * Right face at x=490: y=365; point y=410 > 365 ✓
 * Control (450,435): right face at x=450: y=305; 435 > 305 ✓
 */
const FULL_PATH =
  "M 380 450 Q 410 395 430 340 M 380 450 Q 450 435 490 410 M 380 450 Q 250 420 120 340 Q 200 305 260 255 Q 230 215 200 180 Q 290 200 380 230 Q 320 165 290 100";

const SECTIONS = {
  spending: {
    accent: "#e07b3a",
    glow: "rgba(224,123,58,0.5)",
    dim: "rgba(224,123,58,0.15)",
    label: "▶ SPENDING BASE CAMP",
    icon: "coins",
    pos: { left: "29%", top: "16.7%" },
    pathTo: FULL_PATH,
    routeActive: "rgba(224,123,58,0.9)",
    items: [
      { id: "dashboard", label: "DASHBOARD" },
      { id: "graphs", label: "GRAPHS" },
      { id: "categories", label: "CATEGORIES" },
    ],
  },
  jobs: {
    accent: "#4ab87a",
    glow: "rgba(74,184,122,0.5)",
    dim: "rgba(74,184,122,0.15)",
    label: "▶ JOBS BASE CAMP",
    icon: "briefcase",
    pos: { left: "26%", top: "42.5%" },
    pathTo: "M 380 450 Q 250 420 120 340 Q 200 305 260 255",
    routeActive: "rgba(74,184,122,0.9)",
    items: [
      { id: "jobs-applications", label: "APPLICATIONS" },
      { id: "jobs-contacts", label: "CONTACTS" },
    ],
  },
  fitness: {
    accent: "#5a9ed4",
    glow: "rgba(90,158,212,0.5)",
    dim: "rgba(90,158,212,0.15)",
    label: "▶ FITNESS BASE CAMP",
    icon: "human-arms-up",
    pos: { left: "12%", top: "56.7%" },
    pathTo: "M 380 450 Q 250 420 120 340",
    routeActive: "rgba(90,158,212,0.9)",
    items: [
      { id: "fitness-workouts", label: "WORKOUTS" },
      { id: "fitness-runs", label: "RUNNING" },
      { id: "fitness-metrics", label: "BODY METRICS" },
    ],
  },
  portfolio: {
    accent: "#b87ad4",
    glow: "rgba(184,122,212,0.5)",
    dim: "rgba(184,122,212,0.15)",
    label: "▶ PORTFOLIO BASE CAMP",
    icon: "globe",
    pos: { left: "20%", top: "30%" },
    pathTo: "M 380 450 Q 250 420 120 340 Q 200 305 260 255 Q 230 215 200 180",
    routeActive: "rgba(184,122,212,0.9)",
    items: [
      { id: "portfolio-projects", label: "PROJECTS" },
      { id: "portfolio-skills", label: "SKILLS" },
      { id: "portfolio-experience", label: "EXPERIENCE" },
      { id: "portfolio-about", label: "ABOUT" },
    ],
  },
  climbing: {
    accent: "#d4a040",
    glow: "rgba(212,160,64,0.5)",
    dim: "rgba(212,160,64,0.15)",
    label: "▶ CLIMBING BASE CAMP",
    icon: "arrow-up-box",
    pos: { left: "38%", top: "38.3%" },
    pathTo: "M 380 450 Q 250 420 120 340 Q 200 305 260 255 Q 230 215 200 180 Q 290 200 380 230",
    routeActive: "rgba(212,160,64,0.9)",
    items: [{ id: "climbing-routes", label: "ROUTES" }],
  },
  projects: {
    accent: "#40c4c4",
    glow: "rgba(64,196,196,0.5)",
    dim: "rgba(64,196,196,0.15)",
    label: "▶ PROJECTS BASE CAMP",
    icon: "terminal",
    pos: { left: "43%", top: "56.7%" },
    pathTo: "M 380 450 Q 410 395 430 340",
    routeActive: "rgba(64,196,196,0.9)",
    items: [
      { id: "projects-tracker", label: "PROJECTS" },
      { id: "projects-board", label: "BOARD" },
    ],
  },
  hydro: {
    accent: "#2eb8a0",
    glow: "rgba(46,184,160,0.5)",
    dim: "rgba(46,184,160,0.15)",
    label: "▶ HYDROPONICS BASE CAMP",
    icon: "droplet",
    pos: { left: "49%", top: "68.3%" },
    pathTo: "M 380 450 Q 450 435 490 410",
    routeActive: "rgba(46,184,160,0.9)",
    items: [
      { id: "hydro-dashboard", label: "DASHBOARD" },
      { id: "hydro-history", label: "HISTORY" },
      { id: "hydro-plants", label: "PLANTS" },
      { id: "hydro-dosing", label: "DOSING" },
    ],
  },
};

const SCREEN_TO_SECTION = {
  dashboard: "spending",
  graphs: "spending",
  categories: "spending",
  "jobs-applications": "jobs",
  "jobs-contacts": "jobs",
  "fitness-workouts": "fitness",
  "fitness-runs": "fitness",
  "fitness-metrics": "fitness",
  "portfolio-projects": "portfolio",
  "portfolio-skills": "portfolio",
  "portfolio-experience": "portfolio",
  "portfolio-about": "portfolio",
  "climbing-routes": "climbing",
  "projects-tracker": "projects",
  "projects-board": "projects",
  "hydro-dashboard": "hydro",
  "hydro-history": "hydro",
  "hydro-plants": "hydro",
  "hydro-dosing": "hydro",
};

const SECTION_DEFAULT = {
  spending: "dashboard",
  jobs: "jobs-applications",
  fitness: "fitness-workouts",
  portfolio: "portfolio-projects",
  climbing: "climbing-routes",
  projects: "projects-tracker",
  hydro: "hydro-dashboard",
};

const SECTION_ORDER = ["spending", "jobs", "fitness", "portfolio", "climbing", "projects", "hydro"];

const COMMANDS = [
  { cmd: "spending", screen: "dashboard", fire: false, label: "Spending → Dashboard" },
  { cmd: "spending/new", screen: "dashboard", fire: true, label: "Spending → Add Expense" },
  {
    cmd: "spending/new-income",
    screen: "dashboard",
    fire: true,
    event: "shortcut:new-income",
    label: "Spending → Add Income",
  },
  { cmd: "spending/graphs", screen: "graphs", fire: false, label: "Spending → Graphs" },
  { cmd: "spending/categories", screen: "categories", fire: false, label: "Spending → Categories" },
  {
    cmd: "spending/categories/new",
    screen: "categories",
    fire: true,
    label: "Spending → New Category",
  },
  { cmd: "jobs", screen: "jobs-applications", fire: false, label: "Jobs → Applications" },
  { cmd: "jobs/new", screen: "jobs-applications", fire: true, label: "Jobs → Add Application" },
  { cmd: "jobs/contacts", screen: "jobs-contacts", fire: false, label: "Jobs → Contacts" },
  { cmd: "jobs/contacts/new", screen: "jobs-contacts", fire: true, label: "Jobs → Add Contact" },
  { cmd: "fitness", screen: "fitness-workouts", fire: false, label: "Fitness → Workouts" },
  { cmd: "fitness/new", screen: "fitness-workouts", fire: true, label: "Fitness → Log Workout" },
  { cmd: "fitness/runs", screen: "fitness-runs", fire: false, label: "Fitness → Running" },
  { cmd: "fitness/runs/new", screen: "fitness-runs", fire: true, label: "Fitness → Log Run" },
  {
    cmd: "fitness/metrics",
    screen: "fitness-metrics",
    fire: false,
    label: "Fitness → Body Metrics",
  },
  { cmd: "portfolio", screen: "portfolio-projects", fire: false, label: "Portfolio → Projects" },
  {
    cmd: "portfolio/projects",
    screen: "portfolio-projects",
    fire: false,
    label: "Portfolio → Projects",
  },
  { cmd: "portfolio/skills", screen: "portfolio-skills", fire: false, label: "Portfolio → Skills" },
  {
    cmd: "portfolio/experience",
    screen: "portfolio-experience",
    fire: false,
    label: "Portfolio → Experience",
  },
  { cmd: "portfolio/about", screen: "portfolio-about", fire: false, label: "Portfolio → About" },
  { cmd: "climbing", screen: "climbing-routes", fire: false, label: "Climbing → Routes" },
  { cmd: "climbing/new", screen: "climbing-routes", fire: true, label: "Climbing → Log Climb" },
  { cmd: "projects", screen: "projects-tracker", fire: false, label: "Projects → Tracker" },
  { cmd: "projects/new", screen: "projects-tracker", fire: true, label: "Projects → New Project" },
  { cmd: "projects/board", screen: "projects-board", fire: false, label: "Projects → Board" },
  { cmd: "projects/board/new", screen: "projects-board", fire: true, label: "Projects → Add Task" },
  { cmd: "hydro", screen: "hydro-dashboard", fire: false, label: "Hydro → Dashboard" },
  { cmd: "hydro/new", screen: "hydro-dashboard", fire: true, label: "Hydro → Log Reading" },
  { cmd: "hydro/history", screen: "hydro-history", fire: false, label: "Hydro → History" },
  { cmd: "hydro/plants", screen: "hydro-plants", fire: false, label: "Hydro → Plants" },
  { cmd: "hydro/plants/new", screen: "hydro-plants", fire: true, label: "Hydro → Add Plant" },
  { cmd: "hydro/dosing", screen: "hydro-dosing", fire: false, label: "Hydro → Dosing Log" },
  { cmd: "hydro/dosing/new", screen: "hydro-dosing", fire: true, label: "Hydro → Log Dosing" },
  { cmd: "profile", screen: "profile", fire: false, label: "Profile" },
  { cmd: "logout", screen: "__logout__", fire: false, label: "Logout" },
];

function TerminalLauncher({ onNavigate, onClose, canAccess }) {
  const [query, setQuery] = useState("");
  const [selIdx, setSelIdx] = useState(0);
  const inputRef = useRef(null);

  const allowedCmds = COMMANDS.filter((c) => {
    const section = c.cmd.split("/")[0];
    return section === "profile" || section === "logout" || canAccess(section);
  });
  const matches =
    query.trim() === ""
      ? allowedCmds
      : allowedCmds.filter((c) => c.cmd.startsWith(query.toLowerCase()));

  useEffect(() => {
    setSelIdx(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelIdx((i) => Math.min(i + 1, matches.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const hit = matches[selIdx] ?? matches[0];
        if (hit) {
          onNavigate(hit.screen, hit.fire);
          onClose();
        }
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const hit = matches[selIdx] ?? matches[0];
        if (hit) setQuery(hit.cmd);
        return;
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [matches, selIdx, onClose, onNavigate]);

  return (
    <div className="term-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="term-box">
        <div className="term-input-row">
          <span className="term-prompt">▶ /</span>
          <input
            ref={inputRef}
            className="term-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="section/command…"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        {matches.length > 0 ? (
          <div className="term-results">
            {matches.slice(0, 8).map((c, i) => (
              <div
                key={c.cmd}
                className={"term-result" + (i === selIdx ? " selected" : "")}
                onMouseEnter={() => setSelIdx(i)}
                onClick={() => {
                  onNavigate(c.screen, c.fire, c.event);
                  onClose();
                }}
              >
                <span className="term-result-cmd">/{c.cmd}</span>
                <span className="term-result-label">{c.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="term-no-match">unknown command</div>
        )}
        <div className="term-hint">ENTER to go · TAB to complete · ESC to cancel</div>
      </div>
    </div>
  );
}

function ShortcutsHelp({ onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" || e.key === "?") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box shortcuts-help">
        <div className="modal-header">
          <span className="modal-title">KEYBOARD SHORTCUTS</span>
          <button className="close-btn" onClick={onClose}>
            <IClose />
          </button>
        </div>
        <table className="shortcuts-table">
          <tbody>
            {[
              ["Esc", "Close modal → return to map"],
              ["Enter", "Submit current form"],
              ["N", "New item in current section"],
              ["← →", "Cycle tabs within a section"],
              ["1 – 6", "Jump to section"],
              ["/", "Open command terminal"],
              ["?", "Toggle this help"],
            ].map(([key, desc]) => (
              <tr key={key}>
                <td>
                  <span className="sk">{key}</span>
                </td>
                <td>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="shortcuts-sections">
          {SECTION_ORDER.map((s, i) => (
            <span key={s}>
              <span className="sk">{i + 1}</span> {s.charAt(0).toUpperCase() + s.slice(1)}
              {i < SECTION_ORDER.length - 1 ? "  ·  " : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stars() {
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !ref.current) return;
    done.current = true;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 160; i++) {
      const el = document.createElement("div");
      el.className = "star";
      const sz = Math.random() * 2.2 + 0.4;
      el.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;opacity:${Math.random() * 0.65 + 0.15}`;
      frag.appendChild(el);
    }
    ref.current.appendChild(frag);
  }, []);
  return <div className="stars" ref={ref} />;
}

function Toasts() {
  const { toast: t1 } = useApp();
  const { toast: t2 } = useJob();
  const { toast: t3 } = useFitness();
  const { toast: t4 } = usePortfolio();
  const { toast: t5 } = useClimbing();
  const { toast: t6 } = useDevProjects();
  const { toast: t7 } = useHydro();
  const msg = t1 || t2 || t3 || t4 || t5 || t6 || t7;
  return <div className={"toast " + (msg ? "show" : "")}>{msg}</div>;
}

function MapSidebar() {
  const { expenses, categories, profile } = useApp();
  const { jobs } = useJob();
  const { metrics, history, workouts, runs } = useFitness();
  const { climbs } = useClimbing();
  const { projects: devProjects, kanbanTasks } = useDevProjects();
  const { latest: hydroLatest, plants: hydroPlants } = useHydro();

  const currency = profile.currency || "$";
  const mo = new Date().toISOString().slice(0, 7);
  const fmtAmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0));

  // ── Spending ─────────────────────────────────────────────────
  const thisMonthExp = expenses.filter((e) => e.date?.startsWith(mo));
  const totalSpent = thisMonthExp.reduce((s, e) => s + e.amount, 0);
  const totalBudget = categories.reduce((s, c) => s + (c.budget || 0), 0);
  const budgetPct = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;
  const catSpend = {};
  thisMonthExp.forEach((e) => {
    if (e.category_id) catSpend[e.category_id] = (catSpend[e.category_id] || 0) + e.amount;
  });
  const topCats = Object.entries(catSpend)
    .map(([id, amt]) => ({ cat: categories.find((c) => c.id === +id), amt }))
    .filter((x) => x.cat)
    .sort((a, b) => b.amt - a.amt)
    .slice(0, 4);
  const maxCatAmt = topCats[0]?.amt || 1;

  // ── Jobs ─────────────────────────────────────────────────────
  const activeJobs = jobs.filter((j) => !["rejected", "withdrawn"].includes(j.status));
  const rejectedCnt = jobs.filter((j) => j.status === "rejected").length;
  const PIPE_STAGES = ["applied", "screening", "interviewing", "offer"];
  const pipelineCounts = PIPE_STAGES.map((s) => ({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    count: jobs.filter((j) => j.status === s).length,
  }));
  const maxPipe = Math.max(...pipelineCounts.map((p) => p.count), 1);

  // ── Fitness ──────────────────────────────────────────────────
  const latestWeight = metrics[0]?.weight;
  const workoutsThisMonth = workouts.filter((w) => w.date?.startsWith(mo)).length;
  const runsThisMonth = runs.filter((r) => r.date?.startsWith(mo));
  const runKmThisMonth = runsThisMonth.reduce((s, r) => s + r.distance_km, 0);
  const sparkPts = [...history].reverse().slice(-16);
  const SW = 400,
    SH = 58;
  let sparkPath = "";
  if (sparkPts.length >= 2) {
    const vals = sparkPts.map((h) => h.weight);
    const lo = Math.min(...vals),
      hi = Math.max(...vals),
      range = hi - lo || 1;
    sparkPath = sparkPts
      .map((h, i) => {
        const x = (i / (sparkPts.length - 1)) * SW;
        const y = SH - 6 - ((h.weight - lo) / range) * (SH - 14);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }

  // ── Climbing ─────────────────────────────────────────────────
  const sentCount = climbs.filter((c) => c.sent).length;
  const flashCount = climbs.filter((c) => c.flash).length;
  const thisMonthC = climbs.filter((c) => c.date?.startsWith(mo)).length;
  const sendRate = climbs.length > 0 ? Math.round((sentCount / climbs.length) * 100) : 0;

  // ── Dev Projects ─────────────────────────────────────────────
  const activeProjects = devProjects.filter((p) => p.status === "active");
  const inProgress = kanbanTasks.filter((t) => t.status === "in_progress").length;
  const doneTasks = kanbanTasks.filter((t) => t.status === "done").length;

  const activePlants = hydroPlants.filter((p) => p.active);
  const showSpending = thisMonthExp.length > 0;
  const showJobs = jobs.length > 0;
  const showFitness = workouts.length > 0 || metrics.length > 0 || runs.length > 0;
  const showClimbing = climbs.length > 0;
  const showProjects = devProjects.length > 0;
  const showHydro = hydroLatest !== null && hydroLatest !== undefined;

  if (!showSpending && !showJobs && !showFitness && !showClimbing && !showProjects && !showHydro)
    return null;

  return (
    <div className="map-sidebar">
      {/* Spending — full width */}
      {showSpending && (
        <div
          className="msb-card msb-wide"
          style={{ "--ca": "#e07b3a", "--cg": "rgba(224,123,58,0.45)" }}
        >
          <div className="msb-head">
            <Px name="coins" size={14} className="msb-icon" />
            <span className="msb-name">SPENDING</span>
            <span className="msb-badge">{thisMonthExp.length} transactions this month</span>
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
            <div>
              <div className="msb-big">
                {currency}
                {totalSpent.toFixed(0)}
                <span className="msb-big-unit"> this month</span>
              </div>
              {totalBudget > 0 && (
                <div className="msb-tiny" style={{ marginTop: 4 }}>
                  {budgetPct.toFixed(0)}% of {currency}
                  {totalBudget.toFixed(0)} budget
                  {totalSpent > totalBudget
                    ? " — over budget"
                    : ` · ${currency}${(totalBudget - totalSpent).toFixed(0)} left`}
                </div>
              )}
            </div>
          </div>
          {totalBudget > 0 && (
            <div className="msb-prog">
              <div
                className="msb-prog-fill"
                style={{
                  width: `${budgetPct.toFixed(1)}%`,
                  background: budgetPct >= 100 ? "#e05a5a" : "var(--ca)",
                }}
              />
            </div>
          )}
          {topCats.length > 0 && (
            <div className="msb-bars">
              {topCats.map(({ cat, amt }) => (
                <div key={cat.id} className="msb-bar-row">
                  <span className="msb-bar-lbl">
                    <Px name={cat.icon} size={11} /> {cat.name}
                  </span>
                  <div className="msb-bar-bg">
                    <div
                      className="msb-bar-fill"
                      style={{ width: `${((amt / maxCatAmt) * 100).toFixed(0)}%` }}
                    />
                  </div>
                  <span className="msb-bar-val">
                    {currency}
                    {fmtAmt(amt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Jobs */}
      {showJobs && (
        <div className="msb-card" style={{ "--ca": "#4ab87a", "--cg": "rgba(74,184,122,0.45)" }}>
          <div className="msb-head">
            <Px name="briefcase" size={14} className="msb-icon" />
            <span className="msb-name">JOBS</span>
            <span className="msb-badge">{activeJobs.length} active</span>
          </div>
          <div className="msb-bars">
            {pipelineCounts.map(({ label, count }) => (
              <div key={label} className="msb-bar-row">
                <span className="msb-bar-lbl">{label}</span>
                <div className="msb-bar-bg">
                  <div
                    className="msb-bar-fill"
                    style={{ width: count ? `${((count / maxPipe) * 100).toFixed(0)}%` : "0%" }}
                  />
                </div>
                <span className="msb-bar-val">{count}</span>
              </div>
            ))}
          </div>
          {rejectedCnt > 0 && (
            <div className="msb-tiny" style={{ color: "rgba(224,90,90,0.55)" }}>
              {rejectedCnt} rejected
            </div>
          )}
        </div>
      )}

      {/* Fitness */}
      {showFitness && (
        <div className="msb-card" style={{ "--ca": "#5a9ed4", "--cg": "rgba(90,158,212,0.45)" }}>
          <div className="msb-head">
            <Px name="human-arms-up" size={14} className="msb-icon" />
            <span className="msb-name">FITNESS</span>
            <span className="msb-badge">{workoutsThisMonth} workouts this month</span>
          </div>
          {latestWeight && (
            <div className="msb-big">
              {latestWeight}
              <span className="msb-big-unit"> lbs</span>
            </div>
          )}
          {sparkPath ? (
            <svg className="msb-spark" viewBox={`0 0 ${SW} ${SH}`} preserveAspectRatio="none">
              <path
                d={sparkPath}
                stroke="var(--ca)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 0 4px var(--cg))" }}
              />
            </svg>
          ) : (
            <div className="msb-tiny">{workouts.length} workouts logged · no weight data</div>
          )}
          {sparkPath && (
            <div className="msb-tiny">
              {metrics.length} measurements · {workouts.length} workouts total
            </div>
          )}
          {runKmThisMonth > 0 && (
            <div className="msb-tiny" style={{ marginTop: 2 }}>
              {runKmThisMonth.toFixed(1)} km run this month · {runsThisMonth.length} run
              {runsThisMonth.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}

      {/* Climbing */}
      {showClimbing && (
        <div className="msb-card" style={{ "--ca": "#d4a040", "--cg": "rgba(212,160,64,0.45)" }}>
          <div className="msb-head">
            <Px name="arrow-up-box" size={14} className="msb-icon" />
            <span className="msb-name">CLIMBING</span>
            <span className="msb-badge">{climbs.length} routes</span>
          </div>
          <div className="msb-trio">
            {[
              { v: sentCount, l: "SENT" },
              { v: flashCount, l: "FLASH" },
              { v: `${sendRate}%`, l: "RATE" },
            ].map(({ v, l }) => (
              <div key={l} className="msb-trio-item">
                <div className="msb-trio-val">{v}</div>
                <div className="msb-trio-lbl">{l}</div>
              </div>
            ))}
          </div>
          {thisMonthC > 0 && <div className="msb-tiny">{thisMonthC} sessions this month</div>}
        </div>
      )}

      {/* Dev Projects */}
      {showProjects && (
        <div className="msb-card" style={{ "--ca": "#40c4c4", "--cg": "rgba(64,196,196,0.45)" }}>
          <div className="msb-head">
            <Px name="terminal" size={14} className="msb-icon" />
            <span className="msb-name">PROJECTS</span>
            <span className="msb-badge">{devProjects.length} total</span>
          </div>
          <div className="msb-trio">
            {[
              { v: activeProjects.length, l: "ACTIVE" },
              { v: inProgress, l: "IN PROG" },
              { v: doneTasks, l: "DONE" },
            ].map(({ v, l }) => (
              <div key={l} className="msb-trio-item">
                <div className="msb-trio-val">{v}</div>
                <div className="msb-trio-lbl">{l}</div>
              </div>
            ))}
          </div>
          {activeProjects.length > 0 && (
            <div className="msb-list">
              {activeProjects.slice(0, 3).map((p) => (
                <div key={p.id} className="msb-list-item">
                  {p.name}
                </div>
              ))}
              {activeProjects.length > 3 && (
                <div className="msb-tiny">+{activeProjects.length - 3} more</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hydroponics */}
      {showHydro && (
        <div className="msb-card" style={{ "--ca": "#2eb8a0", "--cg": "rgba(46,184,160,0.45)" }}>
          <div className="msb-head">
            <Px name="droplet" size={14} className="msb-icon" />
            <span className="msb-name">HYDRO</span>
            <span className="msb-badge">
              {activePlants.length} plant{activePlants.length !== 1 ? "s" : ""} active
            </span>
          </div>
          <div className="msb-trio">
            {[
              { v: hydroLatest?.ph?.toFixed(1) ?? "—", l: "PH" },
              { v: hydroLatest?.ec_ppm?.toFixed(0) ?? "—", l: "PPM" },
              {
                v:
                  hydroLatest?.water_level?.toFixed(0) != null
                    ? hydroLatest.water_level.toFixed(0) + "%"
                    : "—",
                l: "LEVEL",
              },
            ].map(({ v, l }) => (
              <div key={l} className="msb-trio-item">
                <div className="msb-trio-val">{v}</div>
                <div className="msb-trio-lbl">{l}</div>
              </div>
            ))}
          </div>
          {hydroLatest?.water_temp != null && (
            <div className="msb-tiny">
              {hydroLatest.water_temp.toFixed(1)}°C water ·{" "}
              {hydroLatest.air_temp?.toFixed(1) ?? "—"}°C air
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getWorldZoom(sec) {
  if (!sec) return {};
  const scale = 1.8;
  const px = parseFloat(sec.pos.left);
  const py = parseFloat(sec.pos.top);
  return {
    transform: `scale(${scale}) translate(${50 / scale - px}%, ${50 / scale - py}%)`,
    transformOrigin: "0 0",
  };
}

function AppInner({ authUser, onLogout }) {
  const [screen, setScreen] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);

  // null permissions = full access; array = restricted to those section IDs
  const allowedSections = authUser.permissions ?? null;
  const canAccess = (id) => allowedSections === null || allowedSections.includes(id);
  const visibleSections = Object.entries(SECTIONS).filter(([id]) => canAccess(id));
  const { loadAll: loadApp } = useApp();
  const { loadAll: loadJob } = useJob();
  const { loadAll: loadFitness } = useFitness();
  const { loadAll: loadPortfolio } = usePortfolio();
  const { loadAll: loadClimbing } = useClimbing();
  const { loadAll: loadProjects } = useDevProjects();
  const { loadAll: loadHydro } = useHydro();

  const perms = authUser.permissions;
  useEffect(() => {
    const ok = (s) => !perms || perms.includes(s);
    if (ok("spending")) loadApp();
    if (ok("jobs")) loadJob();
    if (ok("fitness")) loadFitness();
    if (ok("portfolio")) loadPortfolio();
    if (ok("climbing")) loadClimbing();
    if (ok("projects")) loadProjects();
    if (ok("hydro")) loadHydro();
  }, [perms, loadApp, loadJob, loadFitness, loadPortfolio, loadClimbing, loadProjects, loadHydro]);

  useEffect(() => {
    const handler = (e) => {
      const hasModal = Boolean(document.querySelector(".modal-overlay"));
      const inInput = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);

      if (e.key === "Escape") {
        if (showHelp) {
          setShowHelp(false);
          return;
        }
        if (showTerminal) {
          setShowTerminal(false);
          return;
        }
        if (!hasModal && screen !== null) setScreen(null);
        return;
      }
      if (e.key === "?" && !inInput) {
        e.preventDefault();
        setShowHelp((h) => !h);
        return;
      }
      if (hasModal || inInput || showTerminal) return;
      if (e.key === "/") {
        e.preventDefault();
        setShowTerminal(true);
        return;
      }
      if (e.key === "n" || e.key === "N") {
        if (screen !== null) window.dispatchEvent(new Event("shortcut:new"));
        return;
      }
      if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && screen !== null) {
        const activeSection = SCREEN_TO_SECTION[screen];
        const sec = activeSection ? SECTIONS[activeSection] : null;
        if (!sec) return;
        e.preventDefault();
        const items = sec.items;
        const idx = items.findIndex((i) => i.id === screen);
        if (idx === -1) return;
        const next =
          e.key === "ArrowRight"
            ? items[(idx + 1) % items.length]
            : items[(idx - 1 + items.length) % items.length];
        setScreen(next.id);
        return;
      }
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < SECTION_ORDER.length) {
        const sectionId = SECTION_ORDER[idx];
        if (canAccess(sectionId)) setScreen(SECTION_DEFAULT[sectionId]);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [screen, showHelp, showTerminal]);

  const handleTerminalNavigate = (targetScreen, fireNew, fireEvent) => {
    if (targetScreen === "__logout__") {
      setShowTerminal(false);
      onLogout();
      return;
    }
    setScreen(targetScreen);
    if (fireNew)
      setTimeout(() => window.dispatchEvent(new Event(fireEvent || "shortcut:new")), 120);
  };

  const activeSection = screen ? SCREEN_TO_SECTION[screen] : null;
  const sec = activeSection ? SECTIONS[activeSection] : null;
  const isProfile = screen === "profile";
  const isOpen = Boolean(screen);

  const renderScreen = () => {
    switch (screen) {
      case "dashboard":
        return <Dashboard />;
      case "graphs":
        return <Graphs />;
      case "categories":
        return <Categories />;
      case "jobs-applications":
        return <Applications />;
      case "jobs-contacts":
        return <Contacts />;
      case "fitness-workouts":
        return <Workouts />;
      case "fitness-runs":
        return <Runs />;
      case "fitness-metrics":
        return <BodyMetrics />;
      case "portfolio-projects":
        return <Projects />;
      case "portfolio-skills":
        return <Skills />;
      case "portfolio-experience":
        return <Experience />;
      case "portfolio-about":
        return <About />;
      case "climbing-routes":
        return <Climbs />;
      case "projects-tracker":
        return <DevProjects />;
      case "projects-board":
        return <KanbanScreen />;
      case "hydro-dashboard":
        return <HydroDashboard />;
      case "hydro-history":
        return <HydroHistory />;
      case "hydro-plants":
        return <HydroPlants />;
      case "hydro-dosing":
        return <HydroDosing />;
      case "profile":
        return <Profile />;
      default:
        return null;
    }
  };

  return (
    <div
      id="app"
      style={{
        "--accent": sec?.accent ?? "#00ff41",
        "--accent-glow": sec?.glow ?? "rgba(0,255,65,0.5)",
        "--accent-dim": sec?.dim ?? "rgba(0,255,65,0.15)",
      }}
    >
      {/* Animated world — zooms toward the active section marker */}
      <div className="world-layer" style={getWorldZoom(sec)}>
        <div className="world-bg" />
        <Stars />

        <svg className="mountain-bg" viewBox="0 0 1000 600" preserveAspectRatio="none">
          <defs>
            <filter id="pathglow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <polygon
            points="0,600 0,520 160,430 340,475 520,390 720,450 900,400 1000,440 1000,600"
            fill="#070e07"
          />
          <polygon points="0,600 0,470 280,50 560,470 1000,490 1000,600" fill="#0c1c0c" />
          <polygon points="0,470 280,50 220,190 80,440" fill="rgba(0,0,0,0.18)" />
          <polygon points="280,50 242,138 318,138" fill="rgba(0,255,65,0.09)" />
          <polygon
            points="0,600 0,550 100,532 260,548 440,530 640,548 820,534 1000,548 1000,600"
            fill="#030703"
          />
          <path
            d={FULL_PATH}
            stroke="rgba(0,255,65,0.2)"
            strokeWidth="2"
            fill="none"
            strokeDasharray="8,5"
          />
          {sec && (
            <path
              d={sec.pathTo}
              stroke={sec.routeActive}
              strokeWidth="3"
              fill="none"
              strokeDasharray="8,5"
              filter="url(#pathglow)"
            />
          )}
        </svg>

        <div className={"markers" + (isOpen ? " markers-zoomed" : "")}>
          {visibleSections.map(([id, s]) => {
            const active = activeSection === id;
            return (
              <div
                key={id}
                className={"marker " + (active ? "m-active" : "m-dim")}
                style={{ left: s.pos.left, top: s.pos.top }}
                onClick={() => setScreen(SECTION_DEFAULT[id])}
              >
                {!isOpen && active && (
                  <div className="you-here">
                    <IChevDown size={10} />
                    YOU ARE HERE
                  </div>
                )}
                <div className="marker-pin">
                  <Px name={s.icon} size={18} />
                </div>
                <div className="marker-label">{id.toUpperCase()}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Topbar — always above the popup */}
      <div className="topbar">
        <div className="tb-brand" style={{ cursor: "pointer" }} onClick={() => setScreen(null)}>
          NYOMNYOM
        </div>
        <div className="tb-nav">
          {visibleSections.map(([id, s]) => (
            <button
              key={id}
              className={"tb-section-btn" + (!isProfile && activeSection === id ? " active" : "")}
              onClick={() => setScreen(SECTION_DEFAULT[id])}
              title={id.charAt(0).toUpperCase() + id.slice(1)}
            >
              <Px name={s.icon} size={14} className="tb-section-icon" />
              <span className="tb-section-label">{id.toUpperCase()}</span>
            </button>
          ))}
        </div>
        <div className="tb-sep" />
        {isOpen && (
          <button className="tb-map-btn" onClick={() => setScreen(null)}>
            <IArrowLeft /> MAP
          </button>
        )}
        <div className="tb-player" onClick={() => setScreen("profile")}>
          <div className="tb-avatar">{getInitials(authUser.username)}</div>
          <div className="tb-name">{authUser.username.toUpperCase()}</div>
        </div>
        <button
          className="tb-help-btn"
          onClick={() => setShowHelp((h) => !h)}
          title="Keyboard shortcuts (?)"
        >
          ?
        </button>
        <button className="tb-logout" onClick={onLogout}>
          SIGN OUT
        </button>
      </div>

      {/* Mobile home grid — shown only on small screens when no section is open */}
      {!isOpen && (
        <div className="mobile-home">
          {visibleSections.map(([id, s]) => (
            <button
              key={id}
              className="mobile-home-tile"
              style={{ "--ca": s.accent, "--cg": s.glow }}
              onClick={() => setScreen(SECTION_DEFAULT[id])}
            >
              <Px name={s.icon} size={32} />
              <span>{id.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}

      {/* Map sidebar — overview stats, hidden when popup is open */}
      {!isOpen && <MapSidebar />}

      {/* Dim backdrop — click anywhere outside popup to go back to map */}
      {isOpen && <div className="popup-backdrop" onClick={() => setScreen(null)} />}

      {/* Full-screen content popup */}
      {isOpen && (
        <div
          className="section-popup"
          style={
            sec
              ? { "--accent": sec.accent, "--accent-glow": sec.glow, borderTopColor: sec.accent }
              : {}
          }
        >
          <div className="popup-header">
            <div className="popup-title">{isProfile ? "▶ PROFILE" : sec?.label}</div>
            {!isProfile && sec && (
              <div className="popup-tabs">
                {sec.items.map((item) => (
                  <button
                    key={item.id}
                    className={"popup-tab" + (screen === item.id ? " active" : "")}
                    onClick={() => setScreen(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
            <button className="popup-close" onClick={() => setScreen(null)}>
              <IClose size={11} /> CLOSE
            </button>
          </div>
          <div className="popup-body">{renderScreen()}</div>
        </div>
      )}

      {showHelp && <ShortcutsHelp onClose={() => setShowHelp(false)} />}
      {showTerminal && (
        <TerminalLauncher
          onNavigate={handleTerminalNavigate}
          onClose={() => setShowTerminal(false)}
          canAccess={canAccess}
        />
      )}
      <Toasts />
    </div>
  );
}

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/auth/me").then((data) => {
      if (data.user) setAuthUser(data.user);
      setAuthLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setAuthUser(null);
  };

  if (authLoading) return <div className="auth-loading">Loading…</div>;
  if (!authUser) return <PublicPortfolio onLogin={setAuthUser} />;

  return (
    <AppProvider>
      <JobProvider>
        <FitnessProvider>
          <PortfolioProvider>
            <ClimbingProvider>
              <ProjectsProvider>
                <HydroProvider>
                  <AppInner authUser={authUser} onLogout={handleLogout} />
                </HydroProvider>
              </ProjectsProvider>
            </ClimbingProvider>
          </PortfolioProvider>
        </FitnessProvider>
      </JobProvider>
    </AppProvider>
  );
}
