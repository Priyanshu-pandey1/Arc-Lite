"""Regression tests for auth + FAQ CRUD + chat after the pool optimization."""
import json
import os
import time
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


# --- 1. Authentication ---
status, body = call("POST", "/auth/login", body={
    "email": os.getenv("STAFF_EMAIL"), "password": os.getenv("STAFF_PASSWORD")})
check("login with valid credentials returns 200 + token",
      status == 200 and body.get("token"), (status, body.get("error")))
TOKEN = body["token"]

status, body = call("POST", "/auth/login", body={"email": "nobody@x.io", "password": "wrong"})
check("login with wrong credentials returns 401 (not 200)", status == 401, status)

status, body = call("GET", "/faqs")
check("GET /faqs without token returns 401", status == 401, status)

status, body = call("GET", "/faqs", token="forged.token.value")
check("GET /faqs with invalid token returns 401", status == 401, status)

status, body = call("GET", "/faqs", token=TOKEN[:-1] + ("A" if TOKEN[-1] != "A" else "B"))
check("GET /faqs with tampered token returns 401", status == 401, status)

# --- 2. FAQ CRUD cycle ---
status, created = call("POST", "/faqs", token=TOKEN, body={
    "question": "ZZ regression test question?",
    "answer": "ZZ regression test answer.",
    "category": "Courses",
    "status": "active",
})
check("POST /faqs creates entry (201)", status == 201 and created.get("id"), (status, created))
faq_id = created.get("id")

status, listing = call("GET", "/faqs", token=TOKEN)
found = any(r.get("id") == str(faq_id) for r in listing)
check("created entry appears in GET /faqs list", status == 200 and found, len(listing))

status, updated = call("PUT", f"/faqs/{faq_id}", token=TOKEN, body={
    "question": "ZZ regression test question (updated)?",
    "answer": "ZZ regression test answer (updated).",
    "category": "Jobs",
    "status": "active",
})
check("PUT /faqs/:id updates entry (200)", status == 200 and updated.get("category") == "Jobs", (status, updated))

status, after_update = call("GET", "/faqs", token=TOKEN)
u = next((r for r in after_update if r.get("id") == str(faq_id)), None)
check("update persisted to the list", u is not None and u.get("category") == "Jobs", u)

status, deleted = call("DELETE", f"/faqs/{faq_id}", token=TOKEN)
check("DELETE /faqs/:id soft-deletes entry (200)", status == 200, (status, deleted))

status, listing_after = call("GET", "/faqs", token=TOKEN)
d = next((r for r in listing_after if r.get("id") == str(faq_id)), None)
check("deleted entry no longer active in list",
      d is None or d.get("status") == "inactive", d)

status, _ = call("DELETE", f"/faqs/{faq_id}", token=TOKEN)
check("DELETE of already-deleted FAQ is an idempotent 200 (soft delete)",
      status == 200, status)

status, body = call("PUT", f"/faqs/{faq_id}", token=TOKEN, body={
    "question": "ZZ should not update an inactive entry?",
    "answer": "ZZ answer.",
    "category": "Courses",
    "status": "active",
})
# Pre-existing behavior (unchanged by the optimization): the original
# UPDATE ... WHERE id = %s has no is_active filter, so PUT on a
# soft-deleted entry updates it. Documented, not "fixed" here.
check("PUT on soft-deleted FAQ behaves as before the optimization (200)",
      status == 200, status)

# Self-cleanup: the PUT above reactivated the row, so soft-delete it
# again — regression runs must not leave an active test FAQ behind.
status, _ = call("DELETE", f"/faqs/{faq_id}", token=TOKEN)
check("cleanup: regression FAQ soft-deleted again (200)", status == 200, status)

# --- 3. Chat still works end-to-end ---
status, body = call("POST", "/chat", body={"question": "How can I enroll in a course?"})
check("POST /chat answers matched question (200)", status == 200 and body.get("status") == "answered",
      (status, body.get("status")))
CONV = body.get("conversation_id")

status, body = call("POST", "/chat", body={"question": "What is the capital of Mars?"})
check("POST /chat refuses out-of-scope question", status == 200 and body.get("status") in ("refused", "unclear"),
      (status, body.get("status")))

status, body = call("POST", f"/chat/{CONV}/rate", body={"rating": "up"})
check("POST /chat/:id/rate saves rating", status == 200, (status, body))

# --- Summary ---
failed = [n for n, ok, _ in results if not ok]
print()
print(f"{len(results) - len(failed)}/{len(results)} passed" + (f", FAILED: {failed}" if failed else " — all green"))
