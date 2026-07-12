"""Maintenance workflow rules (9 & 10) + dispatch pool integration."""
from transitops.db import query
from transitops.services.rules import dispatch_pool_vehicles


def _log_service(client, vehicle_id, service="Oil Change"):
    return client.post("/maintenance/create", data={
        "vehicle_id": vehicle_id, "service_type": service, "cost": "2500",
        "service_date": "2026-07-12"}, follow_redirects=True)


def test_active_record_puts_vehicle_in_shop(app, as_fleet_manager):
    _log_service(as_fleet_manager, 1)  # VAN-05 available
    with app.app_context():
        v = query("SELECT status FROM vehicles WHERE id = 1", one=True)
        assert v["status"] == "in_shop"
        assert all(x["id"] != 1 for x in dispatch_pool_vehicles())


def test_on_trip_vehicle_cannot_enter_shop(app, as_fleet_manager):
    resp = _log_service(as_fleet_manager, 2)  # TRUCK-11 on trip
    assert b"complete the trip" in resp.data
    with app.app_context():
        v = query("SELECT status FROM vehicles WHERE id = 2", one=True)
        assert v["status"] == "on_trip"


def test_closing_record_restores_vehicle(app, as_fleet_manager):
    _log_service(as_fleet_manager, 1)
    with app.app_context():
        log = query("SELECT id FROM maintenance_logs WHERE vehicle_id = 1 "
                    "AND status = 'active'", one=True)
    as_fleet_manager.post(f"/maintenance/{log['id']}/close", follow_redirects=True)
    with app.app_context():
        v = query("SELECT status FROM vehicles WHERE id = 1", one=True)
        assert v["status"] == "available"


def test_closing_record_keeps_retired_vehicle_retired(app, as_fleet_manager):
    # Seeded VAN-09 (id 4) is retired; give it a legacy active record directly.
    with app.app_context():
        from transitops.db import execute
        log_id = execute(
            """INSERT INTO maintenance_logs
               (vehicle_id, service_type, cost, service_date, status)
               VALUES (4, 'Body Work', 900, '2026-07-01', 'active')""")
    as_fleet_manager.post(f"/maintenance/{log_id}/close", follow_redirects=True)
    with app.app_context():
        v = query("SELECT status FROM vehicles WHERE id = 4", one=True)
        assert v["status"] == "retired"
