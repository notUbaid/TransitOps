import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import type { Trip, TripStatus } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { Button, Card, EmptyState, Field, Input, PageHeader, Select } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge, statusStyle } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ReadOnlyNotice } from "@/components/layout/guards";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const STATUS_FILTER: (TripStatus | "all")[] = ["all", "DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"];

interface TripForm {
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoKg: number;
  plannedKm: number;
  revenue: number;
}

const emptyForm: TripForm = {
  source: "",
  destination: "",
  vehicleId: "",
  driverId: "",
  cargoKg: 0,
  plannedKm: 0,
  revenue: 0,
};

export function Trips() {
  const store = useStore();
  const { db, createTrip, updateTrip, dispatchTrip, completeTrip, cancelTrip, deleteTrip, vehicleById, driverById } = store;
  const { canEdit } = useAuth();
  const toast = useToast();
  const editable = canEdit("trips");

  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<TripStatus | "all">("all");

  const [form, setForm] = useState<TripForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [completing, setCompleting] = useState<Trip | null>(null);
  const [endOdometer, setEndOdometer] = useState(0);
  const [fuelLiters, setFuelLiters] = useState(0);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const availableVehicles = useMemo(() => store.dispatchableVehicles(), [store]);
  const availableDrivers = useMemo(() => store.dispatchableDrivers(), [store]);

  const selectedVehicle = vehicleById(form.vehicleId || null);
  const capacityExceeded = !!selectedVehicle && form.cargoKg > selectedVehicle.capacityKg;
  const canDispatch =
    !!form.source.trim() &&
    !!form.destination.trim() &&
    !!form.vehicleId &&
    !!form.driverId &&
    form.cargoKg > 0 &&
    !capacityExceeded;

  const boardTrips = useMemo(
    () => db.trips.filter((t) => t.status === "DISPATCHED" || t.status === "DRAFT"),
    [db.trips],
  );
  const activeCount = boardTrips.filter((t) => t.status === "DISPATCHED").length;

  const tableRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return db.trips.filter(
      (t) =>
        (statusFilter === "all" || t.status === statusFilter) &&
        (q === "" ||
          t.code.toLowerCase().includes(q) ||
          t.source.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q)),
    );
  }, [db.trips, search, statusFilter]);

  const submitTrip = async (intent: "draft" | "dispatch") => {
    if (editingId) {
      const res = await updateTrip(editingId, {
        source: form.source,
        destination: form.destination,
        vehicleId: form.vehicleId || null,
        driverId: form.driverId || null,
        cargoKg: form.cargoKg,
        plannedKm: form.plannedKm,
        revenue: form.revenue,
      });
      if (res.ok) {
        toast.success(`Draft ${res.data!.code} updated.`);
        setForm(emptyForm);
        setEditingId(null);
        if (intent === "dispatch") {
          onDispatchExisting(editingId);
        }
      } else {
        toast.error(res.error);
      }
    } else {
      const res = await createTrip({
        source: form.source,
        destination: form.destination,
        vehicleId: form.vehicleId || null,
        driverId: form.driverId || null,
        cargoKg: form.cargoKg,
        plannedKm: form.plannedKm,
        revenue: form.revenue,
        intent,
      });
      if (res.ok) {
        toast.success(intent === "dispatch" ? `Trip ${res.data!.code} dispatched.` : `Draft ${res.data!.code} saved.`);
        setForm(emptyForm);
      } else {
        toast.error(res.error);
      }
    }
  };

  const onEditDraft = (trip: Trip) => {
    setEditingId(trip.id);
    setForm({
      source: trip.source,
      destination: trip.destination,
      vehicleId: trip.vehicleId || "",
      driverId: trip.driverId || "",
      cargoKg: trip.cargoKg,
      plannedKm: trip.plannedKm,
      revenue: trip.revenue,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onDispatchExisting = async (id: string) => {
    const res = await dispatchTrip(id);
    if (res.ok) toast.success(`Trip ${res.data!.code} dispatched.`);
    else toast.error(res.error);
  };

  const openComplete = (trip: Trip) => {
    const v = vehicleById(trip.vehicleId);
    setCompleting(trip);
    setEndOdometer((trip.startOdometer ?? v?.odometer ?? 0) + trip.plannedKm);
    setFuelLiters(Math.round(trip.plannedKm / 8));
  };
  const submitComplete = async () => {
    if (!completing) return;
    const res = await completeTrip(completing.id, { endOdometer, fuelLiters });
    if (res.ok) {
      toast.success(`Trip ${completing.code} completed.`);
      setCompleting(null);
    } else {
      toast.error(res.error);
    }
  };

  const onCancel = async () => {
    if (!cancelId) return;
    const res = await cancelTrip(cancelId);
    if (res.ok) toast.success("Trip cancelled.");
    else toast.error(res.error);
  };
  const onDelete = async () => {
    if (!deleteId) return;
    const res = await deleteTrip(deleteId);
    if (res.ok) toast.success("Trip deleted.");
    else toast.error(res.error);
  };

  const exportCsv = () => {
    downloadCsv("trips", tableRows, [
      { header: "Code", value: (t) => t.code },
      { header: "Source", value: (t) => t.source },
      { header: "Destination", value: (t) => t.destination },
      { header: "Vehicle", value: (t) => vehicleById(t.vehicleId)?.registrationNo ?? "" },
      { header: "Driver", value: (t) => driverById(t.driverId)?.name ?? "" },
      { header: "Cargo (kg)", value: (t) => t.cargoKg },
      { header: "Distance (km)", value: (t) => t.plannedKm },
      { header: "Revenue", value: (t) => t.revenue },
      { header: "Status", value: (t) => t.status },
    ]);
    toast.info("Exported trips.csv");
  };

  const columns: Column<Trip>[] = [
    { header: "Code", sortValue: (t) => t.code, cell: (t) => <span className="font-mono font-semibold text-primary">{t.code}</span> },
    {
      header: "Route",
      sortValue: (t) => `${t.source}-${t.destination}`,
      cell: (t) => (
        <span className="text-on-surface">
          {t.source} <span className="text-on-surface-variant">→</span> {t.destination}
        </span>
      ),
    },
    {
      header: "Vehicle / Driver",
      sortValue: (t) => vehicleById(t.vehicleId)?.registrationNo,
      className: "hidden md:table-cell",
      cell: (t) => (
        <div className="font-label-sm text-label-sm text-on-surface-variant">
          <p>{vehicleById(t.vehicleId)?.registrationNo ?? "—"}</p>
          <p>{driverById(t.driverId)?.name ?? "Unassigned"}</p>
        </div>
      ),
    },
    { header: "Cargo", sortValue: (t) => t.cargoKg, cell: (t) => <span className="font-mono">{formatNumber(t.cargoKg)} kg</span>, className: "hidden lg:table-cell" },
    { header: "Revenue", sortValue: (t) => t.revenue, cell: (t) => formatCurrency(t.revenue, db.settings.currency), className: "hidden xl:table-cell" },
    { header: "Status", sortValue: (t) => t.status, cell: (t) => <StatusBadge status={t.status} /> },
    ...(editable
      ? [
          {
            header: "",
            headerClassName: "w-0",
            className: "text-right",
            cell: (t: Trip) => (
              <div className="flex items-center justify-end gap-1">
                {t.status === "DRAFT" && (
                  <>
                    <button onClick={() => onEditDraft(t)} className="rounded-md p-1.5 text-on-surface-variant hover:bg-black/5 hover:text-primary" title="Edit" aria-label="Edit draft">
                      <Icon name="edit" size={18} />
                    </button>
                    <button onClick={() => onDispatchExisting(t.id)} className="rounded-md p-1.5 text-on-surface-variant hover:bg-black/5 hover:text-primary" title="Dispatch" aria-label="Dispatch trip">
                      <Icon name="send" size={18} />
                    </button>
                  </>
                )}
                {t.status === "DISPATCHED" && (
                  <button onClick={() => openComplete(t)} className="rounded-md p-1.5 text-on-surface-variant hover:bg-black/5 hover:text-emerald-600" title="Complete" aria-label="Complete trip">
                    <Icon name="check_circle" size={18} />
                  </button>
                )}
                {(t.status === "DRAFT" || t.status === "DISPATCHED") && (
                  <button onClick={() => setCancelId(t.id)} className="rounded-md p-1.5 text-on-surface-variant hover:bg-black/5 hover:text-error" title="Cancel" aria-label="Cancel trip">
                    <Icon name="block" size={18} />
                  </button>
                )}
                {t.status !== "DISPATCHED" && (
                  <button onClick={() => setDeleteId(t.id)} className="rounded-md p-1.5 text-on-surface-variant hover:bg-black/5 hover:text-error" title="Delete" aria-label="Delete trip">
                    <Icon name="delete" size={18} />
                  </button>
                )}
              </div>
            ),
          } as Column<Trip>,
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Trip Dispatcher"
        subtitle="Plan, validate, and launch new logistics routes."
        icon="route"
        actions={
          <Button variant="outline" icon="download" onClick={exportCsv}>
            Export
          </Button>
        }
      />

      {!editable && <ReadOnlyNotice />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Create Trip */}
        {editable && (
          <Card className="p-5 lg:col-span-7 lg:p-6">
            <h3 className="mb-5 border-b border-outline-variant pb-4 text-headline-md font-semibold text-on-surface">
              Create Trip
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitTrip("dispatch");
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Source">
                  <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Gandhinagar Depot" required />
                </Field>
                <Field label="Destination">
                  <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Ahmedabad Hub" required />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={`Vehicle (${availableVehicles.length} available)`}>
                  <Select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                    <option value="">— Select vehicle —</option>
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNo} · {formatNumber(v.capacityKg)} kg
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={`Driver (${availableDrivers.length} available)`}>
                  <Select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
                    <option value="">— Select driver —</option>
                    {availableDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} · {d.category}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Cargo Weight (kg)">
                  <Input
                    type="number"
                    min={0}
                    value={form.cargoKg}
                    onChange={(e) => setForm({ ...form, cargoKg: Number(e.target.value) })}
                    className={capacityExceeded ? "border-error focus:shadow-[0_0_0_1px_var(--color-error)]!" : ""}
                    required
                  />
                </Field>
                <Field label="Distance (km)">
                  <Input type="number" min={0} value={form.plannedKm} onChange={(e) => setForm({ ...form, plannedKm: Number(e.target.value) })} required />
                </Field>
                <Field label="Revenue">
                  <Input type="number" min={0} value={form.revenue} onChange={(e) => setForm({ ...form, revenue: Number(e.target.value) })} />
                </Field>
              </div>

              {/* Live capacity validation */}
              {capacityExceeded && selectedVehicle && (
                <div className="flex items-start gap-3 rounded-lg border border-error/30 bg-error/5 p-4">
                  <Icon name="error" size={20} className="mt-0.5 text-error" />
                  <div>
                    <p className="font-label-md text-label-md font-bold text-error">
                      Vehicle capacity: {formatNumber(selectedVehicle.capacityKg)} kg
                    </p>
                    <p className="mt-1 text-body-md text-on-surface-variant">Cargo weight: {formatNumber(form.cargoKg)} kg</p>
                    <p className="mt-1 text-body-md font-medium text-error">
                      Capacity exceeded by {formatNumber(form.cargoKg - selectedVehicle.capacityKg)} kg — dispatch blocked
                    </p>
                  </div>
                </div>
              )}
              {selectedVehicle && !capacityExceeded && form.cargoKg > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-50 px-4 py-2.5">
                  <Icon name="check_circle" size={18} className="text-emerald-600" />
                  <p className="text-body-md text-on-surface-variant">
                    {formatNumber(selectedVehicle.capacityKg - form.cargoKg)} kg of spare capacity — cleared for dispatch.
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-outline-variant pt-4 sm:flex-row sm:justify-end">
                {editingId && (
                  <Button type="button" variant="outline" onClick={onCancelEdit}>
                    Cancel Edit
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => submitTrip("draft")}>
                  {editingId ? "Update Draft" : "Save as Draft"}
                </Button>
                <Button type="submit" icon="send" disabled={!canDispatch}>
                  Dispatch Trip
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Live board */}
        <div className={cn("space-y-3", editable ? "lg:col-span-5" : "lg:col-span-12")}>
          <div className="flex items-center justify-between px-1">
            <h3 className="text-headline-md font-semibold text-on-surface">Live Board</h3>
            <span className="rounded bg-primary/10 px-2 py-1 font-label-sm text-label-sm font-bold tracking-wider text-primary">
              {activeCount} ACTIVE
            </span>
          </div>
          <div className={cn("space-y-3", !editable && "grid grid-cols-1 gap-3 space-y-0 md:grid-cols-2 xl:grid-cols-3")}>
            {boardTrips.length === 0 ? (
              <Card>
                <EmptyState icon="route" title="No active trips" description="Dispatched and draft trips will appear here." />
              </Card>
            ) : (
              boardTrips.map((t) => {
                const style = statusStyle(t.status);
                const v = vehicleById(t.vehicleId);
                const d = driverById(t.driverId);
                return (
                  <div key={t.id} className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                    <div className={cn("absolute left-0 top-0 h-full w-1", style.dot)} />
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <span className="rounded bg-primary/10 px-2 py-0.5 font-label-sm text-label-sm text-primary">
                          {t.code}
                        </span>
                        <h4 className="mt-2 font-medium text-on-surface">
                          {t.source} → {t.destination}
                        </h4>
                      </div>
                      <StatusBadge status={t.status} dot={false} />
                    </div>
                    <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <Icon name="local_shipping" size={15} />
                        {v?.registrationNo ?? "Unassigned"} / {d?.name.split(" ")[0] ?? "—"}
                      </span>
                      <span>{formatNumber(t.plannedKm)} km</span>
                    </div>

                      {editable && (
                      <div className="mt-4 flex gap-2 border-t border-outline-variant pt-3">
                        {t.status === "DRAFT" ? (
                          <>
                            <Button size="sm" icon="send" className="flex-1" onClick={() => onDispatchExisting(t.id)}>
                              Dispatch
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setDeleteId(t.id)}>
                              <Icon name="delete" size={16} />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" icon="check_circle" className="flex-1" onClick={() => openComplete(t)}>
                              Complete
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => setCancelId(t.id)}>
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* All trips table */}
      <Card>
        <div className="flex flex-col gap-3 border-b border-outline-variant p-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-headline-md font-semibold text-on-surface">All Trips</h3>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search trips…" className="pl-10" />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TripStatus | "all")} className="py-1.5">
              {STATUS_FILTER.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All Status" : s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={tableRows}
          rowKey={(t) => t.id}
          pageSize={10}
          empty={<EmptyState icon="route" title="No trips found" description="Create a trip to get started." />}
        />
      </Card>

      {/* Complete modal */}
      <Modal
        open={!!completing}
        onClose={() => setCompleting(null)}
        title="Complete Trip"
        description={completing ? `${completing.code} · ${completing.source} → ${completing.destination}` : ""}
        icon="check_circle"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setCompleting(null)}>
              Cancel
            </Button>
            <Button icon="check" onClick={submitComplete}>
              Complete Trip
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-body-md text-on-surface-variant">
            Enter the final odometer reading and fuel consumed. The vehicle and driver will be released back to
                <span className="text-emerald-600"> Available</span>.
          </p>
          <Field label="Final Odometer (km)">
            <Input type="number" value={endOdometer} onChange={(e) => setEndOdometer(Number(e.target.value))} />
          </Field>
          <Field label="Fuel Consumed (L)" hint="A fuel expense will be logged automatically.">
            <Input type="number" value={fuelLiters} onChange={(e) => setFuelLiters(Number(e.target.value))} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={onCancel}
        title="Cancel trip?"
        message="The assigned vehicle and driver (if any) will be released back to Available."
        confirmLabel="Cancel Trip"
        danger
        icon="block"
      />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={onDelete}
        title="Delete trip?"
        message="This permanently removes the trip record. This cannot be undone."
        confirmLabel="Delete"
        danger
        icon="delete"
      />
    </>
  );
}
