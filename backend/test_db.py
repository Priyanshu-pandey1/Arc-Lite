
import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env")

try:
    with psycopg.connect(DATABASE_URL, connect_timeout=10) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT current_database();")
            database_name = cur.fetchone()[0]

    print("Neon database connected successfully!")
    print("Database:", database_name)

except Exception as error:
    print("Database connection failed!")
    print("Error:", error)
