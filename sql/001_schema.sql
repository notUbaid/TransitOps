-- TransitOps Database Schema
-- Run this against your Neon (Vercel Postgres) database.
-- psql $DATABASE_URL -f sql/001_schema.sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  password TEXT NOT NULL,
  avatar TEXT
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  registration_no TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  capacity_kg DOUBLE PRECISION NOT NULL,
  odometer DOUBLE PRECISION NOT NULL DEFAULT 0,
  acquisition_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
  region TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  license_number TEXT NOT NULL,
  category TEXT NOT NULL,
  license_expiry TIMESTAMPTZ NOT NULL,
  phone TEXT NOT NULL,
  safety_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  trip_completion_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id TEXT REFERENCES drivers(id) ON DELETE SET NULL,
  cargo_kg DOUBLE PRECISION NOT NULL,
  planned_km DOUBLE PRECISION NOT NULL,
  revenue DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  start_odometer DOUBLE PRECISION,
  end_odometer DOUBLE PRECISION,
  fuel_liters DOUBLE PRECISION,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dispatched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS maintenance (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  cost DOUBLE PRECISION NOT NULL,
  service_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  trip_id TEXT REFERENCES trips(id) ON DELETE SET NULL,
  amount DOUBLE PRECISION NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  liters DOUBLE PRECISION,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  company_name TEXT NOT NULL DEFAULT '',
  depot_name TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'INR',
  distance_unit TEXT NOT NULL DEFAULT 'km',
  fuel_price_per_liter DOUBLE PRECISION NOT NULL DEFAULT 0,
  maintenance_alert_km DOUBLE PRECISION NOT NULL DEFAULT 5000,
  gst_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT ''
);

-- Ensure a single settings row always exists
INSERT INTO settings (id, company_name, depot_name, currency, distance_unit, fuel_price_per_liter, maintenance_alert_km, gst_rate, contact_email, contact_phone)
VALUES (1, 'TransitOps Fleet Solutions', 'Gandhinagar Depot G124', 'INR', 'km', 104.5, 5000, 18, 'support@transitops.in', '+91-79-4000-1234')
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id ON expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id);
