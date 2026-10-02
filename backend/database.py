import os
import sqlite3
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "campuspulse.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def get_db_connection(db_file: Optional[str] = None):
    path = db_file or DB_PATH
    conn = sqlite3.connect(path)
    conn.row_factory = dict_factory
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db(db_file: Optional[str] = None):
    """Initializes the database tables from schema.sql and migrates if needed."""
    path = db_file or DB_PATH
    conn = get_db_connection(path)
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_script = f.read()
    
    with conn:
        conn.executescript(schema_script)
        
        # Check if auth_tokens needs migration to support user_id and role
        cur = conn.cursor()
        cur.execute("PRAGMA table_info(auth_tokens)")
        columns = [row["name"] for row in cur.fetchall()]
        if "user_id" not in columns:
            print("[Database] Migrating auth_tokens table to support universal user_id and role...")
            cur.execute("DROP TABLE IF EXISTS auth_tokens")
            cur.execute("""
                CREATE TABLE auth_tokens (
                    token TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'student',
                    expires_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
    conn.close()
    print(f"[Database] SQLite schema successfully initialized at: {path}")

if __name__ == "__main__":
    init_db()
