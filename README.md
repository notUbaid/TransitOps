<div align="center">

# 🚚 TransitOps
### Smart Transport Operations Platform

<p align="center">
A modern fleet management platform that digitizes transport operations, vehicle lifecycle, driver management, maintenance, dispatching, and operational analytics.
</p>

![License](https://img.shields.io/badge/License-MIT-blue)
![Hackathon](https://img.shields.io/badge/Hackathon-Odoo%20Hackathon-orange)
![Status](https://img.shields.io/badge/Status-Completed-success)
![Made With](https://img.shields.io/badge/Built%20With-Full%20Stack-green)

</div>

---

# 📖 Overview

TransitOps is an intelligent transport management platform designed to replace manual spreadsheets and logbooks with a centralized digital solution.

The system enables organizations to efficiently manage their fleet by tracking vehicles, drivers, trips, maintenance schedules, fuel consumption, operational expenses, and fleet analytics from a single dashboard.

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

TransitOps solves these problems through automation, validation rules, and real-time analytics.

---

# ✨ Features

## 🔐 Authentication

- Secure Login
- Email Authentication
- Role-Based Access Control (RBAC)

---

## 🚚 Fleet Management

- Vehicle Registration
- Vehicle Status Tracking
- Vehicle Lifecycle Management
- Vehicle Capacity Management
- Odometer Tracking
- Acquisition Cost Tracking

---

## 👨‍✈️ Driver Management

- Driver Registration
- License Validation
- Safety Score
- Driver Availability
- Contact Information
- Driver Status Tracking

---

## 📦 Trip Management

- Trip Creation
- Vehicle Assignment
- Driver Assignment
- Cargo Weight Validation
- Route Information
- Trip Lifecycle

```
Draft
   ↓
Dispatched
   ↓
Completed

or

Cancelled
```

---

## 🔧 Maintenance

- Maintenance Logs
- Automatic Vehicle Status Updates
- Workshop Management
- Maintenance History

---

## ⛽ Fuel & Expense Tracking

- Fuel Logs
- Fuel Cost
- Maintenance Expenses
- Toll Expenses
- Operational Cost Calculation

---

## 📊 Dashboard

Real-time KPIs including:

- Active Vehicles
- Available Vehicles
- Vehicles in Maintenance
- Drivers on Duty
- Active Trips
- Pending Trips
- Fleet Utilization
- Operational Cost

---

## 📈 Analytics

- Fuel Efficiency
- Fleet Utilization
- Vehicle ROI
- Expense Reports
- Operational Insights
- CSV Export

---

# 🏗️ System Modules

```
Authentication
      │
      ▼
Dashboard
      │
 ┌────┼────────────┐
 │    │            │
 ▼    ▼            ▼
Vehicles Drivers  Trips
 │        │         │
 └────┬───┘         │
      ▼             ▼
 Maintenance    Fuel Logs
      │             │
      └──────┬──────┘
             ▼
        Reports & Analytics
```

---

# ⚙️ Business Rules

✔ Vehicle Registration Number must be unique.

✔ Vehicles under maintenance cannot be dispatched.

✔ Retired vehicles cannot be assigned.

✔ Suspended drivers cannot drive.

✔ Drivers with expired licenses cannot be assigned.

✔ Vehicle capacity cannot be exceeded.

✔ Vehicle already on trip cannot be assigned.

✔ Driver already on trip cannot be assigned.

✔ Dispatch automatically changes status to **On Trip**.

✔ Completing a trip restores availability.

✔ Closing maintenance restores vehicle status.

---

# 📂 Database Design

```
Users
│
├── Roles

Vehicles
│
├── Trips
├── Fuel Logs
├── Maintenance Logs
└── Expenses

Drivers
│
└── Trips
```

---

# 📊 Dashboard Metrics

- Fleet Utilization
- Active Trips
- Pending Trips
- Available Vehicles
- Vehicles in Shop
- Driver Availability
- Operational Cost
- Fuel Consumption
- Vehicle ROI
- Fuel Efficiency

---

# 🛠️ Tech Stack

## Frontend

- React.js
- Tailwind CSS
- TypeScript

## Backend

- Node.js
- Express.js

## Database

- PostgreSQL

## Authentication

- JWT Authentication
- Role Based Access Control

## Charts

- Chart.js / Recharts

---

# 📁 Project Structure

```
TransitOps/

│── client/
│── server/
│── database/
│── docs/
│── public/

├── authentication
├── dashboard
├── vehicles
├── drivers
├── trips
├── maintenance
├── fuel
├── analytics

README.md
```

---

# 🔄 Workflow

```
Vehicle Registration
        │
        ▼
Driver Registration
        │
        ▼
Trip Creation
        │
        ▼
Validation
        │
        ▼
Dispatch
        │
        ▼
Vehicle & Driver → On Trip
        │
        ▼
Trip Completion
        │
        ▼
Available Again
        │
        ▼
Maintenance
        │
        ▼
Reports Updated
```

---

# 🎯 Future Enhancements

- PDF Reports
- Email Notifications
- Driver License Alerts
- Vehicle Document Management
- Dark Mode
- Advanced Analytics
- Mobile Application
- GPS Tracking
- AI-based Route Optimization
- Predictive Maintenance

---

# 👨‍💻 Team

| Name | Role |
|------|------|
| Your Name | Full Stack Developer |
| Member 2 | Backend Developer |
| Member 3 | Frontend Developer |
| Member 4 | UI/UX Designer |

---

# 🏆 Hackathon

Built for the **Odoo Hackathon** with the objective of creating a centralized transport operations platform capable of managing vehicles, drivers, trips, maintenance, expenses, and operational analytics through a single integrated system.

---

# 📜 License

This project is developed for educational and hackathon purposes.

---

<div align="center">

### ⭐ If you like this project, don't forget to star the repository!

Made with ❤️ during Hackathon

</div>