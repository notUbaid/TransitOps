import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Config:
    SECRET_KEY = os.environ.get("TRANSITOPS_SECRET", "dev-secret-change-in-prod")
    DATABASE = os.path.join(BASE_DIR, "instance", "transitops.sqlite")
    # Business constants
    MAX_LOGIN_ATTEMPTS = 5          # account locks after 5 failed attempts
    LICENSE_REMINDER_DAYS = 30      # licenses expiring within N days trigger reminders
    AVG_SPEED_KMPH = 40             # used only for rough ETA display on the dashboard
