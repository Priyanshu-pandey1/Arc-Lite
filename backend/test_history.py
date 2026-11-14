"""Tests for the new GET /api/conversations history integration."""
import json
import os
import urllib.error
import urllib.request

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

BASE = "http://127.0.0.1:5000/api"
results = []


def call(method, path, token=None, body=None):
    req = urllib.request.Request(
        BASE + path,
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={
            **({"Authorization": "Bearer " + token} if token else {}),
            **({"Content-Type": "application/json"} if body is not None else {}),
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode() or "null")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or "null")


def check(name, condition, detail=""):
    results.append((name, condition, detail))
    print(("PASS  " if condition else "FAIL  ") + name + ("  -> " + str(detail) if detail and not condition else ""))


# --- 1. Authentication guard ---
status, _ = call("GET", "/conversations")
check("GET /conversations without token returns 401", status == 401, status)

status, _ = call("GET", "/conversations", token="forged.token.value")
check("GET /conversations with invalid token returns 401", status == 401, status)

# --- 2. Staff can load history ---
status, login = call("POST", "/auth/login", body={
    "email": os.getenv("STAFF_EMAIL"), "password": os.getenv("STAFF_PASSWORD")})
TOKEN = login["token"]

status, history = call("GET", "/conversations", token=TOKEN)
check("staff GET /conversations returns 200", status == 200, status)
check("history is a non-empty list", isinstance(history, list) and len(history) > 0, len(history) if isinstance(history, list) else history)

required_fields = {"id", "question", "answer", "category", "verdict", "rating", "response_time_ms", "created_at"}
first = history[0] if isinstance(history, list) and history else {}
check("each record has all required fields", required_fields.issubset(first.keys()), sorted(first.keys()))
check("no password/secret fields leaked", not ({"password", "password_hash", "token", "staff_id"} & set(first.keys())))

created_list = [r.get("created_at") for r in history if r.get("created_at")]
check("records ordered newest first",
      created_list == sorted(created_list, reverse=True), created_list[:3])

# --- 3. History matches actual Neon rows ---
status, chat = call("POST", "/chat", body={"question": "How can I download my course completion certificate?"})
check("chat answered the question", status == 200 and chat.get("status") == "answered", (status, chat.get("status")))
CONV_ID = chat.get("conversation_id")

status, history2 = call("GET", "/conversations", token=TOKEN)
newest = history2[0]
check("new question appears in history as newest record",
      newest.get("id") == str(CONV_ID), (newest.get("id"), CONV_ID))
check("history record carries the answer text",
      newest.get("answer") == chat.get("answer"), newest.get("answer")[:60])
check("history record carries category + verdict + response time",
      newest.get("category") == chat.get("category")
      and newest.get("verdict") == chat.get("status")
      and newest.get("response_time_ms") == chat.get("response_time_ms"),
      newest)

# --- 4. Feedback persists to the correct Neon row ---
status, rated = call("POST", f"/chat/{CONV_ID}/rate", body={"rating": "down"})
check("rating endpoint accepted 'down'", status == 200, (status, rated))

status, history3 = call("GET", "/conversations", token=TOKEN)
rated_row = next((r for r in history3 if r.get("id") == str(CONV_ID)), None)
check("rating shows on the correct history record", rated_row and rated_row.get("rating") == "down", rated_row)

# --- 5. Existing functionality still intact ---
status, _ = call("GET", "/faqs", token=TOKEN)
check("GET /faqs still works for staff", status == 200, status)
status, _ = call("GET", "/faqs")
check("GET /faqs still 401 without token", status == 401, status)
status, health = call("GET", "/health")
check("health endpoint still 200", status == 200, status)

# --- cleanup: mark test row unrated? rating stays 'down'; harmless real usage ---
failed = [n for n, ok, _ in results if not ok]
print()
print(f"{len(results) - len(failed)}/{len(results)} passed" + (f", FAILED: {failed}" if failed else " — all green"))
