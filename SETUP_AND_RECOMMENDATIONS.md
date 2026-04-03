# CoverMate Setup, Wiring, and Policy Recommendations

## 1) Environment Files

Backend `.env` (`covermate-backend/.env`):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/covermate_db
SECRET_KEY=change-me-to-a-long-random-secret
CORS_ORIGINS=http://localhost:5173
POSTGRES_ADMIN_DB=postgres
```

Frontend `.env` (`covermate-frontend/.env`):

```env
VITE_API_URL=http://localhost:8001
```

## 2) Create Database

From `covermate-backend`:

```powershell
python scripts/create_database.py
```

This creates the database from `DATABASE_URL` if it does not already exist.

## 3) Full Wiring Check

1. Backend reads DB and CORS from `covermate-backend/.env` via `app/config.py`.
2. Frontend reads API base URL from `VITE_API_URL` via `src/services/api.js`.
3. Admin CSV export and policy PDF open actions now use the same centralized `API_URL` setting.
4. All API routes are wired through Axios base URL, so changing one env var updates all frontend API calls.

## 4) Recommended Operational Policies

1. Secret management policy:
Keep real credentials only in local/prod environment stores, never in source control.

2. Environment parity policy:
Use `.env.example` as the canonical contract and keep all required vars documented there.

3. API endpoint policy:
Never hardcode backend URLs in components; consume only `API_URL` from `src/services/api.js`.

4. CORS policy:
Allow only known frontend origins in `CORS_ORIGINS`; avoid wildcard origins in production.

5. Database migration policy:
Introduce Alembic migrations before schema changes instead of relying only on `create_all`.

## 5) Recommendation Policy (Business Logic)

The recommendation engine already scores policies with 7 dimensions (coverage, budget, smoker impact, age-term fit, age-type fit, dependents impact, deductible match). For safer recommendations:

1. Keep profile-first recommendations:
Require completed risk profile before generating recommendations.

2. Add explainability policy:
Always return short reasons for each recommended policy (already implemented).

3. Add fairness guardrails:
Run periodic checks to ensure no policy type is systematically suppressed for valid user profiles.
