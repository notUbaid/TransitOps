import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSql } from "./_db";
import type { ApiRequest } from "./_types";

// ---- Domain types (mirrored from client for API use) ----

interface User { id: string; name: string; email: string; role: string; password: string; avatar?: string }
interface Vehicle { id: string; registrationNo: string; name: string; type: string; capacityKg: number; odometer: number; acquisitionCost: number; region: string; status: string; createdAt: string }
interface Driver { id: string; name: string; licenseNumber: string; category: string; licenseExpiry: string; phone: string; safetyScore: number; tripCompletionRate: number; status: string; createdAt: string }
interface Trip { id: string; code: string; source: string; destination: string; vehicleId: string | null; driverId: string | null; cargoKg: number; plannedKm: number; revenue: number; status: string; startOdometer: number | null; endOdometer: number | null; fuelLiters: number | null; note: string | null; createdAt: string; dispatchedAt: string | null; completedAt: string | null }
interface MaintenanceLog { id: string; vehicleId: string; serviceType: string; cost: number; serviceDate: string; status: string; notes: string | null; createdAt: string }
interface Expense { id: string; type: string; vehicleId: string | null; tripId: string | null; amount: number; date: string; liters: number | null; description: string; createdAt: string }
interface Settings { companyName: string; depotName: string; currency: string; distanceUnit: string; fuelPricePerLiter: number; maintenanceAlertKm: number; gstRate: number; contactEmail: string; contactPhone: string }
interface Database { users: User[]; vehicles: Vehicle[]; drivers: Driver[]; trips: Trip[]; maintenance: MaintenanceLog[]; expenses: Expense[]; settings: Settings }

interface RegisterInput { name: string; email: string; password: string; role: string }
interface CreateTripInput { source: string; destination: string; vehicleId: string | null; driverId: string | null; cargoKg: number; plannedKm: number; revenue: number; intent: "draft" | "dispatch" }
interface CompleteTripInput { endOdometer: number; fuelLiters: number }

// ---- Helpers ----

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function toCamel(r: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(r)) {
    out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return out;
}

function toSnake(r: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(r)) {
    out[k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)] = v;
  }
  return out;
}

function mapRows<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map((r) => toCamel(r) as unknown as T);
}

function mapRow<T>(row: Record<string, unknown> | undefined): T | null {
  return row ? (toCamel(row) as unknown as T) : null;
}

function now(): string {
  return new Date().toISOString();
}

function isExpired(dateStr: string): boolean {
  return new Date(dateStr).getTime() < Date.now();
}

// ---- Full DB fetch ----

async function fetchFullDb(sql: ReturnType<typeof getSql>): Promise<Database> {
  const [users, vehicles, drivers, trips, maintenance, expenses, settingsRows] = await Promise.all([
    sql`SELECT * FROM users ORDER BY id`,
    sql`SELECT * FROM vehicles ORDER BY created_at DESC`,
    sql`SELECT * FROM drivers ORDER BY created_at DESC`,
    sql`SELECT * FROM trips ORDER BY created_at DESC`,
    sql`SELECT * FROM maintenance ORDER BY created_at DESC`,
    sql`SELECT * FROM expenses ORDER BY created_at DESC`,
    sql`SELECT * FROM settings WHERE id = 1 LIMIT 1`,
  ]);

  return {
    users: mapRows<User>(users),
    vehicles: mapRows<Vehicle>(vehicles),
    drivers: mapRows<Driver>(drivers),
    trips: mapRows<Trip>(trips),
    maintenance: mapRows<MaintenanceLog>(maintenance),
    expenses: mapRows<Expense>(expenses),
    settings: (mapRow<Settings>(settingsRows[0]) ?? {
      companyName: "TransitOps Fleet Solutions",
      depotName: "Gandhinagar Depot G124",
      currency: "INR",
      distanceUnit: "km",
      fuelPricePerLiter: 104.5,
      maintenanceAlertKm: 5000,
      gstRate: 18,
      contactEmail: "support@transitops.in",
      contactPhone: "+91-79-4000-1234",
    }),
  };
}

async function returnFullDb(sql: ReturnType<typeof getSql>) {
  const db = await fetchFullDb(sql);
  return { ok: true, data: db };
}

// ---- Seed data ----

const SEED_USERS: User[] = [
  { id: "usr_1", name: "Meera Fernandes", email: "manager@transitops.in", role: "fleet_manager", password: "transit123" },
  { id: "usr_2", name: "Raven Khanna", email: "dispatcher@transitops.in", role: "dispatcher", password: "transit123" },
  { id: "usr_3", name: "Sana Sheikh", email: "safety@transitops.in", role: "safety_officer", password: "transit123" },
  { id: "usr_4", name: "Farhan Ali", email: "finance@transitops.in", role: "financial_analyst", password: "transit123" },
];

const SEED_VEHICLES: Omit<Vehicle, "id" | "status" | "createdAt">[] = [
  { registrationNo: "GJ-01-AB-1234", name: "Tata LPT 1618", type: "Truck", capacityKg: 16000, odometer: 71200, region: "Ahmedabad", acquisitionCost: 4500000 },
  { registrationNo: "GJ-01-CD-5678", name: "Ashok Leyland 1920", type: "Truck", capacityKg: 19000, odometer: 98450, region: "Vadodara", acquisitionCost: 5200000 },
  { registrationNo: "GJ-01-EF-9012", name: "Mahindra Bolero Pickup", type: "Pickup", capacityKg: 2500, odometer: 120300, region: "Ahmedabad", acquisitionCost: 800000 },
  { registrationNo: "GJ-01-GH-3456", name: "Tata Ace", type: "Mini Truck", capacityKg: 1500, odometer: 45600, region: "Surat", acquisitionCost: 550000 },
  { registrationNo: "GJ-01-IJ-7890", name: "Force Traveller", type: "Van", capacityKg: 3000, odometer: 156300, region: "Rajkot", acquisitionCost: 1200000 },
  { registrationNo: "GJ-01-KL-1111", name: "Eicher Pro 3015", type: "Truck", capacityKg: 30000, odometer: 88750, region: "Gandhinagar", acquisitionCost: 6800000 },
  { registrationNo: "GJ-01-MN-2222", name: "Mahindra Supro", type: "Van", capacityKg: 1500, odometer: 71020, region: "Bhavnagar", acquisitionCost: 750000 },
  { registrationNo: "GJ-01-OP-3333", name: "Tata 407", type: "Container", capacityKg: 7500, odometer: 52400, region: "Ahmedabad", acquisitionCost: 2200000 },
  { registrationNo: "GJ-01-QR-4444", name: "Ashok Leyland Dost", type: "Mini Truck", capacityKg: 2000, odometer: 88900, region: "Mehsana", acquisitionCost: 650000 },
  { registrationNo: "GJ-01-ST-5555", name: "BharatBenz 2823", type: "Container", capacityKg: 28000, odometer: 41250, region: "Vadodara", acquisitionCost: 7200000 },
];

