import random
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any
import uuid
from backend.database import get_db_connection

DEMO_RESTAURANT_ID = "demo-restaurant-001"
DEMO_RESTAURANT_NAME = "The Saffron & Olive Bistro (Demo)"

ITEMS_CONFIG = [
    {
        "id": "item-biryani-01",
        "name": "Hyderabadi Dum Biryani",
        "category": "Main Course",
        "cost_price": 6.50,
        "selling_price": 19.50,
        "shelf_life_days": 1,
        "unit": "portions",
        "base_daily": 145,
        "weekend_boost": 1.24,  # +24% on Sunday
        "festival_boost": 1.35,
        "std_dev": 8.0,
        "initial_inventory": 20
    },
    {
        "id": "item-butterchicken-02",
        "name": "Smoked Butter Chicken",
        "category": "Main Course",
        "cost_price": 5.50,
        "selling_price": 18.00,
        "shelf_life_days": 2,
        "unit": "portions",
        "base_daily": 120,
        "weekend_boost": 1.20,
        "festival_boost": 1.30,
        "std_dev": 7.0,
        "initial_inventory": 15
    },
    {
        "id": "item-paneertikka-03",
        "name": "Tandoori Paneer Tikka",
        "category": "Appetizer",
        "cost_price": 4.00,
        "selling_price": 14.00,
        "shelf_life_days": 1,
        "unit": "portions",
        "base_daily": 85,
        "weekend_boost": 1.28,
        "festival_boost": 1.25,
        "std_dev": 6.0,
        "initial_inventory": 12
    },
    {
        "id": "item-lambshank-04",
        "name": "Slow-Braised Lamb Shank",
        "category": "Main Course",
        "cost_price": 9.50,
        "selling_price": 28.50,
        "shelf_life_days": 2,
        "unit": "portions",
        "base_daily": 42,
        "weekend_boost": 1.35,
        "festival_boost": 1.40,
        "std_dev": 4.0,
        "initial_inventory": 6
    },
    {
        "id": "item-trufflerisotto-05",
        "name": "Wild Mushroom Truffle Risotto",
        "category": "Main Course",
        "cost_price": 5.00,
        "selling_price": 21.00,
        "shelf_life_days": 1,
        "unit": "portions",
        "base_daily": 65,
        "weekend_boost": 1.18,
        "festival_boost": 1.20,
        "std_dev": 5.0,
        "initial_inventory": 8
    },
    {
        "id": "item-naan-06",
        "name": "Artisan Garlic Naan Basket",
        "category": "Breads & Sides",
        "cost_price": 1.20,
        "selling_price": 6.50,
        "shelf_life_days": 1,
        "unit": "portions",
        "base_daily": 210,
        "weekend_boost": 1.22,
        "festival_boost": 1.28,
        "std_dev": 12.0,
        "initial_inventory": 30
    },
    {
        "id": "item-samosachaat-07",
        "name": "Crisp Samosa Chaat",
        "category": "Appetizer",
        "cost_price": 2.50,
        "selling_price": 9.50,
        "shelf_life_days": 1,
        "unit": "portions",
        "base_daily": 75,
        "weekend_boost": 1.25,
        "festival_boost": 1.30,
        "std_dev": 5.5,
        "initial_inventory": 10
    },
    {
        "id": "item-kulfi-08",
        "name": "Pistachio Saffron Kulfi",
        "category": "Desserts",
        "cost_price": 2.00,
        "selling_price": 8.50,
        "shelf_life_days": 5,
        "unit": "portions",
        "base_daily": 55,
        "weekend_boost": 1.32,
        "festival_boost": 1.35,
        "std_dev": 4.5,
        "initial_inventory": 18
    }
]

DAY_FACTORS = {
    0: 0.85,  # Monday (slower)
    1: 0.90,  # Tuesday
    2: 0.95,  # Wednesday
    3: 1.05,  # Thursday
    4: 1.20,  # Friday
    5: 1.30,  # Saturday
    6: 1.24   # Sunday (24% higher than avg)
}

