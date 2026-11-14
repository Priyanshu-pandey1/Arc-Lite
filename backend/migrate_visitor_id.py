"""
One-time (idempotent) migration: anonymous visitor identity for public chat.

- visitor_id  VARCHAR(64) NULL  — random UUIDv4 issued to a browser on its
             first public chatbot visit. Associates a conversation row with
             the anonymous browser that created it so GET /api/public/
             conversations can return only that visitor's history.

             NULL for every pre-existing row (staff/test conversations and
             chats made before this feature): those rows belong to no public
             visitor, stay visible in staff history and Analytics, and are
             never returned to any visitor.

Safe to run repeatedly: ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS
do nothing once applied. Never drops or rewrites data, never deletes rows.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import db

SQL_STATEMENTS = [
    """
    ALTER TABLE conversations
        ADD COLUMN IF NOT EXISTS visitor_id VARCHAR(64);
    """,
    # Public history lookups filter by visitor_id on every request.
    """
    CREATE INDEX IF NOT EXISTS idx_conversations_visitor_id
        ON conversations (visitor_id);
    """,
]


def main():
    with db.get_connection() as conn:
        with conn.cursor() as cur:
            for statement in SQL_STATEMENTS:
                cur.execute(statement)
            conn.commit()

            # Verify the column now exists with the expected shape.
            cur.execute(
                """
                SELECT column_name, data_type, is_nullable,
                       character_maximum_length
                FROM information_schema.columns
                WHERE table_name = 'conversations'
                  AND column_name = 'visitor_id';
                """
            )
            print("Column after migration:")
            for row in cur.fetchall():
                print("  ", row)

            cur.execute(
                """
                SELECT indexname
                FROM pg_indexes
                WHERE tablename = 'conversations'
                  AND indexname = 'idx_conversations_visitor_id';
                """
            )
            print("Index:", cur.fetchone())

            # Existing rows are preserved; only new public chats get an id.
            cur.execute(
                """
                SELECT COUNT(*),
                       COUNT(*) FILTER (WHERE visitor_id IS NOT NULL),
                       COUNT(*) FILTER (WHERE is_hidden)
                FROM conversations;
                """
            )
            total, with_visitor, hidden = cur.fetchone()
            print(
                f"rows: total={total}, with_visitor_id={with_visitor}, "
                f"hidden={hidden}"
            )


if __name__ == "__main__":
    main()
