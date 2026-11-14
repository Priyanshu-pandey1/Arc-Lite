"""Remove the ZZ regression-test FAQ rows created during testing."""
import os
import sys

import db

with db.get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM faq_entries WHERE question LIKE 'ZZ regression test%';"
        )
        print(f"deleted {cur.rowcount} test rows")
        conn.commit()
