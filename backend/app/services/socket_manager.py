import socketio
from typing import Optional
from sqlalchemy.orm import Session

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

# Track which emergency IDs each socket is watching
# socket_id -> set of emergency_ids
socket_rooms: dict[str, set[int]] = {}


async def emit_tracking_update(emergency_id: int, data: dict, db: Session):
    room = f"tracking:{emergency_id}"
    await sio.emit("tracking_update", {"emergency_id": emergency_id, **data}, room=room)


async def emit_emergency_update(data: dict):
    await sio.emit("emergency_update", data)


async def emit_ambulance_update(ambulance_id: int, data: dict):
    await sio.emit("ambulance_update", {"ambulance_id": ambulance_id, **data})
