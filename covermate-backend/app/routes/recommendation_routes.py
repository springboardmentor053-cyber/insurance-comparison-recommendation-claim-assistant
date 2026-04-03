"""
Recommendation Routes – 7-dimension scoring engine.

Dimensions:
  1. Coverage type match     (20%)
  2. Budget / premium        (15%)
  3. Smoker impact           (15%)
  4. Age-term suitability    (15%)
  5. Age-type fit            (15%)
  6. Dependents impact       (10%)
  7. Deductible match        (10%)
"""

from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


# ━━━━━━━━━━━━━━━━━ AGE COMPUTATION ━━━━━━━━━━━━━━━━━

def _compute_age(dob, age_group: str = None) -> int:
    """
    PRIORITY: age_group from preferences FIRST (user actively selects this).
    Fallback to DOB if no age_group is set.
    """
    # 1️⃣ Preference age_group takes priority
    if age_group:
        if "+" in age_group:
            return int(age_group.replace("+", "")) + 5
        parts = age_group.split("-")
        if len(parts) == 2:
            try:
                return (int(parts[0]) + int(parts[1])) // 2
            except ValueError:
                pass

    # 2️⃣ Fallback to DOB
    if dob:
        if isinstance(dob, str):
            dob = datetime.strptime(dob, "%Y-%m-%d").date()
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    return 30


# ━━━━━━━━━━━━━━━━━ SCORING FUNCTIONS ━━━━━━━━━━━━━━━━━

def _coverage_match(policy, preferred_types: list) -> float:
    if not preferred_types:
        return 0.5
    return 1.0 if policy.policy_type in preferred_types else 0.15


def _premium_match(premium: float, income_bracket: str) -> float:
    bracket_map = {
        "Below 3L": 300000, "₹3-5L": 400000, "₹5-10L": 750000,
        "₹10-20L": 1500000, "₹20L+": 2500000,
    }
    income = bracket_map.get(income_bracket, 600000)
    monthly = income / 12
    ratio = float(premium) / monthly if monthly > 0 else 1.0
    if ratio <= 0.03: return 1.0
    if ratio <= 0.06: return 0.9
    if ratio <= 0.10: return 0.75
    if ratio <= 0.15: return 0.55
    if ratio <= 0.20: return 0.35
    if ratio <= 0.30: return 0.2
    return 0.05


def _smoker_impact(is_smoker: bool, policy_type: str, coverage: dict) -> float:
    if policy_type in ("health", "life"):
        if is_smoker:
            cov_str = str(coverage or {}).lower()
            return 0.5 if "smoker" in cov_str or "tobacco" in cov_str else 0.2
        return 1.0
    if policy_type == "auto":
        return 0.7 if is_smoker else 0.6
    return 0.6


def _age_term_match(age: int, term_months: int) -> float:
    term = term_months or 12
    if age >= 50:
        if term <= 12: return 1.0
        if term <= 60: return 0.85
        if term <= 120: return 0.5
        if term <= 240: return 0.25
        return 0.1
    if age >= 35:
        if 12 <= term <= 36: return 0.7
        if 36 < term <= 120: return 1.0
        if 120 < term <= 240: return 0.8
        return 0.5
    # Young
    if term <= 12: return 0.5
    if term <= 60: return 0.6
    if term <= 180: return 0.85
    if term <= 360: return 1.0
    return 0.9


def _age_type_fit(age: int, policy_type: str) -> float:
    matrix = {
        "life":   [0.6,  0.85, 1.0],
        "health": [0.35, 0.75, 1.0],
        "auto":   [1.0,  0.7,  0.3],
        "home":   [0.2,  0.9,  0.85],
        "travel": [1.0,  0.55, 0.2],
    }
    s = matrix.get(policy_type, [0.5, 0.5, 0.5])
    if age <= 30: return s[0]
    if age <= 45: return s[1]
    return s[2]


