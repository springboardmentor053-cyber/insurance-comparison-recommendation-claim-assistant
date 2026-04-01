# 🛡️ Insurance Assistant: Premium AI-Driven Coverage Suite

> **The Smarter Way to Secure Your Future.**
>
> An AI-powered full-stack web application designed to revolutionize the insurance experience. Compare policies, receive neural-match recommendations, and manage claims with an elegant, premium interface.

---

## ✨ Premium Suite Features

### 🎨 State-of-the-Art UX/UI
- **Glassmorphic Design:** A modern, sleek aesthetic utilizing soft blurs, vibrant gradients, and premium shadows.
- **Micro-Animations:** Fluid transitions and interactive elements that provide a responsive, high-end feel.
- **Adaptive Layouts:** Optimized for all screen sizes with a focus on SaaS-style clarity.

### 🤖 Intelligent AI Ecosystem
- **Neural Recommendation Engine:** Analyzes user profiles (health, risk, budget) to suggest optimized policy matches with precise compatibility scores.
- **AI Claims Assistant:** A sophisticated floating chatbot that guides users through document submission and eligibility checks in real-time.

### 💼 Comprehensive Management
- **User Dashboard:** Centralized SaaS-like interface for managing coverage preferences and tracking claim statuses.
- **Admin Control Center:** Professional oversight panel to manage policy inventories, monitor user base, and oversee system health.
- **Policy Comparison:** High-quality grid view for side-by-side comparison of Auto, Health, Life, and Home policies.

---

## 🛠️ Technical Architecture

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React (Vite), TailwindCSS, React Router, Axios, Glassmorphism CSS |
| **Backend** | Python (FastAPI), SQLAlchemy (ORM), Passlib (Bcrypt), JWT Security |
| **Database** | SQLite (Production-ready abstraction via SQLAlchemy) |
| **Styling** | Custom Premium Design System (Inter & Outfit Typefaces) |

### Project Directory Structure
```
├── insurance-app/
│   ├── backend/          # FastAPI Server, Database Models, Neural Logic
│   │   ├── main.py       # Main Entry Point & API Endpoints
│   │   ├── database.py   # SQLAlchemy Configuration
│   │   └── models.py     # Database Schema
│   └── frontend/         # React Application (Vite + Tailwind)
│       ├── src/
│       │   ├── components/ # Shared UI & Chatbot
│       │   ├── pages/      # Home, Dashboard, Admin, Policies
│       │   └── index.css   # Core Premium Design System
```

---

## 🚀 Quick Start Guide

### 1. Initialize Backend
Navigate to the backend directory and activate your virtual environment:
```powershell
cd insurance-app/backend
.\venv3\Scripts\Activate.ps1
```
Install dependencies and launch the server:
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```
*API will be live at: `http://localhost:8000`*

### 2. Launch Frontend
Open a new terminal and navigate to the frontend directory:
```bash
cd insurance-app/frontend
npm install
npm run dev
```
*UI will be served at: `http://localhost:3000`*

---

## 📊 Database Design
The system leverages **SQLAlchemy ORM** for robust data management:
- **`users`**: Secure credential management & roles.
- **`user_preferences`**: Comprehensive profiling (age, income, health, budget).
- **`policies`**: Multi-category coverage definitions.
- **`recommendations`**: Neural-engine output & match logic reasons.
- **`claims`**: Integrated incident reporting & status tracking.

---

## 📚 API Documentation
The backend automatically generates interactive documentation:
- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Redoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---
*Created with focus on Excellence & User Experience.*
