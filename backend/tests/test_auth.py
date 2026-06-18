import pytest


class TestRegister:
    def test_register_success(self, client):
        r = client.post("/auth/register", json={
            "username": "alice", "password": "secret123", "role": "patient",
        })
        assert r.status_code == 200
        body = r.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
        assert body["user"]["username"] == "alice"
        assert body["user"]["role"] == "patient"

    def test_register_duplicate_username_returns_400(self, client):
        client.post("/auth/register", json={"username": "alice", "password": "secret123"})
        r = client.post("/auth/register", json={"username": "alice", "password": "other456"})
        assert r.status_code == 400
        assert "already exists" in r.json()["detail"].lower()


class TestLogin:
    def test_login_success(self, client):
        client.post("/auth/register", json={"username": "bob", "password": "pass"})
        r = client.post("/auth/login", json={"username": "bob", "password": "pass"})
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_wrong_password_returns_401(self, client):
        client.post("/auth/register", json={"username": "bob", "password": "pass"})
        r = client.post("/auth/login", json={"username": "bob", "password": "wrong"})
        assert r.status_code == 401

    def test_login_unknown_user_returns_401(self, client):
        r = client.post("/auth/login", json={"username": "nobody", "password": "x"})
        assert r.status_code == 401


class TestMe:
    def test_me_with_valid_token(self, client):
        r = client.post("/auth/register", json={"username": "charlie", "password": "pass"})
        token = r.json()["access_token"]
        r2 = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r2.status_code == 200
        assert r2.json()["username"] == "charlie"

    def test_me_without_token_returns_401(self, client):
        r = client.get("/auth/me")
        assert r.status_code == 401

    def test_me_with_garbage_token_returns_401(self, client):
        r = client.get("/auth/me", headers={"Authorization": "Bearer not.a.token"})
        assert r.status_code == 401
