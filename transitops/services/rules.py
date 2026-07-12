"""Mandatory business rules (problem statement §4).

Every rule is enforced server-side here, independent of any UI hints:

1. Vehicle registration number must be unique.
2. Retired / In Shop vehicles never appear in the dispatch selection.
3. Drivers with expired licenses or Suspended status cannot be assigned.
4. A driver or vehicle already On Trip cannot be assigned to another trip.
5. Cargo weight must not exceed the vehicle's maximum load capacity.
6. Dispatching sets vehicle + driver to On Trip.
7. Completing a trip sets both back to Available.
8. Cancelling a dispatched trip restores both to Available.
9. An active maintenance record sets the vehicle to In Shop.
10. Closing maintenance restores the vehicle to Available (unless retired).
"""
from datetime import date

from ..db import query


def license_expired(driver, on=None):
    on = on or date.today().isoformat()
    return driver["license_expiry"] < on


def license_expiring_soon(driver, days=30):
    from datetime import timedelta
    horizon = (date.today() + timedelta(days=days)).isoformat()
    return date.today().isoformat() <= driver["license_expiry"] <= horizon


def dispatch_pool_vehicles():
    """Rule 2 + 4: only Available vehicles may be selected for a trip."""
    return query("SELECT * FROM vehicles WHERE status = 'available' ORDER BY name")


def assignable_drivers():
    """Rule 3 + 4: Available drivers with a valid (non-expired) license."""
    today = date.today().isoformat()
    return query(
        "SELECT * FROM drivers WHERE status = 'available' AND license_expiry >= ? "
        "ORDER BY name", (today,))


def validate_assignment(vehicle, driver, cargo_kg, require_all=True):
    """Return a list of human-readable violations for a vehicle/driver/cargo combo.

    `require_all=False` (saving a draft) skips missing-field errors but still
    validates whatever has been provided.
    """
    errors = []

    if require_all:
        if vehicle is None:
            errors.append("Select a vehicle — trip cannot be dispatched without one.")
        if driver is None:
            errors.append("Select a driver — trip cannot be dispatched without one.")
        if cargo_kg is None:
            errors.append("Cargo weight is required for dispatch.")

    if vehicle is not None:
        if vehicle["status"] == "retired":
            errors.append(f"{vehicle['name']} is retired — not in the dispatch pool.")
        elif vehicle["status"] == "in_shop":
            errors.append(f"{vehicle['name']} is in shop — not in the dispatch pool.")
        elif vehicle["status"] == "on_trip":
            errors.append(f"{vehicle['name']} is already on a trip.")

        if cargo_kg is not None and cargo_kg > vehicle["capacity_kg"]:
            over = int(cargo_kg - vehicle["capacity_kg"])
            errors.append(f"Capacity exceeded by {over} kg — dispatch blocked.")

    if driver is not None:
        if driver["status"] == "suspended":
            errors.append(f"Driver {driver['name']} is suspended — cannot be assigned.")
        elif driver["status"] == "on_trip":
            errors.append(f"Driver {driver['name']} is already on a trip.")
        elif driver["status"] == "off_duty":
            errors.append(f"Driver {driver['name']} is off duty — cannot be assigned.")
        if license_expired(driver):
            errors.append(f"Driver {driver['name']}'s license expired on "
                          f"{driver['license_expiry']} — cannot be assigned.")

    return errors
