# Insurance Comparison, Recommendation & Claim Assistant

An AI-powered full-stack web application designed to help users compare policies, get tailored recommendations, manage preferences, and get instant guidance on filing claims.

## Tech Stack
* **Frontend**: React (Vite), TailwindCSS, React Router, Axios
* **Backend**: Python (FastAPI), SQLAlchemy, Passlib (bcrypt), python-jose
* **Database**: SQLite (can be swapped seamlessly for PostgreSQL via SQLAlchemy URL)

## Features Included
1. **User Authentication**: Secure JWT-based Login and Signup.
2. **Dashboard**: Manage user preferences (Health status, Vehicle Type, Family size, Budget) and view a history of your claims.
3. **AI Recommendations**: A rule-based recommendation engine that suggests Policies tailored exactly to user profiles with percentage match scores.
4. **Insurance Comparison**: View all policies and filter by category (Auto, Health, Life, Home).
5. **Admin Panel**: Add, View, and Delete policies dynamically. View all registered users.
6. **AI Chatbot Interface**: A floating assistant providing guidance on claim documents, steps, and statuses.

---

## Setup & Run Instructions

### 1. Start the Backend API
Navigate to the `backend` folder and activate the environment:
```bash
cd insurance-app/backend
.\venv3\Scripts\Activate.ps1
```

Install requirements (if not done yet) and start the server:
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```
The Backend API will run on **http://localhost:8000**.
Swagger API Documentation is available at **http://localhost:8000/docs**.

### 2. Start the Frontend React App
Open a new terminal, navigate to the `frontend` folder:
```bash
cd insurance-app/frontend
npm install
npm run dev
```
The Frontend UI will be served typically at **http://localhost:3000** or **http://localhost:3001**. 

---

## Database Schema Documentation

The system uses SQLAlchemy ORM. The key tables include:
- **`users`**: `id`, `email`, `full_name`, `hashed_password`, `is_admin`, `created_at`
- **`user_preferences`**: `id`, `user_id` (FK), `age`, `annual_income`, `family_size`, `health_status`, `vehicle_type`, `preferred_coverage`, `max_monthly_budget`, `risk_tolerance`
- **`providers`**: `id`, `name`, `rating`, `description`
- **`policies`**: `id`, `provider_id` (FK), `name`, `type`, `coverage_amount`, `premium_monthly`, `deductible`, `description`
- **`recommendations`**: `id`, `user_id` (FK), `policy_id` (FK), `score`, `reason`
- **`claims`**: `id`, `user_id` (FK), `policy_id` (FK), `claim_type`, `claim_amount`, `description`, `status`, `documents`, `filed_date`, `admin_notes`

---
## Default Seed Data Warning
*If you run `python seed_data.py`, it will pre-load sample Providers and Policies into the database so you can test recommendations immediately.*
