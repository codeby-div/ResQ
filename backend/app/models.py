from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from .database import Base


class HospitalStatus(str, enum.Enum):
    ACTIVE = "active"
    FULL = "full"
    CLOSED = "closed"


class AmbulanceStatus(str, enum.Enum):
    AVAILABLE = "available"
    EN_ROUTE = "en_route"
    BUSY = "busy"


class EmergencySeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class EmergencyStatus(str, enum.Enum):
    PENDING = "pending"
    DISPATCHED = "dispatched"
    RESOLVED = "resolved"


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    total_beds = Column(Integer, default=0)
    available_beds = Column(Integer, default=0)
    total_icu = Column(Integer, default=0)
    available_icu = Column(Integer, default=0)
    status = Column(SAEnum(HospitalStatus), default=HospitalStatus.ACTIVE)

    ambulances = relationship("Ambulance", back_populates="hospital")


class Ambulance(Base):
    __tablename__ = "ambulances"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String(50), unique=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(SAEnum(AmbulanceStatus), default=AmbulanceStatus.AVAILABLE)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)

    hospital = relationship("Hospital", back_populates="ambulances")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="patient")
    display_name = Column(String(255), default="")


class Emergency(Base):
    __tablename__ = "emergencies"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String(255), nullable=False)
    severity = Column(SAEnum(EmergencySeverity), default=EmergencySeverity.MEDIUM)
    description = Column(String(1000), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(SAEnum(EmergencyStatus), default=EmergencyStatus.PENDING)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    assigned_ambulance_id = Column(Integer, ForeignKey("ambulances.id"), nullable=True)
    assigned_hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
