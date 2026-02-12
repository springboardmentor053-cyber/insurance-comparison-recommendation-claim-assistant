
import urllib.request
import json
import urllib.error

url = "http://localhost:8000/api/v1/signup"

payload = {
    "name": "Test User API",
    "email": "api_test_u2@example.com",
    "password": "password123",
    "occupation": "Engineer",
    "annual_income": 95000,
    "gender": "male",
    "marital_status": "single",
    "phone_number": "9876543210",
    "address": "456 api street",
    "dob": "1995-05-20"
}

headers = {
    'Content-Type': 'application/json'
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers=headers, method='POST')

print(f"Sending POST request to {url}")

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.getcode()}")
        print(f"Response: {response.read().decode('utf-8')}")
        print("SUCCESS: Signup worked via API directly.")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(f"Response: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
