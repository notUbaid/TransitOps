import type { Role } from "./types";

// ============================================================
// Role-Based Access Control
// Source of truth: ProjectDetails.md §5 + PROBLEM_STATEMENT.md §2
// ============================================================

export type ModuleKey =
  | "dashboard"
  | "fleet"
  | "drivers"
  | "trips"
  | "maintenance"
  | "expenses"
  | "analytics"
  | "settings";

export type Access = "full" | "read" | "none";

export interface ModuleMeta {
  key: ModuleKey;
  label: string;
  icon: string; // Material Symbols name
  path: string;
}

export const MODULES: ModuleMeta[] = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard", path: "/dashboard" },
  { key: "fleet", label: "Fleet", icon: "local_shipping", path: "/fleet" },
  { key: "drivers", label: "Drivers", icon: "badge", path: "/drivers" },
  { key: "trips", label: "Trips", icon: "route", path: "/trips" },
  { key: "maintenance", label: "Maintenance", icon: "build", path: "/maintenance" },
  { key: "expenses", label: "Fuel & Expenses", icon: "local_gas_station", path: "/expenses" },
  { key: "analytics", label: "Analytics", icon: "analytics", path: "/analytics" },
  { key: "settings", label: "Settings", icon: "settings", path: "/settings" },
];

// role -> module -> access level
const MATRIX: Record<Role, Record<ModuleKey, Access>> = {
  fleet_manager: {
    dashboard: "full",
    fleet: "full",
    drivers: "full",
    trips: "read",
    maintenance: "full",
    expenses: "read",
    analytics: "read",
    settings: "full",
  },
  dispatcher: {
    dashboard: "full",
    fleet: "read",
    drivers: "none",
    trips: "full",
    maintenance: "read",
    expenses: "none",
    analytics: "none",
    settings: "read",
  },
  safety_officer: {
    dashboard: "full",
    fleet: "read",
    drivers: "full",
    trips: "read",
    maintenance: "full",
    expenses: "none",
    analytics: "none",
    settings: "read",
  },
  financial_analyst: {
    dashboard: "full",
    fleet: "read",
    drivers: "none",
    trips: "none",
    maintenance: "read",
    expenses: "full",
    analytics: "full",
    settings: "read",
  },
};

export function access(role: Role, module: ModuleKey): Access {
  return MATRIX[role]?.[module] ?? "none";
}

export function canView(role: Role, module: ModuleKey): boolean {
  return access(role, module) !== "none";
}

export function canEdit(role: Role, module: ModuleKey): boolean {
  return access(role, module) === "full";
}

/** Modules visible to a role, in sidebar order. */
export function visibleModules(role: Role): ModuleMeta[] {
  return MODULES.filter((m) => canView(role, m.key));
}

/** First landing route a role is allowed to see. */
export function landingPath(role: Role): string {
  const first = visibleModules(role)[0];
  return first?.path ?? "/dashboard";
}

// Columns rendered by the Settings RBAC matrix widget
export const RBAC_MATRIX_COLUMNS: { key: ModuleKey; label: string }[] = [
  { key: "fleet", label: "Fleet" },
  { key: "drivers", label: "Drivers" },
  { key: "trips", label: "Trips" },
  { key: "expenses", label: "Fuel/Exp" },
  { key: "analytics", label: "Analytics" },
];
