"""License-expiry reminders (bonus feature).

Finds drivers whose license is already expired or expires within the
configured horizon. `send_reminders` is a mock mailer: it logs the outbound
email so the flow can be demonstrated without SMTP credentials. Point
`_deliver` at smtplib to go live.
"""
from datetime import date, timedelta

from flask import current_app

from ..db import query


def expiring_licenses(days=None):
    days = days or current_app.config["LICENSE_REMINDER_DAYS"]
    horizon = (date.today() + timedelta(days=days)).isoformat()
    return query(
        """SELECT *,
                  CASE WHEN license_expiry < ? THEN 1 ELSE 0 END AS already_expired
           FROM drivers WHERE license_expiry <= ? ORDER BY license_expiry""",
        (date.today().isoformat(), horizon))


def _deliver(to, subject, body):
    # Mock transport: log instead of SMTP so demos work offline.
    current_app.logger.warning("EMAIL -> %s | %s | %s", to, subject, body)


def send_reminders():
    drivers = expiring_licenses()
    for d in drivers:
        status = "EXPIRED" if d["already_expired"] else "expiring soon"
        _deliver(
            to=f"{d['name'].lower().replace(' ', '.')}@transitops.in",
            subject=f"[TransitOps] License {status}: {d['license_no']}",
            body=(f"Hi {d['name']}, your {d['category']} license {d['license_no']} "
                  f"is {status} (expiry {d['license_expiry']}). "
                  "Please renew it to stay eligible for trip assignment."),
        )
    return len(drivers)
