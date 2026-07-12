import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import type { Expense, ExpenseType } from "@/lib/types";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { vehicleFuelCost } from "@/lib/analytics";
import { downloadCsv } from "@/lib/csv";
import { Button, Card, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { KpiCard } from "@/components/ui/KpiCard";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ReadOnlyNotice } from "@/components/layout/guards";
import { Icon } from "@/components/ui/Icon";

const EXPENSE_TYPES: ExpenseType[] = ["FUEL", "TOLL", "MAINTENANCE", "OTHER"];
const todayInput = () => new Date().toISOString().slice(0, 10);

interface FormState {
  type: ExpenseType;
  vehicleId: string;
  tripId: string;
  amount: number;
  liters: number;
  date: string;
  description: string;
}

export function Expenses() {
  const { db, addExpense, deleteExpense, vehicleById } = useStore();
  const { canEdit } = useAuth();
  const toast = useToast();
  const editable = canEdit("expenses");

  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    type: "FUEL",
    vehicleId: "",
    tripId: "",
    amount: 0,
    liters: 0,
    date: todayInput(),
    description: "",
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...db.expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter(
        (e) =>
          (typeFilter === "all" || e.type === typeFilter) &&
          (q === "" || e.description.toLowerCase().includes(q)),
      );
  }, [db.expenses, typeFilter, search]);

  const byType = (t: ExpenseType) => db.expenses.filter((e) => e.type === t).reduce((s, e) => s + e.amount, 0);
  const fuelCost = byType("FUEL");
  const tollCost = byType("TOLL");
  const otherCost = byType("OTHER") + byType("MAINTENANCE");
  const totalLiters = db.expenses.reduce((s, e) => s + (e.liters ?? 0), 0);

  const costByVehicle = useMemo(
    () =>
      db.vehicles
        .map((v) => {
          const fuel = vehicleFuelCost(db, v.id);
          const maintenance = db.maintenance.filter((m) => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0);
          return { vehicle: v, fuel, maintenance, total: fuel + maintenance };
        })
        .filter((x) => x.total > 0)
        .sort((a, b) => b.total - a.total),
    [db],
  );

  const openAdd = () => {
    setForm({ type: "FUEL", vehicleId: "", tripId: "", amount: 0, liters: 0, date: todayInput(), description: "" });
    setModalOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addExpense({
      type: form.type,
      vehicleId: form.vehicleId || null,
      tripId: form.tripId || null,
      amount: form.amount,
      date: new Date(form.date).toISOString(),
      liters: form.type === "FUEL" ? form.liters : null,
      description: form.description,
    });
    if (res.ok) {
      toast.success("Expense logged.");
      setModalOpen(false);
    } else {
      toast.error(res.error);
    }
  };

  const onDelete = () => {
    if (!deleteId) return;
    const res = deleteExpense(deleteId);
    if (res.ok) toast.success("Expense deleted.");
    else toast.error(res.error);
  };

  const exportCsv = () => {
    downloadCsv("expenses", rows, [
      { header: "Type", value: (e) => e.type },
      { header: "Vehicle", value: (e) => vehicleById(e.vehicleId)?.registrationNo ?? "" },
      { header: "Amount", value: (e) => e.amount },
      { header: "Liters", value: (e) => e.liters ?? "" },
      { header: "Date", value: (e) => formatDate(e.date) },
      { header: "Description", value: (e) => e.description },
    ]);
    toast.info("Exported expenses.csv");
  };

  const columns: Column<Expense>[] = [
    { header: "Type", sortValue: (e) => e.type, cell: (e) => <StatusBadge status={e.type} dot={false} /> },
    { header: "Description", sortValue: (e) => e.description, cell: (e) => e.description },
    {
      header: "Vehicle",
      sortValue: (e) => vehicleById(e.vehicleId)?.registrationNo,
      cell: (e) => <span className="font-mono text-on-surface-variant">{vehicleById(e.vehicleId)?.registrationNo ?? "—"}</span>,
      className: "hidden md:table-cell",
    },
    {
      header: "Liters",
      sortValue: (e) => e.liters,
      cell: (e) => (e.liters ? <span className="font-mono">{e.liters} L</span> : "—"),
      className: "hidden lg:table-cell",
    },
    { header: "Date", sortValue: (e) => e.date, cell: (e) => formatDate(e.date), className: "hidden sm:table-cell" },
    {
      header: "Amount",
      sortValue: (e) => e.amount,
      className: "text-right",
      cell: (e) => <span className="font-mono font-semibold text-on-surface">{formatCurrency(e.amount, db.settings.currency)}</span>,
    },
    ...(editable
      ? [
          {
            header: "",
            headerClassName: "w-0",
            className: "text-right",
            cell: (e: Expense) => (
              <button onClick={() => setDeleteId(e.id)} className="rounded-md p-1.5 text-on-surface-variant hover:bg-white/5 hover:text-error" title="Delete">
                <Icon name="delete" size={18} />
              </button>
            ),
          } as Column<Expense>,
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Fuel & Expenses"
        subtitle="Fuel logs, tolls, and operational spend tracking."
        icon="local_gas_station"
        actions={
          <>
            <Button variant="outline" icon="download" onClick={exportCsv}>
              Export
            </Button>
            {editable && (
              <Button icon="add" onClick={openAdd}>
                Add Expense
              </Button>
            )}
          </>
        }
      />

      {!editable && <ReadOnlyNotice />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Fuel Spend" value={formatCurrency(fuelCost, db.settings.currency)} icon="local_gas_station" accent="primary" footnote={`${formatNumber(totalLiters)} L total`} />
        <KpiCard label="Toll Spend" value={formatCurrency(tollCost, db.settings.currency)} icon="toll" accent="secondary" />
        <KpiCard label="Maint. & Other" value={formatCurrency(otherCost, db.settings.currency)} icon="build" accent="tertiary" />
        <KpiCard label="Total Expenses" value={formatCurrency(fuelCost + tollCost + otherCost, db.settings.currency)} icon="payments" accent="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-headline-md font-semibold text-on-surface">Expense Log</h3>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-10" />
              </div>
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="py-1.5">
                <option value="all">All Types</option>
                {EXPENSE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(e) => e.id}
            pageSize={10}
            empty={<EmptyState icon="receipt_long" title="No expenses" description="Log fuel, tolls, or other costs." action={editable ? <Button icon="add" onClick={openAdd}>Add Expense</Button> : undefined} />}
          />
        </Card>

        {/* Operational cost per vehicle */}
        <Card className="flex flex-col">
          <div className="border-b border-white/10 p-4">
            <h3 className="text-headline-md font-semibold text-on-surface">Cost by Vehicle</h3>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Fuel + Maintenance</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {costByVehicle.length === 0 ? (
              <EmptyState icon="paid" title="No costs yet" />
            ) : (
              <div className="space-y-4">
                {costByVehicle.map(({ vehicle, fuel, maintenance, total }) => {
                  const max = costByVehicle[0].total || 1;
                  return (
                    <div key={vehicle.id}>
                      <div className="mb-1 flex items-center justify-between text-body-md">
                        <span className="font-mono text-on-surface">{vehicle.registrationNo}</span>
                        <span className="font-mono text-on-surface-variant">{formatCurrency(total, db.settings.currency)}</span>
                      </div>
                      <div className="flex h-2 overflow-hidden rounded-full bg-surface-variant">
                        <div className="h-full bg-primary" style={{ width: `${(fuel / max) * 100}%` }} title={`Fuel ${formatCurrency(fuel, db.settings.currency)}`} />
                        <div className="h-full bg-tertiary-container" style={{ width: `${(maintenance / max) * 100}%` }} title={`Maintenance ${formatCurrency(maintenance, db.settings.currency)}`} />
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center gap-4 border-t border-white/10 pt-3 font-label-sm text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Fuel</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-tertiary-container" /> Maintenance</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Expense"
        description="Log a fuel, toll, maintenance, or other cost."
        icon="local_gas_station"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="expense-form" icon="save">
              Save Expense
            </Button>
          </>
        }
      >
        <form id="expense-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ExpenseType })}>
              {EXPENSE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Vehicle (optional)">
            <Select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">— None —</option>
              {db.vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNo}
                </option>
              ))}
            </Select>
          </Field>
          {form.type === "FUEL" && (
            <Field label="Liters" hint={`Auto-fills amount at ${formatCurrency(db.settings.fuelPricePerLiter, db.settings.currency)}/L`}>
              <Input
                type="number"
                min={0}
                value={form.liters}
                onChange={(e) => {
                  const liters = Number(e.target.value);
                  setForm({ ...form, liters, amount: Math.round(liters * db.settings.fuelPricePerLiter) });
                }}
              />
            </Field>
          )}
          <Field label="Amount">
            <Input type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required />
          </Field>
          <Field label="Date">
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Fuel for Ahmedabad to Vadodara" required />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={onDelete}
        title="Delete expense?"
        message="This permanently removes the expense record."
        confirmLabel="Delete"
        danger
        icon="delete"
      />
    </>
  );
}
