"""Trip dispatch validations and automatic status transitions (rules 2–8)."""
from transitops.db import execute, query


def _trip_data(vehicle_id, driver_id, cargo="400", action="dispatch"):
    return {"source": "A Depot", "destination": "B Hub", "vehicle_id": vehicle_id,
            "driver_id": driver_id, "cargo_kg": cargo, "planned_km": "40",
            "action": action}


def _status(app, table, row_id):
    with app.app_context():
        return query(f"SELECT status FROM {table} WHERE id = ?", (row_id,),
                     one=True)["status"]


def test_overweight_cargo_blocked(app, as_dispatcher):
    # VAN-05 (id 1) capacity 500 kg, Alex (id 1) available
    resp = as_dispatcher.post("/trips/create", data=_trip_data(1, 1, cargo="700"),
                              follow_redirects=True)
    assert b"Capacity exceeded by 200 kg" in resp.data
    assert _status(app, "vehicles", 1) == "available"


def test_suspended_driver_blocked(as_dispatcher):
    resp = as_dispatcher.post("/trips/create", data=_trip_data(1, 2),  # John suspended
                              follow_redirects=True)
    assert b"suspended" in resp.data


def test_expired_license_blocked(app, as_dispatcher):
    # Make John available: his license (2025-03-20) is still expired.
    with app.app_context():
        execute("UPDATE drivers SET status = 'available' WHERE id = 2")
    resp = as_dispatcher.post("/trips/create", data=_trip_data(1, 2),
                              follow_redirects=True)
    assert b"license expired" in resp.data


def test_in_shop_vehicle_blocked(as_dispatcher):
    resp = as_dispatcher.post("/trips/create", data=_trip_data(3, 1),  # MINI-03 in shop
                              follow_redirects=True)
    assert b"in shop" in resp.data


def test_on_trip_resources_blocked(as_dispatcher):
    resp = as_dispatcher.post("/trips/create", data=_trip_data(2, 3),  # both on trip
                              follow_redirects=True)
    assert b"already on a trip" in resp.data


def test_dispatch_flips_both_statuses(app, as_dispatcher):
    as_dispatcher.post("/trips/create", data=_trip_data(1, 1), follow_redirects=True)
    assert _status(app, "vehicles", 1) == "on_trip"
    assert _status(app, "drivers", 1) == "on_trip"


def test_complete_restores_and_logs_fuel(app, as_dispatcher):
    as_dispatcher.post("/trips/create", data=_trip_data(1, 1), follow_redirects=True)
    with app.app_context():
        trip = query("SELECT * FROM trips WHERE status = 'dispatched' "
                     "AND vehicle_id = 1", one=True)
    as_dispatcher.post(f"/trips/{trip['id']}/complete", data={
        "end_odometer": "74040", "fuel_liters": "6", "fuel_cost": "560",
        "revenue": "4800"}, follow_redirects=True)

    assert _status(app, "vehicles", 1) == "available"
    assert _status(app, "drivers", 1) == "available"
    with app.app_context():
        v = query("SELECT odometer FROM vehicles WHERE id = 1", one=True)
        assert v["odometer"] == 74040
        log = query("SELECT * FROM fuel_logs WHERE trip_id = ?", (trip["id"],), one=True)
        assert log["liters"] == 6 and log["cost"] == 560


def test_final_odometer_cannot_go_backwards(app, as_dispatcher):
    as_dispatcher.post("/trips/create", data=_trip_data(1, 1), follow_redirects=True)
    with app.app_context():
        trip = query("SELECT * FROM trips WHERE status = 'dispatched' "
                     "AND vehicle_id = 1", one=True)
    resp = as_dispatcher.post(f"/trips/{trip['id']}/complete", data={
        "end_odometer": "100", "fuel_liters": "0", "fuel_cost": "0", "revenue": "0"},
        follow_redirects=True)
    assert b"cannot be less" in resp.data
    assert _status(app, "vehicles", 1) == "on_trip"  # still active


def test_cancel_dispatched_restores_both(app, as_dispatcher):
    as_dispatcher.post("/trips/create", data=_trip_data(1, 1), follow_redirects=True)
    with app.app_context():
        trip = query("SELECT * FROM trips WHERE status = 'dispatched' "
                     "AND vehicle_id = 1", one=True)
    as_dispatcher.post(f"/trips/{trip['id']}/cancel", data={"reason": "test"},
                       follow_redirects=True)
    assert _status(app, "vehicles", 1) == "available"
    assert _status(app, "drivers", 1) == "available"
    assert _status(app, "trips", trip["id"]) == "cancelled"
