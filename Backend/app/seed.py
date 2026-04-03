from sqlalchemy.orm import Session
from .database import SessionLocal
from . import models


def seed_data():
    db: Session = SessionLocal()

    # Prevent duplicate seeding
    if db.query(models.Provider).first():
        print("Data already exists")
        db.close()
        return

    # ---- Providers ----
    lic = models.Provider(name="LIC India", contact_email="contact@lic.com")
    hdfc = models.Provider(name="HDFC Ergo", contact_email="support@hdfc.com")
    tata = models.Provider(name="TATA AIG", contact_email="help@tataaig.com")
    icici = models.Provider(name="ICICI Lombard", contact_email="info@icicilombard.com")

    db.add_all([lic, hdfc, tata, icici])
    db.commit()

    # ---- Policies ----
    policies = [

        # Life Insurance
        models.Policy(
            title="Life Shield Basic",
            description="Affordable term life insurance",
            premium_amount=5000,
            provider_id=lic.id
        ),
        models.Policy(
            title="Premium Life Secure",
            description="High coverage life plan",
            premium_amount=12000,
            provider_id=hdfc.id
        ),

        # Health Insurance
        models.Policy(
            title="Health Care Plus",
            description="Family health coverage plan",
            premium_amount=8000,
            provider_id=tata.id
        ),
        models.Policy(
            title="Mediclaim Gold",
            description="Cashless hospitalization coverage",
            premium_amount=10000,
            provider_id=icici.id
        ),

        # Auto Insurance
        models.Policy(
            title="Auto Protect",
            description="Comprehensive car insurance",
            premium_amount=7000,
            provider_id=hdfc.id
        ),
        models.Policy(
            title="Drive Safe Plan",
            description="Third-party + own damage cover",
            premium_amount=6500,
            provider_id=tata.id
        ),

        # Travel Insurance
        models.Policy(
            title="Travel Secure International",
            description="Overseas medical & baggage cover",
            premium_amount=3000,
            provider_id=icici.id
        ),
        models.Policy(
            title="Trip Protection Plan",
            description="Domestic & international travel coverage",
            premium_amount=2500,
            provider_id=lic.id
        ),
    ]

    db.add_all(policies)
    db.commit()

    db.close()
    print("Sample data inserted successfully 🚀")


if __name__ == "__main__":
    seed_data()
