# CoverMate — Insurance Comparison, Recommendation & Claim Assistant

CoverMate is a full-stack web application that allows users to compare insurance policies, get personalized recommendations, file and track claims, and enables administrators to manage the entire claims lifecycle with fraud detection and analytics.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js |
| Backend | FastAPI (Python) |
| Database | PostgreSQL |
| Authentication | JWT (JSON Web Tokens) |
| Task Queue | Celery + Redis |
| File Storage | Local Storage (S3-ready) |

---

## Features

### Module A — Authentication & User Profile
- User registration with auto risk profile calculation (Low / Medium / High) based on annual income
- Secure login with JWT authentication
- Profile page with avatar initials and risk badge
- Separate Admin Portal with dark-themed login page

### Module B — Policy Catalog, Compare & Calculator
- Browse 21+ insurance policies across 5 types — Health, Life, Auto, Travel, Home
- Filter policies by type
- Compare any 2 policies side by side with Best Value detection
- Premium Calculator on each policy card — calculates based on age and smoker status

### Module C — Recommendation Engine
- Risk-based recommendations using user's income and risk profile
- Smart recommendation engine using age, family size, budget, and health status
- Match percentage with reasoning for each recommended policy

### Module D — Claims Filing, Documents & Tracking
- 4-step claim filing wizard — Claim Type → Incident Details → Document Upload → Review & Submit
- Auto-save as draft at every step — resumes where user left off
- One draft per policy rule — professional industry standard
- Document upload with file validation (JPG, PNG, PDF — max 10MB)
- View and delete documents before submission
- Submission blocked without at least one document
- Claim status tracking — Submitted → Under Review → Approved → Paid / Rejected
- Timeline view showing every status change with exact date and time
- Email notifications via Celery + Redis when admin updates claim status

### Module E — Admin Dashboard, Fraud Detection & Analytics
- Separate Admin Portal — completely isolated from user interface
- Analytics cards — Total Claims, Pending, Approved, Rejected, Paid, Fraud Flagged, Total Users, Total Amount
- Claims management table with status update controls
- Valid status transitions enforced — Submitted → Under Review → Approved/Rejected → Paid
- Fraud Detection Rules:
  - Duplicate claim on same policy within 30 days (HIGH severity)
  - Claimed amount exceeds 3x policy premium (MEDIUM severity)
  - Future incident date detected (HIGH severity)
- Export all claims data as CSV file
- Responsive UI with hamburger menu for mobile devices

---

## Project Structure

```
Insurance-Comparison-Recommendation-Claim-Assistant/
│
├── covermate-backend/          # FastAPI Backend
│   ├── app/
│   │   ├── models/             # SQLAlchemy DB models
│   │   ├── routers/            # API route handlers
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── utils/              # Hashing, JWT, File handler
│   │   ├── database.py         # DB connection
│   │   └── main.py             # FastAPI app entry point
│   ├── celery_worker.py        # Celery + Redis email tasks
│   ├── uploads/                # Uploaded claim documents
│   └── .env                    # Environment variables (not committed)
│
├── covermate-frontend/         # React Frontend
│   └── covermate-frontend/
│       ├── src/
│       │   ├── pages/          # All page components
│       │   ├── components/     # Navbar
│       │   └── styles/         # CSS files
│       └── public/
│
├── screenshots/                # Project screenshots milestone-wise
│   ├── milestone1/
│   ├── milestone2/
│   ├── milestone3/
│   └── milestone4/
│
└── start.bat                   # One-click startup script (Windows)
```

---

## Database Schema

| Table | Description |
|-------|-------------|
| users | User accounts with risk profile and admin flag |
| providers | Insurance providers |
| policies | Insurance policy catalog |
| user_policies | Purchased policies per user |
| claims | Filed claims with status |
| claim_documents | Uploaded supporting documents |
| claim_status_history | Complete audit trail of status changes |
| recommendations | Generated policy recommendations |

---

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL
- WSL (Ubuntu) for Redis on Windows

### Backend Setup

```bash
# 1. Navigate to backend folder
cd covermate-backend

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env file
GMAIL_ADDRESS=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_app_password

# 5. Create PostgreSQL database
# Database name: covermate_db

# 6. Run backend
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
# 1. Navigate to frontend folder
cd covermate-frontend/covermate-frontend

# 2. Install dependencies
npm install

# 3. Run frontend
npm run dev
```

### Redis & Celery Setup (Windows)

```bash
# Terminal 1 — Start Redis in WSL
wsl -d Ubuntu

# Terminal 2 — Start Celery worker (venv active)
celery -A celery_worker worker --loglevel=info --pool=solo
```

### Quick Start (Windows)

Double-click `start.bat` in the project root — starts all 4 services automatically.

---

## Running the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Admin Portal | http://localhost:5173/admin/login |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | User login |
| POST | /auth/admin-login | Admin login |
| GET | /auth/me | Get current user |
| GET | /policies | Get all policies |
| GET | /recommendations | Risk-based recommendations |
| POST | /recommendations/generate | Smart recommendations |
| POST | /user-policies/purchase/{id} | Purchase a policy |
| GET | /user-policies/my-policies | Get user's policies |
| POST | /claims/draft | Create/resume draft claim |
| PUT | /claims/{id}/draft | Update draft |
| PATCH | /claims/{id}/submit | Submit claim |
| POST | /claims/{id}/upload | Upload document |
| GET | /claims/my-claims | Get all user claims |
| GET | /claims/{id}/history | Get claim timeline |
| PUT | /admin/claims/{id}/status | Update claim status |
| GET | /admin/analytics | Dashboard analytics |
| GET | /admin/export/claims | Export claims as CSV |

---

## Milestone Plan

| Milestone | Weeks | Description |
|-----------|-------|-------------|
| 1 | 1-2 | Auth, Policy Catalog, Compare, Calculator |
| 2 | 3-4 | Recommendation Engine |
| 3 | 5-6 | Claims Filing, Documents, Status Tracking, Email Notifications |
| 4 | 7-8 | Admin Dashboard, Fraud Detection, CSV Export, Responsive UI |

---

## Team

Project developed as part of the Springboard Internship Program.

---

*CoverMate — Making insurance simple, transparent, and accessible.*