def _dependents_impact(has_dependents: bool, policy_type: str, coverage: dict) -> float:
    cov_str = str(coverage or {}).lower()
    fam = any(k in cov_str for k in [
        "family", "maternity", "new_born", "child", "spouse",
        "dependent", "death_benefit", "multi",
    ])
    if has_dependents:
        if policy_type in ("health", "life"):
            return 1.0 if fam else 0.75
        if policy_type == "home": return 0.7
        return 0.35
    else:
        if fam and policy_type == "health": return 0.4
        return 0.65


def _deductible_match(deductible: float, risk_appetite: str, coverage_priority: str) -> float:
    ded = float(deductible or 0)
    if coverage_priority == "high": pref = "low"
    elif coverage_priority == "low": pref = "high"
    else: pref = risk_appetite or "medium"

    if pref == "high": return 0.85
    if pref == "medium":
        if ded <= 2000: return 1.0
        if ded <= 5000: return 0.65
        return 0.3
    # low
    if ded == 0: return 1.0
    if ded <= 1000: return 0.75
    if ded <= 3000: return 0.4
    return 0.1


# ━━━━━━━━━━━━━━━━━ RATIONALE BUILDER ━━━━━━━━━━━━━━━━━

# Varied phrases to avoid repetitive text
_AGE_PHRASES_YOUNG = [
    "An excellent pick at age {age} — this builds strong coverage during your early career years",
    "Perfectly timed for someone your age ({age}) — lock in favorable terms while young",
    "Smart choice at {age} — early investment in {ptype} gives you a long coverage runway",
]
_AGE_PHRASES_MID = [
    "Strategically suited for your age ({age}) — balances protection and affordability at this life stage",
    "Right on target for someone at {age} — this addresses key mid-career coverage needs",
    "Well-matched to your profile at age {age} — covers the growing responsibilities you likely have",
]
_AGE_PHRASES_SENIOR = [
    "Highly relevant at age {age} — focused {ptype} coverage that seniors benefit most from",
    "Tailored for your life stage ({age}) — prioritizes what matters most at this point",
    "Essential coverage at age {age} — this {ptype} plan addresses key concerns for your demographic",
]
_AGE_PHRASES_LOW = [
    "Less typical for your age ({age}), but could fill a niche gap in your portfolio",
    "Not the most common pick at age {age}, though it offers unique benefits",
]

_SMOKER_WARN = [
    "⚠️ Tobacco user alert: expect notably higher premiums for this {ptype} policy",
    "⚠️ Smoker consideration: insurers typically charge 20-50% more for {ptype} coverage",
    "⚠️ As a tobacco user, this {ptype} policy will carry a significant premium surcharge",
]
_SMOKER_BONUS = [
    "You qualify for preferred non-smoker rates — significant savings on this {ptype} plan",
    "Non-smoker advantage: you'll get the best available {ptype} premiums",
    "Clean health profile means lower risk — this insurer rewards that with better {ptype} rates",
]

_TERM_PHRASES = {
    "short_good_senior": "The {term_yr}-year term is ideal for your age — manageable commitment without overextending",
    "long_good_young": "A {term_yr}-year term is strategic at your age — years of coverage at today's rates",
    "medium_good_mid": "The {term_yr}-year duration strikes a great balance between cost and coverage length",
    "short_bad_young": "Only a {term_yr}-year term — consider longer plans for sustained early-career coverage",
    "long_bad_senior": "⚠️ A {term_yr}-year term may be too long — shorter plans often make more sense after 50",
}

_BUDGET_PHRASES = [
    ("high", "Extremely budget-friendly at ₹{prem}/mo — leaves ample room in your finances"),
    ("high", "Outstanding value at ₹{prem}/mo — among the most affordable options for your income level"),
    ("mid", "Fair pricing at ₹{prem}/mo — comfortable fit within your income bracket"),
    ("mid", "₹{prem}/mo sits well within your budget — no financial strain expected"),
    ("low", "₹{prem}/mo is on the expensive side for your income — weigh the coverage benefits carefully"),
    ("low", "Higher-end pricing at ₹{prem}/mo — might stretch your budget unless the coverage is essential"),
]

