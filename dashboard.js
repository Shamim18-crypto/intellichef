// IntelliChef Dashboard Component
window.DashboardComponent = {
  chartInstances: {},

  async render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
        <span class="ml-3 text-slate-600 font-medium">Loading restaurant demand forecast...</span>
      </div>
    `;

    try {
      const summary = await window.api.getSummary();
      const recData = await window.api.getRecommendations();
      const salesData = await window.api.getSalesAnalytics(30);
      const dowData = await window.api.getDayOfWeekAnalytics();

      const topRecs = recData.recommendations.slice(0, 4);
      const biryaniRec = recData.recommendations.find(r => r.item_name.toLowerCase().includes('biryani')) || topRecs[0];

      let festivalAlertHtml = '';
      if (summary.upcoming_event) {
        const ev = summary.upcoming_event;
        const lift = Math.round((ev.impact_factor - 1.0) * 100);
        festivalAlertHtml = `
          <div class="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 festival-active-glow">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                🎉
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="font-bold text-amber-900">${ev.name}</h4>
                  <span class="text-xs bg-amber-200 text-amber-800 font-semibold px-2 py-0.5 rounded-full">${ev.category}</span>
                </div>
                <p class="text-sm text-amber-800 mt-0.5">
                  Scheduled for <strong>${ev.date}</strong>. Historical demand factor indicates 
                  <span class="font-bold text-amber-900">+${lift}% surge</span> across dining covers. Prep quantities automatically calibrated.
                </p>
              </div>
            </div>
            <button onclick="window.router.navigate('events')" class="text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-lg transition shrink-0">
              View Festival Calendar →
            </button>
          </div>
        `;
      }

      container.innerHTML = `
        <!-- Welcome & Brand Mission -->
        <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Executive Overview</span>
              <span class="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Forecasting Active
              </span>
            </h1>
            <p class="text-slate-500 text-sm mt-1">
              Know what your customers are likely to order. Prepare what you need. Waste less.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.router.navigate('recommendations')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition flex items-center gap-2">
              <span>🍳</span>
              <span>Tomorrow's Prep (${recData.summary.total_recommended_prep} portions)</span>
            </button>
            <button onclick="window.router.navigate('prep_sheet')" class="bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm transition flex items-center gap-2">
              <span>📋</span>
              <span>Kitchen Prep Sheet</span>
            </button>
          </div>
        </div>

        ${festivalAlertHtml}

        <!-- 4 Key Performance Indicators -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <!-- KPI 1: Forecast Accuracy -->
          <div class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm card-hover">
            <div class="flex items-center justify-between text-slate-500 mb-2">
              <span class="text-xs font-semibold uppercase tracking-wider">Prediction Accuracy</span>
              <span class="p-1.5 rounded-md bg-emerald-50 text-emerald-600">🎯</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-extrabold text-slate-900">High</span>
              <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">${summary.forecast_accuracy_pct}% Match</span>
            </div>
            <p class="text-xs text-slate-400 mt-2">Based on your verified sales history</p>
          </div>

          <!-- KPI 2: Monthly Waste Saved -->
          <div class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm card-hover">
            <div class="flex items-center justify-between text-slate-500 mb-2">
              <span class="text-xs font-semibold uppercase tracking-wider">Est. Monthly Savings</span>
              <span class="p-1.5 rounded-md bg-emerald-50 text-emerald-600">💰</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-extrabold text-slate-900">$${summary.monthly_waste_savings_dollars.toLocaleString()}</span>
              <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">~38% Less Waste</span>
            </div>
            <p class="text-xs text-slate-400 mt-2">${summary.monthly_waste_reduced_kg} kg food rescued / month</p>
          </div>

          <!-- KPI 3: Tomorrow's Recommended Prep -->
          <div class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm card-hover">
            <div class="flex items-center justify-between text-slate-500 mb-2">
              <span class="text-xs font-semibold uppercase tracking-wider">Tomorrow's Prep Total</span>
              <span class="p-1.5 rounded-md bg-blue-50 text-blue-600">🍲</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-extrabold text-slate-900">${recData.summary.total_recommended_prep}</span>
              <span class="text-xs text-slate-500">portions across ${recData.summary.total_items} dishes</span>
            </div>
            <p class="text-xs text-slate-400 mt-2">${recData.summary.total_usable_inventory} portions already in stock</p>
          </div>

          <!-- KPI 4: Risk Strategy -->
          <div class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm card-hover">
            <div class="flex items-center justify-between text-slate-500 mb-2">
              <span class="text-xs font-semibold uppercase tracking-wider">Buffer Strategy</span>
              <span class="p-1.5 rounded-md bg-purple-50 text-purple-600">🛡️</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-slate-900 capitalize">${summary.buffer_strategy}</span>
              <span class="text-xs font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">${Math.round(summary.service_level * 100)}% Availability</span>
            </div>
            <p class="text-xs text-slate-400 mt-2">Balances stockout risk vs overproduction</p>
          </div>
        </div>

        <!-- Featured Spotlight: Tomorrow's Signature Recommendation Card -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🌟 Featured Preparation Recommendation</span>
              <span class="text-xs font-normal text-slate-500">(Target Date: ${recData.target_date} — ${recData.day_of_week})</span>
            </h3>
            <button onclick="window.router.navigate('recommendations')" class="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              View All ${recData.recommendations.length} Menu Items →
            </button>
          </div>

          <div class="bg-white rounded-2xl p-6 border-2 border-emerald-500/20 shadow-sm">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    ${biryaniRec.category}
                  </span>
                  <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">High Confidence Pattern</span>
                </div>
                <h2 class="text-2xl font-black text-slate-900 tracking-tight">${biryaniRec.item_name}</h2>
                <p class="text-sm text-slate-500 mt-0.5">Calculated prep targets balancing demand uncertainty and shelf-life</p>
              </div>

              <!-- Recommendation Math Strip -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                <div class="text-center">
                  <div class="text-xs text-slate-500">Expected Demand</div>
                  <div class="text-xl font-bold text-slate-800">${biryaniRec.expected_demand} <span class="text-xs font-normal">portions</span></div>
                </div>
                <div class="text-center border-l border-slate-200">
                  <div class="text-xs text-slate-500">Safety Buffer</div>
                  <div class="text-xl font-bold text-emerald-600">+${biryaniRec.safety_buffer}</div>
                </div>
                <div class="text-center border-l border-slate-200">
                  <div class="text-xs text-slate-500">Usable Inventory</div>
                  <div class="text-xl font-bold text-amber-600">-${biryaniRec.usable_inventory}</div>
                </div>
                <div class="text-center border-l border-slate-200 bg-emerald-600 text-white -my-4 -mr-4 p-4 rounded-r-xl">
                  <div class="text-xs text-emerald-100 font-medium">Recommended Prep</div>
                  <div class="text-2xl font-black">${biryaniRec.recommended_prep}</div>
                </div>
              </div>
            </div>

            <!-- "Why?" Section -->
            <div class="mt-5">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <span class="text-emerald-600">💡</span> Why this recommendation?
                </h4>
                <div class="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <span>Prediction confidence:</span>
                  <span class="font-extrabold">${biryaniRec.confidence_level || (biryaniRec.confidence_score >= 85 ? 'High' : 'Moderate')}</span>
                </div>
              </div>
              <ul class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-700">
                ${biryaniRec.why_explanations.map(exp => `
                  <li class="flex items-start gap-2 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                    <span class="text-emerald-500 font-bold mt-0.5">•</span>
                    <span>${exp}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Chart 1: Historical Sales vs Waste -->
          <div class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-bold text-slate-900 text-sm">30-Day Sales & Waste Trend</h3>
                <p class="text-xs text-slate-400">Total portions served vs unguided waste</p>
              </div>
              <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Daily Aggregates</span>
            </div>
            <div class="h-64">
              <canvas id="salesWasteChart"></canvas>
            </div>
          </div>

          <!-- Chart 2: Day-of-Week Demand Curve -->
          <div class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-bold text-slate-900 text-sm">Day-of-Week Seasonality</h3>
                <p class="text-xs text-slate-400">Average sales volume by day showing weekend spikes</p>
              </div>
              <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">7-Day Profile</span>
            </div>
            <div class="h-64">
              <canvas id="dowDemandChart"></canvas>
            </div>
          </div>
        </div>
      `;

      // Render Charts with Chart.js
      this.renderSalesWasteChart(salesData);
      this.renderDowChart(dowData);

    } catch (err) {
      console.error("Dashboard render error:", err);
      container.innerHTML = `
        <div class="p-8 bg-red-50 text-red-800 rounded-xl border border-red-200">
          <h3 class="font-bold text-lg mb-2">Error Loading Dashboard</h3>
          <p class="text-sm">${err.message}</p>
          <button onclick="window.api.seedDemo().then(() => window.router.navigate('dashboard'))" class="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            Seed Fresh Demo Data
          </button>
        </div>
      `;
    }
  },

  renderSalesWasteChart(salesData) {
    const ctx = document.getElementById('salesWasteChart');
    if (!ctx) return;
    if (this.chartInstances.salesWaste) this.chartInstances.salesWaste.destroy();

    this.chartInstances.salesWaste = new Chart(ctx, {
      type: 'line',
      data: {
        labels: salesData.dates.map(d => d.slice(5)),
        datasets: [
          {
            label: 'Portions Sold',
            data: salesData.total_sales,
            borderColor: '#059669',
            backgroundColor: 'rgba(5, 150, 105, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 2
          },
          {
            label: 'Historical Waste',
            data: salesData.total_waste,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            borderWidth: 2,
            borderDash: [4, 4],
            pointRadius: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } }
        }
      }
    });
  },

  renderDowChart(dowData) {
    const ctx = document.getElementById('dowDemandChart');
    if (!ctx) return;
    if (this.chartInstances.dow) this.chartInstances.dow.destroy();

    this.chartInstances.dow = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dowData.days.map(d => d.slice(0, 3)),
        datasets: [
          {
            label: 'Avg Daily Sales (Portions)',
            data: dowData.avg_daily_sales,
            backgroundColor: dowData.days.map(d => (d === 'Sunday' || d === 'Saturday') ? '#059669' : '#94a3b8'),
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const day = dowData.days[context.dataIndex];
                if (day === 'Sunday') return 'Historically +24% weekend surge';
                if (day === 'Saturday') return 'Historically +28% weekend peak';
                return '';
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
          x: { grid: { display: false }, ticks: { font: { size: 11, weight: 'bold' } } }
        }
      }
    });
  }
};
