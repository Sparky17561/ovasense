import requests
import json
import sys

# Force UTF-8 for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def test_chat_api():
    url = "http://127.0.0.1:8000/api/chat/"
    
    # 1. Start Conversation
    print("Testing /api/chat/ endpoint...")
    payload = {
        "text": "Hi, I have irregular periods.",
        "conversation_history": [],
        "current_data": {}
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Baymax: {data.get('response_text')}")
        print(f"Extracted: {data.get('extracted_data')}")
        print(f"Ready: {data.get('ready_for_classification')}")
        
        if response.status_code == 200:
            print("\n✅ /api/chat/ endpoint is WORKING.")
        else:
            print(f"\n❌ Endpoint returned error: {response.text}")

    except Exception as e:
        print(f"\n❌ Connection failed: {e}")
        print("Make sure the server is running on port 8000.")

if __name__ == "__main__":
    test_chat_api()
