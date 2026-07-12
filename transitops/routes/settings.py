from flask import Blueprint, flash, redirect, render_template, request, url_for

from ..db import execute, query
from ..rbac import require

bp = Blueprint("settings", __name__, url_prefix="/settings")

EDITABLE_KEYS = ("depot_name", "currency", "distance_unit")


@bp.route("/")
@require("settings")
def index():
    values = {r["key"]: r["value"] for r in query("SELECT key, value FROM app_settings")}
    return render_template("settings.html", values=values)


@bp.route("/save", methods=("POST",))
@require("settings", "full")
def save():
    for key in EDITABLE_KEYS:
        value = request.form.get(key, "").strip()
        if value:
            execute(
                """INSERT INTO app_settings (key, value) VALUES (?, ?)
                   ON CONFLICT(key) DO UPDATE SET value = excluded.value""",
                (key, value))
    flash("Settings saved.", "success")
    return redirect(url_for("settings.index"))
