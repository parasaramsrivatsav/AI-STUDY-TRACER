import sqlite3
import os

DB_PATH = r'c:\Users\sriva\OneDrive\Desktop\ML\AI-Study-Tracker\backend\study_tracker.db'

def check_data():
    if not os.path.exists(DB_PATH):
        print("DB not found at", DB_PATH)
        return
        
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    
    print("--- Groups ---")
    groups = conn.execute("SELECT * FROM study_groups").fetchall()
    for g in groups:
        print(dict(g))
        
    print("\n--- Members ---")
    members = conn.execute("SELECT * FROM group_members").fetchall()
    for m in members:
        print(dict(m))
        
    print("\n--- Users ---")
    users = conn.execute("SELECT id, username FROM users").fetchall()
    for u in users:
        print(dict(u))

    print("\n--- Active Sessions ---")
    active = conn.execute("SELECT * FROM active_sessions").fetchall()
    if not active:
        print("No active sessions found.")
    for a in active:
        print(dict(a))
        
    conn.close()

if __name__ == '__main__':
    check_data()
