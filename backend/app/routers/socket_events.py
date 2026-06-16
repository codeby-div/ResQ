import logging
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Emergency, EmergencyStatus
from ..services.socket_manager import socket_rooms

logger = logging.getLogger(__name__)


def register_socket_handlers(sio):
    @sio.event
    async def connect(sid, environ, auth):
        logger.info(f"Socket connected: {sid}")

    @sio.event
    async def disconnect(sid):
        logger.info(f"Socket disconnected: {sid}")
        socket_rooms.pop(sid, None)

    @sio.event
    async def join_tracking(sid, data):
        emergency_id = data.get("emergency_id")
        if not emergency_id:
            return
        room = f"tracking:{emergency_id}"
        sio.enter_room(sid, room)
        if sid not in socket_rooms:
            socket_rooms[sid] = set()
        socket_rooms[sid].add(emergency_id)
        logger.info(f"{sid} joined tracking room {room}")

    @sio.event
    async def leave_tracking(sid, data):
        emergency_id = data.get("emergency_id")
        if not emergency_id:
            return
        room = f"tracking:{emergency_id}"
        sio.leave_room(sid, room)
        if sid in socket_rooms:
            socket_rooms[sid].discard(emergency_id)
        logger.info(f"{sid} left tracking room {room}")

    @sio.event
    async def join_all_emergencies(sid):
        sio.enter_room(sid, "all_emergencies")
        logger.info(f"{sid} joined all_emergencies room")

    @sio.event
    async def leave_all_emergencies(sid):
        sio.leave_room(sid, "all_emergencies")
        logger.info(f"{sid} left all_emergencies room")

    @sio.event
    async def subscribe_ambulance(sid, data):
        ambulance_id = data.get("ambulance_id")
        if not ambulance_id:
            return
        room = f"ambulance:{ambulance_id}"
        sio.enter_room(sid, room)
        logger.info(f"{sid} subscribed to ambulance room {room}")

    @sio.event
    async def unsubscribe_ambulance(sid, data):
        ambulance_id = data.get("ambulance_id")
        if not ambulance_id:
            return
        room = f"ambulance:{ambulance_id}"
        sio.leave_room(sid, room)
        logger.info(f"{sid} unsubscribed from ambulance room {room}")
