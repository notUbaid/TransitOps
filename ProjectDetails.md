# 🚚 TransitOps - Master Development Blueprint

> **⚠️ AI AGENT INSTRUCTION ⚠️**
> You are reading the Master Blueprint for TransitOps. 
> There are up to 4 AI agents working on this project concurrently. 
> 1. Read this file carefully before making any changes.
> 2. Always follow the established Tech Stack, Schema, and Folder Structure to prevent conflicts.
> 3. When you complete a task in the **Implementation Checklist** (Section 7), mark it with an `[x]`.
> 4. Ensure you do not duplicate components. Reuse existing shadcn/ui components.
> 5. Never modify business rules without updating this document.

---

## 📖 1. Project Overview & Goals
TransitOps is a centralized transport operations platform replacing spreadsheets for logistics companies.
The platform manages vehicles, drivers, trips, maintenance, and expenses, enforcing strict business rules automatically (e.g., preventing dispatch of suspended drivers or overloaded vehicles).

## 🛠️ 2. Tech Stack & Environment
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State/Data Fetching:** React Server Components (RSC) + Server Actions
- **Forms:** React Hook Form + Zod (for validation)
- **Tables/Charts:** TanStack Table v8, Recharts
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** Better Auth (Role-Based Access Control)

---

## 🗄️ 3. Database Schema (Prisma Definitions)

*AI Agents: Follow these models strictly when querying or creating the `schema.prisma`.*

### `User`
- `id` (String, PK)
- `email` (String, Unique)
- `name` (String)
- `role` (Enum: `FLEET_MANAGER`, `DISPATCHER`, `SAFETY_OFFICER`, `FINANCIAL_ANALYST`)
- `passwordHash` (String)

### `Vehicle`
- `id` (String, PK)
- `registrationNo` (String, Unique)
- `name` (String)
- `type` (Enum: `VAN`, `TRUCK`, `MINI`)
- `capacityKg` (Int)
- `odometer` (Int)
- `acquisitionCost` (Float)
- `status` (Enum: `AVAILABLE`, `ON_TRIP`, `IN_SHOP`, `RETIRED`)

### `Driver`
- `id` (String, PK)
- `name` (String)
- `licenseNumber` (String, Unique)
- `licenseCategory` (Enum: `LMV`, `HMV`)
- `expiryDate` (DateTime)
- `phone` (String)
- `tripCompletionRate` (Float) // Trip Compl. %
- `safetyScore` (Int)
- `status` (Enum: `AVAILABLE`, `ON_TRIP`, `OFF_DUTY`, `SUSPENDED`)

### `Trip`
- `id` (String, PK)
- `source` (String)
- `destination` (String)
- `vehicleId` (String, FK -> Vehicle)
- `driverId` (String, FK -> Driver)
- `cargoWeight` (Int)
- `plannedDistance` (Int)
- `status` (Enum: `DRAFT`, `DISPATCHED`, `COMPLETED`, `CANCELLED`)
- `createdAt` (DateTime)

### `MaintenanceLog`
- `id` (String, PK)
- `vehicleId` (String, FK -> Vehicle)
- `serviceType` (String)
- `cost` (Float)
- `date` (DateTime)
- `status` (Enum: `ACTIVE`, `COMPLETED`)

### `Expense` (Includes Fuel & Tolls)
- `id` (String, PK)
- `type` (Enum: `FUEL`, `TOLL`, `MAINTENANCE`, `OTHER`)
- `vehicleId` (String, FK -> Vehicle)
- `tripId` (String, FK -> Trip, Nullable)
- `amount` (Float)
- `date` (DateTime)
- `liters` (Float, Nullable - Only for FUEL)
- `description` (String)

### `Settings`
- `id` (String, PK)
- `depotName` (String)
- `currency` (String)
- `distanceUnit` (String)

---

## 🚦 4. Business Rules & Logic (Strictly Enforced)
*AI Agents: Implement these validations in Zod schemas and Server Actions.*

1. **Unique Constraints:** `RegistrationNo` and `LicenseNumber` must be unique.
2. **Vehicle Availability:** Only `AVAILABLE` vehicles can be assigned to a Trip. `IN_SHOP` or `RETIRED` vehicles must be filtered out of dispatch dropdowns.
3. **Driver Availability:** Only `AVAILABLE` drivers can be assigned. Drivers with `expiryDate` < Today or `status` == `SUSPENDED` must be disabled in dropdowns.
4. **Capacity Check:** Trip `cargoWeight` MUST be <= Vehicle `capacityKg`. (Reject if exceeded).
5. **Trip Dispatch Transition:** When a Trip status changes to `DISPATCHED`, automatically update the related Vehicle and Driver statuses to `ON_TRIP` within the same database transaction.
6. **Trip Completion Transition:** When a Trip status changes to `COMPLETED` or `CANCELLED`, automatically restore Vehicle and Driver statuses to `AVAILABLE`.
7. **Maintenance Trigger:** When a `MaintenanceLog` is created with status `ACTIVE`, update the Vehicle status to `IN_SHOP`. When changed to `COMPLETED`, restore Vehicle to `AVAILABLE` (unless retired).

