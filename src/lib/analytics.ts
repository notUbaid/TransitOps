import type { Database, Vehicle } from "./types";
import { daysUntil, isExpired } from "./format";

export const SERVICE_INTERVAL_KM = 15000;

// ---------------- Fleet & trip KPIs ----------------
export function fleetKpis(db: Database) {
  const total = db.vehicles.length;
  const onTrip = db.vehicles.filter((v) => v.status === "ON_TRIP").length;
  const available = db.vehicles.filter((v) => v.status === "AVAILABLE").length;
  const inShop = db.vehicles.filter((v) => v.status === "IN_SHOP").length;
  const retired = db.vehicles.filter((v) => v.status === "RETIRED").length;
  const operational = total - retired;
  const utilization = operational > 0 ? Math.round((onTrip / operational) * 100) : 0;
  return { total, onTrip, available, inShop, retired, operational, utilization };
}

export function tripKpis(db: Database) {
  const active = db.trips.filter((t) => t.status === "DISPATCHED").length;
  const pending = db.trips.filter((t) => t.status === "DRAFT").length;
  const completed = db.trips.filter((t) => t.status === "COMPLETED").length;
  const cancelled = db.trips.filter((t) => t.status === "CANCELLED").length;
  return { active, pending, completed, cancelled };
}

export function driverKpis(db: Database) {
  const onDuty = db.drivers.filter((d) => d.status === "ON_TRIP").length;
  const available = db.drivers.filter((d) => d.status === "AVAILABLE").length;
  const suspended = db.drivers.filter((d) => d.status === "SUSPENDED").length;
  return { onDuty, available, suspended, total: db.drivers.length };
}

// ---------------- Cost & ROI ----------------
/** Fuel + tolls + other + logged maintenance for a vehicle (no double counting). */
export function vehicleOperatingCost(db: Database, vehicleId: string): number {
  const expenseCost = db.expenses
    .filter((e) => e.vehicleId === vehicleId && e.type !== "MAINTENANCE")
    .reduce((s, e) => s + e.amount, 0);
  const maintenanceCost = db.maintenance
    .filter((m) => m.vehicleId === vehicleId)
    .reduce((s, m) => s + m.cost, 0);
  return expenseCost + maintenanceCost;
}

export function vehicleFuelCost(db: Database, vehicleId: string): number {
  return db.expenses
    .filter((e) => e.vehicleId === vehicleId && e.type === "FUEL")
    .reduce((s, e) => s + e.amount, 0);
}

export function vehicleRevenue(db: Database, vehicleId: string): number {
  return db.trips
    .filter((t) => t.vehicleId === vehicleId && t.status === "COMPLETED")
    .reduce((s, t) => s + t.revenue, 0);
}

/** ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost per spec §3.8. */
export function vehicleRoi(db: Database, vehicle: Vehicle): number {
  if (!vehicle.acquisitionCost) return 0;
  const maintenanceCost = db.maintenance
    .filter((m) => m.vehicleId === vehicle.id)
    .reduce((s, m) => s + m.cost, 0);
  const fuelCost = vehicleFuelCost(db, vehicle.id);
  const revenue = vehicleRevenue(db, vehicle.id);
  return ((revenue - maintenanceCost - fuelCost) / vehicle.acquisitionCost) * 100;
}

export function fleetRoi(db: Database): number {
  const vehicles = db.vehicles.filter((v) => v.acquisitionCost > 0);
  if (vehicles.length === 0) return 0;
  return vehicles.reduce((s, v) => s + vehicleRoi(db, v), 0) / vehicles.length;
}

export function totalOperationalCost(db: Database): number {
  const expenseTotal = db.expenses
    .filter((e) => e.type !== "MAINTENANCE")
    .reduce((s, e) => s + e.amount, 0);
  const maintenanceTotal = db.maintenance.reduce((s, m) => s + m.cost, 0);
  return expenseTotal + maintenanceTotal;
}

export function totalRevenue(db: Database): number {
  return db.trips.filter((t) => t.status === "COMPLETED").reduce((s, t) => s + t.revenue, 0);
}

/** Fuel efficiency (km / L) across completed trips with recorded fuel. */
export function fuelEfficiency(db: Database): number {
  let distance = 0;
  let fuel = 0;
  for (const t of db.trips) {
    if (t.status !== "COMPLETED") continue;
    const d =
      t.startOdometer != null && t.endOdometer != null
        ? t.endOdometer - t.startOdometer
        : t.plannedKm;
    if (t.fuelLiters && t.fuelLiters > 0) {
      distance += d;
      fuel += t.fuelLiters;
    }
  }
  return fuel > 0 ? distance / fuel : 0;
}

