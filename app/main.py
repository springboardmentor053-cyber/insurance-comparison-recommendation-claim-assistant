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
from app.routes import auth_routes, profile_routes, policy_routes

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
    allow_origins=["*"],   # e.g. ["http://localhost:3000"]
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


# ─────────────────── Root Health Check ───────────────────
@app.get("/", tags=["Health"])
def root():
    """Simple health-check endpoint to verify the API is running."""
    return {"message": "CoverMate API is running 🚀"}
