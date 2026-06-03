# NYOMNYOM — Web

React (Vite) frontend for the NYOMNYOM personal dashboard. CRT terminal aesthetic with swappable phosphor palettes, mountain map navigation, pixel-art icon set.

The Flask backend lives in the sibling directory `nyomnyom_server/`.

## Stack

- React 18 + Vite
- `pixelarticons` SVG icon set via `vite-plugin-svgr`
- `JetBrains Mono` / `IBM Plex Mono` / `Fira Code` monospace fonts
- Pure CSS with CSS custom properties — no component library
- CRT theme system: scanlines, vignette, phosphor glow, palette switching

## Running locally

```bash
# from nyomnyom_web/
npm install
npm run dev          # http://localhost:5173 — proxies /api → localhost:5000
```

Flask backend must be running on port 5000 for API calls to work.

## Building for production

```bash
npm run build        # outputs to nyomnyom_web/dist/
```

Flask reads `../nyomnyom_web/dist/` and serves it as the SPA catch-all.

## Project structure

```
nyomnyom_web/
├── src/
│   ├── App.jsx              # auth shell, SCREEN_TO_SECTION routing, terminal launcher, AppInner
│   ├── icons.jsx            # all pixelarticons — Px component, CATEGORY_ICONS, named shortcuts
│   ├── index.css            # global styles (CRT base, component classes, CSS vars)
│   ├── utils.js             # apiFetch, fmt, fmtDate, getInitials, COLORS
│   ├── Charts.jsx           # AreaChart + other shared SVG chart components
│   ├── context/
│   │   ├── ThemeContext.jsx     # CRT theme: palettes (green/amber/cyan), glow, scanlines, vignette, font
│   │   ├── AppContext.jsx       # spending: categories, expenses, income, profile
│   │   ├── JobContext.jsx       # jobs, contacts
│   │   ├── FitnessContext.jsx   # workouts, sets, body metrics, weight history
│   │   ├── PortfolioContext.jsx # projects, skills, experience, about
│   │   ├── ClimbingContext.jsx  # climb log, photo upload
│   │   ├── ProjectsContext.jsx  # dev projects, kanban tasks, commit cache
│   │   └── HydroContext.jsx     # readings, pump schedule/log, dosing, plants
│   ├── components/
│   │   └── crt/
│   │       ├── Shell.jsx        # main layout: scanlines, vignette, sidebar nav, phone bottom tabs
│   │       ├── Box.jsx          # styled CRT panel
│   │       ├── CRTButton.jsx    # phosphor-glow button
│   │       ├── BlockBar.jsx     # progress/bar component
│   │       ├── SubTabs.jsx      # tab row component
│   │       └── PixelIcon.jsx    # pixelarticon wrapper
│   ├── hooks/
│   │   ├── useBreakpoint.js     # responsive breakpoint hook
│   │   └── useToast.js          # toast notification hook
│   └── screens/
│       ├── Home.jsx             # mountain map UI
│       ├── spending/    Dashboard, SpendingHero, Categories, AddExpense, AddIncome, History
│       ├── jobs/        Analytics, Applications, Contacts
│       ├── fitness/     Analytics, Workouts, BodyMetrics, Runs
│       ├── portfolio/   Projects, Skills, Experience, About
│       ├── climbing/    Analytics, Climbs
│       ├── projects/    Analytics, DevProjects, KanbanBoard, KanbanScreen
│       ├── hydro/       Dashboard, History, Plants, Dosing
│       ├── PublicPortfolio.jsx
│       ├── SignIn.jsx
│       └── Profile.jsx
└── vite.config.js
```

## CRT theme system

`ThemeContext` drives all visual styling. Three palettes: `green` (P1), `cyan` (P2), `amber` (P3). Each palette sets CSS custom properties (`--accent`, `--bg`, `--surface`, `--border`, etc.) on `:root`. Additional tweaks: glow intensity, scanline strength, vignette strength, monospace font choice. Settings persist to `localStorage`.

Rules:
- Never hardcode colors — use CSS vars or `theme.*` from `useTheme()`
- Use `glow(theme, intensity)` for the standard phosphor box-shadow

## Icons

All icons use [pixelarticons](https://pixelarticons.com/), imported as React SVG components via `vite-plugin-svgr` (`import Icon from 'pixelarticons/svg/name.svg?react'`).

`icons.jsx` exports:
- `Px` — generic component: `<Px name="coffee" size={16} />`; renders unknown names as text (backward compat with legacy emoji DB values)
- `CATEGORY_ICONS` — 90 icon name strings for the category picker grid
- Named shortcuts: `IClose`, `IEdit`, `IChevDown`, `IChevUp`, `IArrowLeft`, `IExtLink`, `IWarning`, `IBoard`, `ICal`, `IRefresh`, `ICheck`, `IMapPin`, `IZap`

## Keyboard shortcuts

| Key | Action |
|---|---|
| `/` | Open command terminal |
| `1` – `7` | Jump to section |
| `N` | New item in current section |
| `← →` | Cycle tabs within a section |
| `Esc` | Close modal → return to map |

### Terminal commands (`/`)

```
/spending               → Dashboard
/spending/new           → Add expense
/climbing/new           → Log climb
/projects/board         → Kanban board
/jobs/contacts/new      → Add contact
/hydro                  → Hydro dashboard
/hydro/readings/new     → Log reading
/hydro/dosing/new       → Log dosing
/hydro/plants/new       → Add plant
```

Supports `section`, `section/tab`, `section/tab/new`. Tab-completes; arrow keys navigate matches; Enter goes.

## Map UI

The homepage is an SVG mountain (`viewBox="0 0 1000 600"`, `preserveAspectRatio="none"`). Seven clickable station markers zoom the world toward the selected section. SVG coordinate `(x, y)` maps to CSS `left: x/10 %, top: y/6 %`.

Station positions: fitness `(120,340)`, jobs `(260,255)`, portfolio `(200,180)`, climbing `(380,230)`, spending `(290,100)`, projects `(430,340)`, hydro `(490,410)`.

## Tracker features

- **Spending** — expenses and income with recurring support (daily/weekly/monthly/yearly templates), categories with budgets, monthly analytics, multi-month history graphs
- **Jobs** — kanban pipeline (applied → screening → interviewing → offer → rejected/withdrawn), contacts per job, URL extraction
- **Fitness** — workout sessions with completion time; exercises as sets/reps/weight or time-based (seconds); edit sessions and individual sets inline; body weight log with history graph; running log with manual entry and Strava incremental import
- **Portfolio** — projects, skills, experience, about; public read-only view at `/` when unauthenticated
- **Climbing** — boulder and sport climb log with grades, wall type, attempts, sent/flash flags, optional photo upload
- **Dev Projects** — status/priority tracker, per-project todos, kanban board, GitHub last-commit fetch
- **Hydroponics** — live sensor dashboard (pH, EC, water temp/level, air temp, humidity) with color-coded range indicators; pump schedule editor and manual trigger; dosing log with per-type totals; plant tracker with growth stage and active/archived views; history charts for all metrics
