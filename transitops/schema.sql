PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS fuel_logs;
DROP TABLE IF EXISTS maintenance_logs;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS app_settings;

CREATE TABLE users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL CHECK (role IN
                        ('fleet_manager','dispatcher','safety_officer','financial_analyst')),
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked          INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE vehicles (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    reg_no           TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name             TEXT NOT NULL,
    type             TEXT NOT NULL,
    capacity_kg      REAL NOT NULL,
    odometer         REAL NOT NULL DEFAULT 0,
    acquisition_cost REAL NOT NULL DEFAULT 0,
    region           TEXT NOT NULL DEFAULT 'Ahmedabad',
    status           TEXT NOT NULL DEFAULT 'available' CHECK (status IN
                         ('available','on_trip','in_shop','retired'))
);

CREATE TABLE drivers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    license_no      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    category        TEXT NOT NULL,
    license_expiry  TEXT NOT NULL,          -- ISO date
    contact         TEXT NOT NULL DEFAULT '',
    safety_score    INTEGER NOT NULL DEFAULT 100,
    trips_completed INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'available' CHECK (status IN
                        ('available','on_trip','off_duty','suspended'))
);

CREATE TABLE trips (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    code           TEXT UNIQUE,
    source         TEXT NOT NULL,
    destination    TEXT NOT NULL,
    vehicle_id     INTEGER REFERENCES vehicles(id),
    driver_id      INTEGER REFERENCES drivers(id),
    cargo_kg       REAL,
    planned_km     REAL,
    revenue        REAL NOT NULL DEFAULT 0,
    status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN
                       ('draft','dispatched','completed','cancelled')),
    note           TEXT,
    start_odometer REAL,
    end_odometer   REAL,
    fuel_liters    REAL,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    dispatched_at  TEXT,
    completed_at   TEXT
);

CREATE TABLE maintenance_logs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id   INTEGER NOT NULL REFERENCES vehicles(id),
    service_type TEXT NOT NULL,
    cost         REAL NOT NULL DEFAULT 0,
    service_date TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed')),
    notes        TEXT
);

CREATE TABLE fuel_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    trip_id    INTEGER REFERENCES trips(id),
    log_date   TEXT NOT NULL,
    liters     REAL NOT NULL,
    cost       REAL NOT NULL
);

CREATE TABLE expenses (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id      INTEGER REFERENCES trips(id),
    vehicle_id   INTEGER REFERENCES vehicles(id),
    expense_date TEXT NOT NULL,
    toll         REAL NOT NULL DEFAULT 0,
    misc         REAL NOT NULL DEFAULT 0,
    description  TEXT
);

CREATE TABLE app_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
