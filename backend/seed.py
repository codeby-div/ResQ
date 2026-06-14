from datetime import datetime, timezone

from app.database import engine, SessionLocal, Base
from app.models import Hospital, Ambulance, Emergency, HospitalStatus, AmbulanceStatus, EmergencySeverity, EmergencyStatus

hospitals_data = [
    {"id": 1, "name": "AIIMS Delhi", "latitude": 28.5672, "longitude": 77.2100, "total_beds": 250, "available_beds": 18, "total_icu": 40, "available_icu": 3, "status": HospitalStatus.ACTIVE},
    {"id": 2, "name": "Fortis Mumbai", "latitude": 19.0760, "longitude": 72.8777, "total_beds": 180, "available_beds": 12, "total_icu": 25, "available_icu": 2, "status": HospitalStatus.ACTIVE},
    {"id": 3, "name": "Apollo Chennai", "latitude": 13.0827, "longitude": 80.2707, "total_beds": 200, "available_beds": 9, "total_icu": 30, "available_icu": 1, "status": HospitalStatus.ACTIVE},
    {"id": 4, "name": "Narayana Bangalore", "latitude": 12.9716, "longitude": 77.5946, "total_beds": 160, "available_beds": 22, "total_icu": 20, "available_icu": 4, "status": HospitalStatus.ACTIVE},
    {"id": 5, "name": "CMC Vellore", "latitude": 12.9200, "longitude": 79.1500, "total_beds": 300, "available_beds": 5, "total_icu": 35, "available_icu": 0, "status": HospitalStatus.FULL},
    {"id": 6, "name": "KEM Hospital Pune", "latitude": 18.5204, "longitude": 73.8567, "total_beds": 140, "available_beds": 14, "total_icu": 18, "available_icu": 2, "status": HospitalStatus.ACTIVE},
    {"id": 7, "name": "Medanta Gurgaon", "latitude": 28.4744, "longitude": 77.0386, "total_beds": 220, "available_beds": 7, "total_icu": 28, "available_icu": 0, "status": HospitalStatus.FULL},
    {"id": 8, "name": "Tata Memorial Kolkata", "latitude": 22.5726, "longitude": 88.3639, "total_beds": 190, "available_beds": 11, "total_icu": 22, "available_icu": 1, "status": HospitalStatus.ACTIVE},
]

ambulances_data = [
    {"id": 1, "vehicle_id": "AMB-001", "latitude": 28.5800, "longitude": 77.2200, "status": AmbulanceStatus.AVAILABLE, "hospital_id": 1},
    {"id": 2, "vehicle_id": "AMB-002", "latitude": 28.5500, "longitude": 77.2000, "status": AmbulanceStatus.EN_ROUTE, "hospital_id": 1},
    {"id": 3, "vehicle_id": "AMB-003", "latitude": 19.0900, "longitude": 72.8900, "status": AmbulanceStatus.AVAILABLE, "hospital_id": 2},
    {"id": 4, "vehicle_id": "AMB-004", "latitude": 19.0600, "longitude": 72.8600, "status": AmbulanceStatus.BUSY, "hospital_id": 2},
    {"id": 5, "vehicle_id": "AMB-005", "latitude": 13.1000, "longitude": 80.2800, "status": AmbulanceStatus.AVAILABLE, "hospital_id": 3},
    {"id": 6, "vehicle_id": "AMB-006", "latitude": 12.9600, "longitude": 77.5800, "status": AmbulanceStatus.AVAILABLE, "hospital_id": 4},
    {"id": 7, "vehicle_id": "AMB-007", "latitude": 18.5300, "longitude": 73.8700, "status": AmbulanceStatus.EN_ROUTE, "hospital_id": 6},
]

emergencies_data = [
    {"patient_name": "Ravi Kumar", "severity": EmergencySeverity.CRITICAL, "description": "Cardiac arrest, unresponsive", "latitude": 28.6100, "longitude": 77.2300, "status": EmergencyStatus.PENDING, "assigned_ambulance_id": None, "assigned_hospital_id": None},
    {"patient_name": "Ananya Singh", "severity": EmergencySeverity.HIGH, "description": "Road traffic accident, multiple fractures", "latitude": 19.1000, "longitude": 72.8800, "status": EmergencyStatus.DISPATCHED, "assigned_ambulance_id": 2, "assigned_hospital_id": 1},
    {"patient_name": "Vikram Patel", "severity": EmergencySeverity.MEDIUM, "description": "Burn injury, second degree", "latitude": 13.0500, "longitude": 80.2500, "status": EmergencyStatus.PENDING, "assigned_ambulance_id": None, "assigned_hospital_id": None},
    {"patient_name": "Priya Sharma", "severity": EmergencySeverity.HIGH, "description": "Stroke symptoms, left side weakness", "latitude": 12.9900, "longitude": 77.6000, "status": EmergencyStatus.DISPATCHED, "assigned_ambulance_id": 6, "assigned_hospital_id": 4},
    {"patient_name": "Amit Verma", "severity": EmergencySeverity.LOW, "description": "Food poisoning, dehydration", "latitude": 28.5000, "longitude": 77.1000, "status": EmergencyStatus.PENDING, "assigned_ambulance_id": None, "assigned_hospital_id": None},
    {"patient_name": "Neha Gupta", "severity": EmergencySeverity.CRITICAL, "description": "Severe respiratory distress", "latitude": 18.5400, "longitude": 73.8300, "status": EmergencyStatus.PENDING, "assigned_ambulance_id": None, "assigned_hospital_id": None},
    {"patient_name": "Deepak Joshi", "severity": EmergencySeverity.MEDIUM, "description": "Accidental laceration, bleeding", "latitude": 22.5600, "longitude": 88.3500, "status": EmergencyStatus.RESOLVED, "assigned_ambulance_id": None, "assigned_hospital_id": 8},
    {"patient_name": "Sneha Reddy", "severity": EmergencySeverity.HIGH, "description": "Suspected appendicitis", "latitude": 17.3850, "longitude": 78.4867, "status": EmergencyStatus.DISPATCHED, "assigned_ambulance_id": 7, "assigned_hospital_id": 6},
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    db.query(Emergency).delete()
    db.query(Ambulance).delete()
    db.query(Hospital).delete()
    db.commit()

    for h in hospitals_data:
        db.add(Hospital(**h))
    db.commit()

    for a in ambulances_data:
        db.add(Ambulance(**a))
    db.commit()

    for e in emergencies_data:
        db.add(Emergency(**e, created_at=datetime.now(timezone.utc)))
    db.commit()

    db.close()

    print(f"Seeded {len(hospitals_data)} hospitals, {len(ambulances_data)} ambulances, {len(emergencies_data)} emergencies")


if __name__ == "__main__":
    seed()
