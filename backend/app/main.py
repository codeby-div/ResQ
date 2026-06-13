from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Emergency Resource Allocator API"}
    