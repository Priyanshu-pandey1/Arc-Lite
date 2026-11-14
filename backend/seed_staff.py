
import os

import psycopg
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash


# Load environment variables
backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
STAFF_EMAIL = os.getenv("STAFF_EMAIL")
STAFF_PASSWORD = os.getenv("STAFF_PASSWORD")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env")

if not STAFF_EMAIL or not STAFF_PASSWORD:
    raise ValueError("Staff credentials not found in .env")


# Securely hash the password
password_hash = generate_password_hash(STAFF_PASSWORD)

# Insert staff account or update its password if it already exists
with psycopg.connect(DATABASE_URL) as conn:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO staff (email, password_hash)
            VALUES (%s, %s)
            ON CONFLICT (email)
            DO UPDATE SET
                password_hash = EXCLUDED.password_hash,
                is_active = TRUE;
            """,
            (STAFF_EMAIL, password_hash),
        )

print("Staff account created successfully!")
print("Staff email:", STAFF_EMAIL)
print("Password stored securely as a hash.")
