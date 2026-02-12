
import logging
from sqlalchemy import create_engine
from sqlalchemy_utils import database_exists, create_database
from app.db.session import engine, SQLALCHEMY_DATABASE_URL
from app.db.base_class import Base
# Import all models to ensure they are registered with Base.metadata
from app.api.deps import get_db
from app.models.user import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    try:
        if not database_exists(SQLALCHEMY_DATABASE_URL):
            create_database(SQLALCHEMY_DATABASE_URL)
            logger.info(f"Database created at {SQLALCHEMY_DATABASE_URL}")
        else:
            logger.info(f"Database already exists at {SQLALCHEMY_DATABASE_URL}")
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        logger.info("Tables created successfully")
        
    except Exception as e:
        logger.error(f"Error creating database: {e}")
        raise e

if __name__ == "__main__":
    logger.info("Creating initial data")
    init_db()
    logger.info("Initial data created")
