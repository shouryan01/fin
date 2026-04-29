# fin

Offline-only, privacy-focused personal finance tracker

A fast and light desktop app built with Electrobun, React, Tailwind CSS, and Vite.

## Getting Started

```bash
# Install dependencies
bun install

# Start development (recommended) — runs Vite HMR + Electrobun concurrently
bun go

# Development without HMR (uses bundled assets, watch mode)
bun run dev

# Build a canary release
bun run build:canary
```

## How `bun go` Works

`bun go` is the recommended way to develop. It runs two processes concurrently:

1. **Vite dev server** (`bun run hmr`) starts on `http://localhost:5173` with HMR enabled
2. **Electrobun** (`bun run start`) builds the frontend and launches the app

The app detects the running Vite server and loads from it instead of bundled assets, so React component changes update instantly without a full reload. Both processes are stopped together when you quit.

## Project Structure

```
├── src/
│   ├── bun/
│   │   ├── index.ts              # Main process (Electrobun/Bun), RPC handlers
│   │   └── finance-service.ts    # SQLite finance data layer
│   ├── mainview/
│   │   ├── components/           # UI components and charts
│   │   ├── db/                   # Drizzle ORM setup and schema
│   │   ├── hooks/                # React hooks
│   │   ├── lib/                  # Utilities (formatting, chart helpers)
│   │   ├── queries/              # TanStack Query hooks (per feature)
│   │   ├── routes/               # TanStack Router route definitions
│   │   ├── screens/              # Full-page screen components
│   │   ├── App.tsx               # React app root
│   │   ├── main.tsx              # React entry point
│   │   └── index.css             # Tailwind CSS
│   └── shared/
│       ├── finance.ts            # Shared types for finance data
│       └── rpc.ts                # RPC interface definition
├── drizzle/                      # Generated migrations
├── assets/                       # App icons and branding
├── electrobun.config.ts
├── vite.config.ts
├── tailwind.config.js
└── package.json
```
