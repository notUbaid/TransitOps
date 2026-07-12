from flask import Blueprint, current_app, jsonify, request

from ..db import query
from ..rbac import require
from ..services import stats

bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@bp.get("")
@require("dashboard")
def index():
    vtype = request.args.get("type") or None
    status = request.args.get("status") or None
    region = request.args.get("region") or None

    return jsonify(
        kpis=stats.dashboard_kpis(vtype=vtype, status=status, region=region),
        breakdown=[{"status": s, "count": c} for s, c in stats.status_breakdown()],
        recent_trips=stats.recent_trips(
            avg_speed=current_app.config["AVG_SPEED_KMPH"]),
        types=[r["type"] for r in
               query("SELECT DISTINCT type FROM vehicles ORDER BY type")],
        regions=[r["region"] for r in
                 query("SELECT DISTINCT region FROM vehicles ORDER BY region")],
    )
