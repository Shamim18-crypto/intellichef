import os
import sys
import webbrowser
import threading
import time
import uvicorn

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.database import init_db
from backend.demo_generator import seed_demo_data

def open_browser():
    time.sleep(1.5)
    print("Opening IntelliChef in your default browser at http://127.0.0.1:8000 ...")
    webbrowser.open("http://127.0.0.1:8000")

def main():
    print("=" * 65)
    print(" IntelliChef — AI Demand Forecasting & Food-Waste Reduction Platform")
    print(" 'Prepare smarter. Waste less.'")
    print("=" * 65)
    
    print("\n1. Initializing isolated database...")
    init_db()

    print("\n2. Checking demo data...")
    from backend.database import get_db_connection
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as cnt FROM restaurants")
    cnt = c.fetchone()['cnt']
    conn.close()

    if cnt == 0:
        print("   Seeding 365 days of realistic restaurant sales and waste logs...")
        seed_demo_data()
        print("   Demo restaurant seeded successfully!")
    else:
        print("   Existing database records found.")

    print("\n3. Starting IntelliChef FastAPI server at http://127.0.0.1:8000 ...")
    
    # Launch browser thread
    threading.Thread(target=open_browser, daemon=True).start()

    # Run uvicorn
    uvicorn.run("backend.app:app", host="127.0.0.1", port=8000, log_level="info")

if __name__ == "__main__":
    main()
