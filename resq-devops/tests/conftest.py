"""
Shared pytest fixtures for the ResQ backend test suite.

Uses an in-memory SQLite database so tests run without a live Postgres
instance — no Docker or external DB required for `pytest`.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app

# ── In-memory SQLite test DB ─────────────────────────────────────────────────
SQLITE_URL = "sqlite://"

test_engine = create_engine(
    SQLITE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(bind=test_engine, autocommit=False, autoflush=False)


@pytest.fixture(scope="function")
def db():
    """Fresh database tables for each test function."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db):
    """FastAPI TestClient with the DB dependency overridden to the test DB."""

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── Auth helpers ──────────────────────────────────────────────────────────────

def register_user(client, email, password, role="citizen", **kwargs):
    payload = {
        "email": email,
        "password": password,
        "full_name": kwargs.get("full_name", "Test User"),
        "phone_number": kwargs.get("phone_number", "+911234567890"),
        "role": role,
    }
    if role == "hospital_staff":
        payload["hospital_id"] = kwargs["hospital_id"]
    if role == "ambulance_crew":
        payload["ambulance_id"] = kwargs["ambulance_id"]
    return client.post("/api/v1/users", json=payload)


def get_token(client, email, password):
    r = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    return r.json()["access_token"]


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def create_admin(client):
    """Register an admin via direct user creation (no existing admin required in tests)."""
    from app.core.security import hash_password
    from app.models.enums import UserRole
    from app.models.user import User

    # We'll grab the db from the client's dependency overrides
    db = next(client.app.dependency_overrides[get_db]())
    admin = User(
        email="admin@resq.dev",
        hashed_password=hash_password("admin123"),
        full_name="ResQ Admin",
        phone_number="+910000000000",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(admin)
    db.commit()
    return "admin@resq.dev", "admin123"
