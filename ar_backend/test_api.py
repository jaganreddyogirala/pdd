import json
import urllib.request
import urllib.error
import sys

BASE_URL = 'http://127.0.0.1:8000/api'

def make_request(url, data=None, method='GET'):
    headers = {'Content-Type': 'application/json'}
    req_data = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        res_body = e.read().decode('utf-8')
        return e.code, json.loads(res_body) if res_body else {}

# 1. Start Session
def test_start_session():
    data = {
        "host_app_id": "ar_frontend_app",
        "product_id": "chair_exec_001",
        "product_name": "Ergonomic Chair",
        "model_url": "https://example.com/models/chair.glb",
        "scale": 1.0
    }
    status_code, body = make_request(f"{BASE_URL}/session/start/", data=data, method='POST')
    print("Start Session Response:", status_code, body)
    if status_code != 201:
        sys.exit(1)
    return body.get('session_id')

# 2. Get Model Data
def test_get_model_data(session_id):
    data = {"session_id": session_id}
    status_code, body = make_request(f"{BASE_URL}/model/load/", data=data, method='POST')
    print("Get Model Data Response:", status_code, body)
    if status_code != 200:
        sys.exit(1)

# 3. Save Capture
def test_save_capture(session_id):
    dummy_img = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
    data = {
        "session_id": session_id,
        "captured_image": dummy_img
    }
    status_code, body = make_request(f"{BASE_URL}/capture/save/", data=data, method='POST')
    print("Save Capture Response:", status_code, body)
    if status_code != 201:
        sys.exit(1)

# 4. Get Captures
def test_get_captures():
    status_code, body = make_request(f"{BASE_URL}/capture/list/", method='GET')
    print("Get Captures Response:", status_code, body)
    if status_code != 200:
        sys.exit(1)

if __name__ == "__main__":
    session_id = test_start_session()
    if session_id:
        test_get_model_data(session_id)
        test_save_capture(session_id)
    test_get_captures()
    print("All tests passed.")

