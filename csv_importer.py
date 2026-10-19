import io
import re
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
import uuid
from backend.database import get_db_connection

COLUMN_CANDIDATES = {
    'date': ['date', 'sale_date', 'order_date', 'timestamp', 'day', 'transaction_date'],
    'item_name': ['item', 'item_name', 'dish', 'product', 'menu_item', 'name', 'food_item', 'sku'],
    'quantity_sold': ['quantity', 'qty', 'quantity_sold', 'portions', 'units_sold', 'orders', 'sales_qty', 'count'],
    'category': ['category', 'section', 'item_category', 'course', 'group', 'type'],
    'customers_count': ['customers', 'covers', 'guests', 'pax', 'total_customers', 'customer_count'],
    'waste_quantity': ['waste', 'waste_quantity', 'waste_qty', 'spoilage', 'unsold', 'food_waste', 'leftover'],
    'cost_price': ['cost', 'cost_price', 'unit_cost', 'ingredient_cost'],
    'selling_price': ['price', 'selling_price', 'unit_price', 'menu_price']
}

def auto_detect_columns(columns: List[str]) -> Dict[str, Optional[str]]:
    """
    Intelligently maps raw CSV column headers to canonical IntelliChef fields.
    """
    mapping = {k: None for k in COLUMN_CANDIDATES.keys()}
    clean_cols = {col: re.sub(r'[^a-z0-9_]', '', col.lower().strip()) for col in columns}

    for standard_key, candidates in COLUMN_CANDIDATES.items():
        for col_orig, col_clean in clean_cols.items():
            if col_clean in candidates:
                mapping[standard_key] = col_orig
                break
        # If not exact match, check substring
        if not mapping[standard_key]:
            for col_orig, col_clean in clean_cols.items():
                if any(cand in col_clean for cand in candidates):
                    mapping[standard_key] = col_orig
                    break

    return mapping

