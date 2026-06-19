import os
import sys
import logging

from dotenv import load_dotenv
from app.database import SessionLocal, engine, Base
from app.models import User
from app.auth import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("create_admin")

DEFAULT_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
DEFAULT_PASSWORD = os.getenv("ADMIN_PASSWORD", "change-me-before-deploying")
DEFAULT_DISPLAY_NAME = os.getenv("ADMIN_FULL_NAME", "ResQ Admin")
DEFAULT_ROLE = os.getenv("ADMIN_ROLE", "admin")


def create_admin(
    username: str = DEFAULT_USERNAME,
    password: str = DEFAULT_PASSWORD,
    display_name: str = DEFAULT_DISPLAY_NAME,
    role: str = DEFAULT_ROLE,
):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            existing.hashed_password = hash_password(password)
            existing.display_name = display_name
            existing.role = role
            db.commit()
            logger.info(f"Updated admin user '{username}' with new password/role/name")
            return True

        user = User(
            username=username,
            hashed_password=hash_password(password),
            role=role,
            display_name=display_name,
        )
        db.add(user)
        db.commit()
        logger.info(f"Created admin user: {username} (role={role})")
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create admin: {e}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
    import argparse

    parser = argparse.ArgumentParser(description="Create an admin user for ResQ")
    parser.add_argument("--username", default=DEFAULT_USERNAME)
    parser.add_argument("--password", default=DEFAULT_PASSWORD)
    parser.add_argument("--display-name", default=DEFAULT_DISPLAY_NAME)
    parser.add_argument("--role", default=DEFAULT_ROLE)
    args = parser.parse_args()

    success = create_admin(
        username=args.username,
        password=args.password,
        display_name=args.display_name,
        role=args.role,
    )
    sys.exit(0 if success else 1)
