# TransitOps — Smart Transport Operations Platform

A centralized fleet-operations console that replaces spreadsheets: manage vehicles,
drivers, trip dispatch, maintenance, fuel & expenses, and analytics — with strict
business rules and role-based access control enforced throughout.

Built as a **fast, zero-infrastructure React SPA** that deploys to Vercel with one click.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Build | Vite 6 + TypeScript |
| UI | React 19 · Tailwind CSS v4 · Material Symbols |
| Routing | react-router-dom v7 (SPA) |
| Charts | Recharts |
| Data | In-browser store persisted to `localStorage` (no backend to provision) |
| Auth | Email/password + registration, session in `localStorage` |
| Deploy | Vercel (static) — see `vercel.json` |

> **Why no backend?** SQLite/Prisma/Better-Auth on serverless kept breaking on
> Vercel's ephemeral filesystem. The data layer here is isolated behind a clean
> service API (`src/lib/store.tsx`), so every feature works with zero setup and a
> real backend can be dropped in later without touching the UI.

---

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

Build & preview production:

```bash
npm run build      # outputs dist/
npm run preview
npm run typecheck  # full TS check
```

---

## Demo accounts

One-click sign-in buttons are on the login screen. Shared password: `transit123`.

| Role | Email | Access |
| --- | --- | --- |
| Fleet Manager | `manager@transitops.in` | Fleet, Drivers, Maintenance (full) |
| Dispatcher | `dispatcher@transitops.in` | Trips (full), Fleet (view) |
| Safety Officer | `safety@transitops.in` | Drivers, Maintenance (full) |
| Financial Analyst | `finance@transitops.in` | Expenses, Analytics (full) |

You can also **register a new account** and pick a role from the sign-up screen.

---

## Features

- **Auth + RBAC** — login, registration, 4 roles; permissions enforced across
  navigation, routes, and every action (`src/lib/rbac.ts`).
- **Dashboard** — 8 live KPIs (utilization, active/pending trips, drivers on duty…)
  with type/status/region filters and an alerts panel.
- **Fleet registry** — vehicle CRUD, unique registration, status lifecycle,
  predictive service-due flags.
- **Drivers** — profile CRUD, license-expiry warnings, safety scores.
- **Trip dispatcher** — create → dispatch → complete → cancel, with **live capacity
  validation** and automatic vehicle/driver status transitions.
- **Maintenance** — service logs that send vehicles to the shop and release them on completion.
- **Fuel & expenses** — fuel/toll/other logging with per-vehicle operational cost breakdown.
- **Analytics** — fuel efficiency, utilization, operational cost, and Vehicle ROI charts.
- **QoL** — global search, toasts, CSV export on every table, PDF (print) export,
  dark/light theme, responsive layout, empty/loading states.

### Business rules enforced (`src/lib/store.tsx`)

Unique registration & license · retired/in-shop vehicles hidden from dispatch ·
expired-license/suspended drivers blocked · cargo ≤ capacity · dispatch → both
statuses `ON_TRIP` · complete/cancel → restore `AVAILABLE` · active maintenance →
`IN_SHOP` → release on completion (unless retired) · ROI guards divide-by-zero.

---

## Deploy to Vercel

Import the repo in Vercel (framework auto-detected as **Vite**) or:

```bash
npm i -g vercel && vercel
```

`vercel.json` sets the SPA rewrite so client-side routes resolve on refresh.

---

## Project structure

```
src/
├── lib/            store, auth, rbac, analytics, seed, types, format, csv, theme
├── components/
│   ├── ui/         Button, Card, Modal, DataTable, KpiCard, StatusBadge, Toast…
│   └── layout/     Sidebar, Topbar, AppLayout, route guards
├── pages/          Login, Register, Dashboard, Fleet, Drivers, Trips,
│                   Maintenance, Expenses, Analytics, Settings
└── App.tsx         providers + routing (lazy-loaded pages)
```

Spec & design reference live in `docs/`.
