<p align="center">
  <img src="assets/branding/fin-app-icon.svg" width="96" alt="fin" />
</p>

<h1 align="center">fin</h1>

<p align="center">
  Offline-only, privacy-focused personal finance tracker for macOS
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#development">Development</a> ·
  <a href="#project-structure">Project Structure</a> ·
  <a href="#tech-stack">Tech Stack</a>
</p>

---

**fin** is a lightweight desktop app for tracking your personal finances — completely offline, with no accounts, no sync, and no data ever leaving your machine. Import transactions from CSV exports, categorize your spending, spot recurring charges, and visualize your cash flow over time.

## Features

- **Dashboard** — net worth, cash flow trend, spending by category, and a Sankey breakdown of where your money goes
- **Transactions** — full transaction list with search, filters, inline editing, and category assignment
- **Accounts** — track checking, savings, credit cards, investments, and more; optionally include/exclude from net worth
- **CSV Import** — import transactions from any bank export with a flexible column mapper; duplicate detection and undo support
- **Recurring detection** — automatically flags recurring transactions and shows a calendar view of upcoming charges
- **Categories** — fully customizable income and expense categories with icon picker
- **Settings** — dashboard period, anchor date, and app preferences
- **Onboarding** — guided first-run flow to add your first account and import transactions
- **Completely local** — all data lives in a single SQLite file on your machine; no cloud, no telemetry

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- macOS (primary target; Linux and Windows builds are supported by the underlying framework)

### Installation

```bash
git clone https://github.com/shouryan01/fin.git
cd fin
bun install
```

### Running in Development

```bash
bun go
```

That's it. `bun go` starts the Vite HMR server and the Electrobun app concurrently — see [How `bun go` Works](#how-bun-go-works) for details.

## Development

### How `bun go` Works

`bun go` is the recommended development command. It runs two processes in parallel:

| Process | Command | Purpose |
|---|---|---|
| Vite dev server | `bun run hmr` | Serves the frontend on `localhost:5173` with HMR |
| Electrobun | `bun run start` | Builds the frontend bundle and launches the native app |

The app detects the running Vite server at startup and loads from it instead of the bundled assets, so React component changes reflect instantly without a full reload. Both processes stop together when you quit.

### Other Commands

```bash
# Development without HMR — uses the bundled assets, watch mode re-launches on changes
bun run dev

# Build a canary release
bun run build:canary

# Lint, format, and type-check
bun run lint
bun run format
bun run check
```

### Database

fin uses [Drizzle ORM](https://orm.drizzle.team) with a local SQLite file. The schema lives in [`src/mainview/db/schema.ts`](src/mainview/db/schema.ts).

```bash
# Generate a new migration after schema changes
bun run db:generate

# Apply migrations
bun run db:migrate

# Open Drizzle Studio (visual DB browser)
bun run db:studio
```

The SQLite database is created automatically on first launch via `initializeFinanceStore()` in the main process.

## Project Structure

```
fin/
├── src/
│   ├── bun/
│   │   ├── index.ts              # Main process — window setup, RPC registration, app menu
│   │   └── finance-service.ts    # All database logic (accounts, transactions, dashboard, etc.)
│   ├── mainview/
│   │   ├── components/
│   │   │   ├── ui/               # shadcn/ui primitives (Button, Input, Dialog, etc.)
│   │   │   ├── app-sidebar.tsx   # Navigation sidebar
│   │   │   ├── cash-flow-trend-chart.tsx
│   │   │   ├── category-chart-6m.tsx
│   │   │   ├── sankey-chart.tsx
│   │   │   ├── spend-vs-prior-chart.tsx
│   │   │   ├── spent-heatmap.tsx
│   │   │   └── ...               # Recurring, category glyph, animated currency, etc.
│   │   ├── db/
│   │   │   ├── schema.ts         # Drizzle table definitions
│   │   │   └── index.ts          # Drizzle client initialization
│   │   ├── hooks/
│   │   │   └── use-mobile.tsx
│   │   ├── lib/
│   │   │   ├── format.ts         # Currency and date formatters
│   │   │   ├── chart-fill.ts     # Chart color helpers
│   │   │   └── electroview.ts    # Typed RPC client for the renderer
│   │   ├── queries/              # TanStack Query hooks, one file per feature
│   │   │   ├── dashboard.ts
│   │   │   ├── transactions.ts
│   │   │   ├── accounts.ts
│   │   │   ├── categories.ts
│   │   │   ├── imports.ts
│   │   │   └── settings.ts
│   │   ├── routes/               # TanStack Router file-based routes
│   │   ├── screens/              # Full-page screen components
│   │   │   ├── dashboard.tsx
│   │   │   ├── transactions.tsx
│   │   │   ├── accounts.tsx
│   │   │   ├── imports.tsx
│   │   │   ├── settings.tsx
│   │   │   └── onboarding.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css             # Tailwind CSS entry
│   └── shared/
│       ├── finance.ts            # Shared input/output types used by both processes
│       ├── rpc.ts                # RPC interface contract (request/response types)
│       └── category-icons.ts     # Category icon registry
├── drizzle/                      # Auto-generated SQL migrations
├── assets/
│   ├── branding/                 # SVG app icon and mascot
│   └── icon.iconset/             # macOS icon set (all resolutions)
├── electrobun.config.ts          # App name, bundle ID, build copy rules
├── vite.config.ts
├── tailwind.config.js
├── drizzle.config.ts
└── package.json
```

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime & package manager | [Bun](https://bun.sh) |
| Desktop framework | [Electrobun](https://electrobun.dev) |
| Frontend | [React 19](https://react.dev) |
| Routing | [TanStack Router](https://tanstack.com/router) |
| Data fetching | [TanStack Query](https://tanstack.com/query) |
| Database | SQLite via [Drizzle ORM](https://orm.drizzle.team) |
| Styling | [Tailwind CSS v3](https://tailwindcss.com) |
| UI primitives | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com) |
| Charts | [Recharts](https://recharts.org) |
| Build tool | [Vite](https://vitejs.dev) |
| Linting / formatting | [Biome](https://biomejs.dev) |

## Data Model

The SQLite schema has six tables:

| Table | Purpose |
|---|---|
| `accounts` | Bank accounts, credit cards, investments |
| `transactions` | Individual transactions with category, merchant, and recurring flag |
| `categories` | User-defined income/expense categories with icon |
| `transaction_imports` | Import history with row/duplicate/skip counts and undo support |
| `transaction_import_mappings` | Saved CSV column mappings per account and source file |
| `account_balance_snapshots` | Point-in-time balance records used for net worth history |

## Architecture

fin follows a two-process model typical of Electron-style desktop apps:

- **Main process** (`src/bun/`) — runs in Bun, owns the SQLite database, exposes all finance operations over a typed RPC interface
- **Renderer process** (`src/mainview/`) — React app running in a WebView, calls the main process via the RPC client in `lib/electroview.ts`, caches responses with TanStack Query

The shared types in `src/shared/` are imported by both sides so the RPC contract is enforced at compile time.

## License

MIT — see [LICENSE](LICENSE) for details.
