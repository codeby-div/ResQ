import pytest
from .conftest import auth_header, admin_token

EMERGENCY_PAYLOAD = {
    "patient_name": "John Doe",
    "description": "Chest pain",
    "latitude": 22.7196,
    "longitude": 75.8577,
    "severity": "high",
}


class TestEmergencyCreate:
    def test_create_emergency(self, client):
        r = client.post("/emergencies", json=EMERGENCY_PAYLOAD)
        assert r.status_code == 201
        body = r.json()
        assert body["patient_name"] == "John Doe"
        assert body["status"] == "pending"
        assert body["severity"] in ("high", "critical")

    def test_list_emergencies(self, client):
        client.post("/emergencies", json=EMERGENCY_PAYLOAD)
        r = client.get("/emergencies")
        assert r.status_code == 200
        assert len(r.json()) == 1

    def test_get_nonexistent_emergency_returns_404(self, client):
        r = client.get("/emergencies/99999")
        assert r.status_code == 404


class TestRecommendation:
    def test_recommend_nearest_hospital_first(self, client):
        token = admin_token(client)
        h = auth_header(token)

        client.post("/hospitals", json={
            "name": "Far Hospital",
            "latitude": 23.0000, "longitude": 76.0000,
            "total_beds": 100, "available_beds": 50,
        }, headers=h)

        client.post("/hospitals", json={
            "name": "Near Hospital",
            "latitude": 22.7200, "longitude": 75.8580,
            "total_beds": 100, "available_beds": 50,
        }, headers=h)

        em = client.post("/emergencies", json=EMERGENCY_PAYLOAD).json()

        r = client.post(f"/emergencies/{em['id']}/recommend")
        assert r.status_code == 200
        body = r.json()
        assert len(body["recommended_hospitals"]) >= 2

        dists = [h["distance_km"] for h in body["recommended_hospitals"]]
        assert dists == sorted(dists), "nearest hospital not ranked first"


class TestDispatchFlow:
    def test_assign_ambulance_transitions_to_dispatched(self, client):
        token = admin_token(client)
        h = auth_header(token)

        client.post("/hospitals", json={
            "name": "Central Hospital",
            "latitude": 22.7200, "longitude": 75.8580,
            "total_beds": 100, "available_beds": 50,
        }, headers=h)

        amb = client.post("/ambulances", json={
            "vehicle_id": "AMB-100",
            "latitude": 22.7190, "longitude": 75.8570,
        }, headers=h).json()

        em = client.post("/emergencies", json=EMERGENCY_PAYLOAD).json()
        assert em["status"] == "pending"

        r = client.post(f"/emergencies/{em['id']}/assign", params={
            "ambulance_id": amb["id"],
        })
        assert r.status_code == 200
        assert r.json()["status"] == "dispatched"

    def test_assign_both_hospital_and_ambulance(self, client):
        token = admin_token(client)
        h = auth_header(token)

        hosp = client.post("/hospitals", json={
            "name": "General Hospital",
            "latitude": 22.7200, "longitude": 75.8580,
            "total_beds": 200, "available_beds": 100,
        }, headers=h).json()

        amb = client.post("/ambulances", json={
            "vehicle_id": "AMB-200",
            "latitude": 22.7190, "longitude": 75.8570,
        }, headers=h).json()

        em = client.post("/emergencies", json=EMERGENCY_PAYLOAD).json()

        r = client.post(f"/emergencies/{em['id']}/assign", params={
            "ambulance_id": amb["id"],
            "hospital_id": hosp["id"],
        })
        assert r.status_code == 200
        body = r.json()
        assert body["assigned_ambulance_id"] == amb["id"]
        assert body["assigned_hospital_id"] == hosp["id"]
        assert body["status"] == "dispatched"

    def test_assign_nonexistent_emergency_returns_404(self, client):
        r = client.post("/emergencies/99999/assign", params={"ambulance_id": 1})
        assert r.status_code == 404


class TestTracking:
    def test_tracking_returns_route_for_dispatched(self, client):
        token = admin_token(client)
        h = auth_header(token)

        client.post("/hospitals", json={
            "name": "Track Hospital",
            "latitude": 22.7200, "longitude": 75.8580,
            "total_beds": 100, "available_beds": 50,
        }, headers=h)

        amb = client.post("/ambulances", json={
            "vehicle_id": "AMB-300",
            "latitude": 22.7190, "longitude": 75.8570,
        }, headers=h).json()

        em = client.post("/emergencies", json=EMERGENCY_PAYLOAD).json()
        client.post(f"/emergencies/{em['id']}/assign", params={"ambulance_id": amb["id"]})

        r = client.get(f"/emergencies/{em['id']}/tracking")
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "dispatched"
        assert body["ambulance_vehicle_id"] == "AMB-300"
        assert len(body["route"]) > 0

    def test_tracking_for_pending_returns_status_only(self, client):
        em = client.post("/emergencies", json=EMERGENCY_PAYLOAD).json()
        r = client.get(f"/emergencies/{em['id']}/tracking")
        assert r.status_code == 200
        assert r.json()["status"] == "pending"
        assert r.json().get("ambulance_vehicle_id") is None


class TestSummary:
    def test_summary_counts(self, client):
        token = admin_token(client)
        h = auth_header(token)

        client.post("/emergencies", json=EMERGENCY_PAYLOAD)
        client.post("/emergencies", json={
            "patient_name": "Jane",
            "latitude": 22.7200, "longitude": 75.8580,
            "severity": "critical",
        })
        client.post("/emergencies", json={
            "patient_name": "Jim",
            "latitude": 22.7210, "longitude": 75.8590,
            "severity": "low",
        })

        amb = client.post("/ambulances", json={
            "vehicle_id": "AMB-400",
            "latitude": 22.7190, "longitude": 75.8570,
        }, headers=h).json()

        ems = client.get("/emergencies").json()
        client.post(f"/emergencies/{ems[0]['id']}/assign", params={"ambulance_id": amb["id"]})

        r = client.get("/emergencies/analytics/summary")
        assert r.status_code == 200
        body = r.json()
        assert body["total"] == 3
        assert body["pending"] >= 2
        assert body["dispatched"] >= 1
