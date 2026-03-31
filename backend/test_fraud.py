import requests
import io
import time

session = requests.Session()

# 1. Login
res = session.post("http://localhost:8000/api/v1/login/access-token", data={"username": "user@example.com", "password": "password"})
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Get active user policy
res = session.get("http://localhost:8000/api/v1/policies/my", headers=headers)
policies = res.json()
up_id = policies[0]["id"]

# 3. Create Draft Claim
claim_data = {
    "user_policy_id": up_id,
    "claim_type": "health",
    "incident_date": "2026-03-31",
    "incident_description": "Auto-submitted Fraud Test",
    "amount_claimed": 800000
}
res = session.post("http://localhost:8000/api/v1/claims/", headers=headers, json=claim_data)
claim_details = res.json()
claim_id = claim_details["id"]

# 4. Upload dummy pdf document
files = {'file': ('dummy.pdf', io.BytesIO(b'%PDF-1.4 dummy content\n'), 'application/pdf')}
res = session.post(f"http://localhost:8000/api/v1/claims/{claim_id}/documents", headers=headers, files=files, data={'doc_type': 'medical_report'})

# 5. Submit the claim to trigger FraudEngine
res = session.post(f"http://localhost:8000/api/v1/claims/{claim_id}/submit", headers=headers)
print("Submit Result:", res.json())
