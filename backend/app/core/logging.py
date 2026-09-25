import logging
import sys
from app.core.config import settings


def setup_logging():
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    log_format = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    
    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Suppress noisy external libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("motor").setLevel(logging.INFO)
    logging.getLogger("pymongo").setLevel(logging.INFO)
    
    logger = logging.getLogger("app")
    logger.info(f"Structured logging initialized at level: {logging.getLevelName(log_level)}")
    return logger
