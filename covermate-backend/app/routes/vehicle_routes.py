"""
Vehicle Routes — RTO vehicle registration lookup (mocked service).

Endpoint:
    GET /vehicle/lookup?reg=DL3CAB1234 → Returns vehicle details by reg number

The mock service extracts the RTO code prefix and returns realistic vehicle
data. In production this would call the official Vahan API or an aggregator.
"""

import random
from fastapi import APIRouter, Query, HTTPException
from app import schemas

router = APIRouter(prefix="/vehicle", tags=["Vehicle Lookup"])


# ── Mock data pools ──
_MAKES = {
    "maruti":    ["Swift", "Baleno", "Dzire", "Ertiga", "Brezza"],
    "hyundai":   ["i20", "Creta", "Verna", "Venue", "Tucson"],
    "tata":      ["Nexon", "Harrier", "Punch", "Tiago", "Altroz"],
    "honda":     ["City", "Amaze", "Jazz", "WR-V", "Elevate"],
    "toyota":    ["Innova", "Fortuner", "Camry", "Urban Cruiser", "Glanza"],
    "mahindra":  ["Scorpio", "XUV700", "Thar", "Bolero", "XUV300"],
    "kia":       ["Seltos", "Sonet", "Carens", "EV6"],
    "volkswagen":["Polo", "Vento", "Taigun", "Virtus"],
}

_FUEL = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"]

_RTO_MAP = {
    "DL": "Delhi",
    "MH": "Mumbai",
    "KA": "Bengaluru",
    "TN": "Chennai",
    "UP": "Lucknow",
    "GJ": "Ahmedabad",
    "RJ": "Jaipur",
    "WB": "Kolkata",
    "AP": "Hyderabad",
    "HR": "Gurgaon",
    "PB": "Chandigarh",
    "MP": "Bhopal",
    "UK": "Dehradun",
    "OR": "Bhubaneswar",
    "BR": "Patna",
}


def _parse_rto(reg: str) -> tuple[str, str]:
    """Extract state code and return (rto_code, city)."""
    reg = reg.upper().strip().replace("-", "").replace(" ", "")
    state_code = reg[:2]
    city = _RTO_MAP.get(state_code, "Unknown City")
    # RTO code is first 4 chars (state + district number)
    rto_code = reg[:4] if len(reg) >= 4 else reg
    return rto_code, city


def _seed_from_reg(reg: str) -> int:
    """Deterministic seed from reg number so same reg always gives same car."""
    return sum(ord(c) for c in reg.upper())


# ─────────────────── VEHICLE LOOKUP ───────────────────
@router.get("/lookup", response_model=schemas.VehicleInfo)
def lookup_vehicle(
    reg: str = Query(..., description="Vehicle registration number, e.g. DL3CAB1234"),
):
    """
    Look up vehicle details by registration number.

    Returns make, model, year, fuel type, and RTO information.
    This is a realistic mock — replace with Vahan API in production.
    """
    reg_clean = reg.upper().strip().replace("-", "").replace(" ", "")

    if len(reg_clean) < 6:
        raise HTTPException(
            status_code=422,
            detail="Invalid registration number. Expected format: DL3CAB1234"
        )

    rto_code, rto_city = _parse_rto(reg_clean)

    # Use deterministic random so same reg always returns same car
    rng = random.Random(_seed_from_reg(reg_clean))

    make_key = rng.choice(list(_MAKES.keys()))
    model = rng.choice(_MAKES[make_key])
    year = rng.randint(2015, 2024)
    fuel = rng.choice(_FUEL)

    return schemas.VehicleInfo(
        reg_number=reg_clean,
        make=make_key.title(),
        model=model,
        year=year,
        fuel_type=fuel,
        rto_code=rto_code,
        rto_city=rto_city,
        vehicle_class="Motor Car (LMV)",
    )
