"""Tests for PATCH /api/conversations/<id> and DELETE /api/conversations/<id>."""
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


# --- setup: staff token + a real conversation row ---
status, login = call("POST", "/auth/login", body={
    "email": os.getenv("STAFF_EMAIL"), "password": os.getenv("STAFF_PASSWORD")})
TOKEN = login["token"]
check("staff login works", status == 200, status)

status, chat = call("POST", "/chat", body={"question": "How can I download my course completion certificate?"})
check("chat created a conversation", status == 200 and chat.get("conversation_id"), chat)
CID = chat["conversation_id"]

# --- authentication guard ---
status, _ = call("PATCH", f"/conversations/{CID}", body={"title": "x"})
check("PATCH without token returns 401", status == 401, status)
status, _ = call("DELETE", f"/conversations/{CID}")
check("DELETE without token returns 401", status == 401, status)
status, _ = call("PATCH", f"/conversations/{CID}", token="forged.token", body={"title": "x"})
check("PATCH with forged token returns 401", status == 401, status)
status, _ = call("DELETE", f"/conversations/{CID}", token="forged.token")
check("DELETE with forged token returns 401", status == 401, status)

# --- validation ---
status, _ = call("PATCH", f"/conversations/{CID}", token=TOKEN, body={})
check("PATCH with no fields returns 400", status == 400, status)
status, _ = call("PATCH", f"/conversations/{CID}", token=TOKEN, body={"title": ""})
check("PATCH with empty title returns 400", status == 400, status)
status, _ = call("PATCH", f"/conversations/{CID}", token=TOKEN, body={"title": "  "})
check("PATCH with whitespace-only title returns 400", status == 400, status)
status, _ = call("PATCH", f"/conversations/{CID}", token=TOKEN, body={"title": "x" * 121})
check("PATCH with 121-char title returns 400", status == 400, status)
status, _ = call("PATCH", f"/conversations/{CID}", token=TOKEN, body={"is_pinned": "yes"})
check("PATCH with non-boolean is_pinned returns 400", status == 400, status)
status, _ = call("PATCH", "/conversations/999999", token=TOKEN, body={"title": "ok"})
check("PATCH unknown id returns 404", status == 404, status)
status, _ = call("DELETE", "/conversations/999999", token=TOKEN)
check("DELETE unknown id returns 404", status == 404, status)
status, _ = call("PATCH", "/conversations/not-a-number", token=TOKEN, body={"title": "ok"})
check("PATCH non-integer id returns 404", status == 404, status)

# --- rename + pin persist to Neon ---
new_title = "Certificate download guide"
status, patched = call("PATCH", f"/conversations/{CID}", token=TOKEN,
                       body={"title": new_title, "is_pinned": True})
check("PATCH accepts title + is_pinned", status == 200 and patched.get("message"), (status, patched))

status, history = call("GET", "/conversations", token=TOKEN)
row = next((r for r in history if r.get("id") == str(CID)), None)
check("GET returns the custom title", row and row.get("title") == new_title, row)
check("GET returns is_pinned = true", row and row.get("is_pinned") is True, row)

# whitespace-stripped title
status, _ = call("PATCH", f"/conversations/{CID}", token=TOKEN, body={"title": "  spaced  "})
status, history = call("GET", "/conversations", token=TOKEN)
row = next((r for r in history if r.get("id") == str(CID)), None)
check("title stored stripped (120-char trim not applied to content)", row and row.get("title") == "spaced", row)

# unpin only (partial patch)
status, _ = call("PATCH", f"/conversations/{CID}", token=TOKEN, body={"is_pinned": False})
status, history = call("GET", "/conversations", token=TOKEN)
row = next((r for r in history if r.get("id") == str(CID)), None)
check("partial pin patch keeps the custom title", row and row.get("title") == "spaced" and row.get("is_pinned") is False, row)

# --- soft delete: hidden from GET but still in the table ---
import db  # noqa: E402
with db.get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT COUNT(*), COUNT(*) FILTER (WHERE is_hidden) FROM conversations;"
        )
        before_count, before_hidden = cur.fetchone()

status, deleted = call("DELETE", f"/conversations/{CID}", token=TOKEN)
check("DELETE returns 200", status == 200 and deleted.get("is_hidden") is True, (status, deleted))

with db.get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT COUNT(*), COUNT(*) FILTER (WHERE is_hidden) FROM conversations;"
        )
        after_count, after_hidden = cur.fetchone()
# No physical delete: the total is unchanged and exactly one row flips
# to hidden (earlier hidden rows from previous runs must not be counted).
check("row still exists after DELETE (no physical delete)",
      after_count == before_count and after_hidden == before_hidden + 1,
      (before_count, after_count, before_hidden, after_hidden))

status, history = call("GET", "/conversations", token=TOKEN)
check("hidden row is excluded from GET /conversations",
      all(r.get("id") != str(CID) for r in history), [r["id"] for r in history][:5])

status, _ = call("DELETE", f"/conversations/{CID}", token=TOKEN)
check("second DELETE of same id returns 404", status == 404, status)
status, _ = call("PATCH", f"/conversations/{CID}", token=TOKEN, body={"title": "again"})
check("PATCH of hidden row returns 404", status == 404, status)

failed = [n for n, ok, _ in results if not ok]
print()
print(f"{len(results) - len(failed)}/{len(results)} passed" + (f", FAILED: {failed}" if failed else " — all green"))
