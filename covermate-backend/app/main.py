"""
CoverMate API – Main Application Entry Point.

This file creates the FastAPI application, adds middleware (CORS),
includes all route modules, and creates the database tables on startup.

To run:
    cd covermate-backend
    uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.config import CORS_ORIGINS
from app.routes import (
    auth_routes, profile_routes, policy_routes, user_policy_routes,
    recommendation_routes, claims_routes, admin_routes,
    addon_routes, network_routes, vehicle_routes, policy_pdf_routes,
)
from fastapi.staticfiles import StaticFiles

# ─────────────────── Create App ───────────────────
app = FastAPI(
    title="CoverMate API",
    description="Insurance Comparison, Recommendation & Claim Assistant",
    version="1.0.0",
)

# ─────────────────── CORS Middleware ───────────────────
# This allows the React frontend (running on a different port) to
# communicate with our API.  Without this, browsers block cross-origin
# requests for security reasons.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,   # e.g. ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],           # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],           # Authorization, Content-Type, etc.
)

# ─────────────────── Create DB Tables ───────────────────
# This reads all the model classes (User, Provider, Policy, …) and
# creates the corresponding PostgreSQL tables if they don't exist yet.
Base.metadata.create_all(bind=engine)

# ─────────────────── Include Routers ───────────────────
app.include_router(auth_routes.router)
app.include_router(profile_routes.router)
app.include_router(policy_routes.router)
app.include_router(user_policy_routes.router)
app.include_router(recommendation_routes.router)
app.include_router(claims_routes.router)
app.include_router(admin_routes.router)
app.include_router(addon_routes.router)
app.include_router(network_routes.router)
app.include_router(vehicle_routes.router)
app.include_router(policy_pdf_routes.router)

# ─────────────────── Mount Static Files ───────────────────
import os
os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/policies", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ─────────────────── Root Health Check ───────────────────
@app.get("/", tags=["Health"])
def root():
    """Simple health-check endpoint to verify the API is running."""
    return {"message": "CoverMate API is running 🚀"}
