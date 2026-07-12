import { Badge } from "./primitives";

interface StatusStyle {
  label: string;
  className: string;
  dot: string;
}

// One map covers every status/type literal in the domain.
const STATUS_STYLES: Record<string, StatusStyle> = {
  // Vehicle + Driver
  AVAILABLE: { label: "Available", className: "bg-green-50 text-green-700", dot: "bg-green-500" },
  ON_TRIP: { label: "On Trip", className: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  IN_SHOP: { label: "In Shop", className: "bg-purple-50 text-purple-700", dot: "bg-purple-500" },
  RETIRED: { label: "Retired", className: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
  OFF_DUTY: { label: "Off Duty", className: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  SUSPENDED: { label: "Suspended", className: "bg-red-50 text-red-700", dot: "bg-red-500" },
  // Trip
  DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
  DISPATCHED: { label: "Dispatched", className: "bg-primary text-on-primary", dot: "bg-white" },
  COMPLETED: { label: "Completed", className: "bg-green-50 text-green-700", dot: "bg-green-500" },
  CANCELLED: { label: "Cancelled", className: "bg-red-50 text-red-700", dot: "bg-red-500" },
  // Maintenance
  ACTIVE: { label: "Active", className: "bg-purple-50 text-purple-700", dot: "bg-purple-500" },
  // Expense type
  FUEL: { label: "Fuel", className: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  TOLL: { label: "Toll", className: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  MAINTENANCE: { label: "Maintenance", className: "bg-purple-50 text-purple-700", dot: "bg-purple-500" },
  OTHER: { label: "Other", className: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
};

export function statusStyle(status: string): StatusStyle {
  return (
    STATUS_STYLES[status] ?? {
      label: status,
      className: "bg-gray-100 text-gray-600",
      dot: "bg-gray-400",
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
