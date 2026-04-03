from sqlalchemy.orm import Session
from sqlalchemy import desc
from app import models, schemas  # Changed from . to app
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
                # Check if condition is mentioned in coverage
                if any(condition.lower() in str(v).lower() for v in coverage.values()):
                    conditions_covered += 1
            if conditions_covered > 0:
                score += 0.1 * min(conditions_covered / len(user_prefs['existing_conditions']), 1)
        
        # Family size consideration
        family_size = user_prefs.get('family_size', 1)
        if family_size > 1:
            # Check if policy mentions family coverage
            if any('family' in str(v).lower() for v in coverage.values()):
                score += 0.1
        
        # Coverage priority adjustment
        priority = user_prefs.get('coverage_priority', 'balanced')
        if priority == 'maximum_coverage':
            # Prefer policies with more coverage items
            coverage_count = len(coverage)
            if coverage_count > 5:
                score += 0.15
            elif coverage_count > 3:
                score += 0.05
        
        return min(score, 1.0)
    
    def get_premium_match_score(self, policy: models.Policy, user_prefs: Dict, age: int) -> float:
        """
        Calculate how well premium fits user's budget
        Returns score between 0 and 1
        """
        premium = float(policy.premium)
        max_budget = user_prefs.get('max_budget')
        
        if not max_budget:
            # If no budget specified, use income-based estimate
            income = user_prefs.get('income', 500000)  # Default 5 Lakhs
            suggested_budget = income * 0.1  # 10% of income for insurance
            max_budget = suggested_budget
        
        # Calculate affordability score
        if premium <= max_budget * 0.3:  # Very affordable
            return 1.0
        elif premium <= max_budget * 0.5:  # Affordable
            return 0.8
        elif premium <= max_budget * 0.7:  # Moderate
            return 0.6
        elif premium <= max_budget:  # Expensive but within budget
            return 0.4
        else:  # Over budget
            return 0.1
    
    def get_deductible_match_score(self, policy: models.Policy, user_prefs: Dict, age: int) -> float:
        """
        Calculate how well deductible matches user's risk appetite
        Returns score between 0 and 1
        """
        deductible = float(policy.deductible)
        risk_appetite = user_prefs.get('risk_appetite', 'medium')
        
        # Different risk appetites prefer different deductible levels
        if risk_appetite == 'low':
            # Low risk appetite prefers low deductible
            if deductible < 1000:
                return 1.0
            elif deductible < 2500:
                return 0.7
            elif deductible < 5000:
                return 0.4
            else:
                return 0.2
        elif risk_appetite == 'medium':
            # Medium risk appetite balanced
            if 1000 <= deductible <= 5000:
                return 1.0
            elif deductible < 1000:
                return 0.7
            else:
                return 0.5
        else:  # high risk appetite
            # High risk appetite can handle high deductible for lower premium
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
        Calculate relevance of policy type based on user demographics
        Returns score between 0 and 1
        """
        score = 0.5  # Base score
        
        # Age-based recommendations
        if age < 25:
            # Young adults: travel, auto more relevant
            if policy.policy_type in ['travel', 'auto']:
                score += 0.3
        elif age < 40:
            # Working age: health, life important
            if policy.policy_type in ['health', 'life']:
                score += 0.3
        elif age < 60:
            # Middle age: health, life critical
            if policy.policy_type in ['health', 'life']:
                score += 0.4
        else:
            # Senior: health, home important
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
        
        # Smoker factor for life/health
        if user_prefs.get('smoker') and policy.policy_type in ['life', 'health']:
            score += 0.1
        
        return min(score, 1.0)
    
    def get_term_score(self, policy: models.Policy, user_prefs: Dict) -> float:
        """
        Score based on policy term length
        Returns score between 0 and 1
        """
        term = policy.term_months or 12
        
        # Most users prefer 12-month policies
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
        # Calculate age
        age = self.calculate_age(user_dob)
        
        # Calculate individual scores
        coverage_score = self.get_coverage_match_score(policy, user_prefs)
        premium_score = self.get_premium_match_score(policy, user_prefs, age)
        deductible_score = self.get_deductible_match_score(policy, user_prefs, age)
        type_score = self.get_type_match_score(policy, user_prefs, age)
        term_score = self.get_term_score(policy, user_prefs)
        
        # Weightages based on user priorities
        priority = user_prefs.get('coverage_priority', 'balanced')
        if priority == 'low_cost':
            weights = {
                'coverage': 0.15,
                'premium': 0.40,
                'deductible': 0.20,
                'type': 0.15,
                'term': 0.10
            }
        elif priority == 'maximum_coverage':
            weights = {
                'coverage': 0.40,
                'premium': 0.15,
                'deductible': 0.15,
                'type': 0.20,
                'term': 0.10
            }
        else:  # balanced
            weights = {
                'coverage': 0.25,
                'premium': 0.25,
                'deductible': 0.20,
                'type': 0.20,
                'term': 0.10
            }
        
        # Calculate total score
        total_score = (
            coverage_score * weights['coverage'] +
            premium_score * weights['premium'] +
            deductible_score * weights['deductible'] +
            type_score * weights['type'] +
            term_score * weights['term']
        ) * 100  # Scale to 0-100
        
        # Generate reason
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
        
        # Coverage reason
        if scores['coverage'] > 0.8:
            reasons.append(f"excellent coverage for your needs")
        elif scores['coverage'] > 0.6:
            reasons.append(f"good coverage match")
        
        # Premium reason
        if scores['premium'] > 0.8:
            reasons.append(f"very affordable premium")
        elif scores['premium'] > 0.6:
            reasons.append(f"competitive pricing")
        
        # Deductible reason
        if scores['deductible'] > 0.8:
            reasons.append(f"ideal deductible for your {user_prefs.get('risk_appetite', 'medium')} risk profile")
        
        # Age-based reasons
        if age < 25 and policy.policy_type in ['travel', 'auto']:
            reasons.append(f"perfect for your age group")
        elif age > 50 and policy.policy_type in ['health', 'life']:
            reasons.append(f"essential coverage at your life stage")
        
        # Type-specific reasons
        if policy.policy_type == 'health' and user_prefs.get('family_size', 1) > 1:
            reasons.append(f"suitable for family coverage")
        elif policy.policy_type == 'auto' and user_prefs.get('vehicle_owned'):
            reasons.append(f"protects your vehicle")
        elif policy.policy_type == 'travel' and user_prefs.get('travel_frequency') == 'frequently':
            reasons.append(f"ideal for frequent travelers")
        
        # Combine reasons
        if reasons:
            return f"Recommended because: {', '.join(reasons)}."
        else:
            return f"Balanced policy matching your {user_prefs.get('risk_appetite', 'medium')} risk profile."
    
    def generate_recommendations(self, user_id: int, force_refresh: bool = False) -> List[models.Recommendation]:
        """
        Generate recommendations for a user
        If force_refresh is True, delete old recommendations and generate new ones
        """
        # Get user
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            return []
        
        # Check if we have recent recommendations (less than 24 hours old)
        one_day_ago = datetime.now() - timedelta(hours=24)
        
        existing_recs = self.db.query(models.Recommendation).filter(
            models.Recommendation.user_id == user_id,
            models.Recommendation.created_at > one_day_ago
        ).count()
        
        # If we have recent recommendations and not forcing refresh, return them
        if existing_recs >= 5 and not force_refresh:
            return self.db.query(models.Recommendation).filter(
                models.Recommendation.user_id == user_id
            ).order_by(desc(models.Recommendation.score)).limit(20).all()
        
        # Delete old recommendations if refreshing
        if force_refresh:
            self.db.query(models.Recommendation).filter(
                models.Recommendation.user_id == user_id
            ).delete()
        
        # Get user preferences from risk_profile
        user_prefs = user.risk_profile or {}
        
        # Get all policies
        policies = self.db.query(models.Policy).all()
        
        # Calculate scores for each policy
        recommendations = []
        for policy in policies:
            score, breakdown, reason = self.calculate_score(policy, user_prefs, user.dob)
            
            # Create recommendation
            rec = models.Recommendation(
                user_id=user_id,
                policy_id=policy.id,
                score=score,
                reason=reason,
                scoring_breakdown=breakdown
            )
            recommendations.append(rec)
        
        # Sort by score and keep top 20
        recommendations.sort(key=lambda x: x.score, reverse=True)
        top_recommendations = recommendations[:20]
        
        # Save to database
        for rec in top_recommendations:
            self.db.add(rec)
        
        self.db.commit()
        
        # Refresh to get IDs
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