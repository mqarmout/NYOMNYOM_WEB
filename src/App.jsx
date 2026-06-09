import { useState, useEffect, useRef } from "react";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AppProvider, useApp } from "./context/AppContext";
import { JobProvider, useJob } from "./context/JobContext";
import { FitnessProvider, useFitness } from "./context/FitnessContext";
import { PortfolioProvider, usePortfolio } from "./context/PortfolioContext";
import { ClimbingProvider, useClimbing } from "./context/ClimbingContext";
import { ProjectsProvider, useDevProjects } from "./context/ProjectsContext";
import { HydroProvider, useHydro } from "./context/HydroContext";
import { PrintsProvider, usePrints } from "./context/PrintsContext";

import Dashboard from "./screens/spending/Dashboard";
import Categories from "./screens/spending/Categories";
import SpendingHistory from "./screens/spending/History";
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
import PrintsDashboard from "./screens/prints/Dashboard";
import PrintLog from "./screens/prints/PrintLog";
import Profile from "./screens/Profile";
import Home from "./screens/Home";
import PublicPortfolio from "./screens/PublicPortfolio";
import JobsAnalytics from "./screens/jobs/Analytics";
import FitnessAnalytics from "./screens/fitness/Analytics";
import ClimbingAnalytics from "./screens/climbing/Analytics";
import ProjectsAnalytics from "./screens/projects/Analytics";
import Shell from "./components/crt/Shell";
import { apiFetch } from "./utils";

const SECTION_DEFAULT = {
  spending: "dashboard",
  jobs: "jobs-analytics",
  fitness: "fitness-analytics",
  portfolio: "portfolio-projects",
  climbing: "climbing-analytics",
  projects: "projects-analytics",
  hydro: "hydro-dashboard",
  prints: "prints-dashboard",
};

const SECTION_ORDER = ["spending", "jobs", "fitness", "portfolio", "climbing", "projects", "hydro", "prints"];

const SCREEN_TO_SECTION = {
  dashboard: "spending",
  categories: "spending",
  "spending-history": "spending",
  "jobs-analytics": "jobs",
  "jobs-applications": "jobs",
  "jobs-contacts": "jobs",
  "fitness-analytics": "fitness",
  "fitness-workouts": "fitness",
  "fitness-runs": "fitness",
  "fitness-metrics": "fitness",
  "portfolio-projects": "portfolio",
  "portfolio-skills": "portfolio",
  "portfolio-experience": "portfolio",
  "portfolio-about": "portfolio",
  "climbing-analytics": "climbing",
  "climbing-routes": "climbing",
  "projects-analytics": "projects",
  "projects-tracker": "projects",
  "projects-board": "projects",
  "hydro-dashboard": "hydro",
  "hydro-history": "hydro",
  "hydro-plants": "hydro",
  "hydro-dosing": "hydro",
  "prints-dashboard": "prints",
  "prints-log": "prints",
};

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
  { cmd: "spending/history", screen: "spending-history", fire: false, label: "Spending → History" },
  { cmd: "spending/categories", screen: "categories", fire: false, label: "Spending → Categories" },
  {
    cmd: "spending/categories/new",
    screen: "categories",
    fire: true,
    label: "Spending → New Category",
  },
  { cmd: "jobs", screen: "jobs-analytics", fire: false, label: "Jobs → Analytics" },
  { cmd: "jobs/analytics", screen: "jobs-analytics", fire: false, label: "Jobs → Analytics" },
  {
    cmd: "jobs/applications",
    screen: "jobs-applications",
    fire: false,
    label: "Jobs → Applications",
  },
  { cmd: "jobs/new", screen: "jobs-applications", fire: true, label: "Jobs → Add Application" },
  { cmd: "jobs/contacts", screen: "jobs-contacts", fire: false, label: "Jobs → Contacts" },
  { cmd: "jobs/contacts/new", screen: "jobs-contacts", fire: true, label: "Jobs → Add Contact" },
  { cmd: "fitness", screen: "fitness-analytics", fire: false, label: "Fitness → Analytics" },
  {
    cmd: "fitness/analytics",
    screen: "fitness-analytics",
    fire: false,
    label: "Fitness → Analytics",
  },
  { cmd: "fitness/new", screen: "fitness-workouts", fire: true, label: "Fitness → Log Workout" },
  { cmd: "fitness/workouts", screen: "fitness-workouts", fire: false, label: "Fitness → Workouts" },
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
  { cmd: "climbing", screen: "climbing-analytics", fire: false, label: "Climbing → Analytics" },
  {
    cmd: "climbing/analytics",
    screen: "climbing-analytics",
    fire: false,
    label: "Climbing → Analytics",
  },
  { cmd: "climbing/routes", screen: "climbing-routes", fire: false, label: "Climbing → Routes" },
  { cmd: "climbing/new", screen: "climbing-routes", fire: true, label: "Climbing → Log Climb" },
  { cmd: "projects", screen: "projects-analytics", fire: false, label: "Projects → Analytics" },
  {
    cmd: "projects/analytics",
    screen: "projects-analytics",
    fire: false,
    label: "Projects → Analytics",
  },
  { cmd: "projects/tracker", screen: "projects-tracker", fire: false, label: "Projects → Tracker" },
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
  { cmd: "prints", screen: "prints-dashboard", fire: false, label: "Prints → Dashboard" },
  { cmd: "prints/new", screen: "prints-dashboard", fire: true, label: "Prints → Log Print" },
  { cmd: "prints/log", screen: "prints-log", fire: false, label: "Prints → History" },
  { cmd: "profile", screen: "profile", fire: false, label: "Profile" },
  { cmd: "logout", screen: "__logout__", fire: false, label: "Logout" },
];

