"""
Email Service – FastAPI-Mail configuration and helper.
Used by Celery tasks to send emails via Gmail SMTP.
"""

import os
from dotenv import load_dotenv
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

load_dotenv()

# ── Gmail SMTP config loaded from .env ────────────────────────────────────
conf = ConnectionConfig(
    MAIL_USERNAME   = os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD   = os.getenv("MAIL_PASSWORD"),
    MAIL_FROM       = os.getenv("MAIL_FROM"),
    MAIL_PORT       = int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER     = os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS   = True,
    MAIL_SSL_TLS    = False,
    USE_CREDENTIALS = True,
)


async def send_email(subject: str, recipient: str, body: str):
    """
    Send a plain HTML email to a single recipient.
    Called from Celery tasks via asyncio.run().
    """
    message = MessageSchema(
        subject    = subject,
        recipients = [recipient],
        body       = body,
        subtype    = MessageType.html,
    )
    fm = FastMail(conf)
    await fm.send_message(message)