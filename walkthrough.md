# CoverMate — Full Completion Walkthrough

## What Was Implemented

### Backend
| File | Change |
|------|--------|
| `app/fraud_engine.py` | NEW — 3-rule fraud engine |
| `app/schemas.py` | Added `FraudFlagResponse`, wired into `ClaimResponse` |
| `app/routes/claims_routes.py` | Auto-runs fraud engine on claim submit |
| `app/routes/admin_routes.py` | Added dashboard stats, fraud flags list, CSV export |

### Frontend
| File | Change |
|------|--------|
| `src/services/adminService.js` | NEW — admin API wrappers |
| `src/pages/AdminDashboard.jsx` | NEW — 7 stat cards + recent claims |
| `src/pages/AdminClaims.jsx` | NEW — claims table + status actions + CSV export |
| `src/pages/AdminFraudFlags.jsx` | NEW — fraud flags with severity/rule filters |
| `src/App.jsx` | Added `AdminRoute` guard + 3 admin routes |
| `src/components/Navbar.jsx` | Admin section in dropdown (role-based visibility) |

---

## Fraud Detection Engine

Three rules run **automatically** when a claim is submitted:

| Rule Code | Trigger | Severity |
|-----------|---------|----------|
| `DUP_DOC` | Same document file uploaded on another claim | 🔴 High |
| `SUSPICIOUS_TIMING` | Incident date within 2 days of policy start | 🟡 Medium |
| `HIGH_AMOUNT` | Claimed amount exceeds policy coverage max | 🟡 Medium |

---

## Screenshots

### Admin Dropdown – Role-based Navigation
![Admin dropdown with Admin Dashboard, All Claims, Fraud Flags links](C:\Users\adity\.gemini\antigravity\brain\6f72f67b-8b30-4d29-879c-4bcd4532e19e\admin_dropdown_open_1774377741058.png)

### Admin Dashboard – Stats + Recent Claims
![Admin Dashboard showing 7 stat cards and recent claims table](C:\Users\adity\.gemini\antigravity\brain\6f72f67b-8b30-4d29-879c-4bcd4532e19e\admin_dashboard_main_1774377763062.png)

### Admin Claims – Full Management
![Admin Claims page with filter bar, status action buttons, and CSV export](C:\Users\adity\.gemini\antigravity\brain\6f72f67b-8b30-4d29-879c-4bcd4532e19e\admin_claims_list_1774377780104.png)

---

## Admin Credentials

| Field | Value |
|-------|-------|
| Email | `admin@covermate.com` |
| Password | `admin123` |
| Role | `admin` (promoted in DB) |

---

## New API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/dashboard` | Stats: total, flagged, approved, rejected, paid, pending, total flags |
| GET | `/admin/fraud-flags` | All fraud flags (newest first) |
| GET | `/admin/claims/export` | Download all claims as CSV |
| GET | `/admin/claims` | All claims with fraud_flags eager-loaded |

## End-to-End Flow

```
User files claim (draft)
  → Uploads documents
  → Submits claim
  ↓
Fraud Engine runs 3 rules automatically
  → DUP_DOC: checks doc file_url across all claims
  → SUSPICIOUS_TIMING: incident_date vs policy start_date
  → HIGH_AMOUNT: amount_claimed vs coverage["max"]
  ↓
FraudFlag records created in DB
  ↓
Admin reviews via /admin/fraud-flags
  → Updates claim status via /admin/claims
  → Email notification sent (Celery/Redis pipeline)
  ↓
Admin downloads report: /admin/claims/export (CSV)
```
