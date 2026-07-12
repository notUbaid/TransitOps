import type {
  Database,
  Driver,
  Expense,
  MaintenanceLog,
  Settings,
  Trip,
  User,
  Vehicle,
} from "./types";

// Demo password shared by all seeded accounts.
export const DEMO_PASSWORD = "transit123";

const iso = (y: number, m: number, day: number) =>
  new Date(y, m - 1, day, 9, 0, 0).toISOString();

/** A date `offset` days from now — used so license warnings always demo well. */
const fromNow = (days: number) => {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

// ------------------------------------------------------------------
// Users (one per role)
// ------------------------------------------------------------------
const USERS: User[] = [
  { id: "usr_1", name: "Meera Fernandes", email: "manager@transitops.in", role: "fleet_manager", password: DEMO_PASSWORD },
  { id: "usr_2", name: "Raven Khanna", email: "dispatcher@transitops.in", role: "dispatcher", password: DEMO_PASSWORD },
  { id: "usr_3", name: "Sana Sheikh", email: "safety@transitops.in", role: "safety_officer", password: DEMO_PASSWORD },
  { id: "usr_4", name: "Farhan Ali", email: "finance@transitops.in", role: "financial_analyst", password: DEMO_PASSWORD },
];

// ------------------------------------------------------------------
// Vehicles (odometer chosen so a couple trip the predictive-service flag)
// ------------------------------------------------------------------
const RAW_VEHICLES: Omit<Vehicle, "id" | "status" | "createdAt">[] = [
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

// ------------------------------------------------------------------
// Drivers — statuses assigned below to demo every state + a license warning
// ------------------------------------------------------------------
const RAW_DRIVERS: (Omit<Driver, "id" | "status" | "createdAt"> & { status?: Driver["status"] })[] = [
  { name: "Rajesh Patel", licenseNumber: "GJ-01-2025-00001", category: "Heavy", licenseExpiry: iso(2027, 6, 30), phone: "9876543210", safetyScore: 92, tripCompletionRate: 97 },
  { name: "Suresh Sharma", licenseNumber: "GJ-01-2025-00002", category: "Heavy", licenseExpiry: iso(2027, 8, 15), phone: "9876543211", safetyScore: 88, tripCompletionRate: 95 },
  { name: "Amit Singh", licenseNumber: "GJ-01-2025-00003", category: "Light", licenseExpiry: iso(2028, 3, 20), phone: "9876543212", safetyScore: 79, tripCompletionRate: 90, status: "OFF_DUTY" },
  { name: "Deepak Verma", licenseNumber: "GJ-01-2025-00004", category: "Heavy", licenseExpiry: fromNow(18), phone: "9876543213", safetyScore: 84, tripCompletionRate: 93 },
  { name: "Manoj Yadav", licenseNumber: "GJ-01-2025-00005", category: "Medium", licenseExpiry: iso(2027, 5, 5), phone: "9876543214", safetyScore: 61, tripCompletionRate: 82, status: "SUSPENDED" },
  { name: "Vijay Deshmukh", licenseNumber: "GJ-01-2025-00006", category: "Heavy", licenseExpiry: iso(2026, 9, 25), phone: "9876543215", safetyScore: 90, tripCompletionRate: 96 },
  { name: "Kiran Joshi", licenseNumber: "GJ-01-2025-00007", category: "Medium", licenseExpiry: iso(2028, 1, 12), phone: "9876543216", safetyScore: 87, tripCompletionRate: 94 },
  { name: "Prakash Rao", licenseNumber: "GJ-01-2025-00008", category: "Light", licenseExpiry: iso(2027, 11, 3), phone: "9876543217", safetyScore: 81, tripCompletionRate: 91 },
];

// ------------------------------------------------------------------
// Trips — vi/di are indexes into the vehicle/driver arrays
// ------------------------------------------------------------------
type RawTrip = {
  code?: string;
  source: string;
  destination: string;
  cargoKg: number;
  plannedKm: number;
  revenue: number;
  status: Trip["status"];
  vi?: number;
  di?: number;
  so?: number;
  eo?: number;
  fl?: number;
  note?: string;
  da?: string;
  ca?: string;
};

const RAW_TRIPS: RawTrip[] = [
  { code: "TRIP-001", source: "Ahmedabad", destination: "Vadodara", cargoKg: 12000, plannedKm: 110, revenue: 15000, status: "COMPLETED", vi: 0, di: 0, so: 12500, eo: 12610, fl: 35, da: iso(2025, 6, 1), ca: iso(2025, 6, 1) },
  { code: "TRIP-002", source: "Surat", destination: "Rajkot", cargoKg: 18000, plannedKm: 280, revenue: 32000, status: "COMPLETED", vi: 1, di: 1, so: 34500, eo: 34780, fl: 90, da: iso(2025, 6, 3), ca: iso(2025, 6, 4) },
  { code: "TRIP-003", source: "Ahmedabad", destination: "Mehsana", cargoKg: 2000, plannedKm: 60, revenue: 5000, status: "COMPLETED", vi: 2, di: 2, so: 8200, eo: 8260, fl: 12, da: iso(2025, 6, 5), ca: iso(2025, 6, 5) },
  { code: "TRIP-004", source: "Vadodara", destination: "Surat", cargoKg: 1000, plannedKm: 150, revenue: 8000, status: "COMPLETED", vi: 3, di: 3, so: 15000, eo: 15150, fl: 28, da: iso(2025, 6, 7), ca: iso(2025, 6, 7) },
  { code: "TRIP-005", source: "Rajkot", destination: "Bhavnagar", cargoKg: 2500, plannedKm: 170, revenue: 12000, status: "COMPLETED", vi: 4, di: 4, so: 22000, eo: 22170, fl: 35, da: iso(2025, 6, 10), ca: iso(2025, 6, 10) },
  { code: "TRIP-006", source: "Vadodara", destination: "Anand", cargoKg: 16000, plannedKm: 40, revenue: 7000, status: "COMPLETED", vi: 0, di: 0, so: 12610, eo: 12650, fl: 14, da: iso(2025, 6, 15), ca: iso(2025, 6, 15) },
  { code: "TRIP-007", source: "Ahmedabad", destination: "Rajkot", cargoKg: 20000, plannedKm: 200, revenue: 28000, status: "COMPLETED", vi: 5, di: 5, so: 5100, eo: 5300, fl: 65, da: iso(2025, 6, 20), ca: iso(2025, 6, 21) },
  { code: "TRIP-008", source: "Gandhinagar", destination: "Surat", cargoKg: 5000, plannedKm: 220, revenue: 18000, status: "COMPLETED", vi: 8, di: 2, so: 1800, eo: 2020, fl: 55, da: iso(2025, 7, 5), ca: iso(2025, 7, 5) },
  // Dispatched (live board) — vehicles 5,7,9 & drivers 5,0,1 become ON_TRIP
  { source: "Gandhinagar", destination: "Mehsana", cargoKg: 28000, plannedKm: 65, revenue: 18000, status: "DISPATCHED", vi: 9, di: 1, so: 41250, fl: 40, da: fromNow(-2) },
  { source: "Ahmedabad", destination: "Surat", cargoKg: 6000, plannedKm: 280, revenue: 22000, status: "DISPATCHED", vi: 7, di: 0, so: 52400, fl: 75, da: fromNow(-1) },
  { source: "Bhavnagar", destination: "Rajkot", cargoKg: 22000, plannedKm: 170, revenue: 20000, status: "DISPATCHED", vi: 5, di: 5, so: 88750, fl: 50, da: fromNow(0) },
  // Drafts
  { source: "Bhavnagar", destination: "Vadodara", cargoKg: 1500, plannedKm: 190, revenue: 10000, status: "DRAFT", vi: 6 },
  { source: "Mehsana", destination: "Ahmedabad", cargoKg: 1800, plannedKm: 60, revenue: 4500, status: "DRAFT", vi: 8 },
  { source: "Anand", destination: "Nadiad", cargoKg: 3500, plannedKm: 30, revenue: 3000, status: "DRAFT" },
  { source: "Nadiad", destination: "Ahmedabad", cargoKg: 500, plannedKm: 45, revenue: 2500, status: "DRAFT" },
  // Cancelled
  { source: "Ahmedabad", destination: "Bharuch", cargoKg: 15000, plannedKm: 200, revenue: 25000, status: "CANCELLED", vi: 0, di: 1, note: "Customer cancelled the order", da: iso(2025, 6, 25) },
  { source: "Surat", destination: "Vadodara", cargoKg: 2500, plannedKm: 150, revenue: 9000, status: "CANCELLED", vi: 4, di: 4, note: "Vehicle breakdown before departure", da: iso(2025, 7, 2) },
];

// ------------------------------------------------------------------
// Maintenance — 3 ACTIVE logs (vehicles 1,3,6 → IN_SHOP)
// ------------------------------------------------------------------
type RawMaint = { vi: number; serviceType: string; cost: number; date: string; status: MaintenanceLog["status"]; notes: string };
const RAW_MAINTENANCE: RawMaint[] = [
  { vi: 0, serviceType: "Oil Change", cost: 3500, date: iso(2025, 5, 15), status: "COMPLETED", notes: "Regular oil change and filter replacement" },
  { vi: 1, serviceType: "Brake Service", cost: 4500, date: iso(2025, 5, 20), status: "COMPLETED", notes: "Brake pad replacement and fluid top-up" },
  { vi: 2, serviceType: "Tire Replacement", cost: 8000, date: iso(2025, 6, 1), status: "COMPLETED", notes: "All 4 tires replaced" },
  { vi: 0, serviceType: "Full Service", cost: 12000, date: iso(2025, 6, 10), status: "COMPLETED", notes: "60,000 km full service" },
  { vi: 8, serviceType: "Wheel Alignment", cost: 1500, date: iso(2025, 7, 12), status: "COMPLETED", notes: "Front wheel alignment and balancing" },
  { vi: 3, serviceType: "Engine Tune-up", cost: 6000, date: fromNow(-3), status: "ACTIVE", notes: "Scheduled engine tune-up" },
  { vi: 6, serviceType: "Battery Replacement", cost: 3500, date: fromNow(-1), status: "ACTIVE", notes: "Battery health degraded - replacement needed" },
  { vi: 1, serviceType: "Gearbox Repair", cost: 15000, date: fromNow(-5), status: "ACTIVE", notes: "Gearbox overhaul in progress - awaiting parts" },
];

// ------------------------------------------------------------------
// Expenses (ti = trip index into completed/dispatched trips)
// ------------------------------------------------------------------
type RawExpense = { type: Expense["type"]; vi?: number; ti?: number; amount: number; date: string; liters?: number; description: string };
const RAW_EXPENSES: RawExpense[] = [
  { type: "FUEL", vi: 0, ti: 0, amount: 3640, date: iso(2025, 6, 1), liters: 35, description: "Fuel for Ahmedabad to Vadodara" },
  { type: "TOLL", vi: 0, ti: 0, amount: 500, date: iso(2025, 6, 1), description: "Toll charges NH-48" },
  { type: "FUEL", vi: 1, ti: 1, amount: 9360, date: iso(2025, 6, 3), liters: 90, description: "Fuel for Surat to Rajkot" },
  { type: "TOLL", vi: 1, ti: 1, amount: 1200, date: iso(2025, 6, 3), description: "Toll charges NH-27" },
  { type: "FUEL", vi: 2, ti: 2, amount: 1248, date: iso(2025, 6, 5), liters: 12, description: "Fuel for Ahmedabad to Mehsana" },
  { type: "TOLL", vi: 2, ti: 2, amount: 200, date: iso(2025, 6, 5), description: "Toll charges Ahmedabad-Mehsana road" },
  { type: "FUEL", vi: 3, ti: 3, amount: 2912, date: iso(2025, 6, 7), liters: 28, description: "Fuel for Vadodara to Surat" },
  { type: "TOLL", vi: 3, ti: 3, amount: 800, date: iso(2025, 6, 7), description: "Toll charges Vadodara-Surat expressway" },
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

const SETTINGS: Settings = {
  companyName: "TransitOps Fleet Solutions",
  depotName: "Gandhinagar Depot G124",
  currency: "INR",
  distanceUnit: "km",
  fuelPricePerLiter: 104.5,
  maintenanceAlertKm: 5000,
  gstRate: 18,
  contactEmail: "support@transitops.in",
  contactPhone: "+91-79-4000-1234",
};

/** Build a fresh, business-rule-consistent database from the raw seed. */
export function buildSeedDatabase(): Database {
  const now = new Date().toISOString();

  const vehicles: Vehicle[] = RAW_VEHICLES.map((v, i) => ({
    ...v,
    id: `veh_${i + 1}`,
    status: "AVAILABLE",
    createdAt: iso(2025, 1, 10),
  }));

  const drivers: Driver[] = RAW_DRIVERS.map((d, i) => ({
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

  let tripSeq = 0;
  const trips: Trip[] = RAW_TRIPS.map((t) => {
    tripSeq += 1;
    const code = t.code ?? `TRIP-${String(tripSeq).padStart(3, "0")}`;
    return {
      id: `trip_${tripSeq}`,
      code,
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
      createdAt: t.da ?? now,
      dispatchedAt: t.status === "DISPATCHED" || t.status === "COMPLETED" ? t.da ?? null : null,
      completedAt: t.ca ?? null,
    };
  });

  const maintenance: MaintenanceLog[] = RAW_MAINTENANCE.map((m, i) => ({
    id: `mnt_${i + 1}`,
    vehicleId: vehicles[m.vi].id,
    serviceType: m.serviceType,
    cost: m.cost,
    serviceDate: m.date,
    status: m.status,
    notes: m.notes,
    createdAt: m.date,
  }));

  const expenses: Expense[] = RAW_EXPENSES.map((e, i) => ({
    id: `exp_${i + 1}`,
    type: e.type,
    vehicleId: e.vi != null ? vehicles[e.vi].id : null,
    tripId: e.ti != null ? trips[e.ti].id : null,
    amount: e.amount,
    date: e.date,
    liters: e.liters ?? null,
    description: e.description,
    createdAt: e.date,
  }));

  // ---- Derive statuses so the seed obeys the business rules ----
  // Active maintenance -> IN_SHOP
  for (const m of maintenance) {
    if (m.status === "ACTIVE") {
      const v = vehicles.find((x) => x.id === m.vehicleId);
      if (v && v.status !== "RETIRED") v.status = "IN_SHOP";
    }
  }
  // Dispatched trips -> vehicle & driver ON_TRIP
  for (const t of trips) {
    if (t.status === "DISPATCHED") {
      const v = vehicles.find((x) => x.id === t.vehicleId);
      const d = drivers.find((x) => x.id === t.driverId);
      if (v) v.status = "ON_TRIP";
      if (d) d.status = "ON_TRIP";
    }
  }
  // One retired asset (Mahindra Bolero Pickup) for lifecycle demo
  const retired = vehicles.find((v) => v.registrationNo === "GJ-01-EF-9012");
  if (retired && retired.status === "AVAILABLE") retired.status = "RETIRED";

  return {
    users: USERS.map((u) => ({ ...u })),
    vehicles,
    drivers,
    trips,
    maintenance,
    expenses,
    settings: { ...SETTINGS },
  };
}
