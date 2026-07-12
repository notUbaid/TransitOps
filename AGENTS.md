# TransitOps — Agent & Contributor Guide

## Stack

- **Build:** Vite 6 + TypeScript
- **UI:** React 19, Tailwind CSS v4 (tokens in `src/index.css` via `@theme`)
- **Routing:** react-router-dom v7 (SPA / `BrowserRouter`)
- **Charts:** Recharts
- **Icons:** Material Symbols (loaded in `index.html`)
- **Database:** Neon (Vercel Postgres) via `api/` serverless functions
- **Serverless runtime:** `@neondatabase/serverless` (HTTP-based)

## Architecture

- **Data layer (dev):** `src/lib/store.tsx` uses `localStorage` (same as before).
- **Data layer (production):** same `StoreProvider` switches to `fetch()` calls
  against `/api/db` when `import.meta.env.PROD` is true.
- **API:** `api/db.ts` is a Vercel serverless function that connects to Neon
  (Vercel Postgres). All business rules are enforced server-side.
- **Auth:** `src/lib/auth.tsx` — email/password against seeded users + registration.
  Session id persists in `localStorage`.
- **RBAC:** `src/lib/rbac.ts` is the single source of truth. It drives sidebar
  visibility (`visibleModules`), route guards (`RequireModule`), and per-page
  write access (`canEdit`).
- **Analytics:** `src/lib/analytics.ts` — all derived KPIs/ROI/chart data (pure functions).
- **Seed:** `src/lib/seed.ts` — realistic demo data, made business-rule-consistent at build time.

## Database

- PostgreSQL schema in `sql/001_schema.sql`.
- Run against your Neon database: `psql $DATABASE_URL -f sql/001_schema.sql`
- The schema includes all tables (`users`, `vehicles`, `drivers`, `trips`,
  `maintenance`, `expenses`, `settings`) with proper foreign keys and indexes.
- A default settings row is auto-inserted on migration.

## API (`api/db.ts`)

Single endpoint handling all operations via `POST { action, payload }`:
- `GET /api/db` — fetch full database
- `POST /api/db` — perform mutation, returns `{ ok, data, db }`
  - `data` = the created/updated entity
  - `db` = the full database after mutation (client syncs from this)

## Conventions

- Keep business logic in `store.tsx` (dev) or `api/db.ts` (prod); keep pages presentational.
- Reuse UI primitives in `src/components/ui/`. Do not hand-roll buttons/inputs/modals.
- Use the design tokens (`bg-surface-container`, `text-on-surface`, `font-label-md`, …),
  not raw hex. The look is **dark-mode-first glassmorphism**.
- Run `npm run typecheck` before finishing a change. `npm run build` must pass.

## Deployment (Vercel)

1. Create a Neon database (or attach Vercel Postgres in dashboard).
2. Set `DATABASE_URL` in Vercel environment variables.
3. Run migration: `psql $DATABASE_URL -f sql/001_schema.sql`
4. Deploy: `vercel` or connect Git repo.

The `api/` directory is automatically deployed as Vercel serverless functions.
The client build (`vite build`) outputs to `dist/`. The `vercel.json` rewrites
ensure `/api/*` routes go to functions and everything else serves `index.html`.

## Commands

- `npm run dev` — dev server (uses localStorage, no database needed)
- `npm run build` — production build (`dist/`)
- `npm run typecheck` — full TypeScript check
- `npm run preview` — preview the production build
