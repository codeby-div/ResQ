from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Emergency, EmergencySeverity, EmergencyStatus
from ..schemas import (
    EmergencyCreate, EmergencyResponse, EmergencyUpdate,
    RecommendationResponse,
)
from ..ml.severity import predict_severity
from ..ml.recommender import (
    recommend_hospitals,
    recommend_ambulances,
    estimate_response_time,
    predict_hotspots,
)

router = APIRouter(prefix="/emergencies", tags=["Emergencies"])


@router.get("", response_model=list[EmergencyResponse])
def list_emergencies(db: Session = Depends(get_db)):
    return db.query(Emergency).order_by(Emergency.created_at.desc()).all()


@router.get("/{emergency_id}", response_model=EmergencyResponse)
def get_emergency(emergency_id: int, db: Session = Depends(get_db)):
    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")
    return emergency


@router.post("", response_model=EmergencyResponse, status_code=201)
def create_emergency(data: EmergencyCreate, db: Session = Depends(get_db)):
    ai_severity = predict_severity(data.description or data.patient_name)
    severity = EmergencySeverity(ai_severity)

    emergency = Emergency(
        patient_name=data.patient_name,
        description=data.description,
        latitude=data.latitude,
        longitude=data.longitude,
        severity=severity,
    )
    db.add(emergency)
    db.commit()
    db.refresh(emergency)
    return emergency


@router.patch("/{emergency_id}", response_model=EmergencyResponse)
def update_emergency(emergency_id: int, data: EmergencyUpdate, db: Session = Depends(get_db)):
    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(emergency, field, value)
    db.commit()
    db.refresh(emergency)
    return emergency


@router.post("/{emergency_id}/recommend", response_model=RecommendationResponse)
def recommend_resources(emergency_id: int, db: Session = Depends(get_db)):
    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")

    top_hospitals = recommend_hospitals(
        emergency.latitude, emergency.longitude, emergency.severity.value, db
    )
    top_ambulances = recommend_ambulances(
        emergency.latitude, emergency.longitude, db
    )

    avg_response = (
        sum(a["distance_km"] for a in top_ambulances) / max(len(top_ambulances), 1)
        if top_ambulances else None
    )

    return RecommendationResponse(
        recommended_hospitals=top_hospitals,
        recommended_ambulances=top_ambulances,
        estimated_response_time=round(avg_response, 2) if avg_response else None,
    )


@router.post("/{emergency_id}/assign")
def assign_resources(
    emergency_id: int,
    ambulance_id: int | None = None,
    hospital_id: int | None = None,
    db: Session = Depends(get_db),
):
    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")

    if ambulance_id:
        emergency.assigned_ambulance_id = ambulance_id
    if hospital_id:
        emergency.assigned_hospital_id = hospital_id

    if ambulance_id or hospital_id:
        emergency.status = EmergencyStatus.DISPATCHED

    db.commit()
    db.refresh(emergency)
    return emergency


@router.get("/analytics/hotspots")
def get_hotspots(db: Session = Depends(get_db)):
    emergencies = db.query(Emergency).filter(
        Emergency.status != EmergencyStatus.RESOLVED
    ).all()
    hotspots = predict_hotspots(emergencies)
    return {"hotspots": hotspots}


@router.get("/analytics/summary")
def get_summary(db: Session = Depends(get_db)):
    total = db.query(Emergency).count()
    pending = db.query(Emergency).filter(Emergency.status == EmergencyStatus.PENDING).count()
    dispatched = db.query(Emergency).filter(Emergency.status == EmergencyStatus.DISPATCHED).count()
    resolved = db.query(Emergency).filter(Emergency.status == EmergencyStatus.RESOLVED).count()
    critical = db.query(Emergency).filter(Emergency.severity == EmergencySeverity.CRITICAL).count()
    high = db.query(Emergency).filter(Emergency.severity == EmergencySeverity.HIGH).count()

    return {
        "total": total,
        "pending": pending,
        "dispatched": dispatched,
        "resolved": resolved,
        "critical": critical,
        "high": high,
    }