def seed_demo_data(days_of_history: int = 365, reference_date: datetime = None) -> Dict[str, Any]:
    """
    Seeds a rich, realistic restaurant dataset with:
    - 365 days of chronological daily sales, covers, waste logs
    - Realistic festival and holiday spikes
    - Item level variations and realistic wastage
    - Upcoming festival calendar
    """
    if reference_date is None:
        reference_date = datetime.now()

    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Clear existing demo data
    cursor.execute("DELETE FROM restaurants WHERE id = ?", (DEMO_RESTAURANT_ID,))
    cursor.execute("DELETE FROM items WHERE restaurant_id = ?", (DEMO_RESTAURANT_ID,))
    cursor.execute("DELETE FROM daily_sales WHERE restaurant_id = ?", (DEMO_RESTAURANT_ID,))
    cursor.execute("DELETE FROM events WHERE restaurant_id = ?", (DEMO_RESTAURANT_ID,))
    cursor.execute("DELETE FROM inventory WHERE restaurant_id = ?", (DEMO_RESTAURANT_ID,))
    cursor.execute("DELETE FROM model_metrics WHERE restaurant_id = ?", (DEMO_RESTAURANT_ID,))
    cursor.execute("DELETE FROM prep_recommendations WHERE restaurant_id = ?", (DEMO_RESTAURANT_ID,))

    # 2. Insert Demo Restaurant
    cursor.execute("""
    INSERT INTO restaurants (id, name, cuisine, location, service_level, buffer_strategy, cost_of_stockout_multiplier)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        DEMO_RESTAURANT_ID,
        DEMO_RESTAURANT_NAME,
        "Artisan Indo-Mediterranean Grill",
        "Downtown Financial District",
        0.95,
        "balanced",
        1.5
    ))

    # 3. Insert Menu Items
    for item in ITEMS_CONFIG:
        cursor.execute("""
        INSERT INTO items (id, restaurant_id, name, category, cost_price, selling_price, shelf_life_days, unit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            item["id"],
            DEMO_RESTAURANT_ID,
            item["name"],
            item["category"],
            item["cost_price"],
            item["selling_price"],
            item["shelf_life_days"],
            item["unit"]
        ))
        # Initial usable inventory
        cursor.execute("""
        INSERT INTO inventory (restaurant_id, item_id, usable_quantity)
        VALUES (?, ?, ?)
        """, (
            DEMO_RESTAURANT_ID,
            item["id"],
            item["initial_inventory"]
        ))

    # 4. Generate Festival Calendar (Past and Future)
    # Define recurring and known festivals relative to reference date
    festivals = [
        {"name": "New Year's Eve Gala", "month": 12, "day": 31, "impact": 1.45, "cat": "Holiday"},
        {"name": "New Year's Day Brunch", "month": 1, "day": 1, "impact": 1.35, "cat": "Holiday"},
        {"name": "Valentine's Day Dinner", "month": 2, "day": 14, "impact": 1.40, "cat": "Holiday"},
        {"name": "Spring Colors Festival", "month": 3, "day": 25, "impact": 1.25, "cat": "Cultural"},
        {"name": "Easter Holiday Feast", "month": 4, "day": 12, "impact": 1.30, "cat": "Holiday"},
        {"name": "Summer Solstice Food Fair", "month": 6, "day": 21, "impact": 1.20, "cat": "Local Event"},
        {"name": "Downtown Jazz Festival", "month": 8, "day": 15, "impact": 1.30, "cat": "Festival"},
        {"name": "Grand Autumn Festival / Diwali", "month": 10, "day": 20, "impact": 1.40, "cat": "Festival"},
        {"name": "Thanksgiving Weekend", "month": 11, "day": 26, "impact": 1.35, "cat": "Holiday"},
        {"name": "Christmas Eve Feast", "month": 12, "day": 24, "impact": 1.42, "cat": "Holiday"},
        {"name": "Christmas Day Celebration", "month": 12, "day": 25, "impact": 1.38, "cat": "Holiday"}
    ]

    # Map festivals across past year and next 60 days
    start_date = reference_date - timedelta(days=days_of_history)
    end_date = reference_date + timedelta(days=60)
    
    festival_date_map: Dict[str, Dict[str, Any]] = {}
    
    curr = start_date
    while curr <= end_date:
        for f in festivals:
            if curr.month == f["month"] and curr.day == f["day"]:
                dt_str = curr.strftime('%Y-%m-%d')
                festival_date_map[dt_str] = f
                cursor.execute("""
                INSERT OR IGNORE INTO events (id, restaurant_id, name, date, impact_factor, category, description)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    f"event-{dt_str}",
                    DEMO_RESTAURANT_ID,
                    f["name"],
                    dt_str,
                    f["impact"],
                    f["cat"],
                    f"Annual {f['name']} celebration with significant customer influx."
                ))
        curr += timedelta(days=1)

    # Add a special upcoming festival for tomorrow/day after tomorrow to showcase the exact prompt flow!
    tomorrow = reference_date + timedelta(days=1)
    tomorrow_str = tomorrow.strftime('%Y-%m-%d')
    if tomorrow_str not in festival_date_map:
        cursor.execute("""
        INSERT OR REPLACE INTO events (id, restaurant_id, name, date, impact_factor, category, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            f"event-{tomorrow_str}",
            DEMO_RESTAURANT_ID,
            "Grand Diwali & Autumn Festival",
            tomorrow_str,
            1.35,
            "Festival",
            "Major cultural festival driving large family gatherings and evening dining."
        ))
        festival_date_map[tomorrow_str] = {
            "name": "Grand Diwali & Autumn Festival",
            "impact": 1.35,
            "cat": "Festival"
        }

    # 5. Generate Daily Sales & Historical Waste
    # We will seed each day up to yesterday
    sales_rows = []
    np.random.seed(42)
    random.seed(42)

    total_days = days_of_history
    for d in range(total_days):
        day_dt = start_date + timedelta(days=d)
        dt_str = day_dt.strftime('%Y-%m-%d')
        dow = day_dt.weekday()
        is_wknd = 1 if dow in [4, 5, 6] else 0
        dow_factor = DAY_FACTORS[dow]

        # Trend: steady 10% annual growth
        trend_factor = 1.0 + (d / total_days) * 0.12

        # Check festival
        fest = festival_date_map.get(dt_str)
        is_fest = 1 if fest else 0
        fest_impact = fest["impact"] if fest else 1.0
        event_name = fest["name"] if fest else None

        # Daily customer covers (correlated with demand)
        base_covers = 180.0 * dow_factor * trend_factor * fest_impact
        daily_covers = int(np.clip(np.random.normal(base_covers, 15.0), 90, 450))

        for item in ITEMS_CONFIG:
            # Expected portions
            mean_demand = item["base_daily"] * dow_factor * trend_factor * fest_impact
            # Noise
            std = item["std_dev"]
            qty_sold = max(5.0, round(np.random.normal(mean_demand, std), 0))

            # Historical food waste (unguided preparation wasted ~7-14% of portions)
            # Higher waste when demand unexpectedly dropped, or over-preparation occurred
            waste_rate = np.random.uniform(0.06, 0.13)
            # Sunday or high variance days sometimes had more leftovers
            if dow == 6:
                waste_rate += 0.03
            waste_qty = max(0.0, round(qty_sold * waste_rate + np.random.normal(0, 1.5), 0))

            sales_rows.append((
                DEMO_RESTAURANT_ID,
                item["id"],
                dt_str,
                qty_sold,
                daily_covers,
                waste_qty,
                dow,
                is_wknd,
                is_fest,
                event_name,
                "Clear" if random.random() > 0.2 else "Rainy",
                ""
            ))

    cursor.executemany("""
    INSERT INTO daily_sales (
        restaurant_id, item_id, date, quantity_sold, customers_count, waste_quantity,
        day_of_week, is_weekend, is_festival, event_name, weather, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, sales_rows)

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "restaurant_id": DEMO_RESTAURANT_ID,
        "restaurant_name": DEMO_RESTAURANT_NAME,
        "days_seeded": days_of_history,
        "items_count": len(ITEMS_CONFIG),
        "total_records": len(sales_rows),
        "reference_date": reference_date.strftime('%Y-%m-%d'),
        "tomorrow_date": tomorrow_str
    }

if __name__ == "__main__":
    result = seed_demo_data()
    print("Demo data seeded successfully:", result)
