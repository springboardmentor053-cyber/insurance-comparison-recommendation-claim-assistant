
import sys
import os
import unittest
from decimal import Decimal
from datetime import date

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.services.recommendation_engine import RecommendationEngine
from types import SimpleNamespace

# Mock classes
class MockUser:
    def __init__(self, id, dob, risk_profile):
        self.id = id
        self.dob = dob
        self.risk_profile = risk_profile

class MockPolicy:
    def __init__(self, id, policy_type, premium):
        self.id = id
        self.policy_type = policy_type
        self.premium = premium

class TestRecommendationEngine(unittest.TestCase):
    def test_calculate_score(self):
        # 1. Mock User (High income, young, single, engineer)
        user = MockUser(
            id=1,
            dob=date(1995, 1, 1), # ~31 years old
            risk_profile={
                "annual_income": 120000,
                "occupation": "Software Engineer", 
                "marital_status": "single"
            }
        )
        
        # 2. Mock Policy (Life Insurance, reasonable premium)
        policy = MockPolicy(
            id=1,
            policy_type="Life",
            premium=500 # Monthly income ~10k. 500 is 5%.
        )
        
        # 3. Calculate Score
        # We need to import RecommendationEngine after mocks to avoid model import if possible, 
        # but the engine imports models for type hinting. 
        # However, at runtime python is dynamic.
        score, reason = RecommendationEngine.calculate_score(user, policy)
        
        print(f"Score: {score}")
        print(f"Reason: {reason}")
        
        # Assertions
        # Base 50
        # Affordability: 500/10000 = 0.05. < 0.05? No, exactly 0.05. So < 0.10 -> +10
        # Life Stage: > 30 -> +20
        # Occupation: Engineer -> +10
        # Total expected: 50 + 10 + 20 + 10 = 90
        
        self.assertTrue(score >= 80, f"Score {score} should be high")
        self.assertIn("Engineer", reason)

if __name__ == "__main__":
    unittest.main()