export interface CostliestVehicle {
  vehicle: Vehicle;
  cost: number;
}
export function costliestVehicles(db: Database, n = 4): CostliestVehicle[] {
  return db.vehicles
    .map((vehicle) => ({ vehicle, cost: vehicleOperatingCost(db, vehicle.id) }))
    .filter((x) => x.cost > 0)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, n);
}

// ---------------- Time series ----------------
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface MonthlyPoint {
  month: string;
  revenue: number;
  cost: number;
}

/** Last `count` months of revenue (completed trips) and cost (expenses + maintenance). */
export function monthlySeries(db: Database, count = 7): MonthlyPoint[] {
  const now = new Date();
  const buckets: MonthlyPoint[] = [];
  const index = new Map<string, MonthlyPoint>();

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const point: MonthlyPoint = { month: MONTHS[d.getMonth()], revenue: 0, cost: 0 };
    buckets.push(point);
    index.set(key, point);
  }

  const keyOf = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${d.getMonth()}`;
  };

  for (const t of db.trips) {
    if (t.status === "COMPLETED" && t.completedAt) {
      const p = index.get(keyOf(t.completedAt));
      if (p) p.revenue += t.revenue;
    }
  }
  for (const e of db.expenses) {
    const p = index.get(keyOf(e.date));
    if (p) p.cost += e.amount;
  }
  for (const m of db.maintenance) {
    const p = index.get(keyOf(m.serviceDate));
    if (p) p.cost += m.cost;
  }
  return buckets;
}

export interface TypeSlice {
  name: string;
  value: number;
}
export function expenseByType(db: Database): TypeSlice[] {
  const map: Record<string, number> = { FUEL: 0, TOLL: 0, MAINTENANCE: 0, OTHER: 0 };
  for (const e of db.expenses) map[e.type] = (map[e.type] ?? 0) + e.amount;
  // fold in maintenance logs under MAINTENANCE
  for (const m of db.maintenance) map.MAINTENANCE += m.cost;
  const label: Record<string, string> = {
    FUEL: "Fuel",
    TOLL: "Tolls",
    MAINTENANCE: "Maintenance",
    OTHER: "Other",
  };
  return Object.entries(map)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: label[k], value: v }));
}

// ---------------- Alerts ----------------
export function isServiceDue(v: Vehicle, alertKm: number): boolean {
  if (v.status === "RETIRED") return false;
  const intoInterval = v.odometer % SERVICE_INTERVAL_KM;
  return intoInterval >= SERVICE_INTERVAL_KM - alertKm;
}

export interface Alert {
  id: string;
  kind: "license" | "service" | "maintenance";
  icon: string;
  title: string;
  detail: string;
  severity: "warning" | "error";
}

export function collectAlerts(db: Database): Alert[] {
  const alerts: Alert[] = [];

  for (const d of db.drivers) {
    if (d.status === "SUSPENDED") continue;
    const days = daysUntil(d.licenseExpiry);
    if (isExpired(d.licenseExpiry)) {
      alerts.push({
        id: `lic_${d.id}`,
        kind: "license",
        icon: "badge",
        title: `${d.name}'s license expired`,
        detail: `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`,
        severity: "error",
      });
    } else if (days <= 30) {
      alerts.push({
        id: `lic_${d.id}`,
        kind: "license",
        icon: "badge",
        title: `${d.name}'s license expiring`,
        detail: `Expires in ${days} day${days === 1 ? "" : "s"}`,
        severity: "warning",
      });
    }
  }

  for (const v of db.vehicles) {
    if (isServiceDue(v, db.settings.maintenanceAlertKm) && v.status === "AVAILABLE") {
      alerts.push({
        id: `svc_${v.id}`,
        kind: "service",
        icon: "build",
        title: `${v.registrationNo} due for service`,
        detail: `Odometer at ${v.odometer.toLocaleString("en-IN")} km`,
        severity: "warning",
      });
    }
  }

  const activeCount = db.maintenance.filter((m) => m.status === "ACTIVE").length;
  if (activeCount > 0) {
    alerts.push({
      id: "mnt_active",
      kind: "maintenance",
      icon: "handyman",
      title: `${activeCount} vehicle${activeCount === 1 ? "" : "s"} in the shop`,
      detail: "Active maintenance in progress",
      severity: "warning",
    });
  }

  return alerts;
}
