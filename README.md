# 🛡️ CoverMate – Insurance Comparison, Recommendation & Claim Assistant

CoverMate is a full-stack application that lets users **compare insurance policies**, get **personalized recommendations**, and **manage claims** — all in one place. Admins can monitor risk via **fraud detection** rules and analytics dashboards.

> **Current Status:** Module A (Auth, Profile & Preferences) ,Module B(Policy Comparison) , C(Recommendation Engine) and D(Claims(filling,doxuments and tracking) is complete — **backend + frontend**.

---

## 📑 Table of Contents
1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Project Structure](#-project-structure)
4. [How Each File Works](#-how-each-file-works)
5. [Database Schema](#-database-schema)
6. [Setup Guide](#-setup-guide)
7. [Running the Server](#-running-the-server)
8. [Seeding Sample Data](#-seeding-sample-data)
9. [API Endpoints Reference](#-api-endpoints-reference)
10. [Module Breakdown](#-module-breakdown)
11. [Glossary for Beginners](#-glossary-for-beginners)

---

## 🏗️ Project Overview

### What does CoverMate do?
Imagine you want to buy health insurance. You visit 5 different insurer websites, compare plans, fill out your details on each one, and try to figure out which is best for you. **CoverMate automates all of this:**

1. **Browse & Compare** policies from multiple insurance providers side-by-side.
2. **Get Recommendations** based on your age, income, family situation, etc.
3. **File Claims** when you need to — upload documents, track status.
4. **Fraud Detection** (admin side) – auto-flags suspicious claims.

### Architecture (simplified)
```
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  React.js    │  HTTP   │  FastAPI     │  SQL    │  PostgreSQL  │
│  Frontend    │◄──────►│  Backend     │◄──────►│  Database    │
│  (Tailwind)  │  JSON   │  (Python)    │        │              │
└──────────────┘        └──────────────┘        └──────────────┘
```

---

## 🛠️ Tech Stack

| Layer          | Technology          | Why?                                                |
|----------------|---------------------|-----------------------------------------------------|
| **Backend**    | FastAPI (Python)    | Fast, modern, auto-generates API docs               |
| **Database**   | PostgreSQL          | Robust relational DB, supports JSONB for flexible data |
| **ORM**        | SQLAlchemy          | Lets you write Python classes instead of raw SQL     |
| **Auth**       | JWT (python-jose)   | Stateless authentication with access + refresh tokens |
| **Passwords**  | bcrypt (passlib)    | Industry-standard password hashing                   |
| **Frontend**   | React.js + Tailwind | Modern, responsive UI with glassmorphism dark theme   |

---

## 📂 Project Structure

```
covermate-backend/
├── .env                        # Environment variables (DB URL, secrets)
├── requirements.txt            # Python package dependencies
├── seed.py                     # Script to insert sample data
└── app/
    ├── main.py                 # ⭐ App entry point – creates FastAPI, adds CORS, includes routers
    ├── config.py               # Reads environment variables
    ├── database.py             # SQLAlchemy engine + session setup
    ├── models.py               # 📦 All database table definitions (9 models)
    ├── schemas.py              # 📋 Pydantic request/response validation
    ├── auth.py                 # 🔐 Password hashing + JWT token functions
    ├── deps.py                 # 🔗 Dependency injection (get_current_user, etc.)
    ├── tasks.py                #Handles email notifications
    ├── celery_app.py           #email 
    └── routes/
        ├── __init__.py
        ├── auth_routes.py      # 🔑 /auth/* endpoints
        ├── profile_routes.py   # 👤 /profile/* endpoints
        ├── admin_routes.py
        ├── claims_routes.py
        ├── policy_routes.py
        └── recommendation_routes.py
         

covermate-frontend/
├── index.html                  # SEO meta, Inter font
├── vite.config.js              # Vite + Tailwind CSS plugin
└── src/
    ├── main.jsx                # Entry point
    ├── index.css               # Tailwind + dark design system
    ├── App.jsx                 # Routing (BrowserRouter)
    ├── context/
    │   └── AuthContext.jsx     # Auth state, token management
    ├── services/
    │   ├── api.js              # Axios + auto-refresh interceptor
    │   ├── authService.js     # register, login, getMe, changePassword
    │   ├── policyService.js
    │   └── profileService.js   # Profile & risk profile CRUD
    ├── components/
    │   ├── Navbar.jsx        # Active-link nav, user avatar, logout
    │   └── ProtectedRoute.jsx   # Redirects unauthenticated users
    │   └── AdminRoute.jsx
    └── pages/
        ├── Login.jsx           # Email + password
        ├── Register.jsx        # Name, email, password, DOB
        ├── Dashboard.jsx       # Stats, quick actions, risk CTA
        ├── Profile.jsx        # Edit name/DOB, change password
        ├── AdminDashboard.jsx
        ├── FileClaim.jsx
        ├── MyClaims.jsx
        ├── MyPolicies.jsx
        ├── PremiumCalculator.jsx
        ├── Quote.jsx
        ├── Recommendations.jsx
        ├── Compare.jsx
        └── RiskProfile.jsx     # Age, income, smoker, dependents, policy prefs
```

---

## 🔍 How Each File Works

### `main.py` — The Entry Point
**What it does:** Creates the FastAPI application, sets up CORS (so the frontend can talk to the backend), creates all database tables, and wires up the route files.

**Flow when you run `uvicorn app.main:app`:**
1. Python imports this file.
2. `FastAPI()` creates the app object.
3. CORS middleware is added (security: limits which websites can call the API).
4. `Base.metadata.create_all()` creates PostgreSQL tables from models.
5. Route files are included → the endpoints become available.

---

### `config.py` — Configuration
**What it does:** Reads values from the `.env` file using `python-dotenv`. This keeps secrets (database password, JWT key) out of the code.

**Key variables:**
- `DATABASE_URL` → PostgreSQL connection string
- `SECRET_KEY` → Used to sign JWT tokens
- `CORS_ORIGINS` → Allowed frontend URLs

---

### `database.py` — Database Connection
**What it does:** Sets up the SQLAlchemy "engine" (connection to PostgreSQL) and creates a session factory.

**Key concepts:**
- **Engine** = the connection pool to PostgreSQL
- **Session** = a single conversation with the database (open → query → commit → close)
- **`get_db()`** = a FastAPI dependency that gives each request its own session and closes it when done

---

### `models.py` — Database Tables
**What it does:** Defines Python classes that map to PostgreSQL tables. Each class attribute = one column.

**Models defined:**
| Model | Table | Description |
|-------|-------|-------------|
| `User` | `users` | Registered users (with role: user/admin) |
| `Provider` | `providers` | Insurance companies (LIC, HDFC Ergo, etc.) |
| `Policy` | `policies` | Insurance products offered by providers |
| `UserPolicy` | `user_policies` | Policies purchased by users |
| `Claim` | `claims` | Insurance claims filed by users |
| `ClaimDocument` | `claim_documents` | Documents uploaded for claims |
| `Recommendation` | `recommendations` | AI-generated policy suggestions |
| `FraudFlag` | `fraud_flags` | Flagged suspicious claims |
| `AdminLog` | `admin_logs` | Audit trail of admin actions |

---

### `schemas.py` — Request/Response Validation
**What it does:** Defines Pydantic models that validate incoming JSON and shape outgoing responses.

**Why separate from models?**
- Models = database structure (what's stored)
- Schemas = API structure (what's sent/received)
- Example: `UserCreate` accepts a password, but `UserResponse` never returns it.

---

### `auth.py` — Authentication Utilities
**What it does:** Provides functions for password hashing and JWT token management.

**Functions:**
| Function | Purpose |
|----------|---------|
| `hash_password(pw)` | Converts plain text → bcrypt hash (for storage) |
| `verify_password(plain, hash)` | Checks if a password matches its hash |
| `create_access_token(data)` | Creates a 30-minute JWT (for API calls) |
| `create_refresh_token(data)` | Creates a 7-day JWT (for silent session renewal) |
| `verify_refresh_token(token)` | Validates a refresh token and returns its payload |

**How JWT works (simplified):**
```
1. User logs in with email + password
2. Server creates two tokens:
   - Access Token  (short-lived, 30 min) → used in every API call
   - Refresh Token (long-lived, 7 days) → used to get new access tokens
3. Client stores both tokens
4. On each API call, client sends:  Authorization: Bearer <access_token>
5. When access token expires, client sends refresh token to /auth/refresh
6. Server gives back new tokens — no need to re-enter password!
```

---

### `deps.py` — Dependencies
**What it does:** Provides reusable functions that FastAPI automatically calls before route handlers.

**Dependencies:**
- `get_current_user` → Decodes JWT from Authorization header, returns User object
- `get_current_admin` → Same, but also checks `role == "admin"`

---

### `routes/auth_routes.py` — Authentication Endpoints
All endpoints under `/auth/*`. Handles registration, login, token refresh, viewing current user, and password changes.

### `routes/profile_routes.py` — Profile Endpoints
All endpoints under `/profile/*`. Handles viewing/updating user profile and risk preferences.

---

## 🗄️ Database Schema

```
┌─────────┐     ┌──────────┐     ┌──────────┐
│  Users  │────►│UserPolicy│◄────│ Policies │
│         │     │          │     │          │
│ id (PK) │     │ id (PK)  │     │ id (PK)  │
│ name    │     │ user_id  │     │provider_id│──► Providers
│ email   │     │ policy_id│     │ type     │
│ password│     │ status   │     │ premium  │
│ role    │     └────┬─────┘     │ coverage │
│ dob     │          │           └──────────┘
│risk_prof│     ┌────▼─────┐
└────┬────┘     │  Claims  │
     │          │          │
     │          │ id (PK)  │──► ClaimDocuments
     │          │ status   │──► FraudFlags
     │          │ amount   │
     │          └──────────┘
     │
     ├──► Recommendations
     └──► AdminLogs
```

---

## 🚀 Setup Guide

### Prerequisites
- **Python 3.10+** installed
- **PostgreSQL** installed and running
- **Git** (optional, for cloning)

### Step 1: Create the PostgreSQL Database
Open a terminal or pgAdmin and run:
```sql
CREATE DATABASE covermate_db;
```

### Step 2: Set Up the Backend
```bash
# Navigate to the backend folder
cd covermate-backend

# Create a virtual environment (isolates project dependencies)
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install all required packages
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Edit the `.env` file in `covermate-backend/`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/covermate_db"
SECRET_KEY="your-secret-key-change-this-in-production"
CORS_ORIGINS="http://localhost:5173"
```

> **⚠️ Important:** Replace `YOUR_PASSWORD` with your actual PostgreSQL password. The `SECRET_KEY` should be a long random string in production.

---

## ▶️ Running the Application

### Terminal 1 — Backend
```bash
cd covermate-backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8001
```

### Terminal 2 — Frontend
```bash
cd covermate-frontend
npm run dev
```

Now visit:
- **Frontend App:** http://localhost:5173
- **API Health Check:** http://localhost:8001/
- **Interactive API Docs (Swagger):** http://localhost:8001/docs
- **Alternative API Docs (ReDoc):** http://localhost:8001/redoc

---

## 🌱 Seeding Sample Data

After the server has started at least once (so the tables are created):

```bash
cd covermate-backend
python seed.py
```

This inserts 3 insurance providers and 6 sample policies into the database.

---

## 📡 API Endpoints Reference

### Authentication (`/auth`)

| Method | Endpoint | Auth Required? | Description |
|--------|----------|----------------|-------------|
| `POST` | `/auth/register` | ❌ | Create a new account |
| `POST` | `/auth/login` | ❌ | Login and get tokens |
| `POST` | `/auth/refresh` | ❌ | Get new tokens using refresh token |
| `GET`  | `/auth/me` | ✅ | Get current user info |
| `PUT`  | `/auth/change-password` | ✅ | Change your password |

### Profile (`/profile`)

| Method | Endpoint | Auth Required? | Description |
|--------|----------|----------------|-------------|
| `GET`  | `/profile` | ✅ | Get your full profile |
| `PUT`  | `/profile` | ✅ | Update name / date of birth |
| `GET`  | `/profile/risk-profile` | ✅ | Get your risk preferences |
| `PUT`  | `/profile/risk-profile` | ✅ | Set your risk preferences |

### Example API Calls (using curl)

**Register:**
```bash
curl -X POST http://localhost:8001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Aditya","email":"aditya@example.com","password":"pass123","dob":"2000-01-15"}'
```

**Login:**
```bash
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aditya@example.com","password":"pass123"}'
```

**Get Profile (use the access_token from login):**
```bash
curl http://localhost:8001/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Update Risk Profile:**
```bash
curl -X PUT http://localhost:8001/profile/risk-profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"risk_profile":{"age_group":"20-25","smoker":false,"has_dependents":false,"preferred_types":["health","travel"]}}'
```

**Refresh Token:**
```bash
curl -X POST http://localhost:8001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"YOUR_REFRESH_TOKEN"}'
```

**Change Password:**
```bash
curl -X PUT http://localhost:8001/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"old_password":"pass123","new_password":"newpass456"}'
```

---

## 📦 Module Breakdown

| Module | Name | Status | Description |
|--------|------|--------|-------------|
| **A** | Auth, Profile & Preferences | ✅ Complete | User registration, JWT auth, profile management, risk preferences |
| **B** | Policy Catalog, Compare & Quote | ✅ Complete | Browse policies, side-by-side comparison, premium calculators |
| **C** | Recommendation Engine | ✅ Complete | Score policies based on user's risk profile |
| **D** | Claims (filing, documents, tracking) |  ✅ Complete | File claims, upload documents, track status |
| **E** | Fraud Rules & Admin Analytics | ✅ Complete | Auto-flag suspicious claims, admin dashboards |

### 8-Week Milestone Plan
| Weeks | Milestone | Key Deliverables |
|-------|-----------|-----------------|
| 1–2 | Foundations & Catalog | Auth, schema, seed policies, browse & compare UI |
| 3–4 | Recommendations | Collect preferences, score policies per user |
| 5–6 | Claims | Filing wizard, uploads (S3), status tracking, notifications |
| 7–8 | Fraud & Analytics | Fraud rules engine, admin dashboards, QA & deployment |

---
## 🚀 Milestone Progress

- **Milestone 1:** Authentication, profile, and risk preferences
- **Milestone 2:** Policy comparison and recommendation logic
- **Milestone 3:** Claims filling,document upload,and tracking system

## ✅ Features Implemented

- User Authentication (JWT)
- Profile & Risk Preference Management
- Policy Comparison UI
- Recommendation Engine based on user profile


## 📸 Application Screenshots

### Admin Claims Dashboard
Shows all claims and fraud flagged claims.




## 📸 Application Screenshots

### Admin Claims Dashboard
Shows all claims and fraud flagged claims.

![Admin Dashboard](images/admin_dashboard.png)

### Fraud Detection Alerts
Claims automatically flagged as suspicious.

![Fraud Flags](images/fraud_flags.png)

### Fraud Analytics
Admin analytics showing fraud statistics and risk indicators.

![Fraud Analytics](images/fraud_analytics.png)

### Claims Management
Admin reviewing claims and their status.

![Claims Review](images/claims_review.png)

---

### Fraud Detection Alerts
Claims automatically flagged as suspicious.

![Fraud Flags](images/fraud_flags.png)

### Fraud Analytics
Admin analytics showing fraud statistics and risk indicators.

![Fraud Analytics](images/fraud_analytics.png)

### Claims Management
Admin reviewing claims and their status.

![Claims Review](images/claims_review.png)

---

## 📖 Glossary for Beginners

| Term | Explanation |
|------|-------------|
| **FastAPI** | A Python web framework for building APIs quickly. It auto-generates documentation. |
| **API** | Application Programming Interface – a set of URLs (endpoints) that accept requests and return data. |
| **Endpoint** | A specific URL path (e.g. `/auth/login`) that does something when you send a request to it. |
| **JWT** | JSON Web Token – a signed string that proves who you are. Like a digital ID card. |
| **Access Token** | A short-lived JWT (30 min) sent with every API request in the `Authorization` header. |
| **Refresh Token** | A long-lived JWT (7 days) used to silently get a new access token when the old one expires. |
| **SQLAlchemy** | An ORM (Object-Relational Mapping) library. You write Python classes, it generates SQL. |
| **Pydantic** | A validation library. It checks that incoming JSON has the right fields and types. |
| **CORS** | Cross-Origin Resource Sharing – browser security that controls which websites can call your API. |
| **bcrypt** | A password hashing algorithm. Turns "password123" into an irreversible hash for safe storage. |
| **ORM** | Object-Relational Mapping – maps Python objects to database rows, so you don't write raw SQL. |
| **Dependency Injection** | FastAPI automatically calls a function (like `get_current_user`) and passes the result to your route. |
| **JSONB** | A PostgreSQL column type that stores flexible JSON objects (faster than TEXT for queries). |
| **Middleware** | Code that runs on every request before it reaches your route (e.g. CORS checks). |
| **Seed Data** | Sample/test data inserted into the database so you have something to work with during development. |

---




