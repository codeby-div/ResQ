from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from .models import HospitalStatus, AmbulanceStatus, EmergencySeverity, EmergencyStatus


class HospitalBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    total_beds: int = 0
    available_beds: int = 0
    total_icu: int = 0
    available_icu: int = 0
    status: HospitalStatus = HospitalStatus.ACTIVE


class HospitalCreate(HospitalBase):
    pass


class HospitalResponse(HospitalBase):
    id: int

    class Config:
        from_attributes = True


class HospitalUpdate(BaseModel):
    available_beds: Optional[int] = None
    available_icu: Optional[int] = None
    status: Optional[HospitalStatus] = None


class AmbulanceBase(BaseModel):
    vehicle_id: str
    latitude: float
    longitude: float
    status: AmbulanceStatus = AmbulanceStatus.AVAILABLE
    hospital_id: Optional[int] = None


class AmbulanceCreate(AmbulanceBase):
    pass


class AmbulanceResponse(AmbulanceBase):
    id: int

    class Config:
        from_attributes = True


class AmbulanceUpdate(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[AmbulanceStatus] = None


class EmergencyBase(BaseModel):
    patient_name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    severity: EmergencySeverity = EmergencySeverity.MEDIUM


class EmergencyCreate(EmergencyBase):
    pass


class EmergencyResponse(EmergencyBase):
    id: int
    status: EmergencyStatus
    created_at: datetime
    assigned_ambulance_id: Optional[int] = None
    assigned_hospital_id: Optional[int] = None

    class Config:
        from_attributes = True


class EmergencyUpdate(BaseModel):
    status: Optional[EmergencyStatus] = None
    assigned_ambulance_id: Optional[int] = None
    assigned_hospital_id: Optional[int] = None


class RecommendationRequest(BaseModel):
    emergency_id: int


class RecommendationResponse(BaseModel):
    recommended_hospitals: list[dict]
    recommended_ambulances: list[dict]
    estimated_response_time: Optional[float] = None


class HotspotResponse(BaseModel):
    latitude: float
    longitude: float
    frequency: int


class SummaryResponse(BaseModel):
    total: int
    pending: int
    dispatched: int
    resolved: int
    critical: int
    high: int


class TrackingResponse(BaseModel):
    ambulance_lat: Optional[float] = None
    ambulance_lng: Optional[float] = None
    ambulance_vehicle_id: Optional[str] = None
    status: str
    eta_seconds: Optional[int] = None
    progress_pct: float = 0
    route: list[dict] = []
    emergency_lat: float
    emergency_lng: float
