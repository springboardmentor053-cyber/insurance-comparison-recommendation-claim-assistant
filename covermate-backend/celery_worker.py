"""
Celery Worker — Async task queue for CoverMate.

Broker + Backend: Redis on localhost:6379
Tasks: send_email_task (SMTP email with HTML template)

To start the worker:
    cd covermate-backend
    celery -A celery_worker worker --loglevel=info --pool=solo
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from celery import Celery
from dotenv import load_dotenv

# ── Load .env so SMTP vars are available ──
load_dotenv(os.path.join(os.path.dirname(__file__), "app", ".env"))
# Also try root-level .env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# ── Create Celery App ──
celery = Celery(
    "tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

# Configuration — fail fast if Redis is down
celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    broker_connection_timeout=2,
    broker_connection_max_retries=1,
    broker_connection_retry_on_startup=False,
    result_backend_transport_options={"retry_policy": {"max_retries": 0}},
)


# ── SMTP Configuration ──
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)


def send_email(to_email: str, subject: str, body: str):
    """
    Send an email via SMTP.
    If SMTP is not configured, logs to console.
    """
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASS:
        print(f"\n{'='*50}")
        print(f"📧 EMAIL (SMTP not configured — console fallback)")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body: {body}")
        print(f"{'='*50}\n")
        return True

    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg["Subject"] = subject

    # Plain text
    msg.attach(MIMEText(body, "plain"))

    # HTML version (styled CoverMate template)
    html = f"""
    <html>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem;">
        <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 2rem; border: 1px solid rgba(99,102,241,0.2);">
            <h2 style="color: #818cf8; margin-top: 0;">Cover<span style="color: #f97316;">Mate</span></h2>
            <h3 style="color: #e2e8f0;">{subject}</h3>
            <p style="color: #94a3b8; line-height: 1.6;">{body}</p>
            <hr style="border: none; border-top: 1px solid rgba(148,163,184,0.2); margin: 1.5rem 0;">
            <p style="color: #64748b; font-size: 0.8rem;">
                This is an automated notification from CoverMate Insurance Assistant.
            </p>
        </div>
    </body>
    </html>
    """
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_FROM, to_email, msg.as_string())
        print(f"✅ Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        print(f"❌ Email send failed ({to_email}): {e}")
        return False


# ━━━━━━━━━━━━━━━━━ CELERY TASKS ━━━━━━━━━━━━━━━━━

@celery.task(name="send_email_task")
def send_email_task(email: str, subject: str, message: str):
    """
    Celery task for sending email asynchronously.
    
    Called via:  send_email_task.delay(email, subject, message)
    
    The .delay() method pushes the task to Redis queue.
    Celery worker picks it up and executes send_email().
    """
    print(f"📨 Celery processing email task → {email}: {subject}")
    return send_email(email, subject, message)
