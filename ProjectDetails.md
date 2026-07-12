TransitOps

Project Overview



TransitOps is a modern transport operations platform built for logistics companies.



Its purpose is to replace spreadsheets and manual processes with a centralized web application that manages the complete lifecycle of transport operations.



The system handles:



Fleet Management

Driver Management

Dispatching

Trip Tracking

Maintenance

Fuel Management

Expense Tracking

Analytics

Operational KPIs



This project is being developed as a hackathon project based on the official problem statement.



Project Goals



The platform should allow organizations to



Register vehicles

Register drivers

Dispatch trips

Prevent invalid assignments

Track maintenance

Record expenses

Generate operational insights



The system should automatically enforce every business rule without requiring manual intervention.



Tech Stack

Frontend

Next.js 15

React

TypeScript

Tailwind CSS

shadcn/ui

React Hook Form

TanStack Table

Recharts

Backend

Next.js API Routes



OR



Express

Database

PostgreSQL

Prisma ORM

Authentication

Better Auth

RBAC

Deployment

Vercel

Supabase

User Roles

Fleet Manager



Responsibilities



Vehicle management

Maintenance

Fleet overview

Reports

Dispatcher



Responsibilities



Create trips

Assign vehicles

Assign drivers

Complete trips

Safety Officer



Responsibilities



Driver compliance

License expiry

Safety scores

Financial Analyst



Responsibilities



Expenses

Fuel costs

ROI

Reports

Complete Modules

Authentication

Features

Login

Logout

Session

Protected Routes

Role Based Access

Pages

/login

Dashboard

KPIs

Active Vehicles

Available Vehicles

Vehicles in Shop

Active Trips

Pending Trips

Drivers On Duty

Fleet Utilization

Charts

Fuel Consumption

Monthly Expenses

Fleet Status

Trips by Region

Vehicle Registry



CRUD



Vehicle contains



Registration No.

Vehicle Name/Model

Vehicle Type

Maximum Capacity

Odometer

Acquisition Cost

Status



Status



Available

On Trip

In Shop

Retired



Validation



Registration number must always be unique.



Driver Management



CRUD



Driver contains



Name

License Number

License Category

Expiry Date

Phone

Trip Compl. %

Safety Score

Status



Status



Available

On Trip

Off Duty

Suspended



Validation



Expired licenses cannot be dispatched.



Trip Management



Create Trip



Fields



Source

Destination

Vehicle

Driver

Cargo Weight

Distance

Status



Lifecycle



Draft



↓



Dispatched



↓



Completed



↓



Cancelled



During Dispatch



System automatically



checks vehicle availability

checks driver availability

checks cargo weight

updates statuses

Maintenance



Create maintenance



Fields



Vehicle

Service Type

Cost

Date

Status (Active/Completed)



When maintenance starts



Vehicle becomes



In Shop



When maintenance ends



Vehicle becomes



Available



unless retired.



Fuel Logs



Fields



Vehicle

Date

Liters

Fuel Cost

Expense Management



Other Expenses Fields:



Trip

Vehicle

Toll

Other

Maint. (Linked)

Total

Reports



Reports should calculate



Fuel Efficiency



Distance / Fuel



Operational Cost



Fuel

\+

Maintenance

\+

Other Expenses



Fleet Utilization



Active Vehicles

/

Total Vehicles



Vehicle ROI



Revenue



\-



Expenses



/



Acquisition Cost

Database Tables



Users



Roles



Vehicles



Drivers



Trips



MaintenanceLogs



FuelLogs



Expenses



TripHistory



Notifications



AuditLogs



Business Rules



These rules are mandatory.



Vehicle

Registration number unique

Retired vehicles cannot be assigned

In Shop vehicles cannot be assigned

Driver

Expired license cannot dispatch

Suspended cannot dispatch

Driver already on trip cannot dispatch

Trip



Cargo



Cargo Weight



<=



Vehicle Capacity



Vehicle



Must be Available



Driver



Must be Available



Dispatch



Automatically changes



Vehicle



Available



↓



On Trip



Driver



Available



↓



On Trip



Completion



Automatically restores



Available



Cancellation



Automatically restores



Available



Maintenance



Automatically changes



In Shop

Frontend Structure

app/



login/



dashboard/



vehicles/



drivers/



trips/



maintenance/



fuel/



expenses/



reports/



settings/



General Settings:



Depot Name

Currency

Distance Unit



Backend Structure

src/



controllers/



services/



repositories/



middlewares/



validators/



routes/



utils/



types/

API Endpoints

POST /login



GET /vehicles



POST /vehicles



PATCH /vehicles/:id



DELETE /vehicles/:id



GET /drivers



POST /drivers



GET /trips



POST /trips



PATCH /trips/:id/dispatch



PATCH /trips/:id/complete



PATCH /trips/:id/cancel



GET /maintenance



POST /maintenance



POST /fuel



POST /expenses



GET /reports

Folder Structure

app/



components/



features/



hooks/



lib/



actions/



types/



prisma/



docs/

UI Guidelines



Theme



Modern logistics SaaS



Colors



Blue



White



Slate



Success



Warning



Danger



Cards



Rounded



Shadow



Minimal



Animations



Subtle only



Remaining Tasks

Phase 1

Authentication

Database

Dashboard

Sidebar

Phase 2

Vehicle CRUD

Driver CRUD

Phase 3

Trip Workflow

Validations

Automatic status updates

Phase 4

Maintenance

Fuel

Expenses

Phase 5

Reports

Charts

Analytics

Phase 6

Polish UI

Dark Mode

Search

Filters

Phase 7



Bonus



PDF Export

Email reminders

Vehicle documents

AI Agent Instructions



Every AI agent contributing to this project must follow these rules:



Read PROJECT.md before making any changes.

Never violate business rules.

Never duplicate components or APIs.

Reuse existing utilities and UI components.

Keep all business logic in services, not UI.

Use strict TypeScript types and avoid any.

Follow the existing folder structure and naming conventions.

Update documentation whenever features are added or changed.

Preserve database integrity and status transitions.

Before marking a task complete, verify it against the official hackathon requirements and business rules.

