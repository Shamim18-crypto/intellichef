import sqlite3
import os
import json
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "intellichef.db")

def get_db_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Restaurants table (Data isolation per restaurant)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS restaurants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        cuisine TEXT DEFAULT 'Multi-Cuisine',
        location TEXT DEFAULT 'Downtown',
        service_level REAL DEFAULT 0.95,
        buffer_strategy TEXT DEFAULT 'balanced', -- conservative, balanced, lean
        cost_of_stockout_multiplier REAL DEFAULT 1.5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Menu Items
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT DEFAULT 'Main Course',
        cost_price REAL DEFAULT 5.0,
        selling_price REAL DEFAULT 15.0,
        shelf_life_days INTEGER DEFAULT 1,
        unit TEXT DEFAULT 'portions',
        active INTEGER DEFAULT 1,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );
    """)

    # 3. Daily Sales & Historical Waste
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        date TEXT NOT NULL, -- YYYY-MM-DD
        quantity_sold REAL NOT NULL,
        customers_count INTEGER DEFAULT 0,
        waste_quantity REAL DEFAULT 0,
        day_of_week INTEGER NOT NULL, -- 0=Mon, 6=Sun
        is_weekend INTEGER NOT NULL, -- 0 or 1
        is_festival INTEGER DEFAULT 0,
        event_name TEXT,
        weather TEXT DEFAULT 'Normal',
        notes TEXT,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        UNIQUE(restaurant_id, item_id, date)
    );
    """)

    # 4. Events / Festivals Calendar
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        impact_factor REAL DEFAULT 1.2, -- Demand multiplier
        category TEXT DEFAULT 'Holiday',
        description TEXT,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );
    """)

    # 5. Usable Inventory / Current Stock
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        usable_quantity REAL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        UNIQUE(restaurant_id, item_id)
    );
    """)

    # 6. Model Training & Evaluation Metrics
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS model_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        model_name TEXT NOT NULL, -- Baseline, LinearRegression, RandomForest
        mae REAL NOT NULL,
        rmse REAL NOT NULL,
        mape REAL NOT NULL,
        is_selected INTEGER DEFAULT 0,
        trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );
    """)

    # 7. Prep Recommendations Cache
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prep_recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        target_date TEXT NOT NULL,
        expected_demand REAL NOT NULL,
        safety_buffer REAL NOT NULL,
        usable_inventory REAL NOT NULL,
        recommended_prep REAL NOT NULL,
        confidence_score REAL NOT NULL,
        expected_waste REAL DEFAULT 0,
        selected_model TEXT NOT NULL,
        explanation_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        UNIQUE(restaurant_id, item_id, target_date)
    );
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at:", DB_PATH)
