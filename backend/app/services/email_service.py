import smtplib
from email.message import EmailMessage
from app.core.config import settings

def send_email(to_email: str, subject: str, message: str):
    """
    Sends an email securely using SMTP based on environment configurations.
    """
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"SMTP configuration missing. Skipping email to {to_email}.")
        print(f"Message logged instead:\nSubject: {subject}\n{message}")
        return

    msg = EmailMessage()
    msg.set_content(message)
    msg["Subject"] = subject
    msg["From"] = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER
    msg["To"] = to_email

    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT or 587)
        if settings.SMTP_TLS:
            server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Successfully sent email to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
