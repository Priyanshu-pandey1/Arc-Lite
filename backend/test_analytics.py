"""
Tests for GET /api/analytics — the staff Analytics Dashboard backed by
real Neon PostgreSQL data.

Covers: staff JWT auth (401/200), SQL-matched totals and verdict
percentages, category statistics with NULL-safe average response time,
negative-feedback criteria, period windows (7d/30d/90d/all), zero-safe
helper maths, and the critical invariant that a public visitor
soft-delete (is_hidden = TRUE) changes NO analytics number while the
row disappears from that visitor's public history.

Database safety: the only rows written are two brand-new test
conversations owned by a random test visitor. Cleanup is soft-hide
(the project's existing convention) — no existing record is modified,
truncated or physically deleted.

Run from backend/ with the root venv:
    ..\\venv\\Scripts\\python.exe test_analytics.py
"""
import json
import math
import os
import sys
import urllib.error
import urllib.request
import uuid
from datetime import timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

import db  # noqa: E402

# Importing the app module gives access to the pure helper functions
# (percent / build_overall / build_category / build_activity_buckets)
# for zero-safe unit tests. app.run is __main__-guarded, so no server
# starts in this process.
import app as backend  # noqa: E402

BASE = "http://127.0.0.1:5000/api"
results = []

# Fresh anonymous visitor for the two test conversations. Random per
# run, so reruns never collide with real visitors.
TEST_VISITOR = str(uuid.uuid4())


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


def expect_percent(part, whole):
    """Independent copy of the percentage rule: 0 when whole == 0."""
    return round(part * 100.0 / whole, 1) if whole else 0.0


def collect_keys(obj, out):
    if isinstance(obj, dict):
        for key, value in obj.items():
            out.add(key)
            collect_keys(value, out)
    elif isinstance(obj, list):
        for item in obj:
            collect_keys(item, out)


with db.get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM conversations;")
        INITIAL_TOTAL = cur.fetchone()[0]

# --- 1. Pure helper unit tests (zero-safe maths) ---------------------
check("percent(0, 0) is 0 (no division by zero)",
      backend.percent(0, 0) == 0.0, backend.percent(0, 0))
check("percent(1, 3) is 33.3", backend.percent(1, 3) == 33.3, backend.percent(1, 3))
check("percent(0, 5) is 0.0", backend.percent(0, 5) == 0.0, backend.percent(0, 5))

empty_overall = backend.build_overall((0, 0, 0, 0, 0, 0))
check("build_overall of an empty database is all zeros",
      empty_overall["total"] == 0
      and empty_overall["answered_percent"] == 0.0
      and empty_overall["unclear_percent"] == 0.0
      and empty_overall["refused_percent"] == 0.0,
      empty_overall)

null_avg = backend.build_category(("Jobs", 1, 0, 1, 0, None))
check("build_category keeps a NULL average response time as null",
      null_avg["average_response_time_ms"] is None, null_avg)
zero_cat = backend.build_category(("Courses", 0, 0, 0, 0, None))
check("build_category of a zero-total category has 0.0 percents",
      zero_cat["answered_percent"] == 0.0 and zero_cat["total"] == 0, zero_cat)

from datetime import date  # noqa: E402

empty_activity = backend.build_activity_buckets([], None, None)
check("build_activity_buckets with no dates returns empty series",
      empty_activity["labels"] == [] and empty_activity["total"] == [],
      empty_activity)

zero_filled = backend.build_activity_buckets(
    [], date(2026, 11, 7), date(2026, 11, 13)
)
check("build_activity_buckets zero-fills 7 empty days",
      zero_filled["labels"] == [
          "Nov 7", "Nov 8", "Nov 9", "Nov 10", "Nov 11", "Nov 12", "Nov 13"
      ]
      and all(value == 0 for value in zero_filled["total"])
      and all(value == 0 for value in zero_filled["unanswered"]),
      zero_filled)

partial = backend.build_activity_buckets(
    [{"day": date(2026, 11, 12), "total": 3, "answered": 2,
      "positive": 1, "negative": 0}],
    date(2026, 11, 7), date(2026, 11, 13),
)
check("build_activity_buckets sums real days into the right bucket",
      sum(partial["total"]) == 3
      and sum(partial["answered"]) == 2
      and sum(partial["unanswered"]) == 1
      and partial["total"][5] == 3,
      partial)

