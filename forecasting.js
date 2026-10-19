// IntelliChef Item-Level Forecasting & What-If Simulator
window.ForecastingComponent = {
  chartInstance: null,
  selectedItemId: null,
  itemsList: [],
  simulatedCoversDelta: 0,
  simulatedStrategy: 'balanced',

  async render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
        <span class="ml-3 text-slate-600 font-medium">Loading demand forecasting models...</span>
      </div>
    `;

    try {
      const modelData = await window.api.getModelPerformance();
      this.itemsList = modelData.items || [];
      if (!this.selectedItemId && this.itemsList.length > 0) {
        this.selectedItemId = this.itemsList[0].id;
      }

      await this.renderView(container);
    } catch (err) {
      container.innerHTML = `<div class="p-4 text-red-600">Error: ${err.message}</div>`;
    }
  },

  async renderView(container) {
    const selectedItem = this.itemsList.find(i => i.id === this.selectedItemId) || this.itemsList[0];
    const salesData = await window.api.getSalesAnalytics(45, this.selectedItemId);
    const recData = await window.api.getRecommendations();
    const currentRec = recData.recommendations.find(r => r.item_id === this.selectedItemId) || recData.recommendations[0];

    // Compute What-If Simulation Values
    const baseDemand = currentRec.expected_demand;
    const simDemand = Math.round(baseDemand * (1 + (this.simulatedCoversDelta / 100)));
    const simStd = currentRec.safety_buffer; // approx
    let z = 1.48; // balanced
    if (this.simulatedStrategy === 'conservative') z = 2.05;
    if (this.simulatedStrategy === 'lean') z = 1.04;
    const simBuffer = Math.round(z * (simStd / 1.48));
    const simGross = simDemand + simBuffer;
    const simPrep = Math.max(0, simGross - currentRec.usable_inventory);
    const simWaste = Math.max(0, (simBuffer * 0.28).toFixed(1));

    container.innerHTML = `
      <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Demand Forecasting & Scenario Simulator</h1>
          <p class="text-slate-500 text-sm mt-1">
            Analyze item-level patterns, customer volume elasticity, and test preparation scenarios.
          </p>
        </div>

        <!-- Item Selector -->
        <div class="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <label class="text-xs font-bold text-slate-500">Dish:</label>
          <select 
            id="dishSelect" 
            onchange="window.ForecastingComponent.selectItem(this.value)"
            class="text-sm font-semibold border-none bg-transparent focus:ring-0 text-slate-800 cursor-pointer"
          >
            ${this.itemsList.map(item => `
              <option value="${item.id}" ${item.id === this.selectedItemId ? 'selected' : ''}>
                ${item.name} (${item.category})
              </option>
            `).join('')}
          </select>
        </div>
      </div>

      <!-- Main Forecast Visualizer -->
      <div class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 class="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>${selectedItem.name} — Historical Sales & Forecast</span>
            </h3>
            <p class="text-xs text-slate-400">Past 45 days actual daily portion consumption</p>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Actual Sales</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Unsold Waste</span>
          </div>
        </div>

        <div class="h-72">
          <canvas id="itemForecastChart"></canvas>
        </div>
      </div>

      <!-- Interactive What-If Simulator Panel -->
      <div class="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md mb-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-700/80 mb-6">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🧪</span>
            <div>
              <h3 class="font-bold text-lg text-white">Interactive Scenario Simulator</h3>
              <p class="text-xs text-slate-400">Test how unexpected dining shifts or strategy adjustments affect prep and waste</p>
            </div>
          </div>
          <button 
            onclick="window.ForecastingComponent.resetSimulator()"
            class="text-xs text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            Reset Simulator
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Control Sliders -->
          <div class="space-y-5">
            <!-- Slider 1: Expected Customer Covers Shift -->
            <div>
              <div class="flex justify-between items-center text-xs font-bold mb-2">
                <span class="text-slate-300">Expected Customer Covers Shift</span>
                <span class="text-emerald-400 font-extrabold text-sm">${this.simulatedCoversDelta > 0 ? '+' : ''}${this.simulatedCoversDelta}%</span>
              </div>
              <input 
                type="range" 
                min="-30" 
                max="50" 
                step="5" 
                value="${this.simulatedCoversDelta}"
                oninput="window.ForecastingComponent.updateSimCovers(this.value)"
                class="w-full accent-emerald-500 cursor-pointer"
              />
              <div class="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>-30% (Heavy Rain / Slow)</span>
                <span>0% (Expected Baseline)</span>
                <span>+50% (Spike / Concert Nearby)</span>
              </div>
            </div>

            <!-- Strategy Choice -->
            <div>
              <div class="text-xs font-bold text-slate-300 mb-2">Buffer Risk Appetite Strategy</div>
              <div class="grid grid-cols-3 gap-2">
                ${['lean', 'balanced', 'conservative'].map(strat => `
                  <button 
                    onclick="window.ForecastingComponent.updateSimStrategy('${strat}')"
                    class="py-2 px-3 text-xs font-semibold rounded-lg capitalize transition border ${
                      this.simulatedStrategy === strat 
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow' 
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }"
                  >
                    ${strat}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Live Simulated Outcome Matrix -->
          <div class="bg-slate-800/80 rounded-xl p-5 border border-slate-700 flex flex-col justify-between">
            <div class="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">Simulated Prep Outcome for Tomorrow</div>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                <div class="text-xs text-slate-400">Simulated Demand</div>
                <div class="text-2xl font-black text-white mt-1">${simDemand} <span class="text-xs font-normal text-slate-400">portions</span></div>
              </div>

              <div class="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                <div class="text-xs text-slate-400">Safety Buffer</div>
                <div class="text-2xl font-black text-emerald-400 mt-1">+${simBuffer} <span class="text-xs font-normal text-slate-400">portions</span></div>
              </div>

              <div class="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                <div class="text-xs text-slate-400">Usable Inventory</div>
                <div class="text-2xl font-black text-amber-400 mt-1">-${currentRec.usable_inventory} <span class="text-xs font-normal text-slate-400">portions</span></div>
              </div>

              <div class="bg-emerald-600/30 p-3 rounded-lg border border-emerald-500/40">
                <div class="text-xs text-emerald-300 font-semibold">Recommended Prep</div>
                <div class="text-2xl font-black text-emerald-300 mt-1">${simPrep} <span class="text-xs font-normal text-emerald-200">portions</span></div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
              <span>Expected Waste Risk: <strong class="text-slate-200">${simWaste} portions</strong></span>
              <span>Potential Revenue: <strong class="text-emerald-400">$${(simDemand * currentRec.selling_price).toFixed(0)}</strong></span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderItemChart(salesData, selectedItem.name);
  },

  renderItemChart(salesData, itemName) {
    const ctx = document.getElementById('itemForecastChart');
    if (!ctx) return;
    if (this.chartInstance) this.chartInstance.destroy();

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: salesData.dates.map(d => d.slice(5)),
        datasets: [
          {
            label: `${itemName} Sold`,
            data: salesData.total_sales,
            borderColor: '#059669',
            backgroundColor: 'rgba(5, 150, 105, 0.1)',
            fill: true,
            tension: 0.25,
            borderWidth: 2,
            pointRadius: 2.5
          },
          {
            label: `Waste Recorded`,
            data: salesData.total_waste,
            borderColor: '#f59e0b',
            borderWidth: 2,
            borderDash: [3, 3],
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

  async selectItem(itemId) {
    this.selectedItemId = itemId;
    await this.renderView(document.getElementById('main-content'));
  },

  updateSimCovers(val) {
    this.simulatedCoversDelta = parseInt(val) || 0;
    this.renderView(document.getElementById('main-content'));
  },

  updateSimStrategy(strat) {
    this.simulatedStrategy = strat;
    this.renderView(document.getElementById('main-content'));
  },

  resetSimulator() {
    this.simulatedCoversDelta = 0;
    this.simulatedStrategy = 'balanced';
    this.renderView(document.getElementById('main-content'));
  }
};
