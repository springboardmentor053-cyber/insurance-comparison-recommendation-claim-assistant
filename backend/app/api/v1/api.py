
from fastapi import APIRouter
from app.api.v1.endpoints import auth, policies, users, recommendations, claims, user_policies

api_router = APIRouter()
api_router.include_router(auth.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(policies.router, prefix="/policies", tags=["policies"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(claims.router, prefix="/claims", tags=["claims"])
api_router.include_router(user_policies.router, prefix="/user-policies", tags=["user-policies"])