# --- 2. Authentication ----------------------------------------------
status, body = call("GET", "/analytics")
check("GET /api/analytics without a token returns 401",
      status == 401 and "authentication" in body.get("error", "").lower(),
      (status, body))

status, body = call("GET", "/analytics", token="not-a-real-jwt")
check("GET /api/analytics with a garbage token returns 401",
      status == 401, (status, body))

status, login = call("POST", "/auth/login", body={
    "email": os.getenv("STAFF_EMAIL"), "password": os.getenv("STAFF_PASSWORD")})
TOKEN = login.get("token")
check("staff login works", status == 200 and TOKEN, status)

status, body = call("GET", "/analytics", token=TOKEN)
check("GET /api/analytics with staff token returns 200",
      status == 200 and "overall" in body, (status, body))

# --- 3. Period parameter handling ------------------------------------
status, body = call("GET", "/analytics?period=1y", token=TOKEN)
check("invalid period returns 400", status == 400, (status, body))

status, body = call("GET", "/analytics?period=7D", token=TOKEN)
check("period is case-insensitive (7D accepted, echoed as 7d)",
      status == 200 and body.get("period") == "7d", (status, body))

status, body = call("GET", "/analytics?period=ALL", token=TOKEN)
check("period ALL accepted, echoed as all",
      status == 200 and body.get("period") == "all", (status, body))

status, body = call("GET", "/analytics", token=TOKEN)
check("missing period defaults to 7d",
      status == 200 and body.get("period") == "7d", (status, body))

# --- 4. Create two known test conversations ---------------------------
with db.get_connection() as conn:
    with conn.cursor() as cur:
        # Row 1: in-window, answered + rated down -> counted in every
        # period, listed in negative feedback, in today's activity.
        cur.execute(
            """
            INSERT INTO conversations
                (question, answer, category, verdict, response_time_ms,
                 rating, visitor_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
            """,
            ("ANALYTICS-DELETE-TEST does soft delete affect analytics?",
             "Analytics soft-delete regression answer.",
             "Courses", "answered", 42.5, "down", TEST_VISITOR),
        )
        ROW1_ID = str(cur.fetchone()[0])

        # Row 2: 45 days old, outside 7d/30d, inside 90d/all. First
        # 'unclear' verdict and first 'Jobs' row in the table.
        cur.execute(
            """
            INSERT INTO conversations
                (question, answer, category, verdict, response_time_ms,
                 rating, visitor_id, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW() - INTERVAL '45 days')
            RETURNING id;
            """,
            ("ANALYTICS-DATE-TEST old conversation for window checks",
             "Old conversation for period-window checks.",
             "Jobs", "unclear", 7.75, None, TEST_VISITOR),
        )
        ROW2_ID = str(cur.fetchone()[0])
    conn.commit()

check("test rows created (row1 in-window, row2 45 days old)",
      ROW1_ID.isdigit() and ROW2_ID.isdigit(), (ROW1_ID, ROW2_ID))


def sql_count(where="", params=()):
    with db.get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM conversations " + where + ";", params
            )
            return cur.fetchone()[0]


