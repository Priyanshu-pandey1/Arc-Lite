"""Tests for DELETE /api/faqs/<id> — the staff FAQ soft-delete flow.

Covers: auth guards, active + inactive deletes, idempotency, invalid
ids, soft-delete (row survives with is_active=FALSE), blast radius on
other rows, AI-engine refresh after create / delete / reactivate, and
self-cleanup (test FAQ soft-deleted, test conversations hidden).
"""
import json
import os
import sys
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
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
        raw = e.read().decode() or "null"
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            # Flask's default HTML error pages (e.g. <int:id> route misses)
            return e.code, {"raw": raw[:80]}


def check(name, condition, detail=""):
    results.append((name, condition, detail))
    print(("PASS  " if condition else "FAIL  ") + name + ("  -> " + str(detail) if detail and not condition else ""))


def find(rows, faq_id):
    if not isinstance(rows, list):
        return None
    return next((r for r in rows if str(r.get("id")) == str(faq_id)), None)


# --- setup: staff token ---
status, login = call("POST", "/auth/login", body={
    "email": os.getenv("STAFF_EMAIL"), "password": os.getenv("STAFF_PASSWORD")})
if status != 200:
    print("staff login failed:", status, login)
    sys.exit(1)
TOKEN = login["token"]
check("staff login works", True)

QUESTION = "How do staff run Arc Lite delete testing in the QA portal?"
ANSWER = "DELETE-QA-PORTAL-7391: staff use the internal Arc Lite QA portal for delete testing."

# --- 1. authentication / authorization guards ---
status, _ = call("DELETE", "/faqs/1")
check("DELETE without token returns 401", status == 401, status)
status, _ = call("DELETE", "/faqs/1", token="forged.token.value")
check("DELETE with forged token returns 401", status == 401, status)
status, _ = call("GET", "/faqs")
check("GET /faqs without token returns 401", status == 401, status)

# --- 2. create a dedicated test FAQ ---
status, created = call("POST", "/faqs", token=TOKEN, body={
    "question": QUESTION,
    "answer": ANSWER,
    "category": "Account",
    "status": "active",
})
check("POST /faqs creates the test entry (201)",
      status == 201 and created.get("id"), (status, created))
if status != 201 or not created.get("id"):
    sys.exit(1)
FAQ_ID = created.get("id")

status, before = call("GET", "/faqs", token=TOKEN)
check("GET /faqs returns the new entry (200)",
      status == 200 and find(before, FAQ_ID) is not None, (status,))
neighbour = find(before, "1")
check("legit seed FAQ id=1 is active before the delete",
      neighbour is not None and neighbour.get("status") == "active", neighbour)

# --- 3. AI engine uses the FAQ while it is active ---
status, chat_active = call("POST", "/chat", body={"question": QUESTION})
check("engine answers with the FAQ while it is active",
      status == 200 and chat_active.get("status") == "answered"
      and str(chat_active.get("faq_id")) == str(FAQ_ID)
      and "DELETE-QA-PORTAL-7391" in (chat_active.get("answer") or ""),
      (status, chat_active.get("status"), chat_active.get("faq_id")))
CONVS = [chat_active.get("conversation_id")]

# --- 4. DELETE the active FAQ ---
status, deleted = call("DELETE", f"/faqs/{FAQ_ID}", token=TOKEN)
check("DELETE of an active FAQ returns 200",
      status == 200 and str(deleted.get("id")) == str(FAQ_ID), (status, deleted))

# --- 5. soft delete: row survives, marked inactive ---
status, after = call("GET", "/faqs", token=TOKEN)
row = find(after, FAQ_ID)
check("row still exists after DELETE (soft delete, no physical delete)",
      row is not None and row.get("status") == "inactive", row)

# --- 6. blast radius: every other row untouched ---
others_before = [r for r in before if str(r.get("id")) != str(FAQ_ID)]
others_after = [r for r in after if str(r.get("id")) != str(FAQ_ID)]
check("no other FAQ rows were added, removed or changed",
      isinstance(before, list) and isinstance(after, list)
      and others_before == others_after,
      (len(others_before), len(others_after)))

# --- 7. engine no longer uses it after the delete ---
status, chat_deleted = call("POST", "/chat", body={"question": QUESTION})
check("engine no longer uses the deleted FAQ",
      status == 200 and str(chat_deleted.get("faq_id")) != str(FAQ_ID)
      and "DELETE-QA-PORTAL-7391" not in (chat_deleted.get("answer") or ""),
      (status, chat_deleted.get("status"), chat_deleted.get("faq_id")))
CONVS.append(chat_deleted.get("conversation_id"))

# --- 8. idempotent: deleting the inactive row again is safe ---
status, again = call("DELETE", f"/faqs/{FAQ_ID}", token=TOKEN)
check("DELETE of an already-inactive FAQ returns 200 (idempotent)",
      status == 200, (status, again))
status, after2 = call("GET", "/faqs", token=TOKEN)
row2 = find(after2, FAQ_ID)
check("repeat DELETE changed nothing else",
      isinstance(after2, list) and len(after2) == len(after)
      and row2 is not None and row2.get("status") == "inactive",
      (len(after), len(after2) if isinstance(after2, list) else after2))

# --- 9. invalid ids ---
status, body = call("DELETE", "/faqs/999999", token=TOKEN)
check("DELETE of an unknown id returns 404", status == 404, (status, body))
status, body = call("DELETE", "/faqs/0", token=TOKEN)
check("DELETE of id 0 returns 404", status == 404, (status, body))
status, body = call("DELETE", "/faqs/not-a-number", token=TOKEN)
check("DELETE of a non-numeric id returns 404", status == 404, (status, body))

# --- 10. reactivate via Edit (PUT status=active) restores engine access ---
status, updated = call("PUT", f"/faqs/{FAQ_ID}", token=TOKEN, body={
    "question": QUESTION,
    "answer": ANSWER,
    "category": "Account",
    "status": "active",
})
check("PUT status=active reactivates the FAQ (200)",
      status == 200 and updated.get("status") == "active", (status, updated))
status, chat_back = call("POST", "/chat", body={"question": QUESTION})
check("engine uses the reactivated FAQ again",
      status == 200 and str(chat_back.get("faq_id")) == str(FAQ_ID),
      (status, chat_back.get("status"), chat_back.get("faq_id")))
CONVS.append(chat_back.get("conversation_id"))

# --- 11. cleanup: soft-delete the test FAQ, hide the test conversations ---
status, _ = call("DELETE", f"/faqs/{FAQ_ID}", token=TOKEN)
check("cleanup: test FAQ soft-deleted (200)", status == 200, status)
status, final = call("GET", "/faqs", token=TOKEN)
final_row = find(final, FAQ_ID)
check("cleanup: test FAQ left inactive in the database",
      status == 200 and final_row is not None
      and final_row.get("status") == "inactive", final_row)

hide = [call("DELETE", f"/conversations/{cid}", token=TOKEN)[0]
        for cid in CONVS if cid]
check("cleanup: test conversations hidden from the staff list",
      len(hide) > 0 and all(s == 200 for s in hide), hide)

failed = [n for n, ok, _ in results if not ok]
print()
print(f"{len(results) - len(failed)}/{len(results)} passed" + (f", FAILED: {failed}" if failed else " — all green"))
sys.exit(1 if failed else 0)
