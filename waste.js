// IntelliChef Waste Analytics & Cost Reduction Component
window.WasteComponent = {
  chartInstance: null,

  async render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
        <span class="ml-3 text-slate-600 font-medium">Analyzing historical food waste patterns...</span>
      </div>
    `;

    try {
      const wasteData = await window.api.getWasteAnalytics();
      const summary = await window.api.getSummary();

      container.innerHTML = `
        <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Food Waste Analytics & Cost Reduction</h1>
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200">
                Sustainability & Profit
              </span>
            </div>
            <p class="text-slate-500 text-sm mt-1">
              Identify high-waste menu items, eliminate unnecessary overproduction, and quantify savings.
            </p>
          </div>

          <div class="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl flex items-center gap-3">
            <span class="text-2xl">🌱</span>
            <div>
              <div class="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Projected Monthly Savings</div>
              <div class="text-lg font-black text-emerald-900">+$${summary.monthly_waste_savings_dollars.toLocaleString()} <span class="text-xs font-normal text-emerald-700">(${summary.monthly_waste_reduced_kg} kg food rescued)</span></div>
            </div>
          </div>
        </div>

        <!-- 3 KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
            <div class="flex items-center justify-between text-slate-500 mb-2">
              <span class="text-xs font-semibold uppercase tracking-wider">Historical Food Waste Cost</span>
              <span class="p-1.5 rounded-md bg-red-50 text-red-600">💸</span>
            </div>
            <div class="text-3xl font-extrabold text-slate-900">$${wasteData.total_cost_lost.toLocaleString()}</div>
            <p class="text-xs text-slate-400 mt-2">Cumulative unguided overproduction loss</p>
          </div>

          <div class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
            <div class="flex items-center justify-between text-slate-500 mb-2">
              <span class="text-xs font-semibold uppercase tracking-wider">Historical Waste Rate</span>
              <span class="p-1.5 rounded-md bg-amber-50 text-amber-600">📊</span>
            </div>
            <div class="text-3xl font-extrabold text-slate-900">${summary.historical_waste_rate_pct}%</div>
            <p class="text-xs text-slate-400 mt-2">Target with IntelliChef: &lt; 4.0%</p>
          </div>

          <div class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
            <div class="flex items-center justify-between text-slate-500 mb-2">
              <span class="text-xs font-semibold uppercase tracking-wider">Total Portions Discarded</span>
              <span class="p-1.5 rounded-md bg-slate-50 text-slate-600">🗑️</span>
            </div>
            <div class="text-3xl font-extrabold text-slate-900">${wasteData.total_portions_wasted.toLocaleString()}</div>
            <p class="text-xs text-slate-400 mt-2">Portions unconsumed at end of service</p>
          </div>
        </div>

        <!-- Category Doughnut & Strategy Insights -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <!-- Chart -->
          <div class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm lg:col-span-1">
            <h3 class="font-bold text-slate-900 text-sm mb-1">Waste Cost by Category</h3>
            <p class="text-xs text-slate-400 mb-4">Financial distribution of discarded food</p>
            <div class="h-56">
              <canvas id="categoryWasteChart"></canvas>
            </div>
          </div>

          <!-- Strategy Action Plan -->
          <div class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm lg:col-span-2 flex flex-col justify-between">
            <div>
              <h3 class="font-bold text-slate-900 text-sm mb-1">IntelliChef Waste Mitigation Strategies</h3>
              <p class="text-xs text-slate-400 mb-4">Automated recommendations based on demand variance</p>
              
              <div class="space-y-3">
                <div class="p-3 bg-emerald-50/70 rounded-lg border border-emerald-100 flex items-start gap-3">
                  <span class="text-emerald-600 font-bold text-base mt-0.5">1</span>
                  <div>
                    <h4 class="text-xs font-bold text-emerald-900">Dynamic Multi-Batch Preparation</h4>
                    <p class="text-xs text-emerald-800 mt-0.5">
                      For high-volume dishes (e.g. Dum Biryani, Butter Chicken), prepare 65% for lunch service and hold the remaining 35% prep until 4:00 PM based on real afternoon covers.
                    </p>
                  </div>
                </div>

                <div class="p-3 bg-blue-50/70 rounded-lg border border-blue-100 flex items-start gap-3">
                  <span class="text-blue-600 font-bold text-base mt-0.5">2</span>
                  <div>
                    <h4 class="text-xs font-bold text-blue-900">High-Cost Protein Buffer Prudence</h4>
                    <p class="text-xs text-blue-800 mt-0.5">
                      Expensive dishes like Slow-Braised Lamb Shank ($9.50/portion cost) should run in 'Lean' mode on weeknights to eliminate end-of-night spoilage.
                    </p>
                  </div>
                </div>

                <div class="p-3 bg-amber-50/70 rounded-lg border border-amber-100 flex items-start gap-3">
                  <span class="text-amber-600 font-bold text-base mt-0.5">3</span>
                  <div>
                    <h4 class="text-xs font-bold text-amber-900">Pre-Service Inventory Roll-over</h4>
                    <p class="text-xs text-amber-800 mt-0.5">
                      Ensure kitchen cooks log usable cold-holding stock daily at 9:00 AM before firing morning braises.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
              Target reduction: <strong>38% decrease in overall restaurant food waste</strong> within 30 days of consistent system adherence.
            </div>
          </div>
        </div>

        <!-- Item Waste Breakdown Table -->
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div class="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 class="font-bold text-slate-900 text-sm">Item-Level Waste & Financial Impact</h3>
              <p class="text-xs text-slate-400">Detailed breakdown of food loss across menu</p>
            </div>
            <span class="text-xs text-slate-500">Sorted by Financial Loss</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th class="py-3 px-4">Item Name</th>
                  <th class="py-3 px-4">Category</th>
                  <th class="py-3 px-4 text-center">Portions Sold</th>
                  <th class="py-3 px-4 text-center">Portions Wasted</th>
                  <th class="py-3 px-4 text-center">Historical Waste Rate</th>
                  <th class="py-3 px-4 text-right">Cost of Waste ($)</th>
                  <th class="py-3 px-4 text-center">Risk Level</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${wasteData.by_item.map(item => {
                  let badge = 'bg-emerald-50 text-emerald-700';
                  let risk = 'Low Risk';
                  if (item.waste_rate_pct >= 11) {
                    badge = 'bg-red-50 text-red-700';
                    risk = 'High Waste';
                  } else if (item.waste_rate_pct >= 8) {
                    badge = 'bg-amber-50 text-amber-700';
                    risk = 'Moderate';
                  }

                  return `
                    <tr class="hover:bg-slate-50 transition">
                      <td class="py-3 px-4 font-bold text-slate-900">${item.item_name}</td>
                      <td class="py-3 px-4 text-slate-500">${item.category}</td>
                      <td class="py-3 px-4 text-center font-medium">${Math.round(item.quantity_sold)}</td>
                      <td class="py-3 px-4 text-center font-bold text-red-600">${Math.round(item.waste_quantity)}</td>
                      <td class="py-3 px-4 text-center font-bold text-slate-800">${item.waste_rate_pct}%</td>
                      <td class="py-3 px-4 text-right font-extrabold text-slate-900">$${item.waste_cost.toFixed(2)}</td>
                      <td class="py-3 px-4 text-center">
                        <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badge}">
                          ${risk}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      this.renderCategoryChart(wasteData.by_category);

    } catch (err) {
      container.innerHTML = `<div class="p-4 text-red-600">Error: ${err.message}</div>`;
    }
  },

  renderCategoryChart(byCat) {
    const ctx = document.getElementById('categoryWasteChart');
    if (!ctx) return;
    if (this.chartInstance) this.chartInstance.destroy();

    const labels = Object.keys(byCat);
    const costs = labels.map(k => byCat[k].waste_cost);

    this.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: costs,
          backgroundColor: ['#059669', '#d97706', '#dc2626', '#6366f1', '#8b5cf6', '#0ea5e9'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
        },
        cutout: '65%'
      }
    });
  }
};