const PATH_MAP = {
  home: "/dashboard",
  spending: "/spending",
  jobs: "/jobs",
  fitness: "/fitness",
  climbing: "/climbing",
  portfolio: "/portfolio",
  projects: "/projects",
  hydro: "/hydro",
  prints: "/prints",
  profile: "/profile",
};

const CMD_MAP = {
  home: "./status --live",
  spending: "./report --month",
  jobs: "./pipeline --active",
  fitness: "./log --month",
  climbing: "./sends --max",
  portfolio: "./public --serve",
  projects: "./kanban --board",
  hydro: "./sensors --live",
  prints: "./prints --history",
  profile: "./profile --edit",
};

const FKEY_MAP = {
  home: [
    ["F1", "help"],
    ["F2", "sync"],
    ["F3", "search"],
    ["F4", "new"],
    ["F10", "menu"],
  ],
  spending: [
    ["F1", "help"],
    ["F2", "save"],
    ["F3", "find"],
    ["F4", "new"],
    ["Esc", "home"],
  ],
  fitness: [
    ["F1", "help"],
    ["F2", "save"],
    ["F3", "find"],
    ["F4", "log"],
    ["Esc", "home"],
  ],
  climbing: [
    ["F1", "help"],
    ["F2", "save"],
    ["F3", "find"],
    ["F4", "send"],
    ["Esc", "home"],
  ],
  jobs: [
    ["F1", "help"],
    ["F2", "save"],
    ["F3", "find"],
    ["F4", "apply"],
    ["Esc", "home"],
  ],
  projects: [
    ["F1", "help"],
    ["F2", "save"],
    ["F3", "find"],
    ["F4", "task"],
    ["Esc", "home"],
  ],
  hydro: [
    ["F1", "help"],
    ["F2", "sync"],
    ["F3", "find"],
    ["F4", "dose"],
    ["Esc", "home"],
  ],
  portfolio: [
    ["F1", "help"],
    ["F2", "save"],
    ["F3", "find"],
    ["F4", "new"],
    ["Esc", "home"],
  ],
  profile: [
    ["F1", "help"],
    ["Esc", "home"],
  ],
};

// Section sub-tabs
const SECTION_TABS = {
  spending: [
    ["dashboard", "DASHBOARD"],
    ["categories", "CATEGORIES"],
    ["spending-history", "HISTORY"],
  ],
  jobs: [
    ["jobs-analytics", "DASHBOARD"],
    ["jobs-applications", "APPLICATIONS"],
    ["jobs-contacts", "CONTACTS"],
  ],
  fitness: [
    ["fitness-analytics", "DASHBOARD"],
    ["fitness-workouts", "WORKOUTS"],
    ["fitness-runs", "RUNNING"],
    ["fitness-metrics", "BODY"],
  ],
  portfolio: [
    ["portfolio-projects", "PROJECTS"],
    ["portfolio-skills", "SKILLS"],
    ["portfolio-experience", "EXPERIENCE"],
    ["portfolio-about", "ABOUT"],
  ],
  climbing: [
    ["climbing-analytics", "DASHBOARD"],
    ["climbing-routes", "ROUTES"],
  ],
  projects: [
    ["projects-analytics", "DASHBOARD"],
    ["projects-tracker", "PROJECTS"],
    ["projects-board", "BOARD"],
  ],
  hydro: [
    ["hydro-dashboard", "DASHBOARD"],
    ["hydro-history", "HISTORY"],
    ["hydro-plants", "PLANTS"],
    ["hydro-dosing", "DOSING"],
  ],
  prints: [
    ["prints-dashboard", "DASHBOARD"],
    ["prints-log", "HISTORY"],
  ],
};

