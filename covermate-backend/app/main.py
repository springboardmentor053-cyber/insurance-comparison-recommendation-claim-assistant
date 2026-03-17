from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.database import engine, Base, SessionLocal

# ✅ All models imported before create_all
from app.models.user import User
from app.models.provider import Provider
from app.models.policy import Policy, PolicyType
from app.models.user_policy import UserPolicy
from app.models.claim import Claim
from app.models.claim_document import ClaimDocument
from app.models.claim_status_history import ClaimStatusHistory
from app.models.recommendation import Recommendation

# Routers
from app.routers import auth, policy, recommendation, user_policies, claims
from app.routers import admin

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Create uploads folder if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# ✅ Serve uploaded files at /uploads — so frontend can open them
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Create all DB tables
Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(policy.router)
app.include_router(recommendation.router)
app.include_router(user_policies.router)
app.include_router(claims.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"message": "CoverMate API Running"}


@app.on_event("startup")
def seed_data():
    db = SessionLocal()

    if db.query(Provider).first():
        db.close()
        return

    provider1 = Provider(name="LIC India", country="India")
    provider2 = Provider(name="HDFC Ergo", country="India")
    provider3 = Provider(name="Star Health", country="India")
    provider4 = Provider(name="Bajaj Allianz", country="India")

    db.add_all([provider1, provider2, provider3, provider4])
    db.commit()

    policies = [
        Policy(provider_id=provider1.id, policy_type=PolicyType.health,
               title="Health Secure Plan",
               coverage={"hospitalization": "5 Lakhs", "pre_existing": "2 years"},
               premium=5000, term_months=12, deductible=2000,
               tnc_url="https://lic.in/health"),
        Policy(provider_id=provider2.id, policy_type=PolicyType.auto,
               title="Car Protect Plus",
               coverage={"accident": "Full", "third_party": "Yes"},
               premium=8000, term_months=12, deductible=3000,
               tnc_url="https://hdfcergo.com/auto"),
        Policy(provider_id=provider3.id, policy_type=PolicyType.health,
               title="Family Health Shield",
               coverage={"hospitalization": "10 Lakhs", "maternity": "Yes"},
               premium=15000, term_months=12, deductible=5000,
               tnc_url="https://starhealth.in/family"),
        Policy(provider_id=provider4.id, policy_type=PolicyType.life,
               title="Term Life Guard",
               coverage={"death_benefit": "50 Lakhs", "accidental": "Yes"},
               premium=12000, term_months=24, deductible=0,
               tnc_url="https://bajajallianz.com/life"),
        Policy(provider_id=provider1.id, policy_type=PolicyType.travel,
               title="Travel Safe Cover",
               coverage={"trip_cancellation": "Yes", "medical": "2 Lakhs"},
               premium=3000, term_months=6, deductible=1000,
               tnc_url="https://lic.in/travel"),
        Policy(provider_id=provider2.id, policy_type=PolicyType.home,
               title="Home Shield Plus",
               coverage={"fire": "Yes", "theft": "Yes", "natural_disaster": "Yes"},
               premium=6000, term_months=12, deductible=2500,
               tnc_url="https://hdfcergo.com/home"),
        Policy(provider_id=provider3.id, policy_type=PolicyType.health,
               title="Senior Care Premium",
               coverage={"hospitalization": "8 Lakhs", "critical_illness": "Yes"},
               premium=25000, term_months=12, deductible=8000,
               tnc_url="https://starhealth.in/senior"),
        Policy(provider_id=provider4.id, policy_type=PolicyType.life,
               title="Whole Life Assurance",
               coverage={"death_benefit": "1 Crore", "bonus": "Yes"},
               premium=45000, term_months=36, deductible=0,
               tnc_url="https://bajajallianz.com/whole-life"),
    ]

    db.add_all(policies)
    db.commit()
    db.close()