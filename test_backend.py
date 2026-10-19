import unittest
import os
import json
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

from backend.database import init_db, get_db_connection
from backend.ml_engine import MLEngine
from backend.prep_recommender import PrepRecommender
from backend.demo_generator import seed_demo_data, DEMO_RESTAURANT_ID
from backend.csv_importer import parse_and_validate_csv, import_csv_to_db

class TestIntelliChefCore(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        # Seed demo data
        cls.seed_res = seed_demo_data(days_of_history=120)

    def test_01_database_and_demo_seed(self):
        self.assertEqual(self.seed_res["status"], "success")
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT COUNT(*) as cnt FROM items WHERE restaurant_id = ?", (DEMO_RESTAURANT_ID,))
        items_cnt = c.fetchone()['cnt']
        self.assertGreaterEqual(items_cnt, 8)

        c.execute("SELECT COUNT(*) as cnt FROM daily_sales WHERE restaurant_id = ?", (DEMO_RESTAURANT_ID,))
        sales_cnt = c.fetchone()['cnt']
        self.assertGreaterEqual(sales_cnt, 800)
        conn.close()

    def test_02_ml_engine_models_and_chronological_validation(self):
        conn = get_db_connection()
        sales_df = pd.read_sql_query("""
        SELECT date, quantity_sold, customers_count, waste_quantity, day_of_week, is_weekend, is_festival
        FROM daily_sales
        WHERE restaurant_id = ? AND item_id = 'item-biryani-01'
        ORDER BY date ASC
        """, conn, params=(DEMO_RESTAURANT_ID,))
        conn.close()

        ml = MLEngine()
        eval_res = ml.train_and_evaluate(sales_df)
        
        # Must evaluate Baseline, LinearRegression, and RandomForest
        metrics = eval_res["metrics"]
        self.assertIn("Baseline", metrics)
        self.assertIn("LinearRegression", metrics)
        self.assertIn("RandomForest", metrics)

        # Chronological validation metrics must be positive numbers
        for m_name in ["Baseline", "LinearRegression", "RandomForest"]:
            self.assertGreater(metrics[m_name]["mae"], 0.0)
            self.assertGreater(metrics[m_name]["rmse"], 0.0)

        # Selected model must be one of the three
        self.assertIn(eval_res["selected_model"], ["Baseline", "LinearRegression", "RandomForest"])
        self.assertTrue(len(eval_res["selection_reason"]) > 10)

        # Test point forecast for tomorrow
        target_date_str = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        pred = ml.predict_target(
            item_sales_df=sales_df,
            target_date_str=target_date_str,
            event_info={"name": "Grand Festival", "impact_factor": 1.35},
            train_result=eval_res
        )

        self.assertGreater(pred["expected_demand"], 10.0)
        self.assertGreater(pred["confidence_score"], 60.0)
        self.assertTrue(len(pred["explanations"]) >= 3)
        print("ML Prediction for Biryani:", pred)

    def test_03_prep_recommender_formula_and_safety_buffer(self):
        # Test case: Expected demand 185, std 8.0, usable inventory 20
        # Service level balanced (0.93, Z ~ 1.48) -> buffer = round(1.48 * 8.0) = 12
        # Gross = 185 + 12 = 197. Usable = 20. Net prep = 197 - 20 = 177.
        rec = PrepRecommender.calculate_recommendation(
            item_name="Hyderabadi Dum Biryani",
            expected_demand=185.0,
            demand_std=8.0,
            usable_inventory=20.0,
            cost_price=6.50,
            selling_price=19.50,
            buffer_strategy="balanced"
        )
        self.assertEqual(rec["expected_demand"], 185)
        self.assertEqual(rec["usable_inventory"], 20)
        self.assertEqual(rec["safety_buffer"], 12)
        self.assertEqual(rec["recommended_prep"], 185 + 12 - 20)
        self.assertGreater(rec["confidence_score"], 70.0)
        self.assertTrue(any("buffer" in exp.lower() for exp in rec["why_explanations"]))
        print("Prep Recommendation Test:", rec)

    def test_04_csv_validation_and_import(self):
        sample_csv = """Date,Item,Quantity,Category,Cost,Price,Waste
2026-10-01,Chicken Tikka,45,Appetizer,4.0,12.0,3
2026-10-02,Chicken Tikka,50,Appetizer,4.0,12.0,4
2026-10-03,Chicken Tikka,62,Appetizer,4.0,12.0,2
2026-10-04,Chicken Tikka,70,Appetizer,4.0,12.0,5
2026-10-05,Chicken Tikka,58,Appetizer,4.0,12.0,3
"""
        validation = parse_and_validate_csv(sample_csv)
        self.assertTrue(validation["success"])
        self.assertEqual(validation["unique_items_count"], 1)
        self.assertIn("Chicken Tikka", str(validation["preview_rows"]))

        # Test Import into temporary restaurant
        import_res = import_csv_to_db(
            restaurant_id="test-csv-rest",
            file_content=sample_csv,
            column_mapping=validation["suggested_mapping"]
        )
        self.assertTrue(import_res["success"])
        self.assertEqual(import_res["rows_imported"], 5)

if __name__ == "__main__":
    unittest.main()
