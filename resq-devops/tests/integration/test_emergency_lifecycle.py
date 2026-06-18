"""
Integration tests for the emergency request lifecycle.

Tests the full flow:
  citizen creates request → dispatcher gets recommendations
  → dispatcher assigns hospital + ambulance
  → crew advances status through all transitions
  → request reaches completed
"""

import pytest
from tests.conftest import auth_header, get_token, register_user

HOSPITAL = {
    "name": "Apex Hospital",
    "address": "1 Hospital Rd",
    "city": "Indore",
    "state": "MP",
    "latitude": 22.725,
    "longitude": 75.865,
    "contact_number": "+911111111111",
    "total_beds": 100,
    "available_beds": 50,
    "total_icu_beds": 20,
    "available_icu_beds": 10,
    "total_ventilators": 10,
    "available_ventilators": 5,
}
AMBULANCE = {
    "vehicle_number": "AMB-001",
    "status": "available",
    "current_latitude": 22.720,
    "current_longitude": 75.860,
}


def _seed(client):
    """Seed an admin, dispatcher, crew member, hospital, ambulance, and citizen."""
    from app.core.security import hash_password
    from app.models.enums import UserRole
    from app.models.user import User
    from app.core.database import get_db

    db = next(client.app.dependency_overrides[get_db]())

    for email, role in [
        ("admin@resq.dev", UserRole.ADMIN),
        ("dispatcher@resq.dev", UserRole.DISPATCHER),
    ]:
        db.add(User(
            email=email,
            hashed_password=hash_password("pass1234"),
            full_name=role.value.title(),
            phone_number="+910000000000",
            role=role,
            is_active=True,
        ))
    db.commit()

    admin_token = get_token(client, "admin@resq.dev", "pass1234")
    hosp_r = client.post("/api/v1/hospitals", json=HOSPITAL, headers=auth_header(admin_token))
    assert hosp_r.status_code == 201
    hospital_id = hosp_r.json()["id"]

    amb_r = client.post("/api/v1/ambulances", json=AMBULANCE, headers=auth_header(admin_token))
    assert amb_r.status_code == 201
    ambulance_id = amb_r.json()["id"]

    # crew member linked to the ambulance
    db.add(User(
        email="crew@resq.dev",
        hashed_password=hash_password("pass1234"),
        full_name="Crew",
        phone_number="+910000000001",
        role=UserRole.AMBULANCE_CREW,
        ambulance_id=ambulance_id,
        is_active=True,
    ))
    db.commit()

    return {
        "admin_token": admin_token,
        "dispatcher_token": get_token(client, "dispatcher@resq.dev", "pass1234"),
        "crew_token": get_token(client, "crew@resq.dev", "pass1234"),
        "hospital_id": hospital_id,
        "ambulance_id": ambulance_id,
    }


class TestEmergencyLifecycle:
    def test_citizen_can_create_request_anonymously(self, client):
        r = client.post("/api/v1/emergency-requests", json={
            "severity": "critical",
            "pickup_latitude": 22.7196,
            "pickup_longitude": 75.8577,
            "pickup_address": "Vijay Nagar, Indore",
        })
        assert r.status_code == 201
        body = r.json()
        assert body["status"] == "requested"
        assert body["severity"] == "critical"
        assert len(body["events"]) == 1

    def test_recommendations_return_ranked_candidates(self, client):
        ctx = _seed(client)
        req = client.post("/api/v1/emergency-requests", json={
            "severity": "critical",
            "pickup_latitude": 22.7196,
            "pickup_longitude": 75.8577,
        }).json()

        r = client.get(
            f"/api/v1/emergency-requests/{req['id']}/recommendations",
            headers=auth_header(ctx["dispatcher_token"]),
        )
        assert r.status_code == 200
        body = r.json()
        assert len(body["hospitals"]) >= 1
        assert len(body["ambulances"]) >= 1
        # Nearest hospital should be first
        if len(body["hospitals"]) > 1:
            assert body["hospitals"][0]["distance_km"] <= body["hospitals"][1]["distance_km"]

    def test_recommendations_require_dispatcher_role(self, client):
        req = client.post("/api/v1/emergency-requests", json={
            "severity": "stable",
            "pickup_latitude": 22.7196,
            "pickup_longitude": 75.8577,
        }).json()
        # Unauthenticated request
        r = client.get(f"/api/v1/emergency-requests/{req['id']}/recommendations")
        assert r.status_code == 401

    def test_full_lifecycle_requested_to_completed(self, client):
        ctx = _seed(client)

        # 1. Citizen creates request
        req = client.post("/api/v1/emergency-requests", json={
            "severity": "serious",
            "pickup_latitude": 22.7196,
            "pickup_longitude": 75.8577,
        }).json()
        req_id = req["id"]
        assert req["status"] == "requested"

        headers_d = auth_header(ctx["dispatcher_token"])
        headers_c = auth_header(ctx["crew_token"])

        # 2. Dispatcher assigns hospital → status becomes MATCHED
        r = client.post(f"/api/v1/emergency-requests/{req_id}/assign",
                        json={"hospital_id": ctx["hospital_id"]}, headers=headers_d)
        assert r.status_code == 200
        assert r.json()["status"] == "matched"

        # 3. Dispatcher assigns ambulance → status becomes DISPATCHED
        r = client.post(f"/api/v1/emergency-requests/{req_id}/assign",
                        json={"ambulance_id": ctx["ambulance_id"]}, headers=headers_d)
        assert r.status_code == 200
        assert r.json()["status"] == "dispatched"

        # 4. Crew advances to EN_ROUTE
        r = client.post(f"/api/v1/emergency-requests/{req_id}/status",
                        json={"status": "en_route"}, headers=headers_c)
        assert r.status_code == 200
        assert r.json()["status"] == "en_route"

        # 5. Crew advances to ARRIVED
        r = client.post(f"/api/v1/emergency-requests/{req_id}/status",
                        json={"status": "arrived"}, headers=headers_c)
        assert r.status_code == 200

        # 6. Crew completes the request
        r = client.post(f"/api/v1/emergency-requests/{req_id}/status",
                        json={"status": "completed"}, headers=headers_c)
        assert r.status_code == 200
        assert r.json()["status"] == "completed"

        # 7. Verify the full timeline has 6 events
        r = client.get(f"/api/v1/emergency-requests/{req_id}",
                       headers=auth_header(ctx["dispatcher_token"]))
        assert len(r.json()["events"]) == 6

    def test_invalid_status_transition_returns_422(self, client):
        ctx = _seed(client)
        req = client.post("/api/v1/emergency-requests", json={
            "severity": "stable",
            "pickup_latitude": 22.7196,
            "pickup_longitude": 75.8577,
        }).json()

        # Can't jump from requested → completed (skipping all other steps)
        r = client.post(
            f"/api/v1/emergency-requests/{req['id']}/status",
            json={"status": "completed"},
            headers=auth_header(ctx["dispatcher_token"]),
        )
        assert r.status_code == 422

    def test_cancel_from_any_active_status(self, client):
        ctx = _seed(client)
        req = client.post("/api/v1/emergency-requests", json={
            "severity": "stable",
            "pickup_latitude": 22.7196,
            "pickup_longitude": 75.8577,
        }).json()

        r = client.post(
            f"/api/v1/emergency-requests/{req['id']}/status",
            json={"status": "cancelled"},
            headers=auth_header(ctx["dispatcher_token"]),
        )
        assert r.status_code == 200
        assert r.json()["status"] == "cancelled"
