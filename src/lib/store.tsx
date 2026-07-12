import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ActionResult,
  Database,
  Driver,
  Expense,
  MaintenanceLog,
  Role,
  Settings,
  Trip,
  User,
  Vehicle,
} from "./types";
import { buildSeedDatabase } from "./seed";
import { isExpired } from "./format";
import { uid } from "./utils";

const STORAGE_KEY = "transitops_db_v1";

// ---- persistence ----
function loadDatabase(): Database {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Database;
      if (parsed && parsed.vehicles && parsed.users && parsed.settings) {
        return parsed;
      }
    }
  } catch {
    /* fall through to seed */
  }
  return buildSeedDatabase();
}

function saveDatabase(db: Database) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* ignore quota errors */
  }
}

// ---- eligibility helpers (shared by validation + dropdowns) ----
export function isVehicleDispatchable(v: Vehicle): boolean {
  return v.status === "AVAILABLE";
}
export function isDriverDispatchable(d: Driver): boolean {
  return d.status === "AVAILABLE" && !isExpired(d.licenseExpiry);
}

export interface CreateTripInput {
  source: string;
  destination: string;
  vehicleId: string | null;
  driverId: string | null;
  cargoKg: number;
  plannedKm: number;
  revenue: number;
  intent: "draft" | "dispatch";
}

export interface CompleteTripInput {
  endOdometer: number;
  fuelLiters: number;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

interface StoreValue {
  db: Database;
  // auth
  registerUser: (input: RegisterInput) => ActionResult<User>;
  // vehicles
  addVehicle: (input: Omit<Vehicle, "id" | "createdAt">) => ActionResult<Vehicle>;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => ActionResult<Vehicle>;
  deleteVehicle: (id: string) => ActionResult;
  // drivers
  addDriver: (input: Omit<Driver, "id" | "createdAt">) => ActionResult<Driver>;
  updateDriver: (id: string, patch: Partial<Driver>) => ActionResult<Driver>;
  deleteDriver: (id: string) => ActionResult;
  // trips
  createTrip: (input: CreateTripInput) => ActionResult<Trip>;
  updateTrip: (id: string, input: Partial<CreateTripInput>) => ActionResult<Trip>;
  dispatchTrip: (id: string) => ActionResult<Trip>;
  completeTrip: (id: string, input: CompleteTripInput) => ActionResult<Trip>;
  cancelTrip: (id: string, note?: string) => ActionResult<Trip>;
  deleteTrip: (id: string) => ActionResult;
  // maintenance
  addMaintenance: (input: Omit<MaintenanceLog, "id" | "createdAt">) => ActionResult<MaintenanceLog>;
  completeMaintenance: (id: string) => ActionResult<MaintenanceLog>;
  deleteMaintenance: (id: string) => ActionResult;
  // expenses
  addExpense: (input: Omit<Expense, "id" | "createdAt">) => ActionResult<Expense>;
  deleteExpense: (id: string) => ActionResult;
  // settings
  updateSettings: (patch: Partial<Settings>) => ActionResult<Settings>;
  // demo
  resetDemoData: () => void;
  // selectors
  dispatchableVehicles: () => Vehicle[];
  dispatchableDrivers: () => Driver[];
  vehicleById: (id: string | null | undefined) => Vehicle | undefined;
  driverById: (id: string | null | undefined) => Driver | undefined;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(() => loadDatabase());
  const dbRef = useRef(db);
  dbRef.current = db;

  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  const commit = useCallback((next: Database) => {
    dbRef.current = next;
    setDb(next);
  }, []);

