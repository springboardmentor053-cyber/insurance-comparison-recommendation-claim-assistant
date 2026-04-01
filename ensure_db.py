import sys
import os
from sqlalchemy import create_engine
from sqlalchemy_utils import database_exists, create_database
from urllib.parse import quote_plus

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.config import settings

def ensure_db_exists():
    url = settings.assemble_db_url()
    print(f"Checking database at {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}...")
    try:
        if not database_exists(url):
            print(f"Database {settings.POSTGRES_DB} does not exist. Attempting to create it...")
            create_database(url)
            print("Database created successfully.")
        else:
            print(f"Database {settings.POSTGRES_DB} already exists.")
    except Exception as e:
        print(f"Error checking/creating database: {e}")
        print("\nTIP: Make sure PostgreSQL is installed and running on the specified port.")
        sys.exit(1)

if __name__ == "__main__":
    ensure_db_exists()
