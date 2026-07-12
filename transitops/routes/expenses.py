"""Fuel & expense management.

Fuel logs (liters, cost, date) + other expenses (tolls, misc). The total
operational cost banner is computed automatically as Fuel + Maintenance
(problem statement §3.7).
"""
import csv
import io
from datetime import date

from flask import (
    Blueprint, Response, flash, redirect, render_template, request, url_for,
)

from ..db import execute, query
from ..rbac import require
from ..services import stats

bp = Blueprint("expenses", __name__, url_prefix="/expenses")


@bp.route("/")
@require("fuel")
def index():
    fuel_logs = query(
        """SELECT f.*, v.name AS vehicle_name, v.reg_no, t.code AS trip_code
           FROM fuel_logs f
           JOIN vehicles v ON v.id = f.vehicle_id
           LEFT JOIN trips t ON t.id = f.trip_id
           ORDER BY f.log_date DESC, f.id DESC""")
    expense_rows = query(
        """SELECT e.*, t.code AS trip_code, t.status AS trip_status,
                  v.name AS vehicle_name
           FROM expenses e
           LEFT JOIN trips t ON t.id = e.trip_id
           LEFT JOIN vehicles v ON v.id = e.vehicle_id
           ORDER BY e.expense_date DESC, e.id DESC""")

    # "Maint. (linked)" column: maintenance spend on the same vehicle.
    expenses = []
    for r in expense_rows:
        e = dict(r)
        e["maint_linked"] = 0
        if e["vehicle_id"]:
            row = query(
                "SELECT SUM(cost) AS c FROM maintenance_logs WHERE vehicle_id = ?",
                (e["vehicle_id"],), one=True)
            e["maint_linked"] = row["c"] or 0
        e["total"] = e["toll"] + e["misc"]
        expenses.append(e)

    vehicles = query("SELECT * FROM vehicles WHERE status != 'retired' ORDER BY name")
    trips = query("SELECT id, code, source, destination FROM trips ORDER BY id DESC")
    return render_template(
        "expenses.html", fuel_logs=fuel_logs, expenses=expenses,
        vehicles=vehicles, trips=trips, totals=stats.totals(),
        today=date.today().isoformat(),
    )


@bp.route("/fuel", methods=("POST",))
@require("fuel", "full")
def add_fuel():
    vehicle_id = request.form.get("vehicle_id", type=int)
    liters = float(request.form.get("liters") or 0)
    cost = float(request.form.get("cost") or 0)
    log_date = request.form.get("log_date") or date.today().isoformat()
    trip_id = request.form.get("trip_id", type=int) or None

    if not vehicle_id or liters <= 0:
        flash("Vehicle and a positive liter amount are required.", "error")
    else:
        execute("""INSERT INTO fuel_logs (vehicle_id, trip_id, log_date, liters, cost)
                   VALUES (?,?,?,?,?)""", (vehicle_id, trip_id, log_date, liters, cost))
        flash("Fuel log recorded.", "success")
    return redirect(url_for("expenses.index"))


@bp.route("/other", methods=("POST",))
@require("fuel", "full")
def add_expense():
    trip_id = request.form.get("trip_id", type=int) or None
    toll = float(request.form.get("toll") or 0)
    misc = float(request.form.get("misc") or 0)
    description = request.form.get("description", "").strip() or None
    expense_date = request.form.get("expense_date") or date.today().isoformat()

    vehicle_id = None
    if trip_id:
        t = query("SELECT vehicle_id FROM trips WHERE id = ?", (trip_id,), one=True)
        vehicle_id = t["vehicle_id"] if t else None
    if toll <= 0 and misc <= 0:
        flash("Enter a toll or miscellaneous amount.", "error")
    else:
        execute("""INSERT INTO expenses
                   (trip_id, vehicle_id, expense_date, toll, misc, description)
                   VALUES (?,?,?,?,?,?)""",
                (trip_id, vehicle_id, expense_date, toll, misc, description))
        flash("Expense recorded.", "success")
    return redirect(url_for("expenses.index"))


@bp.route("/export.csv")
@require("fuel")
def export_csv():
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["FUEL LOGS"])
    w.writerow(["Vehicle", "Trip", "Date", "Liters", "Cost"])
    for r in query("""SELECT v.reg_no, t.code, f.log_date, f.liters, f.cost
                      FROM fuel_logs f JOIN vehicles v ON v.id = f.vehicle_id
                      LEFT JOIN trips t ON t.id = f.trip_id ORDER BY f.log_date"""):
        w.writerow(list(r))
    w.writerow([])
    w.writerow(["OTHER EXPENSES"])
    w.writerow(["Trip", "Vehicle", "Date", "Toll", "Misc", "Description"])
    for r in query("""SELECT t.code, v.reg_no, e.expense_date, e.toll, e.misc,
                             e.description
                      FROM expenses e LEFT JOIN trips t ON t.id = e.trip_id
                      LEFT JOIN vehicles v ON v.id = e.vehicle_id
                      ORDER BY e.expense_date"""):
        w.writerow(list(r))
    return Response(buf.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=fuel_expenses.csv"})