# --- 5. Overall statistics match SQL (all-time) -----------------------
with db.get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COUNT(*),
                   COUNT(*) FILTER (WHERE verdict = 'answered'),
                   COUNT(*) FILTER (WHERE verdict = 'unclear'),
                   COUNT(*) FILTER (WHERE verdict = 'refused'),
                   COUNT(*) FILTER (WHERE rating = 'up'),
                   COUNT(*) FILTER (WHERE rating = 'down')
            FROM conversations;
            """
        )
        (SQL_TOTAL, SQL_ANSWERED, SQL_UNCLEAR, SQL_REFUSED,
         SQL_UP, SQL_DOWN) = cur.fetchone()

status, all_body = call("GET", "/analytics?period=all", token=TOKEN)
overall = all_body.get("overall", {}) if status == 200 else {}

check("all-time total matches SELECT COUNT(*)",
      status == 200 and overall.get("total") == SQL_TOTAL,
      (status, overall.get("total"), SQL_TOTAL))
check("answered/unclear/refused counts match SQL FILTER counts",
      overall.get("answered") == SQL_ANSWERED
      and overall.get("unclear") == SQL_UNCLEAR
      and overall.get("refused") == SQL_REFUSED,
      (overall.get("answered"), overall.get("unclear"), overall.get("refused")))
check("verdict counts sum to the total",
      SQL_ANSWERED + SQL_UNCLEAR + SQL_REFUSED == SQL_TOTAL,
      (SQL_ANSWERED, SQL_UNCLEAR, SQL_REFUSED, SQL_TOTAL))
check("verdict percentages are correct",
      overall.get("answered_percent") == expect_percent(SQL_ANSWERED, SQL_TOTAL)
      and overall.get("unclear_percent") == expect_percent(SQL_UNCLEAR, SQL_TOTAL)
      and overall.get("refused_percent") == expect_percent(SQL_REFUSED, SQL_TOTAL),
      (overall.get("answered_percent"), overall.get("unclear_percent"),
       overall.get("refused_percent")))
check("positive/negative rating counts match SQL",
      overall.get("positive_ratings") == SQL_UP
      and overall.get("negative_ratings") == SQL_DOWN,
      (overall.get("positive_ratings"), overall.get("negative_ratings")))
check("accuracy equals answered/total, zero-safe",
      all_body.get("accuracy_percent") == round(expect_percent(SQL_ANSWERED, SQL_TOTAL)),
      all_body.get("accuracy_percent"))
check("all-time has no previous window",
      all_body.get("previous") is None, all_body.get("previous"))

# --- 6. Category statistics + average response time vs SQL ------------
with db.get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COALESCE(category, 'Uncategorized') AS category,
                   COUNT(*) AS total,
                   COUNT(*) FILTER (WHERE verdict = 'answered'),
                   COUNT(*) FILTER (WHERE verdict = 'unclear'),
                   COUNT(*) FILTER (WHERE verdict = 'refused'),
                   AVG(response_time_ms)::double precision
            FROM conversations
            GROUP BY 1
            ORDER BY total DESC, category ASC;
            """
        )
        sql_categories = cur.fetchall()

api_categories = all_body.get("categories", [])
category_names_match = [row[0] for row in sql_categories] == [
    cat.get("category") for cat in api_categories
]
check("category list matches SQL GROUP BY (order included)",
      category_names_match,
      ([row[0] for row in sql_categories],
       [cat.get("category") for cat in api_categories]))

mismatches = []
for sql_row, api_cat in zip(sql_categories, api_categories):
    name, total, answered, unclear, refused, avg_ms = sql_row
    if (
        api_cat.get("total") != total
        or api_cat.get("answered") != answered
        or api_cat.get("unclear") != unclear
        or api_cat.get("refused") != refused
        or api_cat.get("answered_percent") != expect_percent(answered, total)
        or api_cat.get("average_response_time_ms")
        != (round(float(avg_ms), 1) if avg_ms is not None else None)
    ):
        mismatches.append((name, sql_row, api_cat))
check("per-category totals, verdicts, percents and avg ms match SQL",
      not mismatches, mismatches)

check("category totals sum to the overall total",
      sum(cat.get("total", 0) for cat in api_categories) == overall.get("total"),
      [cat.get("total") for cat in api_categories])

jobs_cat = next((cat for cat in api_categories if cat.get("category") == "Jobs"), None)
check("NULL-safe average: Jobs category avg is 7.8 ms from one row",
      jobs_cat is not None and jobs_cat.get("average_response_time_ms") == 7.8,
      jobs_cat)

