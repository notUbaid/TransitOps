"""Maintenance workflow API.

Business rules 9 & 10: creating an active maintenance record puts the vehicle
In Shop (removing it from the dispatch pool); closing the record restores it
to Available unless the vehicle is retired.
"""
from flask import Blueprint, jsonify, request

from ..db import execute, query
from ..rbac import require

bp = Blueprint("maintenance", __name__, url_prefix="/api/maintenance")

SERVICE_TYPES = ["Oil Change", "Engine Repair", "Tyre Replace", "Brake Service",
                 "Battery Replace", "General Service", "Body Work"]


@bp.get("")
@require("maintenance")
def index():
    logs = query(
        """SELECT m.*, v.name AS vehicle_name, v.reg_no, v.status AS vehicle_status
           FROM maintenance_logs m JOIN vehicles v ON v.id = m.vehicle_id
           ORDER BY m.status = 'completed', m.service_date DESC, m.id DESC""")
    vehicles = query(
        "SELECT * FROM vehicles WHERE status IN ('available','in_shop') ORDER BY name")
    return jsonify(
        logs=[dict(r) for r in logs],
        vehicles=[dict(v) for v in vehicles],
        service_types=SERVICE_TYPES,
    )


@bp.post("")
@require("maintenance", "full")
def create():
    data = request.get_json(silent=True) or {}
    vehicle_id = int(data["vehicle_id"]) if data.get("vehicle_id") else None
    service_type = (data.get("service_type") or "").strip()
    cost = float(data.get("cost") or 0)
    service_date = data.get("service_date") or ""
    notes = (data.get("notes") or "").strip() or None

    vehicle = (query("SELECT * FROM vehicles WHERE id = ?", (vehicle_id,), one=True)
               if vehicle_id else None)
    if vehicle is None or not service_type or not service_date:
        return jsonify(error="Vehicle, service type and date are required."), 400
    if vehicle["status"] == "on_trip":
        return jsonify(error=f"{vehicle['name']} is on a trip — complete the trip "
                             "before sending it to the shop."), 409
    if vehicle["status"] == "retired":
        return jsonify(error="Retired vehicles cannot receive new maintenance "
                             "records."), 409

    log_id = execute(
        """INSERT INTO maintenance_logs
           (vehicle_id, service_type, cost, service_date, notes)
           VALUES (?,?,?,?,?)""",
        (vehicle_id, service_type, cost, service_date, notes))
    # Rule 9: the vehicle drops out of the dispatch pool immediately.
    execute("UPDATE vehicles SET status = 'in_shop' WHERE id = ?", (vehicle_id,))
    return jsonify(message=f"{vehicle['name']} logged for {service_type} — status "
                           "is now In Shop and it is hidden from dispatch.",
                   id=log_id), 201


@bp.post("/<int:log_id>/close")
@require("maintenance", "full")
def close(log_id):
    log = query("SELECT * FROM maintenance_logs WHERE id = ?", (log_id,), one=True)
    if log is None or log["status"] == "completed":
        return jsonify(error="This maintenance record is already closed."), 409

    execute("UPDATE maintenance_logs SET status = 'completed' WHERE id = ?", (log_id,))
    vehicle = query("SELECT * FROM vehicles WHERE id = ?", (log["vehicle_id"],),
                    one=True)
    other_active = query(
        """SELECT 1 FROM maintenance_logs
           WHERE vehicle_id = ? AND status = 'active' AND id != ? LIMIT 1""",
        (log["vehicle_id"], log_id), one=True)

    # Rule 10: restore to Available unless retired (or still in another service).
    if vehicle["status"] != "retired" and not other_active:
        execute("UPDATE vehicles SET status = 'available' WHERE id = ?",
                (log["vehicle_id"],))
        return jsonify(message=f"Service closed — {vehicle['name']} is Available "
                               "again.")
    return jsonify(message="Service closed.")
