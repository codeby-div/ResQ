import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from ..database import get_db
from ..models import Notification
from ..schemas import NotificationCreate, NotificationResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationResponse])
def list_notifications(
    user_id: int | None = None,
    unread_only: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(Notification).order_by(Notification.created_at.desc())
    if user_id:
        query = query.filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.read == 0)
    return query.limit(limit).all()


@router.post("", response_model=NotificationResponse, status_code=201)
def create_notification(data: NotificationCreate, db: Session = Depends(get_db)):
    notif = Notification(
        user_id=data.user_id,
        emergency_id=data.emergency_id,
        title=data.title,
        body=data.body,
        type=data.type or "info",
        channel=data.channel or "in_app",
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


@router.patch("/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if notif:
        notif.read = 1
        db.commit()
    return {"ok": True}


@router.post("/mark-all-read")
def mark_all_read(user_id: int, db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.user_id == user_id, Notification.read == 0
    ).update({"read": 1})
    db.commit()
    return {"ok": True}
