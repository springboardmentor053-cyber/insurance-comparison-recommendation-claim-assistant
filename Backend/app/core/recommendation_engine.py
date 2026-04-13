from sqlalchemy.orm import Session
from sqlalchemy import desc
from app import models, schemas
from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Tuple

class RecommendationEngine:
    """
    Core recommendation engine that scores policies based on user profile.
    Implements explainable AI principles to provide reasoning for each recommendation.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_age(self, dob: date) -> int:
        """Calculate age from date of birth"""
        if not dob:
            return 30  # Default age
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    
    def get_coverage_match_score(self, policy: models.Policy, user_prefs: Dict) -> float:
        """
        Calculate how well policy coverage matches user needs
        Returns score between 0 and 1
        """
        coverage = policy.coverage or {}
        score = 0.5  # Base score
        
        # Check if policy type matches user preference
        preferred_types = user_prefs.get('preferred_policy_types', [])
        if preferred_types and policy.policy_type in preferred_types:
            score += 0.2
        
        # For health insurance, check if coverage includes existing conditions
        if policy.policy_type == 'health' and user_prefs.get('existing_conditions'):
            conditions_covered = 0
            for condition in user_prefs['existing_conditions']:
                if any(condition.lower() in str(v).lower() for v in coverage.values()):
                    conditions_covered += 1
            if conditions_covered > 0:
                score += 0.1 * min(conditions_covered / len(user_prefs['existing_conditions']), 1)
        
        # Family size consideration
        family_size = user_prefs.get('family_size', 1)
        if family_size > 1:
            if any('family' in str(v).lower() for v in coverage.values()):
                score += 0.1
        
        # Coverage priority adjustment
        priority = user_prefs.get('coverage_priority', 'balanced')
        if priority == 'maximum_coverage':
            coverage_count = len(coverage)
            if coverage_count > 5:
                score += 0.15
            elif coverage_count > 3:
                score += 0.05
        
        return min(score, 1.0)
    
    def get_premium_match_score(self, policy: models.Policy, user_prefs: Dict, age: int) -> float:
        premium = float(policy.premium or 0)

        max_budget = user_prefs.get('max_budget')

        if not max_budget:
            income = user_prefs.get('income') or 500000   # ✅ FIX
            suggested_budget = income * 0.1
            max_budget = suggested_budget

        if premium <= max_budget * 0.3:
            return 1.0
        elif premium <= max_budget * 0.5:
            return 0.8
        elif premium <= max_budget * 0.7:
            return 0.6
        elif premium <= max_budget:
            return 0.4
        else:
            return 0.1
    
    def get_deductible_match_score(self, policy: models.Policy, user_prefs: Dict, age: int) -> float:
        """
        Calculate how well deductible matches user's risk appetite
        Returns score between 0 and 1
        """
        deductible = float(policy.deductible or 0)
        risk_appetite = user_prefs.get('risk_appetite', 'medium')
        
        if risk_appetite == 'low':
            if deductible < 1000:
                return 1.0
            elif deductible < 2500:
                return 0.7
            elif deductible < 5000:
                return 0.4
            else:
                return 0.2
        elif risk_appetite == 'medium':
            if 1000 <= deductible <= 5000:
                return 1.0
            elif deductible < 1000:
                return 0.7
            else:
                return 0.5
        else:  # high
            if deductible > 5000:
                return 1.0
            elif deductible > 2500:
                return 0.8
            elif deductible > 1000:
                return 0.5
            else:
                return 0.3
    
    def get_type_match_score(self, policy: models.Policy, user_prefs: Dict, age: int) -> float:
        """
        Calculate relevance of policy type based on user demographics and preferences.
        Returns score between 0 and 1.
        """
        score = 0.5  # Base score
        
        # Age-based recommendations
        if age < 25:
            if policy.policy_type in ['travel', 'auto']:
                score += 0.3
        elif age < 40:
            if policy.policy_type in ['health', 'life']:
                score += 0.3
        elif age < 60:
            if policy.policy_type in ['health', 'life']:
                score += 0.4
        else:
            if policy.policy_type in ['health', 'home']:
                score += 0.3
        
        # Lifestyle-based
        if user_prefs.get('vehicle_owned') and policy.policy_type == 'auto':
            score += 0.2
        if user_prefs.get('home_owned') and policy.policy_type == 'home':
            score += 0.2
        if user_prefs.get('travel_frequency') == 'frequently' and policy.policy_type == 'travel':
            score += 0.3
        elif user_prefs.get('travel_frequency') == 'occasionally' and policy.policy_type == 'travel':
            score += 0.1
        if user_prefs.get('smoker') and policy.policy_type in ['life', 'health']:
            score += 0.1
        
        # --- Strong preference handling ---
        preferred = user_prefs.get('preferred_policy_types', [])
        if preferred:
            if policy.policy_type in preferred:
                score += 0.4   # big boost for preferred types
            else:
                score -= 0.2   # penalty for non-preferred types
        
        return min(max(score, 0.0), 1.0)
    
    def get_term_score(self, policy: models.Policy, user_prefs: Dict) -> float:
        """
        Score based on policy term length
        Returns score between 0 and 1
        """
        term = policy.term_months or 12
        if term == 12:
            return 1.0
        elif term == 6:
            return 0.8
        elif term == 24:
            return 0.9
        elif term == 3:
            return 0.6
        elif term == 1:
            return 0.4
        else:
            return 0.5
    
    def calculate_score(self, policy: models.Policy, user_prefs: Dict, user_dob: date = None) -> Tuple[float, Dict[str, float], str]:
        """
        Calculate overall recommendation score with breakdown
        Returns: (total_score, breakdown, reason)
        """
        age = self.calculate_age(user_dob)
        
        coverage_score = self.get_coverage_match_score(policy, user_prefs)
        premium_score = self.get_premium_match_score(policy, user_prefs, age)
        deductible_score = self.get_deductible_match_score(policy, user_prefs, age)
        type_score = self.get_type_match_score(policy, user_prefs, age)
        term_score = self.get_term_score(policy, user_prefs)
        
        priority = user_prefs.get('coverage_priority', 'balanced')
        preferred = user_prefs.get('preferred_policy_types', [])
        
        # Adjust weights based on whether the user has expressed type preferences
        if preferred:
            if priority == 'low_cost':
                weights = {'coverage': 0.15, 'premium': 0.35, 'deductible': 0.15, 'type': 0.25, 'term': 0.10}
            elif priority == 'maximum_coverage':
                weights = {'coverage': 0.35, 'premium': 0.15, 'deductible': 0.15, 'type': 0.25, 'term': 0.10}
            else:  # balanced
                weights = {'coverage': 0.20, 'premium': 0.20, 'deductible': 0.15, 'type': 0.35, 'term': 0.10}
        else:
            if priority == 'low_cost':
                weights = {'coverage': 0.15, 'premium': 0.40, 'deductible': 0.20, 'type': 0.15, 'term': 0.10}
            elif priority == 'maximum_coverage':
                weights = {'coverage': 0.40, 'premium': 0.15, 'deductible': 0.15, 'type': 0.20, 'term': 0.10}
            else:
                weights = {'coverage': 0.25, 'premium': 0.25, 'deductible': 0.20, 'type': 0.20, 'term': 0.10}
        
        total_score = (
            coverage_score * weights['coverage'] +
            premium_score * weights['premium'] +
            deductible_score * weights['deductible'] +
            type_score * weights['type'] +
            term_score * weights['term']
        ) * 100  # Scale to 0-100
        
        reason = self.generate_reason(
            policy,
            {
                'coverage': coverage_score,
                'premium': premium_score,
                'deductible': deductible_score,
                'type': type_score,
                'term': term_score
            },
            user_prefs,
            age
        )
        
        breakdown = {
            'coverage_score': coverage_score,
            'premium_score': premium_score,
            'deductible_score': deductible_score,
            'type_match_score': type_score,
            'term_score': term_score
        }
        
        return total_score, breakdown, reason
    
    def generate_reason(self, policy: models.Policy, scores: Dict, user_prefs: Dict, age: int) -> str:
        """Generate human-readable explanation for recommendation"""
        reasons = []
        
        if scores['coverage'] > 0.8:
            reasons.append("excellent coverage for your needs")
        elif scores['coverage'] > 0.6:
            reasons.append("good coverage match")
        
        if scores['premium'] > 0.8:
            reasons.append("very affordable premium")
        elif scores['premium'] > 0.6:
            reasons.append("competitive pricing")
        
        if scores['deductible'] > 0.8:
            reasons.append(f"ideal deductible for your {user_prefs.get('risk_appetite', 'medium')} risk profile")
        
        if age < 25 and policy.policy_type in ['travel', 'auto']:
            reasons.append("perfect for your age group")
        elif age > 50 and policy.policy_type in ['health', 'life']:
            reasons.append("essential coverage at your life stage")
        
        if policy.policy_type == 'health' and user_prefs.get('family_size', 1) > 1:
            reasons.append("suitable for family coverage")
        elif policy.policy_type == 'auto' and user_prefs.get('vehicle_owned'):
            reasons.append("protects your vehicle")
        elif policy.policy_type == 'travel' and user_prefs.get('travel_frequency') == 'frequently':
            reasons.append("ideal for frequent travelers")
        
        if reasons:
            return f"Recommended because: {', '.join(reasons)}."
        else:
            return f"Balanced policy matching your {user_prefs.get('risk_appetite', 'medium')} risk profile."
    
    def generate_recommendations(self, user_id: int, force_refresh: bool = False) -> List[models.Recommendation]:
        """
        Generate recommendations for a user
        If force_refresh is True, delete old recommendations and generate new ones
        """
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            return []
        
        one_day_ago = datetime.now() - timedelta(hours=24)
        existing_recs = self.db.query(models.Recommendation).filter(
            models.Recommendation.user_id == user_id,
            models.Recommendation.created_at > one_day_ago
        ).count()
        
        if existing_recs >= 5 and not force_refresh:
            return self.db.query(models.Recommendation).filter(
                models.Recommendation.user_id == user_id
            ).order_by(desc(models.Recommendation.score)).limit(20).all()
        
        if force_refresh:
            self.db.query(models.Recommendation).filter(
                models.Recommendation.user_id == user_id
            ).delete()
        
        user_prefs = user.risk_profile or {}
        policies = self.db.query(models.Policy).all()
        recommendations = []
        for policy in policies:
            score, breakdown, reason = self.calculate_score(policy, user_prefs, user.dob)
            rec = models.Recommendation(
                user_id=user_id,
                policy_id=policy.id,
                score=score,
                reason=reason,
                scoring_breakdown=breakdown
            )
            recommendations.append(rec)
        
        recommendations.sort(key=lambda x: x.score, reverse=True)
        top_recommendations = recommendations[:20]
        
        for rec in top_recommendations:
            self.db.add(rec)
        self.db.commit()
        
        for rec in top_recommendations:
            self.db.refresh(rec)
        
        return top_recommendations
    
    def get_recommendations_with_policies(self, user_id: int, limit: int = 10) -> List[Dict]:
        """Get recommendations with full policy details"""
        recommendations = self.db.query(models.Recommendation).filter(
            models.Recommendation.user_id == user_id
        ).order_by(desc(models.Recommendation.score)).limit(limit).all()
        
        result = []
        for rec in recommendations:
            policy = rec.policy
            provider = policy.provider
            
            result.append({
                'id': rec.id,
                'score': rec.score,
                'reason': rec.reason,
                'scoring_breakdown': rec.scoring_breakdown,
                'created_at': rec.created_at.isoformat() if rec.created_at else None,
                'policy': {
                    'id': policy.id,
                    'title': policy.title,
                    'description': policy.description,
                    'policy_type': policy.policy_type,
                    'premium': float(policy.premium),
                    'deductible': float(policy.deductible),
                    'term_months': policy.term_months,
                    'coverage': policy.coverage,
                    'provider_name': provider.name if provider else "Covermate",
                    'provider_id': provider.id if provider else None
                }
            })
        
        return result