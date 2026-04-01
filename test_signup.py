import requests

data = {
    "name": "Abhishek Narwade",
    "email": "abc@gmail.com",
    "password": "Password@123",
    "occupation": "student",
    "annual_income": 10000000.0,
    "gender": "male",
    "dob": "2003-02-02"
}

try:
    response = requests.post("http://localhost:8000/api/v1/signup", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
