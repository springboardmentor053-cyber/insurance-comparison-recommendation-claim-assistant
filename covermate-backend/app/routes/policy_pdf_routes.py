"""
Policy PDF, Renewal & Endorsement Routes.

Endpoints:
    POST /user-policies/{id}/generate-pdf → Generate a policy PDF document
    POST /user-policies/{id}/renew        → 1-click policy renewal
    POST /user-policies/{id}/endorse      → Request a policy change (endorsement)
    GET  /user-policies/{id}/endorsements → List endorsements for a policy
"""

import os
from datetime import date
from dateutil.relativedelta import relativedelta
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user
from app.email_service import dispatch_email

router = APIRouter(tags=["Policy Documents & Renewals"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "policies")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _generate_policy_number(user_id: int, policy_id: int) -> str:
    suffix = uuid.uuid4().hex[:4].upper()
    return f"CM-{user_id}-{policy_id}-{suffix}"


# ─────────────────── GENERATE POLICY PDF ───────────────────
@router.post("/user-policies/{user_policy_id}/generate-pdf", response_model=schemas.PolicyPDFResponse)
def generate_policy_pdf(
    user_policy_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Generate a PDF document for an active enrolled policy.
    Saves to uploads/policies/ and updates the UserPolicy.pdf_url field.
    Uses reportlab for PDF generation.
    """
    up = (
        db.query(models.UserPolicy)
        .options(
            joinedload(models.UserPolicy.policy).joinedload(models.Policy.provider),
            joinedload(models.UserPolicy.user),
        )
        .filter(
            models.UserPolicy.id == user_policy_id,
            models.UserPolicy.user_id == current_user.id,
        )
        .first()
    )
    if not up:
        raise HTTPException(status_code=404, detail="Enrolled policy not found")

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
            HRFlowable, KeepTogether
        )
        from reportlab.lib.units import cm
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
        from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate
        from reportlab.pdfgen import canvas as pdf_canvas

        filename = f"policy_{up.policy_number}_{uuid.uuid4().hex[:6]}.pdf"
        filepath = os.path.join(UPLOAD_DIR, filename)

        # ── Color palette ──
        PURPLE    = colors.HexColor("#7c3aed")
        PURPLE_LT = colors.HexColor("#ede9fe")
        ORANGE    = colors.HexColor("#f97316")
        DARK      = colors.HexColor("#1e1b4b")
        GRAY      = colors.HexColor("#6b7280")
        SILVER    = colors.HexColor("#f3f4f6")
        WHITE     = colors.white
        GREEN     = colors.HexColor("#16a34a")
        RED       = colors.HexColor("#dc2626")

        # ── Page callback — adds header & footer on every page ──
        def _draw_page(canv, doc):
            W, H = A4
            # ── Top banner ──
            canv.setFillColor(PURPLE)
            canv.rect(0, H - 2.4*cm, W, 2.4*cm, fill=True, stroke=False)
            # Logo text
            canv.setFillColor(WHITE)
            canv.setFont("Helvetica-Bold", 18)
            canv.drawString(2*cm, H - 1.6*cm, "Cover")
            canv.setFillColor(ORANGE)
            canv.drawString(2*cm + canv.stringWidth("Cover", "Helvetica-Bold", 18), H - 1.6*cm, "Mate")
            # Tagline
            canv.setFillColor(PURPLE_LT)
            canv.setFont("Helvetica", 8)
            canv.drawRightString(W - 2*cm, H - 1.2*cm, "India's Smart Insurance Assistant")
            # Document type badge
            canv.setFillColor(ORANGE)
            canv.roundRect(W - 6.5*cm, H - 1.85*cm, 4.5*cm, 0.65*cm, 4, fill=True, stroke=False)
            canv.setFillColor(WHITE)
            canv.setFont("Helvetica-Bold", 7)
            canv.drawCentredString(W - 4.25*cm, H - 1.55*cm, "POLICY CERTIFICATE")

            # ── Watermark ──
            canv.saveState()
            canv.setFillColor(colors.HexColor("#7c3aed"))
            canv.setFillAlpha(0.04)
            canv.setFont("Helvetica-Bold", 72)
            canv.translate(W/2, H/2)
            canv.rotate(35)
            canv.drawCentredString(0, 0, "COVERMATE")
            canv.restoreState()

            # ── Bottom footer ──
            canv.setFillColor(PURPLE)
            canv.rect(0, 0, W, 1.2*cm, fill=True, stroke=False)
            canv.setFillColor(WHITE)
            canv.setFont("Helvetica", 7)
            canv.drawString(2*cm, 0.45*cm,
                f"Policy No: {up.policy_number}  |  Generated: {date.today()}  |  Valid Document — CoverMate Insurance")
            canv.setFont("Helvetica", 7)
            canv.drawRightString(W - 2*cm, 0.45*cm, f"Page {doc.page}")

        doc = SimpleDocTemplate(
            filepath, pagesize=A4,
            rightMargin=2*cm, leftMargin=2*cm,
            topMargin=3.2*cm, bottomMargin=2*cm,
            onFirstPage=_draw_page, onLaterPages=_draw_page,
        )

        styles = getSampleStyleSheet()
        story  = []

        # ── Section heading style ──
        def _section(title):
            return [
                Spacer(1, 0.5*cm),
                Table(
                    [[Paragraph(f"<b><font color='#7c3aed'>{title}</font></b>", styles["Normal"])]],
                    colWidths=[16.5*cm],
                    style=TableStyle([
                        ("BACKGROUND", (0,0), (-1,-1), PURPLE_LT),
                        ("LINEBELOW",  (0,0), (-1,-1), 1.5, PURPLE),
                        ("PADDING",    (0,0), (-1,-1), 6),
                    ])
                ),
                Spacer(1, 0.3*cm),
            ]

        def _kv_table(rows, col1=6*cm, col2=10.5*cm):
            data   = [[Paragraph(f"<b>{k}</b>", styles["Normal"]),
                       Paragraph(str(v), styles["Normal"])] for k, v in rows]
            tbl    = Table(data, colWidths=[col1, col2])
            tbl.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (0, -1), SILVER),
                ("FONTNAME",   (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME",   (1, 0), (1, -1), "Helvetica"),
                ("FONTSIZE",   (0, 0), (-1, -1), 9),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, colors.HexColor("#fafafa")]),
                ("GRID",       (0, 0), (-1, -1), 0.4, colors.HexColor("#e5e7eb")),
                ("PADDING",    (0, 0), (-1, -1), 7),
                ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
            ]))
            return tbl

        policy   = up.policy
        provider = policy.provider if policy else None
        user     = up.user
        addons   = up.addons or []

        # ── Status badge colour ──
        status_color = GREEN if up.status == "active" else RED
        status_label = up.status.upper()

        # ─── POLICY HOLDER INFO ───
        story.extend(_section("1. Policy Holder Details"))
        story.append(_kv_table([
            ("Full Name",    user.name),
            ("Email",        user.email),
            ("Date of Birth", str(user.dob) if user.dob else "—"),
        ]))

        # ─── POLICY DETAILS ───
        story.extend(_section("2. Policy Details"))
        story.append(_kv_table([
            ("Policy Number",   up.policy_number or "—"),
            ("Policy Name",     policy.title     if policy  else "—"),
            ("Insurance Provider", provider.name if provider else "—"),
            ("Policy Type / Category", policy.category if policy else "—"),
            ("Start Date",      str(up.start_date)),
            ("End Date",        str(up.end_date)),
            ("Annual Premium",  f"\u20b9{float(up.premium):,.2f}" if up.premium else "—"),
            ("Coverage Amount", f"\u20b9{float(policy.coverage_amount):,.2f}"
                                if policy and policy.coverage_amount else "—"),
            ("Status",          status_label),
            ("Auto-Renewal",    "Enabled" if up.auto_renew else "Disabled"),
        ]))

        # ─── COVERAGE SUMMARY (from policy.coverage dict) ───
        if policy and policy.coverage:
            story.extend(_section("3. Coverage Summary"))
            cov_rows = []
            if isinstance(policy.coverage, dict):
                for k, v in policy.coverage.items():
                    cov_rows.append((k.replace("_", " ").title(), str(v)))
            if cov_rows:
                story.append(_kv_table(cov_rows))

        # ─── ADD-ONS ───
        if addons:
            story.extend(_section("4. Selected Add-ons & Riders"))
            addon_data = [
                [Paragraph("<b>Add-On</b>", styles["Normal"]),
                 Paragraph("<b>Description</b>", styles["Normal"]),
                 Paragraph("<b>Extra Premium</b>", styles["Normal"])]
            ]
            total_extra = 0
            for ua in addons:
                a = ua.addon
                if a:
                    addon_data.append([a.name, a.description or "—",
                                       f"\u20b9{float(a.extra_premium):,.0f}"])
                    total_extra += float(a.extra_premium or 0)
            addon_data.append(["", Paragraph("<b>Total Add-ons</b>", styles["Normal"]),
                                Paragraph(f"<b>\u20b9{total_extra:,.0f}</b>", styles["Normal"])])
            addon_tbl = Table(addon_data, colWidths=[4.5*cm, 8.5*cm, 3.5*cm])
            addon_tbl.setStyle(TableStyle([
                ("BACKGROUND",   (0, 0), (-1, 0), PURPLE),
                ("TEXTCOLOR",    (0, 0), (-1, 0), WHITE),
                ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE",     (0, 0), (-1, -1), 9),
                ("ROWBACKGROUNDS",(0, 1), (-1, -2), [WHITE, colors.HexColor("#fafafa")]),
                ("BACKGROUND",   (0, -1), (-1, -1), PURPLE_LT),
                ("FONTNAME",     (0, -1), (-1, -1), "Helvetica-Bold"),
                ("GRID",         (0, 0), (-1, -1), 0.4, colors.HexColor("#e5e7eb")),
                ("PADDING",      (0, 0), (-1, -1), 7),
                ("ALIGN",        (2, 0), (2, -1), "RIGHT"),
            ]))
            story.append(addon_tbl)

        # ─── TERMS ───
        story.extend(_section("5. Terms & Conditions"))
        terms = ParagraphStyle("terms", parent=styles["Normal"], fontSize=8,
                               textColor=GRAY, leading=13)
        story.append(Paragraph(
            "This policy document is issued subject to the terms and conditions of the policy contract. "
            "Subject to payment of premium and compliance with all policy terms, CoverMate Insurance "
            "provides the coverage described herein. Claim admissibility is subject to the event being "
            "covered under the policy, submission of complete documentation, and fraud checks. "
            "This is a system-generated document and is valid without a physical signature. "
            "In case of any discrepancy, the original policy wordings shall prevail. "
            "For grievances, write to support@covermate.com.",
            terms
        ))

        # ─── SIGNATURE BLOCK ───
        story.append(Spacer(1, 1*cm))
        sig_data = [[
            Paragraph("<b>Authorised Signatory</b><br/><font size=8 color='#6b7280'>CoverMate Insurance Pvt. Ltd.</font>", styles["Normal"]),
            Paragraph(f"<b>Date of Issue</b><br/><font size=8 color='#6b7280'>{date.today()}</font>", styles["Normal"]),
            Paragraph(f"<b>Policy Number</b><br/><font size=8 color='#6b7280'>{up.policy_number}</font>", styles["Normal"]),
        ]]
        sig_tbl = Table(sig_data, colWidths=[5.5*cm, 5.5*cm, 5.5*cm])
        sig_tbl.setStyle(TableStyle([
            ("LINEABOVE", (0, 0), (-1, 0), 1, PURPLE),
            ("PADDING",   (0, 0), (-1, -1), 8),
            ("FONTSIZE",  (0, 0), (-1, -1), 9),
        ]))
        story.append(sig_tbl)

        doc.build(story, onFirstPage=_draw_page, onLaterPages=_draw_page)

    except ImportError:
        # If reportlab is not installed, create a plain text fallback
        filename = f"policy_{up.policy_number}_{uuid.uuid4().hex[:6]}.txt"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "w") as f:
            f.write(f"COVERMATE POLICY DOCUMENT\n{'='*40}\n")
            f.write(f"Policy Number: {up.policy_number}\n")
            f.write(f"Policy: {up.policy.title if up.policy else 'N/A'}\n")
            f.write(f"Holder: {current_user.name}\n")
            f.write(f"Start: {up.start_date}  End: {up.end_date}\n")
            f.write(f"Premium: ₹{up.premium}\n")
            f.write(f"Status: {up.status}\n")

    # Save relative URL to DB
    pdf_url = f"/uploads/policies/{filename}"
    up.pdf_url = pdf_url
    db.commit()

    return schemas.PolicyPDFResponse(
        pdf_url=pdf_url,
        message="Policy document generated successfully"
    )


# ─────────────────── 1-CLICK RENEWAL ───────────────────
@router.post("/user-policies/{user_policy_id}/renew", response_model=schemas.UserPolicyResponse)
def renew_policy(
    user_policy_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    1-click policy renewal. Creates a new UserPolicy for the same policy
    starting from today, with a new policy number.
    """
    old = (
        db.query(models.UserPolicy)
        .options(joinedload(models.UserPolicy.policy).joinedload(models.Policy.provider))
        .filter(
            models.UserPolicy.id == user_policy_id,
            models.UserPolicy.user_id == current_user.id,
        )
        .first()
    )
    if not old:
        raise HTTPException(status_code=404, detail="Enrolled policy not found")
    if old.status == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot renew a cancelled policy")

    policy = old.policy
    today = date.today()
    term = policy.term_months or 12
    end = today + relativedelta(months=term)

    new_enrollment = models.UserPolicy(
        user_id=current_user.id,
        policy_id=old.policy_id,
        policy_number=_generate_policy_number(current_user.id, old.policy_id),
        start_date=today,
        end_date=end,
        premium=float(policy.premium),
        status="active",
        auto_renew=old.auto_renew,
    )
    db.add(new_enrollment)
    db.commit()
    db.refresh(new_enrollment)

    dispatch_email(
        current_user.email,
        f"🔄 Policy Renewed — {policy.title}",
        f"Hello {current_user.name},\n\nYour policy '{policy.title}' has been renewed successfully.\n\n"
        f"New Policy Number: {new_enrollment.policy_number}\n"
        f"Valid: {today} to {end}\n\nThank you for renewing with CoverMate!",
    )

    return (
        db.query(models.UserPolicy)
        .options(joinedload(models.UserPolicy.policy).joinedload(models.Policy.provider))
        .filter(models.UserPolicy.id == new_enrollment.id)
        .first()
    )


# ─────────────────── REQUEST ENDORSEMENT ───────────────────
@router.post("/user-policies/{user_policy_id}/endorse", response_model=schemas.EndorsementResponse, status_code=201)
def request_endorsement(
    user_policy_id: int,
    body: schemas.EndorsementCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Request a modification to an active policy (endorsement).
    Admin is notified by email.
    """
    up = (
        db.query(models.UserPolicy)
        .options(joinedload(models.UserPolicy.policy))
        .filter(
            models.UserPolicy.id == user_policy_id,
            models.UserPolicy.user_id == current_user.id,
        )
        .first()
    )
    if not up:
        raise HTTPException(status_code=404, detail="Enrolled policy not found")
    if up.status != "active":
        raise HTTPException(status_code=400, detail="Endorsements can only be requested for active policies")

    endorsement = models.PolicyEndorsement(
        user_policy_id=user_policy_id,
        request_type=body.request_type,
        details=body.details,
        status="pending",
    )
    db.add(endorsement)
    db.commit()
    db.refresh(endorsement)

    # Notify admin (admin email from env or default)
    admin_email = os.getenv("ADMIN_EMAIL", "admin@covermate.com")
    dispatch_email(
        admin_email,
        f"📝 Endorsement Request — {up.policy_number}",
        f"Policy: {up.policy.title if up.policy else up.policy_number}\n"
        f"Holder: {current_user.name} ({current_user.email})\n"
        f"Request Type: {body.request_type}\n"
        f"Details: {body.details}\n\nPlease review in the Admin Dashboard.",
    )

    return endorsement


# ─────────────────── LIST ENDORSEMENTS ───────────────────
@router.get("/user-policies/{user_policy_id}/endorsements", response_model=List[schemas.EndorsementResponse])
def list_endorsements(
    user_policy_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """List all endorsement requests for one of the user's enrolled policies."""
    up = db.query(models.UserPolicy).filter(
        models.UserPolicy.id == user_policy_id,
        models.UserPolicy.user_id == current_user.id,
    ).first()
    if not up:
        raise HTTPException(status_code=404, detail="Enrolled policy not found")

    return (
        db.query(models.PolicyEndorsement)
        .filter(models.PolicyEndorsement.user_policy_id == user_policy_id)
        .order_by(models.PolicyEndorsement.created_at.desc())
        .all()
    )
