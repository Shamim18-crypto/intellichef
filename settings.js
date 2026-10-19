// IntelliChef Settings & Strategy Configuration Component
window.SettingsComponent = {
  async render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
        <span class="ml-3 text-slate-600 font-medium">Loading restaurant configuration...</span>
      </div>
    `;

    try {
      const settings = await window.api.getSettings();
      const rests = await window.api.getRestaurants();

      container.innerHTML = `
        <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Restaurant Settings & Strategy</h1>
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                Tenant Isolation
              </span>
            </div>
            <p class="text-slate-500 text-sm mt-1">
              Configure inventory risk appetite, target service availability, and restaurant profiles.
            </p>
          </div>

          <!-- Quick Demo Reset Button -->
          <button 
            onclick="window.SettingsComponent.reloadDemo()"
            class="text-xs font-semibold px-4 py-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition flex items-center gap-2"
          >
            <span>🔄</span>
            <span>Reload 365-Day Demo Data</span>
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Column 1 & 2: Strategy & Profile -->
          <div class="lg:col-span-2 space-y-6">
            
            <!-- Buffer Strategy Config -->
            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div class="pb-4 border-b border-slate-100 mb-5">
                <h3 class="font-bold text-slate-900 text-base">Preparation Safety Buffer Strategy</h3>
                <p class="text-xs text-slate-400">Controls the mathematical service level (Z-score) applied to demand volatility</p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <!-- Lean -->
                <div 
                  onclick="window.SettingsComponent.selectStrategy('lean')"
                  id="strat_lean"
                  class="p-4 rounded-xl border-2 cursor-pointer transition ${settings.buffer_strategy === 'lean' ? 'border-emerald-600 bg-emerald-50/40' : 'border-slate-200 hover:border-slate-300'}"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-bold text-slate-900 text-sm">Lean</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">85% Service</span>
                  </div>
                  <p class="text-xs text-slate-500 leading-relaxed">
                    Prioritizes zero food waste. Buffer is tight. Ideal for highly perishable seafood or short shelf-life items.
                  </p>
                </div>

                <!-- Balanced -->
                <div 
                  onclick="window.SettingsComponent.selectStrategy('balanced')"
                  id="strat_balanced"
                  class="p-4 rounded-xl border-2 cursor-pointer transition ${settings.buffer_strategy === 'balanced' ? 'border-emerald-600 bg-emerald-50/40' : 'border-slate-200 hover:border-slate-300'}"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-bold text-slate-900 text-sm">Balanced</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">93% Service</span>
                  </div>
                  <p class="text-xs text-slate-500 leading-relaxed">
                    Optimal commercial equilibrium. Mitigates 38% waste while maintaining 93% food availability.
                  </p>
                </div>

                <!-- Conservative -->
                <div 
                  onclick="window.SettingsComponent.selectStrategy('conservative')"
                  id="strat_conservative"
                  class="p-4 rounded-xl border-2 cursor-pointer transition ${settings.buffer_strategy === 'conservative' ? 'border-emerald-600 bg-emerald-50/40' : 'border-slate-200 hover:border-slate-300'}"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-bold text-slate-900 text-sm">Conservative</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">98% Service</span>
                  </div>
                  <p class="text-xs text-slate-500 leading-relaxed">
                    Zero stockout tolerance. Generates higher safety buffer. Ideal for high-margin fine dining.
                  </p>
                </div>
              </div>

              <form onsubmit="window.SettingsComponent.saveSettings(event)" class="space-y-4">
                <input type="hidden" id="selectedStrategyInput" value="${settings.buffer_strategy || 'balanced'}" />
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Restaurant Name</label>
                    <input type="text" id="setRestName" value="${settings.name}" class="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Cuisine Specialty</label>
                    <input type="text" id="setRestCuisine" value="${settings.cuisine || ''}" class="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Location / District</label>
                    <input type="text" id="setRestLocation" value="${settings.location || ''}" class="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Cost of Stockout Multiplier</label>
                    <input type="number" step="0.1" id="setStockoutMult" value="${settings.cost_of_stockout_multiplier || 1.5}" class="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>

                <div class="flex justify-end pt-2">
                  <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition">
                    Save Configuration
                  </button>
                </div>
              </form>

            </div>

            <!-- Developer / Model Diagnostics Section -->
            <div class="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-base">🛠️</span>
                  <div>
                    <h3 class="font-bold text-slate-800 text-sm">Developer & Model Diagnostics</h3>
                    <p class="text-[11px] text-slate-400">Internal algorithm telemetry, loss benchmarks (MAE/RMSE), and feature weights</p>
                  </div>
                </div>
                <button 
                  onclick="window.router.navigate('models')" 
                  class="text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-3.5 py-2 rounded-lg transition shadow-sm shrink-0"
                >
                  Open Diagnostics Console →
                </button>
              </div>
              <p class="text-xs text-slate-500">
                This internal console provides technical backtest performance and error distributions. It is kept separate from standard kitchen operations.
              </p>
            </div>

          </div>

          <!-- Column 3: Restaurant Tenants Switcher -->
          <div class="space-y-6">
            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div class="pb-3 border-b border-slate-100 mb-4">
                <h3 class="font-bold text-slate-900 text-sm">Switch Restaurant Tenant</h3>
                <p class="text-xs text-slate-400">Isolated database storage per location</p>
              </div>

              <div class="space-y-2 mb-4 max-h-72 overflow-y-auto">
                ${rests.restaurants.map(r => `
                  <div 
                    onclick="window.SettingsComponent.switchTenant('${r.id}')"
                    class="p-3 rounded-xl border transition cursor-pointer ${
                      r.id === window.api.activeRestaurantId 
                        ? 'border-emerald-500 bg-emerald-50/50' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }"
                  >
                    <div class="flex items-center justify-between">
                      <h4 class="font-bold text-slate-900 text-xs">${r.name}</h4>
                      ${r.id === window.api.activeRestaurantId ? '<span class="text-[10px] font-bold text-emerald-700">Active</span>' : ''}
                    </div>
                    <div class="text-[10px] text-slate-500 mt-0.5">
                      ${r.cuisine} • ${r.sales_count || 0} sales records
                    </div>
                  </div>
                `).join('')}
              </div>

              <button 
                onclick="window.SettingsComponent.openCreateModal()"
                class="w-full text-xs font-semibold py-2.5 border border-dashed border-slate-300 hover:border-slate-400 text-slate-600 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <span>➕ Create New Restaurant</span>
              </button>
            </div>
          </div>

        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="p-4 text-red-600">Error: ${err.message}</div>`;
    }
  },

  selectStrategy(strat) {
    document.getElementById('selectedStrategyInput').value = strat;
    ['lean', 'balanced', 'conservative'].forEach(s => {
      const el = document.getElementById(`strat_${s}`);
      if (el) {
        if (s === strat) {
          el.className = 'p-4 rounded-xl border-2 cursor-pointer transition border-emerald-600 bg-emerald-50/40';
        } else {
          el.className = 'p-4 rounded-xl border-2 cursor-pointer transition border-slate-200 hover:border-slate-300';
        }
      }
    });
  },

  async saveSettings(e) {
    e.preventDefault();
    const name = document.getElementById('setRestName').value;
    const cuisine = document.getElementById('setRestCuisine').value;
    const location = document.getElementById('setRestLocation').value;
    const buffer_strategy = document.getElementById('selectedStrategyInput').value;
    const cost_of_stockout_multiplier = parseFloat(document.getElementById('setStockoutMult').value) || 1.5;

    let service_level = 0.93;
    if (buffer_strategy === 'conservative') service_level = 0.98;
    if (buffer_strategy === 'lean') service_level = 0.85;

    await window.api.updateSettings({
      name, cuisine, location, buffer_strategy, service_level, cost_of_stockout_multiplier
    });

    alert("Configuration successfully saved!");
    await this.render(document.getElementById('main-content'));
  },

  async switchTenant(restaurantId) {
    window.api.setRestaurant(restaurantId);
    window.router.updateHeader();
    await this.render(document.getElementById('main-content'));
  },

  async reloadDemo() {
    if (confirm("Reset and reload 365 days of demo restaurant data?")) {
      await window.api.seedDemo();
      window.api.setRestaurant('demo-restaurant-001');
      window.router.navigate('dashboard');
    }
  },

  async openCreateModal() {
    const name = prompt("Enter new restaurant name (e.g. Bella Italia Bistro):");
    if (name) {
      const res = await window.api.createRestaurant({ name, cuisine: "Italian", location: "Midtown" });
      window.api.setRestaurant(res.id);
      window.router.updateHeader();
      await this.render(document.getElementById('main-content'));
    }
  }
};
