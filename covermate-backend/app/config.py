from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# ─── Database ───
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/covermate_db")

# ─── JWT ───
SECRET_KEY = os.getenv("SECRET_KEY", "SECRET_KEY_CHANGE_LATER")

# ─── CORS ───
# Comma-separated origins, e.g. "http://localhost:3000,http://localhost:5173"
CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if origin.strip()]