# --- 7. Negative feedback (answered AND rated down) -------------------
with db.get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id FROM conversations
            WHERE verdict = 'answered' AND rating = 'down'
            ORDER BY created_at DESC, id DESC;
            """
        )
        sql_negative_ids = [str(row[0]) for row in cur.fetchall()]

api_negative = all_body.get("negative_feedback", [])
api_negative_ids = [row.get("id") for row in api_negative]
check("negative feedback ids match SQL exactly (answered + down)",
      api_negative_ids == sql_negative_ids,
      (api_negative_ids, sql_negative_ids))
check("negative feedback rows all carry rating=down and required fields",
      all(row.get("rating") == "down"
          and {"id", "question", "answer", "category", "rating", "created_at"}
          <= set(row.keys())
          for row in api_negative),
      api_negative)
check("test row1 (answered + down) is listed in negative feedback",
      ROW1_ID in api_negative_ids, api_negative_ids)

# --- 8. Period windows, activity buckets, previous window -------------
def window_total(days):
    if days is None:
        return sql_count()
    return sql_count(
        "WHERE created_at >= CURRENT_DATE - %s::int", (days - 1,)
    )


def expected_bucket_count(day_count):
    size = math.ceil(day_count / 7)
    return math.ceil(day_count / size)


with db.get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT CURRENT_DATE, MIN(created_at)::date FROM conversations;")
        TODAY, FIRST_DAY = cur.fetchone()

period_bodies = {}
for label, days in (("7d", 7), ("30d", 30), ("90d", 90), ("all", None)):
    status, body = call("GET", "/analytics?period=" + label, token=TOKEN)
    period_bodies[label] = body
    sql_total = window_total(days)

    check(
        "period %s total matches SQL window count" % label,
        status == 200 and body.get("overall", {}).get("total") == sql_total,
        (status, body.get("overall", {}).get("total"), sql_total),
    )

    activity = body.get("activity", {})
    series_totals = activity.get("total", [])
    check(
        "period %s activity buckets sum to the window total" % label,
        sum(series_totals) == sql_total,
        (sum(series_totals), sql_total),
    )

    lengths = {key: len(activity.get(key, []))
               for key in ("labels", "total", "answered", "unanswered",
                           "positive", "negative")}
    check(
        "period %s activity series all share one length" % label,
        len(set(lengths.values())) == 1 and lengths["labels"] > 0,
        lengths,
    )

    if days is not None:
        expected_labels = expected_bucket_count(days)
    else:
        span = (TODAY - FIRST_DAY).days + 1
        expected_labels = expected_bucket_count(span)
    check(
        "period %s has %d bucket labels" % (label, expected_labels),
        lengths["labels"] == expected_labels,
        (lengths["labels"], expected_labels),
    )

    # The window's verdict counts also match SQL directly.
    if days is not None:
        with db.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT COUNT(*) FILTER (WHERE verdict = 'answered'),
                           COUNT(*) FILTER (WHERE verdict = 'unclear'),
                           COUNT(*) FILTER (WHERE verdict = 'refused')
                    FROM conversations
                    WHERE created_at >= CURRENT_DATE - %s::int;
                    """,
                    (days - 1,),
                )
                sql_ans, sql_unc, sql_ref = cur.fetchone()
        api_overall = body.get("overall", {})
        check(
            "period %s verdict counts match SQL window" % label,
            api_overall.get("answered") == sql_ans
            and api_overall.get("unclear") == sql_unc
            and api_overall.get("refused") == sql_ref,
            (api_overall.get("answered"), api_overall.get("unclear"),
             api_overall.get("refused")),
        )

check("totals are monotonically non-decreasing with the window",
      period_bodies["7d"]["overall"]["total"]
      <= period_bodies["30d"]["overall"]["total"]
      <= period_bodies["90d"]["overall"]["total"]
      <= period_bodies["all"]["overall"]["total"],
      {key: value["overall"]["total"] for key, value in period_bodies.items()})

with db.get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COUNT(*) FILTER (WHERE created_at < CURRENT_DATE - 29
                                      AND created_at >= CURRENT_DATE - 89),
                   COUNT(*) FILTER (WHERE created_at < CURRENT_DATE - 89)
            FROM conversations;
            """
        )
        BETWEEN_30_90, OLDER_THAN_90 = cur.fetchone()

check("old rows excluded from 30d are counted in 90d/all",
      BETWEEN_30_90 >= 1
      and period_bodies["30d"]["overall"]["total"] + BETWEEN_30_90
      == period_bodies["90d"]["overall"]["total"]
      and period_bodies["90d"]["overall"]["total"] + OLDER_THAN_90
      == period_bodies["all"]["overall"]["total"],
      {"30d": period_bodies["30d"]["overall"]["total"],
       "90d": period_bodies["90d"]["overall"]["total"],
       "all": period_bodies["all"]["overall"]["total"],
       "between_30_90": BETWEEN_30_90, "older_than_90": OLDER_THAN_90})

with db.get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COUNT(*) FROM conversations
            WHERE created_at >= CURRENT_DATE - %s::int
              AND created_at < CURRENT_DATE - %s::int;
            """,
            (2 * 7 - 1, 7 - 1),
        )
        SQL_PREVIOUS_7D = cur.fetchone()[0]

