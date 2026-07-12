"""Trip dispatcher API: Draft → Dispatched → Completed / Cancelled.

Automatic status transitions (business rules 6–8):
- Dispatch  : vehicle + driver -> On Trip
- Complete  : vehicle + driver -> Available, odometer updated, fuel logged
- Cancel    : if it was dispatched, vehicle + driver -> Available
"""
import csv
import io
from datetime import date, datetime

from flask import Blueprint, Response, jsonify, request

from ..db import execute, query
from ..rbac import require
from ..services.rules import (
    assignable_drivers, dispatch_pool_vehicles, validate_assignment,
)

bp = Blueprint("trips", __name__, url_prefix="/api/trips")


def _get_trip(trip_id):
    return query(
        """SELECT t.*, v.name AS vehicle_name, v.reg_no, v.capacity_kg,
                  v.odometer AS vehicle_odometer, d.name AS driver_name
           FROM trips t
           LEFT JOIN vehicles v ON v.id = t.vehicle_id
           LEFT JOIN drivers d ON d.id = t.driver_id
           WHERE t.id = ?""", (trip_id,), one=True)


def _board_note(t):
    if t["status"] == "draft":
        if not t["vehicle_id"]:
            return "Awaiting vehicle"
        if not t["driver_id"]:
            return "Awaiting driver"
        return "Ready to dispatch"
    return t["note"] or ""


@bp.get("")
@require("trips")
def index():
    where, args = ["1=1"], []
    if request.args.get("status"):
        where.append("t.status = ?"); args.append(request.args["status"])
    rows = query(
        f"""SELECT t.*, v.name AS vehicle_name, v.reg_no, d.name AS driver_name
            FROM trips t
            LEFT JOIN vehicles v ON v.id = t.vehicle_id
            LEFT JOIN drivers d ON d.id = t.driver_id
            WHERE {' AND '.join(where)}
            ORDER BY CASE t.status WHEN 'dispatched' THEN 0 WHEN 'draft' THEN 1
                     WHEN 'completed' THEN 2 ELSE 3 END, t.id DESC""", args)
    trips = []
    for r in rows:
        t = dict(r)
        t["board_note"] = _board_note(r)
        trips.append(t)
    return jsonify(
        trips=trips,
        vehicles=[dict(v) for v in dispatch_pool_vehicles()],
        drivers=[dict(d) for d in assignable_drivers()],
    )


def _values():
    data = request.get_json(silent=True) or {}

    def num(field):
        raw = data.get(field)
        if raw in (None, ""):
            return None
        return float(raw)

    return {
        "source": (data.get("source") or "").strip(),
        "destination": (data.get("destination") or "").strip(),
        "vehicle_id": int(data["vehicle_id"]) if data.get("vehicle_id") else None,
        "driver_id": int(data["driver_id"]) if data.get("driver_id") else None,
        "cargo_kg": num("cargo_kg"),
        "planned_km": num("planned_km"),
    }, (data.get("action") or "draft")


def _validate(f, for_dispatch):
    vehicle = (query("SELECT * FROM vehicles WHERE id = ?", (f["vehicle_id"],), one=True)
               if f["vehicle_id"] else None)
    driver = (query("SELECT * FROM drivers WHERE id = ?", (f["driver_id"],), one=True)
              if f["driver_id"] else None)
    errors = []
    if not f["source"] or not f["destination"]:
        errors.append("Source and destination are required.")
    errors += validate_assignment(vehicle, driver, f["cargo_kg"],
                                  require_all=for_dispatch)
    return errors, vehicle, driver


def _dispatch(trip_id, vehicle, driver):
    now = datetime.now().isoformat(timespec="seconds")
    execute("""UPDATE trips SET status='dispatched', dispatched_at=?,
               start_odometer=? WHERE id=?""", (now, vehicle["odometer"], trip_id))
    # Rule 6: both statuses flip to On Trip automatically.
    execute("UPDATE vehicles SET status='on_trip' WHERE id=?", (vehicle["id"],))
    execute("UPDATE drivers SET status='on_trip' WHERE id=?", (driver["id"],))


@bp.post("")
@require("trips", "full")
def create():
    f, action = _values()
    for_dispatch = action == "dispatch"
    errors, vehicle, driver = _validate(f, for_dispatch)
    if errors:
        return jsonify(errors=errors), 400

    trip_id = execute(
        """INSERT INTO trips (code, source, destination, vehicle_id, driver_id,
           cargo_kg, planned_km) VALUES (NULL,?,?,?,?,?,?)""",
        (f["source"], f["destination"], f["vehicle_id"], f["driver_id"],
         f["cargo_kg"], f["planned_km"]))
    execute("UPDATE trips SET code = printf('TR%03d', id) WHERE id = ?", (trip_id,))

    if for_dispatch:
        _dispatch(trip_id, vehicle, driver)
        return jsonify(message=f"Trip TR{trip_id:03d} dispatched — "
                               f"{vehicle['name']} and {driver['name']} are now "
                               "On Trip.", id=trip_id), 201
    return jsonify(message=f"Trip TR{trip_id:03d} saved as draft.", id=trip_id), 201


