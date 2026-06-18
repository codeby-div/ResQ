from .conftest import auth_header, admin_token

HOSPITAL_PAYLOAD = {
    "name": "City Hospital",
    "latitude": 22.7196,
    "longitude": 75.8577,
    "total_beds": 100,
    "available_beds": 40,
    "total_icu": 20,
    "available_icu": 5,
}


class TestHospitalCRUD:
    def test_list_hospitals_public(self, client):
        r = client.get("/hospitals")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_hospital(self, client):
        token = admin_token(client)
        r = client.post("/hospitals", json=HOSPITAL_PAYLOAD, headers=auth_header(token))
        assert r.status_code == 201
        assert r.json()["name"] == "City Hospital"
        assert r.json()["available_beds"] == 40

    def test_get_hospital_by_id(self, client):
        token = admin_token(client)
        created = client.post("/hospitals", json=HOSPITAL_PAYLOAD, headers=auth_header(token)).json()
        r = client.get(f"/hospitals/{created['id']}")
        assert r.status_code == 200
        assert r.json()["id"] == created["id"]

    def test_get_nonexistent_hospital_returns_404(self, client):
        r = client.get("/hospitals/99999")
        assert r.status_code == 404

    def test_update_hospital_availability(self, client):
        token = admin_token(client)
        created = client.post("/hospitals", json=HOSPITAL_PAYLOAD, headers=auth_header(token)).json()
        r = client.patch(
            f"/hospitals/{created['id']}",
            json={"available_beds": 30, "available_icu": 3},
            headers=auth_header(token),
        )
        assert r.status_code == 200
        assert r.json()["available_beds"] == 30
