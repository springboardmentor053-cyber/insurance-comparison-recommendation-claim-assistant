from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# ─── Database ───
DATABASE_URL = os.getenv("DATABASE_URL")

# ─── JWT ───
SECRET_KEY = os.getenv("SECRET_KEY", "SECRET_KEY_CHANGE_LATER")

# ─── CORS ───
# Comma-separated origins, e.g. "http://localhost:3000,http://localhost:5173"
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
