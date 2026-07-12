# TransitOps - Project Details

## 📖 Project Overview
TransitOps is a modern transport operations platform built for logistics companies. Its primary purpose is to replace spreadsheets and manual processes with a centralized web application that manages the complete lifecycle of transport operations.

This project is being developed as a hackathon project based on the official problem statement.

## 🎯 Project Goals
The platform should allow organizations to:
- **Register vehicles**
- **Register drivers**
- **Dispatch trips**
- **Prevent invalid assignments**
- **Track maintenance**
- **Record expenses**
- **Generate operational insights**

The system must automatically enforce every business rule without requiring manual intervention.

## 🛠️ Tech Stack
**Frontend:** Next.js 15 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, React Hook Form, TanStack Table, Recharts.
**Backend:** Next.js API Routes (Server Actions / Route Handlers).
**Database:** PostgreSQL, Prisma ORM.
**Authentication:** Better Auth.
**Deployment:** Vercel (Frontend & API), Supabase (Database).

## 👥 Roles and Permissions (RBAC)
The application has four primary roles, each scoped to specific responsibilities:

| Role | Fleet | Drivers | Trips | Fuel & Exp. | Analytics |
|------|-------|---------|-------|-------------|-----------|
| **Fleet Manager** | ✅ Manage | ✅ Manage | ❌ No Access | ❌ No Access | ✅ View |
| **Dispatcher** | 👁️ View | ❌ No Access | ✅ Manage | ❌ No Access | ❌ No Access |
| **Safety Officer** | ❌ No Access | ✅ Manage | 👁️ View | ❌ No Access | ❌ No Access |
| **Financial Analyst** | 👁️ View | ❌ No Access | ❌ No Access | ✅ Manage | ✅ View |

### Role Responsibilities
- **Fleet Manager:** Vehicle management, maintenance, fleet overview, reports.
- **Dispatcher:** Create trips, assign vehicles, assign drivers, complete trips.
- **Safety Officer:** Driver compliance, license expiry, safety scores.
- **Financial Analyst:** Expenses, fuel costs, ROI, reports.

---

## 🧩 Core Modules

### 1. Authentication
- Login / Logout
- Session Management
- Protected Routes
- Role-Based Access Control enforcement

### 2. Dashboard
Provides real-time KPIs and system overview:
- Active Vehicles / Available Vehicles / Vehicles in Shop
- Active Trips / Pending Trips
- Drivers On Duty
- Fleet Utilization %
- Charts: Fuel Consumption, Monthly Expenses, Fleet Status, Trips by Region

### 3. Vehicle Registry
CRUD operations for vehicles.

**Vehicle Fields:**
- Registration No. (Unique)
- Vehicle Name/Model
- Vehicle Type (Van, Truck, Mini, etc.)
- Maximum Capacity (kg/tons)
- Odometer
- Acquisition Cost
- Status (Available, On Trip, In Shop, Retired)

**Validations:** Registration number must always be unique. Retired/In Shop vehicles are hidden from the Trip Dispatcher.

### 4. Driver Management
CRUD operations for drivers.

**Driver Fields:**
- Name
- License Number
- License Category
- Expiry Date
- Phone
- Trip Compl. %
- Safety Score
- Status (Available, On Trip, Off Duty, Suspended)

**Validations:** Expired licenses cannot be dispatched. Suspended drivers cannot be assigned.

### 5. Trip Management
Manages trip dispatching and lifecycle.

**Trip Fields:**
- Source
- Destination
- Vehicle
- Driver
- Cargo Weight
- Planned Distance
- Status (Draft, Dispatched, Completed, Cancelled)

**Lifecycle & Validations:**
- **Draft ➡️ Dispatched:** System automatically checks vehicle availability, driver availability, and ensures Cargo Weight <= Vehicle Capacity. If valid, changes Vehicle and Driver status to `On Trip`.
- **Dispatched ➡️ Completed/Cancelled:** Automatically restores Vehicle and Driver to `Available`. On Complete: odometer, fuel log, and expenses can be triggered.

### 6. Maintenance
Logs maintenance activities and affects vehicle availability.

**Maintenance Fields:**
- Vehicle
- Service Type
- Cost
- Date
- Status (Active, Completed)

**Lifecycle:** 
- Creating an `Active` record sets the Vehicle to `In Shop`.
- Changing to `Completed` restores the Vehicle to `Available` (unless retired).

### 7. Fuel & Expense Management
Manages financial logs associated with operations.

**Fuel Log Fields:**
- Vehicle
- Date
- Liters
- Fuel Cost

**Other Expenses Fields:**
- Trip
- Vehicle
- Toll
- Other
- Maint. (Linked)
- Total

**Metrics:** 
- Total Operational Cost (Auto) = Fuel + Maintenance + Tolls + Other.

### 8. Reports & Analytics
Calculates and displays core metrics:
- **Fuel Efficiency:** Distance / Fuel
- **Operational Cost:** Fuel + Maintenance + Other Expenses
- **Fleet Utilization:** Active Vehicles / Total Vehicles
- **Vehicle ROI:** (Revenue - Expenses) / Acquisition Cost

### 9. Settings
Manages global configurations:
- Depot Name
- Currency
- Distance Unit

---

## 🏗️ Architecture & Structure

### Frontend Structure (`src/app/`)
- `(auth)/login`
- `(dashboard)/dashboard`
- `(dashboard)/fleet` (Vehicles)
- `(dashboard)/drivers`
- `(dashboard)/trips`
- `(dashboard)/maintenance`
- `(dashboard)/fuel-expenses`
- `(dashboard)/analytics` (Reports)
- `(dashboard)/settings`

### Backend API (`src/app/api/` or Server Actions)
- Vehicles CRUD
- Drivers CRUD
- Trips CRUD & State Machine (Dispatch/Complete/Cancel)
- Maintenance CRUD
- Fuel/Expenses CRUD

### Database Schema (Prisma)
Entities: `User`, `Role`, `Vehicle`, `Driver`, `Trip`, `MaintenanceLog`, `FuelLog`, `Expense`, `TripHistory`, `Notification`, `AuditLog`.

---

## 🚦 Business Rules Summary (Strictly Enforced)
1. Registration numbers must be unique.
2. Retired or In-Shop vehicles cannot be assigned.
3. Expired or Suspended drivers cannot be assigned.
4. Vehicles/Drivers already on a trip cannot be assigned.
5. Cargo weight must not exceed vehicle capacity.
6. Dispatching changes vehicle/driver to `On Trip`.
7. Completing/Cancelling a trip restores vehicle/driver to `Available`.
8. Active maintenance sets vehicle to `In Shop`.

## ✨ Quality of Life (QoL) / Minor Features
To make the application stand out, the following features will be included:
- **Dark Mode Support:** Toggleable theme (light/dark).
- **Toast Notifications:** For successful actions (e.g., "Trip Dispatched Successfully") or errors.
- **Export to CSV:** For tables in the Analytics and Fleet modules.
- **Interactive Charts:** Hover effects and tooltips using Recharts.
- **Dashboard Quick Actions:** "Create Trip" button directly on the dashboard.
- **Predictive Status Badges:** Color-coded badges (e.g., Red for `Suspended`, Green for `Available`).
- **Global Search & Filtering:** Filter tables by Status, Date, or Vehicle Type.
- **Warning Tooltips:** If a driver's license is expiring within 30 days, show a yellow warning icon next to their name.
- **Mobile Responsive Tables:** Optimized views for tablets/mobile dispatchers.
