from decimal import Decimal
from datetime import date
from sqlalchemy.orm import Session
from app import crud, models


HIGH_RISK_OCCUPATIONS = {
    "driver", "miner", "construction", "military", "firefighter",
    "police", "logger", "farmer", "fisherman", "oil", "gas", "pilot",
    "electrician", "plumber", "mechanic", "delivery"
}
MEDIUM_RISK_OCCUPATIONS = {
    "engineer", "teacher", "nurse", "doctor", "retail", "chef",
    "security", "sales", "technician", "manager", "accountant"
}


def classify_occupation(occupation: str) -> str:
    occ = occupation.lower()
    for keyword in HIGH_RISK_OCCUPATIONS:
        if keyword in occ:
            return "high"
    for keyword in MEDIUM_RISK_OCCUPATIONS:
        if keyword in occ:
            return "medium"
    return "low"


class RecommendationEngine:

    @staticmethod
    def calculate_score(user: models.User, policy: models.Policy) -> tuple:
        score = Decimal(0)
        reasons = []
        profile = user.risk_profile or {}
        policy_type = policy.policy_type.lower()

        # ── Computed profile fields ────────────────────────────────────
        age = 30
        if user.dob:
            age = (date.today() - user.dob).days // 365

        income = Decimal(str(profile.get("annual_income") or 0))
        marital_status = (profile.get("marital_status") or "").lower()
        occupation = (profile.get("occupation") or "").lower()
        employment_type = (profile.get("employment_type") or "salaried").lower()
        family_size = int(profile.get("family_size") or 1)
        num_dependents = int(profile.get("num_dependents") or 0)
        has_vehicle = bool(profile.get("has_vehicle", False))
        smoker = bool(profile.get("smoker", False))
        alcohol = (profile.get("alcohol_consumption") or "never").lower()
        exercise = (profile.get("exercise_frequency") or "sometimes").lower()
        bmi = (profile.get("bmi_category") or "normal").lower()
        existing_conditions = [c.lower() for c in (profile.get("existing_conditions") or [])]
        risk_appetite = (profile.get("risk_appetite") or "medium").lower()
        coverage_priority = (profile.get("coverage_priority") or "balanced").lower()

        # ══════════════════════════════════════════════════════════════
        # A. AFFORDABILITY (max 25 pts)
        # ══════════════════════════════════════════════════════════════
        affordability_pts = Decimal(10)  # default if no income provided
        if income > 0:
            # policy.premium is annual, income is annual. Ratio = premium / income
            ratio = float(policy.premium / income)
            if ratio < 0.03:
                affordability_pts = Decimal(25)
                reasons.append(f"Highly affordable ({ratio*100:.1f}% of monthly income)")
            elif ratio < 0.06:
                affordability_pts = Decimal(18)
                reasons.append(f"Affordable ({ratio*100:.1f}% of monthly income)")
            elif ratio < 0.12:
                affordability_pts = Decimal(10)
                reasons.append(f"Manageable premium ({ratio*100:.1f}% of income)")
            elif ratio < 0.20:
                affordability_pts = Decimal(3)
                reasons.append("Premium is high relative to your income")
            else:
                affordability_pts = Decimal(0)
                reasons.append("Premium may be a financial stretch")
        score += affordability_pts

        # ══════════════════════════════════════════════════════════════
        # B. POLICY TYPE MATCHING (max 30 pts)
        # ══════════════════════════════════════════════════════════════
        type_pts = Decimal(0)

        if policy_type == "health":
            # Everyone needs health — give a base
            type_pts = Decimal(10)
            reasons.append("Health insurance is recommended for everyone")

            if smoker:
                type_pts += 8
                reasons.append("High priority for smokers")
            if existing_conditions:
                cond_bonus = min(len(existing_conditions) * 6, 12)
                type_pts += cond_bonus
                cond_str = ", ".join(c.replace("_", " ").title() for c in existing_conditions[:3])
                reasons.append(f"Covers risks from: {cond_str}")
            if bmi in ("obese", "overweight"):
                type_pts += 4
                reasons.append(f"Recommended for {bmi} BMI category")
            if alcohol == "regularly":
                type_pts += 3
                reasons.append("Alcohol use raises long-term health risk")
            if exercise == "rarely":
                type_pts += 2
                reasons.append("Low activity increases health risk")
            if age > 55:
                type_pts += 10
                reasons.append("Critical coverage for age 55+")
            elif age > 40:
                type_pts += 6
                reasons.append("Important at your age for preventive care")
            elif age > 30:
                type_pts += 3
                reasons.append("Good to have health cover from your 30s")

        elif policy_type == "life":
            if marital_status == "married":
                type_pts += 10
                reasons.append("Life insurance is essential when married")
            if num_dependents >= 2:
                type_pts += 12
                reasons.append(f"{num_dependents} dependents depend on your income")
            elif num_dependents == 1:
                type_pts += 7
                reasons.append("A dependent relies on your financial support")
            if family_size >= 3:
                type_pts += 5
                reasons.append(f"Provides security for your family of {family_size}")
            if 28 <= age <= 55:
                type_pts += 5
                reasons.append("Prime years to lock in life coverage")
            elif age > 55:
                type_pts += 8
                reasons.append("Life cover protects those who depend on you")
            if smoker:
                type_pts += 3
                reasons.append("Life cover is more important for smokers")

        elif policy_type == "auto":
            if has_vehicle:
                type_pts = Decimal(25)
                reasons.append("You own a vehicle — auto coverage is essential")
            else:
                type_pts = Decimal(5)
                reasons.append("Auto plan — useful if you plan to own a vehicle")

        elif policy_type == "home":
            if marital_status == "married" or family_size >= 3:
                type_pts = Decimal(20)
                reasons.append("Home insurance protects your family's biggest asset")
            elif family_size >= 2:
                type_pts = Decimal(15)
                reasons.append("Protects your household belongings and structure")
            else:
                type_pts = Decimal(10)
                reasons.append("Home insurance is valuable for property owners")

        elif policy_type == "travel":
            type_pts = Decimal(8)
            reasons.append("Travel insurance provides coverage abroad")

        score += min(type_pts, Decimal(30))

        # ══════════════════════════════════════════════════════════════
        # C. OCCUPATION RISK (max 15 pts) — Life & Health only
        # ══════════════════════════════════════════════════════════════
        if policy_type in ("life", "health") and occupation:
            occ_level = classify_occupation(occupation)
            if occ_level == "high":
                score += 15
                reasons.append(f"High-risk job ({occupation}) — coverage is critical")
            elif occ_level == "medium":
                score += 8
                reasons.append(f"Your role ({occupation}) carries moderate risk")
            else:
                score += 5
                reasons.append("Standard occupational risk")

        # ══════════════════════════════════════════════════════════════
        # D. PREFERENCE MATCH (max 15 pts)
        # ══════════════════════════════════════════════════════════════
        coverage = policy.coverage or {}
        all_values = list(coverage.values())
        # Only count features that are explicitly True
        active_bool_features = [v for v in all_values if isinstance(v, bool) and v is True]
        num_features = len(active_bool_features)
        max_numeric = max((float(v) for v in all_values if isinstance(v, (int, float)) and not isinstance(v, bool)), default=0)

        is_comprehensive = num_features >= 3 or max_numeric >= 2000000
        is_basic = float(policy.premium) < 6000 and num_features <= 2
        is_medium = 6000 <= float(policy.premium) <= 16000

        if coverage_priority == "comprehensive" and is_comprehensive:
            score += 15
            reasons.append("Matches your preference for comprehensive coverage")
        elif coverage_priority == "balanced" and is_medium:
            score += 15
            reasons.append("Matches preference for a balanced, medium-cost plan")
        elif coverage_priority == "cost_saving" and is_basic:
            score += 15
            reasons.append("Affordable plan matching your cost-saving goal")
        elif coverage_priority == "balanced":
            score += 10
            reasons.append("Matches your core balanced preference")
        elif risk_appetite == "high" and is_comprehensive:
            score += 10
            reasons.append("Comprehensive plan suits your high risk appetite")
        elif risk_appetite == "medium" and is_medium:
            score += 10
            reasons.append("Medium cost plan suits your moderate risk appetite")
        elif risk_appetite == "low" and is_basic:
            score += 10
            reasons.append("Basic plan limits financial commitment")
        else:
            score += 5  # Partial match

        # ══════════════════════════════════════════════════════════════
        # E. EMPLOYMENT STABILITY (max 10 pts)
        # ══════════════════════════════════════════════════════════════
        if employment_type in ("salaried", "government"):
            score += 10
            reasons.append("Stable income makes regular premiums manageable")
        elif employment_type in ("self_employed", "business_owner"):
            score += 7
            reasons.append("Self-employed — personal insurance is important")
        elif employment_type == "retired":
            score += 8
            reasons.append("Retirees benefit strongly from health and life cover")
        else:
            score += 4

        # Cap score at 100
        final_score = min(score, Decimal(100))
        return final_score, "; ".join(reasons)

    @classmethod
    def generate_recommendations(cls, db: Session, user_id: int):
        user = crud.crud_user.get(db, id=user_id)
        if not user:
            return []

        db.query(models.Recommendation).filter(
            models.Recommendation.user_id == user_id
        ).delete()

        policies = crud.crud_policy.get_multi(db)
        recommendations = []

        for policy in policies:
            score, reason = cls.calculate_score(user, policy)
            # Lower threshold to 30 so even sparse profiles get results
            if score >= 30:
                db_obj = models.Recommendation(
                    user_id=user_id,
                    policy_id=policy.id,
                    score=score,
                    reason=reason
                )
                db.add(db_obj)
                recommendations.append(db_obj)

        db.commit()
        for rec in recommendations:
            db.refresh(rec)
        return recommendations
