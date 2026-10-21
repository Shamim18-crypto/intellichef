# IntelliChef — Prepare smarter. Waste less.

> **AI-powered demand forecasting and food-waste reduction platform for restaurants.**
>
> *Central Mission:* **Know what your customers are likely to order. Prepare what you need. Waste less.**
> *Core Objective:* **Minimize food waste while maintaining food availability.**

---

## 1. What Was Built

**IntelliChef** is a complete, production-quality SaaS web application designed for restaurant managers, chefs, and food operators. The platform learns from historical restaurant sales data to generate daily item-level preparation quantities, compute statistical safety buffers, deduct usable pre-existing inventory, and provide transparent explanations for every decision.

### Key Capabilities Built:
- **Executive Overview Dashboard**: High-level KPIs, 30-day sales vs unguided waste trends, day-of-week seasonality curve, active upcoming festival alerts, and estimated monthly food waste saved ($ and kg).
- **Daily Preparation Recommendations Engine**: Signature preparation cards detailing Expected Demand, Safety Buffer, Usable Pre-existing Stock (with inline +/- adjusters), and Recommended Preparation Portions, complete with Confidence Score and transparent "Why?" explanations.
- **Kitchen Daily Prep Sheet**: Station-by-station kitchen checklist (Main Courses, Tandoor / Grill, Breads, Desserts) with printable layout, checkbox completion tracking, and chef sign-off.
- **Demand Forecasting & What-If Simulator**: Item-level historical trends and interactive scenario simulation where managers can test customer cover volume shifts (-30% to +50%) and risk strategies in real time.
- **Food Waste Analytics & Prevention**: Financial loss breakdown by dish and category, historical food waste rate tracking, and actionable mitigation guidance (multi-batch prep, protein buffer prudence).
- **ML Model Transparency & Backtesting**: Chronological holdout validation comparing Statistical Baseline vs Ridge Linear Regression vs Random Forest Regressor; displays MAE, RMSE, MAPE, feature importances, and selection rationale.
- **Festival & Holiday Intelligence**: Calendar management for recurring and custom events (Diwali, New Year's Eve, Valentine's Day, local sports finals) with calibrated demand multipliers.
- **CSV Data Import Wizard**: Smart column auto-detection, schema and date validation, preview table with error badges, and database ingestion for new restaurant onboarding.
- **Multi-Tenant Isolation & Risk Settings**: Isolated database storage per restaurant tenant; adjustable buffer strategies (Conservative 98%, Balanced 93%, Lean 85%).

---

## 2. Technology Stack

- **Backend**: Python 3.15, FastAPI, Uvicorn, Pydantic, SQLite3 (foreign key enforcement enabled).
- **Machine Learning & Analytics**: Scikit-Learn (`RandomForestRegressor`, `Ridge`), Pandas, NumPy.
- **Frontend**: Clean vanilla JavaScript SPA (ES6+ modular architecture), Tailwind CSS (CDN), Chart.js (responsive canvas charts), custom print stylesheet.
- **Testing**: Python `unittest`, Starlette/FastAPI `TestClient`, `httpx`.

---

## 3. Machine Learning Approach

IntelliChef strictly adheres to the principle of **parsimony and chronological validation**:

1. **Candidate Models Implemented**:
   - **Statistical Baseline**: 6-week rolling day-of-week median, scaled by 7-day trend momentum and festival multipliers.
   - **Linear Regression (Ridge)**: L2-regularized linear model trained on day-of-week one-hot encodings, lag features (`lag_1`, `lag_7`, `lag_14`), rolling statistics (`rolling_mean_7`, `rolling_std_7`), and customer counts.
   - **Random Forest Regressor**: 80 regularized decision trees capturing complex non-linear interactions, weekend effects, and event spikes.

2. **Validation Without Data Leakage**:
   - Models are evaluated strictly on a chronological holdout validation window (the most recent 14–20% of data). No future data leakage.
   - Metrics computed: **MAE** (Mean Absolute Error), **RMSE** (Root Mean Squared Error), and **MAPE** (Mean Absolute Percentage Error).

