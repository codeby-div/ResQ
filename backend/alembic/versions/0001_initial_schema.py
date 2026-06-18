"""create initial schema matching app/models.py

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-06-13
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "hospitals",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("total_beds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("available_beds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_icu", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("available_icu", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("username", sa.String(100), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", sa.String(50), nullable=False, server_default="patient"),
        sa.Column("display_name", sa.String(255), nullable=False, server_default=""),
    )

    op.create_table(
        "ambulances",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("vehicle_id", sa.String(50), nullable=False, unique=True, index=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="available"),
        sa.Column("hospital_id", sa.Integer(),
                  sa.ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("driver_name", sa.String(255), nullable=True),
        sa.Column("driver_phone", sa.String(20), nullable=True),
    )

    op.create_table(
        "emergencies",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("patient_name", sa.String(255), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False, server_default="medium"),
        sa.Column("description", sa.String(1000), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("assigned_ambulance_id", sa.Integer(),
                  sa.ForeignKey("ambulances.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("assigned_hospital_id", sa.Integer(),
                  sa.ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("push_token", sa.String(500), nullable=True),
    )

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(),
                  sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("emergency_id", sa.Integer(),
                  sa.ForeignKey("emergencies.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.String(1000), nullable=False),
        sa.Column("type", sa.String(50), nullable=False, server_default="info"),
        sa.Column("channel", sa.String(50), nullable=False, server_default="in_app"),
        sa.Column("read", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("emergencies")
    op.drop_table("ambulances")
    op.drop_table("users")
    op.drop_table("hospitals")
