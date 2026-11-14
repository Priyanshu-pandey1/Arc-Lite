
import os

import db


def load_faqs_from_database():
    """
    Load active FAQs from Neon PostgreSQL and convert them
    into the dictionary format expected by the AI engine.
    """

    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise ValueError("DATABASE_URL not found in backend/.env")

    query = """
        SELECT
            id,
            question,
            category,
            keywords,
            canonical_answer,
            verification_status
        FROM faq_entries
        WHERE is_active = TRUE
        ORDER BY id;
    """

    with db.get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()

    faqs = []

    for row in rows:
        faqs.append({
            "id": row[0],
            "question": row[1],
            "category": row[2],
            "keywords": row[3] or [],
            "answer": row[4],
            "verification_status": row[5],
        })

    if not faqs:
        raise ValueError("No active FAQs found in the database.")

    return faqs