@bp.put("/<int:trip_id>")
@require("trips", "full")
def update(trip_id):
    trip = _get_trip(trip_id)
    if trip is None:
        return jsonify(error="Trip not found."), 404
    if trip["status"] != "draft":
        return jsonify(error="Only draft trips can be edited."), 409
    f, action = _values()
    errors, vehicle, driver = _validate(f, action == "dispatch")
    if errors:
        return jsonify(errors=errors), 400
    execute("""UPDATE trips SET source=?, destination=?, vehicle_id=?, driver_id=?,
               cargo_kg=?, planned_km=? WHERE id=?""",
            (f["source"], f["destination"], f["vehicle_id"], f["driver_id"],
             f["cargo_kg"], f["planned_km"], trip_id))
    if action == "dispatch":
        _dispatch(trip_id, vehicle, driver)
        return jsonify(message=f"Trip {trip['code']} dispatched.")
    return jsonify(message=f"Trip {trip['code']} updated.")


@bp.post("/<int:trip_id>/dispatch")
@require("trips", "full")
def dispatch(trip_id):
    trip = _get_trip(trip_id)
    if trip is None:
        return jsonify(error="Trip not found."), 404
    if trip["status"] != "draft":
        return jsonify(error="Only draft trips can be dispatched."), 409
    vehicle = (query("SELECT * FROM vehicles WHERE id=?", (trip["vehicle_id"],), one=True)
               if trip["vehicle_id"] else None)
    driver = (query("SELECT * FROM drivers WHERE id=?", (trip["driver_id"],), one=True)
              if trip["driver_id"] else None)
    errors = validate_assignment(vehicle, driver, trip["cargo_kg"], require_all=True)
    if errors:
        return jsonify(errors=errors), 400
    _dispatch(trip_id, vehicle, driver)
    return jsonify(message=f"Trip {trip['code']} dispatched — {vehicle['name']} "
                           f"and {driver['name']} are now On Trip.")


@bp.post("/<int:trip_id>/complete")
@require("trips", "full")
def complete(trip_id):
    trip = _get_trip(trip_id)
    if trip is None:
        return jsonify(error="Trip not found."), 404
    if trip["status"] != "dispatched":
        return jsonify(error="Only dispatched trips can be completed."), 409

    data = request.get_json(silent=True) or {}
    end_odo = float(data.get("end_odometer") or 0)
    liters = float(data.get("fuel_liters") or 0)
    fuel_cost = float(data.get("fuel_cost") or 0)
    revenue = float(data.get("revenue") or 0)
    start = trip["start_odometer"] or trip["vehicle_odometer"] or 0

    if end_odo < start:
        return jsonify(error=f"Final odometer ({end_odo:g}) cannot be less than "
                             f"the start reading ({start:g})."), 400

    now = datetime.now().isoformat(timespec="seconds")
    execute("""UPDATE trips SET status='completed', completed_at=?, end_odometer=?,
               fuel_liters=?, revenue=? WHERE id=?""",
            (now, end_odo, liters, revenue, trip_id))
    # Rule 7: statuses restore automatically, odometer rolls forward.
    execute("UPDATE vehicles SET status='available', odometer=? WHERE id=?",
            (end_odo, trip["vehicle_id"]))
    execute("""UPDATE drivers SET status='available',
               trips_completed = trips_completed + 1 WHERE id=?""",
            (trip["driver_id"],))
    if liters or fuel_cost:
        execute("""INSERT INTO fuel_logs (vehicle_id, trip_id, log_date, liters, cost)
                   VALUES (?,?,?,?,?)""",
                (trip["vehicle_id"], trip_id, date.today().isoformat(),
                 liters, fuel_cost))
    return jsonify(message=f"Trip {trip['code']} completed — vehicle and driver "
                           "are Available again; fuel log recorded.")


@bp.post("/<int:trip_id>/cancel")
@require("trips", "full")
def cancel(trip_id):
    trip = _get_trip(trip_id)
    if trip is None:
        return jsonify(error="Trip not found."), 404
    if trip["status"] not in ("draft", "dispatched"):
        return jsonify(error="Completed trips cannot be cancelled."), 409
    data = request.get_json(silent=True) or {}
    reason = (data.get("reason") or "").strip() or None
    was_dispatched = trip["status"] == "dispatched"
    execute("UPDATE trips SET status='cancelled', note=? WHERE id=?",
            (reason, trip_id))
    if was_dispatched:
        # Rule 8: cancelling a dispatched trip frees both resources.
        execute("UPDATE vehicles SET status='available' WHERE id=?",
                (trip["vehicle_id"],))
        execute("UPDATE drivers SET status='available' WHERE id=?",
                (trip["driver_id"],))
    return jsonify(message=f"Trip {trip['code']} cancelled."
                   + (" Vehicle and driver restored to Available."
                      if was_dispatched else ""))


@bp.get("/export.csv")
@require("trips")
def export_csv():
    rows = query(
        """SELECT t.code, t.source, t.destination, v.reg_no, d.name AS driver,
                  t.cargo_kg, t.planned_km, t.status, t.revenue,
                  t.start_odometer, t.end_odometer, t.fuel_liters
           FROM trips t
           LEFT JOIN vehicles v ON v.id = t.vehicle_id
           LEFT JOIN drivers d ON d.id = t.driver_id ORDER BY t.id""")
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Trip", "Source", "Destination", "Vehicle", "Driver", "Cargo (kg)",
                "Planned (km)", "Status", "Revenue", "Start Odo", "End Odo", "Fuel (L)"])
    for r in rows:
        w.writerow(list(r))
    return Response(buf.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=trips.csv"})