def parse_and_validate_csv(
    file_content: str,
    column_mapping: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Parses CSV, suggests column mapping, performs validation checks:
    - Missing required columns
    - Date format parsing
    - Null or negative values
    - Date range and total rows
    """
    try:
        df = pd.read_csv(io.StringIO(file_content))
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to parse CSV file: {str(e)}"
        }

    raw_columns = list(df.columns)
    suggested_mapping = auto_detect_columns(raw_columns)
    mapping = column_mapping if column_mapping else suggested_mapping

    # Required: date, item_name, quantity_sold
    required_fields = ['date', 'item_name', 'quantity_sold']
    missing_required = [f for f in required_fields if not mapping.get(f) or mapping.get(f) not in df.columns]

    issues: List[str] = []
    warnings: List[str] = []

    if missing_required:
        issues.append(f"Missing required fields: {', '.join(missing_required)}. Please map these columns.")
        return {
            "success": False,
            "columns": raw_columns,
            "suggested_mapping": suggested_mapping,
            "issues": issues,
            "preview_rows": df.head(5).to_dict(orient="records"),
            "total_rows": len(df)
        }

    date_col = mapping['date']
    item_col = mapping['item_name']
    qty_col = mapping['quantity_sold']

    # Date parsing test
    try:
        parsed_dates = pd.to_datetime(df[date_col], errors='coerce')
        invalid_dates_count = int(parsed_dates.isnull().sum())
        if invalid_dates_count > 0:
            issues.append(f"{invalid_dates_count} rows have invalid or unparseable dates.")
        min_date = parsed_dates.dropna().min().strftime('%Y-%m-%d') if not parsed_dates.dropna().empty else None
        max_date = parsed_dates.dropna().max().strftime('%Y-%m-%d') if not parsed_dates.dropna().empty else None
    except Exception as e:
        issues.append(f"Date conversion error: {str(e)}")
        min_date, max_date = None, None

    # Quantity checks
    try:
        numeric_qty = pd.to_numeric(df[qty_col], errors='coerce')
        nan_qty = int(numeric_qty.isnull().sum())
        neg_qty = int((numeric_qty < 0).sum())
        if nan_qty > 0:
            warnings.append(f"{nan_qty} rows have non-numeric quantities (will be imputed with 0).")
        if neg_qty > 0:
            warnings.append(f"{neg_qty} rows have negative quantities (will be clipped to 0).")
    except Exception as e:
        issues.append(f"Quantity column validation error: {str(e)}")

    unique_items = int(df[item_col].dropna().nunique())
    if unique_items == 0:
        issues.append("No distinct items found in the item column.")

    is_valid = len(issues) == 0

    return {
        "success": is_valid,
        "columns": raw_columns,
        "mapping": mapping,
        "suggested_mapping": suggested_mapping,
        "total_rows": len(df),
        "unique_items_count": unique_items,
        "date_range": {"min": min_date, "max": max_date},
        "issues": issues,
        "warnings": warnings,
        "preview_rows": df.head(8).to_dict(orient="records")
    }

def import_csv_to_db(
    restaurant_id: str,
    file_content: str,
    column_mapping: Dict[str, str],
    reference_date_str: Optional[str] = None
) -> Dict[str, Any]:
    """
    Ingests validated CSV rows into SQLite database for the specified restaurant.
    Creates new items if they don't exist.
    """
    df = pd.read_csv(io.StringIO(file_content))
    conn = get_db_connection()
    cursor = conn.cursor()

    date_col = column_mapping['date']
    item_col = column_mapping['item_name']
    qty_col = column_mapping['quantity_sold']
    cat_col = column_mapping.get('category')
    covers_col = column_mapping.get('customers_count')
    waste_col = column_mapping.get('waste_quantity')
    cost_col = column_mapping.get('cost_price')
    price_col = column_mapping.get('selling_price')

    # Convert dates
    df['clean_date'] = pd.to_datetime(df[date_col], errors='coerce')
    df = df.dropna(subset=['clean_date', item_col]).copy()
    df['date_str'] = df['clean_date'].dt.strftime('%Y-%m-%d')
    df['day_of_week'] = df['clean_date'].dt.dayofweek
    df['is_weekend'] = df['day_of_week'].isin([4, 5, 6]).astype(int)

    # Clean numeric columns
    df['clean_qty'] = pd.to_numeric(df[qty_col], errors='coerce').fillna(0).clip(lower=0)

    # Ensure restaurant exists
    cursor.execute("SELECT id FROM restaurants WHERE id = ?", (restaurant_id,))
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO restaurants (id, name, cuisine, location)
        VALUES (?, ?, 'Custom Upload', 'Primary Location')
        """, (restaurant_id, f"Uploaded Restaurant ({restaurant_id})"))

    # Cache existing items for this restaurant
    cursor.execute("SELECT id, name FROM items WHERE restaurant_id = ?", (restaurant_id,))
    existing_items = {row['name'].strip().lower(): row['id'] for row in cursor.fetchall()}

    # Track distinct items in CSV
    unique_names = df[item_col].unique()
    new_items_created = 0

    for name in unique_names:
        name_clean = str(name).strip()
        if not name_clean:
            continue
        key = name_clean.lower()
        if key not in existing_items:
            item_id = f"item-{uuid.uuid4().hex[:8]}"
            # Determine category, cost, price if available
            subset = df[df[item_col] == name]
            cat = str(subset[cat_col].iloc[0]) if (cat_col and cat_col in df.columns and not pd.isna(subset[cat_col].iloc[0])) else "Main Course"
            cost = float(subset[cost_col].iloc[0]) if (cost_col and cost_col in df.columns and not pd.isna(subset[cost_col].iloc[0])) else 5.0
            price = float(subset[price_col].iloc[0]) if (price_col and price_col in df.columns and not pd.isna(subset[price_col].iloc[0])) else 15.0

            cursor.execute("""
            INSERT INTO items (id, restaurant_id, name, category, cost_price, selling_price, shelf_life_days, unit)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (item_id, restaurant_id, name_clean, cat, cost, price, 1, 'portions'))

            cursor.execute("""
            INSERT OR IGNORE INTO inventory (restaurant_id, item_id, usable_quantity)
            VALUES (?, ?, ?)
            """, (restaurant_id, item_id, 0))

            existing_items[key] = item_id
            new_items_created += 1

    # Insert daily sales records
    inserted_count = 0
    sales_batch = []

    for _, row in df.iterrows():
        item_name = str(row[item_col]).strip()
        item_id = existing_items.get(item_name.lower())
        if not item_id:
            continue

        date_str = row['date_str']
        qty = float(row['clean_qty'])
        covers = int(pd.to_numeric(row[covers_col], errors='coerce') or int(qty * 1.4)) if (covers_col and covers_col in df.columns) else int(qty * 1.4)
        waste = float(pd.to_numeric(row[waste_col], errors='coerce') or 0.0) if (waste_col and waste_col in df.columns) else 0.0
        dow = int(row['day_of_week'])
        is_wknd = int(row['is_weekend'])

        sales_batch.append((
            restaurant_id,
            item_id,
            date_str,
            qty,
            covers,
            waste,
            dow,
            is_wknd,
            0,
            None,
            'Normal',
            'CSV Import'
        ))

    cursor.executemany("""
    INSERT OR REPLACE INTO daily_sales (
        restaurant_id, item_id, date, quantity_sold, customers_count, waste_quantity,
        day_of_week, is_weekend, is_festival, event_name, weather, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, sales_batch)

    conn.commit()
    conn.close()

    return {
        "success": True,
        "rows_imported": len(sales_batch),
        "new_items_created": new_items_created,
        "date_range": {
            "start": df['date_str'].min(),
            "end": df['date_str'].max()
        }
    }
