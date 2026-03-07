from fastapi import FastAPI
from app.database import Base, engine
from app.routers import auth, policies, recommendations
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

# This will create any missing columns
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Covermate API", 
    description="Insurance Comparison & Recommendation System",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(policies.router)
app.include_router(recommendations.router)

@app.get("/")
def root():
    return {
        "message": "Covermate Backend Running",
        "version": "2.0.0",
        "milestone": "2 - Recommendations Engine",
        "endpoints": {
            "auth": "/auth",
            "policies": "/policies",
            "recommendations": "/recommendations"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}