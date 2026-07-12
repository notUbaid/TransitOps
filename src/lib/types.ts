// ============================================================
// Domain types for TransitOps
// ============================================================

export type Role =
  | "fleet_manager"
  | "dispatcher"
  | "safety_officer"
  | "financial_analyst";

export const ROLES: Role[] = [
  "fleet_manager",
  "dispatcher",
  "safety_officer",
  "financial_analyst",
];

export const ROLE_LABELS: Record<Role, string> = {
  fleet_manager: "Fleet Manager",
  dispatcher: "Dispatcher",
  safety_officer: "Safety Officer",
  financial_analyst: "Financial Analyst",
};

export const ROLE_TAGLINES: Record<Role, string> = {
  fleet_manager: "Full System Access",
  dispatcher: "Operations Focus",
  safety_officer: "Compliance & Maintenance",
  financial_analyst: "Cost Tracking",
};

// ---- Enumerations ----
export type VehicleStatus = "AVAILABLE" | "ON_TRIP" | "IN_SHOP" | "RETIRED";
export type DriverStatus = "AVAILABLE" | "ON_TRIP" | "OFF_DUTY" | "SUSPENDED";
export type TripStatus = "DRAFT" | "DISPATCHED" | "COMPLETED" | "CANCELLED";
export type MaintenanceStatus = "ACTIVE" | "COMPLETED";
export type ExpenseType = "FUEL" | "TOLL" | "MAINTENANCE" | "OTHER";

export const VEHICLE_TYPES = [
  "Truck",
  "Container",
  "Van",
  "Pickup",
  "Mini Truck",
] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const DRIVER_CATEGORIES = ["Light", "Medium", "Heavy"] as const;
export type DriverCategory = (typeof DRIVER_CATEGORIES)[number];

// ---- Entities ----
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  password: string; // demo-only, client-side mock auth
  avatar?: string;
}

export interface Vehicle {
  id: string;
  registrationNo: string;
  name: string;
  type: VehicleType;
  capacityKg: number;
  odometer: number;
  acquisitionCost: number;
  region: string;
  status: VehicleStatus;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  category: DriverCategory;
  licenseExpiry: string; // ISO date
  phone: string;
  safetyScore: number;
  tripCompletionRate: number;
  status: DriverStatus;
  createdAt: string;
}

export interface Trip {
  id: string;
  code: string;
  source: string;
  destination: string;
  vehicleId: string | null;
  driverId: string | null;
  cargoKg: number;
  plannedKm: number;
  revenue: number;
  status: TripStatus;
  startOdometer: number | null;
  endOdometer: number | null;
  fuelLiters: number | null;
  note: string | null;
  createdAt: string;
  dispatchedAt: string | null;
  completedAt: string | null;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  serviceType: string;
  cost: number;
  serviceDate: string;
  status: MaintenanceStatus;
  notes: string | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  type: ExpenseType;
  vehicleId: string | null;
  tripId: string | null;
  amount: number;
  date: string;
  liters: number | null;
  description: string;
  createdAt: string;
}

export interface Settings {
  companyName: string;
  depotName: string;
  currency: "INR" | "USD" | "EUR";
  distanceUnit: "km" | "mi";
  fuelPricePerLiter: number;
  maintenanceAlertKm: number;
  gstRate: number;
  contactEmail: string;
  contactPhone: string;
}

export interface Database {
  users: User[];
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceLog[];
  expenses: Expense[];
  settings: Settings;
}

// Result type returned by all mutating store actions
export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };
