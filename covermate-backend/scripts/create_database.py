"""
Create the PostgreSQL database defined in DATABASE_URL if it does not exist.

Usage:
    python scripts/create_database.py
"""

import os

from dotenv import load_dotenv
from psycopg2 import connect, sql
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy.engine.url import make_url


def create_database_if_missing() -> None:
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set in .env")

    parsed = make_url(database_url)
    db_name = parsed.database
    if not db_name:
        raise RuntimeError("DATABASE_URL must include a database name")

    admin_db = os.getenv("POSTGRES_ADMIN_DB", "postgres")
    admin_conn_url = parsed.set(database=admin_db)

    conn = connect(admin_conn_url.render_as_string(hide_password=False))
    try:
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
            exists = cur.fetchone() is not None

            if exists:
                print(f"Database '{db_name}' already exists.")
                return

            cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(db_name)))
            print(f"Database '{db_name}' created successfully.")
    finally:
        conn.close()


if __name__ == "__main__":
    create_database_if_missing()
