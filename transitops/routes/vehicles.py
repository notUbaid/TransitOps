import csv
import io

from flask import Blueprint, Response, jsonify, request

from ..db import execute, query
from ..rbac import require

bp = Blueprint("vehicles", __name__, url_prefix="/api/vehicles")

VEHICLE_TYPES = ["Van", "Truck", "Mini", "Bus", "Trailer"]


def _payload():
    data = request.get_json(silent=True) or {}
    return {
        "reg_no": (data.get("reg_no") or "").strip().upper(),
        "name": (data.get("name") or "").strip(),
        "type": data.get("type") or "Van",
        "capacity_kg": float(data.get("capacity_kg") or 0),
        "odometer": float(data.get("odometer") or 0),
        "acquisition_cost": float(data.get("acquisition_cost") or 0),
        "region": (data.get("region") or "").strip() or "Ahmedabad",
    }


def _reg_no_taken(reg_no, exclude_id=None):
    """Business rule 1: registration number must be unique (case-insensitive)."""
    row = query("SELECT id FROM vehicles WHERE reg_no = ? COLLATE NOCASE",
                (reg_no,), one=True)
    return row is not None and row["id"] != exclude_id


@bp.get("")
@require("fleet")
def index():
    where, args = ["1=1"], []
    if request.args.get("type"):
        where.append("type = ?"); args.append(request.args["type"])
    if request.args.get("status"):
        where.append("status = ?"); args.append(request.args["status"])
    q = request.args.get("q", "").strip()
    if q:
        where.append("(reg_no LIKE ? OR name LIKE ?)")
        args += [f"%{q}%", f"%{q}%"]
    rows = query(
        f"SELECT * FROM vehicles WHERE {' AND '.join(where)} ORDER BY reg_no", args)
    return jsonify(vehicles=[dict(r) for r in rows], types=VEHICLE_TYPES)


@bp.post("")
@require("fleet", "full")
def create():
    v = _payload()
    if not v["reg_no"] or not v["name"] or v["capacity_kg"] <= 0:
        return jsonify(error="Registration number, name and a positive capacity "
                             "are required."), 400
    if _reg_no_taken(v["reg_no"]):
        return jsonify(error=f"Registration number {v['reg_no']} already exists "
                             "— must be unique."), 409
    vehicle_id = execute(
        """INSERT INTO vehicles
           (reg_no, name, type, capacity_kg, odometer, acquisition_cost, region)
           VALUES (?,?,?,?,?,?,?)""",
        (v["reg_no"], v["name"], v["type"], v["capacity_kg"], v["odometer"],
         v["acquisition_cost"], v["region"]))
    return jsonify(message=f"Vehicle {v['name']} ({v['reg_no']}) registered.",
                   id=vehicle_id), 201


@bp.put("/<int:vehicle_id>")
@require("fleet", "full")
def update(vehicle_id):
    v = _payload()
    if _reg_no_taken(v["reg_no"], exclude_id=vehicle_id):
        return jsonify(error=f"Registration number {v['reg_no']} already exists "
                             "— must be unique."), 409
    execute(
        """UPDATE vehicles SET reg_no=?, name=?, type=?, capacity_kg=?, odometer=?,
           acquisition_cost=?, region=? WHERE id=?""",
        (v["reg_no"], v["name"], v["type"], v["capacity_kg"], v["odometer"],
         v["acquisition_cost"], v["region"], vehicle_id))
    return jsonify(message="Vehicle updated.")


@bp.post("/<int:vehicle_id>/retire")
@require("fleet", "full")
def retire(vehicle_id):
    v = query("SELECT * FROM vehicles WHERE id = ?", (vehicle_id,), one=True)
    if v is None:
        return jsonify(error="Vehicle not found."), 404
    if v["status"] == "on_trip":
        return jsonify(error="Cannot retire a vehicle that is on a trip."), 409
    execute("UPDATE vehicles SET status = 'retired' WHERE id = ?", (vehicle_id,))
    return jsonify(message=f"{v['name']} retired — it will no longer appear "
                           "in dispatch.")


@bp.post("/<int:vehicle_id>/reactivate")
@require("fleet", "full")
def reactivate(vehicle_id):
    v = query("SELECT * FROM vehicles WHERE id = ?", (vehicle_id,), one=True)
    if v is None or v["status"] != "retired":
        return jsonify(error="Only retired vehicles can be reactivated."), 409
    active = query(
        "SELECT 1 FROM maintenance_logs WHERE vehicle_id = ? AND status = 'active' "
        "LIMIT 1", (vehicle_id,), one=True)
    execute("UPDATE vehicles SET status = ? WHERE id = ?",
            ("in_shop" if active else "available", vehicle_id))
    return jsonify(message=f"{v['name']} reactivated.")


@bp.get("/export.csv")
@require("fleet")
def export_csv():
    rows = query("SELECT * FROM vehicles ORDER BY reg_no")
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Reg No", "Name", "Type", "Capacity (kg)", "Odometer",
                "Acquisition Cost", "Region", "Status"])
    for r in rows:
        w.writerow([r["reg_no"], r["name"], r["type"], r["capacity_kg"],
                    r["odometer"], r["acquisition_cost"], r["region"], r["status"]])
    return Response(buf.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=vehicles.csv"})
