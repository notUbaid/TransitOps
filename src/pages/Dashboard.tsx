import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import {
  collectAlerts,
  driverKpis,
  fleetKpis,
  fuelEfficiency,
  totalRevenue,
  tripKpis,
} from "@/lib/analytics";
import { VEHICLE_TYPES, type VehicleStatus } from "@/lib/types";
import { formatCompactCurrency, formatNumber } from "@/lib/format";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, PageHeader, Select } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import type { Vehicle } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: VehicleStatus[] = ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"];

export function Dashboard() {
  const { db } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fleet = fleetKpis(db);
  const trips = tripKpis(db);
  const drivers = driverKpis(db);
  const alerts = useMemo(() => collectAlerts(db), [db]);
  const revenue = totalRevenue(db);
  const efficiency = fuelEfficiency(db);

  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [region, setRegion] = useState("all");

  const regions = useMemo(
    () => Array.from(new Set(db.vehicles.map((v) => v.region))).sort(),
    [db.vehicles],
  );

  const filtered = useMemo(
    () =>
      db.vehicles.filter(
        (v) =>
          (type === "all" || v.type === type) &&
          (status === "all" || v.status === status) &&
          (region === "all" || v.region === region),
      ),
    [db.vehicles, type, status, region],
  );

  const columns: Column<Vehicle>[] = [
    {
      header: "Vehicle",
      sortValue: (v) => v.registrationNo,
      cell: (v) => (
        <div>
          <p className="font-medium text-on-surface">{v.registrationNo}</p>
          <p className="font-label-sm text-label-sm text-on-surface-variant">{v.name}</p>
        </div>
      ),
    },
    { header: "Type", sortValue: (v) => v.type, cell: (v) => v.type, className: "hidden sm:table-cell" },
    { header: "Region", sortValue: (v) => v.region, cell: (v) => v.region, className: "hidden md:table-cell" },
    {
      header: "Odometer",
      sortValue: (v) => v.odometer,
      cell: (v) => <span className="font-mono">{formatNumber(v.odometer)} km</span>,
      className: "hidden lg:table-cell",
    },
    { header: "Status", sortValue: (v) => v.status, cell: (v) => <StatusBadge status={v.status} /> },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name.split(" ")[0]}`}
        subtitle="Live overview of your fleet, dispatch, and operational health."
        icon="dashboard"
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Fleet Utilization"
          value={fleet.utilization}
          unit="%"
          icon="pie_chart"
          accent="secondary"
          progress={fleet.utilization}
          trend={{ direction: "up", value: "4.2%", positive: true }}
        />
        <KpiCard label="Active Trips" value={trips.active} icon="route" accent="primary" footnote="Currently dispatched" trend={{ direction: "up", value: "12%", positive: true }} />
        <KpiCard label="Pending Trips" value={trips.pending} icon="pending_actions" accent="tertiary" footnote="Awaiting dispatch" trend={{ direction: "down", value: "5%", positive: true }} />
        <KpiCard
          label="Drivers On Duty"
          value={drivers.onDuty}
          icon="badge"
          accent="emerald"
          footnote={`${drivers.available} available`}
          trend={{ direction: "up", value: "8%", positive: true }}
        />
        <KpiCard label="Available Vehicles" value={fleet.available} icon="check_circle" accent="emerald" />
        <KpiCard label="Active Vehicles" value={fleet.onTrip} icon="local_shipping" accent="primary" footnote="Currently on trip" trend={{ direction: "up", value: "3", positive: true }} />
        <KpiCard label="In Maintenance" value={fleet.inShop} icon="build" accent="tertiary" trend={{ direction: "down", value: "2", positive: true }} />
        <KpiCard
          label="Revenue (Completed)"
          value={formatCompactCurrency(revenue, db.settings.currency)}
          icon="payments"
          accent="emerald"
          footnote={`${efficiency.toFixed(1)} km/L avg efficiency`}
          trend={{ direction: "up", value: "24.5%", positive: true }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Fleet overview + filters */}
        <Card className="lg:col-span-2">
          <div className="flex flex-col gap-3 border-b border-outline-variant p-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-headline-md font-semibold text-on-surface">Fleet Overview</h3>
            <div className="flex flex-wrap gap-2">
              <Select value={type} onChange={(e) => setType(e.target.value)} className="py-1.5 text-label-md">
                <option value="all">All Types</option>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="py-1.5 text-label-md">
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </Select>
              <Select value={region} onChange={(e) => setRegion(e.target.value)} className="py-1.5 text-label-md">
                <option value="all">All Regions</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(v) => v.id}
            pageSize={10}
            onRowClick={() => navigate("/fleet")}
            empty={<EmptyState icon="filter_alt_off" title="No vehicles match" description="Try adjusting the filters above." />}
          />
        </Card>

        {/* Alerts */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between border-b border-outline-variant p-4">
            <h3 className="text-headline-md font-semibold text-on-surface">Alerts</h3>
            <span className="rounded-full bg-error/10 px-2 py-0.5 font-label-sm text-label-sm font-bold text-error">
              {alerts.length}
            </span>
          </div>
          <div className="flex-1 divide-y divide-outline-variant/50">
            {alerts.length === 0 ? (
              <EmptyState icon="verified" title="All clear" description="No operational alerts right now." />
            ) : (
              alerts.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-4">
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      a.severity === "error" ? "bg-error/10 text-error" : "bg-tertiary/10 text-tertiary",
                    )}
                  >
                    <Icon name={a.icon} size={18} />
                  </span>
                  <div>
                    <p className="text-body-md text-on-surface">{a.title}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{a.detail}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
