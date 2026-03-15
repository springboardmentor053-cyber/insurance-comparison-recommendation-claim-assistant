"""
Seed Script – Populates the database with providers and policies.
Run:  cd covermate-backend && python seed.py
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "covermate-backend"))

from app.database import SessionLocal, engine, Base
from app import models

# Ensure tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ─── Clear existing ───
db.query(models.Policy).delete()
db.query(models.Provider).delete()
db.commit()

# ══════════════════ PROVIDERS ══════════════════

providers_data = [
    {"name": "LIC of India", "country": "India"},
    {"name": "HDFC Ergo", "country": "India"},
    {"name": "ICICI Lombard", "country": "India"},
    {"name": "Star Health", "country": "India"},
    {"name": "Bajaj Allianz", "country": "India"},
    {"name": "Max Life", "country": "India"},
    {"name": "Tata AIG", "country": "India"},
]

providers = {}
for p in providers_data:
    prov = models.Provider(**p)
    db.add(prov)
    db.flush()
    providers[p["name"]] = prov.id

db.commit()
print(f"✅ Inserted {len(providers)} providers")

# ══════════════════ POLICIES ══════════════════

policies_data = [
    # ──────────── HEALTH (5 policies) ────────────
    {
        "provider_id": providers["Star Health"],
        "policy_type": "health",
        "title": "Star Comprehensive Health",
        "premium": 1200,
        "term_months": 12,
        "deductible": 0,
        "tnc_url": "https://www.starhealth.in/policy-wordings",
        "coverage": {
            "sum_insured": "₹5,00,000",
            "hospitalization": True,
            "day_care": True,
            "pre_hospitalization": "30 days",
            "post_hospitalization": "60 days",
            "ambulance": "₹2,500",
            "no_claim_bonus": True,
        },
    },
    {
        "provider_id": providers["HDFC Ergo"],
        "policy_type": "health",
        "title": "HDFC Ergo Optima Secure",
        "premium": 1800,
        "term_months": 12,
        "deductible": 5000,
        "tnc_url": "https://www.hdfcergo.com/health-insurance",
        "coverage": {
            "sum_insured": "₹10,00,000",
            "hospitalization": True,
            "day_care": True,
            "maternity": True,
            "pre_hospitalization": "60 days",
            "post_hospitalization": "90 days",
            "no_claim_bonus": True,
            "restore_benefit": True,
        },
    },
    {
        "provider_id": providers["ICICI Lombard"],
        "policy_type": "health",
        "title": "ICICI Complete Health",
        "premium": 1500,
        "term_months": 12,
        "deductible": 2500,
        "tnc_url": "https://www.icicilombard.com/health-insurance",
        "coverage": {
            "sum_insured": "₹7,50,000",
            "hospitalization": True,
            "day_care": True,
            "pre_hospitalization": "30 days",
            "post_hospitalization": "60 days",
            "critical_illness": True,
            "no_claim_bonus": True,
        },
    },
    {
        "provider_id": providers["Bajaj Allianz"],
        "policy_type": "health",
        "title": "Bajaj Health Guard",
        "premium": 999,
        "term_months": 12,
        "deductible": 0,
        "tnc_url": "https://www.bajajallianz.com/health-insurance-plans.html",
        "coverage": {
            "sum_insured": "₹3,00,000",
            "hospitalization": True,
            "day_care": True,
            "pre_hospitalization": "30 days",
            "post_hospitalization": "60 days",
            "no_claim_bonus": True,
        },
    },
    {
        "provider_id": providers["LIC of India"],
        "policy_type": "health",
        "title": "LIC Cancer Cover",
        "premium": 650,
        "term_months": 12,
        "deductible": 0,
        "tnc_url": "https://licindia.in/web/guest/cancer-cover",
        "coverage": {
            "sum_insured": "₹10,00,000",
            "early_stage": "25% lump sum",
            "major_stage": "100% lump sum",
            "income_benefit": True,
            "premium_waiver": True,
        },
    },

    # ──────────── LIFE (4 policies) ────────────
    {
        "provider_id": providers["LIC of India"],
        "policy_type": "life",
        "title": "LIC Jeevan Anand",
        "premium": 5000,
        "term_months": 240,
        "deductible": 0,
        "tnc_url": "https://licindia.in/web/guest/jeevan-anand-plan",
        "coverage": {
            "sum_assured": "₹25,00,000",
            "death_benefit": True,
            "maturity_benefit": True,
            "bonus": "Reversionary bonus",
            "loan_facility": True,
            "tax_benefit": "80C + 10(10D)",
        },
    },
    {
        "provider_id": providers["Max Life"],
        "policy_type": "life",
        "title": "Max Life Smart Secure Plus",
        "premium": 3500,
        "term_months": 360,
        "deductible": 0,
        "tnc_url": "https://www.maxlifeinsurance.com/term-insurance-plans",
        "coverage": {
            "sum_assured": "₹1,00,00,000",
            "death_benefit": True,
            "terminal_illness": True,
            "accidental_death": "2x coverage",
            "premium_waiver": True,
            "tax_benefit": "80C + 10(10D)",
        },
    },
    {
        "provider_id": providers["HDFC Ergo"],
        "policy_type": "life",
        "title": "HDFC Life Click 2 Protect",
        "premium": 2800,
        "term_months": 300,
        "deductible": 0,
        "tnc_url": "https://www.hdfclife.com/term-insurance-plans",
        "coverage": {
            "sum_assured": "₹75,00,000",
            "death_benefit": True,
            "critical_illness_cover": True,
            "accidental_death": "1.5x coverage",
            "premium_return": False,
            "tax_benefit": "80C + 10(10D)",
        },
    },
    {
        "provider_id": providers["Bajaj Allianz"],
        "policy_type": "life",
        "title": "Bajaj Allianz eTouch",
        "premium": 1500,
        "term_months": 300,
        "deductible": 0,
        "tnc_url": "https://www.bajajallianzlife.com/life-insurance/term-insurance.html",
        "coverage": {
            "sum_assured": "₹50,00,000",
            "death_benefit": True,
            "terminal_illness": True,
            "premium_waiver": False,
            "online_discount": "10% off",
            "tax_benefit": "80C + 10(10D)",
        },
    },

    # ──────────── AUTO (4 policies) ────────────
    {
        "provider_id": providers["ICICI Lombard"],
        "policy_type": "auto",
        "title": "ICICI Lombard Car Insurance",
        "premium": 4500,
        "term_months": 12,
        "deductible": 2500,
        "tnc_url": "https://www.icicilombard.com/motor-insurance/car-insurance",
        "coverage": {
            "idv": "₹6,00,000",
            "third_party": True,
            "own_damage": True,
            "personal_accident": "₹15,00,000",
            "roadside_assistance": True,
            "cashless_garages": "4,600+",
        },
    },
    {
        "provider_id": providers["Bajaj Allianz"],
        "policy_type": "auto",
        "title": "Bajaj Allianz Motor Protect",
        "premium": 3800,
        "term_months": 12,
        "deductible": 2000,
        "tnc_url": "https://www.bajajallianz.com/motor-insurance.html",
        "coverage": {
            "idv": "₹5,00,000",
            "third_party": True,
            "own_damage": True,
            "personal_accident": "₹15,00,000",
            "zero_depreciation": True,
            "engine_protect": True,
        },
    },
    {
        "provider_id": providers["HDFC Ergo"],
        "policy_type": "auto",
        "title": "HDFC Ergo Motor Insurance",
        "premium": 5200,
        "term_months": 12,
        "deductible": 3000,
        "tnc_url": "https://www.hdfcergo.com/motor-insurance",
        "coverage": {
            "idv": "₹8,00,000",
            "third_party": True,
            "own_damage": True,
            "personal_accident": "₹15,00,000",
            "zero_depreciation": True,
            "return_to_invoice": True,
            "roadside_assistance": True,
        },
    },
    {
        "provider_id": providers["Tata AIG"],
        "policy_type": "auto",
        "title": "Tata AIG Auto Secure",
        "premium": 3200,
        "term_months": 12,
        "deductible": 1500,
        "tnc_url": "https://www.tataaig.com/motor-insurance",
        "coverage": {
            "idv": "₹4,50,000",
            "third_party": True,
            "own_damage": True,
            "personal_accident": "₹15,00,000",
            "cashless_garages": "3,800+",
            "ncb_protection": True,
        },
    },

    # ──────────── HOME (4 policies) ────────────
    {
        "provider_id": providers["HDFC Ergo"],
        "policy_type": "home",
        "title": "HDFC Ergo Home Shield",
        "premium": 2500,
        "term_months": 12,
        "deductible": 1000,
        "tnc_url": "https://www.hdfcergo.com/home-insurance",
        "coverage": {
            "structure": "₹50,00,000",
            "contents": "₹10,00,000",
            "fire": True,
            "earthquake": True,
            "flood": True,
            "burglary": True,
            "third_party_liability": True,
        },
    },
    {
        "provider_id": providers["ICICI Lombard"],
        "policy_type": "home",
        "title": "ICICI Home Protect Plus",
        "premium": 3000,
        "term_months": 12,
        "deductible": 1500,
        "tnc_url": "https://www.icicilombard.com/home-insurance",
        "coverage": {
            "structure": "₹75,00,000",
            "contents": "₹15,00,000",
            "fire": True,
            "earthquake": True,
            "terrorism": True,
            "landlord_liability": True,
            "temporary_accommodation": "₹50,000",
        },
    },
    {
        "provider_id": providers["Bajaj Allianz"],
        "policy_type": "home",
        "title": "Bajaj My Home Insurance",
        "premium": 1800,
        "term_months": 12,
        "deductible": 500,
        "tnc_url": "https://www.bajajallianz.com/home-insurance.html",
        "coverage": {
            "structure": "₹30,00,000",
            "contents": "₹5,00,000",
            "fire": True,
            "earthquake": True,
            "flood": True,
            "burglary": True,
        },
    },
    {
        "provider_id": providers["Tata AIG"],
        "policy_type": "home",
        "title": "Tata AIG Home Guard",
        "premium": 2200,
        "term_months": 12,
        "deductible": 800,
        "tnc_url": "https://www.tataaig.com/home-insurance",
        "coverage": {
            "structure": "₹40,00,000",
            "contents": "₹8,00,000",
            "fire": True,
            "earthquake": True,
            "storm_tempest": True,
            "burglary": True,
            "public_liability": True,
        },
    },

    # ──────────── TRAVEL (4 policies) ────────────
    {
        "provider_id": providers["ICICI Lombard"],
        "policy_type": "travel",
        "title": "ICICI Lombard Travel Safe",
        "premium": 800,
        "term_months": 1,
        "deductible": 500,
        "tnc_url": "https://www.icicilombard.com/travel-insurance",
        "coverage": {
            "medical_emergency": "₹25,00,000",
            "trip_cancellation": "₹1,00,000",
            "baggage_loss": "₹50,000",
            "flight_delay": "₹10,000",
            "passport_loss": "₹25,000",
            "adventure_sports": True,
        },
    },
    {
        "provider_id": providers["HDFC Ergo"],
        "policy_type": "travel",
        "title": "HDFC Ergo Overseas Travel",
        "premium": 1200,
        "term_months": 1,
        "deductible": 1000,
        "tnc_url": "https://www.hdfcergo.com/travel-insurance",
        "coverage": {
            "medical_emergency": "₹50,00,000",
            "evacuation": "₹10,00,000",
            "trip_cancellation": "₹2,00,000",
            "baggage_loss": "₹75,000",
            "personal_liability": "₹5,00,000",
            "covid_cover": True,
        },
    },
    {
        "provider_id": providers["Bajaj Allianz"],
        "policy_type": "travel",
        "title": "Bajaj Travel Elite",
        "premium": 950,
        "term_months": 1,
        "deductible": 750,
        "tnc_url": "https://www.bajajallianz.com/travel-insurance-online.html",
        "coverage": {
            "medical_emergency": "₹30,00,000",
            "trip_cancellation": "₹1,50,000",
            "baggage_delay": "₹15,000",
            "baggage_loss": "₹60,000",
            "flight_delay": "₹8,000",
            "dental_treatment": "₹25,000",
        },
    },
    {
        "provider_id": providers["Tata AIG"],
        "policy_type": "travel",
        "title": "Tata AIG Travel Guard",
        "premium": 700,
        "term_months": 1,
        "deductible": 500,
        "tnc_url": "https://www.tataaig.com/travel-insurance",
        "coverage": {
            "medical_emergency": "₹15,00,000",
            "trip_cancellation": "₹75,000",
            "baggage_loss": "₹40,000",
            "personal_accident": "₹10,00,000",
            "home_burglary": True,
        },
    },
]

for p in policies_data:
    policy = models.Policy(**p)
    db.add(policy)

db.commit()
print(f"✅ Inserted {len(policies_data)} policies across 5 categories")

db.close()
print("\n🎉 Seed complete! Database ready.")
