"""
Premium Calculation Service
This module contains business logic for calculating insurance premium.
"""

from typing import Optional


def calculate_premium(
    base_premium: float,
    age: int,
    coverage_amount: Optional[float] = None,
    term_months: Optional[int] = None,
    risk_factor: Optional[float] = None,
) -> float:
    """
    Calculate final premium based on:
    - Base premium
    - Age
    - Coverage amount  (optional — skipped if not provided)
    - Term length      (optional — skipped if not provided)
    - Risk factor      (optional multiplier, defaults to 1.0)

    Returns:
        float: Final calculated premium
    """

    # --------------------------
    # Age Loading
    # --------------------------
    age_factor = 0.0

    if age < 25:
        age_factor = 0.15   # +15%
    elif 25 <= age <= 35:
        age_factor = 0.05   # +5%
    elif 36 <= age <= 50:
        age_factor = 0.10   # +10%
    else:
        age_factor = 0.20   # +20%

    # --------------------------
    # Coverage Loading
    # --------------------------
    # Every 1 lakh coverage increases premium by 2%
    coverage_factor = (coverage_amount / 100000) * 0.02 if coverage_amount else 0.0

    # --------------------------
    # Term Loading
    # --------------------------
    # 5% increase per year of policy term
    term_factor = ((term_months / 12) * 0.05) if term_months else 0.0

    # --------------------------
    # Final Premium Calculation
    # --------------------------
    total_factor = 1 + age_factor + coverage_factor + term_factor

    calculated_premium = base_premium * total_factor

    # Apply risk multiplier (default 1.0 = no change)
    calculated_premium *= (risk_factor if risk_factor is not None else 1.0)

    return round(calculated_premium, 2)