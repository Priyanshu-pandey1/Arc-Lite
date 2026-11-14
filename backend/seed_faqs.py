
import json
from pathlib import Path

import psycopg
from dotenv import load_dotenv
import os

# Load database credentials from backend/.env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in backend/.env")

# Load existing FAQ data
FAQ_FILE = Path(__file__).parent / "data" / "faqs.json"

with open(FAQ_FILE, "r", encoding="utf-8") as file:
    faqs = json.load(file)

inserted = 0
skipped = 0

with psycopg.connect(DATABASE_URL) as conn:
    with conn.cursor() as cur:

        for faq in faqs:
            question = faq["question"].strip()
            answer = faq["answer"].strip()
            category = faq["category"].strip()
            keywords = faq.get("keywords", [])
            verification_status = faq.get(
                "verification_status", "unverified_sample"
            )

            cur.execute(
                """
                INSERT INTO faq_entries
                    (question, category, keywords, canonical_answer,
                     verification_status, is_active)
                SELECT %s, %s, %s, %s, %s, TRUE
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM faq_entries
                    WHERE LOWER(question) = LOWER(%s)
                      AND category = %s
                )
                RETURNING id;
                """,
                (
                    question,
                    category,
                    keywords,
                    answer,
                    verification_status,
                    question,
                    category,
                ),
            )

            if cur.fetchone():
                inserted += 1
            else:
                skipped += 1

print("FAQ import completed!")
print("Total FAQs in JSON:", len(faqs))
print("New FAQs inserted:", inserted)
print("Existing FAQs skipped:", skipped)
