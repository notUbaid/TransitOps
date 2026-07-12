# 📋 TransitOps - Remaining Integration & Feature TO-DOs

Based on an analysis of the recently pulled codebase, the team has successfully bootstrapped a full **Python (Flask) + SQLite + Jinja2** application. This includes routing, database schema, RBAC authentication, dark mode, basic charts, and email reminders. 

However, there is a **major architecture discrepancy** between the `ProjectDetails.md` (which mandates Next.js/Prisma) and the pulled Flask codebase. Additionally, several advanced bonus features from the `PROBLEM_STATEMENT.md` remain unimplemented.

Here is the massive TO-DO list of what is left to integrate and build.

---

## 🏗️ 1. Architecture Alignment & Resolution
**DECISION MADE:** Migrate to Next.js, keep SQLite.
- [x] Update `ProjectDetails.md` to reflect SQLite decision.
- [ ] **Migrate to Next.js:** Rebuild the frontend in Next.js 15 / React (App Router), replacing the Flask Jinja templates.
- [ ] **API/Backend Strategy:** Port the Flask routes into Next.js Server Actions, operating on the existing SQLite database via Prisma ORM.

---

## 🚀 2. Missing Core & Advanced Features
These features were defined in the `PROBLEM_STATEMENT.md` but are currently missing from the Flask codebase:

### Document Management
- [ ] **Vehicle Document Uploads:** Implement file upload capabilities for vehicle registration, insurance, and emissions certificates.
- [ ] **Driver Document Uploads:** Implement secure storage for scanned driver licenses and background checks.
- [ ] **Document Expiry Tracking:** Add automated status checks for expiring vehicle and driver documents.

### Export & Reporting
- [ ] **PDF Export Engine:** Integrate `pdfkit` or `WeasyPrint` to generate downloadable PDF reports for Analytics, Trips, and Expenses (currently only CSV is implemented).
- [ ] **Scheduled Reports:** Create a background worker (e.g., Celery) to email weekly operational summary reports to the Financial Analyst and Fleet Manager.

### Advanced Capabilities (Bonus Features)
- [ ] **GPS Tracking Simulation:** Integrate a map view (e.g., Leaflet.js) to display mock real-time locations for vehicles that are currently `on_trip`.
- [ ] **AI Route Optimization:** Integrate an external mapping API (Google Maps / Mapbox) to suggest the most fuel-efficient route between the Trip's Source and Destination.
- [ ] **Predictive Maintenance:** Add a basic algorithm to flag vehicles for maintenance automatically based on Odometer milestones, rather than waiting for manual entry.

---

## 🛠️ 3. Codebase Improvements & Technical Debt
- [ ] **Pagination:** The frontend currently relies on client-side global table search. Implement server-side pagination for `/trips`, `/expenses`, and `/vehicles` to handle scaling.
- [ ] **API JSON Serialization:** If migrating to a Next.js frontend or mobile app, the Flask routes must be updated to return standard JSON payloads rather than rendering Jinja templates (`render_template`).
- [ ] **Missing Test Coverage:** Create unit tests for the missing route modules (e.g., `tests/test_analytics.py`, `tests/test_dashboard.py`, `tests/test_expenses.py`).
- [ ] **Environment Variables:** Move sensitive config items (secret keys, mock email configurations) into a `.env` file using `python-dotenv`.
- [ ] **Dockerization:** Add a `Dockerfile` and `docker-compose.yml` to standardize the development environment for all agents.

---

## 🚦 4. Business Rule Edge-Cases to Verify
- [ ] Ensure that a vehicle with `capacity_kg` strictly rejects trips where `cargo_kg` > capacity (Current JS check exists, but verify server-side enforcement).
- [ ] Verify that completing a maintenance log correctly releases the vehicle back to `available` status, unless manually marked `retired`.
- [ ] Ensure the Analytics dashboard accurately calculates Vehicle ROI: `(Revenue - (Maintenance + Fuel)) / Acquisition Cost` and gracefully handles division by zero if Acquisition Cost is 0.
