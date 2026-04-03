# Covermate – Insurance Comparison, Recommendation & Claim Assistant

A full‑stack web application that helps users compare insurance policies, receive personalized recommendations, file claims with document uploads, track claim status, and allows admins to detect fraud via rules‑based analytics.

## 🚀 Features

- **Policy Catalog** – Browse, filter, and compare policies (auto, health, life, home, travel) with premium calculators.
- **Personalized Recommendations** – Multi‑step preference wizard captures user risk profile and lifestyle; scoring algorithm suggests the most suitable policies with explanations.
- **Claim Filing Wizard** – Step‑by‑step process: select policy, incident details, upload documents, review, submit.
- **Claim Status Tracking** – Real‑time status updates (draft → submitted → under_review → approved/rejected/paid).
- **Email Notifications** – Asynchronous email alerts using Celery + Redis when claim status changes.
- **Admin Dashboard** – Overview of claims, fraud flags, status filters, search, and CSV export.
- **Fraud Detection** – Automatic rules‑based engine flags duplicate documents, early claims, large amounts, same‑day submits, short descriptions, and new‑user large claims.
- **Secure Authentication** – JWT‑based login/registration.

## 🛠️ Tech Stack

| Layer          | Technologies                                                                |
|----------------|-----------------------------------------------------------------------------|
| Frontend       | React.js, Tailwind CSS, React Router, Axios                                 |
| Backend        | FastAPI (Python), SQLAlchemy, Pydantic, JWT                                 |
| Database       | PostgreSQL                                                                  |
| Task Queue     | Celery, Redis                                                               |
| File Storage   | Local filesystem (ready for AWS S3)                                         |
| Email          | SMTP (Gmail / any provider)                                                 |

## 📁 Project Structure

```
Covermate_App/
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI (PremiumCalculator, ClaimWizard, etc.)
│   │   ├── pages/           # Policies, Login, Register, MyPolicies, MyClaims, AdminDashboard
│   │   ├── api.js           # Axios instance with JWT interceptor
│   │   └── App.jsx          # Routing and layout
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── routers/         # auth, policies, recommendations, claims, admin
│   │   ├── core/            # recommendation_engine, fraud.py
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── database.py      # DB connection
│   │   ├── auth.py          # JWT helpers
│   │   ├── celery_worker.py # Celery app and email task
│   │   └── main.py          # FastAPI entry point
│   ├── uploads/             # Locally stored claim documents
│   ├── requirements.txt
│   └── .env
└── README.md
```

## 🔧 Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL
- Redis (for Celery)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/covermate.git
   cd covermate/backend
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate      # Linux/Mac
   venv\Scripts\activate          # Windows
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables** – Create a `.env` file:
   ```
   DATABASE_URL=postgresql://user:password@localhost/covermate_db
   SECRET_KEY=your-secret-key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REDIS_URL=redis://localhost:6379/0
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   FROM_EMAIL=your-email@gmail.com
   ADMIN_EMAIL=admin@example.com
   ```

5. **Run database migrations** – SQLAlchemy creates tables automatically. For schema updates, drop and recreate tables (development) or use Alembic.

6. **Start the FastAPI server**
   ```bash
   uvicorn app.main:app --reload
   ```

7. **Start Redis** (on Windows use WSL or Memurai)
   ```bash
   sudo service redis-server start   # Linux/WSL
   ```

8. **Start Celery worker** (in a separate terminal)
   ```bash
   celery -A celery_worker worker --loglevel=info --pool=solo
   ```

### Frontend Setup

1. **Navigate to frontend folder**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

## 🧪 Testing the Application

### 1. Register / Login
- Create a new user account.
- To become admin, set `ADMIN_EMAIL` in `.env` and register with that email.

### 2. Browse Policies
- Use filters (policy type, provider, price range).
- Click "Details" to see the premium calculator and buy a policy.

### 3. Personalized Recommendations
- Click "Recommendations" in the nav bar.
- Complete the preference wizard. The system will show top‑scored policies with explanations.

### 4. File a Claim
- Buy a policy first.
- Go to **My Policies** → **File Claim**.
- Follow the 5‑step wizard (incident details, upload documents, review, submit).
- After submission, the claim status becomes `submitted` and fraud checks run automatically.

### 5. Admin Dashboard
- Log in with the admin email.
- Visit `/admin` to see statistics, all claims, fraud flags, and CSV export.
- Click the fraud alert badge to view detailed rules triggered.

### 6. Fraud Detection
Fraud checks run automatically when a claim is submitted. The following rules are implemented:
- `DUP_DOC` – duplicate document across claims (high severity)
- `EARLY_CLAIM` – incident within 2 days of policy start (medium)
- `HIGH_AMOUNT` – claim exceeds coverage max (medium)
- `SAME_DAY_SUBMIT` – created and submitted on same day with high amount (low)
- `SHORT_DESCRIPTION` – description < 20 chars (low)
- `NEW_USER_LARGE` – account < 7 days and claim > 50% of coverage (medium)

## 📚 Milestone Completion

| Milestone | Weeks | Achievements                                                             |
|-----------|-------|--------------------------------------------------------------------------|
| 1 | 1‑2 | User auth, policy catalog, compare UI, calculators                                 |
| 2 | 3‑4 | Preference wizard, scoring engine, recommendations table, explainable AI           |
| 3 | 5‑6 | Claim wizard, document upload (local), status tracking, Celery email notifications |
| 4 | 7‑8 | Fraud rules engine, admin dashboard, fraud flags, CSV export                       |

## 🤝 Contributing

This project was developed as part of the Infosys Springboard 6.0 internship. For any issues or feature requests, please open an issue on the repository.

## 📄 License

This project is for educational purposes only.
