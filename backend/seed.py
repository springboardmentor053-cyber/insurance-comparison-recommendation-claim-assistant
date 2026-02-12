
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

    # Create Policies
    classes_policies = [
        # --- HEALTH ---
        Policy(
            provider_id=p1.id,
            policy_type=PolicyType.health,
            title="Basic Health Starter",
            coverage={"hospital": 50000, "dental": False, "opd": False},
            premium=200.0,
            term_months=12,
            deductible=500.0,
            tnc_url="http://example.com/health-basic"
        ),
        Policy(
            provider_id=p1.id,
            policy_type=PolicyType.health,
            title="Comprehensive Health Shield",
            coverage={"hospital": 500000, "dental": True, "opd": True, "critical_illness": True},
            premium=850.0,
            term_months=12,
            deductible=200.0,
            tnc_url="http://example.com/health-shield"
        ),
        Policy(
            provider_id=p1.id,
            policy_type=PolicyType.health,
            title="Family Floater Plan",
            coverage={"hospital": 1000000, "dental": True, "maternity": True},
            premium=1200.0,
            term_months=12,
            deductible=100.0,
            tnc_url="http://example.com/family-floater"
        ),
         Policy(
            provider_id=p3.id,
            policy_type=PolicyType.health,
            title="Senior Citizen Care",
            coverage={"hospital": 300000, "pre_existing": "Covered after 2 yrs", "ayush": True},
            premium=1500.0,
            term_months=12,
            deductible=1000.0,
            tnc_url="http://example.com/senior-care"
        ),

        # --- AUTO ---
        Policy(
            provider_id=p2.id,
            policy_type=PolicyType.auto,
            title="Standard Liability Auto",
            coverage={"liability": 50000, "collision": False, "comprehensive": False},
            premium=120.0,
            term_months=6,
            deductible=1000.0,
            tnc_url="http://example.com/auto-liability"
        ),
        Policy(
            provider_id=p2.id,
            policy_type=PolicyType.auto,
            title="Full Coverage Auto",
            coverage={"liability": 100000, "collision": True, "comprehensive": True, "roadside_assist": True},
            premium=450.0,
            term_months=6,
            deductible=500.0,
            tnc_url="http://example.com/auto-full"
        ),
         Policy(
            provider_id=p2.id,
            policy_type=PolicyType.auto,
            title="Ride Share Protect",
            coverage={"liability": 200000, "passenger": True, "collision": True},
            premium=600.0,
            term_months=6,
            deductible=250.0,
            tnc_url="http://example.com/ride-share"
        ),

        # --- HOME ---
        Policy(
            provider_id=p3.id,
            policy_type=PolicyType.home,
            title="Homeowners Gold",
            coverage={"structure": 500000, "contents": 100000, "liability": 300000, "fire": True, "theft": True},
            premium=800.0,
            term_months=12,
            deductible=1500.0,
            tnc_url="http://example.com/home-gold"
        ),
        Policy(
            provider_id=p3.id,
            policy_type=PolicyType.home,
            title="Renters Essentials",
            coverage={"contents": 30000, "liability": 100000, "fire": True},
            premium=150.0,
            term_months=12,
            deductible=250.0,
            tnc_url="http://example.com/renters"
        ),
         Policy(
            provider_id=p1.id,
            policy_type=PolicyType.home,
            title="Smart Home Special",
            coverage={"structure": 400000, "iot_device_protection": True, "cyber_security": True},
            premium=750.0,
            term_months=12,
            deductible=1000.0,
            tnc_url="http://example.com/smart-home"
        ),

        # --- LIFE ---
        Policy(
            provider_id=p1.id,
            policy_type=PolicyType.life,
            title="Term Life 20-Year",
            coverage={"death_benefit": 500000, "accidental_death": False},
            premium=300.0,
            term_months=12,
            deductible=0.0,
            tnc_url="http://example.com/term-life"
        ),
         Policy(
            provider_id=p1.id,
            policy_type=PolicyType.life,
            title="Whole Life Premium",
            coverage={"death_benefit": 1000000, "cash_value": True, "dividends": True},
            premium=1200.0,
            term_months=12,
            deductible=0.0,
            tnc_url="http://example.com/whole-life"
        ),

        # --- TRAVEL ---
        Policy(
            provider_id=p2.id,
            policy_type=PolicyType.travel,
            title="Global Voyager",
            coverage={"medical": 100000, "trip_cancellation": True, "baggage_loss": True},
            premium=50.0,
            term_months=1,
            deductible=100.0,
            tnc_url="http://example.com/travel-global"
        ),
        Policy(
            provider_id=p2.id,
            policy_type=PolicyType.travel,
            title="Student Abroad",
            coverage={"medical": 200000, "study_interruption": True, "sponsor_protection": True},
            premium=180.0,
            term_months=6,
            deductible=100.0,
            tnc_url="http://example.com/student-travel"
        ),
        Policy(
            provider_id=p2.id,
            policy_type=PolicyType.travel,
            title="Business Class Travel",
            coverage={"medical": 500000, "laptop_loss": True, "meeting_cancellation": True},
            premium=120.0,
            term_months=1,
            deductible=50.0,
            tnc_url="http://example.com/business-travel"
        ),
        Policy(
            provider_id=p3.id,
            policy_type=PolicyType.life,
            title="Senior Life Protect",
            coverage={"death_benefit": 200000, "funeral_expenses": True},
            premium=600.0,
            term_months=12,
            deductible=0.0,
            tnc_url="http://example.com/senior-life"
        ),
        Policy(
            provider_id=p1.id,
            policy_type=PolicyType.health,
            title="Critical Illness Cover",
            coverage={"cancer": True, "heart_attack": True, "stroke": True, "lump_sum": 50000},
            premium=350.0,
            term_months=12,
            deductible=0.0,
            tnc_url="http://example.com/critical-illness"
        ),
         Policy(
            provider_id=p2.id,
            policy_type=PolicyType.auto,
            title="Classic Car Insurance",
            coverage={"agreed_value": True, "show_transport": True, "spare_parts": True},
            premium=300.0,
            term_months=12,
            deductible=500.0,
            tnc_url="http://example.com/classic-car"
        ),
        Policy(
            provider_id=p3.id,
            policy_type=PolicyType.home,
            title="Tiny Home Insurance",
            coverage={"structure": 100000, "contents": 20000, "mobility": True},
            premium=400.0,
            term_months=12,
            deductible=500.0,
            tnc_url="http://example.com/tiny-home"
        ),
    ]
    db.add_all(classes_policies)
    db.commit()
    print(f"Created {len(classes_policies)} Policies")

    db.close()

if __name__ == "__main__":
    seed_data()
