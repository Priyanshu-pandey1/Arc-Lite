"""Phase breakdown for GET /api/faqs on a fresh psycopg connection."""
import os
import time

import jwt
import psycopg
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
JWT_SECRET = os.getenv("JWT_SECRET")

TOKEN = jwt.encode(
    {"staff_id": 1, "exp": 9999999999},
    JWT_SECRET,
    algorithm="HS256",
)

STAFF_SQL = "SELECT id FROM staff WHERE id = %s AND is_active = TRUE;"
FAQS_SQL = """
    SELECT id, question, category,
           canonical_answer, is_active, updated_at
    FROM faq_entries
    ORDER BY updated_at DESC, id DESC;
"""


def timeit(label, fn, runs=5):
    results = []
    for _ in range(runs):
        start = time.perf_counter()
        fn()
        results.append((time.perf_counter() - start) * 1000)
    print(f"{label:<46} " + "  ".join(f"{r:7.0f}" for r in results)
          + f"   avg {sum(results) / len(results):7.0f} ms")
    return results


# 1. Connection establishment alone (what every request currently pays)
def connect_only():
    with psycopg.connect(DATABASE_URL):
        pass


# 2. Auth phase equivalent: connect + staff validation query
def connect_plus_staff():
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(STAFF_SQL, (1,))
            cur.fetchone()


# 3. Full request equivalent: connect + staff + faq queries
def connect_plus_staff_plus_faqs():
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(STAFF_SQL, (1,))
            cur.fetchone()
            cur.execute(FAQS_SQL)
            cur.fetchall()


# 4. FAQ query on an already-open connection (what reuse would give)
def query_on_open_connection():
    with open_conn.cursor() as cur:
        cur.execute(FAQS_SQL)
        cur.fetchall()


# 5. JWT decode alone
def jwt_decode():
    jwt.decode(TOKEN, JWT_SECRET, algorithms=["HS256"])


print("Five runs each, milliseconds:")
timeit("A. psycopg.connect() alone", connect_only)
timeit("B. connect + staff validation SQL", connect_plus_staff)
timeit("C. connect + staff + faq SQL (full equiv.)", connect_plus_staff_plus_faqs)
timeit("D. jwt.decode() alone", jwt_decode, runs=50)

open_conn = psycopg.connect(DATABASE_URL)
timeit("E. faq SQL on already-open connection", query_on_open_connection)
open_conn.close()