  // -------------------- Auth --------------------
  const registerUser = useCallback<StoreValue["registerUser"]>(
    (input) => {
      const cur = dbRef.current;
      const name = input.name.trim();
      const email = input.email.trim().toLowerCase();
      if (!name) return { ok: false, error: "Full name is required." };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, error: "Enter a valid email address." };
      }
      if (input.password.length < 6) {
        return { ok: false, error: "Password must be at least 6 characters." };
      }
      if (cur.users.some((u) => u.email.toLowerCase() === email)) {
        return { ok: false, error: "An account with this email already exists." };
      }
      const user: User = {
        id: uid("usr"),
        name,
        email,
        password: input.password,
        role: input.role,
      };
      commit({ ...cur, users: [...cur.users, user] });
      return { ok: true, data: user };
    },
    [commit],
  );

  // -------------------- Vehicles --------------------
  const addVehicle = useCallback<StoreValue["addVehicle"]>(
    (input) => {
      const cur = dbRef.current;
      const reg = input.registrationNo.trim().toUpperCase();
      if (!reg) return { ok: false, error: "Registration number is required." };
      if (cur.vehicles.some((v) => v.registrationNo.toUpperCase() === reg)) {
        return { ok: false, error: `Registration ${reg} already exists.` };
      }
      const vehicle: Vehicle = {
        ...input,
        registrationNo: reg,
        id: uid("veh"),
        createdAt: new Date().toISOString(),
      };
      commit({ ...cur, vehicles: [vehicle, ...cur.vehicles] });
      return { ok: true, data: vehicle };
    },
    [commit],
  );

  const updateVehicle = useCallback<StoreValue["updateVehicle"]>(
    (id, patch) => {
      const cur = dbRef.current;
      const existing = cur.vehicles.find((v) => v.id === id);
      if (!existing) return { ok: false, error: "Vehicle not found." };
      if (patch.registrationNo) {
        const reg = patch.registrationNo.trim().toUpperCase();
        if (cur.vehicles.some((v) => v.id !== id && v.registrationNo.toUpperCase() === reg)) {
          return { ok: false, error: `Registration ${reg} already exists.` };
        }
        patch = { ...patch, registrationNo: reg };
      }
      const updated = { ...existing, ...patch };
      commit({ ...cur, vehicles: cur.vehicles.map((v) => (v.id === id ? updated : v)) });
      return { ok: true, data: updated };
    },
    [commit],
  );

  const deleteVehicle = useCallback<StoreValue["deleteVehicle"]>(
    (id) => {
      const cur = dbRef.current;
      const v = cur.vehicles.find((x) => x.id === id);
      if (!v) return { ok: false, error: "Vehicle not found." };
      if (v.status === "ON_TRIP") {
        return { ok: false, error: "Cannot delete a vehicle that is on a trip." };
      }
      const activeTrip = cur.trips.some(
        (t) => t.vehicleId === id && (t.status === "DISPATCHED" || t.status === "DRAFT"),
      );
      if (activeTrip) {
        return { ok: false, error: "Vehicle is linked to active/draft trips." };
      }
      commit({ ...cur, vehicles: cur.vehicles.filter((x) => x.id !== id) });
      return { ok: true };
    },
    [commit],
  );

  // -------------------- Drivers --------------------
  const addDriver = useCallback<StoreValue["addDriver"]>(
    (input) => {
      const cur = dbRef.current;
      const lic = input.licenseNumber.trim().toUpperCase();
      if (!lic) return { ok: false, error: "License number is required." };
      if (cur.drivers.some((d) => d.licenseNumber.toUpperCase() === lic)) {
        return { ok: false, error: `License ${lic} already exists.` };
      }
      const driver: Driver = {
        ...input,
        licenseNumber: lic,
        id: uid("drv"),
        createdAt: new Date().toISOString(),
      };
      commit({ ...cur, drivers: [driver, ...cur.drivers] });
      return { ok: true, data: driver };
    },
    [commit],
  );

  const updateDriver = useCallback<StoreValue["updateDriver"]>(
    (id, patch) => {
      const cur = dbRef.current;
      const existing = cur.drivers.find((d) => d.id === id);
      if (!existing) return { ok: false, error: "Driver not found." };
      if (patch.licenseNumber) {
        const lic = patch.licenseNumber.trim().toUpperCase();
        if (cur.drivers.some((d) => d.id !== id && d.licenseNumber.toUpperCase() === lic)) {
          return { ok: false, error: `License ${lic} already exists.` };
        }
        patch = { ...patch, licenseNumber: lic };
      }
      const updated = { ...existing, ...patch };
      commit({ ...cur, drivers: cur.drivers.map((d) => (d.id === id ? updated : d)) });
      return { ok: true, data: updated };
    },
    [commit],
  );

  const deleteDriver = useCallback<StoreValue["deleteDriver"]>(
    (id) => {
      const cur = dbRef.current;
      const d = cur.drivers.find((x) => x.id === id);
      if (!d) return { ok: false, error: "Driver not found." };
      if (d.status === "ON_TRIP") {
        return { ok: false, error: "Cannot delete a driver that is on a trip." };
      }
      commit({ ...cur, drivers: cur.drivers.filter((x) => x.id !== id) });
      return { ok: true };
    },
    [commit],
  );

  // -------------------- Trips --------------------
  const nextTripCode = (cur: Database): string => {
    let max = 0;
    for (const t of cur.trips) {
      const m = /TRIP-(\d+)/.exec(t.code);
      if (m) max = Math.max(max, Number(m[1]));
    }
    return `TRIP-${String(max + 1).padStart(3, "0")}`;
  };

  const createTrip = useCallback<StoreValue["createTrip"]>(
    (input) => {
      const cur = dbRef.current;
      if (!input.source.trim() || !input.destination.trim()) {
        return { ok: false, error: "Source and destination are required." };
      }
      if (input.cargoKg <= 0) return { ok: false, error: "Cargo weight must be greater than zero." };

      const vehicle = input.vehicleId ? cur.vehicles.find((v) => v.id === input.vehicleId) : undefined;
      const driver = input.driverId ? cur.drivers.find((d) => d.id === input.driverId) : undefined;

      // Capacity check applies whenever a vehicle is chosen (rule 5)
      if (vehicle && input.cargoKg > vehicle.capacityKg) {
        return {
          ok: false,
          error: `Capacity exceeded: cargo ${input.cargoKg} kg > ${vehicle.capacityKg} kg limit on ${vehicle.registrationNo}.`,
        };
      }

      if (input.intent === "dispatch") {
        if (!vehicle) return { ok: false, error: "Select an available vehicle to dispatch." };
        if (!driver) return { ok: false, error: "Select an available driver to dispatch." };
        if (!isVehicleDispatchable(vehicle)) {
          return { ok: false, error: `${vehicle.registrationNo} is ${vehicle.status} and cannot be dispatched.` };
        }
        if (!isDriverDispatchable(driver)) {
          const reason = isExpired(driver.licenseExpiry) ? "has an expired license" : `is ${driver.status}`;
          return { ok: false, error: `${driver.name} ${reason} and cannot be assigned.` };
        }
      }

      const nowIso = new Date().toISOString();
      const dispatching = input.intent === "dispatch";
      const trip: Trip = {
        id: uid("trip"),
        code: nextTripCode(cur),
        source: input.source.trim(),
        destination: input.destination.trim(),
        vehicleId: input.vehicleId,
        driverId: input.driverId,
        cargoKg: input.cargoKg,
        plannedKm: input.plannedKm,
        revenue: input.revenue,
        status: dispatching ? "DISPATCHED" : "DRAFT",
        startOdometer: dispatching && vehicle ? vehicle.odometer : null,
        endOdometer: null,
        fuelLiters: null,
        note: null,
        createdAt: nowIso,
        dispatchedAt: dispatching ? nowIso : null,
        completedAt: null,
      };

      const vehicles = dispatching && vehicle
        ? cur.vehicles.map((v) => (v.id === vehicle.id ? { ...v, status: "ON_TRIP" as const } : v))
        : cur.vehicles;
      const drivers = dispatching && driver
        ? cur.drivers.map((d) => (d.id === driver.id ? { ...d, status: "ON_TRIP" as const } : d))
        : cur.drivers;

      commit({ ...cur, trips: [trip, ...cur.trips], vehicles, drivers });
      return { ok: true, data: trip };
    },
    [commit],
  );

  const updateTrip = useCallback<StoreValue["updateTrip"]>(
    (id, input) => {
      const cur = dbRef.current;
      const trip = cur.trips.find((t) => t.id === id);
      if (!trip) return { ok: false, error: "Trip not found." };
      if (trip.status !== "DRAFT") return { ok: false, error: "Only draft trips can be updated." };

      if (input.cargoKg !== undefined && input.cargoKg <= 0) {
        return { ok: false, error: "Cargo weight must be greater than zero." };
      }

      const vehicleId = input.vehicleId !== undefined ? input.vehicleId : trip.vehicleId;
      const vehicle = vehicleId ? cur.vehicles.find((v) => v.id === vehicleId) : undefined;
      const cargoKg = input.cargoKg !== undefined ? input.cargoKg : trip.cargoKg;

      if (vehicle && cargoKg > vehicle.capacityKg) {
        return {
          ok: false,
          error: `Capacity exceeded: cargo ${cargoKg} kg > ${vehicle.capacityKg} kg limit on ${vehicle.registrationNo}.`,
        };
      }

      const updated = {
        ...trip,
        ...(input.source !== undefined && { source: input.source.trim() }),
        ...(input.destination !== undefined && { destination: input.destination.trim() }),
        ...(input.vehicleId !== undefined && { vehicleId: input.vehicleId }),
        ...(input.driverId !== undefined && { driverId: input.driverId }),
        ...(input.cargoKg !== undefined && { cargoKg }),
        ...(input.plannedKm !== undefined && { plannedKm: input.plannedKm }),
        ...(input.revenue !== undefined && { revenue: input.revenue }),
      };

      commit({ ...cur, trips: cur.trips.map((t) => (t.id === id ? updated : t)) });
      return { ok: true, data: updated };
    },
    [commit],
  );

  const dispatchTrip = useCallback<StoreValue["dispatchTrip"]>(
    (id) => {
      const cur = dbRef.current;
      const trip = cur.trips.find((t) => t.id === id);
      if (!trip) return { ok: false, error: "Trip not found." };
      if (trip.status !== "DRAFT") return { ok: false, error: "Only draft trips can be dispatched." };

      const vehicle = cur.vehicles.find((v) => v.id === trip.vehicleId);
      const driver = cur.drivers.find((d) => d.id === trip.driverId);
      if (!vehicle) return { ok: false, error: "Assign an available vehicle before dispatching." };
      if (!driver) return { ok: false, error: "Assign an available driver before dispatching." };
      if (!isVehicleDispatchable(vehicle)) {
        return { ok: false, error: `${vehicle.registrationNo} is ${vehicle.status} and cannot be dispatched.` };
      }
      if (!isDriverDispatchable(driver)) {
        const reason = isExpired(driver.licenseExpiry) ? "has an expired license" : `is ${driver.status}`;
        return { ok: false, error: `${driver.name} ${reason} and cannot be assigned.` };
      }
      if (trip.cargoKg > vehicle.capacityKg) {
        return { ok: false, error: `Capacity exceeded on ${vehicle.registrationNo}.` };
      }

      const nowIso = new Date().toISOString();
      const updated: Trip = {
        ...trip,
        status: "DISPATCHED",
        dispatchedAt: nowIso,
        startOdometer: vehicle.odometer,
      };
      commit({
        ...cur,
        trips: cur.trips.map((t) => (t.id === id ? updated : t)),
        vehicles: cur.vehicles.map((v) => (v.id === vehicle.id ? { ...v, status: "ON_TRIP" } : v)),
        drivers: cur.drivers.map((d) => (d.id === driver.id ? { ...d, status: "ON_TRIP" } : d)),
      });
      return { ok: true, data: updated };
    },
    [commit],
  );

  const completeTrip = useCallback<StoreValue["completeTrip"]>(
    (id, input) => {
      const cur = dbRef.current;
      const trip = cur.trips.find((t) => t.id === id);
      if (!trip) return { ok: false, error: "Trip not found." };
      if (trip.status !== "DISPATCHED") return { ok: false, error: "Only dispatched trips can be completed." };

      const vehicle = cur.vehicles.find((v) => v.id === trip.vehicleId);
      if (vehicle && input.endOdometer < (trip.startOdometer ?? vehicle.odometer)) {
        return { ok: false, error: "Final odometer must be greater than the start odometer." };
      }

      const nowIso = new Date().toISOString();
      const updated: Trip = {
        ...trip,
        status: "COMPLETED",
        completedAt: nowIso,
        endOdometer: input.endOdometer,
        fuelLiters: input.fuelLiters,
      };

      // Restore statuses (rule 7) and roll the vehicle odometer forward
      const vehicles = cur.vehicles.map((v) =>
        v.id === trip.vehicleId
          ? { ...v, status: v.status === "RETIRED" ? v.status : ("AVAILABLE" as const), odometer: Math.max(v.odometer, input.endOdometer) }
          : v,
      );
      const drivers = cur.drivers.map((d) => {
        if (d.id === trip.driverId) {
          const completed = cur.trips.filter(t => t.driverId === d.id && t.status === "COMPLETED").length + 1;
          const total = cur.trips.filter(t => t.driverId === d.id && t.status !== "DRAFT").length;
          const rate = Math.round((completed / Math.max(1, total)) * 100);
          const safety = Math.min(100, d.safetyScore + 2);
          return {
            ...d,
            status: d.status === "ON_TRIP" ? "AVAILABLE" : d.status,
            tripCompletionRate: rate,
            safetyScore: safety
          };
        }
        return d;
      });

      // Auto-log the fuel expense for this trip
      const expenses = [...cur.expenses];
      if (input.fuelLiters > 0) {
        expenses.unshift({
          id: uid("exp"),
          type: "FUEL",
          vehicleId: trip.vehicleId,
          tripId: trip.id,
          amount: Math.round(input.fuelLiters * cur.settings.fuelPricePerLiter),
          date: nowIso,
          liters: input.fuelLiters,
          description: `Fuel for ${trip.source} to ${trip.destination}`,
          createdAt: nowIso,
        });
      }

      commit({
        ...cur,
        trips: cur.trips.map((t) => (t.id === id ? updated : t)),
        vehicles,
        drivers,
        expenses,
      });
      return { ok: true, data: updated };
    },
    [commit],
  );

  const cancelTrip = useCallback<StoreValue["cancelTrip"]>(
    (id, note) => {
      const cur = dbRef.current;
      const trip = cur.trips.find((t) => t.id === id);
      if (!trip) return { ok: false, error: "Trip not found." };
      if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
        return { ok: false, error: "This trip can no longer be cancelled." };
      }
      const wasDispatched = trip.status === "DISPATCHED";
      const updated: Trip = { ...trip, status: "CANCELLED", note: note ?? trip.note };

      // Restore statuses only if the trip had reserved them (rule 8)
      const vehicles = wasDispatched
        ? cur.vehicles.map((v) =>
            v.id === trip.vehicleId && v.status === "ON_TRIP" ? { ...v, status: "AVAILABLE" as const } : v,
          )
        : cur.vehicles;
      const drivers = wasDispatched
        ? cur.drivers.map((d) => {
            if (d.id === trip.driverId) {
              const completed = cur.trips.filter(t => t.driverId === d.id && t.status === "COMPLETED").length;
              const total = cur.trips.filter(t => t.driverId === d.id && t.status !== "DRAFT").length;
              const rate = Math.round((completed / Math.max(1, total)) * 100);
              const safety = Math.max(0, d.safetyScore - 5);
              return {
                ...d,
                status: d.status === "ON_TRIP" ? "AVAILABLE" : d.status,
                tripCompletionRate: rate,
                safetyScore: safety
              };
            }
            return d;
          })
        : cur.drivers;

      commit({ ...cur, trips: cur.trips.map((t) => (t.id === id ? updated : t)), vehicles, drivers });
      return { ok: true, data: updated };
    },
    [commit],
  );

  const deleteTrip = useCallback<StoreValue["deleteTrip"]>(
    (id) => {
      const cur = dbRef.current;
      const trip = cur.trips.find((t) => t.id === id);
      if (!trip) return { ok: false, error: "Trip not found." };
      if (trip.status === "DISPATCHED") {
        return { ok: false, error: "Cancel the trip before deleting it." };
      }
      commit({ ...cur, trips: cur.trips.filter((t) => t.id !== id) });
      return { ok: true };
    },
    [commit],
  );

  // -------------------- Maintenance --------------------
  const addMaintenance = useCallback<StoreValue["addMaintenance"]>(
    (input) => {
      const cur = dbRef.current;
      const vehicle = cur.vehicles.find((v) => v.id === input.vehicleId);
      if (!vehicle) return { ok: false, error: "Select a vehicle for the maintenance log." };
      if (vehicle.status === "ON_TRIP") {
        return { ok: false, error: `${vehicle.registrationNo} is on a trip. Complete the trip first.` };
      }
      if (vehicle.status === "RETIRED") {
        return { ok: false, error: `${vehicle.registrationNo} is retired.` };
      }
      const log: MaintenanceLog = { ...input, id: uid("mnt"), createdAt: new Date().toISOString() };

      // Active maintenance sends the vehicle to the shop (rule 9)
      const vehicles =
        input.status === "ACTIVE"
          ? cur.vehicles.map((v) => (v.id === vehicle.id ? { ...v, status: "IN_SHOP" as const } : v))
          : cur.vehicles;

      commit({ ...cur, maintenance: [log, ...cur.maintenance], vehicles });
      return { ok: true, data: log };
    },
    [commit],
  );

  const completeMaintenance = useCallback<StoreValue["completeMaintenance"]>(
    (id) => {
      const cur = dbRef.current;
      const log = cur.maintenance.find((m) => m.id === id);
      if (!log) return { ok: false, error: "Maintenance log not found." };
      if (log.status === "COMPLETED") return { ok: false, error: "This log is already completed." };

      const updated: MaintenanceLog = { ...log, status: "COMPLETED" };

      // Restore the vehicle unless it is still needed elsewhere (rule 10)
      const stillActive = cur.maintenance.some(
        (m) => m.id !== id && m.vehicleId === log.vehicleId && m.status === "ACTIVE",
      );
      const vehicles = cur.vehicles.map((v) => {
        if (v.id !== log.vehicleId) return v;
        if (v.status === "RETIRED") return v;
        if (v.status === "IN_SHOP" && !stillActive) return { ...v, status: "AVAILABLE" as const };
        return v;
      });

      commit({ ...cur, maintenance: cur.maintenance.map((m) => (m.id === id ? updated : m)), vehicles });
      return { ok: true, data: updated };
    },
    [commit],
  );

  const deleteMaintenance = useCallback<StoreValue["deleteMaintenance"]>(
    (id) => {
      const cur = dbRef.current;
      const log = cur.maintenance.find((m) => m.id === id);
      if (!log) return { ok: false, error: "Maintenance log not found." };
      // If it was the reason the vehicle was in the shop, release it.
      const stillActive = cur.maintenance.some(
        (m) => m.id !== id && m.vehicleId === log.vehicleId && m.status === "ACTIVE",
      );
      const vehicles =
        log.status === "ACTIVE" && !stillActive
          ? cur.vehicles.map((v) =>
              v.id === log.vehicleId && v.status === "IN_SHOP" ? { ...v, status: "AVAILABLE" as const } : v,
            )
          : cur.vehicles;
      commit({ ...cur, maintenance: cur.maintenance.filter((m) => m.id !== id), vehicles });
      return { ok: true };
    },
    [commit],
  );

  // -------------------- Expenses --------------------
  const addExpense = useCallback<StoreValue["addExpense"]>(
    (input) => {
      const cur = dbRef.current;
      if (input.amount <= 0) return { ok: false, error: "Amount must be greater than zero." };
      const expense: Expense = { ...input, id: uid("exp"), createdAt: new Date().toISOString() };
      commit({ ...cur, expenses: [expense, ...cur.expenses] });
      return { ok: true, data: expense };
    },
    [commit],
  );

  const deleteExpense = useCallback<StoreValue["deleteExpense"]>(
    (id) => {
      const cur = dbRef.current;
      if (!cur.expenses.some((e) => e.id === id)) return { ok: false, error: "Expense not found." };
      commit({ ...cur, expenses: cur.expenses.filter((e) => e.id !== id) });
      return { ok: true };
    },
    [commit],
  );

  // -------------------- Settings / demo --------------------
  const updateSettings = useCallback<StoreValue["updateSettings"]>(
    (patch) => {
      const cur = dbRef.current;
      const settings = { ...cur.settings, ...patch };
      commit({ ...cur, settings });
      return { ok: true, data: settings };
    },
    [commit],
  );

  const resetDemoData = useCallback(() => {
    commit(buildSeedDatabase());
  }, [commit]);

  // -------------------- Selectors --------------------
  const dispatchableVehicles = useCallback(
    () => dbRef.current.vehicles.filter(isVehicleDispatchable),
    [db],
  );
  const dispatchableDrivers = useCallback(
    () => dbRef.current.drivers.filter(isDriverDispatchable),
    [db],
  );
  const vehicleById = useCallback((id: string | null | undefined) => db.vehicles.find((v) => v.id === id), [db]);
  const driverById = useCallback((id: string | null | undefined) => db.drivers.find((d) => d.id === id), [db]);

  const value: StoreValue = {
    db,
    registerUser,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    addDriver,
    updateDriver,
    deleteDriver,
    createTrip,
    updateTrip,
    dispatchTrip,
    completeTrip,
    cancelTrip,
    deleteTrip,
    addMaintenance,
    completeMaintenance,
    deleteMaintenance,
    addExpense,
    deleteExpense,
    updateSettings,
    resetDemoData,
    dispatchableVehicles,
    dispatchableDrivers,
    vehicleById,
    driverById,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
