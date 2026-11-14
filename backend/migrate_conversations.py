"""
One-time (idempotent) migration: add per-conversation UI columns.

- title      TEXT  NULL  — custom sidebar title; NULL means "generate from question".
- is_pinned  BOOL NOT NULL DEFAULT FALSE — pinned rows sort to the top of history.
- is_hidden  BOOL NOT NULL DEFAULT FALSE — soft-delete flag; hidden rows are excluded
             from GET /api/conversations but kept for Analytics.

Safe to run repeatedly: ADD COLUMN IF NOT EXISTS does nothing once applied.
Never drops or rewrites data — existing rows keep their values.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import db

SQL = """
ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
"""


def main():
    with db.get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(SQL)
            conn.commit()

            # Verify the columns now exist
            cur.execute(
                """
                SELECT column_name, data_type, column_default, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'conversations'
                  AND column_name IN ('title', 'is_pinned', 'is_hidden')
                ORDER BY ordinal_position;
                """
            )
            print("Columns after migration:")
            for row in cur.fetchall():
                print("  ", row)

            cur.execute(
                """
                SELECT COUNT(*),
                       COUNT(*) FILTER (WHERE is_hidden),
                       COUNT(*) FILTER (WHERE is_pinned)
                FROM conversations;
                """
            )
            total, hidden, pinned = cur.fetchone()
            print(f"rows: total={total}, hidden={hidden}, pinned={pinned}")


if __name__ == "__main__":
    main()
