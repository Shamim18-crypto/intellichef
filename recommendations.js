// IntelliChef Recommendations Component
window.RecommendationsComponent = {
  currentData: null,
  activeCategory: 'all',
  searchQuery: '',

  async render(container, targetDate = null) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
        <span class="ml-3 text-slate-600 font-medium">Generating ML-calibrated preparation recommendations...</span>
      </div>
    `;

    try {
      const data = await window.api.getRecommendations(targetDate);
      this.currentData = data;
      this.renderView(container);
    } catch (err) {
      container.innerHTML = `
        <div class="p-8 bg-red-50 text-red-800 rounded-xl border border-red-200">
          <h3 class="font-bold text-lg mb-2">Error Generating Recommendations</h3>
          <p class="text-sm">${err.message}</p>
        </div>
      `;
    }
  },

  renderView(container) {
    const data = this.currentData;
    const categories = ['all', ...new Set(data.recommendations.map(r => r.category))];

    // Filter items
    const filteredRecs = data.recommendations.filter(r => {
      const matchesCat = this.activeCategory === 'all' || r.category === this.activeCategory;
      const matchesSearch = r.item_name.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });

    container.innerHTML = `
      <!-- Header with Target Date Controls -->
      <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Daily Preparation Recommendations</h1>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Minimizing Food Waste
            </span>
          </div>
          <p class="text-slate-500 text-sm mt-1">
            Production quantities optimized for <strong>${data.day_of_week}, ${data.target_date}</strong>. 
            Balances customer service level (${data.summary.service_level_pct}%) against spoilage risk.
          </p>
        </div>

        <!-- Date Navigator -->
        <div class="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <label class="text-xs font-semibold text-slate-500 ml-2">Target Date:</label>
          <input 
            type="date" 
            id="targetDateInput" 
            value="${data.target_date}" 
            onchange="window.RecommendationsComponent.changeDate(this.value)"
            class="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
          />
          <button 
            onclick="window.RecommendationsComponent.quickDate(1)"
            class="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
          >
            Tomorrow
          </button>
          <button 
            onclick="window.router.navigate('prep_sheet')" 
            class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <span>📋</span>
            <span>Print Prep Sheet</span>
          </button>
        </div>
      </div>

      <!-- Quick Operational Metrics Summary Banner -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div class="text-xs text-slate-500 font-medium">Expected Demand</div>
          <div class="text-2xl font-bold text-slate-900 mt-1">${data.summary.total_expected_demand} <span class="text-xs font-normal text-slate-500">portions</span></div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div class="text-xs text-slate-500 font-medium">Pre-Existing Usable Stock</div>
          <div class="text-2xl font-bold text-amber-600 mt-1">${data.summary.total_usable_inventory} <span class="text-xs font-normal text-slate-500">in walk-in</span></div>
        </div>
        <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm">
          <div class="text-xs text-emerald-700 font-bold uppercase tracking-wider">Net Preparation Target</div>
          <div class="text-2xl font-black text-emerald-800 mt-1">${data.summary.total_recommended_prep} <span class="text-xs font-medium text-emerald-600">portions to make</span></div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div class="text-xs text-slate-500 font-medium">Buffer Mode</div>
          <div class="text-2xl font-bold text-purple-700 mt-1 capitalize">${data.summary.buffer_strategy} <span class="text-xs font-normal text-slate-500">(${data.summary.service_level_pct}% service)</span></div>
        </div>
      </div>

      <!-- Search & Category Filters -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div class="flex flex-wrap items-center gap-1.5">
          ${categories.map(cat => `
            <button 
              onclick="window.RecommendationsComponent.setCategory('${cat}')" 
              class="text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition ${
                this.activeCategory === cat 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }"
            >
              ${cat === 'all' ? 'All Dishes' : cat}
            </button>
          `).join('')}
        </div>

        <div class="w-full sm:w-64">
          <input 
            type="text" 
            placeholder="Search dish name..." 
            value="${this.searchQuery}"
            oninput="window.RecommendationsComponent.setSearch(this.value)"
            class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>
      </div>

      <!-- Recommendations Cards List -->
      <div class="space-y-4">
        ${filteredRecs.map((rec, idx) => `
          <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm card-hover">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              <!-- Dish Header -->
              <div class="lg:w-1/3">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    ${rec.category}
                  </span>
                  <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    Prediction confidence: ${rec.confidence_level || (rec.confidence_score >= 85 ? 'High' : 'Moderate')}
                  </span>
                </div>
                <h3 class="text-lg font-bold text-slate-900">${rec.item_name}</h3>
                <div class="text-xs text-slate-500 mt-0.5">
                  Cost: $${rec.cost_price.toFixed(2)} / portion • Price: $${rec.selling_price.toFixed(2)}
                </div>
              </div>

              <!-- Recommendation Formula Strip -->
              <div class="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div class="text-center">
                  <div class="text-[11px] text-slate-500">Expected Demand</div>
                  <div class="text-base font-bold text-slate-800">${rec.expected_demand}</div>
                  <div class="text-[10px] text-slate-400">Target for ${data.day_of_week}</div>
                </div>

                <div class="text-center border-l border-slate-200">
                  <div class="text-[11px] text-slate-500">Safety Buffer</div>
                  <div class="text-base font-bold text-emerald-600">+${rec.safety_buffer}</div>
                  <div class="text-[10px] text-slate-400">${rec.service_level_pct}% availability</div>
                </div>

                <div class="text-center border-l border-slate-200">
                  <div class="text-[11px] text-slate-500">Usable Inventory</div>
                  <div class="flex items-center justify-center gap-1 mt-0.5">
                    <input 
                      type="number" 
                      min="0" 
                      value="${rec.usable_inventory}"
                      onchange="window.RecommendationsComponent.updateItemInventory('${rec.item_id}', this.value)"
                      class="w-16 text-center text-sm font-bold border border-slate-300 rounded bg-white py-0.5 text-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div class="text-[10px] text-slate-400">in walk-in</div>
                </div>

                <div class="text-center border-l border-slate-200 bg-emerald-600 text-white rounded-lg p-1.5 flex flex-col justify-center">
                  <div class="text-[11px] text-emerald-100 font-medium">Recommended Prep</div>
                  <div class="text-xl font-black">${rec.recommended_prep}</div>
                  <div class="text-[10px] text-emerald-100 font-light">portions to cook</div>
                </div>
              </div>

              <!-- Toggle Explanation Button -->
              <div class="shrink-0 flex items-center justify-end">
                <button 
                  onclick="window.RecommendationsComponent.toggleWhy('why-box-${idx}')"
                  class="text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-2 rounded-lg transition flex items-center gap-1.5"
                >
                  <span>💡 Why?</span>
                  <span id="why-arrow-${idx}">▼</span>
                </button>
              </div>
            </div>

            <!-- Expandable "Why?" Box -->
            <div id="why-box-${idx}" class="mt-4 pt-4 border-t border-slate-100">
              <div class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <span>💡 Why this recommendation?</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-200/70">
                ${rec.why_explanations.map(exp => `
                  <div class="flex items-start gap-2">
                    <span class="text-emerald-500 font-bold mt-0.5">•</span>
                    <span>${exp}</span>
                  </div>
                `).join('')}
              </div>
            </div>

          </div>
        `).join('')}
      </div>
    `;
  },

  setCategory(cat) {
    this.activeCategory = cat;
    this.renderView(document.getElementById('main-content'));
  },

  setSearch(val) {
    this.searchQuery = val;
    this.renderView(document.getElementById('main-content'));
  },

  toggleWhy(boxId) {
    const box = document.getElementById(boxId);
    if (box) {
      box.classList.toggle('hidden');
    }
  },

  async updateItemInventory(itemId, val) {
    const num = Math.max(0, parseInt(val) || 0);
    const item = this.currentData.recommendations.find(r => r.item_id === itemId);
    if (item) {
      item.usable_inventory = num;
      // Recalculate recommended prep: max(0, expected_demand + safety_buffer - usable_inventory)
      item.recommended_prep = Math.max(0, item.expected_demand + item.safety_buffer - num);
      
      // Update totals
      this.currentData.summary.total_usable_inventory = this.currentData.recommendations.reduce((sum, r) => sum + r.usable_inventory, 0);
      this.currentData.summary.total_recommended_prep = this.currentData.recommendations.reduce((sum, r) => sum + r.recommended_prep, 0);

      // Persist to backend inventory table
      await window.api.updateInventory([{ item_id: itemId, usable_quantity: num }]);
      this.renderView(document.getElementById('main-content'));
    }
  },

  async changeDate(val) {
    if (val) {
      await this.render(document.getElementById('main-content'), val);
    }
  },

  async quickDate(daysAhead) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const dateStr = d.toISOString().split('T')[0];
    await this.render(document.getElementById('main-content'), dateStr);
  }
};
