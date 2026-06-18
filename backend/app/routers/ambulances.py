from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..database import get_db
from ..models import Ambulance, Emergency
from ..schemas import AmbulanceCreate, AmbulanceResponse, AmbulanceUpdate, EmergencyResponse

router = APIRouter(prefix="/ambulances", tags=["Ambulances"])


@router.get("", response_model=list[AmbulanceResponse])
def list_ambulances(db: Session = Depends(get_db)):
    return db.query(Ambulance).all()


@router.get("/{ambulance_id}", response_model=AmbulanceResponse)
def get_ambulance(ambulance_id: int, db: Session = Depends(get_db)):
    ambulance = db.query(Ambulance).filter(Ambulance.id == ambulance_id).first()
    if not ambulance:
        raise HTTPException(status_code=404, detail="Ambulance not found")
    return ambulance


@router.post("", response_model=AmbulanceResponse, status_code=201)
def create_ambulance(data: AmbulanceCreate, db: Session = Depends(get_db)):
    existing = db.query(Ambulance).filter(Ambulance.vehicle_id == data.vehicle_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Ambulance with this vehicle ID already exists")
    ambulance = Ambulance(**data.model_dump())
    db.add(ambulance)
    db.commit()
    db.refresh(ambulance)
    return ambulance


@router.get("/{ambulance_id}/emergencies", response_model=list[EmergencyResponse])
def ambulance_emergencies(ambulance_id: int, db: Session = Depends(get_db)):
    return db.query(Emergency).filter(Emergency.assigned_ambulance_id == ambulance_id).all()


@router.patch("/{ambulance_id}", response_model=AmbulanceResponse)
def update_ambulance(ambulance_id: int, data: AmbulanceUpdate, db: Session = Depends(get_db)):
    ambulance = db.query(Ambulance).filter(Ambulance.id == ambulance_id).first()
    if not ambulance:
        raise HTTPException(status_code=404, detail="Ambulance not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(ambulance, field, value)
    db.commit()
    db.refresh(ambulance)
    return ambulance


@router.get("/verify/{vehicle_no}")
def verify_ambulance(vehicle_no: str, db: Session = Depends(get_db)):
    ambulance = db.query(Ambulance).filter(Ambulance.vehicle_id == vehicle_no).first()
    return {"registered": ambulance is not None}
