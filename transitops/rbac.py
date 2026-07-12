"""Role-Based Access Control.

One login, four roles. Access levels per module: none / view / full.
This matrix mirrors screen 8 of the wireframe:

    ROLE              FLEET  DRIVERS  TRIPS  FUEL/EXP.  ANALYTICS
    Fleet Manager       x       x       -        -          x
    Dispatcher        view      -       x        -          -
    Safety Officer      -       x     view       -          -
    Financial Analyst view      -       -        x          x
"""
import functools

from flask import g, jsonify

LEVELS = {"none": 0, "view": 1, "full": 2}

ROLES = {
    "fleet_manager": {
        "label": "Fleet Manager",
        "perms": {
            "dashboard": "view", "fleet": "full", "drivers": "full",
            "trips": "none", "maintenance": "full", "fuel": "none",
            "analytics": "view", "settings": "full",
        },
    },
    "dispatcher": {
        "label": "Dispatcher",
        "perms": {
            "dashboard": "view", "fleet": "view", "drivers": "none",
            "trips": "full", "maintenance": "none", "fuel": "none",
            "analytics": "none", "settings": "none",
        },
    },
    "safety_officer": {
        "label": "Safety Officer",
        "perms": {
            "dashboard": "view", "fleet": "none", "drivers": "full",
            "trips": "view", "maintenance": "none", "fuel": "none",
            "analytics": "none", "settings": "none",
        },
    },
    "financial_analyst": {
        "label": "Financial Analyst",
        "perms": {
            "dashboard": "view", "fleet": "view", "drivers": "none",
            "trips": "none", "maintenance": "view", "fuel": "full",
            "analytics": "full", "settings": "none",
        },
    },
}

# Columns shown in the Settings RBAC matrix (and mirrored by the frontend)
RBAC_MATRIX_COLUMNS = [
    ("fleet", "Fleet"), ("drivers", "Drivers"), ("trips", "Trips"),
    ("maintenance", "Maint."), ("fuel", "Fuel/Exp."), ("analytics", "Analytics"),
]


def role_label(role):
    return ROLES.get(role, {}).get("label", role)


def serialize_user(user):
    """Shape sent to the React app after login / on session restore."""
    role = user["role"]
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": role,
        "role_label": ROLES[role]["label"],
        "perms": ROLES[role]["perms"],
    }


def can(module, level="view"):
    """True when the logged-in user's role grants at least `level` on `module`."""
    user = g.get("user")
    if user is None:
        return False
    have = ROLES[user["role"]]["perms"].get(module, "none")
    return LEVELS[have] >= LEVELS[level]


def require(module, level="view"):
    """API decorator: 401 for anonymous callers, 403 for under-privileged roles."""
    def decorator(view):
        @functools.wraps(view)
        def wrapped(**kwargs):
            if g.get("user") is None:
                return jsonify(error="Authentication required."), 401
            if not can(module, level):
                return jsonify(error="Your role does not permit this action."), 403
            return view(**kwargs)
        return wrapped
    return decorator
