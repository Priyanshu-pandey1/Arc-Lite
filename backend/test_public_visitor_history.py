"""
Tests for anonymous visitor sessions: X-Visitor-ID validation,
POST /api/chat association, and the three /api/public/conversations
endpoints (ownership, isolation, soft-delete, feedback).

Run from backend/ with the root venv:
    ..\\venv\\Scripts\\python.exe test_public_visitor_history.py
"""
import json
import os
import sys
import urllib.error
import urllib.request
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

BASE = "http://127.0.0.1:5000/api"
results = []

# Two independent anonymous browsers (the script's stand-in for
# incognito profiles). Random per run, so reruns never collide.
VISITOR_A = str(uuid.uuid4())
VISITOR_B = str(uuid.uuid4())


def call(method, path, token=None, body=None, visitor=None):
    req = urllib.request.Request(
        BASE + path,
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={
            **({"Authorization": "Bearer " + token} if token else {}),
            **({"Content-Type": "application/json"} if body is not None else {}),
            **({"X-Visitor-ID": visitor} if visitor else {}),
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
            return e.code, {"raw": raw[:80]}


def check(name, condition, detail=""):
    results.append((name, condition, detail))
    print(("PASS  " if condition else "FAIL  ") + name + ("  -> " + str(detail) if detail and not condition else ""))


# --- 1. Visitor ID validation ----------------------------------------
status, body = call("GET", "/public/conversations")
check("GET public history without visitor id returns 400",
      status == 400 and "Visitor ID" in body.get("error", ""), (status, body))

status, body = call("GET", "/public/conversations", visitor="not-a-uuid")
check("GET public history with malformed id returns 400",
      status == 400 and body.get("error") == "Invalid Visitor ID.", (status, body))

status, body = call("GET", "/public/conversations",
                    visitor="x' OR '1'='1")
check("SQL-injection style id is rejected (400)",
      status == 400, (status, body))

status, body = call("GET", "/public/conversations", visitor="a" * 65)
check("over-long id is rejected (400)", status == 400, (status, body))

status, body = call("PATCH", "/public/conversations/1", body={"title": "x"})
check("PATCH without visitor id returns 400", status == 400, status)

status, body = call("DELETE", "/public/conversations/1")
check("DELETE without visitor id returns 400", status == 400, status)

status, body = call("POST", "/chat", body={"question": "hi"},
                    visitor="garbage-id")
check("POST /chat with malformed visitor id returns 400",
      status == 400, (status, body))

# --- 2. Chats are associated with the asking visitor ------------------
status, a1 = call("POST", "/chat", visitor=VISITOR_A,
                  body={"question": "How can I enroll in a course?"})
check("visitor A chat 1 answered (200 + id)",
      status == 200 and a1.get("conversation_id"), (status, a1))
A1 = a1.get("conversation_id")

status, a2 = call("POST", "/chat", visitor=VISITOR_A,
                  body={"question": "How can I download my course completion certificate?"})
check("visitor A chat 2 answered (200 + id)",
      status == 200 and a2.get("conversation_id"), (status, a2))
A2 = a2.get("conversation_id")

status, b1 = call("POST", "/chat", visitor=VISITOR_B,
                  body={"question": "How can I apply for an internship?"})
check("visitor B chat answered (200 + id)",
      status == 200 and b1.get("conversation_id"), (status, b1))
B1 = b1.get("conversation_id")

status, anon = call("POST", "/chat", body={"question": "How can I get a certificate?"})
check("POST /chat without visitor id still works (200)",
      status == 200 and anon.get("conversation_id"), (status, anon))
ANON = anon.get("conversation_id")

import db  # noqa: E402

with db.get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, visitor_id, is_hidden
            FROM conversations WHERE id IN (%s, %s, %s, %s);
            """,
            (A1, A2, B1, ANON),
        )
        stored = {str(r[0]): (r[1], r[2]) for r in cur.fetchall()}

check("Neon stored visitor A's id on both her rows",
      stored.get(str(A1), (None,))[0] == VISITOR_A
      and stored.get(str(A2), (None,))[0] == VISITOR_A, stored)
check("Neon stored visitor B's id on his row",
      stored.get(str(B1), (None,))[0] == VISITOR_B, stored)
check("chat without header stored visitor_id = NULL",
      stored.get(str(ANON), ("x",))[0] is None, stored)

# --- 3. Isolation: each visitor sees only their own rows ---------------
status, a_hist = call("GET", "/public/conversations", visitor=VISITOR_A)
a_ids = [r["id"] for r in a_hist] if status == 200 else None
check("visitor A GET returns 200", status == 200, status)
check("visitor A sees exactly her two rows, newest first",
      a_ids == [str(A2), str(A1)], a_ids)
check("visitor A cannot see visitor B's row",
      str(B1) not in (a_ids or []), a_ids)
check("visitor A cannot see headerless (visitor_id NULL) rows",
      str(ANON) not in (a_ids or []), a_ids)

status, b_hist = call("GET", "/public/conversations", visitor=VISITOR_B)
b_ids = [r["id"] for r in b_hist] if status == 200 else None
check("visitor B GET returns 200", status == 200, status)
check("visitor B sees exactly his own row",
      b_ids == [str(B1)], b_ids)
check("visitor B cannot see visitor A's rows",
      str(A1) not in (b_ids or []) and str(A2) not in (b_ids or []), b_ids)

# Re-fetch (the refresh case): still only own rows.
status, a_again = call("GET", "/public/conversations", visitor=VISITOR_A)
check("re-fetch for visitor A is stable (refresh-safe)",
      [r["id"] for r in a_again] == [str(A2), str(A1)], a_again)

# Uppercase id normalizes to the same visitor.
status, a_upper = call("GET", "/public/conversations", visitor=VISITOR_A.upper())
check("uppercase visitor id is normalized and accepted",
      status == 200 and [r["id"] for r in a_upper] == [str(A2), str(A1)],
      (status, [r["id"] for r in a_upper] if isinstance(a_upper, list) else a_upper))

# --- 4. Response shape: UI fields in, secrets out ----------------------
required = {"id", "question", "answer", "category", "verdict", "rating",
            "response_time_ms", "created_at", "title", "is_pinned"}
first = a_hist[0] if isinstance(a_hist, list) and a_hist else {}
check("public history carries every field the chat UI needs",
      required.issubset(first.keys()), sorted(first.keys()))
check("public history leaks no visitor id, password or token",
      not ({"visitor_id", "password", "password_hash", "token", "staff_id", "email"} & set(first.keys())),
      sorted(first.keys()))

# --- 5. Ownership: rename / pin only on your own rows ------------------
status, patched = call("PATCH", f"/public/conversations/{A1}", visitor=VISITOR_A,
                       body={"title": "A's own rename", "is_pinned": True})
check("visitor A can rename + pin her own row",
      status == 200 and patched.get("message"), (status, patched))

status, a_hist = call("GET", "/public/conversations", visitor=VISITOR_A)
row = next((r for r in a_hist if r["id"] == str(A1)), None)
check("rename + pin persisted for visitor A",
      row and row.get("title") == "A's own rename" and row.get("is_pinned") is True, row)

status, foreign = call("PATCH", f"/public/conversations/{A1}", visitor=VISITOR_B,
                       body={"title": "B tampering"})
check("visitor B cannot rename visitor A's row (404)",
      status == 404, (status, foreign))

status, a_hist = call("GET", "/public/conversations", visitor=VISITOR_A)
row = next((r for r in a_hist if r["id"] == str(A1)), None)
check("visitor A's title unchanged after B's attempt",
      row and row.get("title") == "A's own rename", row)

status, _ = call("PATCH", f"/public/conversations/{A1}", body={"title": "x"})
check("rename without visitor id returns 400", status == 400, status)

status, _ = call("PATCH", f"/public/conversations/{A1}", visitor=VISITOR_A, body={})
check("PATCH with no fields returns 400", status == 400, status)

status, _ = call("PATCH", f"/public/conversations/{A1}", visitor=VISITOR_A, body={"title": ""})
check("PATCH with empty title returns 400", status == 400, status)

status, _ = call("PATCH", f"/public/conversations/{A1}", visitor=VISITOR_A,
                 body={"title": "x" * 121})
check("PATCH with 121-char title returns 400", status == 400, status)

status, _ = call("PATCH", f"/public/conversations/{A1}", visitor=VISITOR_A,
                 body={"is_pinned": "yes"})
check("PATCH with non-boolean is_pinned returns 400", status == 400, status)

status, _ = call("PATCH", "/public/conversations/999999", visitor=VISITOR_A,
                 body={"title": "ok"})
check("PATCH unknown id returns 404", status == 404, status)

# --- 6. Ownership: soft delete only on your own rows -------------------
status, _ = call("DELETE", f"/public/conversations/{A1}", visitor=VISITOR_B)
check("visitor B cannot delete visitor A's row (404)",
      status == 404, status)

status, a_hist = call("GET", "/public/conversations", visitor=VISITOR_A)
check("visitor A's row still visible after B's delete attempt",
      str(A1) in [r["id"] for r in a_hist], [r["id"] for r in a_hist])

status, _ = call("DELETE", f"/public/conversations/{A1}")
check("delete without visitor id returns 400", status == 400, status)

# --- 7. Feedback: own rows yes, other visitors' rows no ---------------
status, rated = call("POST", f"/chat/{A2}/rate", visitor=VISITOR_A,
                     body={"rating": "up"})
check("visitor A can rate her own row",
      status == 200 and rated.get("rating") == "up", (status, rated))

status, _ = call("POST", f"/chat/{A2}/rate", visitor=VISITOR_B,
                 body={"rating": "down"})
check("visitor B cannot rate visitor A's row (404)",
      status == 404, status)

status, _ = call("POST", f"/chat/{B1}/rate", visitor=VISITOR_A,
                 body={"rating": "down"})
check("visitor A cannot rate visitor B's row (404)",
      status == 404, status)

# --- 8. Staff routes stay protected; staff see every visitor ----------
status, _ = call("GET", "/conversations", visitor=VISITOR_A)
check("visitor header does not unlock staff history (401)",
      status == 401, status)

status, _ = call("GET", "/faqs", visitor=VISITOR_A)
check("visitor header does not unlock FAQ management (401)",
      status == 401, status)

status, login = call("POST", "/auth/login", body={
    "email": os.getenv("STAFF_EMAIL"), "password": os.getenv("STAFF_PASSWORD")})
TOKEN = login.get("token")
check("staff login works", status == 200 and TOKEN, status)

status, staff_hist = call("GET", "/conversations", token=TOKEN)
staff_ids = [r["id"] for r in staff_hist] if status == 200 else []
check("staff history contains visitor A's rows",
      str(A1) in staff_ids and str(A2) in staff_ids, staff_ids[:10])
check("staff history contains visitor B's row",
      str(B1) in staff_ids, staff_ids[:10])
check("staff history contains the headerless row",
      str(ANON) in staff_ids, staff_ids[:10])

status, _ = call("DELETE", f"/public/conversations/{B1}", token=TOKEN)
check("public DELETE ignores a staff JWT without visitor id (400)",
      status == 400, status)

# Staff JWT may rate any row (pre-existing open feedback behavior).
status, rated = call("POST", f"/chat/{B1}/rate", token=TOKEN,
                     body={"rating": "up"})
check("staff can rate a visitor's row (feedback unchanged)",
      status == 200, (status, rated))

# --- 9. CORS preflight allows the header (browser requirement) ---------
preflight = urllib.request.Request(
    BASE + "/public/conversations",
    method="OPTIONS",
    headers={
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "x-visitor-id",
    },
)
try:
    with urllib.request.urlopen(preflight, timeout=15) as resp:
        pre_status, allow_headers = resp.status, resp.headers.get(
            "Access-Control-Allow-Headers", "")
except urllib.error.HTTPError as e:
    pre_status, allow_headers = e.code, e.headers.get(
        "Access-Control-Allow-Headers", "")
check("CORS preflight allows X-Visitor-ID",
      pre_status in (200, 204) and "x-visitor-id" in allow_headers.lower(),
      (pre_status, allow_headers))

# --- 10. No physical delete; soft-delete hides from public history -----
with db.get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM conversations;")
        total_before = cur.fetchone()[0]

status, deleted = call("DELETE", f"/public/conversations/{A1}", visitor=VISITOR_A)
check("visitor A can delete her own row (200, soft)",
      status == 200 and deleted.get("is_hidden") is True, (status, deleted))

with db.get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT is_hidden FROM conversations WHERE id = %s;",
            (A1,),
        )
        hidden_after = cur.fetchone()
        cur.execute("SELECT COUNT(*) FROM conversations;")
        total_after = cur.fetchone()[0]

check("row still exists after public DELETE (no physical delete)",
      total_before == total_after and hidden_after and hidden_after[0] is True,
      (total_before, total_after, hidden_after))

status, a_hist = call("GET", "/public/conversations", visitor=VISITOR_A)
check("deleted row left visitor A's public history",
      str(A1) not in [r["id"] for r in a_hist], [r["id"] for r in a_hist])

status, _ = call("DELETE", f"/public/conversations/{A1}", visitor=VISITOR_A)
check("second DELETE of same id returns 404", status == 404, status)

status, _ = call("PATCH", f"/public/conversations/{A1}", visitor=VISITOR_A,
                 body={"title": "again"})
check("PATCH of hidden row returns 404", status == 404, status)

# Cleanup: hide the remaining script rows (kept in Neon, as always).
# The headerless row has no owner, so only the staff route can hide it.
call("DELETE", f"/public/conversations/{A2}", visitor=VISITOR_A)
call("DELETE", f"/public/conversations/{B1}", visitor=VISITOR_B)
call("DELETE", f"/conversations/{ANON}", token=TOKEN)

# --- Summary ------------------------------------------------------------
failed = [n for n, ok, _ in results if not ok]
print()
print(f"{len(results) - len(failed)}/{len(results)} passed" + (f", FAILED: {failed}" if failed else " — all green"))
sys.exit(1 if failed else 0)