---

## 🛡️ 5. Role-Based Access Control (RBAC)
*AI Agents: Secure layout links and Server Actions based on these rules.*

| Module / Route | Fleet Manager | Dispatcher | Safety Officer | Financial Analyst |
|----------------|---------------|------------|----------------|-------------------|
| **`/fleet`** | Full Access | Read Only | No Access | Read Only |
| **`/drivers`** | Full Access | No Access | Full Access | No Access |
| **`/trips`** | No Access | Full Access| Read Only | No Access |
| **`/expenses`**| No Access | No Access | No Access | Full Access |
| **`/analytics`**| Read Only | No Access | No Access | Full Access |

---

## 📂 6. Folder & Architecture Structure
*AI Agents: Place files exactly as defined below to avoid duplication. Do not invent new structures.*

```text
src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                // Contains sidebar and auth check
│   │   ├── dashboard/page.tsx        // Overview KPIs
│   │   ├── fleet/page.tsx            // Vehicle Registry Table
│   │   ├── drivers/page.tsx          // Driver Management
│   │   ├── trips/page.tsx            // Trip Dispatcher
│   │   ├── maintenance/page.tsx      // Maintenance Logs
│   │   ├── expenses/page.tsx         // Fuel & Expenses
│   │   ├── analytics/page.tsx        // Reports
│   │   └── settings/page.tsx         // General config
│   └── api/                          // (Optional) for webhooks/external access
├── components/
│   ├── ui/                           // shadcn/ui components
│   ├── layout/                       // Sidebar, Topbar, PageHeader
│   ├── forms/                        // Reusable form components
│   └── charts/                       // Recharts wrappers
├── lib/
│   ├── prisma.ts                     // Prisma client singleton
│   ├── auth.ts                       // Better Auth config
│   ├── utils.ts                      // Tailwind merge, etc.
│   └── validations.ts                // Zod schemas
└── server/
    └── actions/                      // Server actions (Database logic)
        ├── vehicle.actions.ts
        ├── driver.actions.ts
        ├── trip.actions.ts
        ├── expense.actions.ts
        └── auth.actions.ts
```

---

## 📋 7. Master Implementation Task List
*AI Agents: Check these off (`- [x]`) and commit them as you build them. DO NOT start a task if another agent is actively working on it.*

### Phase 1: Foundation & Setup
- [ ] Initialize Next.js 15 project with Tailwind CSS.
- [ ] Install shadcn/ui and configure core components (Button, Input, Table, Card, Dialog).
- [ ] Setup PostgreSQL database & Prisma schema based on Section 3.
- [ ] Implement Better Auth with RBAC (Roles setup).
- [ ] Build global `(dashboard)/layout.tsx` (Sidebar with role-based visibility).

### Phase 2: Core Data Registries
- [ ] Build `lib/validations.ts` for all Zod schemas.
- [ ] Build `server/actions/vehicle.actions.ts` (CRUD).
- [ ] Build `/fleet` page: UI Table (TanStack) & "Add Vehicle" Modal.
- [ ] Build `server/actions/driver.actions.ts` (CRUD).
- [ ] Build `/drivers` page: UI Table & "Add Driver" Modal.

### Phase 3: Dispatch Workflow (State Machine)
- [ ] Build `server/actions/trip.actions.ts` (Ensure validations: Capacity, Availability).
- [ ] Implement Transactional State changes (Trip Dispatch -> Vehicle/Driver `ON_TRIP`).
- [ ] Build `/trips` page: Live Trip Board & "Create Trip" Modal.

### Phase 4: Operations & Financials
- [ ] Build `server/actions/maintenance.actions.ts`.
- [ ] Build `/maintenance` page (Logs & "Add Service" Modal).
- [ ] Build `server/actions/expense.actions.ts` (Fuel, Tolls, Misc).
- [ ] Build `/expenses` page (Fuel Logs & Expense tables).

### Phase 5: Analytics & Dashboards
- [ ] Build `server/actions/analytics.actions.ts` (Data aggregation functions).
- [ ] Build `/dashboard` page (High-level KPIs, Active/Pending metrics).
- [ ] Build `/analytics` page (Recharts graphs: Cost, Utilization, Efficiency).

### Phase 6: Quality of Life (QoL)
- [ ] Add Global Dark/Light mode toggle.
- [ ] Add Toast Notifications (`sonner` or shadcn toast) for all Server Actions.
- [ ] Add CSV Export functionality to all TanStack tables.
- [ ] Add visual Warning Tooltips for Drivers with expiring licenses (< 30 days).
- [ ] Add Predictive Color Badges (Green=Available, Red=In_Shop/Suspended, Blue=On_Trip).

---

## 🎨 8. UI/UX Guidelines
- **Colors:** Use a modern Logistics SaaS palette (Slate background, Blue primary, Green success, Red danger, Yellow warning).
- **Cards:** Minimal, rounded corners, subtle shadow.
- **Empty States:** Always provide a beautiful empty state if a table has no data (e.g., "No trips dispatched yet").
- **Loading States:** Use React Suspense and skeletons for data fetching.
