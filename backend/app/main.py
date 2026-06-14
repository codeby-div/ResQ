from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import hospitals, ambulances, emergencies, auth

Base.metadata.create_all(bind=engine)

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


@app.get("/")
def root():
    return {"message": "ResQ API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
