"""Baseline measurement: GET /api/faqs over HTTP, 5 consecutive runs."""
import json
import os
import time
import urllib.request

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

EMAIL = os.getenv("STAFF_EMAIL")
PASSWORD = os.getenv("STAFF_PASSWORD")

login_req = urllib.request.Request(
    "http://127.0.0.1:5000/api/auth/login",
    data=json.dumps({"email": EMAIL, "password": PASSWORD}).encode(),
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(login_req, timeout=30) as resp:
    TOKEN = json.loads(resp.read().decode())["token"]

print("login ok, token obtained")

results = []
for i in range(5):
    start = time.perf_counter()
    req = urllib.request.Request(
        "http://127.0.0.1:5000/api/faqs",
        headers={"Authorization": "Bearer " + TOKEN},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = json.loads(resp.read().decode())
        ms = (time.perf_counter() - start) * 1000
    results.append(ms)
    print(f"run {i + 1}: {ms:.0f} ms  (status {resp.status}, {len(body)} records)")

print(f"AVERAGE: {sum(results) / len(results):.0f} ms")
