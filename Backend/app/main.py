from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.database import Base, engine
from app.routers import auth, policies, recommendations, claims, admin
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import os

# This will create any missing columns
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Covermate API", 
    description="Insurance Comparison & Recommendation System",
    version="2.0.0"
)

# CORS – allow both common development ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(policies.router)
app.include_router(recommendations.router)
app.include_router(claims.router)
app.include_router(admin.router)

@app.get("/")
def root():
    return {
        "message": "Covermate Backend Running",
        "version": "2.0.0",
        "milestone": "2 - Recommendations Engine",
        "endpoints": {
            "auth": "/auth",
            "policies": "/policies",
            "recommendations": "/recommendations",
            "claims": "/claims"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}