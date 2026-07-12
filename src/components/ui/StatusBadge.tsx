import { Badge } from "./primitives";

interface StatusStyle {
  label: string;
  className: string;
  dot: string;
}

// One map covers every status/type literal in the domain.
const STATUS_STYLES: Record<string, StatusStyle> = {
  // Vehicle + Driver
  AVAILABLE: { label: "Available", className: "bg-emerald-500/15 text-emerald-300", dot: "bg-emerald-400" },
  ON_TRIP: { label: "On Trip", className: "bg-primary/20 text-primary", dot: "bg-primary" },
  IN_SHOP: { label: "In Shop", className: "bg-tertiary/20 text-tertiary", dot: "bg-tertiary" },
  RETIRED: { label: "Retired", className: "bg-surface-variant text-on-surface-variant", dot: "bg-outline" },
  OFF_DUTY: { label: "Off Duty", className: "bg-secondary/20 text-secondary", dot: "bg-secondary" },
  SUSPENDED: { label: "Suspended", className: "bg-error/15 text-error", dot: "bg-error" },
  // Trip
  DRAFT: { label: "Draft", className: "bg-surface-variant text-on-surface", dot: "bg-outline" },
  DISPATCHED: { label: "Dispatched", className: "bg-primary text-on-primary", dot: "bg-on-primary" },
  COMPLETED: { label: "Completed", className: "bg-emerald-500/15 text-emerald-300", dot: "bg-emerald-400" },
  CANCELLED: { label: "Cancelled", className: "bg-error/15 text-error", dot: "bg-error" },
  // Maintenance
  ACTIVE: { label: "Active", className: "bg-tertiary/20 text-tertiary", dot: "bg-tertiary" },
  // Expense type
  FUEL: { label: "Fuel", className: "bg-primary/15 text-primary", dot: "bg-primary" },
  TOLL: { label: "Toll", className: "bg-secondary/20 text-secondary", dot: "bg-secondary" },
  MAINTENANCE: { label: "Maintenance", className: "bg-tertiary/20 text-tertiary", dot: "bg-tertiary" },
  OTHER: { label: "Other", className: "bg-surface-variant text-on-surface-variant", dot: "bg-outline" },
};

export function statusStyle(status: string): StatusStyle {
  return (
    STATUS_STYLES[status] ?? {
      label: status,
      className: "bg-surface-variant text-on-surface-variant",
      dot: "bg-outline",
    }
  );
}

export function StatusBadge({ status, dot = true }: { status: string; dot?: boolean }) {
  const style = statusStyle(status);
  return (
    <Badge className={style.className}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />}
      {style.label}
    </Badge>
  );
}
