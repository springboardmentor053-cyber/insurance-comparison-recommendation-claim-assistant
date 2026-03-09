
# Insurance Comparison, Recommendation & Claim Assistant

A full-stack web application built with **FastAPI (Backend)** and **React (Frontend)** to compare insurance policies and provide AI-powered personalized recommendations based on user risk profiles.

## 🚀 Features
- **User Authentication**: Secure Login/Signup with JWT.
- **Dynamic Policy Catalog**: Browse Health, Auto, Home, Life, and Travel policies.
- **Policy Comparison**: Compare up to 3 policies side-by-side with "Best Match for You" highlighting.
- **AI Recommendation Engine**: Personalized policy recommendations based on 12+ risk factors.
- **Risk Profile Management**: Fill in lifestyle, financial, and health details for better matches.
- **Premium Calculator**: Estimate premiums based on age and coverage amount.
- **Precomputed Recommendations**: Fast retrieval using cached recommendation results.

---

## 🖥️ Step 1 — Install Required Software

### 1.1 Git
- Download from: **https://git-scm.com/downloads**
- Install with default options
- Verify: open Command Prompt → type `git --version`

### 1.2 Python (3.10 or higher)
- Download from: **https://www.python.org/downloads**
- ⚠️ During install → check **"Add Python to PATH"**
- Verify: `python --version`

### 1.3 Node.js (v18 or higher)
- Download from: **https://nodejs.org** → choose **LTS version**
- Verify: `node --version` and `npm --version`

### 1.4 PostgreSQL
- Download from: **https://www.postgresql.org/download/**
- During install, set a password for the `postgres` user — **remember this password**
- Default port: `5432`
- After install, open **pgAdmin** (comes with PostgreSQL) and create a new database:
  - Right-click **Databases** → **Create** → **Database**
  - Name it: `insurance_db`

---

## 📥 Step 2 — Clone the Repository

Open Command Prompt or PowerShell:

```powershell
git clone -b teamc_charan https://github.com/springboardmentor053-cyber/Insurance-Comparison-Recommendation-Claim-Assistant.git
```

```powershell
cd Insurance-Comparison-Recommendation-Claim-Assistant
```

---

## ⚙️ Step 3 — Backend Setup

### 3.1 Go into backend folder
```powershell
cd backend
```

### 3.2 Create a virtual environment
```powershell
python -m venv venv
```

### 3.3 Activate the virtual environment

**Windows:**
```powershell
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

You should see `(venv)` at the start of the terminal line.

### 3.4 Install Python dependencies
```powershell
pip install -r requirements.txt
```

### 3.5 Create the `.env` file

Inside the `backend/` folder, create a new file called **`.env`** and paste this:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/insurance_db
SECRET_KEY=your-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGIN=http://localhost:5173
```

> Replace `YOUR_PASSWORD` with the PostgreSQL password you set during install.

### 3.6 Create the database tables
```powershell
python ../database/create_tables.py
```

### 3.7 Seed the database with sample data
```powershell
python seed.py
```

### 3.8 Start the backend server
```powershell
uvicorn app.main:app --reload
```

✅ Backend runs at: **http://localhost:8000**
✅ API docs at: **http://localhost:8000/docs**

---

## 🎨 Step 4 — Frontend Setup

Open a **new terminal window** (keep backend running):

```powershell
cd Insurance-Comparison-Recommendation-Claim-Assistant\frontend
```

### 4.1 Install Node dependencies
```powershell
npm install
```

### 4.2 Start the frontend
```powershell
npm run dev
```

✅ Frontend runs at: **http://localhost:5173**

---

## 🚀 Step 5 — Open and Use the App

1. Open browser → go to **http://localhost:5173**
2. **Login** with seeded credentials:
   - Email: `user@example.com` | Password: `password`
   - Admin: `admin@example.com` | Password: `password`
3. OR click **Sign Up** to create a new account

---

## 📋 Quick Reference

| What | Command | Where to Run |
|---|---|---|
| Activate venv | `venv\Scripts\activate` | `backend/` |
| Start backend | `uvicorn app.main:app --reload` | `backend/` |
| Start frontend | `npm run dev` | `frontend/` |
| API docs | Open `http://localhost:8000/docs` | Browser |
| App | Open `http://localhost:5173` | Browser |

> ⚠️ **Both terminals must stay open** — one for backend, one for frontend.

---

## 📂 Project Structure

```
Insurance-Comparison-Recommendation-Claim-Assistant/
├── backend/                # FastAPI Application
│   ├── app/
│   │   ├── main.py         # App Entry Point
│   │   ├── models/         # Database Models (User, Policy, Recommendation)
│   │   ├── schemas/        # Pydantic Schemas
│   │   ├── crud/           # Database Operations
│   │   ├── services/       # Recommendation Engine
│   │   └── api/            # API Routes
│   ├── seed.py             # Sample Data Seeding Script
│   └── requirements.txt    # Python Dependencies
│
├── database/               # Database Utility Scripts
│   └── create_tables.py    # Table Creation Script
│
└── frontend/               # React Application
    ├── src/
    │   ├── components/     # UI Components (Dashboard, Compare, Profile...)
    │   ├── context/        # Auth Context (JWT Token Management)
    │   └── App.jsx         # Main App with Routing
    └── package.json        # Node Dependencies
```
