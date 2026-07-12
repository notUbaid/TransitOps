"""Demo data matching the Excalidraw wireframe (vehicles, drivers, trips, logs).

Login accounts (password for all: transit123):
    meera.f@transitops.in   -> Fleet Manager
    raven.k@transitops.in   -> Dispatcher
    sana.s@transitops.in    -> Safety Officer
    farhan.a@transitops.in  -> Financial Analyst
"""
from werkzeug.security import generate_password_hash

from .db import execute

PASSWORD = "transit123"


def seed():
    pw = generate_password_hash(PASSWORD)
    users = [
        ("Meera F.", "meera.f@transitops.in", "fleet_manager"),
        ("Raven K.", "raven.k@transitops.in", "dispatcher"),
        ("Sana S.", "sana.s@transitops.in", "safety_officer"),
        ("Farhan A.", "farhan.a@transitops.in", "financial_analyst"),
    ]
    for name, email, role in users:
        execute("INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)",
                (name, email, pw, role))

    vehicles = [
        # reg_no, name, type, capacity, odometer, acq cost, region, status
        ("GJ01AB4521", "VAN-05", "Van", 500, 74000, 620000, "Gandhinagar", "available"),
        ("GJ01AB9981", "TRUCK-11", "Truck", 5000, 182000, 2450000, "Ahmedabad", "on_trip"),
        ("GJ01AB1120", "MINI-03", "Mini", 1000, 66000, 410000, "Ahmedabad", "in_shop"),
        ("GJ01AB0087", "VAN-09", "Van", 750, 241900, 590000, "Rajkot", "retired"),
        ("GJ01AB7712", "TRUCK-04", "Truck", 4500, 98500, 2100000, "Sanand", "available"),
        ("GJ01AB3345", "TRK-12", "Truck", 6000, 210300, 2900000, "Vatva", "available"),
        ("GJ01AB5566", "MINI-08", "Mini", 900, 45200, 380000, "Kalol", "available"),
    ]
    for v in vehicles:
        execute("""INSERT INTO vehicles (reg_no, name, type, capacity_kg, odometer,
                   acquisition_cost, region, status) VALUES (?,?,?,?,?,?,?,?)""", v)

    drivers = [
        # name, license_no, category, expiry, contact, safety, completed, status
        ("Alex", "DL-88213", "LMV", "2028-12-15", "9876543210", 96, 142, "available"),
        ("John", "DL-44120", "HMV", "2025-03-20", "9822011223", 81, 88, "suspended"),
        ("Priya", "DL-77031", "LMV", "2027-08-10", "9911044556", 99, 203, "on_trip"),
        ("Suresh", "DL-90045", "HMV", "2027-01-05", "9744088990", 88, 156, "off_duty"),
        ("Meena", "DL-51877", "HMV", "2026-08-02", "9633022110", 92, 74, "available"),
    ]
    for d in drivers:
        execute("""INSERT INTO drivers (name, license_no, category, license_expiry,
                   contact, safety_score, trips_completed, status)
                   VALUES (?,?,?,?,?,?,?,?)""", d)

    # Vehicle ids: 1 VAN-05, 2 TRUCK-11, 3 MINI-03, 4 VAN-09, 5 TRUCK-04,
    #              6 TRK-12, 7 MINI-08
    # Driver ids:  1 Alex, 2 John, 3 Priya, 4 Suresh, 5 Meena
    trips = [
        # source, dest, vehicle, driver, cargo, km, revenue, status, note,
        # start_odo, end_odo, fuel_l, created, dispatched, completed
        ("Gandhinagar Depot", "Ahmedabad Hub", 1, 1, 450, 38, 5200, "completed",
         None, 73962, 74000, 5, "2026-07-08 08:10", "2026-07-08 09:00",
         "2026-07-08 12:40"),
        ("Ahmedabad Hub", "Vatva Industrial Area", 6, 4, 3200, 26, 9800, "completed",
         None, 210274, 210300, 9, "2026-07-09 07:30", "2026-07-09 08:05",
         "2026-07-09 11:15"),
        ("Ahmedabad Hub", "Sanand Warehouse", 2, 3, 4200, 52, 14500, "dispatched",
         None, 182000, None, None, "2026-07-12 06:50", "2026-07-12 07:30", None),
        ("Vatva Industrial Area", "Sanand Warehouse", 5, None, 2800, 41, 0, "draft",
         None, None, None, None, "2026-07-12 08:20", None, None),
        (" Mehsana Depot", "Kalol Depot", None, None, 350, 29, 0, "draft",
         None, None, None, None, "2026-07-12 09:05", None, None),
        ("Mansa", "Kalol Depot", 3, None, 600, 33, 0, "cancelled",
         "Vehicle went to shop", None, None, None, "2026-07-10 10:00", None, None),
        # History for the monthly revenue chart
        ("Gandhinagar Depot", "Rajkot Hub", 6, 4, 4100, 216, 32000, "completed",
         None, 208000, 208216, 61, "2026-02-11 06:00", "2026-02-11 06:40",
         "2026-02-11 14:20"),
        ("Ahmedabad Hub", "Surat Depot", 2, 3, 3900, 265, 41000, "completed",
         None, 180900, 181165, 78, "2026-03-14 05:30", "2026-03-14 06:10",
         "2026-03-14 15:00"),
        ("Sanand Warehouse", "Vadodara Hub", 5, 1, 2600, 148, 24500, "completed",
         None, 98120, 98268, 40, "2026-04-09 07:00", "2026-04-09 07:35",
         "2026-04-09 12:30"),
        ("Kalol Depot", "Ahmedabad Hub", 7, 5, 700, 42, 8200, "completed",
         None, 44980, 45022, 6, "2026-05-18 08:15", "2026-05-18 08:50",
         "2026-05-18 11:00"),
        ("Gandhinagar Depot", "Bhavnagar Depot", 6, 4, 5200, 198, 36500, "completed",
         None, 209800, 209998, 57, "2026-06-21 05:45", "2026-06-21 06:20",
         "2026-06-21 13:40"),
    ]
    for t in trips:
        trip_id = execute(
            """INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_kg,
               planned_km, revenue, status, note, start_odometer, end_odometer,
               fuel_liters, created_at, dispatched_at, completed_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (t[0].strip(),) + t[1:])
        execute("UPDATE trips SET code = printf('TR%03d', id) WHERE id = ?", (trip_id,))

    fuel_logs = [
        # vehicle, trip, date, liters, cost
        (1, 1, "2026-07-08", 5, 480),        # TR001 completion refuel
        (6, 2, "2026-07-09", 9, 830),        # TR002
        (1, None, "2026-07-05", 42, 3150),   # standalone refuels from the wireframe
        (2, None, "2026-07-06", 110, 8400),
        (7, None, "2026-07-06", 28, 2050),
        (6, 7, "2026-02-11", 61, 5400),
        (2, 8, "2026-03-14", 78, 7050),
        (5, 9, "2026-04-09", 40, 3600),
        (7, 10, "2026-05-18", 6, 540),
        (6, 11, "2026-06-21", 57, 5150),
    ]
    for f in fuel_logs:
        execute("""INSERT INTO fuel_logs (vehicle_id, trip_id, log_date, liters, cost)
                   VALUES (?,?,?,?,?)""", f)

    maintenance = [
        # vehicle, service, cost, date, status, notes
        (3, "Tyre Replace", 6200, "2026-07-10", "active", "Front axle pair worn out"),
        (2, "Engine Repair", 18000, "2026-06-28", "completed", "Injector overhaul"),
        (1, "Oil Change", 2500, "2026-07-07", "completed", None),
    ]
    for m in maintenance:
        execute("""INSERT INTO maintenance_logs
                   (vehicle_id, service_type, cost, service_date, status, notes)
                   VALUES (?,?,?,?,?,?)""", m)

    expenses = [
        # trip, vehicle, date, toll, misc, description
        (1, 1, "2026-07-08", 120, 0, "GNR-AMD toll plaza"),
        (2, 6, "2026-07-09", 340, 150, "Toll + loading labour"),
        (8, 2, "2026-03-14", 640, 200, "Expressway toll + parking"),
    ]
    for e in expenses:
        execute("""INSERT INTO expenses
                   (trip_id, vehicle_id, expense_date, toll, misc, description)
                   VALUES (?,?,?,?,?,?)""", e)

    settings = [
        ("depot_name", "Gandhinagar Depot GJ4"),
        ("currency", "INR (Rs)"),
        ("distance_unit", "Kilometers"),
    ]
    for k, v in settings:
        execute("INSERT INTO app_settings (key, value) VALUES (?,?)", (k, v))