3. **Automated Parsimony Selection Rule**:
   - Random Forest or Linear Regression is chosen only if it outperforms the simpler Statistical Baseline MAE by at least 4% on the chronological holdout test.
   - If ML fails to outperform the baseline or data volume is below the cold-start threshold (< 14 rows), the Statistical Baseline is transparently selected, and the rationale is displayed in the UI.

4. **Preparation Formula & Safety Buffer**:
   $$\text{Safety Buffer} = \lceil Z \times \sigma_{\text{demand}} \rceil$$
   $$\text{Recommended Preparation} = \max(0, \text{Expected Demand} + \text{Safety Buffer} - \text{Usable Inventory})$$
   Where $Z$ represents the critical fractile corresponding to the chosen service level ($Z = 2.05$ for Conservative 98%, $Z = 1.48$ for Balanced 93%, $Z = 1.04$ for Lean 85%).

---

## 4. Database Structure

SQLite database located at `data/intellichef.db` with foreign key enforcement:

- `restaurants`: Restaurant profiles, cuisine, location, buffer strategy (`conservative`, `balanced`, `lean`), service level, cost of stockout multiplier.
- `items`: Menu items, categories, cost price, selling price, shelf life in days, units.
- `daily_sales`: Daily historical transactions per restaurant item: `date`, `quantity_sold`, `customers_count`, `waste_quantity`, `day_of_week`, `is_weekend`, `is_festival`, `weather`.
- `events`: Festivals and local calendar events with `date`, `impact_factor`, and category.
- `inventory`: Current usable walk-in stock levels per item, updated daily.
- `model_metrics`: Historical chronological validation benchmarks (`mae`, `rmse`, `mape`, `is_selected`) per model and item.
- `prep_recommendations`: Daily generated recommendations cache with explanation payloads.

---

## 5. How to Run

### Quick Start (Single Command):
```bash
git clone https://github.com/Shamim18-crypto/intellichef.git
cd intellichef
python run.py
```
This automatically initializes the database, seeds 365 days of realistic demo restaurant data if empty, starts the FastAPI Uvicorn server at `http://127.0.0.1:8000`, and opens the browser.

### Running Individual Test Suites:
```bash
# Run Core Backend & ML Unit Tests
python -m backend.test_backend

# Run Full REST API End-to-End Integration Tests
python -m backend.test_api
```

---

## 6. Required Environment Variables

None required. IntelliChef runs out of the box with zero external API key requirements. The SQLite database is created locally, and the ML engine runs locally on CPU with Scikit-learn.

---

## 7. Automated Tests Performed

- **Database & Seeding Tests**: Validated schema generation, foreign key constraints, and 365-day historical seeding with day-of-week patterns and festival boosts.
- **ML Engine Tests**: Verified chronological backtesting, candidate evaluation (Baseline, Linear, Random Forest), parsimony selection, and confidence score generation.
- **Preparation Formula Tests**: Verified exact computation of expected demand, safety buffer, usable inventory deduction, and expected waste cost.
- **CSV Import Tests**: Tested auto-column mapping, date format validation, missing column flagging, and multi-tenant ingestion.
- **REST API Integration Tests**: All 9 API test cases passed (`test_01` through `test_09` in 1.3s), validating JSON response structures and static file serving.
- **Live Background Server Verification**: Tested live background process using `Invoke-RestMethod` across `/api/restaurants` and `/api/restaurants/demo-restaurant-001/recommendations`.

---

## 8. Genuine Remaining Limitations

1. **Weather Live Forecast Integration**: Weather impact is modeled as historical factors; dynamic real-time 7-day live meteorological API feeds (e.g. OpenWeatherMap) would require an external API key.
2. **POS Automated Webhook Sync**: Currently supports CSV import and manual inventory adjustments; direct two-way live webhook sync (e.g. Toast / Square OAuth) requires individual restaurant merchant credentials.
3. **Multi-Kitchen Commissary Aggregation**: The current release focuses on individual restaurant locations; central kitchen commissary batch dispatching across multiple satellite branches would require an enterprise hierarchical inventory layer.
