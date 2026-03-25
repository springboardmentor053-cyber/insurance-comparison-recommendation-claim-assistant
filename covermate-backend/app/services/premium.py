"""
Premium Calculation Service
This module contains business logic for calculating insurance premium.
"""


def calculate_premium(
    base_premium: float,
    age: int,
    coverage_amount: float,
    term_months: int,
    risk_factor: float = 1.0
) -> float:
    """
    Calculate final premium based on:
    - Base premium
    - Age
    - Coverage amount
    - Term length
    - Risk factor (optional multiplier)

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
    coverage_factor = (coverage_amount / 100000) * 0.02


    # --------------------------
    # Term Loading
    # --------------------------
    # 5% increase per year of policy term
    years = term_months / 12
    term_factor = years * 0.05


    # --------------------------
    # Final Premium Calculation
    # --------------------------
    total_factor = 1 + age_factor + coverage_factor + term_factor

    calculated_premium = base_premium * total_factor

    # Apply risk multiplier
    calculated_premium *= risk_factor

    return round(calculated_premium, 2)
