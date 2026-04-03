"""
Network Routes — Cashless hospital and garage locator.

Endpoints:
    GET /network/search?type=hospital&pincode=110001 → search network providers
    GET /network/all                                 → list all providers (no filter)
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user

router = APIRouter(prefix="/network", tags=["Network Locator"])


# ─────────────────── SEARCH NETWORK PROVIDERS ───────────────────
@router.get("/search", response_model=List[schemas.NetworkProviderResponse])
def search_network(
    provider_type: Optional[str] = Query(None, description="Filter by type: 'hospital' or 'garage'"),
    pincode: Optional[str] = Query(None, description="Filter by pincode"),
    city: Optional[str] = Query(None, description="Filter by city name (partial match)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Search cashless hospitals and network garages.
    Filters can be combined: type + pincode, type + city, etc.
    Returns max 50 results.
    """
    query = db.query(models.NetworkProvider).filter(
        models.NetworkProvider.is_active == True
    )

    if provider_type:
        query = query.filter(models.NetworkProvider.provider_type == provider_type)

    if pincode:
        query = query.filter(models.NetworkProvider.pincode == pincode)

    if city:
        query = query.filter(
            models.NetworkProvider.city.ilike(f"%{city}%")
        )

    return query.order_by(models.NetworkProvider.name).limit(50).all()


# ─────────────────── LIST ALL PROVIDERS ───────────────────
@router.get("/all", response_model=List[schemas.NetworkProviderResponse])
def list_all_network(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return all active network providers (max 100)."""
    return (
        db.query(models.NetworkProvider)
        .filter(models.NetworkProvider.is_active == True)
        .order_by(models.NetworkProvider.provider_type, models.NetworkProvider.city)
        .limit(100)
        .all()
    )
