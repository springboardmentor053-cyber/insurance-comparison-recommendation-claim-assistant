"""
CoverMate API – Main Application Entry Point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # ✅ ADD THIS
import os

from app.database import Base, engine
from app.config import CORS_ORIGINS
from app.routes import auth_routes, profile_routes, policy_routes, recommendation_routes
from app.routes import claims_routes
from app.routes import admin_routes

# ─────────────────── Create App ───────────────────
app = FastAPI(
    title="CoverMate API",
    description="Insurance Comparison, Recommendation & Claim Assistant",
    version="1.0.0",
)

# ─────────────────── CORS Middleware ───────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────── Create DB Tables ───────────────────
Base.metadata.create_all(bind=engine)

# ─────────────────── Include Routers ───────────────────
app.include_router(auth_routes.router)
app.include_router(profile_routes.router)
app.include_router(policy_routes.router)
app.include_router(recommendation_routes.router)
app.include_router(claims_routes.router)
app.include_router(admin_routes.router)

# ─────────────────── Serve Uploaded Files ───────────────────  ✅ ADD THIS
# Makes uploaded files accessible at: http://127.0.0.1:8000/uploads/...
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ─────────────────── Root Health Check ───────────────────
@app.get("/", tags=["Health"])
def root():
    return {"message": "CoverMate API is running 🚀"}