"""
Seed Script – Populate the database with sample providers and policies.

Run this AFTER the server has been started at least once (so the tables
exist), or call  Base.metadata.create_all()  here before seeding.

Usage:
    cd covermate-backend
    python seed.py
"""

from app.database import SessionLocal, engine, Base
from app.models import Provider, Policy

# Ensure tables exist
Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        # ── Check if data already exists ──
        if db.query(Provider).count() > 0:
            print("⚠️  Database already has providers – skipping seed.")
            return

        # ━━━━━━━━━━ PROVIDERS ━━━━━━━━━━
        providers = [
            Provider(name="LIC of India", country="India"),
            Provider(name="HDFC Ergo", country="India"),
            Provider(name="ICICI Lombard", country="India"),
        ]
        db.add_all(providers)
        db.flush()   # assigns IDs without committing

        lic, hdfc, icici = providers

        # ━━━━━━━━━━ POLICIES ━━━━━━━━━━
        policies = [
            # ── Life Insurance ──
            Policy(
                provider_id=lic.id,
                policy_type="life",
                title="LIC Jeevan Anand",
                coverage={
                    "death_benefit": "10,00,000",
                    "maturity_benefit": "10,00,000",
                    "bonus": "yearly",
                },
                premium=5000,
                term_months=240,   # 20 years
                deductible=0,
                tnc_url="https://licindia.in/jeevan-anand-tnc",
            ),

            # ── Health Insurance ──
            Policy(
                provider_id=hdfc.id,
                policy_type="health",
                title="HDFC Ergo Optima Secure",
                coverage={
                    "sum_insured": "5,00,000",
                    "room_rent": "no_cap",
                    "pre_hospitalization": "30_days",
                    "post_hospitalization": "60_days",
                    "daycare_procedures": True,
                },
                premium=8500,
                term_months=12,
                deductible=5000,
                tnc_url="https://hdfcergo.com/optima-secure-tnc",
            ),

            # ── Auto Insurance ──
            Policy(
                provider_id=icici.id,
                policy_type="auto",
                title="ICICI Lombard Car Insurance",
                coverage={
                    "own_damage": "IDV based",
                    "third_party": "unlimited",
                    "personal_accident": "15,00,000",
                    "roadside_assistance": True,
                },
                premium=12000,
                term_months=12,
                deductible=2500,
                tnc_url="https://icicilombard.com/car-insurance-tnc",
            ),

            # ── Home Insurance ──
            Policy(
                provider_id=hdfc.id,
                policy_type="home",
                title="HDFC Ergo Home Shield",
                coverage={
                    "structure": "50,00,000",
                    "contents": "10,00,000",
                    "natural_disaster": True,
                    "theft": True,
                },
                premium=3500,
                term_months=12,
                deductible=1000,
                tnc_url="https://hdfcergo.com/home-shield-tnc",
            ),

            # ── Travel Insurance ──
            Policy(
                provider_id=icici.id,
                policy_type="travel",
                title="ICICI Lombard Travel Safe",
                coverage={
                    "medical_emergency": "5,00,000",
                    "trip_cancellation": "1,00,000",
                    "baggage_loss": "50,000",
                    "flight_delay": "10,000",
                },
                premium=1500,
                term_months=1,
                deductible=500,
                tnc_url="https://icicilombard.com/travel-safe-tnc",
            ),

            # ── Another Health Policy ──
            Policy(
                provider_id=lic.id,
                policy_type="health",
                title="LIC Cancer Cover",
                coverage={
                    "sum_insured": "10,00,000",
                    "early_stage": "25%",
                    "major_stage": "100%",
                    "income_benefit": "1% monthly for 5 years",
                },
                premium=2000,
                term_months=12,
                deductible=0,
                tnc_url="https://licindia.in/cancer-cover-tnc",
            ),
        ]

        db.add_all(policies)
        db.commit()

        print(f"✅  Seeded {len(providers)} providers and {len(policies)} policies.")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
