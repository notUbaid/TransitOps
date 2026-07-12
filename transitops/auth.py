"""Authentication API: email + password login with account lockout and role check.

Business rule: the account is locked after 5 consecutive failed attempts
(wireframe screen 0 — "Account locked after 5 failed attempts").
"""
from flask import Blueprint, current_app, g, jsonify, request, session
from werkzeug.security import check_password_hash

from .db import execute, query
from .rbac import serialize_user

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.before_app_request
def load_logged_in_user():
    user_id = session.get("user_id")
    g.user = (
        query("SELECT * FROM users WHERE id = ?", (user_id,), one=True)
        if user_id else None
    )


def _app_settings():
    return {r["key"]: r["value"] for r in query("SELECT key, value FROM app_settings")}


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = data.get("role") or ""
    remember = bool(data.get("remember"))

    user = query("SELECT * FROM users WHERE email = ?", (email,), one=True)
    max_attempts = current_app.config["MAX_LOGIN_ATTEMPTS"]

    if user and user["locked"]:
        return jsonify(error="This account is locked after too many failed "
                             "attempts. Contact your Fleet Manager."), 423

    if user is None or not check_password_hash(user["password_hash"], password):
        if user is not None:
            attempts = user["failed_attempts"] + 1
            locked = 1 if attempts >= max_attempts else 0
            execute("UPDATE users SET failed_attempts = ?, locked = ? WHERE id = ?",
                    (attempts, locked, user["id"]))
            if locked:
                return jsonify(error="Account locked after 5 failed attempts."), 423
            return jsonify(error=f"Invalid credentials. Account locked after "
                                 f"{max_attempts} failed attempts "
                                 f"({max_attempts - attempts} left)."), 401
        return jsonify(error="Invalid credentials. Account locked after 5 "
                             "failed attempts."), 401

    if role and role != user["role"]:
        return jsonify(error="Selected role does not match this account."), 401

    execute("UPDATE users SET failed_attempts = 0 WHERE id = ?", (user["id"],))
    session.clear()
    session["user_id"] = user["id"]
    session.permanent = remember
    return jsonify(user=serialize_user(user), settings=_app_settings())


@bp.post("/logout")
def logout():
    session.clear()
    return jsonify(message="Logged out.")


@bp.get("/me")
def me():
    if g.user is None:
        return jsonify(error="Not authenticated."), 401
    return jsonify(user=serialize_user(g.user), settings=_app_settings())
