@echo off
echo Starting CoverMate Project...

:: Terminal 1 - Redis
start "Redis" cmd /k "wsl -d Ubuntu -e redis-server"

:: Wait for Redis to start
timeout /t 5 /nobreak

:: Terminal 2 - Backend
start "Backend" cmd /k "D:\covermate-backend\venv\Scripts\activate && cd C:\Insurance-Comparison-Recommendation-Claim-Assistant\covermate-backend && uvicorn app.main:app --reload"

:: Wait for backend
timeout /t 3 /nobreak

:: Terminal 3 - Celery
start "Celery" cmd /k "D:\covermate-backend\venv\Scripts\activate && cd C:\Insurance-Comparison-Recommendation-Claim-Assistant\covermate-backend && celery -A celery_worker worker --loglevel=info --pool=solo"

:: Terminal 4 - Frontend
start "Frontend" cmd /k "cd C:\Insurance-Comparison-Recommendation-Claim-Assistant\covermate-frontend\covermate-frontend && npm run dev"

echo All services started!