function Toasts() {
  const { toast: t1 } = useApp();
  const { toast: t2 } = useJob();
  const { toast: t3 } = useFitness();
  const { toast: t4 } = usePortfolio();
  const { toast: t5 } = useClimbing();
  const { toast: t6 } = useDevProjects();
  const { toast: t7 } = useHydro();
  const { theme } = useTheme();
  const msg = t1 || t2 || t3 || t4 || t5 || t6 || t7;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 48,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        padding: "8px 18px",
        background: theme.surface,
        border: `1px solid ${theme.accent}`,
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        color: theme.accent,
        letterSpacing: "0.08em",
        pointerEvents: "none",
        opacity: msg ? 1 : 0,
        transition: "opacity 0.2s",
      }}
    >
      {msg || ""}
    </div>
  );
}

function TerminalLauncher({ onNavigate, onClose, canAccess }) {
  const { theme } = useTheme();
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
          onNavigate(hit.screen, hit.fire, hit.event);
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
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "15vh",
        zIndex: 500,
      }}
    >
      <div
        style={{
          width: "min(580px, 95vw)",
          background: theme.bg,
          border: `1px solid ${theme.accent}`,
          boxShadow: `0 0 40px ${theme.accent}30`,
          fontFamily: "var(--font-mono)",
          fontSize: 13,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <span style={{ color: theme.accent, fontWeight: 700 }}>▶</span>
          <span style={{ color: theme.muted }}>/</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="section/command…"
            spellCheck={false}
            autoComplete="off"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              color: theme.cream,
              fontFamily: "var(--font-mono)",
              fontSize: 13,
            }}
          />
        </div>
        {matches.length > 0 ? (
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {matches.slice(0, 8).map((c, i) => (
              <div
                key={c.cmd}
                onMouseEnter={() => setSelIdx(i)}
                onClick={() => {
                  onNavigate(c.screen, c.fire, c.event);
                  onClose();
                }}
                style={{
                  padding: "9px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: i === selIdx ? theme.surface2 : "transparent",
                  cursor: "pointer",
                  borderLeft: i === selIdx ? `2px solid ${theme.accent}` : "2px solid transparent",
                }}
              >
                <span style={{ color: i === selIdx ? theme.accent : theme.accentDim }}>
                  /{c.cmd}
                </span>
                <span style={{ color: theme.muted, fontSize: 11 }}>{c.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "12px 14px", color: theme.muted }}>unknown command</div>
        )}
        <div
          style={{
            padding: "6px 14px",
            borderTop: `1px solid ${theme.border}`,
            fontSize: 10,
            color: theme.muted,
          }}
        >
          ENTER to go · TAB to complete · ESC to cancel
        </div>
      </div>
    </div>
  );
}

