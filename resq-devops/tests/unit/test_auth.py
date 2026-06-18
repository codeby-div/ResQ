"""Tests for POST /auth/login and GET /auth/me."""

import pytest
from tests.conftest import auth_header, get_token, register_user


CITIZEN_EMAIL = "citizen@resq.dev"
CITIZEN_PASS = "securepass123"


def _register_citizen(client):
    r = register_user(client, CITIZEN_EMAIL, CITIZEN_PASS)
    assert r.status_code == 201, r.json()
    return r.json()


class TestRegistration:
    def test_register_citizen_success(self, client):
        r = register_user(client, CITIZEN_EMAIL, CITIZEN_PASS)
        assert r.status_code == 201
        body = r.json()
        assert body["email"] == CITIZEN_EMAIL
        assert body["role"] == "citizen"
        assert "hashed_password" not in body

    def test_register_duplicate_email_returns_409(self, client):
        register_user(client, CITIZEN_EMAIL, CITIZEN_PASS)
        r = register_user(client, CITIZEN_EMAIL, "different_pass")
        assert r.status_code == 409

    def test_register_invalid_email_returns_422(self, client):
        r = register_user(client, "not-an-email", CITIZEN_PASS)
        assert r.status_code == 422

    def test_register_short_password_returns_422(self, client):
        r = register_user(client, CITIZEN_EMAIL, "short")
        assert r.status_code == 422

    def test_register_non_citizen_without_admin_returns_403(self, client):
        r = register_user(client, "dispatcher@resq.dev", CITIZEN_PASS, role="dispatcher")
        assert r.status_code == 403


class TestLogin:
    def test_login_success_returns_token(self, client):
        _register_citizen(client)
        r = client.post(
            "/api/v1/auth/login",
            data={"username": CITIZEN_EMAIL, "password": CITIZEN_PASS},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert r.status_code == 200
        body = r.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"

    def test_login_wrong_password_returns_401(self, client):
        _register_citizen(client)
        r = client.post(
            "/api/v1/auth/login",
            data={"username": CITIZEN_EMAIL, "password": "wrongpassword"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert r.status_code == 401

    def test_login_unknown_email_returns_401(self, client):
        r = client.post(
            "/api/v1/auth/login",
            data={"username": "nobody@resq.dev", "password": CITIZEN_PASS},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert r.status_code == 401


class TestMe:
    def test_me_with_valid_token(self, client):
        _register_citizen(client)
        token = get_token(client, CITIZEN_EMAIL, CITIZEN_PASS)
        r = client.get("/api/v1/auth/me", headers=auth_header(token))
        assert r.status_code == 200
        assert r.json()["email"] == CITIZEN_EMAIL

    def test_me_without_token_returns_401(self, client):
        r = client.get("/api/v1/auth/me")
        assert r.status_code == 401

    def test_me_with_garbage_token_returns_401(self, client):
        r = client.get("/api/v1/auth/me", headers=auth_header("not.a.token"))
        assert r.status_code == 401
