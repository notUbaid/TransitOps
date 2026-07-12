import csv
import io

from flask import Blueprint, Response, jsonify, request

from ..db import execute, query
from ..rbac import require
from ..services import reminders
from ..services.rules import license_expired, license_expiring_soon

bp = Blueprint("drivers", __name__, url_prefix="/api/drivers")

LICENSE_CATEGORIES = ["LMV", "HMV", "Trailer", "Hazmat"]
# On Trip is system-managed (set by dispatch/complete), never toggled by hand.
TOGGLEABLE_STATUSES = ["available", "off_duty", "suspended"]


def _payload():
    data = request.get_json(silent=True) or {}
    return {
        "name": (data.get("name") or "").strip(),
        "license_no": (data.get("license_no") or "").strip().upper(),
        "category": data.get("category") or "LMV",
        "license_expiry": data.get("license_expiry") or "",
        "contact": (data.get("contact") or "").strip(),
        "safety_score": int(data.get("safety_score") or 100),
    }


@bp.get("")
@require("drivers")
def index():
    where, args = ["1=1"], []
    if request.args.get("status"):
        where.append("status = ?"); args.append(request.args["status"])
    q = request.args.get("q", "").strip()
    if q:
        where.append("(name LIKE ? OR license_no LIKE ?)")
        args += [f"%{q}%", f"%{q}%"]
    rows = query(f"SELECT * FROM drivers WHERE {' AND '.join(where)} ORDER BY name",
                 args)
    drivers = []
    for r in rows:
        d = dict(r)
        d["expired"] = license_expired(r)
        d["expiring_soon"] = license_expiring_soon(r)
        drivers.append(d)
    return jsonify(
        drivers=drivers,
        categories=LICENSE_CATEGORIES,
        toggleable=TOGGLEABLE_STATUSES,
        expiring=[dict(r) for r in reminders.expiring_licenses()],
    )


@bp.post("")
@require("drivers", "full")
def create():
    d = _payload()
    if not d["name"] or not d["license_no"] or not d["license_expiry"]:
        return jsonify(error="Name, license number and license expiry are "
                             "required."), 400
    if query("SELECT 1 FROM drivers WHERE license_no = ?", (d["license_no"],), one=True):
        return jsonify(error=f"License number {d['license_no']} is already "
                             "registered."), 409
    driver_id = execute(
        """INSERT INTO drivers
           (name, license_no, category, license_expiry, contact, safety_score)
           VALUES (?,?,?,?,?,?)""",
        (d["name"], d["license_no"], d["category"], d["license_expiry"],
         d["contact"], d["safety_score"]))
    return jsonify(message=f"Driver {d['name']} added.", id=driver_id), 201


@bp.put("/<int:driver_id>")
@require("drivers", "full")
def update(driver_id):
    d = _payload()
    clash = query("SELECT id FROM drivers WHERE license_no = ?",
                  (d["license_no"],), one=True)
    if clash and clash["id"] != driver_id:
        return jsonify(error=f"License number {d['license_no']} is already "
                             "registered."), 409
    execute(
        """UPDATE drivers SET name=?, license_no=?, category=?, license_expiry=?,
           contact=?, safety_score=? WHERE id=?""",
        (d["name"], d["license_no"], d["category"], d["license_expiry"],
         d["contact"], d["safety_score"], driver_id))
    return jsonify(message="Driver profile updated.")


@bp.post("/<int:driver_id>/status")
@require("drivers", "full")
def set_status(driver_id):
    data = request.get_json(silent=True) or {}
    new_status = data.get("status") or ""
    driver = query("SELECT * FROM drivers WHERE id = ?", (driver_id,), one=True)
    if driver is None:
        return jsonify(error="Driver not found."), 404
    if new_status not in TOGGLEABLE_STATUSES:
        return jsonify(error="On Trip status is managed automatically by "
                             "dispatch."), 400
    if driver["status"] == "on_trip":
        return jsonify(error=f"{driver['name']} is on an active trip — complete "
                             "or cancel the trip first."), 409
    execute("UPDATE drivers SET status = ? WHERE id = ?", (new_status, driver_id))
    return jsonify(message=f"{driver['name']} marked "
                           f"{new_status.replace('_', ' ').title()}.")


@bp.post("/send-reminders")
@require("drivers", "full")
def send_reminders():
    n = reminders.send_reminders()
    return jsonify(message=f"License reminder emails queued for {n} driver(s). "
                           "(Mock mailer — see server log.)")


@bp.get("/export.csv")
@require("drivers")
def export_csv():
    rows = query("SELECT * FROM drivers ORDER BY name")
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Name", "License No", "Category", "License Expiry", "Contact",
                "Safety Score", "Trips Completed", "Status"])
    for r in rows:
        w.writerow([r["name"], r["license_no"], r["category"], r["license_expiry"],
                    r["contact"], r["safety_score"], r["trips_completed"], r["status"]])
    return Response(buf.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=drivers.csv"})
