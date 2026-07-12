import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStore } from "@/lib/store";
import {
  costliestVehicles,
  expenseByType,
  fleetKpis,
  fleetRoi,
  fuelEfficiency,
  monthlySeries,
  totalOperationalCost,
  totalRevenue,
  vehicleOperatingCost,
  vehicleRevenue,
  vehicleRoi,
} from "@/lib/analytics";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { KpiCard } from "@/components/ui/KpiCard";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";

const C = {
  primary: "#2563eb",
  primaryDim: "#1d4ed8",
  tertiary: "#f97316",
  tertiaryC: "#ea580c",
  secondary: "#8b9dc3",
  emerald: "#16a34a",
  outline: "#9ca3af",
  axis: "#9ca3af",
  grid: "rgba(0,0,0,0.06)",
};

const PIE_COLORS: Record<string, string> = {
  Fuel: "#2563eb",
  Tolls: "#8b9dc3",
  Maintenance: "#ea580c",
  Other: "#9ca3af",
};

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  color: "#111827",
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

export function Analytics() {
  const { db } = useStore();
  const toast = useToast();

  const fleet = fleetKpis(db);
  const efficiency = fuelEfficiency(db);
  const opCost = totalOperationalCost(db);
  const roi = fleetRoi(db);
  const revenue = totalRevenue(db);

  const series = useMemo(() => monthlySeries(db, 7), [db]);
  const costliest = useMemo(() => costliestVehicles(db, 6), [db]);
  const pie = useMemo(() => expenseByType(db), [db]);

  const roiRows = useMemo(
    () =>
      db.vehicles
        .map((v) => ({
          reg: v.registrationNo,
          name: v.name,
          revenue: vehicleRevenue(db, v.id),
          cost: vehicleOperatingCost(db, v.id),
          roi: vehicleRoi(db, v),
        }))
        .sort((a, b) => b.roi - a.roi),
    [db],
  );

  const exportCsv = () => {
    downloadCsv("analytics_vehicle_roi", roiRows, [
      { header: "Registration", value: (r) => r.reg },
      { header: "Name", value: (r) => r.name },
      { header: "Revenue", value: (r) => Math.round(r.revenue) },
      { header: "Operating Cost", value: (r) => Math.round(r.cost) },
      { header: "ROI %", value: (r) => r.roi.toFixed(1) },
    ]);
    toast.info("Exported analytics_vehicle_roi.csv");
  };

  const currency = db.settings.currency;

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Performance metrics and operational efficiency data."
        icon="analytics"
        actions={
          <>
            <Button variant="outline" icon="picture_as_pdf" onClick={() => window.print()}>
              PDF
            </Button>
            <Button variant="outline" icon="download" onClick={exportCsv}>
              Export
            </Button>
          </>
        }
      />

      {/* KPI bento */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Fuel Efficiency" value={efficiency.toFixed(1)} unit="km/L" icon="local_gas_station" accent="primary" />
        <KpiCard label="Fleet Utilization" value={fleet.utilization} unit="%" icon="pie_chart" accent="secondary" progress={fleet.utilization} />
        <KpiCard label="Operational Cost" value={formatCompactCurrency(opCost, currency)} icon="payments" accent="tertiary" footnote="Fuel + maintenance + tolls" />
        <KpiCard label="Fleet ROI" value={roi.toFixed(1)} unit="%" icon="insights" accent="emerald" footnote="Avg revenue / cost ratio" />
      </div>

      {/* Revenue vs cost + expense pie */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2 lg:p-6">
          <div className="mb-5">
            <h3 className="text-headline-md font-semibold text-on-surface">Revenue vs Cost</h3>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Monthly gross revenue and operational spend · Total revenue {formatCurrency(revenue, currency)}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
              <XAxis dataKey="month" stroke={C.axis} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                stroke={C.axis}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCompactCurrency(v, currency)}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(0,0,0,0.03)" }}
                formatter={(v: any, name: any) => [formatCurrency(v as number, currency), name === "revenue" ? "Revenue" : "Cost"]}
              />
              <Bar dataKey="revenue" fill={C.primary} radius={[4, 4, 0, 0]} maxBarSize={38} isAnimationActive={false} />
              <Line dataKey="cost" stroke={C.tertiary} strokeWidth={2.5} dot={{ r: 3, fill: C.tertiary }} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 lg:p-6">
          <div className="mb-2">
            <h3 className="text-headline-md font-semibold text-on-surface">Expense Breakdown</h3>
            <p className="font-label-sm text-label-sm text-on-surface-variant">By category</p>
          </div>
          {pie.length === 0 ? (
            <EmptyState icon="donut_large" title="No expenses" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="none" isAnimationActive={false}>
                    {pie.map((slice) => (
                      <Cell key={slice.name} fill={PIE_COLORS[slice.name] ?? C.outline} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => formatCurrency(v as number, currency)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {pie.map((slice) => (
                  <div key={slice.name} className="flex items-center justify-between text-body-md">
                    <span className="flex items-center gap-2 text-on-surface-variant">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[slice.name] ?? C.outline }} />
                      {slice.name}
                    </span>
                    <span className="font-mono text-on-surface">{formatCurrency(slice.value, currency)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Costliest vehicles + ROI table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5 lg:p-6">
          <div className="mb-5">
            <h3 className="text-headline-md font-semibold text-on-surface">Costliest Vehicles</h3>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Maintenance & fuel overheads</p>
          </div>
          {costliest.length === 0 ? (
            <EmptyState icon="bar_chart" title="No cost data" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={costliest.map((c) => ({ name: c.vehicle.registrationNo.replace("GJ-01-", ""), cost: c.cost }))}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
                <XAxis type="number" stroke={C.axis} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v, currency)} />
                <YAxis type="category" dataKey="name" stroke={C.axis} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={tooltipStyle}                 cursor={{ fill: "rgba(0,0,0,0.03)" }} formatter={(v: any) => [formatCurrency(v as number, currency), "Cost"]} />
                <Bar dataKey="cost" fill={C.tertiaryC} radius={[0, 4, 4, 0]} maxBarSize={26} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <div className="border-b border-outline-variant p-4 lg:p-6 lg:pb-4">
            <h3 className="text-headline-md font-semibold text-on-surface">Vehicle ROI</h3>
            <p className="font-label-sm text-label-sm text-on-surface-variant">(Revenue − Cost) / Acquisition</p>
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            <table className="w-full text-left text-body-md">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-outline-variant font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  <th className="px-4 py-2.5 font-medium">Vehicle</th>
                  <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
                  <th className="px-4 py-2.5 text-right font-medium">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {roiRows.map((r) => (
                  <tr key={r.reg} className="hover:bg-primary/5">
                    <td className="px-4 py-2.5 font-mono text-on-surface">{r.reg.replace("GJ-01-", "")}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-on-surface-variant">{formatCompactCurrency(r.revenue, currency)}</td>
                      <td className={`px-4 py-2.5 text-right font-mono font-semibold ${r.roi >= 0 ? "text-emerald-600" : "text-error"}`}>
                      {r.roi.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
