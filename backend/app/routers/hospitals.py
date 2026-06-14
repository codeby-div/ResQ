from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Hospital, Emergency
from ..schemas import HospitalCreate, HospitalResponse, HospitalUpdate, EmergencyResponse

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


@router.get("", response_model=list[HospitalResponse])
def list_hospitals(db: Session = Depends(get_db)):
    return db.query(Hospital).all()


@router.get("/{hospital_id}", response_model=HospitalResponse)
def get_hospital(hospital_id: int, db: Session = Depends(get_db)):
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital


@router.post("", response_model=HospitalResponse, status_code=201)
def create_hospital(data: HospitalCreate, db: Session = Depends(get_db)):
    hospital = Hospital(**data.model_dump())
    db.add(hospital)
    db.commit()
    db.refresh(hospital)
    return hospital


@router.get("/{hospital_id}/emergencies", response_model=list[EmergencyResponse])
def hospital_emergencies(hospital_id: int, db: Session = Depends(get_db)):
    return db.query(Emergency).filter(Emergency.assigned_hospital_id == hospital_id).all()


@router.patch("/{hospital_id}", response_model=HospitalResponse)
def update_hospital(hospital_id: int, data: HospitalUpdate, db: Session = Depends(get_db)):
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(hospital, field, value)
    db.commit()
    db.refresh(hospital)
    return hospital
