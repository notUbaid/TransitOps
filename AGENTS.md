# TransitOps — Agent & Contributor Guide

TransitOps is a **client-side React SPA** (no backend server). It is intentionally
architected to deploy to Vercel as a static site with zero infrastructure to provision.

## Stack

- **Build:** Vite 6 + TypeScript
- **UI:** React 19, Tailwind CSS v4 (tokens in `src/index.css` via `@theme`)
- **Routing:** react-router-dom v7 (SPA / `BrowserRouter`)
- **Charts:** Recharts
- **Icons:** Material Symbols (loaded in `index.html`)

## Architecture

- **Data layer:** `src/lib/store.tsx` is a React context that owns the entire
  database (`Database` in `src/lib/types.ts`) and persists it to `localStorage`.
  Every mutation and **all business rules** live here — components never mutate
  state directly. Actions return `ActionResult` (`{ ok } | { ok:false, error }`).
- **Auth:** `src/lib/auth.tsx` — email/password against seeded users + registration.
  Session id persists in `localStorage`.
- **RBAC:** `src/lib/rbac.ts` is the single source of truth. It drives sidebar
  visibility (`visibleModules`), route guards (`RequireModule`), and per-page
  write access (`canEdit`).
- **Analytics:** `src/lib/analytics.ts` — all derived KPIs/ROI/chart data (pure functions).
- **Seed:** `src/lib/seed.ts` — realistic demo data, made business-rule-consistent at build time.

## Conventions

- Keep business logic in `store.tsx`; keep pages presentational.
- Reuse UI primitives in `src/components/ui/`. Do not hand-roll buttons/inputs/modals.
- Use the design tokens (`bg-surface-container`, `text-on-surface`, `font-label-md`, …),
  not raw hex. The look is **dark-mode-first glassmorphism**.
- Run `npm run typecheck` before finishing a change. `npm run build` must pass.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (`dist/`)
- `npm run typecheck` — full TypeScript check
- `npm run preview` — preview the production build
