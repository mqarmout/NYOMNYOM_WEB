# NYOMNYOM — Web

React (Vite) frontend for the NYOMNYOM personal dashboard. CRT terminal aesthetic, mountain map navigation, pixel-art icon set.

The Flask backend lives in the sibling directory `nyomnyom_server/`.

## Stack

- React 18 + Vite
- `pixelarticons` SVG icon set via `vite-plugin-svgr`
- `Share Tech Mono` + `Press Start 2P` fonts (Google Fonts)
- Pure CSS — no component library

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
│   ├── App.jsx         # auth shell, mountain map, terminal launcher, AppInner
│   ├── icons.jsx       # all pixelarticons — Px component, CATEGORY_ICONS, named shortcuts
│   ├── index.css       # all styles (CRT theme, component classes)
│   ├── utils.js        # apiFetch, fmt, fmtDate, getInitials, COLORS
│   ├── Charts.jsx      # AreaChart SVG component
│   ├── context/        # one context per tracker section
│   │   ├── AppContext.jsx        # spending: categories, expenses, profile
│   │   ├── JobContext.jsx        # jobs, contacts
│   │   ├── FitnessContext.jsx    # workouts, sets, body metrics, weight history
│   │   ├── PortfolioContext.jsx  # projects, skills, experience, about
│   │   ├── ClimbingContext.jsx   # climb log, photo upload
│   │   └── ProjectsContext.jsx   # dev projects, kanban tasks, commit cache
│   └── screens/
│       ├── spending/   Dashboard, Graphs, Categories, AddExpense
│       ├── jobs/       Applications, Contacts
│       ├── fitness/    Workouts, BodyMetrics
│       ├── portfolio/  Projects, Skills, Experience, About
│       ├── climbing/   Climbs
│       ├── projects/   DevProjects, KanbanBoard, KanbanScreen
│       ├── PublicPortfolio.jsx
│       ├── SignIn.jsx
│       └── Profile.jsx
└── vite.config.js
```

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
| `1` – `6` | Jump to section |
| `N` | New item in current section |
| `← →` | Cycle tabs within a section |
| `Esc` | Close modal → return to map |
| `?` | Show shortcut reference |

### Terminal commands (`/`)

```
/spending               → Dashboard
/spending/new           → Add expense
/climbing/new           → Log climb
/projects/board         → Kanban board
/jobs/contacts/new      → Add contact
```

Supports `section`, `section/tab`, `section/tab/new`. Tab-completes; arrow keys navigate matches; Enter goes.

## Map UI

The homepage is an SVG mountain (`viewBox="0 0 1000 600"`, `preserveAspectRatio="none"`). Six clickable station markers zoom the world toward the selected section. SVG coordinate `(x, y)` maps to CSS `left: x/10 %, top: y/6 %`.

Station positions: fitness `(120,340)`, jobs `(260,255)`, portfolio `(200,180)`, climbing `(380,230)`, spending `(290,100)`, projects `(430,340)`.

## Tracker features

- **Spending** — expenses with categories and budgets, monthly analytics, multi-month history graphs
- **Jobs** — kanban pipeline (applied → screening → interviewing → offer → rejected/withdrawn), contacts per job, URL extraction
- **Fitness** — workout sessions with completion time; exercises as sets/reps/weight or time-based (seconds); edit sessions and individual sets inline; body weight log with history graph
- **Portfolio** — projects, skills, experience, about; public read-only view at `/` when unauthenticated
- **Climbing** — boulder and sport climb log with grades, wall type, attempts, sent/flash flags, optional photo upload
- **Dev Projects** — status/priority tracker, per-project todos, kanban board, GitHub last-commit fetch
