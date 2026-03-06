
from fastapi import APIRouter
from app.api.v1.endpoints import auth, policies, users, recommendations

api_router = APIRouter()
api_router.include_router(auth.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(policies.router, prefix="/policies", tags=["policies"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