_DEPENDENT_PHRASES = [
    "Includes robust family protection features that directly benefit your dependents",
    "Strong coverage for families — maternity, child, or spouse benefits are part of this plan",
    "Family-oriented plan that extends security to your loved ones",
]
_NO_FAMILY_PHRASES = [
    "Limited family-specific coverage — if dependents are a priority, consider a family-floater plan",
    "Primarily individual coverage — may not fully address dependent needs",
]
_DEDUCTIBLE_PHRASES = {
    "zero": "Zero deductible means no out-of-pocket costs when you claim",
    "aligned": "The ₹{ded} deductible fits your risk appetite — good balance of premium vs. protection",
    "high": "₹{ded} deductible is significant — but keeps monthly premiums lower if you rarely claim",
}


def _pick(phrases, idx):
    """Deterministic variety: pick phrase based on index to avoid same text for every card."""
    return phrases[idx % len(phrases)]


def _build_reason(
    policy, score: float, age: int,
    smoker: bool, has_dependents: bool,
    scores: dict, preferred_types: list,
    card_idx: int,
) -> str:
    parts = []
    ptype = policy.policy_type
    term = policy.term_months or 12
    term_yr = max(1, term // 12)
    prem = int(policy.premium)
    ded = int(float(policy.deductible or 0))

    # 1. Age-type reasoning (varied)
    if scores["age_type"] >= 0.85:
        if age <= 30:
            parts.append(_pick(_AGE_PHRASES_YOUNG, card_idx).format(age=age, ptype=ptype))
        elif age <= 45:
            parts.append(_pick(_AGE_PHRASES_MID, card_idx).format(age=age, ptype=ptype))
        else:
            parts.append(_pick(_AGE_PHRASES_SENIOR, card_idx).format(age=age, ptype=ptype))
    elif scores["age_type"] >= 0.5:
        base = f"Reasonably suited for age {age}"
        if ptype in preferred_types:
            base += f" — and it's in your preferred {ptype} category"
        parts.append(base)
    else:
        parts.append(_pick(_AGE_PHRASES_LOW, card_idx).format(age=age))

    # 2. Term reasoning
    if scores["age_term"] >= 0.85:
        if age >= 50 and term <= 60:
            parts.append(_TERM_PHRASES["short_good_senior"].format(term_yr=term_yr))
        elif age < 30 and term >= 120:
            parts.append(_TERM_PHRASES["long_good_young"].format(term_yr=term_yr))
        else:
            parts.append(_TERM_PHRASES["medium_good_mid"].format(term_yr=term_yr))
    elif scores["age_term"] <= 0.35:
        if age >= 50 and term > 120:
            parts.append(_TERM_PHRASES["long_bad_senior"].format(term_yr=term_yr))
        elif age < 30 and term <= 12:
            parts.append(_TERM_PHRASES["short_bad_young"].format(term_yr=term_yr))

    # 3. Smoker reasoning (varied)
    if smoker and ptype in ("health", "life"):
        parts.append(_pick(_SMOKER_WARN, card_idx).format(ptype=ptype))
    elif not smoker and ptype in ("health", "life") and scores["smoker"] >= 0.9:
        parts.append(_pick(_SMOKER_BONUS, card_idx).format(ptype=ptype))

    # 4. Coverage preference
    if scores["coverage"] >= 1.0:
        parts.append(f"Matches your selected {ptype} preference ✓")
    elif scores["coverage"] < 0.3:
        parts.append(f"Outside your selected categories — still worth considering as a backup")

    # 5. Budget (varied)
    if scores["budget"] >= 0.85:
        phrase = _pick([p for p in _BUDGET_PHRASES if p[0] == "high"], card_idx)
        parts.append(phrase[1].format(prem=f"{prem:,}"))
    elif scores["budget"] >= 0.55:
        phrase = _pick([p for p in _BUDGET_PHRASES if p[0] == "mid"], card_idx)
        parts.append(phrase[1].format(prem=f"{prem:,}"))
    elif scores["budget"] < 0.3:
        phrase = _pick([p for p in _BUDGET_PHRASES if p[0] == "low"], card_idx)
        parts.append(phrase[1].format(prem=f"{prem:,}"))

    # 6. Dependents
    if has_dependents:
        if scores["dependents"] >= 0.85:
            parts.append(_pick(_DEPENDENT_PHRASES, card_idx))
        elif scores["dependents"] <= 0.4:
            parts.append(_pick(_NO_FAMILY_PHRASES, card_idx))

    # 7. Deductible
    if ded == 0:
        parts.append(_DEDUCTIBLE_PHRASES["zero"])
    elif scores["deductible"] >= 0.65:
        parts.append(_DEDUCTIBLE_PHRASES["aligned"].format(ded=f"{ded:,}"))
    elif ded > 5000:
        parts.append(_DEDUCTIBLE_PHRASES["high"].format(ded=f"{ded:,}"))

    # Assemble
    reason = ". ".join(p.strip() for p in parts if p) + "."
    if reason:
        reason = reason[0].upper() + reason[1:]
    return reason


# ━━━━━━━━━━━━━━━━━ ROUTES ━━━━━━━━━━━━━━━━━

@router.post("/generate", response_model=List[schemas.RecommendationResponse])
def generate_recommendations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rp = current_user.risk_profile or {}
    if not rp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your risk profile (Preferences) first.",
        )

    age_group       = rp.get("age_group", "")
    income_bracket  = rp.get("income_bracket", "₹5-10L")
    preferred_types = rp.get("preferred_types", [])
    risk_appetite   = rp.get("risk_appetite", "medium")
    coverage_priority = rp.get("coverage_priority", "medium")
    is_smoker       = rp.get("smoker", False)
    has_dependents  = rp.get("has_dependents", False)

    # age_group takes priority over DOB
    age = _compute_age(current_user.dob, age_group)

    W = {
        "coverage": 0.20, "budget": 0.15, "smoker": 0.15,
        "age_term": 0.15, "age_type": 0.15,
        "dependents": 0.10, "deductible": 0.10,
    }

    policies = (
        db.query(models.Policy)
        .options(joinedload(models.Policy.provider))
        .all()
    )

    scored = []
    for p in policies:
        cov_data = p.coverage or {}
        sd = {
            "coverage":   _coverage_match(p, preferred_types),
            "budget":     _premium_match(float(p.premium), income_bracket),
            "smoker":     _smoker_impact(is_smoker, p.policy_type, cov_data),
            "age_term":   _age_term_match(age, p.term_months),
            "age_type":   _age_type_fit(age, p.policy_type),
            "dependents": _dependents_impact(has_dependents, p.policy_type, cov_data),
            "deductible": _deductible_match(float(p.deductible or 0), risk_appetite, coverage_priority),
        }
        raw = sum(W[k] * sd[k] for k in W)
        score_pct = round(raw * 100, 1)
        scored.append((p, score_pct, sd))

    scored.sort(key=lambda x: x[1], reverse=True)

    # Persist top 15
    db.query(models.Recommendation).filter(
        models.Recommendation.user_id == current_user.id
    ).delete()

    recs = []
    for idx, (p, score_pct, sd) in enumerate(scored[:15]):
        reason = _build_reason(
            p, score_pct, age, is_smoker, has_dependents,
            sd, preferred_types, idx,
        )
        rec = models.Recommendation(
            user_id=current_user.id, policy_id=p.id,
            score=score_pct, reason=reason,
        )
        db.add(rec)
        recs.append(rec)

    db.commit()
    for r in recs:
        db.refresh(r)

    return (
        db.query(models.Recommendation)
        .options(joinedload(models.Recommendation.policy).joinedload(models.Policy.provider))
        .filter(models.Recommendation.user_id == current_user.id)
        .order_by(models.Recommendation.score.desc())
        .all()
    )


@router.get("/", response_model=List[schemas.RecommendationResponse])
def get_recommendations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Recommendation)
        .options(joinedload(models.Recommendation.policy).joinedload(models.Policy.provider))
        .filter(models.Recommendation.user_id == current_user.id)
        .order_by(models.Recommendation.score.desc())
        .all()
    )
