<div align="center">

# 🚚 TransitOps
### Smart Transport Operations Platform

<p align="center">
A modern fleet management platform that digitizes transport operations, vehicle lifecycle, driver management, maintenance, dispatching, and operational analytics.
</p>

![License](https://img.shields.io/badge/License-MIT-blue)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Tailwind%20CSS-61dafb)
![Status](https://img.shields.io/badge/Status-Active-success)
![Database](https://img.shields.io/badge/Database-PostgreSQL%20(Neon)-336791)

</div>

---

# 📖 Overview

TransitOps is an intelligent fleet management platform designed to replace manual spreadsheets and logbooks with a centralized, real-time digital solution.

The system enables organizations to efficiently manage their entire fleet — tracking vehicles, drivers, trips, maintenance schedules, fuel consumption, operational expenses, and fleet analytics — all from a single dashboard with role-based access control.

Built as a **zero-infrastructure React SPA** that deploys to Vercel with one click, TransitOps works immediately with `localStorage` for development and seamlessly switches to a production Neon (PostgreSQL) backend when deployed.

---

# 🚀 Problem Statement

Many logistics companies still rely on spreadsheets and manual processes for managing transport operations. This often results in:

- Vehicle scheduling conflicts
- Driver assignment issues
- Poor fleet utilization
- Missed maintenance schedules
- Expired driving licenses
- Inaccurate fuel and expense tracking
- Lack of operational insights

TransitOps solves these problems through automation, validation rules, real-time analytics, and a clean, modern interface.

---

# ✨ Features

## 🔐 Authentication & RBAC

- Secure email/password login & registration
- 4 distinct roles with granular permissions
- Role-Based Access Control enforced across navigation, routes, and every action
- One-click demo sign-in for each role
- Session persisted in `localStorage`

---

## 🚚 Fleet Management

- Vehicle registration with unique validation
- Real-time status tracking (Available, On Trip, In Shop, Retired)
- Type, capacity, odometer, and acquisition cost tracking
- Predictive service-due alerts based on odometer milestones
- Region-based filtering
- Search by registration number, name, or region
- CSV export

---

## 👨‍✈️ Driver Management

- Driver profiles with license validation
- License expiry warnings and colour-coded safety scores
- Driver availability and status tracking (Available, On Trip, Off Duty, Suspended)
- Category management (Light, Medium, Heavy, Trailer)
- Trip completion rate tracking
- CSV export

---

## 📦 Trip Dispatching

- Trip creation with live capacity validation
- Vehicle & driver assignment with availability checks
- Complete trip lifecycle: Draft → Dispatched → Completed / Cancelled
- Live dispatch board showing active and draft trips
- Automatic vehicle/driver status transitions
- Cargo weight enforcement against vehicle capacity
- Revenue tracking per trip
- CSV export

---

## 🔧 Maintenance

- Service logging with automatic vehicle shop status
- Active/Completed status management
- Per-vehicle maintenance cost tracking
- Automatic vehicle release on service completion
- Full service history with notes
- CSV export

---

## ⛽ Fuel & Expense Tracking

- Fuel, toll, maintenance, and other expense logging
- Auto-calculation of fuel cost based on liters and price/L
- Per-vehicle operational cost breakdown with visual bars
- Full expense history with search and type filtering
- CSV export

---

## 📊 Dashboard

Real-time KPIs displayed in a clean card layout:

- Fleet Utilization (with progress bar)
- Active Trips
- Pending Trips
- Drivers On Duty / Available
- Available Vehicles
- Active Vehicles (On Trip)
- Vehicles In Maintenance
- Revenue (Completed Trips)
- Fuel Efficiency (km/L)

Plus an **Alerts panel** with actionable operational notifications and a filterable Fleet Overview table.

---

## 📈 Analytics & Reports

- **Revenue vs Cost** — monthly composed bar/line chart
- **Expense Breakdown** — donut chart by category
- **Costliest Vehicles** — horizontal bar chart
- **Vehicle ROI** — sortable table with per-vehicle return on investment
- Fuel efficiency, fleet utilization, and operational cost KPIs
- PDF (print) and CSV export

---

# 🏗️ Architecture

## System Flow

```
┌─────────────────────────────────────────────────────────┐
│                    index.html                            │
│                    main.tsx                              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                     App.tsx                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Error    │ │ Theme    │ │ Store    │ │ Auth     │   │
│  │ Boundary │ │ Provider │ │ Provider │ │ Provider │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────────────────────────────────┐ │
│  │  Toast   │ │         BrowserRouter                 │ │
│  │ Provider │ │  ┌──────┐ ┌──────┐ ┌──────┐ ┌────┐  │ │
│  └──────────┘ │  │Login │ │Regis-│ │App   │ │404 │  │ │
│               │  │      │ │ter   │ │Layout│ │    │  │ │
│               │  └──────┘ └──────┘ └──┬───┘ └────┘  │ │
│               │                 ┌─────┼─────┐        │ │
│               │                 ▼     ▼     ▼        │ │
│               │           ┌──────────┐ ┌────────┐    │ │
│               │           │ Sidebar  │ │ Topbar │    │ │
│               │           └──────────┘ └────────┘    │ │
│               │                 ▼                     │ │
│               │          ┌────────────┐               │ │
│               │          │  <Outlet/> │               │ │
│               │          └─────┬──────┘               │ │
│               │  ┌─────────────┼──────────────────┐  │ │
│               │  ▼    ▼    ▼    ▼    ▼    ▼    ▼   ▼  │ │
│               │  Dsh  Flt  Drv  Trp  Mnt  Exp  Anl  │ │
│               │  Board eet  iers ips  ain.  ens. ytcs│ │
│               └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Data Layer

```
┌──────────────────────────────────────────────────┐
│                   Pages / Components               │
└──────────────────────┬───────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────┐
│              src/lib/store.tsx                     │
│         (React Context + useReducer)               │
│                                                    │
│  ┌──────────────┐  ┌───────────────────────┐      │
│  │ Dev Mode     │  │ Production Mode       │      │
│  │ localStorage │  │ fetch() → /api/db     │      │
│  └──────────────┘  └──────────┬────────────┘      │
└───────────────────────────────┼────────────────────┘
                                │
                ┌───────────────▼────────────────┐
                │       api/db.ts (Vercel)        │
                │  @neondatabase/serverless       │
                │  PostgreSQL (Neon)              │
                └────────────────────────────────┘
```

## Module Dependencies

```
                ┌──────────────────┐
                │  Authentication  │
                │  (src/lib/auth)  │
                └────────┬─────────┘
                         │
                ┌────────▼─────────┐
                │    Dashboard     │
                │  (src/pages/)    │
                └────────┬─────────┘
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                  │
       ▼                 ▼                  ▼
┌────────────┐   ┌────────────┐   ┌──────────────┐
│   Fleet    │   │  Drivers   │   │    Trips     │
│ (vehicles) │   │ (drivers)  │   │ (dispatch)   │
└──────┬─────┘   └──────┬─────┘   └──────┬───────┘
       │                │                 │
       └────────┬───────┘                 │
                │                         │
                ▼                         ▼
       ┌────────────────┐       ┌────────────────┐
       │  Maintenance   │       │Fuel & Expenses │
       └────────┬───────┘       └────────┬───────┘
                │                        │
                └───────────┬────────────┘
                            │
                            ▼
                 ┌──────────────────┐
                 │   Analytics &    │
                 │    Reports      │
                 │  (src/lib/ana-  │
                 │   lytics.ts)    │
                 └──────────────────┘
```

---

# ⚙️ Business Rules

All rules are enforced in `src/lib/store.tsx` and mirrored server-side in `api/db.ts`:

- Registration number must be **unique** per vehicle
- Retired vehicles cannot be assigned to trips
- Vehicles in maintenance (`IN_SHOP`) cannot be dispatched
- Vehicles already on trip cannot be double-booked
- Suspended drivers cannot be assigned to trips
- Drivers with expired licenses cannot be assigned
- Drivers already on trip cannot be double-booked
- Cargo weight **cannot exceed** vehicle capacity (live validation)
- Dispatch automatically sets vehicle → `ON_TRIP` and driver → `ON_TRIP`
- Completing a trip restores both vehicle and driver to `AVAILABLE`
- Cancelling a trip releases vehicle and driver back to `AVAILABLE`
- Active maintenance moves vehicle to `IN_SHOP`
- Completing maintenance releases vehicle to `AVAILABLE` (unless retired)
- Fuel cost auto-calculated from liters × fuel price per liter
- ROI guarded against divide-by-zero

---

# 📂 Database Schema (PostgreSQL)

```
users
├── id (UUID, PK)
├── name, email, password_hash, role
├── created_at

vehicles
├── id (UUID, PK)
├── registration_no (UNIQUE)
├── name, type, capacity_kg, odometer
├── acquisition_cost, region
├── status (AVAILABLE | ON_TRIP | IN_SHOP | RETIRED)
├── created_at, updated_at

drivers
├── id (UUID, PK)
├── name, license_number (UNIQUE)
├── category, license_expiry, phone
├── safety_score, trip_completion_rate
├── status (AVAILABLE | ON_TRIP | OFF_DUTY | SUSPENDED)
├── created_at, updated_at

trips
├── id (UUID, PK)
├── code (UNIQUE)
├── source, destination
├── vehicle_id (FK → vehicles), driver_id (FK → drivers)
├── cargo_kg, planned_km, start_odometer, end_odometer
├── fuel_liters, revenue
├── status (DRAFT | DISPATCHED | COMPLETED | CANCELLED)
├── created_at, updated_at

maintenance_logs
├── id (UUID, PK)
├── vehicle_id (FK → vehicles)
├── service_type, cost, service_date
├── notes
├── status (ACTIVE | COMPLETED)

expenses
├── id (UUID, PK)
├── type (FUEL | TOLL | MAINTENANCE | OTHER)
├── vehicle_id (FK → vehicles, nullable)
├── trip_id (FK → trips, nullable)
├── amount, liters, date, description

settings
├── id (UUID, PK)
├── company_name, depot_name, currency
├── distance_unit, fuel_price_per_liter
├── maintenance_alert_km, gst_rate
├── contact_email, contact_phone
```

All tables include proper foreign keys, indexes, and timestamps.

---

# 📊 Dashboard Metrics

| Metric | Source | Description |
|--------|--------|-------------|
| Fleet Utilization | `analytics.ts` | % of vehicles currently on trip |
| Active Trips | Direct count | Trips with DISPATCHED status |
| Pending Trips | Direct count | Trips with DRAFT status |
| Drivers On Duty | `analytics.ts` | Drivers with AVAILABLE or ON_TRIP status |
| Available Vehicles | `analytics.ts` | Vehicles with AVAILABLE status |
| Vehicles In Shop | Direct count | Vehicles with IN_SHOP status |
| Revenue (Completed) | `analytics.ts` | Sum of revenue from COMPLETED trips |
| Fuel Efficiency | `analytics.ts` | Average km/L across all trips |
| Fleet ROI | `analytics.ts` | Average (revenue − cost) / acquisition cost |
| Operational Cost | `analytics.ts` | Fuel + maintenance + tolls |

---

# 🛠️ Tech Stack

## Frontend

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite 6** | Build tool & dev server |
| **Tailwind CSS v4** | Utility-first styling |
| **react-router-dom v7** | SPA routing |
| **Recharts** | Charts & graphs |
| **Material Symbols** | Icon system |

## Backend & Data

| Technology | Purpose |
|------------|---------|
| **Neon (Vercel Postgres)** | Production database |
| **@neondatabase/serverless** | HTTP-based Postgres driver |
| **localStorage** | Development data store |
| **Vercel Serverless Functions** | API layer |

## Authentication

| Technology | Purpose |
|------------|---------|
| **Custom email/password** | Auth system |
| **localStorage session** | Session persistence |
| **RBAC (src/lib/rbac.ts)** | Role-Based Access Control |

---

# 📁 Project Structure

```
TransitOps/
│
├── api/                          # Vercel serverless functions
│   ├── _db.ts                    # Database connection & queries
│   ├── _types.ts                 # Shared API types
│   └── db.ts                     # API endpoint (all mutations)
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx     # Master layout (sidebar + topbar + outlet)
│   │   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   │   ├── Topbar.tsx        # Search, alerts, theme toggle, user menu
│   │   │   └── guards.tsx        # Route guards (RequireAuth, RequireModule)
│   │   ├── ui/
│   │   │   ├── primitives.tsx    # Button, Card, Input, Select, Badge, etc.
│   │   │   ├── KpiCard.tsx       # KPI metric card
│   │   │   ├── DataTable.tsx     # Generic typed data table
│   │   │   ├── Modal.tsx         # Portal-based modal
│   │   │   ├── Toast.tsx         # Toast notification system
│   │   │   ├── StatusBadge.tsx   # Color-coded status badges
│   │   │   ├── ConfirmDialog.tsx # Confirmation modal
│   │   │   └── Icon.tsx          # Material Symbols wrapper
│   │   └── ErrorBoundary.tsx
│   │
│   ├── lib/
│   │   ├── store.tsx             # Global state + all business logic
│   │   ├── auth.tsx              # Authentication context
│   │   ├── rbac.ts               # RBAC matrix & permission checks
│   │   ├── analytics.ts          # All derived KPIs, ROI, chart data
│   │   ├── theme.tsx             # Dark/light theme provider
│   │   ├── types.ts              # TypeScript types & constants
│   │   ├── seed.ts               # Demo data seeder
│   │   ├── format.ts             # Date, currency, number formatting
│   │   ├── csv.ts                # CSV export utility
│   │   └── utils.ts              # cn() helper (clsx + tailwind-merge)
│   │
│   ├── pages/
│   │   ├── Login.tsx             # Login page (with demo one-click sign-in)
│   │   ├── Register.tsx          # Registration page
│   │   ├── Dashboard.tsx         # Live KPIs, alerts, fleet overview
│   │   ├── Fleet.tsx             # Vehicle CRUD with filters
│   │   ├── Drivers.tsx           # Driver CRUD with license validation
│   │   ├── Trips.tsx             # Trip dispatch board + full trip table
│   │   ├── Maintenance.tsx       # Service logs with auto status updates
│   │   ├── Expenses.tsx          # Fuel & expense logging + cost breakdown
│   │   ├── Analytics.tsx         # Charts, ROI, export
│   │   └── Settings.tsx          # Company config & RBAC matrix viewer
│   │
│   ├── App.tsx                   # Root: providers + routing
│   ├── index.css                 # Tailwind v4 + design tokens
│   └── main.tsx                  # Entry point
│
├── sql/
│   └── 001_schema.sql            # Full PostgreSQL schema
│
├── docs/                         # Design docs & mockups
│
├── Dockerfile                    # Multi-stage production build
├── nginx.conf                    # Nginx config for SPA serving
├── docker-compose.yml            # One-command Docker deploy
├── vercel.json                   # Vercel deployment config
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json
└── README.md
```

---

# 🔄 Operational Workflow

```
                ┌──────────────────────┐
                │  Vehicle Registered  │
                │  (Fleet Management)  │
                └─────────┬────────────┘
                          │
                ┌─────────▼────────────┐
                │  Driver Registered   │
                │  (Driver Management) │
                └─────────┬────────────┘
                          │
                ┌─────────▼────────────┐
                │    Trip Created      │
                │  (Draft — validation)│
                └─────────┬────────────┘
                          │
                 ┌────────▼────────┐
                 │  Validation     │
                 │  • Vehicle      │
                 │    available?   │
                 │  • Driver       │
                 │    available?   │
                 │  • Cargo ≤ cap? │
                 └────────┬────────┘
                          │
               ┌──────────▼──────────┐
               │    DISPATCHED       │
               │  Vehicle → ON_TRIP  │
               │  Driver  → ON_TRIP  │
               └──────────┬──────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
     ┌────────▼────────┐   ┌─────────▼─────────┐
     │   COMPLETED     │   │    CANCELLED      │
     │ Vehicle → Avail │   │ Vehicle → Avail   │
     │ Driver  → Avail │   │ Driver  → Avail   │
     │ Fuel logged     │   └───────────────────┘
     │ Revenue booked  │
     └────────┬────────┘
              │
              ▼
     ┌────────────────┐
     │  Maintenance   │
     │  (if needed)   │
     │ Vehicle→IN_SHOP│
     │      ↓         │
     │ Completed →    │
     │ Vehicle→Avail  │
     └────────────────┘
              │
              ▼
     ┌────────────────┐
     │  Reports &     │
     │  Analytics     │
     │  Updated       │
     └────────────────┘
```

---

# 🚀 Getting Started

## Prerequisites

- Node.js 20+
- npm 9+

## Development

```bash
# Install dependencies
npm install

# Start dev server (localStorage mode — no database needed)
npm run dev
# → http://localhost:5173
```

## Production Build

```bash
npm run build       # outputs to dist/
npm run preview     # preview the production build
npm run typecheck   # full TypeScript type checking
```

## Docker

```bash
# Build and run with Docker
docker compose up --build
# → http://localhost:8080
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect the Git repository in the Vercel dashboard. The `vercel.json` handles SPA rewrites automatically.

For production database mode, set `DATABASE_URL` in Vercel environment variables and run:

```bash
psql $DATABASE_URL -f sql/001_schema.sql
```

---

# 🔐 Demo Accounts

One-click sign-in buttons are on the login screen. Shared password: **`transit123`**

| Role | Email | Full Access | View Access |
|------|-------|-------------|-------------|
| 👑 Fleet Manager | `manager@transitops.in` | Fleet, Drivers, Maintenance, Settings | Everything |
| 🚦 Dispatcher | `dispatcher@transitops.in` | Trips | Fleet (view) |
| 🛡️ Safety Officer | `safety@transitops.in` | Drivers, Maintenance | Fleet (view) |
| 💰 Financial Analyst | `finance@transitops.in` | Expenses, Analytics | Fleet, Trips (view) |

You can also **register a new account** with any role from the sign-up screen.

---

# 🎯 Future Enhancements

- [ ] Email notifications & alerts
- [ ] GPS tracking integration
- [ ] AI-based route optimization
- [ ] Predictive maintenance scheduling
- [ ] Driver document management
- [ ] Mobile application (React Native)
- [ ] PDF invoice/report generation
- [ ] Multi-depot support
- [ ] Real-time vehicle tracking map
- [ ] Driver performance analytics

---

# 📜 License

MIT

---

<div align="center">

### ⭐ If you find this project useful, consider starring the repository!

Made with ❤️ for fleet operators everywhere

</div>
