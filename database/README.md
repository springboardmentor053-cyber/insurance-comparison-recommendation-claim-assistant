# database/

This folder contains database utility scripts.

## Files

| File | Purpose |
|---|---|
| `create_tables.py` | Creates all database tables from SQLAlchemy models |

## How to Run

From the project root:
```powershell
cd d:\Insurance_Comparison_Recommendation
python database/create_tables.py
```

> Make sure your `backend/.env` is configured with the correct `DATABASE_URL` before running.
