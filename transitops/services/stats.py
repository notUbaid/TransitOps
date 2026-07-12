"""KPI and analytics computations (dashboard + reports).

Definitions:
- Active vehicles      : every vehicle that is not Retired.
- Fleet utilization    : On Trip / active vehicles (%).
- Fuel efficiency      : actual km driven on completed trips / liters fueled
                         on trip-linked fuel logs (km/l).
- Operational cost     : total fuel cost + total maintenance cost (per PDF §3.7).
- Vehicle ROI          : (revenue − (maintenance + fuel)) / acquisition cost.
"""
from ..db import query


def _one(sql, args=()):
    row = query(sql, args, one=True)
    return (row[0] if row and row[0] is not None else 0)


def dashboard_kpis(vtype=None, status=None, region=None):
    where, args = ["1=1"], []
    if vtype:
        where.append("type = ?"); args.append(vtype)
    if region:
        where.append("region = ?"); args.append(region)
    if status:
        where.append("status = ?"); args.append(status)
    w = " AND ".join(where)

    active = _one(f"SELECT COUNT(*) FROM vehicles WHERE {w} AND status != 'retired'", args)
    available = _one(f"SELECT COUNT(*) FROM vehicles WHERE {w} AND status = 'available'", args)
    in_shop = _one(f"SELECT COUNT(*) FROM vehicles WHERE {w} AND status = 'in_shop'", args)
    on_trip = _one(f"SELECT COUNT(*) FROM vehicles WHERE {w} AND status = 'on_trip'", args)

    return {
        "active_vehicles": active,
        "available_vehicles": available,
        "in_maintenance": in_shop,
        "active_trips": _one("SELECT COUNT(*) FROM trips WHERE status = 'dispatched'"),
        "pending_trips": _one("SELECT COUNT(*) FROM trips WHERE status = 'draft'"),
        "drivers_on_duty": _one(
            "SELECT COUNT(*) FROM drivers WHERE status IN ('available','on_trip')"),
        "utilization": round(100 * on_trip / active) if active else 0,
    }


def status_breakdown():
    rows = query("SELECT status, COUNT(*) AS n FROM vehicles GROUP BY status")
    counts = {r["status"]: r["n"] for r in rows}
    return [(s, counts.get(s, 0))
            for s in ("available", "on_trip", "in_shop", "retired")]


def recent_trips(limit=6, avg_speed=40):
    rows = query(
        """SELECT t.*, v.name AS vehicle_name, d.name AS driver_name
           FROM trips t
           LEFT JOIN vehicles v ON v.id = t.vehicle_id
           LEFT JOIN drivers d ON d.id = t.driver_id
           ORDER BY t.created_at DESC, t.id DESC LIMIT ?""", (limit,))
    trips = []
    for r in rows:
        t = dict(r)
        if t["status"] == "dispatched" and t["planned_km"]:
            t["eta"] = f"{int(t['planned_km'] / avg_speed * 60)} min"
        elif t["status"] == "draft":
            t["eta"] = ("Awaiting vehicle" if not t["vehicle_id"]
                        else "Awaiting driver" if not t["driver_id"] else "Ready")
        else:
            t["eta"] = "—"
        trips.append(t)
    return trips


def totals():
    fuel = _one("SELECT SUM(cost) FROM fuel_logs")
    maintenance = _one("SELECT SUM(cost) FROM maintenance_logs")
    tolls = _one("SELECT SUM(toll + misc) FROM expenses")
    return {
        "fuel": fuel,
        "maintenance": maintenance,
        "tolls_misc": tolls,
        "operational": fuel + maintenance,   # PDF §3.7: Fuel + Maintenance
    }


def fleet_analytics():
    """Per-vehicle analytics table + fleet-level rollups."""
    vehicles = query("SELECT * FROM vehicles ORDER BY name")
    per_vehicle, f_dist, f_liters, f_fuel_cost, f_maint, f_rev, f_acq = [], 0, 0, 0, 0, 0, 0

    for v in vehicles:
        dist = _one(
            """SELECT SUM(COALESCE(end_odometer - start_odometer, planned_km, 0))
               FROM trips WHERE vehicle_id = ? AND status = 'completed'""", (v["id"],))
        liters_trip = _one(
            "SELECT SUM(liters) FROM fuel_logs WHERE vehicle_id = ? AND trip_id IS NOT NULL",
            (v["id"],))
        fuel_cost = _one("SELECT SUM(cost) FROM fuel_logs WHERE vehicle_id = ?", (v["id"],))
        maint = _one("SELECT SUM(cost) FROM maintenance_logs WHERE vehicle_id = ?", (v["id"],))
        revenue = _one(
            "SELECT SUM(revenue) FROM trips WHERE vehicle_id = ? AND status = 'completed'",
            (v["id"],))
        op_cost = fuel_cost + maint
        roi = (100 * (revenue - op_cost) / v["acquisition_cost"]
               if v["acquisition_cost"] else 0)
        eff = dist / liters_trip if liters_trip else 0

        per_vehicle.append({
            "vehicle": v, "distance": dist, "liters": liters_trip,
            "fuel_cost": fuel_cost, "maintenance": maint, "op_cost": op_cost,
            "revenue": revenue, "roi": round(roi, 1), "efficiency": round(eff, 1),
        })
        f_dist += dist; f_liters += liters_trip or 0; f_fuel_cost += fuel_cost
        f_maint += maint; f_rev += revenue
        if v["status"] != "retired":
            f_acq += v["acquisition_cost"]

    active = _one("SELECT COUNT(*) FROM vehicles WHERE status != 'retired'")
    on_trip = _one("SELECT COUNT(*) FROM vehicles WHERE status = 'on_trip'")
    fleet = {
        "efficiency": round(f_dist / f_liters, 1) if f_liters else 0,
        "utilization": round(100 * on_trip / active) if active else 0,
        "op_cost": f_fuel_cost + f_maint,
        "roi": round(100 * (f_rev - (f_fuel_cost + f_maint)) / f_acq, 1) if f_acq else 0,
        "revenue": f_rev,
    }
    return per_vehicle, fleet


def monthly_revenue(months=6):
    rows = query(
        """SELECT substr(completed_at, 1, 7) AS month, SUM(revenue) AS revenue
           FROM trips WHERE status = 'completed' AND completed_at IS NOT NULL
           GROUP BY month ORDER BY month DESC LIMIT ?""", (months,))
    return list(reversed([dict(r) for r in rows]))


def top_cost_vehicles(limit=3):
    per_vehicle, _ = fleet_analytics()
    ranked = sorted(per_vehicle, key=lambda r: r["op_cost"], reverse=True)
    return [r for r in ranked if r["op_cost"] > 0][:limit]
