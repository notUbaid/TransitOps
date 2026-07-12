import csv
import io

from flask import Blueprint, Response, render_template

from ..rbac import require
from ..services import stats

bp = Blueprint("analytics", __name__, url_prefix="/analytics")


@bp.route("/")
@require("analytics")
def index():
    per_vehicle, fleet = stats.fleet_analytics()
    revenue = stats.monthly_revenue()
    max_rev = max((r["revenue"] or 0 for r in revenue), default=0) or 1
    top = stats.top_cost_vehicles()
    max_cost = max((r["op_cost"] for r in top), default=0) or 1
    return render_template(
        "analytics.html", per_vehicle=per_vehicle, fleet=fleet,
        revenue=revenue, max_rev=max_rev, top=top, max_cost=max_cost,
    )


@bp.route("/export.csv")
@require("analytics")
def export_csv():
    per_vehicle, fleet = stats.fleet_analytics()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Vehicle", "Reg No", "Status", "Distance (km)", "Fuel (L)",
                "Fuel Cost", "Maintenance Cost", "Operational Cost", "Revenue",
                "Fuel Efficiency (km/l)", "ROI (%)"])
    for r in per_vehicle:
        v = r["vehicle"]
        w.writerow([v["name"], v["reg_no"], v["status"], r["distance"], r["liters"],
                    r["fuel_cost"], r["maintenance"], r["op_cost"], r["revenue"],
                    r["efficiency"], r["roi"]])
    w.writerow([])
    w.writerow(["FLEET TOTALS"])
    w.writerow(["Fuel Efficiency (km/l)", fleet["efficiency"]])
    w.writerow(["Fleet Utilization (%)", fleet["utilization"]])
    w.writerow(["Operational Cost", fleet["op_cost"]])
    w.writerow(["Vehicle ROI (%)", fleet["roi"]])
    return Response(buf.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=analytics.csv"})
