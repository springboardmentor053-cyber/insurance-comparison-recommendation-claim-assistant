
# Insurance Comparison & Recommendation System

A full-stack web application built with **FastAPI (Backend)** and **React (Frontend)** to compare insurance policies and provide recommendations based on user risk profiles.

## 🚀 Features
- **User Authentication**: Secure Login/Signup with JWT.
- **Dynamic Policy Catalog**: Browse Health, Auto, Home, Life, and Travel policies.
- **Policy Comparison**: Compare up to 3 policies side-by-side with "Best Value" highlighting.
- **Premium Calculator**: Estimate premiums based on age and coverage amount.
- **Admin Dashboard**: Manage users and policies (Backend API).

---

## 🛠️ Prerequisites
Ensure you have the following installed on your system:
1.  **Python 3.8+** (for the backend)
2.  **Node.js 16+** (for the frontend)
3.  **Git** (to clone the repository)

---

## ⚙️ How to Run the Project

### 1. Clone the Repository
```bash
git clone <repository_url>
cd Insurance_Comparison_Recommendation
```

### 2. Backend Setup (FastAPI)
Navigate to the backend folder and set up the Python environment.

```bash
# 1. Navigate to backend
cd backend

# 2. Create a virtual environment
python -m venv venv

# 3. Activate the virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Initialize the Database & Seed Data
# This will create the SQLite database and add sample policies/users.
# Note: Ensure you are in the 'backend' folder
python seed.py

# 6. Run the Backend Server
# The server will start at http://localhost:8000
uvicorn app.main:app --reload
```
**Backend URLs:**
*   API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
*   API ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 3. Frontend Setup (React + Vite)
Open a **new terminal** (keep the backend running) and navigate to the frontend folder.

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install Node modules
npm install

# 3. Start the Development Server
npm run dev
```
**Frontend URL:**
*   App: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testing the App

1.  **Register:** Go to `http://localhost:5173/signup` and create a new account.
2.  **Login:** Log in with your new credentials.
3.  **Dashboard:** You will see a list of recommended policies.
4.  **Compare:** Select 2 or 3 policies of the same type and click **Compare**.
    *   *Look for the "Best Value" badge!*
5.  **Calculator:** Try the Premium Calculator to see dynamic pricing.

---

## 📂 Project Structure

```
Active_Insurance_Comparison/
├── backend/                # FastAPI Application
│   ├── app/
│   │   ├── main.py         # App Entry Point
│   │   ├── models/         # Database Models
│   │   ├── schemas/        # Pydantic Schemas
│   │   └── api/            # API Routes
│   ├── requirements.txt    # Python Dependencies
│   └── seed.py             # Data Seeding Script
│
└── frontend/               # React Application
    ├── src/
    │   ├── components/     # Reusable UI Components
    │   ├── context/        # Auth Context
    │   └── App.jsx         # Main App Component
    └── package.json        # Node Dependencies
```
