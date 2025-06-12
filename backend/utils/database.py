import sqlite3

DATABASE_LOC = "db/transcriptions.db"


# Initialize SQLite database
def init_database():
    """Initialize the SQLite database and create the transcriptions table if it doesn't exist."""
    conn = sqlite3.connect(DATABASE_LOC)
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS transcriptions (
            id TEXT PRIMARY KEY,
            full_transcription TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            session_duration_seconds REAL
        )
    """
    )
    conn.commit()
    conn.close()


def save_transcription_to_db(
    session_id: str, full_transcription: str, session_duration: float = None
):
    """Save the full transcription to SQLite database."""
    try:
        conn = sqlite3.connect(DATABASE_LOC)
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO transcriptions (id, full_transcription, session_duration_seconds)
            VALUES (?, ?, ?)
        """,
            (session_id, full_transcription, session_duration),
        )
        conn.commit()
        conn.close()
        print(f"Transcription saved to database with ID: {session_id}")
    except Exception as e:
        print(f"Error saving transcription to database: {e}")
