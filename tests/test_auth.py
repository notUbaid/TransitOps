"""Authentication + lockout rules."""
from transitops.db import query
from tests.conftest import login


def test_login_success(client):
    resp = login(client, "raven.k@transitops.in")
    assert b"Dashboard" in resp.data


def test_wrong_password_rejected(client):
    resp = login(client, "raven.k@transitops.in", password="nope")
    assert b"Invalid credentials" in resp.data


def test_unknown_email_rejected(client):
    resp = login(client, "ghost@transitops.in")
    assert b"Invalid credentials" in resp.data


def test_account_locks_after_five_failures(app, client):
    for _ in range(5):
        login(client, "raven.k@transitops.in", password="wrong")
    with app.app_context():
        user = query("SELECT * FROM users WHERE email = ?",
                     ("raven.k@transitops.in",), one=True)
        assert user["locked"] == 1
    # Even the right password is refused once locked.
    resp = login(client, "raven.k@transitops.in")
    assert b"locked" in resp.data


def test_role_mismatch_rejected(client):
    resp = client.post("/auth/login", data={
        "email": "raven.k@transitops.in", "password": "transit123",
        "role": "fleet_manager"}, follow_redirects=True)
    assert b"does not match" in resp.data


def test_anonymous_redirected_to_login(client):
    resp = client.get("/dashboard/")
    assert resp.status_code == 302
    assert "/auth/login" in resp.headers["Location"]


def test_rbac_dispatcher_cannot_open_drivers(as_dispatcher):
    assert as_dispatcher.get("/drivers/").status_code == 403


def test_rbac_fleet_manager_cannot_manage_trips(as_fleet_manager):
    assert as_fleet_manager.post("/trips/create", data={}).status_code == 403
