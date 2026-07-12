"""Vehicle registry rules (unique registration, retire flow)."""
from transitops.db import query


def _add_vehicle(client, reg_no, name="TEST-01"):
    return client.post("/vehicles/create", data={
        "reg_no": reg_no, "name": name, "type": "Van",
        "capacity_kg": "800", "odometer": "0", "acquisition_cost": "500000",
        "region": "Ahmedabad"}, follow_redirects=True)


def test_register_vehicle(app, as_fleet_manager):
    _add_vehicle(as_fleet_manager, "GJ05ZZ0001")
    with app.app_context():
        v = query("SELECT * FROM vehicles WHERE reg_no = 'GJ05ZZ0001'", one=True)
        assert v is not None and v["status"] == "available"


def test_duplicate_registration_blocked(app, as_fleet_manager):
    resp = _add_vehicle(as_fleet_manager, "GJ01AB4521")  # seeded VAN-05
    assert b"must be unique" in resp.data
    with app.app_context():
        n = query("SELECT COUNT(*) AS n FROM vehicles WHERE reg_no = 'GJ01AB4521'",
                  one=True)["n"]
        assert n == 1


def test_duplicate_registration_case_insensitive(app, as_fleet_manager):
    resp = _add_vehicle(as_fleet_manager, "gj01ab4521")
    assert b"must be unique" in resp.data


def test_retire_removes_from_dispatch_pool(app, as_fleet_manager):
    as_fleet_manager.post("/vehicles/1/retire", follow_redirects=True)  # VAN-05
    with app.app_context():
        from transitops.services.rules import dispatch_pool_vehicles
        assert all(v["id"] != 1 for v in dispatch_pool_vehicles())


def test_cannot_retire_on_trip_vehicle(app, as_fleet_manager):
    resp = as_fleet_manager.post("/vehicles/2/retire", follow_redirects=True)  # TRUCK-11
    assert b"Cannot retire" in resp.data
    with app.app_context():
        v = query("SELECT status FROM vehicles WHERE id = 2", one=True)
        assert v["status"] == "on_trip"
