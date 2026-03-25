"""
Celery Tasks – Async email notifications for CoverMate.
"""

import asyncio
from app.celery_app import celery_app
from app.services.email_service import send_email


def email_template(title: str, body_html: str) -> str:
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 32px;">
      <div style="background: #080c14; border-radius: 12px; padding: 32px;">
        <div style="margin-bottom: 24px;">
          <span style="font-size: 20px; font-weight: 700; color: #f1f5f9;">Cover</span>
          <span style="font-size: 20px; font-weight: 700; color: #818cf8;">Mate</span>
        </div>
        <h2 style="color: #f1f5f9; font-size: 18px; margin: 0 0 16px;">{title}</h2>
        {body_html}
        <hr style="border: none; border-top: 1px solid rgba(99,102,241,0.2); margin: 24px 0;">
        <p style="color: #475569; font-size: 12px; margin: 0;">
          This is an automated email from CoverMate Insurance Assistant.<br>
          Please do not reply to this email.
        </p>
      </div>
    </div>
    """


STATUS_META = {
    "submitted":    {"color": "#60a5fa", "label": "Submitted",    "msg": "Your claim has been received and is pending review."},
    "under_review": {"color": "#fbbf24", "label": "Under Review", "msg": "Our team is currently reviewing your claim documents."},
    "approved":     {"color": "#4ade80", "label": "Approved",     "msg": "Congratulations! Your claim has been approved. Payment will be processed shortly."},
    "rejected":     {"color": "#f87171", "label": "Rejected",     "msg": "Unfortunately your claim could not be approved. Please contact support for details."},
    "paid":         {"color": "#a78bfa", "label": "Paid",         "msg": "Your claim payment has been processed successfully."},
    # policy statuses
    "active":       {"color": "#4ade80", "label": "Active",       "msg": "Your policy is now active and fully covered."},
    "expired":      {"color": "#94a3b8", "label": "Expired",      "msg": "Your policy has expired. Please consider renewing to stay protected."},
    "cancelled":    {"color": "#f87171", "label": "Cancelled",    "msg": "Your policy has been cancelled."},
}


# ── Task 1: Claim submitted confirmation ──────────────────────────────────
@celery_app.task(name="send_claim_submitted_email")
def send_claim_submitted_email(user_email: str, user_name: str, claim_number: str, claim_type: str, amount: str):
    body = f"""
    <p style="color: #94a3b8; margin: 0 0 20px;">Hi {user_name},</p>

    <div style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25);
                border-radius: 10px; padding: 20px; margin-bottom: 20px;">
      <p style="color: #a5b4fc; font-size: 11px; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 6px;">Claim Number</p>
      <p style="color: #f1f5f9; font-size: 22px; font-weight: 700;
                font-family: monospace; margin: 0;">{claim_number}</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="color: #64748b; font-size: 13px; padding: 8px 0;
                   border-bottom: 1px solid rgba(51,65,85,0.4);">Claim type</td>
        <td style="color: #e2e8f0; font-size: 13px; padding: 8px 0; text-align: right;
                   border-bottom: 1px solid rgba(51,65,85,0.4); text-transform: capitalize;">{claim_type}</td>
      </tr>
      <tr>
        <td style="color: #64748b; font-size: 13px; padding: 8px 0;">Amount claimed</td>
        <td style="color: #e2e8f0; font-size: 13px; padding: 8px 0; text-align: right;">{amount}</td>
      </tr>
    </table>

    <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
      Your claim has been successfully submitted. Our team will review your documents
      and update you within <strong style="color: #e2e8f0;">2–3 business days</strong>.
    </p>
    """
    html = email_template("Claim Submitted Successfully", body)
    asyncio.run(send_email(
        subject   = f"Claim {claim_number} — Submitted Successfully",
        recipient = user_email,
        body      = html,
    ))


# ── Task 2: Claim/Policy status changed ──────────────────────────────────
# ✅ Added optional `note` parameter so admin notes appear in the email
@celery_app.task(name="send_claim_status_email")
def send_claim_status_email(
    user_email: str,
    user_name: str,
    claim_number: str,
    new_status: str,
    note: str = None,          # ✅ NEW — admin note shown in email
):
    meta = STATUS_META.get(new_status, {
        "color": "#94a3b8",
        "label": new_status.replace("_"," ").title(),
        "msg":   "Your status has been updated."
    })

    # Admin note section — only shown if note was provided
    note_section = ""
    if note:
        note_section = f"""
    <div style="margin-top: 16px; padding: 14px 16px;
                background: rgba(99,102,241,0.08);
                border-left: 3px solid {meta['color']};
                border-radius: 0 8px 8px 0;">
      <p style="color: #a5b4fc; font-size: 10px; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 6px;">Note from Admin</p>
      <p style="color: #e2e8f0; font-size: 13px; margin: 0; line-height: 1.6;">{note}</p>
    </div>
        """

    body = f"""
    <p style="color: #94a3b8; margin: 0 0 20px;">Hi {user_name},</p>

    <p style="color: #94a3b8; font-size: 13px; margin: 0 0 20px;">
      The status of your claim/policy <strong style="color: #e2e8f0;">{claim_number}</strong> has been updated.
    </p>

    <div style="background: rgba(15,23,42,0.8); border: 1px solid rgba(51,65,85,0.5);
                border-radius: 10px; padding: 20px; margin-bottom: 20px; text-align: center;">
      <p style="color: #64748b; font-size: 11px; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 10px;">New Status</p>
      <span style="background: rgba(99,102,241,0.1); border: 1px solid {meta['color']}33;
                   color: {meta['color']}; font-size: 15px; font-weight: 700;
                   padding: 8px 20px; border-radius: 100px;">
        {meta['label']}
      </span>
    </div>

    <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
      {meta['msg']}
    </p>

    {note_section}
    """

    html = email_template(f"Status Update — {meta['label']}", body)
    asyncio.run(send_email(
        subject   = f"{claim_number} — Status Updated to {meta['label']}",
        recipient = user_email,
        body      = html,
    ))