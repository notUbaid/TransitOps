import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import {
  DRIVER_CATEGORIES,
  type Driver,
  type DriverCategory,
  type DriverStatus,
} from "@/lib/types";
import { daysUntil, formatDate, isExpired, isExpiringSoon } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { Button, Card, EmptyState, Field, Input, PageHeader, Select } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ReadOnlyNotice } from "@/components/layout/guards";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: DriverStatus[] = ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"];

interface FormState {
  name: string;
  licenseNumber: string;
  category: DriverCategory;
  licenseExpiry: string; // yyyy-mm-dd
  phone: string;
  safetyScore: number;
  tripCompletionRate: number;
  status: DriverStatus;
}

const toDateInput = (iso: string) => new Date(iso).toISOString().slice(0, 10);
const todayInput = () => new Date().toISOString().slice(0, 10);

const emptyForm: FormState = {
  name: "",
  licenseNumber: "",
  category: "Heavy",
  licenseExpiry: todayInput(),
  phone: "",
  safetyScore: 80,
  tripCompletionRate: 90,
  status: "AVAILABLE",
};

function scoreColor(score: number) {
  if (score >= 85) return "text-emerald-300";
  if (score >= 70) return "text-tertiary";
  return "text-error";
}

export function Drivers() {
  const { db, addDriver, updateDriver, deleteDriver } = useStore();
  const { canEdit } = useAuth();
  const toast = useToast();
  const editable = canEdit("drivers");

  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [status, setStatus] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [detailDriver, setDetailDriver] = useState<Driver | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return db.drivers.filter(
      (d) =>
        (status === "all" || d.status === status) &&
        (q === "" || d.name.toLowerCase().includes(q) || d.licenseNumber.toLowerCase().includes(q)),
    );
  }, [db.drivers, search, status]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };
  const openEdit = (d: Driver) => {
    setEditing(d);
    setForm({
      name: d.name,
      licenseNumber: d.licenseNumber,
      category: d.category,
      licenseExpiry: toDateInput(d.licenseExpiry),
      phone: d.phone,
      safetyScore: d.safetyScore,
      tripCompletionRate: d.tripCompletionRate,
      status: d.status,
    });
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      licenseExpiry: new Date(form.licenseExpiry).toISOString(),
    };
    const res = editing ? await updateDriver(editing.id, payload) : await addDriver(payload);
    if (res.ok) {
      toast.success(editing ? "Driver updated." : `Driver ${form.name} added.`);
      setModalOpen(false);
    } else {
      toast.error(res.error);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const res = await deleteDriver(deleteId);
    if (res.ok) toast.success("Driver deleted.");
    else toast.error(res.error);
  };

  const exportCsv = () => {
    downloadCsv("drivers", rows, [
      { header: "Name", value: (d) => d.name },
      { header: "License", value: (d) => d.licenseNumber },
      { header: "Category", value: (d) => d.category },
      { header: "License Expiry", value: (d) => formatDate(d.licenseExpiry) },
      { header: "Phone", value: (d) => d.phone },
      { header: "Safety Score", value: (d) => d.safetyScore },
      { header: "Trip Completion %", value: (d) => d.tripCompletionRate },
      { header: "Status", value: (d) => d.status },
    ]);
    toast.info("Exported drivers.csv");
  };

  const columns: Column<Driver>[] = [
    {
      header: "Driver",
      sortValue: (d) => d.name,
      cell: (d) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-container font-label-sm text-label-sm font-bold text-on-secondary-container">
            {d.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <div>
            <p className="font-medium text-on-surface">{d.name}</p>
            <p className="font-mono font-label-sm text-label-sm text-on-surface-variant">{d.licenseNumber}</p>
          </div>
        </div>
      ),
    },
    { header: "Category", sortValue: (d) => d.category, cell: (d) => d.category, className: "hidden sm:table-cell" },
    {
      header: "License Expiry",
      sortValue: (d) => d.licenseExpiry,
      className: "hidden md:table-cell",
      cell: (d) => {
        const expired = isExpired(d.licenseExpiry);
        const soon = isExpiringSoon(d.licenseExpiry);
        return (
          <div className="flex items-center gap-1.5">
            <span className={cn(expired ? "text-error" : soon ? "text-tertiary" : "text-on-surface")}>
              {formatDate(d.licenseExpiry)}
            </span>
            {(expired || soon) && (
              <span
                title={expired ? "License expired" : `Expires in ${daysUntil(d.licenseExpiry)} days`}
                className={expired ? "text-error" : "text-tertiary"}
              >
                <Icon name="warning" size={15} />
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Safety",
      sortValue: (d) => d.safetyScore,
      className: "hidden lg:table-cell",
      cell: (d) => <span className={cn("font-mono font-semibold", scoreColor(d.safetyScore))}>{d.safetyScore}</span>,
    },
    { header: "Contact", sortValue: (d) => d.phone, cell: (d) => <span className="font-mono">{d.phone}</span>, className: "hidden xl:table-cell" },
    { header: "Status", sortValue: (d) => d.status, cell: (d) => <StatusBadge status={d.status} /> },
    ...(editable
      ? [
          {
            header: "",
            headerClassName: "w-0",
            className: "text-right",
            cell: (d: Driver) => (
              <div className="flex items-center justify-end gap-1">
                <button onClick={(e) => { e.stopPropagation(); openEdit(d); }} className="rounded-md p-1.5 text-on-surface-variant hover:bg-white/5 hover:text-primary" aria-label="Edit">
                  <Icon name="edit" size={18} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteId(d.id); }} className="rounded-md p-1.5 text-on-surface-variant hover:bg-white/5 hover:text-error" aria-label="Delete">
                  <Icon name="delete" size={18} />
                </button>
              </div>
            ),
          } as Column<Driver>,
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Driver Management"
        subtitle="Profiles, license compliance, and safety scores."
        icon="badge"
        actions={
          <>
            <Button variant="outline" icon="download" onClick={exportCsv}>
              Export
            </Button>
            {editable && (
              <Button icon="add" onClick={openAdd}>
                Add Driver
              </Button>
            )}
          </>
        }
      />

      {!editable && <ReadOnlyNotice />}

      <Card>
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, license…" className="pl-10" />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="py-1.5 sm:w-auto">
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </Select>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(d) => d.id}
          onRowClick={(d) => setDetailDriver(d)}
          pageSize={10}
          empty={
            <EmptyState
              icon="badge"
              title="No drivers found"
              description={editable ? "Add your first driver to get started." : "No drivers match your filters."}
              action={editable ? <Button icon="add" onClick={openAdd}>Add Driver</Button> : undefined}
            />
          }
        />
        <div className="border-t border-white/10 px-4 py-2.5 font-label-sm text-label-sm text-on-surface-variant">
          {rows.length} of {db.drivers.length} drivers
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Driver" : "Add Driver"}
        description={editing ? editing.name : "Register a new driver profile."}
        icon="badge"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="driver-form" icon="save">
              {editing ? "Save Changes" : "Add Driver"}
            </Button>
          </>
        }
      >
        <form id="driver-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rajesh Patel" required />
          </Field>
          <Field label="License Number">
            <Input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} placeholder="GJ-01-2025-00001" required />
          </Field>
          <Field label="License Category">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as DriverCategory })}>
              {DRIVER_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="License Expiry">
            <Input type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} required />
          </Field>
          <Field label="Contact Number">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" required />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DriverStatus })}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Safety Score (0-100)">
            <Input type="number" min={0} max={100} value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: Number(e.target.value) })} required />
          </Field>
          <Field label="Trip Completion %">
            <Input type="number" min={0} max={100} value={form.tripCompletionRate} onChange={(e) => setForm({ ...form, tripCompletionRate: Number(e.target.value) })} required />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete driver?"
        message="This will permanently remove the driver profile. This cannot be undone."
        confirmLabel="Delete"
        danger
        icon="delete"
      />

      {/* Detail Modal */}
      {detailDriver && (
        <Modal
          open={!!detailDriver}
          onClose={() => setDetailDriver(null)}
          title={`Driver: ${detailDriver.name}`}
          description={detailDriver.licenseNumber}
          icon="badge"
          footer={
            <Button variant="outline" onClick={() => setDetailDriver(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-white/10 bg-surface-container-high/40 p-4 sm:grid-cols-4">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Category</p>
                <p className="font-medium text-on-surface">{detailDriver.category}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Status</p>
                <p className="font-medium text-on-surface">{detailDriver.status}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Safety Score</p>
                <p className={cn("font-mono font-semibold", scoreColor(detailDriver.safetyScore))}>{detailDriver.safetyScore}/100</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Trip Completion</p>
                <p className="font-mono text-on-surface">{detailDriver.tripCompletionRate}%</p>
              </div>
            </div>

            <div>
              <h4 className="font-label-md text-label-md font-bold text-on-surface">Recent Trips</h4>
              <ul className="mt-2 divide-y divide-white/5 rounded-lg border border-white/10">
                {db.trips
                  .filter((t) => t.driverId === detailDriver.id)
                  .slice(0, 5)
                  .map((t) => (
                    <li key={t.id} className="flex justify-between p-3 text-body-md">
                      <span className="text-on-surface">{t.source} → {t.destination}</span>
                      <span className="font-mono text-on-surface-variant">{t.status}</span>
                    </li>
                  ))}
                {db.trips.filter((t) => t.driverId === detailDriver.id).length === 0 && (
                  <li className="p-3 text-body-sm text-on-surface-variant">No trips recorded.</li>
                )}
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
