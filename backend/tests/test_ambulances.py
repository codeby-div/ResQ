from .conftest import auth_header, admin_token

AMBULANCE_PAYLOAD = {
    "vehicle_id": "AMB-001",
    "latitude": 22.7196,
    "longitude": 75.8577,
}


class TestAmbulanceCRUD:
    def test_list_ambulances_public(self, client):
        r = client.get("/ambulances")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_ambulance(self, client):
        token = admin_token(client)
        r = client.post("/ambulances", json=AMBULANCE_PAYLOAD, headers=auth_header(token))
        assert r.status_code == 201
        assert r.json()["vehicle_id"] == "AMB-001"

    def test_duplicate_vehicle_id_returns_409(self, client):
        token = admin_token(client)
        h = auth_header(token)
        client.post("/ambulances", json=AMBULANCE_PAYLOAD, headers=h)
        r = client.post("/ambulances", json=AMBULANCE_PAYLOAD, headers=h)
        assert r.status_code == 409

    def test_get_nonexistent_ambulance_returns_404(self, client):
        r = client.get("/ambulances/99999")
        assert r.status_code == 404

    def test_update_ambulance_location(self, client):
        token = admin_token(client)
        h = auth_header(token)
        created = client.post("/ambulances", json=AMBULANCE_PAYLOAD, headers=h).json()
        r = client.patch(
            f"/ambulances/{created['id']}",
            json={"latitude": 22.730, "longitude": 75.870},
            headers=h,
        )
        assert r.status_code == 200
        assert r.json()["latitude"] == 22.730
