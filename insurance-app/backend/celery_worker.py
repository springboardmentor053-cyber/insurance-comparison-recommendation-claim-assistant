import os
import smtplib
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

celery = Celery(
    "tasks",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_BACKEND_URL", "redis://localhost:6379/0")
)

def send_email(email: str, subject: str, message: str):
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(
        os.getenv("SMTP_EMAIL"),
        os.getenv("SMTP_PASSWORD")
    )
    msg = f"Subject: {subject}\n\n{message}"
    server.sendmail(os.getenv("SMTP_EMAIL"), email, msg)
    server.quit()

@celery.task(bind=True, max_retries=3)
def send_email_task(self, email: str, subject: str, message: str):
    try:
        send_email(email, subject, message)
        print(f"Email sent to {email}")
    except Exception as exc:
        print(f"Email failed: {exc}")
        raise self.retry(exc=exc, countdown=60)