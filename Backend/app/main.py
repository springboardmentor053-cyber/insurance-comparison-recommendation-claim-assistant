from fastapi import FastAPI
from .database import Base, engine
from .routers import auth, policies
from fastapi.middleware.cors import CORSMiddleware

# This will create any missing columns like dob or risk_profile automatically
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(policies.router)

@app.get("/")
def root():
    return {"message": "Covermate Backend Running"}