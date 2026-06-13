from fastapi import FastAPI
from app.api.hospital import router as hospital_router

app = FastAPI()
app.include_router(hospital_router)

@app.get("/")
def home():
    return {"message": "Emergency Resource Allocator API"}
    