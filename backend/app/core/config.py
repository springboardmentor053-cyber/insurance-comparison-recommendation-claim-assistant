
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Insurance Assistant"
    API_V1_STR: str = "/api/v1"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "Charan@123"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "insurance_db"
    DATABASE_URL: Optional[str] = None
    SECRET_KEY: str = "YOUR_SECRET_KEY_HERE" # Change in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    def assemble_db_url(self):
        from urllib.parse import quote_plus
        if self.DATABASE_URL:
             return self.DATABASE_URL
        encoded_password = quote_plus(self.POSTGRES_PASSWORD)
        return f"postgresql://{self.POSTGRES_USER}:{encoded_password}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
