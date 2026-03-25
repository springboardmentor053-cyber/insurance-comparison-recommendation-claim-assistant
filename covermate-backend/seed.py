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
                term_months=240,
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

            # ── Health 2 ──
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

            # ── Extra Health ──
            Policy(provider_id=hdfc.id,  policy_type="health", title="Star Health Comprehensive", premium=12000, term_months=12, deductible=1500, coverage={"hospitalization": True, "day_care": True, "pre_existing": False, "ambulance": True}),
            Policy(provider_id=hdfc.id,  policy_type="health", title="Niva Bupa ReAssure",        premium=14500, term_months=12, deductible=0,    coverage={"hospitalization": True, "day_care": True, "pre_existing": True,  "ambulance": True}),
            Policy(provider_id=icici.id, policy_type="health", title="Care Health Supreme",       premium=17000, term_months=12, deductible=2500, coverage={"hospitalization": True, "day_care": True, "pre_existing": True,  "ambulance": True}),

            # ── Extra Life ──
            Policy(provider_id=lic.id, policy_type="life", title="SBI Life Smart Shield",  premium=18000, term_months=24, deductible=0, coverage={"accidental_death": True, "disability": True,  "critical_illness": False}),
            Policy(provider_id=lic.id, policy_type="life", title="Max Life Online Term",    premium=22000, term_months=36, deductible=0, coverage={"accidental_death": True, "disability": True,  "critical_illness": True}),
            Policy(provider_id=lic.id, policy_type="life", title="Bajaj Allianz iSecure",   premium=16500, term_months=12, deductible=0, coverage={"accidental_death": True, "disability": False, "critical_illness": False}),

            # ── Extra Auto ──
            Policy(provider_id=icici.id, policy_type="auto", title="ICICI Lombard Motor Safe", premium=8500,  term_months=12, deductible=1000, coverage={"third_party": True, "own_damage": True,  "roadside_assistance": True}),
            Policy(provider_id=hdfc.id,  policy_type="auto", title="HDFC Ergo Comprehensive",  premium=11000, term_months=12, deductible=2000, coverage={"third_party": True, "own_damage": True,  "roadside_assistance": True}),
            Policy(provider_id=icici.id, policy_type="auto", title="New India Motor Protect",  premium=7200,  term_months=12, deductible=500,  coverage={"third_party": True, "own_damage": False, "roadside_assistance": False}),

            # ── Extra Home ──
            Policy(provider_id=hdfc.id,  policy_type="home", title="HDFC Home Suraksha",    premium=9000,  term_months=12, deductible=2000, coverage={"fire": True, "theft": True, "natural_disaster": True,  "liability": False}),
            Policy(provider_id=icici.id, policy_type="home", title="Bajaj Home Shield",     premium=6500,  term_months=12, deductible=1000, coverage={"fire": True, "theft": True, "natural_disaster": False, "liability": False}),
            Policy(provider_id=icici.id, policy_type="home", title="Tata AIG Home Protect", premium=11500, term_months=12, deductible=2500, coverage={"fire": True, "theft": True, "natural_disaster": True,  "liability": True}),

            # ── Extra Travel ──
            Policy(provider_id=icici.id, policy_type="travel", title="ICICI Travel Safe Global",   premium=5500, term_months=6, deductible=500,  coverage={"medical": True, "trip_cancellation": True,  "lost_baggage": True,  "delay": False}),
            Policy(provider_id=icici.id, policy_type="travel", title="Bajaj Allianz Travel Elite", premium=7000, term_months=6, deductible=0,    coverage={"medical": True, "trip_cancellation": True,  "lost_baggage": True,  "delay": True}),
            Policy(provider_id=icici.id, policy_type="travel", title="Reliance Travel Care",       premium=4200, term_months=3, deductible=750,  coverage={"medical": True, "trip_cancellation": False, "lost_baggage": True,  "delay": False}),
        ]

        db.add_all(policies)
        db.commit()

        print(f"✅  Seeded {len(providers)} providers and {len(policies)} policies.")

    finally:
        db.close()


if __name__ == "__main__":
    seed()