const iso = (y: number, m: number, day: number) => new Date(y, m - 1, day, 9, 0, 0).toISOString();

const fromNow = (days: number) => {
  const d = new Date(); d.setHours(9, 0, 0, 0); d.setDate(d.getDate() + days); return d.toISOString();
};

// ---- Action handlers ----

async function handleRegisterUser(sql: ReturnType<typeof getSql>, payload: RegisterInput) {
  const name = payload.name.trim();
  const email = payload.email.trim().toLowerCase();
  if (!name) return { ok: false, error: "Full name is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (payload.password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };

  const existing = await sql`SELECT id FROM users WHERE LOWER(email) = ${email} LIMIT 1`;
  if (existing.length > 0) return { ok: false, error: "An account with this email already exists." };

  const user: User = { id: uid("usr"), name, email, password: payload.password, role: payload.role };
  await sql`INSERT INTO users ${sql(toSnake(user as unknown as Record<string, unknown>))}`;
  return { ok: true, data: user };
}

async function handleAddVehicle(sql: ReturnType<typeof getSql>, payload: Omit<Vehicle, "id" | "createdAt">) {
  const reg = payload.registrationNo.trim().toUpperCase();
  if (!reg) return { ok: false, error: "Registration number is required." };

  const existing = await sql`SELECT id FROM vehicles WHERE UPPER(registration_no) = ${reg} LIMIT 1`;
  if (existing.length > 0) return { ok: false, error: `Registration ${reg} already exists.` };

  const vehicle: Vehicle = { ...payload, registrationNo: reg, id: uid("veh"), createdAt: now() };
  await sql`INSERT INTO vehicles ${sql(toSnake(vehicle as unknown as Record<string, unknown>))}`;
  return { ok: true, data: vehicle };
}

async function handleUpdateVehicle(sql: ReturnType<typeof getSql>, id: string, patch: Partial<Vehicle>) {
  const rows = await sql`SELECT * FROM vehicles WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Vehicle not found." };

  if (patch.registrationNo) {
    const reg = patch.registrationNo.trim().toUpperCase();
    const dup = await sql`SELECT id FROM vehicles WHERE id != ${id} AND UPPER(registration_no) = ${reg} LIMIT 1`;
    if (dup.length > 0) return { ok: false, error: `Registration ${reg} already exists.` };
    patch.registrationNo = reg;
  }

  const existing = toCamel(rows[0]) as Vehicle;
  const updated = { ...existing, ...patch };
  const snake = toSnake(updated as unknown as Record<string, unknown>);
  delete snake.id;
  delete snake.created_at;

  const keys = Object.keys(snake);
  const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const values = Object.values(snake);

  await sql.unsafe(
    `UPDATE vehicles SET ${setClause} WHERE id = $1`,
    [id, ...values],
  );

  return { ok: true, data: updated };
}

async function handleDeleteVehicle(sql: ReturnType<typeof getSql>, id: string) {
  const rows = await sql`SELECT * FROM vehicles WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Vehicle not found." };
  const v = toCamel(rows[0]) as Vehicle;
  if (v.status === "ON_TRIP") return { ok: false, error: "Cannot delete a vehicle that is on a trip." };

  const activeTrip = await sql`SELECT id FROM trips WHERE vehicle_id = ${id} AND (status = 'DISPATCHED' OR status = 'DRAFT') LIMIT 1`;
  if (activeTrip.length > 0) return { ok: false, error: "Vehicle is linked to active/draft trips." };

  await sql`DELETE FROM vehicles WHERE id = ${id}`;
  return { ok: true };
}

async function handleAddDriver(sql: ReturnType<typeof getSql>, payload: Omit<Driver, "id" | "createdAt">) {
  const lic = payload.licenseNumber.trim().toUpperCase();
  if (!lic) return { ok: false, error: "License number is required." };

  const existing = await sql`SELECT id FROM drivers WHERE UPPER(license_number) = ${lic} LIMIT 1`;
  if (existing.length > 0) return { ok: false, error: `License ${lic} already exists.` };

  const driver: Driver = { ...payload, licenseNumber: lic, id: uid("drv"), createdAt: now() };
  await sql`INSERT INTO drivers ${sql(toSnake(driver as unknown as Record<string, unknown>))}`;
  return { ok: true, data: driver };
}

async function handleUpdateDriver(sql: ReturnType<typeof getSql>, id: string, patch: Partial<Driver>) {
  const rows = await sql`SELECT * FROM drivers WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Driver not found." };

  if (patch.licenseNumber) {
    const lic = patch.licenseNumber.trim().toUpperCase();
    const dup = await sql`SELECT id FROM drivers WHERE id != ${id} AND UPPER(license_number) = ${lic} LIMIT 1`;
    if (dup.length > 0) return { ok: false, error: `License ${lic} already exists.` };
    patch.licenseNumber = lic;
  }

  const existing = toCamel(rows[0]) as Driver;
  const updated = { ...existing, ...patch };
  const snake = toSnake(updated as unknown as Record<string, unknown>);
  delete snake.id;
  delete snake.created_at;

  const keys = Object.keys(snake);
  const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const values = Object.values(snake);

  await sql.unsafe(
    `UPDATE drivers SET ${setClause} WHERE id = $1`,
    [id, ...values],
  );

  return { ok: true, data: updated };
}

async function handleDeleteDriver(sql: ReturnType<typeof getSql>, id: string) {
  const rows = await sql`SELECT * FROM drivers WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Driver not found." };
  const d = toCamel(rows[0]) as Driver;
  if (d.status === "ON_TRIP") return { ok: false, error: "Cannot delete a driver that is on a trip." };

  await sql`DELETE FROM drivers WHERE id = ${id}`;
  return { ok: true };
}

async function handleCreateTrip(sql: ReturnType<typeof getSql>, payload: CreateTripInput) {
  if (!payload.source.trim() || !payload.destination.trim()) {
    return { ok: false, error: "Source and destination are required." };
  }
  if (payload.cargoKg <= 0) return { ok: false, error: "Cargo weight must be greater than zero." };

  let vehicle: Vehicle | null = null;
  if (payload.vehicleId) {
    const vRows = await sql`SELECT * FROM vehicles WHERE id = ${payload.vehicleId} LIMIT 1`;
    if (vRows.length > 0) vehicle = toCamel(vRows[0]) as Vehicle;
  }

  let driver: Driver | null = null;
  if (payload.driverId) {
    const dRows = await sql`SELECT * FROM drivers WHERE id = ${payload.driverId} LIMIT 1`;
    if (dRows.length > 0) driver = toCamel(dRows[0]) as Driver;
  }

  if (vehicle && payload.cargoKg > vehicle.capacityKg) {
    return { ok: false, error: `Capacity exceeded: cargo ${payload.cargoKg} kg > ${vehicle.capacityKg} kg limit on ${vehicle.registrationNo}.` };
  }

  if (payload.intent === "dispatch") {
    if (!vehicle) return { ok: false, error: "Select an available vehicle to dispatch." };
    if (!driver) return { ok: false, error: "Select an available driver to dispatch." };
    if (vehicle.status !== "AVAILABLE") return { ok: false, error: `${vehicle.registrationNo} is ${vehicle.status} and cannot be dispatched.` };
    if (driver.status !== "AVAILABLE" || isExpired(driver.licenseExpiry)) {
      const reason = isExpired(driver.licenseExpiry) ? "has an expired license" : `is ${driver.status}`;
      return { ok: false, error: `${driver.name} ${reason} and cannot be assigned.` };
    }
  }

  const tripCodeRow = await sql`SELECT code FROM trips WHERE code ~ 'TRIP-\\d+' ORDER BY code DESC LIMIT 1`;
  let nextNum = 1;
  if (tripCodeRow.length > 0) {
    const m = /TRIP-(\d+)/.exec(tripCodeRow[0].code as string);
    if (m) nextNum = Number(m[1]) + 1;
  }
  const code = `TRIP-${String(nextNum).padStart(3, "0")}`;

  const dispatching = payload.intent === "dispatch";
  const nowIso = now();
  const trip: Trip = {
    id: uid("trip"),
    code,
    source: payload.source.trim(),
    destination: payload.destination.trim(),
    vehicleId: payload.vehicleId,
    driverId: payload.driverId,
    cargoKg: payload.cargoKg,
    plannedKm: payload.plannedKm,
    revenue: payload.revenue,
    status: dispatching ? "DISPATCHED" : "DRAFT",
    startOdometer: dispatching && vehicle ? vehicle.odometer : null,
    endOdometer: null,
    fuelLiters: null,
    note: null,
    createdAt: nowIso,
    dispatchedAt: dispatching ? nowIso : null,
    completedAt: null,
  };

  await sql`INSERT INTO trips ${sql(toSnake(trip as unknown as Record<string, unknown>))}`;

  if (dispatching && vehicle) {
    await sql`UPDATE vehicles SET status = 'ON_TRIP' WHERE id = ${vehicle.id}`;
  }
  if (dispatching && driver) {
    await sql`UPDATE drivers SET status = 'ON_TRIP' WHERE id = ${driver.id}`;
  }

  return { ok: true, data: trip };
}

async function handleDispatchTrip(sql: ReturnType<typeof getSql>, id: string) {
  const rows = await sql`SELECT * FROM trips WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Trip not found." };
  const trip = toCamel(rows[0]) as Trip;
  if (trip.status !== "DRAFT") return { ok: false, error: "Only draft trips can be dispatched." };

  if (!trip.vehicleId) return { ok: false, error: "Assign an available vehicle before dispatching." };
  if (!trip.driverId) return { ok: false, error: "Assign an available driver before dispatching." };

  const vRows = await sql`SELECT * FROM vehicles WHERE id = ${trip.vehicleId} LIMIT 1`;
  if (vRows.length === 0) return { ok: false, error: "Assigned vehicle not found." };
  const vehicle = toCamel(vRows[0]) as Vehicle;
  if (vehicle.status !== "AVAILABLE") return { ok: false, error: `${vehicle.registrationNo} is ${vehicle.status} and cannot be dispatched.` };

  const dRows = await sql`SELECT * FROM drivers WHERE id = ${trip.driverId} LIMIT 1`;
  if (dRows.length === 0) return { ok: false, error: "Assigned driver not found." };
  const driver = toCamel(dRows[0]) as Driver;
  if (driver.status !== "AVAILABLE" || isExpired(driver.licenseExpiry)) {
    const reason = isExpired(driver.licenseExpiry) ? "has an expired license" : `is ${driver.status}`;
    return { ok: false, error: `${driver.name} ${reason} and cannot be assigned.` };
  }

  if (trip.cargoKg > vehicle.capacityKg) {
    return { ok: false, error: `Capacity exceeded on ${vehicle.registrationNo}.` };
  }

  const nowIso = now();
  await sql`UPDATE trips SET status = 'DISPATCHED', dispatched_at = ${nowIso}, start_odometer = ${vehicle.odometer} WHERE id = ${id}`;
  await sql`UPDATE vehicles SET status = 'ON_TRIP' WHERE id = ${trip.vehicleId}`;
  await sql`UPDATE drivers SET status = 'ON_TRIP' WHERE id = ${trip.driverId}`;

  const updated: Trip = { ...trip, status: "DISPATCHED", dispatchedAt: nowIso, startOdometer: vehicle.odometer };
  return { ok: true, data: updated };
}

async function handleCompleteTrip(sql: ReturnType<typeof getSql>, id: string, input: CompleteTripInput) {
  const rows = await sql`SELECT * FROM trips WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Trip not found." };
  const trip = toCamel(rows[0]) as Trip;
  if (trip.status !== "DISPATCHED") return { ok: false, error: "Only dispatched trips can be completed." };

  if (trip.vehicleId) {
    const vRows = await sql`SELECT * FROM vehicles WHERE id = ${trip.vehicleId} LIMIT 1`;
    if (vRows.length > 0) {
      const vehicle = toCamel(vRows[0]) as Vehicle;
      if (input.endOdometer < (trip.startOdometer ?? vehicle.odometer)) {
        return { ok: false, error: "Final odometer must be greater than the start odometer." };
      }
    }
  }

  const nowIso = now();
  await sql`UPDATE trips SET status = 'COMPLETED', completed_at = ${nowIso}, end_odometer = ${input.endOdometer}, fuel_liters = ${input.fuelLiters} WHERE id = ${id}`;

  if (trip.vehicleId) {
    await sql`UPDATE vehicles SET status = CASE WHEN status = 'RETIRED' THEN status ELSE 'AVAILABLE' END, odometer = GREATEST(odometer, ${input.endOdometer}) WHERE id = ${trip.vehicleId}`;
  }
  if (trip.driverId) {
    await sql`UPDATE drivers SET status = 'AVAILABLE' WHERE id = ${trip.driverId} AND status = 'ON_TRIP'`;
  }

  if (input.fuelLiters > 0) {
    const settingsRows = await sql`SELECT * FROM settings WHERE id = 1 LIMIT 1`;
    const settings = mapRow<Settings>(settingsRows[0]) ?? { fuelPricePerLiter: 104.5 } as Settings;
    const expense: Expense = {
      id: uid("exp"),
      type: "FUEL",
      vehicleId: trip.vehicleId,
      tripId: trip.id,
      amount: Math.round(input.fuelLiters * settings.fuelPricePerLiter),
      date: nowIso,
      liters: input.fuelLiters,
      description: `Fuel for ${trip.source} to ${trip.destination}`,
      createdAt: nowIso,
    };
    await sql`INSERT INTO expenses ${sql(toSnake(expense as unknown as Record<string, unknown>))}`;
  }

  const updated: Trip = { ...trip, status: "COMPLETED", completedAt: nowIso, endOdometer: input.endOdometer, fuelLiters: input.fuelLiters };
  return { ok: true, data: updated };
}

async function handleCancelTrip(sql: ReturnType<typeof getSql>, id: string, note?: string) {
  const rows = await sql`SELECT * FROM trips WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Trip not found." };
  const trip = toCamel(rows[0]) as Trip;
  if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
    return { ok: false, error: "This trip can no longer be cancelled." };
  }

  const wasDispatched = trip.status === "DISPATCHED";
  await sql`UPDATE trips SET status = 'CANCELLED', note = ${note ?? trip.note} WHERE id = ${id}`;

  if (wasDispatched) {
    if (trip.vehicleId) {
      await sql`UPDATE vehicles SET status = 'AVAILABLE' WHERE id = ${trip.vehicleId} AND status = 'ON_TRIP'`;
    }
    if (trip.driverId) {
      await sql`UPDATE drivers SET status = 'AVAILABLE' WHERE id = ${trip.driverId} AND status = 'ON_TRIP'`;
    }
  }

  const updated: Trip = { ...trip, status: "CANCELLED", note: note ?? trip.note };
  return { ok: true, data: updated };
}

async function handleDeleteTrip(sql: ReturnType<typeof getSql>, id: string) {
  const rows = await sql`SELECT * FROM trips WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Trip not found." };
  const trip = toCamel(rows[0]) as Trip;
  if (trip.status === "DISPATCHED") return { ok: false, error: "Cancel the trip before deleting it." };

  await sql`DELETE FROM trips WHERE id = ${id}`;
  return { ok: true };
}

async function handleAddMaintenance(sql: ReturnType<typeof getSql>, payload: Omit<MaintenanceLog, "id" | "createdAt">) {
  const vRows = await sql`SELECT * FROM vehicles WHERE id = ${payload.vehicleId} LIMIT 1`;
  if (vRows.length === 0) return { ok: false, error: "Select a vehicle for the maintenance log." };
  const vehicle = toCamel(vRows[0]) as Vehicle;
  if (vehicle.status === "ON_TRIP") return { ok: false, error: `${vehicle.registrationNo} is on a trip. Complete the trip first.` };
  if (vehicle.status === "RETIRED") return { ok: false, error: `${vehicle.registrationNo} is retired.` };

  const log: MaintenanceLog = { ...payload, id: uid("mnt"), createdAt: now() };
  await sql`INSERT INTO maintenance ${sql(toSnake(log as unknown as Record<string, unknown>))}`;

  if (payload.status === "ACTIVE") {
    await sql`UPDATE vehicles SET status = 'IN_SHOP' WHERE id = ${payload.vehicleId}`;
  }

  return { ok: true, data: log };
}

async function handleCompleteMaintenance(sql: ReturnType<typeof getSql>, id: string) {
  const rows = await sql`SELECT * FROM maintenance WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Maintenance log not found." };
  const log = toCamel(rows[0]) as MaintenanceLog;
  if (log.status === "COMPLETED") return { ok: false, error: "This log is already completed." };

  await sql`UPDATE maintenance SET status = 'COMPLETED' WHERE id = ${id}`;

  const stillActive = await sql`SELECT id FROM maintenance WHERE id != ${id} AND vehicle_id = ${log.vehicleId} AND status = 'ACTIVE' LIMIT 1`;
  if (stillActive.length === 0) {
    await sql`UPDATE vehicles SET status = 'AVAILABLE' WHERE id = ${log.vehicleId} AND status = 'IN_SHOP'`;
  }

  const updated: MaintenanceLog = { ...log, status: "COMPLETED" };
  return { ok: true, data: updated };
}

async function handleDeleteMaintenance(sql: ReturnType<typeof getSql>, id: string) {
  const rows = await sql`SELECT * FROM maintenance WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Maintenance log not found." };
  const log = toCamel(rows[0]) as MaintenanceLog;

  if (log.status === "ACTIVE") {
    const stillActive = await sql`SELECT id FROM maintenance WHERE id != ${id} AND vehicle_id = ${log.vehicleId} AND status = 'ACTIVE' LIMIT 1`;
    if (stillActive.length === 0) {
      await sql`UPDATE vehicles SET status = 'AVAILABLE' WHERE id = ${log.vehicleId} AND status = 'IN_SHOP'`;
    }
  }

  await sql`DELETE FROM maintenance WHERE id = ${id}`;
  return { ok: true };
}

async function handleAddExpense(sql: ReturnType<typeof getSql>, payload: Omit<Expense, "id" | "createdAt">) {
  if (payload.amount <= 0) return { ok: false, error: "Amount must be greater than zero." };
  const expense: Expense = { ...payload, id: uid("exp"), createdAt: now() };
  await sql`INSERT INTO expenses ${sql(toSnake(expense as unknown as Record<string, unknown>))}`;
  return { ok: true, data: expense };
}

async function handleDeleteExpense(sql: ReturnType<typeof getSql>, id: string) {
  const rows = await sql`SELECT id FROM expenses WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Expense not found." };
  await sql`DELETE FROM expenses WHERE id = ${id}`;
  return { ok: true };
}

async function handleUpdateSettings(sql: ReturnType<typeof getSql>, payload: Partial<Settings>) {
  const snake = toSnake(payload as unknown as Record<string, unknown>);
  if (Object.keys(snake).length === 0) return { ok: false, error: "No settings to update." };

  const keys = Object.keys(snake);
  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = Object.values(snake);

  await sql.unsafe(
    `UPDATE settings SET ${setClause} WHERE id = 1`,
    values,
  );

  const settingsRows = await sql`SELECT * FROM settings WHERE id = 1 LIMIT 1`;
  const settings = mapRow<Settings>(settingsRows[0])!;
  return { ok: true, data: settings };
}

async function handleResetDemoData(sql: ReturnType<typeof getSql>) {
  // Clear all tables
  await sql`DELETE FROM expenses`;
  await sql`DELETE FROM maintenance`;
  await sql`DELETE FROM trips`;
  await sql`DELETE FROM drivers`;
  await sql`DELETE FROM vehicles`;
  await sql`DELETE FROM users`;
  await sql`UPDATE settings SET company_name = 'TransitOps Fleet Solutions', depot_name = 'Gandhinagar Depot G124', currency = 'INR', distance_unit = 'km', fuel_price_per_liter = 104.5, maintenance_alert_km = 5000, gst_rate = 18, contact_email = 'support@transitops.in', contact_phone = '+91-79-4000-1234' WHERE id = 1`;

  // Insert seed users
  for (const u of SEED_USERS) {
    await sql`INSERT INTO users ${sql(toSnake(u as unknown as Record<string, unknown>))}`;
  }

  // Build vehicles with status derivations
  const vehicles: Vehicle[] = SEED_VEHICLES.map((v, i) => ({
    ...v,
    id: `veh_${i + 1}`,
    status: "AVAILABLE",
    createdAt: iso(2025, 1, 10),
  }));

  for (const v of vehicles) {
    await sql`INSERT INTO vehicles ${sql(toSnake(v as unknown as Record<string, unknown>))}`;
  }

  // Seed drivers
  const rawDrivers: (Omit<Driver, "id" | "status" | "createdAt"> & { status?: string })[] = [
    { name: "Rajesh Patel", licenseNumber: "GJ-01-2025-00001", category: "Heavy", licenseExpiry: iso(2027, 6, 30), phone: "9876543210", safetyScore: 92, tripCompletionRate: 97 },
    { name: "Suresh Sharma", licenseNumber: "GJ-01-2025-00002", category: "Heavy", licenseExpiry: iso(2027, 8, 15), phone: "9876543211", safetyScore: 88, tripCompletionRate: 95 },
    { name: "Amit Singh", licenseNumber: "GJ-01-2025-00003", category: "Light", licenseExpiry: iso(2028, 3, 20), phone: "9876543212", safetyScore: 79, tripCompletionRate: 90, status: "OFF_DUTY" },
    { name: "Deepak Verma", licenseNumber: "GJ-01-2025-00004", category: "Heavy", licenseExpiry: fromNow(18), phone: "9876543213", safetyScore: 84, tripCompletionRate: 93 },
    { name: "Manoj Yadav", licenseNumber: "GJ-01-2025-00005", category: "Medium", licenseExpiry: iso(2027, 5, 5), phone: "9876543214", safetyScore: 61, tripCompletionRate: 82, status: "SUSPENDED" },
    { name: "Vijay Deshmukh", licenseNumber: "GJ-01-2025-00006", category: "Heavy", licenseExpiry: iso(2026, 9, 25), phone: "9876543215", safetyScore: 90, tripCompletionRate: 96 },
    { name: "Kiran Joshi", licenseNumber: "GJ-01-2025-00007", category: "Medium", licenseExpiry: iso(2028, 1, 12), phone: "9876543216", safetyScore: 87, tripCompletionRate: 94 },
    { name: "Prakash Rao", licenseNumber: "GJ-01-2025-00008", category: "Light", licenseExpiry: iso(2027, 11, 3), phone: "9876543217", safetyScore: 81, tripCompletionRate: 91 },
  ];

  const drivers: Driver[] = rawDrivers.map((d, i) => ({
    id: `drv_${i + 1}`,
    name: d.name,
    licenseNumber: d.licenseNumber,
    category: d.category,
    licenseExpiry: d.licenseExpiry,
    phone: d.phone,
    safetyScore: d.safetyScore,
    tripCompletionRate: d.tripCompletionRate,
    status: d.status ?? "AVAILABLE",
    createdAt: iso(2025, 1, 12),
  }));

  for (const d of drivers) {
    await sql`INSERT INTO drivers ${sql(toSnake(d as unknown as Record<string, unknown>))}`;
  }

  // Seed trips
  interface RawTrip { code?: string; source: string; destination: string; cargoKg: number; plannedKm: number; revenue: number; status: string; vi?: number; di?: number; so?: number; eo?: number; fl?: number; note?: string; da?: string; ca?: string }
  const rawTrips: RawTrip[] = [
    { code: "TRIP-001", source: "Ahmedabad", destination: "Vadodara", cargoKg: 12000, plannedKm: 110, revenue: 15000, status: "COMPLETED", vi: 0, di: 0, so: 12500, eo: 12610, fl: 35, da: iso(2025, 6, 1), ca: iso(2025, 6, 1) },
    { code: "TRIP-002", source: "Surat", destination: "Rajkot", cargoKg: 18000, plannedKm: 280, revenue: 32000, status: "COMPLETED", vi: 1, di: 1, so: 34500, eo: 34780, fl: 90, da: iso(2025, 6, 3), ca: iso(2025, 6, 4) },
    { code: "TRIP-003", source: "Ahmedabad", destination: "Mehsana", cargoKg: 2000, plannedKm: 60, revenue: 5000, status: "COMPLETED", vi: 2, di: 2, so: 8200, eo: 8260, fl: 12, da: iso(2025, 6, 5), ca: iso(2025, 6, 5) },
    { code: "TRIP-004", source: "Vadodara", destination: "Surat", cargoKg: 1000, plannedKm: 150, revenue: 8000, status: "COMPLETED", vi: 3, di: 3, so: 15000, eo: 15150, fl: 28, da: iso(2025, 7, 7), ca: iso(2025, 7, 7) },
    { code: "TRIP-005", source: "Rajkot", destination: "Bhavnagar", cargoKg: 2500, plannedKm: 170, revenue: 12000, status: "COMPLETED", vi: 4, di: 4, so: 22000, eo: 22170, fl: 35, da: iso(2025, 6, 10), ca: iso(2025, 6, 10) },
    { code: "TRIP-006", source: "Vadodara", destination: "Anand", cargoKg: 16000, plannedKm: 40, revenue: 7000, status: "COMPLETED", vi: 0, di: 0, so: 12610, eo: 12650, fl: 14, da: iso(2025, 6, 15), ca: iso(2025, 6, 15) },
    { code: "TRIP-007", source: "Ahmedabad", destination: "Rajkot", cargoKg: 20000, plannedKm: 200, revenue: 28000, status: "COMPLETED", vi: 5, di: 5, so: 5100, eo: 5300, fl: 65, da: iso(2025, 6, 20), ca: iso(2025, 6, 21) },
    { code: "TRIP-008", source: "Gandhinagar", destination: "Surat", cargoKg: 5000, plannedKm: 220, revenue: 18000, status: "COMPLETED", vi: 8, di: 2, so: 1800, eo: 2020, fl: 55, da: iso(2025, 7, 5), ca: iso(2025, 7, 5) },
    { source: "Gandhinagar", destination: "Mehsana", cargoKg: 28000, plannedKm: 65, revenue: 18000, status: "DISPATCHED", vi: 9, di: 1, so: 41250, fl: 40, da: fromNow(-2) },
    { source: "Ahmedabad", destination: "Surat", cargoKg: 6000, plannedKm: 280, revenue: 22000, status: "DISPATCHED", vi: 7, di: 0, so: 52400, fl: 75, da: fromNow(-1) },
    { source: "Bhavnagar", destination: "Rajkot", cargoKg: 22000, plannedKm: 170, revenue: 20000, status: "DISPATCHED", vi: 5, di: 5, so: 88750, fl: 50, da: fromNow(0) },
    { source: "Bhavnagar", destination: "Vadodara", cargoKg: 1500, plannedKm: 190, revenue: 10000, status: "DRAFT", vi: 6 },
    { source: "Mehsana", destination: "Ahmedabad", cargoKg: 1800, plannedKm: 60, revenue: 4500, status: "DRAFT", vi: 8 },
    { source: "Anand", destination: "Nadiad", cargoKg: 3500, plannedKm: 30, revenue: 3000, status: "DRAFT" },
    { source: "Nadiad", destination: "Ahmedabad", cargoKg: 500, plannedKm: 45, revenue: 2500, status: "DRAFT" },
    { source: "Ahmedabad", destination: "Bharuch", cargoKg: 15000, plannedKm: 200, revenue: 25000, status: "CANCELLED", vi: 0, di: 1, note: "Customer cancelled the order", da: iso(2025, 6, 25) },
    { source: "Surat", destination: "Vadodara", cargoKg: 2500, plannedKm: 150, revenue: 9000, status: "CANCELLED", vi: 4, di: 4, note: "Vehicle breakdown before departure", da: iso(2025, 7, 2) },
  ];

  const trips: Trip[] = [];
  let tripSeq = 0;
  for (const t of rawTrips) {
    tripSeq += 1;
    const c = t.code ?? `TRIP-${String(tripSeq).padStart(3, "0")}`;
    const trip: Trip = {
      id: `trip_${tripSeq}`,
      code: c,
      source: t.source,
      destination: t.destination,
      vehicleId: t.vi != null ? vehicles[t.vi].id : null,
      driverId: t.di != null ? drivers[t.di].id : null,
      cargoKg: t.cargoKg,
      plannedKm: t.plannedKm,
      revenue: t.revenue,
      status: t.status,
      startOdometer: t.so ?? null,
      endOdometer: t.eo ?? null,
      fuelLiters: t.fl ?? null,
      note: t.note ?? null,
      createdAt: t.da ?? nowIso,
      dispatchedAt: (t.status === "DISPATCHED" || t.status === "COMPLETED") ? (t.da ?? null) : null,
      completedAt: t.ca ?? null,
    };
    trips.push(trip);
  }

  for (const t of trips) {
    await sql`INSERT INTO trips ${sql(toSnake(t as unknown as Record<string, unknown>))}`;
  }

  // Seed maintenance
  interface RawMaint { vi: number; serviceType: string; cost: number; date: string; status: string; notes: string }
  const rawMaint: RawMaint[] = [
    { vi: 0, serviceType: "Oil Change", cost: 3500, date: iso(2025, 5, 15), status: "COMPLETED", notes: "Regular oil change and filter replacement" },
    { vi: 1, serviceType: "Brake Service", cost: 4500, date: iso(2025, 5, 20), status: "COMPLETED", notes: "Brake pad replacement and fluid top-up" },
    { vi: 2, serviceType: "Tire Replacement", cost: 8000, date: iso(2025, 6, 1), status: "COMPLETED", notes: "All 4 tires replaced" },
    { vi: 0, serviceType: "Full Service", cost: 12000, date: iso(2025, 6, 10), status: "COMPLETED", notes: "60,000 km full service" },
    { vi: 8, serviceType: "Wheel Alignment", cost: 1500, date: iso(2025, 7, 12), status: "COMPLETED", notes: "Front wheel alignment and balancing" },
    { vi: 3, serviceType: "Engine Tune-up", cost: 6000, date: fromNow(-3), status: "ACTIVE", notes: "Scheduled engine tune-up" },
    { vi: 6, serviceType: "Battery Replacement", cost: 3500, date: fromNow(-1), status: "ACTIVE", notes: "Battery health degraded - replacement needed" },
    { vi: 1, serviceType: "Gearbox Repair", cost: 15000, date: fromNow(-5), status: "ACTIVE", notes: "Gearbox overhaul in progress - awaiting parts" },
  ];

  for (let i = 0; i < rawMaint.length; i++) {
    const m = rawMaint[i];
    const log: MaintenanceLog = {
      id: `mnt_${i + 1}`,
      vehicleId: vehicles[m.vi].id,
      serviceType: m.serviceType,
      cost: m.cost,
      serviceDate: m.date,
      status: m.status,
      notes: m.notes,
      createdAt: m.date,
    };
    await sql`INSERT INTO maintenance ${sql(toSnake(log as unknown as Record<string, unknown>))}`;
  }

  // Seed expenses
  interface RawExpense { type: string; vi?: number; ti?: number; amount: number; date: string; liters?: number; description: string }
  const rawExpenses: RawExpense[] = [
    { type: "FUEL", vi: 0, ti: 0, amount: 3640, date: iso(2025, 6, 1), liters: 35, description: "Fuel for Ahmedabad to Vadodara" },
    { type: "TOLL", vi: 0, ti: 0, amount: 500, date: iso(2025, 6, 1), description: "Toll charges NH-48" },
    { type: "FUEL", vi: 1, ti: 1, amount: 9360, date: iso(2025, 6, 3), liters: 90, description: "Fuel for Surat to Rajkot" },
    { type: "TOLL", vi: 1, ti: 1, amount: 1200, date: iso(2025, 6, 3), description: "Toll charges NH-27" },
    { type: "FUEL", vi: 2, ti: 2, amount: 1248, date: iso(2025, 6, 5), liters: 12, description: "Fuel for Ahmedabad to Mehsana" },
    { type: "TOLL", vi: 2, ti: 2, amount: 200, date: iso(2025, 6, 5), description: "Toll charges Ahmedabad-Mehsana road" },
    { type: "FUEL", vi: 3, ti: 3, amount: 2912, date: iso(2025, 7, 7), liters: 28, description: "Fuel for Vadodara to Surat" },
    { type: "TOLL", vi: 3, ti: 3, amount: 800, date: iso(2025, 7, 7), description: "Toll charges Vadodara-Surat expressway" },
    { type: "FUEL", vi: 4, ti: 4, amount: 3640, date: iso(2025, 6, 10), liters: 35, description: "Fuel for Rajkot to Bhavnagar" },
    { type: "FUEL", vi: 0, ti: 5, amount: 1456, date: iso(2025, 6, 15), liters: 14, description: "Fuel for Vadodara to Anand" },
    { type: "FUEL", vi: 5, ti: 6, amount: 6760, date: iso(2025, 6, 20), liters: 65, description: "Fuel for Ahmedabad to Rajkot" },
    { type: "TOLL", vi: 5, ti: 6, amount: 900, date: iso(2025, 6, 20), description: "Toll charges Ahmedabad-Rajkot highway" },
    { type: "FUEL", vi: 8, ti: 7, amount: 5720, date: iso(2025, 7, 5), liters: 55, description: "Fuel for Gandhinagar to Surat" },
    { type: "TOLL", vi: 8, ti: 7, amount: 1000, date: iso(2025, 7, 5), description: "Toll charges NE-1 expressway" },
    { type: "MAINTENANCE", vi: 0, amount: 8500, date: iso(2025, 5, 20), description: "Engine repair and servicing" },
    { type: "MAINTENANCE", vi: 1, amount: 3200, date: iso(2025, 5, 22), description: "Brake pad replacement" },
    { type: "OTHER", vi: 2, amount: 500, date: iso(2025, 6, 8), description: "Vehicle cleaning and detailing" },
    { type: "OTHER", vi: 4, amount: 15000, date: iso(2025, 6, 1), description: "Annual insurance premium" },
    { type: "OTHER", vi: 6, amount: 200, date: iso(2025, 6, 15), description: "Parking charges at Bhavnagar depot" },
    { type: "TOLL", vi: 9, amount: 3000, date: iso(2025, 7, 1), description: "Monthly toll pass" },
  ];

  for (let i = 0; i < rawExpenses.length; i++) {
    const e = rawExpenses[i];
    const expense: Expense = {
      id: `exp_${i + 1}`,
      type: e.type,
      vehicleId: e.vi != null ? vehicles[e.vi].id : null,
      tripId: e.ti != null ? trips[e.ti].id : null,
      amount: e.amount,
      date: e.date,
      liters: e.liters ?? null,
      description: e.description,
      createdAt: e.date,
    };
    await sql`INSERT INTO expenses ${sql(toSnake(expense as unknown as Record<string, unknown>))}`;
  }

  // Derive statuses for active maintenance and dispatched trips
  for (const m of rawMaint) {
    if (m.status === "ACTIVE") {
      await sql`UPDATE vehicles SET status = 'IN_SHOP' WHERE id = ${vehicles[m.vi].id} AND status != 'RETIRED'`;
    }
  }
  for (const t of trips) {
    if (t.status === "DISPATCHED" && t.vehicleId) {
      await sql`UPDATE vehicles SET status = 'ON_TRIP' WHERE id = ${t.vehicleId}`;
    }
    if (t.status === "DISPATCHED" && t.driverId) {
      await sql`UPDATE drivers SET status = 'ON_TRIP' WHERE id = ${t.driverId}`;
    }
  }
  // Retire the Bolero Pickup
  const retiredId = vehicles.find((v) => v.registrationNo === "GJ-01-EF-9012")?.id;
  if (retiredId) {
    await sql`UPDATE vehicles SET status = 'RETIRED' WHERE id = ${retiredId} AND status = 'AVAILABLE'`;
  }

  return { ok: true };
}

// ---- Dispatcher ----

type Handler = (sql: ReturnType<typeof getSql>, payload: unknown) => Promise<{ ok: boolean; data?: unknown; error?: string }>;

const handlers: Record<string, Handler> = {
  getDb: async (sql) => returnFullDb(sql),
  registerUser: async (sql, p) => handleRegisterUser(sql, p as RegisterInput),
  addVehicle: async (sql, p) => handleAddVehicle(sql, p as Omit<Vehicle, "id" | "createdAt">),
  updateVehicle: async (sql, p) => {
    const { id, ...patch } = p as { id: string } & Partial<Vehicle>;
    return handleUpdateVehicle(sql, id, patch);
  },
  deleteVehicle: async (sql, p) => handleDeleteVehicle(sql, p as string),
  addDriver: async (sql, p) => handleAddDriver(sql, p as Omit<Driver, "id" | "createdAt">),
  updateDriver: async (sql, p) => {
    const { id, ...patch } = p as { id: string } & Partial<Driver>;
    return handleUpdateDriver(sql, id, patch);
  },
  deleteDriver: async (sql, p) => handleDeleteDriver(sql, p as string),
  createTrip: async (sql, p) => handleCreateTrip(sql, p as CreateTripInput),
  dispatchTrip: async (sql, p) => handleDispatchTrip(sql, p as string),
  completeTrip: async (sql, p) => {
    const { id, ...input } = p as { id: string } & CompleteTripInput;
    return handleCompleteTrip(sql, id, input);
  },
  cancelTrip: async (sql, p) => {
    const { id, note } = p as { id: string; note?: string };
    return handleCancelTrip(sql, id, note);
  },
  deleteTrip: async (sql, p) => handleDeleteTrip(sql, p as string),
  addMaintenance: async (sql, p) => handleAddMaintenance(sql, p as Omit<MaintenanceLog, "id" | "createdAt">),
  completeMaintenance: async (sql, p) => handleCompleteMaintenance(sql, p as string),
  deleteMaintenance: async (sql, p) => handleDeleteMaintenance(sql, p as string),
  addExpense: async (sql, p) => handleAddExpense(sql, p as Omit<Expense, "id" | "createdAt">),
  deleteExpense: async (sql, p) => handleDeleteExpense(sql, p as string),
  updateSettings: async (sql, p) => handleUpdateSettings(sql, p as Partial<Settings>),
  resetDemoData: async (sql) => handleResetDemoData(sql),
};

// ---- Entry point ----

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS for Vercel deployments
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    if (req.method === "GET") {
      const sql = getSql();
      const result = await returnFullDb(sql);
      return res.json(result);
    }

    if (req.method === "POST") {
      const body = req.body as ApiRequest;
      if (!body?.action) {
        return res.status(400).json({ ok: false, error: "Missing action field." });
      }

      const handlerFn = handlers[body.action];
      if (!handlerFn) {
        return res.status(400).json({ ok: false, error: `Unknown action: ${body.action}` });
      }

      const sql = getSql();
      const result = await handlerFn(sql, body.payload);

      if (result.ok) {
        // Return full DB alongside action result so the client can sync
        const db = await fetchFullDb(sql);
        return res.json({ ok: true, data: result.data, db });
      }

      return res.json(result);
    }

    return res.status(405).json({ ok: false, error: "Method not allowed. Use GET or POST." });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("API error:", err);
    return res.status(500).json({ ok: false, error: msg });
  }
}
