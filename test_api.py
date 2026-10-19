import unittest
import os
import json
from fastapi.testclient import TestClient

from backend.app import app
from backend.database import init_db
from backend.demo_generator import seed_demo_data, DEMO_RESTAURANT_ID

class TestIntelliChefAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        seed_demo_data(days_of_history=90)
        cls.client = TestClient(app)

    def test_01_index_html(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("IntelliChef", res.text)
        self.assertIn("Prepare smarter. Waste less.", res.text)

    def test_02_restaurants_list(self):
        res = self.client.get("/api/restaurants")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("restaurants", data)
        self.assertTrue(len(data["restaurants"]) >= 1)

    def test_03_dashboard_summary(self):
        res = self.client.get(f"/api/restaurants/{DEMO_RESTAURANT_ID}/summary")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("forecast_accuracy_pct", data)
        self.assertIn("monthly_waste_savings_dollars", data)
        self.assertIn("target_date", data)
        self.assertGreater(data["items_tracked"], 5)

    def test_04_recommendations_and_why(self):
        res = self.client.get(f"/api/restaurants/{DEMO_RESTAURANT_ID}/recommendations")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("recommendations", data)
        self.assertIn("summary", data)
        recs = data["recommendations"]
        self.assertGreater(len(recs), 0)
        
        # Check first rec structure
        first_rec = recs[0]
        self.assertIn("item_name", first_rec)
        self.assertIn("expected_demand", first_rec)
        self.assertIn("safety_buffer", first_rec)
        self.assertIn("usable_inventory", first_rec)
        self.assertIn("recommended_prep", first_rec)
        self.assertIn("confidence_score", first_rec)
        self.assertIn("why_explanations", first_rec)
        self.assertTrue(len(first_rec["why_explanations"]) >= 2)

    def test_05_inventory_update(self):
        # Update inventory for an item
        payload = {
            "inventory": [
                {"item_id": "item-biryani-01", "usable_quantity": 25}
            ]
        }
        res = self.client.put(f"/api/restaurants/{DEMO_RESTAURANT_ID}/inventory", json=payload)
        self.assertEqual(res.status_code, 200)

        # Verify inventory endpoint
        inv_res = self.client.get(f"/api/restaurants/{DEMO_RESTAURANT_ID}/inventory")
        self.assertEqual(inv_res.status_code, 200)
        inv_list = inv_res.json()["inventory"]
        biryani_inv = next(it for it in inv_list if it["item_id"] == "item-biryani-01")
        self.assertEqual(biryani_inv["usable_quantity"], 25)

    def test_06_analytics_endpoints(self):
        # Sales
        res_sales = self.client.get(f"/api/restaurants/{DEMO_RESTAURANT_ID}/analytics/sales?days=30")
        self.assertEqual(res_sales.status_code, 200)
        self.assertIn("total_sales", res_sales.json())

        # Waste
        res_waste = self.client.get(f"/api/restaurants/{DEMO_RESTAURANT_ID}/analytics/waste")
        self.assertEqual(res_waste.status_code, 200)
        self.assertIn("by_item", res_waste.json())
        self.assertIn("by_category", res_waste.json())

        # Day of Week
        res_dow = self.client.get(f"/api/restaurants/{DEMO_RESTAURANT_ID}/analytics/day-of-week")
        self.assertEqual(res_dow.status_code, 200)
        self.assertEqual(len(res_dow.json()["days"]), 7)

    def test_07_events_crud(self):
        # Add event
        new_event = {
            "name": "Champions League Final Night",
            "date": "2026-11-15",
            "impact_factor": 1.40,
            "category": "Sporting",
            "description": "Packed bar and dining service"
        }
        add_res = self.client.post(f"/api/restaurants/{DEMO_RESTAURANT_ID}/events", json=new_event)
        self.assertEqual(add_res.status_code, 200)
        ev_id = add_res.json()["id"]

        # Verify listed
        list_res = self.client.get(f"/api/restaurants/{DEMO_RESTAURANT_ID}/events")
        evs = list_res.json()["events"]
        self.assertTrue(any(e["id"] == ev_id for e in evs))

        # Delete event
        del_res = self.client.delete(f"/api/restaurants/{DEMO_RESTAURANT_ID}/events/{ev_id}")
        self.assertEqual(del_res.status_code, 200)

    def test_08_models_transparency_and_backtest(self):
        res = self.client.get(f"/api/restaurants/{DEMO_RESTAURANT_ID}/models?item_id=item-biryani-01")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("selected_model", data)
        self.assertIn("selection_reason", data)
        self.assertIn("metrics", data)
        self.assertIn("feature_importance", data)
        self.assertIn("validation_backtest", data)
        
        # Check all 3 candidate models are benchmarked
        metrics = data["metrics"]
        self.assertIn("Baseline", metrics)
        self.assertIn("LinearRegression", metrics)
        self.assertIn("RandomForest", metrics)

    def test_09_settings_get_and_put(self):
        res = self.client.get(f"/api/restaurants/{DEMO_RESTAURANT_ID}/settings")
        self.assertEqual(res.status_code, 200)
        
        put_res = self.client.put(f"/api/restaurants/{DEMO_RESTAURANT_ID}/settings", json={
            "buffer_strategy": "lean",
            "service_level": 0.85
        })
        self.assertEqual(put_res.status_code, 200)

        # Check updated
        verify_res = self.client.get(f"/api/restaurants/{DEMO_RESTAURANT_ID}/settings")
        self.assertEqual(verify_res.json()["buffer_strategy"], "lean")

if __name__ == "__main__":
    unittest.main()