check("previous window (for KPI deltas) matches SQL",
      period_bodies["7d"].get("previous") is not None
      and period_bodies["7d"]["previous"].get("total") == SQL_PREVIOUS_7D,
      (period_bodies["7d"].get("previous"), SQL_PREVIOUS_7D))

first_label = period_bodies["7d"]["activity"]["labels"][0]
window_start = TODAY - timedelta(days=6)
expected_first_label = "%s %d" % (window_start.strftime("%b"), window_start.day)
check("7d activity starts at the window's first day",
      first_label == expected_first_label, (first_label, expected_first_label))

# --- 9. REQUIRED: public soft-delete never changes analytics ----------
# 9a. The row is visible in the visitor's public history first.
status, history_before = call("GET", "/public/conversations", visitor=TEST_VISITOR)
ids_before = [row.get("id") for row in history_before] if status == 200 else []
check("row1 visible in public history before deletion",
      status == 200 and ROW1_ID in ids_before, (status, ids_before))

# 9b. Full analytics snapshots before the public delete.
status_7d, before_7d = call("GET", "/analytics?period=7d", token=TOKEN)
status_all, before_all = call("GET", "/analytics?period=all", token=TOKEN)
check("analytics snapshots captured before deletion",
      status_7d == 200 and status_all == 200, (status_7d, status_all))

before_7d_total = before_7d["overall"]["total"]
before_courses = next(
    (cat for cat in before_7d["categories"] if cat["category"] == "Courses"), {}
)
before_negative_ids = [row["id"] for row in before_7d["negative_feedback"]]
before_activity_sum = sum(before_7d["activity"]["total"])

# 9c. The visitor deletes it through the public endpoint.
status, body = call("DELETE", "/public/conversations/" + ROW1_ID,
                    visitor=TEST_VISITOR)
check("public DELETE of row1 returns 200", status == 200, (status, body))

# 9d. It disappears from that visitor's public history...
status, history_after = call("GET", "/public/conversations", visitor=TEST_VISITOR)
ids_after = [row.get("id") for row in history_after] if status == 200 else []
check("row1 gone from public history after deletion",
      status == 200 and ROW1_ID not in ids_after, (status, ids_after))
check("row2 (other test row) still in public history",
      ROW2_ID in ids_after, ids_after)

# 9e. ...but the record still exists and is only flagged hidden.
with db.get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT is_hidden FROM conversations WHERE id = %s;",
            (ROW1_ID,),
        )
        row1 = cur.fetchone()
check("row1 still exists in the database",
      row1 is not None, row1)
check("row1 is_hidden = TRUE (soft delete, no physical delete)",
      row1 is not None and row1[0] is True, row1)

# 9f. Staff analytics are byte-identical before/after the deletion.
status_7d, after_7d = call("GET", "/analytics?period=7d", token=TOKEN)
status_all, after_all = call("GET", "/analytics?period=all", token=TOKEN)

diff_7d = {key: (before_7d.get(key), after_7d.get(key))
           for key in before_7d if before_7d.get(key) != after_7d.get(key)}
diff_all = {key: (before_all.get(key), after_all.get(key))
            for key in before_all if before_all.get(key) != after_all.get(key)}
check("7d analytics unchanged after public deletion (full payload)",
      status_7d == 200 and not diff_7d, diff_7d)
check("all-time analytics unchanged after public deletion (full payload)",
      status_all == 200 and not diff_all, diff_all)

check("totals did not decrease (still counted after deletion)",
      after_7d["overall"]["total"] == before_7d_total
      and after_7d["overall"]["total"] == window_total(7),
      (after_7d["overall"]["total"], before_7d_total))

courses_after = next(
    (cat for cat in after_7d["categories"] if cat["category"] == "Courses"), {}
)
check("category + verdict statistics unchanged",
      courses_after == before_courses
      and after_7d["overall"]["answered"] == before_7d["overall"]["answered"],
      (before_courses, courses_after))

check("negative feedback still lists the deleted conversation",
      [row["id"] for row in after_7d["negative_feedback"]] == before_negative_ids
      and ROW1_ID in [row["id"] for row in after_7d["negative_feedback"]],
      [row["id"] for row in after_7d["negative_feedback"]])

check("activity chart still includes the deleted conversation",
      sum(after_7d["activity"]["total"]) == before_activity_sum
      == window_total(7),
      (sum(after_7d["activity"]["total"]), before_activity_sum))

