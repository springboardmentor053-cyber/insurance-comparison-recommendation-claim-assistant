
import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_login_and_me():
    print("Testing Login Flow...")
    
    # 1. Login
    url = f"{BASE_URL}/login/access-token"
    data = urllib.parse.urlencode({
        "username": "user@example.com",
        "password": "password"
    }).encode()
    
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status != 200:
                print(f"Login Failed: {response.status}")
                return
            
            body = response.read().decode()
            token = json.loads(body)["access_token"]
            print("Login Successful. Token received.")
            
            # 2. Get Me
            me_url = f"{BASE_URL}/users/me"
            me_req = urllib.request.Request(me_url, method="GET")
            me_req.add_header("Authorization", f"Bearer {token}")
            
            with urllib.request.urlopen(me_req) as me_response:
                if me_response.status != 200:
                    print(f"Get Me Failed: {me_response.status}")
                    return
                
                me_body = me_response.read().decode()
                user = json.loads(me_body)
                print(f"Get Me Successful. User: {user.get('email')}")
                print("FULL SUCCESS: Backend is working correctly.")

    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        print(e.read().decode())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login_and_me()
