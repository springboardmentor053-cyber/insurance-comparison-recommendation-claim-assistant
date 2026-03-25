"""
Celery App – Task queue configuration.
Broker and backend both use Redis.
"""

from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()

celery_app = Celery(
    "covermate",
    broker=os.getenv("CELERY_BROKER_URL",  "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0"),
    include=["app.tasks"],   # tells Celery where to find tasks
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Kolkata",
    enable_utc=True,
)