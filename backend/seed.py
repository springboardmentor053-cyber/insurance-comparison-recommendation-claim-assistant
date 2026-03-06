
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base_class import Base
# Import models so they are registered
from app.models.user import User
from app.models.provider import Provider
from app.models.policy import Policy, PolicyType
# Make sure everything is configured before creating tables/session
from app.core.config import settings
from app.core.security import get_password_hash

SQLALCHEMY_DATABASE_URL = settings.assemble_db_url()
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_data():
    db = SessionLocal()
    
    # Check if data exists
    if db.query(User).first():
        print("Data already exists. Skipping seed.")
        db.close()
        return

    # Create Admin
    admin = User(
        email="admin@example.com",
        password=get_password_hash("password"),
        name="Admin User",
        is_admin=True,
        risk_profile={}
    )
    db.add(admin)
    print(f"Created Admin: {admin.email}")

    # Create User
    user = User(
        email="user@example.com",
        password=get_password_hash("password"),
        name="Regular User",
        is_admin=False,
        risk_profile={
            "occupation": "Software Engineer",
            "annual_income": 75000,
            "gender": "male",
            "marital_status": "single",
            "phone_number": "555-0123",
            "address": "123 Tech Lane"
        }
    )
    db.add(user)
    print(f"Created User: {user.email}")

    # Create Providers
    p1 = Provider(name="HealthGuard", country="USA")
    p2 = Provider(name="AutoSecure", country="UK")
    p3 = Provider(name="HomeSafe", country="Canada")
    db.add_all([p1, p2, p3])
    db.commit()
    print("Created Providers")

    # Create Policies — real-world aligned data
    classes_policies = [
        # ── HEALTH ──────────────────────────────────────────────────────
        Policy(
            provider_id=p1.id,
            policy_type=PolicyType.health,
            title="Basic Health Starter",
            description="Entry-level plan for young adults. Covers hospitalization only.",
            coverage={"hospital": 50000, "deductible": 1000},
            premium=149.0,
            term_months=12,
            deductible=1000.0,
            tnc_url="http://example.com/health-basic"
        ),
        Policy(
            provider_id=p1.id,
            policy_type=PolicyType.health,
            title="Comprehensive Health Shield",
            description="All-inclusive plan with dental, OPD, and critical illness cover.",
            coverage={"hospital": 500000, "dental": True, "opd": True, "critical_illness": True, "mental_health": True},
            premium=620.0,
            term_months=12,
            deductible=200.0,
            tnc_url="http://example.com/health-shield"
        ),
        Policy(
            provider_id=p1.id,
            policy_type=PolicyType.health,
            title="Family Floater Gold",
            description="Covers entire family under one plan. Includes maternity and newborn care.",
            coverage={"hospital": 1000000, "dental": True, "maternity": True, "newborn": True, "ambulance": True},
            premium=1050.0,
            term_months=12,
            deductible=500.0,
            tnc_url="http://example.com/family-floater"
        ),
        Policy(
            provider_id=p3.id,
            policy_type=PolicyType.health,
            title="Senior Citizen Care Plus",
            description="Designed for seniors 60+. Covers pre-existing conditions after 24 months.",
            coverage={"hospital": 300000, "pre_existing_covered": True, "ayush": True, "domiciliary": True},
            premium=1400.0,
            term_months=12,
            deductible=1500.0,
            tnc_url="http://example.com/senior-care"
        ),
        Policy(
            provider_id=p1.id,
            policy_type=PolicyType.health,
            title="Critical Illness Cover",
            description="Lump sum payout on diagnosis of 20+ critical illnesses including cancer, stroke.",
            coverage={"cancer": True, "heart_attack": True, "stroke": True, "kidney_failure": True, "lump_sum_payout": 200000},
            premium=290.0,
            term_months=12,
            deductible=0.0,
            tnc_url="http://example.com/critical-illness"
        ),

        # ── AUTO ─────────────────────────────────────────────────────────
        Policy(
            provider_id=p2.id,
            policy_type=PolicyType.auto,
            title="Third Party Liability",
            description="Mandatory coverage for third party damage and injury. No own damage cover.",
            coverage={"third_party_liability": 100000},
            premium=99.0,
            term_months=12,
            deductible=0.0,
            tnc_url="http://example.com/auto-tpl"
        ),
        Policy(
            provider_id=p2.id,
            policy_type=PolicyType.auto,
            title="Comprehensive Auto Plan",
            description="Full coverage including collision, theft, fire, and natural disasters.",
            coverage={"own_damage": 500000, "third_party_liability": 300000, "collision": True, "theft": True, "natural_disaster": True, "roadside_assist": True},
            premium=420.0,
            term_months=12,
            deductible=500.0,
            tnc_url="http://example.com/auto-full"
        ),
        Policy(
            provider_id=p2.id,
            policy_type=PolicyType.auto,
            title="Fleet & Commercial Vehicle",
            description="For commercial use vehicles. Covers fleet up to 5 vehicles including passenger liability.",
            coverage={"fleet_coverage": True, "passenger_liability": 500000, "goods_in_transit": True, "breakdown_assist": True},
            premium=780.0,
            term_months=12,
            deductible=1000.0,
            tnc_url="http://example.com/fleet-commercial"
        ),
        Policy(
            provider_id=p2.id,
            policy_type=PolicyType.auto,
            title="Electric Vehicle Shield",
            description="Specialized policy for EV owners. Covers battery, charging equipment, and roadside assist.",
            coverage={"battery_protection": True, "charging_equipment": True, "collision": True, "roadside_assist": True, "own_damage": 400000},
            premium=340.0,
            term_months=12,
            deductible=500.0,
            tnc_url="http://example.com/ev-shield"
        ),

        # ── HOME ─────────────────────────────────────────────────────────
        Policy(
            provider_id=p3.id,
            policy_type=PolicyType.home,
            title="Renters Basic",
            description="Affordable coverage for renters. Protects personal belongings and liability.",
            coverage={"contents": 30000, "personal_liability": 100000},
            premium=140.0,
            term_months=12,
            deductible=250.0,
            tnc_url="http://example.com/renters-basic"
        ),
        Policy(
            provider_id=p3.id,
            policy_type=PolicyType.home,
            title="Homeowners Gold",
            description="Complete homeowner coverage: structure, contents, liability, fire, and theft.",
            coverage={"structure": 600000, "contents": 150000, "personal_liability": 300000, "fire": True, "theft": True, "water_damage": True},
            premium=780.0,
            term_months=12,
            deductible=1500.0,
            tnc_url="http://example.com/homeowners-gold"
        ),
        Policy(
            provider_id=p1.id,
            policy_type=PolicyType.home,
            title="Smart Home Premium",
            description="Modern home plan with IoT device protection, cyber cover, and home office rider.",
            coverage={"structure": 500000, "iot_devices": True, "cyber_security": True, "home_office": True, "contents": 200000, "natural_disaster": True},
            premium=920.0,
            term_months=12,
            deductible=1000.0,
            tnc_url="http://example.com/smart-home"
        ),

        # ── LIFE ─────────────────────────────────────────────────────────
        Policy(
            provider_id=p1.id,
            policy_type=PolicyType.life,
            title="Pure Term Life 20-Year",
            description="Pure protection plan. High sum assured at the lowest cost. Ideal for breadwinners.",
            coverage={"death_benefit": 1000000, "accidental_death_rider": True},
            premium=280.0,
            term_months=12,
            deductible=0.0,
            tnc_url="http://example.com/term-life"
        ),
        Policy(
            provider_id=p1.id,
            policy_type=PolicyType.life,
            title="Whole Life with Savings",
            description="Lifelong coverage with cash value accumulation and annual dividend benefits.",
            coverage={"death_benefit": 500000, "cash_value": True, "dividends": True, "premium_waiver": True},
            premium=1100.0,
            term_months=12,
            deductible=0.0,
            tnc_url="http://example.com/whole-life"
        ),
        Policy(
            provider_id=p3.id,
            policy_type=PolicyType.life,
            title="Senior Life Protect",
            description="Guaranteed acceptance plan for ages 50–80. Covers funeral expenses and outstanding debts.",
            coverage={"death_benefit": 150000, "funeral_expenses": True, "no_medical_exam": True},
            premium=520.0,
            term_months=12,
            deductible=0.0,
            tnc_url="http://example.com/senior-life"
        ),
        Policy(
            provider_id=p2.id,
            policy_type=PolicyType.life,
            title="Income Protection Plan",
            description="Pays monthly income if you're unable to work due to illness or injury. Covers up to 60% of salary.",
            coverage={"income_replacement": True, "disability_cover": True, "critical_illness": True, "monthly_benefit": 3000},
            premium=380.0,
            term_months=12,
            deductible=0.0,
            tnc_url="http://example.com/income-protect"
        ),

        # ── TRAVEL ───────────────────────────────────────────────────────
        Policy(
            provider_id=p2.id,
            policy_type=PolicyType.travel,
            title="International Travel Essentials",
            description="Essential cover for international trips: emergency medical, trip cancellation, and baggage.",
            coverage={"emergency_medical": 100000, "trip_cancellation": True, "baggage_loss": True},
            premium=45.0,
            term_months=1,
            deductible=100.0,
            tnc_url="http://example.com/travel-essential"
        ),
        Policy(
            provider_id=p2.id,
            policy_type=PolicyType.travel,
            title="Student Abroad Protect",
            description="Long-stay plan for students. Covers study interruption, sponsor protection, and full medical.",
            coverage={"emergency_medical": 200000, "study_interruption": True, "sponsor_protection": True, "repatriation": True},
            premium=165.0,
            term_months=6,
            deductible=100.0,
            tnc_url="http://example.com/student-travel"
        ),
    ]
    db.add_all(classes_policies)
    db.commit()
    print(f"Created {len(classes_policies)} Policies")

    db.close()

if __name__ == "__main__":
    seed_data()
