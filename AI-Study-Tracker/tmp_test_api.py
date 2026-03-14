import requests
import json

BASE_URL = "http://localhost:5000"

def test_group_details():
    # Login first
    session = requests.Session()
    login_data = {"username": "Srivatsav", "password": "password"} # Assuming default/previously set password
    # Try multiple common passwords if needed
    passwords = ["password", "Srivatsav123", "123456"]
    
    for pwd in passwords:
        res = session.post(f"{BASE_URL}/login", json={"username": "Srivatsav", "password": pwd})
        if res.status_code == 200:
            print(f"Logged in with password: {pwd}")
            break
    else:
        print("Failed to login.")
        return

    # Fetch group details
    res = session.get(f"{BASE_URL}/get_group_details/1")
    print("\n--- Response Status ---")
    print(res.status_code)
    print("\n--- Response Body ---")
    try:
        print(json.dumps(res.json(), indent=2))
    except:
        print(res.text)

if __name__ == "__main__":
    test_group_details()
