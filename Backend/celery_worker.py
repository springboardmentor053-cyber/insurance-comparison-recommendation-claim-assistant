from celery import Celery
import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

# Redis URL (adjust if your Redis runs elsewhere)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery = Celery("tasks", broker=REDIS_URL, backend=REDIS_URL)

# SMTP settings (from environment)
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USERNAME)

def send_email(to_email: str, subject: str, message: str):
    """Sends an email using SMTP (blocking)."""
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print("SMTP credentials missing. Skipping email.")
        print(f"Would send to {to_email}: {subject}")
        return

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)

        msg = EmailMessage()
        msg.set_content(message)
        msg["Subject"] = subject
        msg["From"] = FROM_EMAIL
        msg["To"] = to_email

        server.send_message(msg)
        server.quit()
        print(f"Email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")

@celery.task
def send_email_task(to_email: str, subject: str, message: str):
    """Celery task to send email asynchronously."""
    send_email(to_email, subject, message)