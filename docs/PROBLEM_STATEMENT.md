# TransitOps — Smart Transport Operations Platform

**Hackathon duration:** 8 hours
**Objective:** Build an end-to-end transport operations platform that digitizes
vehicle, driver, dispatch, maintenance, and expense management while enforcing
business rules and providing operational insights.

## 1. Business Context

Many logistics companies still rely on spreadsheets and manual logbooks to
manage their transport operations. This often leads to scheduling conflicts,
underutilized vehicles, missed maintenance, expired driver licenses, inaccurate
expense tracking, and poor operational visibility.

The task is to build **TransitOps**, a centralized platform that allows
organizations to manage the complete lifecycle of their transport operations —
from vehicle registration and driver management to dispatching, maintenance,
fuel logging, and analytics.

## 2. Target Users

| Role | Responsibility |
| --- | --- |
| **Fleet Manager** | Oversees fleet assets, maintenance, vehicle lifecycle, and operational efficiency. |
| **Dispatcher** | Creates trips, assigns vehicles and drivers, and monitors active deliveries. |
| **Safety Officer** | Ensures driver compliance, tracks license validity, and monitors safety scores. |
| **Financial Analyst** | Reviews operational expenses, fuel consumption, maintenance costs, and profitability. |

## 3. Functional Requirements

### 3.1 Authentication
- Secure login using email and password.
- Role-Based Access Control (RBAC).
- Only authenticated users can access the application.

### 3.2 Dashboard
- KPIs: Active Vehicles, Available Vehicles, Vehicles in Maintenance,
  Active Trips, Pending Trips, Drivers On Duty, Fleet Utilization (%).
- Filters by vehicle type, status, and region.

### 3.3 Vehicle Registry
- Master list of vehicles: Registration Number (unique), Vehicle Name/Model,
  Type, Maximum Load Capacity, Odometer, Acquisition Cost, Status.
- Status values: Available, On Trip, In Shop, Retired.

### 3.4 Driver Management
- Driver profiles: Name, License Number, License Category, License Expiry
  Date, Contact Number, Safety Score, Status.
- Status values: Available, On Trip, Off Duty, Suspended.

### 3.5 Trip Management
- Create trips: source, destination, available vehicle, available driver,
  cargo weight, planned distance.
- Trip lifecycle: **Draft → Dispatched → Completed → Cancelled**.

### 3.6 Maintenance
- Maintenance records per vehicle.
- Adding a vehicle to a maintenance log automatically switches its status to
  **In Shop**, removing it from the Dispatcher's selection pool.

### 3.7 Fuel & Expense Management
- Fuel logs (liters, cost, date) and other expenses (tolls, maintenance).
- Automatically compute total operational cost (**Fuel + Maintenance**) per vehicle.

### 3.8 Reports & Analytics
- Fuel Efficiency (Distance / Fuel), Fleet Utilization, Operational Cost,
  and Vehicle ROI = `(Revenue − (Maintenance + Fuel)) / Acquisition Cost`.
- CSV export (PDF optional).

## 4. Mandatory Business Rules

1. Vehicle registration number must be unique.
2. Retired or In Shop vehicles must never appear in the dispatch selection.
3. Drivers with expired licenses or Suspended status cannot be assigned to trips.
4. A driver or vehicle already marked On Trip cannot be assigned to another trip.
5. Cargo Weight must not exceed the vehicle's maximum load capacity.
6. Dispatching a trip automatically changes both the vehicle and driver status to On Trip.
7. Completing a trip automatically changes both statuses back to Available.
8. Cancelling a dispatched trip restores the vehicle and driver to Available.
9. Creating an active maintenance record automatically changes vehicle status to In Shop.
10. Closing maintenance restores the vehicle to Available (unless retired).

## 5. Example Workflow

1. Register vehicle **Van-05** with a maximum capacity of 500 kg → Available.
2. Register driver **Alex** with a valid driving license.
3. Create a trip with cargo weight = 450 kg.
4. System validates 450 ≤ 500 and allows dispatch.
5. Vehicle and driver automatically become **On Trip**.
6. Complete the trip by entering the final odometer and fuel consumed.
7. System marks both vehicle and driver **Available**.
8. Create a maintenance record (e.g., Oil Change) → vehicle becomes **In Shop**,
   hidden from dispatch.
9. Reports update operational cost and fuel efficiency from the latest trip and fuel log.

## 6. Expected Database Entities

Users, Roles, Vehicles, Drivers, Trips, Maintenance Logs, Fuel Logs, Expenses.

## 7. Mandatory Deliverables

- Responsive web interface
- Authentication with RBAC
- CRUD for Vehicles and Drivers
- Trip management with validations
- Automatic status transitions
- Maintenance workflow
- Fuel & expense tracking
- Dashboard with KPIs

## 8. Bonus Features

- Charts and visual analytics
- PDF export
- Email reminders for expiring licenses
- Vehicle document management
- Search, filters, and sorting
- Dark mode

**Mockup:** https://link.excalidraw.com/l/65VNwvy7c4X/1FHGDNgD2td
(local copy: `docs/wireframe.excalidraw`)
