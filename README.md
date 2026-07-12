# TransitOps — Smart Transport Operations Platform

An end-to-end transport operations platform that digitizes vehicle, driver,
dispatch, maintenance, and expense management while enforcing business rules
and providing operational insights. Built for the 8-hour hackathon; screens
follow the official Excalidraw wireframe (`docs/wireframe.excalidraw`).

## Quick start

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows  (Linux/macOS: source .venv/bin/activate)
pip install -r requirements.txt
python run.py
```

Open http://127.0.0.1:5000 — the SQLite database is created and seeded with
demo data on first run.

### Demo accounts (password for all: `transit123`)

| Email | Role | Access |
| --- | --- | --- |
| `meera.f@transitops.in` | Fleet Manager | Fleet, Drivers, Maintenance, Analytics, Settings |
| `raven.k@transitops.in` | Dispatcher | Dashboard, Trips (+ Fleet view) |
| `sana.s@transitops.in` | Safety Officer | Drivers & compliance (+ Trips view) |
| `farhan.a@transitops.in` | Financial Analyst | Fuel & Expenses, Analytics (+ Fleet/Maintenance view) |

### Tests

```bash
pytest
```

Covers login lockout, RBAC, unique registration, every dispatch validation,
automatic status transitions, and the maintenance workflow.

## Feature checklist

**Mandatory deliverables**
- [x] Responsive web interface (desktop → mobile sidebar collapse)
- [x] Authentication with RBAC (per-role module access, enforced server-side)
- [x] Account lockout after 5 failed login attempts
- [x] CRUD for Vehicles and Drivers
- [x] Trip management with validations (capacity, availability, license)
- [x] Automatic status transitions (dispatch / complete / cancel / maintenance)
- [x] Maintenance workflow (active → In Shop, close → Available)
- [x] Fuel & expense tracking with auto operational cost (Fuel + Maintenance)
- [x] Dashboard with KPIs and type/status/region filters

**Bonus features**
- [x] Charts and visual analytics (monthly revenue, costliest vehicles)
- [x] CSV export (vehicles, drivers, trips, fuel/expenses, analytics)
- [x] Email reminders for expiring licenses (mock mailer, 30-day horizon)
- [x] Search, filters, and sorting (topbar quick-search + sortable columns)
- [x] Dark mode (persisted per browser)

## Business rules enforced

All ten mandatory rules from the problem statement are enforced in
`transitops/services/rules.py` and the trip/maintenance routes — see
`docs/PROBLEM_STATEMENT.md` §4 for the list. The UI mirrors the checks
(e.g. live "Capacity exceeded by N kg — dispatch blocked" on the trip form),
but the server is always the authority.

## Architecture

```
run.py                     entry point (auto-seeds on first run)
transitops/
  __init__.py              app factory, Jinja filters (Indian number format)
  auth.py                  login/logout + lockout
  rbac.py                  role → module permission matrix + @require decorator
  db.py / schema.sql       SQLite layer
  seed.py                  demo data matching the wireframe
  services/
    rules.py               the 10 mandatory business rules
    stats.py               KPIs, fuel efficiency, utilization, ROI
    reminders.py           license expiry reminders (mock mailer)
  routes/                  one blueprint per module (8 screens)
  templates/ static/       Jinja templates + CSS/JS (no build step, no CDN)
tests/                     pytest suite for auth + business rules
docs/                      problem statement, wireframe, original PDF
scripts/                   git history tooling (see below)
```

Stack: **Python / Flask / SQLite / vanilla JS** — no build step, no external
CDNs, runs fully offline.

## Team & git history

Team members are defined in `scripts/team.env`. To (re)build the repo history
with real names/emails — commits are distributed evenly so every member has
8+ meaningful commits:

```bash
# 1. edit scripts/team.env (names + the emails linked to your GitHub accounts)
# 2. from the repo root:
bash scripts/make_history.sh
```

> Note: a commit counts toward a member's GitHub contribution graph only if
> its author email matches an email on that member's GitHub account.
