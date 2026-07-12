import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { isServiceDue } from "@/lib/analytics";
import { VEHICLE_TYPES, type Vehicle, type VehicleStatus, type VehicleType } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { Button, Card, EmptyState, Field, Input, PageHeader, Select } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ReadOnlyNotice } from "@/components/layout/guards";
import { Icon } from "@/components/ui/Icon";

const STATUS_OPTIONS: VehicleStatus[] = ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"];

interface FormState {
  registrationNo: string;
  name: string;
  type: VehicleType;
  capacityKg: number;
  odometer: number;
  acquisitionCost: number;
  region: string;
  status: VehicleStatus;
}

const emptyForm: FormState = {
  registrationNo: "",
  name: "",
  type: "Truck",
  capacityKg: 1000,
  odometer: 0,
  acquisitionCost: 0,
  region: "",
  status: "AVAILABLE",
};

export function Fleet() {
  const { db, addVehicle, updateVehicle, deleteVehicle } = useStore();
  const { canEdit } = useAuth();
  const toast = useToast();
  const editable = canEdit("fleet");

  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [region, setRegion] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const regions = useMemo(
    () => Array.from(new Set(db.vehicles.map((v) => v.region))).sort(),
    [db.vehicles],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return db.vehicles.filter(
      (v) =>
        (type === "all" || v.type === type) &&
        (status === "all" || v.status === status) &&
        (region === "all" || v.region === region) &&
        (q === "" ||
          v.registrationNo.toLowerCase().includes(q) ||
          v.name.toLowerCase().includes(q) ||
          v.region.toLowerCase().includes(q)),
    );
  }, [db.vehicles, search, type, status, region]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };
  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      registrationNo: v.registrationNo,
      name: v.name,
      type: v.type,
      capacityKg: v.capacityKg,
      odometer: v.odometer,
      acquisitionCost: v.acquisitionCost,
      region: v.region,
      status: v.status,
    });
    setModalOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = editing ? updateVehicle(editing.id, form) : addVehicle(form);
    if (res.ok) {
      toast.success(editing ? "Vehicle updated." : `Vehicle ${form.registrationNo.toUpperCase()} added.`);
      setModalOpen(false);
    } else {
      toast.error(res.error);
    }
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    const res = deleteVehicle(deleteId);
    if (res.ok) toast.success("Vehicle deleted.");
    else toast.error(res.error);
  };

  const exportCsv = () => {
    downloadCsv("vehicles", rows, [
      { header: "Registration", value: (v) => v.registrationNo },
      { header: "Name", value: (v) => v.name },
      { header: "Type", value: (v) => v.type },
      { header: "Capacity (kg)", value: (v) => v.capacityKg },
      { header: "Odometer (km)", value: (v) => v.odometer },
      { header: "Acquisition Cost", value: (v) => v.acquisitionCost },
      { header: "Region", value: (v) => v.region },
      { header: "Status", value: (v) => v.status },
    ]);
    toast.info("Exported vehicles.csv");
  };

  const columns: Column<Vehicle>[] = [
    {
      header: "Vehicle",
      cell: (v) => (
        <div className="flex items-center gap-2">
          <div>
            <p className="font-medium text-on-surface">{v.registrationNo}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{v.name}</p>
          </div>
          {isServiceDue(v, db.settings.maintenanceAlertKm) && (
            <span title="Service due (odometer milestone)">
              <Icon name="build" size={15} className="text-tertiary" />
            </span>
          )}
        </div>
      ),
    },
    { header: "Type", cell: (v) => v.type, className: "hidden sm:table-cell" },
    {
      header: "Capacity",
      cell: (v) => <span className="font-mono">{formatNumber(v.capacityKg)} kg</span>,
      className: "hidden md:table-cell",
    },
    {
      header: "Odometer",
      cell: (v) => <span className="font-mono">{formatNumber(v.odometer)} km</span>,
      className: "hidden lg:table-cell",
    },
    {
      header: "Acq. Cost",
      cell: (v) => formatCurrency(v.acquisitionCost, db.settings.currency),
      className: "hidden xl:table-cell",
    },
    { header: "Status", cell: (v) => <StatusBadge status={v.status} /> },
    ...(editable
      ? [
          {
            header: "",
            headerClassName: "w-0",
            className: "text-right",
            cell: (v: Vehicle) => (
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => openEdit(v)}
                  className="rounded-md p-1.5 text-on-surface-variant hover:bg-white/5 hover:text-primary"
                  aria-label="Edit"
                >
                  <Icon name="edit" size={18} />
                </button>
                <button
                  onClick={() => setDeleteId(v.id)}
                  className="rounded-md p-1.5 text-on-surface-variant hover:bg-white/5 hover:text-error"
                  aria-label="Delete"
                >
                  <Icon name="delete" size={18} />
                </button>
              </div>
            ),
          } as Column<Vehicle>,
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Vehicle Registry"
        subtitle="Master list of fleet assets, capacity, and lifecycle status."
        icon="local_shipping"
        actions={
          <>
            <Button variant="outline" icon="download" onClick={exportCsv}>
              Export
            </Button>
            {editable && (
              <Button icon="add" onClick={openAdd}>
                Add Vehicle
              </Button>
            )}
          </>
        }
      />

      {!editable && <ReadOnlyNotice />}

      <Card>
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search registration, model…"
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={type} onChange={(e) => setType(e.target.value)} className="py-1.5">
              <option value="all">All Types</option>
              {VEHICLE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="py-1.5">
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </Select>
            <Select value={region} onChange={(e) => setRegion(e.target.value)} className="py-1.5">
              <option value="all">All Regions</option>
              {regions.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(v) => v.id}
          empty={
            <EmptyState
              icon="local_shipping"
              title="No vehicles found"
              description={editable ? "Add your first vehicle to get started." : "No vehicles match your filters."}
              action={editable ? <Button icon="add" onClick={openAdd}>Add Vehicle</Button> : undefined}
            />
          }
        />
        <div className="border-t border-white/10 px-4 py-2.5 font-label-sm text-label-sm text-on-surface-variant">
          {rows.length} of {db.vehicles.length} vehicles
        </div>
      </Card>

      {/* Add / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Vehicle" : "Add Vehicle"}
        description={editing ? editing.registrationNo : "Register a new asset in the fleet."}
        icon="local_shipping"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="vehicle-form" icon="save">
              {editing ? "Save Changes" : "Add Vehicle"}
            </Button>
          </>
        }
      >
        <form id="vehicle-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Registration No.">
            <Input
              value={form.registrationNo}
              onChange={(e) => setForm({ ...form, registrationNo: e.target.value })}
              placeholder="GJ-01-AB-1234"
              required
            />
          </Field>
          <Field label="Name / Model">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tata LPT 1618"
              required
            />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as VehicleType })}>
              {VEHICLE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Region">
            <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Ahmedabad" required />
          </Field>
          <Field label="Capacity (kg)">
            <Input
              type="number"
              min={1}
              value={form.capacityKg}
              onChange={(e) => setForm({ ...form, capacityKg: Number(e.target.value) })}
              required
            />
          </Field>
          <Field label="Odometer (km)">
            <Input
              type="number"
              min={0}
              value={form.odometer}
              onChange={(e) => setForm({ ...form, odometer: Number(e.target.value) })}
              required
            />
          </Field>
          <Field label="Acquisition Cost">
            <Input
              type="number"
              min={0}
              value={form.acquisitionCost}
              onChange={(e) => setForm({ ...form, acquisitionCost: Number(e.target.value) })}
              required
            />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </Select>
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete vehicle?"
        message="This will permanently remove the vehicle from the registry. This cannot be undone."
        confirmLabel="Delete"
        danger
        icon="delete"
      />
    </>
  );
}
