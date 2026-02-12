
import logging
from app.db.session import engine
from app.db.base import Base
# Import all models to ensure they are registered with Base.metadata
from app.models.user import User
from app.models.provider import Provider
from app.models.policy import Policy

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_db():
    try:
        logger.info("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        logger.info("Tables dropped.")
        
        logger.info("Creating all tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Tables created successfully.")
        
    except Exception as e:
        logger.error(f"Error resetting database: {e}")
        raise e

if __name__ == "__main__":
    reset_db()
