"""
Email Service — Resilient async email dispatch via Celery.

Architecture (per mentor guidance):
  FastAPI → dispatch_email() → Celery .delay() → Redis → Worker → SMTP

If Redis is down, falls back to synchronous console logging
so the API never blocks or crashes.
"""

import smtplib
import os
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


# ── SMTP Configuration ──
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)


def send_email_sync(to_email: str, subject: str, body: str):
    """
    Send an email synchronously via SMTP.
    If SMTP is not configured, logs to console.
    """
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASS:
        print(f"\n{'='*50}")
        print(f"📧 EMAIL NOTIFICATION")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body: {body}")
        print(f"{'='*50}\n")
        return True

    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

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


def _try_celery_delay(to_email: str, subject: str, body: str, result: dict):
    """Try Celery .delay() in a thread so we can timeout if Redis is down."""
    try:
        from celery_worker import send_email_task
        send_email_task.delay(to_email, subject, body)
        result["success"] = True
    except Exception as e:
        result["error"] = str(e)


def dispatch_email(to_email: str, subject: str, body: str):
    """
    Dispatch email via Celery (.delay()) if Redis is available.
    Falls back to synchronous send if Redis is down.

    Uses a thread with a 3-second timeout to prevent blocking
    the API if Redis is unresponsive.

    This ensures the API NEVER blocks or crashes because of email.
    """
    result = {"success": False, "error": None}

    # Try Celery dispatch in a separate thread with timeout
    t = threading.Thread(target=_try_celery_delay, args=(to_email, subject, body, result))
    t.daemon = True
    t.start()
    t.join(timeout=3)  # Wait at most 3 seconds

    if result["success"]:
        print(f"📨 Email task dispatched via Celery → {to_email}")
    else:
        reason = result.get("error", "timeout")
        print(f"⚠️  Celery/Redis unavailable ({reason}), sending synchronously")
        send_email_sync(to_email, subject, body)
