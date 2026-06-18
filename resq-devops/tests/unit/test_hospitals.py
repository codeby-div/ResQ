"""Tests for /hospitals CRUD and availability update."""

import pytest
from tests.conftest import auth_header, get_token, register_user

HOSPITAL_PAYLOAD = {
    "name": "Test Hospital",
    "address": "1 Main St",
    "city": "Indore",
    "state": "MP",
    "latitude": 22.7196,
    "longitude": 75.8577,
    "contact_number": "+910000000001",
    "total_beds": 100,
    "available_beds": 40,
    "total_icu_beds": 20,
    "available_icu_beds": 5,
    "total_ventilators": 10,
    "available_ventilators": 3,
}


def _admin_token(client):
    from app.core.security import hash_password
    from app.models.enums import UserRole
    from app.models.user import User
    from app.core.database import get_db

    db = next(client.app.dependency_overrides[get_db]())
    admin = User(
        email="admin@resq.dev",
        hashed_password=hash_password("admin123"),
        full_name="Admin",
        phone_number="+910000000000",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(admin)
    db.commit()
    return get_token(client, "admin@resq.dev", "admin123")


class TestHospitalCRUD:
    def test_list_hospitals_public(self, client):
        """GET /hospitals is accessible without authentication."""
        r = client.get("/api/v1/hospitals")
        assert r.status_code == 200
        assert "items" in r.json()

    def test_create_hospital_requires_auth(self, client):
        r = client.post("/api/v1/hospitals", json=HOSPITAL_PAYLOAD)
        assert r.status_code == 401

    def test_create_hospital_as_admin(self, client):
        token = _admin_token(client)
        r = client.post(
            "/api/v1/hospitals", json=HOSPITAL_PAYLOAD, headers=auth_header(token)
        )
        assert r.status_code == 201
        body = r.json()
        assert body["name"] == HOSPITAL_PAYLOAD["name"]
        assert body["available_beds"] == 40

    def test_create_hospital_invalid_beds_returns_422(self, client):
        token = _admin_token(client)
        bad = {**HOSPITAL_PAYLOAD, "available_beds": 999}  # exceeds total_beds=100
        r = client.post("/api/v1/hospitals", json=bad, headers=auth_header(token))
        assert r.status_code == 422

    def test_get_hospital_by_id(self, client):
        token = _admin_token(client)
        create_r = client.post(
            "/api/v1/hospitals", json=HOSPITAL_PAYLOAD, headers=auth_header(token)
        )
        hospital_id = create_r.json()["id"]
        r = client.get(f"/api/v1/hospitals/{hospital_id}")
        assert r.status_code == 200
        assert r.json()["id"] == hospital_id

    def test_get_nonexistent_hospital_returns_404(self, client):
        r = client.get("/api/v1/hospitals/99999")
        assert r.status_code == 404

    def test_search_filter(self, client):
        token = _admin_token(client)
        client.post("/api/v1/hospitals", json=HOSPITAL_PAYLOAD, headers=auth_header(token))
        r = client.get("/api/v1/hospitals", params={"search": "Test Hospital"})
        assert r.json()["total"] >= 1

    def test_delete_hospital_requires_admin(self, client):
        token = _admin_token(client)
        create_r = client.post(
            "/api/v1/hospitals", json=HOSPITAL_PAYLOAD, headers=auth_header(token)
        )
        hospital_id = create_r.json()["id"]
        r = client.delete(f"/api/v1/hospitals/{hospital_id}", headers=auth_header(token))
        assert r.status_code == 204


class TestHospitalAvailability:
    def test_update_availability_as_admin(self, client):
        token = _admin_token(client)
        hosp = client.post(
            "/api/v1/hospitals", json=HOSPITAL_PAYLOAD, headers=auth_header(token)
        ).json()
        r = client.patch(
            f"/api/v1/hospitals/{hosp['id']}/availability",
            json={"available_beds": 30, "available_icu_beds": 3},
            headers=auth_header(token),
        )
        assert r.status_code == 200
        assert r.json()["available_beds"] == 30

    def test_update_availability_exceeding_total_returns_422(self, client):
        token = _admin_token(client)
        hosp = client.post(
            "/api/v1/hospitals", json=HOSPITAL_PAYLOAD, headers=auth_header(token)
        ).json()
        r = client.patch(
            f"/api/v1/hospitals/{hosp['id']}/availability",
            json={"available_beds": 9999},
            headers=auth_header(token),
        )
        assert r.status_code == 422
