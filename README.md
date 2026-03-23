
# 🛡️ Insurance Comparison, Recommendation & Claim Assistant

A full-stack web application that helps users **compare insurance policies**, get **AI-powered personalized recommendations** based on their risk profile, **file and track claims**, and receive **real-time email notifications** on claim status updates.

---

## 📌 About the Project

This platform was built to simplify the complex world of insurance for everyday users. Whether someone is looking for the right health, auto, home, life, or travel policy — this system analyses their personal profile and recommends the most suitable options.

**Key Highlights:**
- Users fill in a 12-factor risk profile (age, occupation, health, lifestyle, etc.)
- The recommendation engine scores and ranks all available policies
- Users can purchase policies and file claims with document uploads (stored on AWS S3)
- Admins review claims through a dedicated panel and update statuses
- Every status update triggers an automatic background email to the user via Celery + Redis

---

## ✨ Features

### 👤 User Features
| Feature | Description |
|---|---|
| Authentication | Secure JWT-based login and signup |
| Dashboard | Personalized policy recommendations with scores |
| Policy Catalog | Browse Health, Auto, Home, Life, Travel policies |
| Compare Policies | Compare up to 3 policies side-by-side |
| Premium Calculator | Estimate premium based on age and coverage |
| Risk Profile | 12-factor lifestyle and financial profile editor |
| My Policies | View all purchased policies |
| File a Claim | 5-step guided claim wizard with document uploads |
| Claim Timeline | Live status history for each claim |
| Email Alerts | Auto email when admin updates claim status |

### 🔑 Admin Features
| Feature | Description |
|---|---|
| Admin Dashboard | Stats on total claims, amounts, pending actions |
| Claims Queue | Filter, search, and review all claims |
| Claim Detail Panel | View full claim info, documents, and history |
| Status Transitions | Strict workflow: Submit → Review → Approve/Reject → Pay |
| Background Emails | FastAPI triggers a Celery task (non-blocking) to email the user |

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | PostgreSQL + SQLAlchemy |
| Auth | JWT (python-jose) |
| File Uploads | AWS S3 |
| Background Tasks | Celery + Redis |
| Email | Python smtplib (Gmail SMTP) |

---

## 🖥️ Prerequisites — Install These First

### 1. Git
- Download: https://git-scm.com/downloads
- Verify: `git --version`

### 2. Python 3.10+
- Download: https://www.python.org/downloads
- ⚠️ During install → check **"Add Python to PATH"**
- Verify: `python --version`

### 3. Node.js v18+
- Download: https://nodejs.org → choose **LTS**
- Verify: `node --version` and `npm --version`

### 4. PostgreSQL
- Download: https://www.postgresql.org/download/
- During install, set a password for the `postgres` user — **remember it**
- Default port: `5432`
- After install, open **pgAdmin** and create a database named: `insurance_db`

### 5. Docker Desktop (for Redis — required for email notifications)
- Download: https://www.docker.com/products/docker-desktop/
- Install and **open Docker Desktop** before running the app
- Verify: `docker --version`

---

## 📥 Step 1 — Clone the Repository

```powershell
git clone https://github.com/springboardmentor053-cyber/Insurance-Comparison-Recommendation-Claim-Assistant.git
cd Insurance-Comparison-Recommendation-Claim-Assistant
```

---

## ⚙️ Step 2 — Backend Setup

### 2.1 Go to the backend folder
```powershell
cd backend
```

### 2.2 Create and activate a virtual environment
```powershell
python -m venv venv
venv\Scripts\activate
```
You should see `(venv)` at the start of the terminal.

### 2.3 Install all Python dependencies
```powershell
pip install -r requirements.txt
```

### 2.4 Create the `.env` file

Inside the `backend/` folder, create a file named **`.env`** and paste the following — filling in your own values:

```env
# ─── App Security ──────────────────────
SECRET_KEY=your-random-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ─── PostgreSQL Database ───────────────
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_POSTGRES_PASSWORD
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_DB=insurance_db

# ─── AWS S3 (for document uploads) ─────
AWS_ACCESS_KEY_ID=YOUR_AWS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET
AWS_S3_BUCKET_NAME=YOUR_BUCKET_NAME
AWS_REGION=ap-south-1

# ─── Email / SMTP (Gmail) ──────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_16_char_gmail_app_password
EMAILS_FROM_EMAIL=your_email@gmail.com

# ─── Celery / Redis ────────────────────
REDIS_URL=redis://localhost:6379/0
```

> 📌 **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords. Generate one for this app.

> 📌 **AWS S3**: Create a bucket in AWS S3 and add the credentials. Used for storing claim documents.