function SectionTabs({ section, screen, onNav }) {
  const { theme } = useTheme();
  const tabs = SECTION_TABS[section];
  if (!tabs || tabs.length <= 1) return null;
  return (
    <div
      style={{
        display: "flex",
        borderBottom: `1px solid ${theme.border}`,
        flexShrink: 0,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
      }}
    >
      {tabs.map(([id, label]) => {
        const active = screen === id;
        return (
          <button
            key={id}
            onClick={() => onNav(id)}
            style={{
              padding: "9px 18px",
              background: "transparent",
              border: "none",
              borderBottom: active ? `2px solid ${theme.accent}` : "2px solid transparent",
              marginBottom: -1,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: active ? theme.accentHot : theme.accentDim,
              fontWeight: active ? 600 : 500,
              cursor: "pointer",
              letterSpacing: "0.1em",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function renderScreen(screen) {
  switch (screen) {
    case "dashboard":
      return <Dashboard />;
    case "categories":
      return <Categories />;
    case "spending-history":
      return <SpendingHistory />;
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
    case "jobs-analytics":
      return <JobsAnalytics />;
    case "fitness-analytics":
      return <FitnessAnalytics />;
    case "climbing-analytics":
      return <ClimbingAnalytics />;
    case "projects-analytics":
      return <ProjectsAnalytics />;
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
    case "prints-dashboard":
      return <PrintsDashboard />;
    case "prints-log":
      return <PrintLog />;
    case "profile":
      return <Profile />;
    default:
      return null;
  }
}

function AppInner({ authUser, onLogout }) {
  const [screen, setScreen] = useState(null);
  const [showTerminal, setShowTerminal] = useState(false);

  const allowedSections = authUser.permissions ?? null;
  const canAccess = (id) => allowedSections === null || allowedSections.includes(id);

  const { loadAll: loadApp } = useApp();
  const { loadAll: loadJob } = useJob();
  const { loadAll: loadFitness } = useFitness();
  const { loadAll: loadPortfolio } = usePortfolio();
  const { loadAll: loadClimbing } = useClimbing();
  const { loadAll: loadProjects } = useDevProjects();
  const { loadAll: loadHydro } = useHydro();
  const { loadAll: loadPrints } = usePrints();

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.screen) setScreen(e.detail.screen);
    };
    window.addEventListener("shortcut:go", handler);
    return () => window.removeEventListener("shortcut:go", handler);
  }, []);

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
    if (ok("prints")) loadPrints();
  }, [perms, loadApp, loadJob, loadFitness, loadPortfolio, loadClimbing, loadProjects, loadHydro, loadPrints]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      const inInput = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
      if (inInput || showTerminal) return;
      const hasModal = Boolean(document.querySelector(".modal-overlay"));
      if (hasModal) return;

      if (e.key === "Escape") {
        setScreen(null);
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        setShowTerminal(true);
        return;
      }
      if (e.key === "n" || e.key === "N") {
        if (screen !== null) window.dispatchEvent(new Event("shortcut:new"));
        return;
      }
      if ((e.key === "e" || e.key === "E") && screen !== null) {
        const sec = SCREEN_TO_SECTION[screen];
        if (sec === "spending") window.dispatchEvent(new Event("shortcut:new"));
        return;
      }
      const k = e.key.toLowerCase();
      if (k === "h") {
        setScreen(null);
        return;
      }
      if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && screen !== null) {
        const sec = SCREEN_TO_SECTION[screen];
        if (!sec) return;
        e.preventDefault();
        const tabs = SECTION_TABS[sec] || [];
        const idx = tabs.findIndex(([id]) => id === screen);
        if (idx === -1) return;
        const next =
          e.key === "ArrowRight"
            ? tabs[(idx + 1) % tabs.length]
            : tabs[(idx - 1 + tabs.length) % tabs.length];
        setScreen(next[0]);
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
  }, [screen, showTerminal]);

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

  const handleSidebarNav = (sectionId) => {
    if (sectionId === "home") {
      setScreen(null);
      return;
    }
    if (sectionId === "profile") {
      setScreen("profile");
      return;
    }
    if (canAccess(sectionId)) setScreen(SECTION_DEFAULT[sectionId]);
  };

  const activeSection = screen ? SCREEN_TO_SECTION[screen] : screen === null ? null : null;

  // Determine the "active" item for the sidebar highlight
  const sidebarActive = screen === null ? "home" : (activeSection ?? screen);

  // Path and cmd for StatusLine
  const pathKey = screen === null ? "home" : (activeSection ?? screen);
  const path = PATH_MAP[pathKey] ?? PATH_MAP.home;
  const cmd = CMD_MAP[pathKey] ?? CMD_MAP.home;
  const fkeys = FKEY_MAP[pathKey] ?? FKEY_MAP.home;

  const { theme } = useTheme();

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Shell
        active={sidebarActive}
        onNav={handleSidebarNav}
        path={path}
        cmd={cmd}
        fkeys={fkeys}
        username={authUser.username}
        onLogout={onLogout}
        footerExtra={
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: theme.muted }}>
            vim: <span style={{ color: theme.accent }}>NORMAL</span> ·{" "}
            {screen ? `${screen}.tsx` : "home.tsx"}
          </span>
        }
      >
        {screen === null ? (
          <Home username={authUser.username} onNav={handleSidebarNav} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {activeSection && (
              <SectionTabs section={activeSection} screen={screen} onNav={setScreen} />
            )}
            <div style={{ flex: 1, overflow: "auto" }}>{renderScreen(screen)}</div>
          </div>
        )}
      </Shell>

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

function AuthedApp({ authUser, onLogout }) {
  return (
    <AppProvider>
      <JobProvider>
        <FitnessProvider>
          <PortfolioProvider>
            <ClimbingProvider>
              <ProjectsProvider>
                <HydroProvider>
                  <PrintsProvider>
                    <AppInner authUser={authUser} onLogout={onLogout} />
                  </PrintsProvider>
                </HydroProvider>
              </ProjectsProvider>
            </ClimbingProvider>
          </PortfolioProvider>
        </FitnessProvider>
      </JobProvider>
    </AppProvider>
  );
}

function AppRoot() {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { theme } = useTheme();

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

  if (authLoading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: theme.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: theme.accentDim,
        }}
      >
        initializing…
      </div>
    );
  }

  if (!authUser) {
    return <PublicPortfolio onLogin={setAuthUser} />;
  }

  return <AuthedApp authUser={authUser} onLogout={handleLogout} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoot />
    </ThemeProvider>
  );
}
