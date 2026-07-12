"""TransitOps entry point.

Usage:
    python run.py            # starts the dev server on http://127.0.0.1:5000

On first run the SQLite database is created and seeded with demo data
(vehicles, drivers, trips and one login per role — see README.md).
"""
import os

from transitops import create_app
from transitops.db import init_db
from transitops.seed import seed

app = create_app()


def bootstrap():
    with app.app_context():
        if not os.path.exists(app.config["DATABASE"]):
            init_db()
            seed()
            print(" * Seeded demo database at", app.config["DATABASE"])


if __name__ == "__main__":
    bootstrap()
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))