### 2.5 Set up and seed the database
```powershell
python ../database/create_tables.py
python seed.py
```

### 2.6 Verify credentials are loading correctly (optional)
```powershell
python check_config.py
```
This prints all loaded settings so you can confirm everything is reading from `.env` properly.

---

## 🚀 Step 3 — Run the Full Backend (Single Command)

Make sure **Docker Desktop is open** first (for Redis), then run:

```powershell
.\start_backend.ps1
```

This script will automatically:
1. ✅ Check your `.env` file exists
2. ✅ Verify and print all credentials
3. ✅ Start Redis via Docker if not already running
4. ✅ Open a new terminal window with the Celery email worker
5. ✅ Start the FastAPI server with `uvicorn --reload`

> ⚠️ **First-time PowerShell users**: If you get a script execution error, run this first:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

✅ **Backend API**: http://localhost:8000  
✅ **API Docs (Swagger)**: http://localhost:8000/docs

---

## 🎨 Step 4 — Frontend Setup

Open a **new terminal window**:

```powershell
cd frontend
npm install
npm run dev
```

✅ **Frontend App**: http://localhost:5173

---

## 🔐 Step 5 — Login & Use the App

Open your browser and go to **http://localhost:5173**

| Role | Email | Password |
|---|---|---|
| User | `user@example.com` | `password` |
| Admin | `admin@example.com` | `password` |

Or click **Sign Up** to create a new account.

---

## 📋 Quick Reference

| Task | Command | Run in |
|---|---|---|
| Start full backend | `.\start_backend.ps1` | `backend/` |
| Start frontend | `npm run dev` | `frontend/` |
| Check .env config | `python check_config.py` | `backend/` |
| Start Celery only | `celery -A app.worker.celery_app worker --loglevel=info --pool=solo` | `backend/` |
| API docs | http://localhost:8000/docs | Browser |
| App URL | http://localhost:5173 | Browser |

---

## 📂 Project Structure

```
Insurance-Comparison-Recommendation-Claim-Assistant/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry point
│   │   ├── core/
│   │   │   ├── config.py            # Settings loaded from .env
│   │   │   └── celery_app.py        # Celery application setup
│   │   ├── models/                  # SQLAlchemy DB models
│   │   │   ├── user.py
│   │   │   ├── policy.py
│   │   │   ├── claim.py             # Includes ClaimStatusHistory
│   │   │   └── user_policy.py
│   │   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── crud/                    # Database CRUD operations
│   │   ├── services/
│   │   │   ├── recommendation_engine.py  # 12-factor scoring engine
│   │   │   ├── email_service.py     # SMTP email sender
│   │   │   └── s3_service.py        # AWS S3 file upload
│   │   └── api/v1/endpoints/        # All API route handlers
│   ├── worker.py                    # Celery background email task
│   ├── seed.py                      # Sample data seeder
│   ├── check_config.py              # .env verification helper
│   ├── start_backend.ps1            # One-command startup script
│   └── requirements.txt
│
├── database/
│   └── create_tables.py             # DB table creation
│
├── frontend/
│   ├── src/
│   │   ├── components/              # All React UI components
│   │   │   ├── Dashboard.jsx        # Recommendations + policies
│   │   │   ├── ClaimWizard.jsx      # 5-step claim filing flow
│   │   │   ├── MyClaims.jsx         # Claim list + timeline
│   │   │   ├── AdminClaims.jsx      # Admin review panel
│   │   │   ├── AdminDashboard.jsx   # Admin stats overview
│   │   │   ├── Profile.jsx          # User + risk profile editor
│   │   │   ├── PremiumCalculator.jsx
│   │   │   └── ComparePolicies.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # JWT auth management
│   │   └── App.jsx                  # Routing + layout
│   └── package.json
│
└── README.md
```

---

## 📧 How Email Notifications Work

```
Admin updates claim status
        ↓
FastAPI saves status to DB
        ↓
FastAPI calls .delay() → drops task into Redis
        ↓
Celery worker picks up task (background)
        ↓
Email sent to user's registered email
```

> ✅ The FastAPI server is never blocked. The email always sends in the background.

---

## 🔄 Claim Status Lifecycle

```
draft → submitted → under_review → approved → paid
                         ↓
                      rejected
```

Each transition is strictly enforced. Admins cannot skip steps — e.g., you cannot approve a claim that hasn't been reviewed first.

---

## ⚠️ Important Notes

- **Never commit your `.env` file** — it contains database passwords and API keys. It is already in `.gitignore`.
- **Docker Desktop must be open** before running `start_backend.ps1` for Redis to work.
- If you don't have AWS S3, document uploads will not work but the rest of the app functions normally.
