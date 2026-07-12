import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import type { MaintenanceLog, MaintenanceStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { Button, Card, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { KpiCard } from "@/components/ui/KpiCard";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ReadOnlyNotice } from "@/components/layout/guards";
import { Icon } from "@/components/ui/Icon";

interface FormState {
  vehicleId: string;
  serviceType: string;
  cost: number;
  serviceDate: string;
  status: MaintenanceStatus;
  notes: string;
}

const todayInput = () => new Date().toISOString().slice(0, 10);

export function Maintenance() {
  const { db, addMaintenance, completeMaintenance, deleteMaintenance, vehicleById } = useStore();
  const { canEdit } = useAuth();
  const toast = useToast();
  const editable = canEdit("maintenance");

  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [completeId, setCompleteId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const serviceableVehicles = db.vehicles.filter((v) => v.status !== "ON_TRIP" && v.status !== "RETIRED");

  const [form, setForm] = useState<FormState>({
    vehicleId: "",
    serviceType: "",
    cost: 0,
    serviceDate: todayInput(),
    status: "ACTIVE",
    notes: "",
  });

  const rows = useMemo(() => {
    const sorted = [...db.maintenance].sort(
      (a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime(),
    );
    return statusFilter === "all" ? sorted : sorted.filter((m) => m.status === statusFilter);
  }, [db.maintenance, statusFilter]);

  const activeCount = db.maintenance.filter((m) => m.status === "ACTIVE").length;
  const inShop = db.vehicles.filter((v) => v.status === "IN_SHOP").length;
  const totalCost = db.maintenance.reduce((s, m) => s + m.cost, 0);
  const avgCost = db.maintenance.length ? totalCost / db.maintenance.length : 0;

  const openAdd = () => {
    setForm({
      vehicleId: serviceableVehicles[0]?.id ?? "",
      serviceType: "",
      cost: 0,
      serviceDate: todayInput(),
      status: "ACTIVE",
      notes: "",
    });
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await addMaintenance({
      vehicleId: form.vehicleId,
      serviceType: form.serviceType,
      cost: form.cost,
      serviceDate: new Date(form.serviceDate).toISOString(),
      status: form.status,
      notes: form.notes || null,
    });
    if (res.ok) {
      toast.success(form.status === "ACTIVE" ? "Service logged — vehicle sent to shop." : "Service record added.");
      setModalOpen(false);
    } else {
      toast.error(res.error);
    }
  };

  const onComplete = async () => {
    if (!completeId) return;
    const res = await completeMaintenance(completeId);
    if (res.ok) toast.success("Maintenance completed — vehicle released.");
    else toast.error(res.error);
  };
  const onDelete = async () => {
    if (!deleteId) return;
    const res = await deleteMaintenance(deleteId);
    if (res.ok) toast.success("Maintenance log deleted.");
    else toast.error(res.error);
  };

  const exportCsv = () => {
    downloadCsv("maintenance", rows, [
      { header: "Vehicle", value: (m) => vehicleById(m.vehicleId)?.registrationNo ?? "" },
      { header: "Service", value: (m) => m.serviceType },
      { header: "Cost", value: (m) => m.cost },
      { header: "Date", value: (m) => formatDate(m.serviceDate) },
      { header: "Status", value: (m) => m.status },
      { header: "Notes", value: (m) => m.notes ?? "" },
    ]);
    toast.info("Exported maintenance.csv");
  };

  const columns: Column<MaintenanceLog>[] = [
    {
      header: "Vehicle",
      sortValue: (m) => vehicleById(m.vehicleId)?.registrationNo,
      cell: (m) => {
        const v = vehicleById(m.vehicleId);
        return (
          <div>
            <p className="font-medium text-on-surface">{v?.registrationNo ?? "—"}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{v?.name}</p>
          </div>
        );
      },
    },
    { header: "Service", sortValue: (m) => m.serviceType, cell: (m) => m.serviceType },
    { header: "Cost", sortValue: (m) => m.cost, cell: (m) => formatCurrency(m.cost, db.settings.currency), className: "hidden sm:table-cell" },
    { header: "Date", sortValue: (m) => m.serviceDate, cell: (m) => formatDate(m.serviceDate), className: "hidden md:table-cell" },
    { header: "Notes", sortValue: (m) => m.notes, cell: (m) => <span className="text-on-surface-variant">{m.notes}</span>, className: "hidden xl:table-cell max-w-xs truncate" },
    { header: "Status", sortValue: (m) => m.status, cell: (m) => <StatusBadge status={m.status} /> },
    ...(editable
      ? [
          {
            header: "",
            headerClassName: "w-0",
            className: "text-right",
            cell: (m: MaintenanceLog) => (
              <div className="flex items-center justify-end gap-1">
                {m.status === "ACTIVE" && (
                  <button onClick={() => setCompleteId(m.id)} className="rounded-md p-1.5 text-on-surface-variant hover:bg-white/5 hover:text-emerald-300" title="Mark completed">
                    <Icon name="task_alt" size={18} />
                  </button>
                )}
                <button onClick={() => setDeleteId(m.id)} className="rounded-md p-1.5 text-on-surface-variant hover:bg-white/5 hover:text-error" title="Delete">
                  <Icon name="delete" size={18} />
                </button>
              </div>
            ),
          } as Column<MaintenanceLog>,
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Maintenance"
        subtitle="Service records and shop status across the fleet."
        icon="build"
        actions={
          <>
            <Button variant="outline" icon="download" onClick={exportCsv}>
              Export
            </Button>
            {editable && (
              <Button icon="add" onClick={openAdd}>
                Add Service
              </Button>
            )}
          </>
        }
      />

      {!editable && <ReadOnlyNotice />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Vehicles In Shop" value={inShop} icon="garage" accent="tertiary" />
        <KpiCard label="Active Services" value={activeCount} icon="pending" accent="primary" />
        <KpiCard label="Total Spend" value={formatCurrency(totalCost, db.settings.currency)} icon="payments" accent="emerald" />
        <KpiCard label="Avg / Service" value={formatCurrency(avgCost, db.settings.currency)} icon="insights" accent="secondary" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-headline-md font-semibold text-on-surface">Service Logs</h3>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="py-1.5 sm:w-auto">
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
          </Select>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(m) => m.id}
          pageSize={10}
          empty={
            <EmptyState
              icon="build"
              title="No maintenance records"
              description={editable ? "Log a service to send a vehicle to the shop." : "No records match your filter."}
              action={editable ? <Button icon="add" onClick={openAdd}>Add Service</Button> : undefined}
            />
          }
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Service Record"
        description="Active records move the vehicle to the shop."
        icon="build"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="maint-form" icon="save">
              Save Record
            </Button>
          </>
        }
      >
        <form id="maint-form" onSubmit={submit} className="space-y-4">
          <Field label="Vehicle">
            <Select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required>
              <option value="">— Select vehicle —</option>
              {serviceableVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNo} · {v.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Service Type">
              <Input value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} placeholder="Oil Change" required />
            </Field>
            <Field label="Cost">
              <Input type="number" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} required />
            </Field>
            <Field label="Service Date">
              <Input type="date" value={form.serviceDate} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })} required />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as MaintenanceStatus })}>
                <option value="ACTIVE">Active (send to shop)</option>
                <option value="COMPLETED">Completed</option>
              </Select>
            </Field>
          </div>
          <Field label="Notes">
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional details…" />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!completeId}
        onClose={() => setCompleteId(null)}
        onConfirm={onComplete}
        title="Complete maintenance?"
        message="The vehicle will be released back to Available (unless retired)."
        confirmLabel="Mark Completed"
        icon="task_alt"
      />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={onDelete}
        title="Delete maintenance log?"
        message="This permanently removes the record. If it was active, the vehicle will be released."
        confirmLabel="Delete"
        danger
        icon="delete"
      />
    </>
  );
}
