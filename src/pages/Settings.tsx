import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { access, RBAC_MATRIX_COLUMNS } from "@/lib/rbac";
import { ROLE_LABELS, ROLE_TAGLINES, ROLES, type Settings as SettingsType } from "@/lib/types";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export function Settings() {
  const { db, updateSettings, resetDemoData } = useStore();
  const { canEdit, user } = useAuth();
  const toast = useToast();
  const editable = canEdit("settings");

  const [form, setForm] = useState<SettingsType>(db.settings);
  const [resetOpen, setResetOpen] = useState(false);

  // Sync form when db.settings changes (e.g. after demo reset)
  useEffect(() => {
    setForm(db.settings);
  }, [db.settings]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(form);
    toast.success("Settings saved.");
  };

  const onReset = async () => {
    await resetDemoData();
    setForm({ ...db.settings });
    toast.success("Demo data restored.");
  };

  return (
    <>
      <PageHeader
        title="Platform Settings"
        subtitle="Operational preferences and role-based access configuration."
        icon="settings"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* General settings */}
        <Card className="p-5 lg:p-6">
          <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
            <Icon name="tune" className="text-primary" size={20} />
            <h3 className="text-headline-md font-semibold text-on-surface">General</h3>
          </div>
          <form onSubmit={save} className="space-y-4">
            <Field label="Company Name">
              <Input value={form.companyName} disabled={!editable} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </Field>
            <Field label="Depot Name">
              <Input value={form.depotName} disabled={!editable} onChange={(e) => setForm({ ...form, depotName: e.target.value })} />
            </Field>
            <Field label="Currency">
              <Select value={form.currency} disabled={!editable} onChange={(e) => setForm({ ...form, currency: e.target.value as SettingsType["currency"] })}>
                <option value="INR">INR (₹) — Indian Rupee</option>
                <option value="USD">USD ($) — US Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
              </Select>
            </Field>
            <Field label="Distance Unit">
              <div className="flex gap-2">
                {(["km", "mi"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    disabled={!editable}
                    onClick={() => setForm({ ...form, distanceUnit: u })}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 font-label-md text-label-md transition-colors disabled:opacity-60",
                      form.distanceUnit === u
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-white/10 text-on-surface-variant hover:text-on-surface",
                    )}
                  >
                    {u === "km" ? "Kilometers" : "Miles"}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fuel Price / L">
                <Input type="number" min={0} step="0.01" disabled={!editable} value={form.fuelPricePerLiter} onChange={(e) => setForm({ ...form, fuelPricePerLiter: Number(e.target.value) })} />
              </Field>
              <Field label="Service Alert (km)">
                <Input type="number" min={0} disabled={!editable} value={form.maintenanceAlertKm} onChange={(e) => setForm({ ...form, maintenanceAlertKm: Number(e.target.value) })} />
              </Field>
            </div>
            <Field label="GST Rate (%)">
              <Input type="number" min={0} max={100} step="0.1" disabled={!editable} value={form.gstRate} onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value) })} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Contact Email">
                <Input type="email" disabled={!editable} value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="ops@company.com" />
              </Field>
              <Field label="Contact Phone">
                <Input type="tel" disabled={!editable} value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+91 98765 43210" />
              </Field>
            </div>
            {editable && (
              <Button type="submit" icon="save" className="w-full">
                Save Changes
              </Button>
            )}
          </form>
        </Card>

        {/* RBAC matrix */}
        <Card className="p-5 lg:col-span-2 lg:p-6">
          <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
            <Icon name="shield_person" className="text-tertiary" size={20} />
            <h3 className="text-headline-md font-semibold text-on-surface">Role-Based Access Control</h3>
          </div>
          <p className="mb-4 text-body-md text-on-surface-variant">
            Permissions for system modules across organizational roles. This matrix is enforced across navigation, routes, and every action.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-high/50 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  <th className="rounded-l-lg px-3 py-3 font-medium">Role</th>
                  {RBAC_MATRIX_COLUMNS.map((c, i) => (
                    <th key={c.key} className={cn("px-3 py-3 text-center font-medium", i === RBAC_MATRIX_COLUMNS.length - 1 && "rounded-r-lg")}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ROLES.map((role) => (
                  <tr key={role} className="transition-colors hover:bg-primary/5">
                    <td className="px-3 py-3">
                      <p className={cn("font-medium", role === user?.role ? "text-primary" : "text-on-surface")}>
                        {ROLE_LABELS[role]}
                        {role === user?.role && <span className="ml-2 font-label-sm text-label-sm text-primary">(you)</span>}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">{ROLE_TAGLINES[role]}</p>
                    </td>
                    {RBAC_MATRIX_COLUMNS.map((c) => {
                      const a = access(role, c.key);
                      return (
                        <td key={c.key} className="px-3 py-3 text-center">
                          {a === "full" ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-primary">
                              <Icon name="check" size={16} />
                            </span>
                          ) : a === "read" ? (
                            <span className="rounded bg-secondary-container/40 px-2 py-0.5 font-label-sm text-label-sm text-secondary">View</span>
                          ) : (
                            <span className="text-on-surface-variant/40">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Demo reset */}
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-error/20 bg-error/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-body-md font-semibold text-on-surface">Reset demo data</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Restore the original seeded fleet, drivers, trips, and expenses.
              </p>
            </div>
            <Button variant="danger" icon="restart_alt" onClick={() => setResetOpen(true)}>
              Reset Data
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={onReset}
        title="Reset demo data?"
        message="All local changes will be discarded and the original seed data restored."
        confirmLabel="Reset"
        danger
        icon="restart_alt"
      />
    </>
  );
}