check("recent table still includes the deleted conversation",
      ROW1_ID in [row.get("id") for row in after_7d.get("recent", [])],
      after_7d.get("recent"))

# 9g. Staff conversation management behaviour is unchanged: the staff
#     sidebar still excludes soft-deleted rows (existing behaviour).
status, staff_rows = call("GET", "/conversations", token=TOKEN)
staff_ids = [row.get("id") for row in staff_rows] if status == 200 else []
check("staff sidebar still hides soft-deleted rows (behaviour unchanged)",
      status == 200 and ROW1_ID not in staff_ids and ROW2_ID in staff_ids,
      (status, ROW1_ID, ROW2_ID))

# 9h. Cleanup of row2 by the project's convention: soft-hide it through
#     the same public endpoint. No physical delete, no rewrite.
status, body = call("DELETE", "/public/conversations/" + ROW2_ID,
                    visitor=TEST_VISITOR)
check("cleanup: row2 soft-deleted via public DELETE",
      status == 200, (status, body))

status, history_final = call("GET", "/public/conversations", visitor=TEST_VISITOR)
check("public history for the test visitor is now empty",
      status == 200 and history_final == [], (status, history_final))

# --- 10. Visitor-hidden rows remain counted in analytics --------------
with db.get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) FILTER (WHERE is_hidden = TRUE), "
            "COUNT(*) FILTER (WHERE is_hidden = FALSE), COUNT(*) "
            "FROM conversations;"
        )
        HIDDEN_TOTAL, VISIBLE_TOTAL, GRAND_TOTAL = cur.fetchone()

check("database has visitor-hidden rows to verify",
      HIDDEN_TOTAL >= 2, (HIDDEN_TOTAL, VISIBLE_TOTAL))
check("SQL: hidden + visible = total (no rows lost)",
      HIDDEN_TOTAL + VISIBLE_TOTAL == GRAND_TOTAL,
      (HIDDEN_TOTAL, VISIBLE_TOTAL, GRAND_TOTAL))

status, body = call("GET", "/analytics?period=all", token=TOKEN)
check("analytics count hidden rows (total = hidden + visible, no is_hidden filter)",
      status == 200
      and body["overall"]["total"] == HIDDEN_TOTAL + VISIBLE_TOTAL == GRAND_TOTAL,
      (status, body["overall"]["total"], HIDDEN_TOTAL, VISIBLE_TOTAL))

status, visible_rows = call("GET", "/conversations", token=TOKEN)
check("staff sidebar count excludes hidden rows (management unchanged)",
      status == 200 and len(visible_rows) == VISIBLE_TOTAL,
      (status, len(visible_rows), VISIBLE_TOTAL))

# --- 11. Staff auth regression + response hygiene ---------------------
status, body = call("GET", "/conversations")
check("staff conversations still 401 without a token", status == 401, status)

status, body = call("GET", "/conversations", token=TOKEN)
check("staff conversations still 200 with a token", status == 200, status)

status, body = call("GET", "/faqs", token=TOKEN)
check("staff FAQ management still works (200)", status == 200, status)

status, body = call("GET", "/faqs")
check("FAQ management still 401 without a token", status == 401, status)

keys = set()
collect_keys(period_bodies["all"], keys)
forbidden = {"password", "password_hash", "token", "visitor_id",
             "staff_id", "email", "jwt_secret", "database_url", "secret"}
check("analytics response exposes no secrets or identity fields",
      not (keys & forbidden), sorted(keys & forbidden))

# --- 12. Data integrity: nothing physically deleted -------------------
FINAL_TOTAL = sql_count()
check("no records lost: final total = initial + the 2 created test rows",
      FINAL_TOTAL == INITIAL_TOTAL + 2,
      (INITIAL_TOTAL, FINAL_TOTAL))

with db.get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) FROM conversations WHERE id IN (%s, %s);",
            (ROW1_ID, ROW2_ID),
        )
        existing = cur.fetchone()[0]
check("both test rows still exist (soft-hidden, never deleted)",
      existing == 2, existing)

# --- Summary ----------------------------------------------------------
passed = sum(1 for _, ok, _ in results if ok)
failed = len(results) - passed
print("\n%d/%d checks passed" % (passed, len(results)))
if failed:
    print("FAILED CHECKS:")
    for name, ok, detail in results:
        if not ok:
            print("  - %s -> %s" % (name, detail))
sys.exit(0 if failed == 0 else 1)
