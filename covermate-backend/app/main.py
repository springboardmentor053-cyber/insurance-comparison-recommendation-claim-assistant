from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.models import user, provider, policy, recommendation
from app.models import recommendation
from app.models.provider import Provider
from app.models.policy import Policy, PolicyType
from app.routers import auth, policy, recommendation


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(policy.router)
app.include_router(recommendation.router)

@app.get("/")
def root():
    return {"message": "CoverMate API Running"}

# Seed Data
@app.on_event("startup")
def seed_data():
    db = SessionLocal()

    if db.query(Provider).first():
        db.close()
        return

    provider1 = Provider(name="LIC India", country="India")
    provider2 = Provider(name="HDFC Ergo", country="India")

    db.add_all([provider1, provider2])
    db.commit()

    policy1 = Policy(
        provider_id=provider1.id,
        policy_type=PolicyType.health,
        title="Health Secure Plan",
        coverage={"hospitalization": "5 Lakhs", "pre_existing": "2 years"},
        premium=5000,
        term_months=12,
        deductible=2000,
        tnc_url="https://lic.in/health"
    )

    policy2 = Policy(
        provider_id=provider2.id,
        policy_type=PolicyType.auto,
        title="Car Protect Plus",
        coverage={"accident": "Full", "third_party": "Yes"},
        premium=8000,
        term_months=12,
        deductible=3000,
        tnc_url="https://hdfcergo.com/auto"
    )

    db.add_all([policy1, policy2])
    db.commit()
    db.close()
