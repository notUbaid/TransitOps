import os

from flask import Flask, jsonify, send_from_directory

from . import db as database
from .config import BASE_DIR

FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")


def create_app(test_config=None):
    app = Flask(__name__, static_folder=None)
    app.config.from_object("transitops.config.Config")
    if test_config:
        app.config.update(test_config)

    database.init_app(app)

    from .auth import bp as auth_bp
    from .routes.dashboard import bp as dashboard_bp
    from .routes.vehicles import bp as vehicles_bp
    from .routes.drivers import bp as drivers_bp
    from .routes.trips import bp as trips_bp
    from .routes.maintenance import bp as maintenance_bp
    from .routes.expenses import bp as expenses_bp
    from .routes.analytics import bp as analytics_bp
    from .routes.settings import bp as settings_bp

    for bp in (auth_bp, dashboard_bp, vehicles_bp, drivers_bp, trips_bp,
               maintenance_bp, expenses_bp, analytics_bp, settings_bp):
        app.register_blueprint(bp)

    # ---- Serve the built React app (frontend/dist) for all non-API paths ----
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def spa(path):
        if path.startswith("api/"):
            return jsonify(error="Not found."), 404
        if path and os.path.exists(os.path.join(FRONTEND_DIST, path)):
            return send_from_directory(FRONTEND_DIST, path)
        index = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index):
            return send_from_directory(FRONTEND_DIST, "index.html")
        return jsonify(error="Frontend not built. Run: cd frontend && "
                             "npm install && npm run build "
                             "(or use `npm run dev` during development)."), 503

    return app
