"""
Shared psycopg connection pool for every Neon access in Arc Lite.

The bottleneck measurements showed that psycopg.connect() costs ~700 ms
per call from local Windows to the Neon Singapore region (TCP + TLS +
auth round trip), while the actual SQL takes ~140 ms. Opening two fresh
connections per request (auth check + endpoint query) dominated the
~2000 ms GET /api/faqs response time.

This module keeps a small pool of warm connections alive and hands them
out to request handlers, so steady-state requests only pay for SQL.
psycopg_pool transparently replaces connections that Neon's pooler
drops after idle timeouts, so no stale-connection handling is needed
at call sites.
"""

import os
from contextlib import contextmanager
from pathlib import Path

import psycopg_pool
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in backend/.env")

# Small pool: well within Neon free-tier limits on the -pooler endpoint.
# min_size=1 keeps one warm connection; more are opened on demand and
# closed again by the pool after 4 minutes of idleness. That is below
# Neon's pooler idle drop (~5 min), so surplus connections are retired
# by us before the server invalidates them instead of being discovered
# dead at the next checkout.
#
# kwargs connect_timeout bounds every (re)connect attempt at 5 seconds.
# Without it libpq waits indefinitely, so a replacement connect during a
# Neon cold wake could hold a pool worker thread and the growth slot
# while callers burn their 30 s checkout budget and fail with
# psycopg_pool.PoolTimeout. Normal connects take ~700 ms; 5 s only caps
# attempts that are already failing.
#
# check=ConnectionPool.check_connection pings each connection on
# checkout. Neon's pooler drops idle connections (~5 min), and without
# the check those dead connections were handed to request handlers,
# which failed with "SSL connection has been closed unexpectedly" and
# surfaced as HTTP 500s. Broken connections are now discarded and
# replaced transparently before the request sees them.
pool = psycopg_pool.ConnectionPool(
    DATABASE_URL,
    name="arc-lite-pool",
    min_size=1,
    max_size=4,
    max_idle=240,
    check=psycopg_pool.ConnectionPool.check_connection,
    kwargs={"connect_timeout": 5},
    open=True,
)


@contextmanager
def get_connection():
    """Check a pooled connection out for the duration of one operation."""
    with pool.connection() as conn:
        yield conn
