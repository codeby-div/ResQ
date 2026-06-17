import asyncio
import hashlib
import logging
import threading
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from datetime import datetime, timezone
from math import radians, cos, sin, asin, sqrt

from ..database import get_db
from ..models import Emergency, EmergencySeverity, EmergencyStatus, Ambulance, Notification
from ..schemas import (
    EmergencyCreate, EmergencyResponse, EmergencyUpdate,
    RecommendationResponse, TrackingResponse,
)
from ..ml.severity import predict_severity
from ..ml.recommender import (
    recommend_hospitals,
    recommend_ambulances,
    estimate_response_time,
    predict_hotspots,
)
from ..services.socket_manager import sio, emit_tracking_update, emit_emergency_update, emit_ambulance_update
from ..services.notifications import (
    notify_new_emergency,
    notify_ambulance_assigned,
    notify_status_change,
    send_sms,
    send_email,
    send_push,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/emergencies", tags=["Emergencies"])

# In-memory tracking simulation state
_tracking_simulations: dict[int, dict] = {}
_tracking_threads: dict[int, threading.Thread] = {}


def _simulate_tracking(emergency_id: int, amb: Ambulance, emergency: Emergency):
    total_trip_s = 600
    steps = 60
    interval = total_trip_s / steps

    lat_start, lng_start = amb.latitude, amb.longitude
    lat_end, lng_end = emergency.latitude, emergency.longitude

    # Route points
    route = [
        {"lat": round(lat_start + (lat_end - lat_start) * i / steps, 6),
         "lng": round(lng_start + (lng_end - lng_start) * i / steps, 6)}
        for i in range(steps + 1)
    ]

    _tracking_simulations[emergency_id] = {
        "step": 0,
        "total_steps": steps,
        "interval": interval,
        "route": route,
        "amb_start_lat": lat_start,
        "amb_start_lng": lng_start,
        "emergency": {"lat": lat_end, "lng": lng_end},
        "ambulance_vehicle_id": amb.vehicle_id,
        "driver_name": amb.driver_name,
        "driver_phone": amb.driver_phone,
        "running": True,
    }

    def run():
        import time
        sim = _tracking_simulations.get(emergency_id)
        if not sim:
            return
        for step in range(steps + 1):
            if not sim.get("running"):
                break
            sim["step"] = step
            progress = step / steps
            lat = lat_start + (lat_end - lat_start) * progress
            lng = lng_start + (lng_end - lng_start) * progress
            eta = int(total_trip_s * (1 - progress))

            data = {
                "ambulance_lat": round(lat, 6),
                "ambulance_lng": round(lng, 6),
                "ambulance_vehicle_id": amb.vehicle_id,
                "driver_name": amb.driver_name,
                "driver_phone": amb.driver_phone,
                "status": "dispatched" if progress < 1 else "resolved",
                "eta_seconds": eta,
                "progress_pct": round(progress * 100, 1),
                "route": route,
                "emergency_lat": lat_end,
                "emergency_lng": lng_end,
            }

            # Use asyncio to emit via socket
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(emit_tracking_update(emergency_id, data, None))
                loop.close()
            except Exception as e:
                logger.error(f"Socket emit error: {e}")

            if step == steps:
                # Auto-resolve
                from ..database import SessionLocal
                db_session = SessionLocal()
                try:
                    em = db_session.query(Emergency).filter(Emergency.id == emergency_id).first()
                    if em and em.status == EmergencyStatus.DISPATCHED:
                        em.status = EmergencyStatus.RESOLVED
                        db_session.commit()
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        loop.run_until_complete(emit_emergency_update({
                            "emergency_id": emergency_id,
                            "status": "resolved",
                            "patient_name": em.patient_name,
                        }))
                        loop.close()
                except Exception as e:
                    logger.error(f"Auto-resolve error: {e}")
                finally:
                    db_session.close()
                sim["running"] = False

            time.sleep(interval)

    thread = threading.Thread(target=run, daemon=True)
    _tracking_threads[emergency_id] = thread
    thread.start()
    logger.info(f"Started tracking simulation for emergency {emergency_id}")


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

    if data.severity and EmergencySeverity(data.severity).value != severity.value:
        severity = EmergencySeverity(data.severity)

    emergency = Emergency(
        patient_name=data.patient_name,
        description=data.description,
        latitude=data.latitude,
        longitude=data.longitude,
        severity=severity,
        phone=data.phone,
        email=data.email,
        push_token=data.push_token,
    )
    db.add(emergency)
    db.commit()
    db.refresh(emergency)

    location = f"{data.latitude:.4f}, {data.longitude:.4f}"

    # Create in-app notification
    notif = Notification(
        title=f"New {severity.value} Emergency #{emergency.id}",
        body=f"{data.patient_name} — {data.description or 'No description'} at {location}",
        type="emergency",
        channel="in_app",
        emergency_id=emergency.id,
    )
    db.add(notif)
    db.commit()

    # Notify via services
    notify_new_emergency(emergency.id, data.patient_name, severity.value, location)

    if data.phone:
        send_sms(data.phone, f"ResQ: Emergency #{emergency.id} registered. Help is on the way. Track at resq.app/track/{emergency.id}")
    if data.email:
        send_email(data.email, f"Emergency #{emergency.id} Registered",
                     f"<h2>Emergency Registered</h2><p>Your emergency has been logged as #{emergency.id} with {severity.value} severity.</p><p>Track status on the ResQ app.</p>")

    # Broadcast via WebSocket
    import asyncio
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(emit_emergency_update({
            "emergency_id": emergency.id,
            "patient_name": data.patient_name,
            "severity": severity.value,
            "status": "pending",
            "latitude": data.latitude,
            "longitude": data.longitude,
        }))
        loop.close()
    except Exception as e:
        logger.error(f"Socket broadcast error: {e}")

    return emergency


@router.patch("/{emergency_id}", response_model=EmergencyResponse)
def update_emergency(emergency_id: int, data: EmergencyUpdate, db: Session = Depends(get_db)):
    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")

    old_status = emergency.status.value if emergency.status else None

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(emergency, field, value)

    db.commit()
    db.refresh(emergency)

    new_status = emergency.status.value if emergency.status else None

    # Notify on status change
    if old_status != new_status:
        notify_status_change(emergency.id, emergency.patient_name, new_status or "unknown")

        notif = Notification(
            title=f"Emergency #{emergency.id} is now {new_status}",
            body=f"Status updated for {emergency.patient_name}",
            type="status",
            channel="in_app",
            emergency_id=emergency.id,
        )
        db.add(notif)
        db.commit()

        if emergency.phone:
            send_sms(emergency.phone, f"ResQ: Your emergency #{emergency.id} status: {new_status}")
        if emergency.email:
            send_email(emergency.email, f"Status Update: #{emergency.id}",
                         f"<h2>Status Update</h2><p>Your emergency #{emergency.id} is now: <strong>{new_status}</strong></p>")

        import asyncio
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(emit_emergency_update({
                "emergency_id": emergency.id,
                "status": new_status,
                "patient_name": emergency.patient_name,
            }))
            loop.close()
        except Exception as e:
            logger.error(f"Socket broadcast error: {e}")

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
    notify_phone: str | None = None,
    notify_email: str | None = None,
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

    # Start tracking simulation if ambulance assigned
    if ambulance_id:
        amb = db.query(Ambulance).filter(Ambulance.id == ambulance_id).first()
        if amb:
            _simulate_tracking(emergency_id, amb, emergency)
            eta_min = 10
            notify_ambulance_assigned(emergency_id, emergency.patient_name, amb.vehicle_id, eta_min)

            notif = Notification(
                title=f"Ambulance {amb.vehicle_id} Dispatched",
                body=f"{amb.vehicle_id} assigned to {emergency.patient_name}. ETA ~{eta_min} min.",
                type="dispatch",
                channel="in_app",
                emergency_id=emergency.id,
            )
            db.add(notif)
            db.commit()

            phone = notify_phone or emergency.phone
            email = notify_email or emergency.email
            if phone:
                send_sms(phone, f"ResQ: {amb.vehicle_id} dispatched to emergency #{emergency_id}. ETA ~{eta_min} min.")
            if email:
                send_email(email, f"Ambulance Dispatched — #{emergency_id}",
                             f"<h2>Ambulance Dispatched</h2><p><strong>{amb.vehicle_id}</strong> is en route.</p><p>Estimated arrival: ~{eta_min} minutes.</p>")

            import asyncio
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(emit_ambulance_update(ambulance_id, {
                    "emergency_id": emergency_id,
                    "status": "dispatched",
                    "patient_name": emergency.patient_name,
                }))
                loop.close()
            except Exception as e:
                logger.error(f"Socket broadcast error: {e}")

    return emergency


@router.get("/{emergency_id}/tracking", response_model=TrackingResponse)
def track_emergency(emergency_id: int, db: Session = Depends(get_db)):
    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")

    resp = TrackingResponse(
        status=emergency.status.value,
        emergency_lat=emergency.latitude,
        emergency_lng=emergency.longitude,
    )

    if emergency.status == EmergencyStatus.PENDING:
        return resp

    if emergency.assigned_ambulance_id and emergency.status == EmergencyStatus.DISPATCHED:
        amb = db.query(Ambulance).filter(Ambulance.id == emergency.assigned_ambulance_id).first()
        if amb:
            resp.ambulance_vehicle_id = amb.vehicle_id
            resp.driver_name = amb.driver_name
            resp.driver_phone = amb.driver_phone
            total_trip = 600
            import hashlib
            seed_str = f"{emergency.id}-{amb.id}"
            hash_val = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
            progress = (hash_val % 60 + 5) / 100
            resp.progress_pct = round(progress * 100, 1)
            remaining = total_trip * (1 - progress)
            resp.eta_seconds = int(remaining)
            lat = emergency.latitude + (amb.latitude - emergency.latitude) * (1 - progress)
            lng = emergency.longitude + (amb.longitude - emergency.longitude) * (1 - progress)
            resp.ambulance_lat = round(lat, 6)
            resp.ambulance_lng = round(lng, 6)
            steps_count = 10
            resp.route = [
                {
                    "lat": round(amb.latitude + (emergency.latitude - amb.latitude) * i / steps_count, 6),
                    "lng": round(amb.longitude + (emergency.longitude - amb.longitude) * i / steps_count, 6),
                }
                for i in range(steps_count + 1)
            ]

    if emergency.status == EmergencyStatus.RESOLVED:
        resp.progress_pct = 100
        resp.eta_seconds = 0

    return resp


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
