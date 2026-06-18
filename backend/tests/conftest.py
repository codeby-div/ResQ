import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.auth import hash_password
from app.models import User

SQLITE_URL = "sqlite://"

test_engine = create_engine(
    SQLITE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(bind=test_engine, autocommit=False, autoflush=False)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def admin_token(client):
    from app.database import get_db

    db = next(client.app.dependency_overrides[get_db]())
    admin = User(
        username="admin",
        hashed_password=hash_password("admin123"),
        role="admin",
        display_name="Admin",
    )
    db.add(admin)
    db.commit()
    r = client.post("/auth/login", json={"username": "admin", "password": "admin123"})
    return r.json()["access_token"]
