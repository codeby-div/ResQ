import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from .database import engine, Base
from .routers import hospitals, ambulances, emergencies, auth, notifications
from .services.socket_manager import sio
from .routers.socket_events import register_socket_handlers

Base.metadata.create_all(bind=engine)
from .database import SessionLocal
from .models import User
from .auth import hash_password

db = SessionLocal()
if not db.query(User).first():
    db.add(User(username="admin", hashed_password=hash_password("admin123"), role="admin", display_name="Admin"))
    db.commit()
    logging.info("Created default admin: admin / admin123")
db.close()
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="ResQ - Emergency Resource Allocator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hospitals.router)
app.include_router(ambulances.router)
app.include_router(emergencies.router)
app.include_router(auth.router)
app.include_router(notifications.router)

# Mount Socket.IO
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
register_socket_handlers(sio)


@app.get("/")
def root():
    return {"message": "ResQ API is running with WebSocket & Notifications"}


@app.get("/health")
def health():
    return {"status": "ok"}
