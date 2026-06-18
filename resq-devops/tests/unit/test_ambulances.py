"""Tests for /ambulances CRUD and location update."""

from tests.conftest import auth_header, get_token

AMBULANCE_PAYLOAD = {
    "vehicle_number": "AMB-TEST-01",
    "status": "available",
    "current_latitude": 22.7196,
    "current_longitude": 75.8577,
}


def _admin_token(client):
    from app.core.security import hash_password
    from app.models.enums import UserRole
    from app.models.user import User
    from app.core.database import get_db

    db = next(client.app.dependency_overrides[get_db]())
    db.add(User(
        email="admin@resq.dev",
        hashed_password=hash_password("admin123"),
        full_name="Admin",
        phone_number="+910000000000",
        role=UserRole.ADMIN,
        is_active=True,
    ))
    db.commit()
    return get_token(client, "admin@resq.dev", "admin123")


class TestAmbulanceCRUD:
    def test_list_ambulances_public(self, client):
        r = client.get("/api/v1/ambulances")
        assert r.status_code == 200

    def test_create_ambulance_as_admin(self, client):
        token = _admin_token(client)
        r = client.post(
            "/api/v1/ambulances", json=AMBULANCE_PAYLOAD, headers=auth_header(token)
        )
        assert r.status_code == 201
        assert r.json()["vehicle_number"] == "AMB-TEST-01"

    def test_duplicate_vehicle_number_returns_409(self, client):
        token = _admin_token(client)
        client.post("/api/v1/ambulances", json=AMBULANCE_PAYLOAD, headers=auth_header(token))
        r = client.post("/api/v1/ambulances", json=AMBULANCE_PAYLOAD, headers=auth_header(token))
        assert r.status_code == 409

    def test_get_nonexistent_ambulance_returns_404(self, client):
        r = client.get("/api/v1/ambulances/99999")
        assert r.status_code == 404

    def test_filter_by_status(self, client):
        token = _admin_token(client)
        client.post("/api/v1/ambulances", json=AMBULANCE_PAYLOAD, headers=auth_header(token))
        r = client.get("/api/v1/ambulances", params={"status": "available"})
        assert r.status_code == 200
        assert r.json()["total"] >= 1


class TestAmbulanceLocation:
    def test_update_location_as_admin(self, client):
        token = _admin_token(client)
        amb = client.post(
            "/api/v1/ambulances", json=AMBULANCE_PAYLOAD, headers=auth_header(token)
        ).json()

        r = client.patch(
            f"/api/v1/ambulances/{amb['id']}/location",
            json={"current_latitude": 22.730, "current_longitude": 75.870, "status": "en_route_to_patient"},
            headers=auth_header(token),
        )
        assert r.status_code == 200
        body = r.json()
        assert body["current_latitude"] == 22.730
        assert body["status"] == "en_route_to_patient"
