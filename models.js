// IntelliChef Model Performance & Transparency Component
window.ModelsComponent = {
  backtestChartInstance: null,
  importanceChartInstance: null,
  selectedItemId: null,

  async render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
        <span class="ml-3 text-slate-600 font-medium">Evaluating chronological validation backtests across ML models...</span>
      </div>
    `;

    try {
      const data = await window.api.getModelPerformance(this.selectedItemId);
      this.selectedItemId = data.selected_item.id;

      container.innerHTML = `
        <div class="mb-4 p-3 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">DEV/ADMIN CONSOLE</span>
            <span>Technical machine-learning diagnostics and loss metrics. Hidden from normal restaurant workflow.</span>
          </div>
          <button onclick="window.router.navigate('dashboard')" class="text-emerald-700 font-bold hover:underline shrink-0 ml-4">
            ← Back to Restaurant Dashboard
          </button>
        </div>

        <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Developer / Model Diagnostics</h1>
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-white">
                ML Telemetry
              </span>
            </div>
            <p class="text-slate-500 text-sm mt-1">
              Underlying algorithm evaluation, holdout validation backtest telemetry, loss metrics (MAE, RMSE, MAPE), and feature attribution.
            </p>
          </div>

          <!-- Dish Switcher -->
          <div class="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <label class="text-xs font-bold text-slate-500">Inspect Dish:</label>
            <select 
              id="modelDishSelect" 
              onchange="window.ModelsComponent.changeItem(this.value)"
              class="text-sm font-semibold border-none bg-transparent focus:ring-0 text-slate-800 cursor-pointer"
            >
              ${data.items.map(item => `
                <option value="${item.id}" ${item.id === this.selectedItemId ? 'selected' : ''}>
                  ${item.name}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Model Selection Rationale Banner -->
        <div class="mb-6 p-5 rounded-xl bg-white border-2 border-emerald-500/20 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Selected Algorithm: ${data.selected_model}
                </span>
                <span class="text-xs text-slate-400">Target Dish: ${data.selected_item.name}</span>
              </div>
              <h3 class="text-base font-bold text-slate-900 mt-2">Selection & Parsimony Rationale</h3>
              <p class="text-sm text-slate-600 mt-1 leading-relaxed">
                ${data.selection_reason}
              </p>
            </div>
            <div class="hidden sm:flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
              <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Validation MAE</div>
              <div class="text-2xl font-black text-emerald-600 mt-0.5">${data.metrics[data.selected_model].mae}</div>
              <div class="text-[10px] text-slate-400">portions error</div>
            </div>
          </div>
        </div>

        <!-- 3-Model Comparison Table -->
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mb-8">
          <div class="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 class="font-bold text-slate-900 text-sm">Chronological Holdout Validation Benchmark</h3>
              <p class="text-xs text-slate-400">Strictly tested on unseen final historical window (No future data leakage)</p>
            </div>
            <span class="text-xs font-semibold text-slate-500">Evaluation Metrics</span>
          </div>

          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th class="py-3.5 px-4">Model Architecture</th>
                <th class="py-3.5 px-4 text-center">Status</th>
                <th class="py-3.5 px-4 text-center">Mean Absolute Error (MAE)</th>
                <th class="py-3.5 px-4 text-center">Root Mean Squared Error (RMSE)</th>
                <th class="py-3.5 px-4 text-center">MAPE (%)</th>
                <th class="py-3.5 px-4">Characteristics & Purpose</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <!-- 1. Baseline -->
              <tr class="${data.selected_model === 'Baseline' ? 'bg-emerald-50/50 font-semibold' : 'hover:bg-slate-50'} transition">
                <td class="py-3.5 px-4 font-bold text-slate-900">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full ${data.selected_model === 'Baseline' ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
                    <span>Statistical Baseline</span>
                  </div>
                  <div class="text-[10px] text-slate-400 font-normal">Day-of-Week Rolling Median + Trend Factor</div>
                </td>
                <td class="py-3.5 px-4 text-center">
                  ${data.selected_model === 'Baseline' 
                    ? '<span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Selected Winner</span>'
                    : '<span class="text-[10px] text-slate-400 font-medium">Benchmark</span>'}
                </td>
                <td class="py-3.5 px-4 text-center text-sm font-bold text-slate-900">${data.metrics.Baseline.mae}</td>
                <td class="py-3.5 px-4 text-center text-sm text-slate-700">${data.metrics.Baseline.rmse}</td>
                <td class="py-3.5 px-4 text-center text-sm text-slate-700">${data.metrics.Baseline.mape}%</td>
                <td class="py-3.5 px-4 text-slate-500 text-[11px]">Robust, immune to overfitting, establishes baseline hurdle for ML.</td>
              </tr>

              <!-- 2. Linear Regression -->
              <tr class="${data.selected_model === 'LinearRegression' ? 'bg-emerald-50/50 font-semibold' : 'hover:bg-slate-50'} transition">
                <td class="py-3.5 px-4 font-bold text-slate-900">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full ${data.selected_model === 'LinearRegression' ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
                    <span>Linear Regression (Ridge)</span>
                  </div>
                  <div class="text-[10px] text-slate-400 font-normal">L2 Regularized with Calendar & Lag Features</div>
                </td>
                <td class="py-3.5 px-4 text-center">
                  ${data.selected_model === 'LinearRegression' 
                    ? '<span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Selected Winner</span>'
                    : '<span class="text-[10px] text-slate-400 font-medium">Candidate</span>'}
                </td>
                <td class="py-3.5 px-4 text-center text-sm font-bold text-slate-900">${data.metrics.LinearRegression.mae}</td>
                <td class="py-3.5 px-4 text-center text-sm text-slate-700">${data.metrics.LinearRegression.rmse}</td>
                <td class="py-3.5 px-4 text-center text-sm text-slate-700">${data.metrics.LinearRegression.mape}%</td>
                <td class="py-3.5 px-4 text-slate-500 text-[11px]">Linear feature weighting; smooth monotonic adjustments.</td>
              </tr>

              <!-- 3. Random Forest -->
              <tr class="${data.selected_model === 'RandomForest' ? 'bg-emerald-50/50 font-semibold' : 'hover:bg-slate-50'} transition">
                <td class="py-3.5 px-4 font-bold text-slate-900">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full ${data.selected_model === 'RandomForest' ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
                    <span>Random Forest Regressor</span>
                  </div>
                  <div class="text-[10px] text-slate-400 font-normal">Ensemble of 80 regularized decision trees</div>
                </td>
                <td class="py-3.5 px-4 text-center">
                  ${data.selected_model === 'RandomForest' 
                    ? '<span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Selected Winner</span>'
                    : '<span class="text-[10px] text-slate-400 font-medium">Candidate</span>'}
                </td>
                <td class="py-3.5 px-4 text-center text-sm font-bold text-slate-900">${data.metrics.RandomForest.mae}</td>
                <td class="py-3.5 px-4 text-center text-sm text-slate-700">${data.metrics.RandomForest.rmse}</td>
                <td class="py-3.5 px-4 text-center text-sm text-slate-700">${data.metrics.RandomForest.mape}%</td>
                <td class="py-3.5 px-4 text-slate-500 text-[11px]">Captures non-linear festival interactions and cross-feature volatility.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Charts: Chronological Backtest & Feature Importance -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Backtest Chart -->
          <div class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-bold text-slate-900 text-sm">Chronological Backtest Visualizer</h3>
                <p class="text-xs text-slate-400">Actual sales vs Model forecasts over test window</p>
              </div>
              <span class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Holdout Test Set</span>
            </div>
            <div class="h-64">
              <canvas id="backtestChart"></canvas>
            </div>
          </div>

          <!-- Feature Importance Chart -->
          <div class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-bold text-slate-900 text-sm">Top Predictive Feature Importances</h3>
                <p class="text-xs text-slate-400">Factors driving demand variation (Random Forest weights)</p>
              </div>
              <span class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Normalized Gini</span>
            </div>
            <div class="h-64">
              <canvas id="importanceChart"></canvas>
            </div>
          </div>
        </div>
      `;

      this.renderBacktestChart(data.validation_backtest);
      this.renderImportanceChart(data.feature_importance);

    } catch (err) {
      container.innerHTML = `<div class="p-4 text-red-600">Error: ${err.message}</div>`;
    }
  },

  renderBacktestChart(backtest) {
    const ctx = document.getElementById('backtestChart');
    if (!ctx || !backtest.test_dates) return;
    if (this.backtestChartInstance) this.backtestChartInstance.destroy();

    this.backtestChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: backtest.test_dates.map(d => d.slice(5)),
        datasets: [
          {
            label: 'Actual Sales',
            data: backtest.actuals,
            borderColor: '#0f172a',
            backgroundColor: '#0f172a',
            borderWidth: 2.5,
            pointRadius: 3
          },
          {
            label: 'Random Forest',
            data: backtest.rf_preds,
            borderColor: '#059669',
            borderWidth: 2,
            borderDash: [3, 2],
            pointRadius: 2
          },
          {
            label: 'Baseline',
            data: backtest.baseline_preds,
            borderColor: '#94a3b8',
            borderWidth: 1.5,
            borderDash: [4, 4],
            pointRadius: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: { beginAtZero: false, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } }
        }
      }
    });
  },

  renderImportanceChart(importanceDict) {
    const ctx = document.getElementById('importanceChart');
    if (!ctx || !importanceDict) return;
    if (this.importanceChartInstance) this.importanceChartInstance.destroy();

    const labels = Object.keys(importanceDict);
    const values = Object.values(importanceDict).map(v => (v * 100).toFixed(1));

    this.importanceChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: '#059669',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.raw}% predictive influence`
            }
          }
        },
        scales: {
          x: { beginAtZero: true, max: 100, ticks: { font: { size: 10 }, callback: v => v + '%' } },
          y: { ticks: { font: { size: 11, weight: 'bold' } } }
        }
      }
    });
  },

  async changeItem(itemId) {
    this.selectedItemId = itemId;
    await this.render(document.getElementById('main-content'));
  }
};
