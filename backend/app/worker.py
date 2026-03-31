from app.core.celery_app import celery_app
from app.services.email_service import send_email

@celery_app.task(name="send_claim_status_email")
def send_claim_status_email_task(email: str, claim_number: str, status: str):
    """
    Background task to send an email notification to the user 
    when their claim status is updated by an admin.
    """
    print(f"[Celery] Executing email task for claim {claim_number}")
    subject = f"Update on Your Insurance Claim #{claim_number}"
    
    formatted_status = status.replace('_', ' ').capitalize()
    
    message = (
        f"Hello,\n\n"
        f"The status of your insurance claim ({claim_number}) has been updated.\n\n"
        f"Current Status: {formatted_status}\n\n"
        f"Log in to your dashboard to view the full details and any admin notes.\n\n"
        f"Thank you,\n"
        f"The Insurance Assistant Team"
    )
    
    send_email(email, subject, message)
    return f"Email sent to {email}"
