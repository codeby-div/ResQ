import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from .database import engine, Base
from .routers import hospitals, ambulances, emergencies, auth, notifications
from .services.socket_manager import sio
from .routers.socket_events import register_socket_handlers

Base.metadata.create_all(bind=engine)

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
