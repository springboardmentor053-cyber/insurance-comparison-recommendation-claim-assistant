from database import SessionLocal, Provider, Policy, init_db

def seed_database():
    # Initialize database (create tables)
    init_db()
    
    db = SessionLocal()
    
    # Check if data already exists
    existing_providers = db.query(Provider).count()
    if existing_providers > 0:
        print("✅ Database already seeded!")
        db.close()
        return
    
    # Add Insurance Providers
    providers = [
        Provider(name="HealthFirst Insurance", description="Comprehensive health coverage", rating=4.5),
        Provider(name="AutoSecure", description="Affordable car insurance", rating=4.2),
        Provider(name="LifeGuard Inc", description="Life insurance specialists", rating=4.7),
        Provider(name="HomeShield", description="Home and property insurance", rating=4.4),
    ]
    
    for provider in providers:
        db.add(provider)
    db.commit()
    
    # Add Sample Policies
    policies = [
        # Health Insurance
        Policy(provider_id=1, name="Basic Health Plan", type="health", 
               coverage_amount=50000, premium_monthly=150, deductible=1000,
               description="Essential health coverage for individuals"),
        Policy(provider_id=1, name="Premium Health Plan", type="health", 
               coverage_amount=100000, premium_monthly=300, deductible=500,
               description="Comprehensive health coverage with low deductible"),
        Policy(provider_id=1, name="Family Health Plan", type="health", 
               coverage_amount=200000, premium_monthly=500, deductible=750,
               description="Complete family health coverage"),
        
        # Auto Insurance
        Policy(provider_id=2, name="Basic Auto Insurance", type="auto", 
               coverage_amount=25000, premium_monthly=80, deductible=500,
               description="Liability and collision coverage"),
        Policy(provider_id=2, name="Premium Auto Insurance", type="auto", 
               coverage_amount=50000, premium_monthly=150, deductible=250,
               description="Comprehensive auto coverage with roadside assistance"),
        
        # Life Insurance
        Policy(provider_id=3, name="Term Life 10 Year", type="life", 
               coverage_amount=100000, premium_monthly=50, deductible=0,
               description="10-year term life insurance"),
        Policy(provider_id=3, name="Term Life 20 Year", type="life", 
               coverage_amount=250000, premium_monthly=100, deductible=0,
               description="20-year term life insurance"),
        
        # Home Insurance
        Policy(provider_id=4, name="Basic Home Insurance", type="home", 
               coverage_amount=150000, premium_monthly=120, deductible=1000,
               description="Essential home and property coverage"),
        Policy(provider_id=4, name="Premium Home Insurance", type="home", 
               coverage_amount=300000, premium_monthly=200, deductible=500,
               description="Comprehensive home coverage with natural disaster protection"),
    ]
    
    for policy in policies:
        db.add(policy)
    db.commit()
    
    print("✅ Database seeded successfully!")
    print(f"   - Added {len(providers)} insurance providers")
    print(f"   - Added {len(policies)} insurance policies")
    
    db.close()

if __name__ == "__main__":
    seed_database()
