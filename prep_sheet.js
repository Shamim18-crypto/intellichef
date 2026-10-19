// IntelliChef Kitchen Daily Prep Sheet
window.PrepSheetComponent = {
  checkedItems: new Set(),

  async render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
        <span class="ml-3 text-slate-600 font-medium">Generating Kitchen Prep Sheet...</span>
      </div>
    `;

    try {
      const recData = await window.api.getRecommendations();
      const summary = await window.api.getSummary();

      // Group items by category / kitchen station
      const stations = {};
      recData.recommendations.forEach(item => {
        const station = item.category || 'General Prep';
        if (!stations[station]) stations[station] = [];
        stations[station].push(item);
      });

      container.innerHTML = `
        <div class="printable-sheet bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-4xl mx-auto">
          
          <!-- Kitchen Sheet Header -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b-2 border-slate-900 gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-2xl">👨‍🍳</span>
                <h1 class="text-2xl font-black text-slate-900 tracking-tight">KITCHEN DAILY PREP SHEET</h1>
              </div>
              <p class="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">
                ${summary.restaurant_name} • ${summary.cuisine}
              </p>
            </div>

            <div class="flex items-center gap-2 no-print">
              <button 
                onclick="window.print()" 
                class="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2"
              >
                <span>🖨️</span>
                <span>Print Kitchen Sheet</span>
              </button>
              <button 
                onclick="window.router.navigate('recommendations')" 
                class="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 transition"
              >
                Back to Recs
              </button>
            </div>
          </div>

          <!-- Metadata Strip -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 bg-slate-50 rounded-xl my-5 px-4 border border-slate-200 text-xs text-slate-700">
            <div>
              <span class="text-slate-400 font-semibold uppercase">Date:</span>
              <div class="font-bold text-slate-900 text-sm">${recData.target_date} (${recData.day_of_week})</div>
            </div>
            <div>
              <span class="text-slate-400 font-semibold uppercase">Shift:</span>
              <div class="font-bold text-slate-900 text-sm">Main Service Prep</div>
            </div>
            <div>
              <span class="text-slate-400 font-semibold uppercase">Total Prep Target:</span>
              <div class="font-extrabold text-emerald-700 text-sm">${recData.summary.total_recommended_prep} Portions</div>
            </div>
            <div>
              <span class="text-slate-400 font-semibold uppercase">Walk-in Stock:</span>
              <div class="font-bold text-amber-700 text-sm">${recData.summary.total_usable_inventory} Portions Deducted</div>
            </div>
          </div>

          <!-- Kitchen Stations & Checklist -->
          <div class="space-y-6">
            ${Object.keys(stations).map(stationName => `
              <div>
                <div class="bg-slate-800 text-white text-xs font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-t-lg flex items-center justify-between">
                  <span>${stationName} Station</span>
                  <span class="font-normal text-slate-300">${stations[stationName].length} items</span>
                </div>
                
                <div class="border border-t-0 border-slate-200 rounded-b-lg overflow-hidden">
                  <table class="w-full text-left text-xs">
                    <thead class="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th class="py-2.5 px-3 w-12 text-center">Done</th>
                        <th class="py-2.5 px-3">Item / Dish</th>
                        <th class="py-2.5 px-3 text-center">Walk-In Stock</th>
                        <th class="py-2.5 px-3 text-center font-extrabold text-slate-900">Target Prep</th>
                        <th class="py-2.5 px-3 text-right">Confidence</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      ${stations[stationName].map(item => `
                        <tr class="hover:bg-slate-50/70 transition">
                          <td class="py-3 px-3 text-center">
                            <input 
                              type="checkbox" 
                              ${this.checkedItems.has(item.item_id) ? 'checked' : ''}
                              onchange="window.PrepSheetComponent.toggleItem('${item.item_id}')"
                              class="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            />
                          </td>
                          <td class="py-3 px-3 font-bold text-slate-900 text-sm">
                            ${item.item_name}
                            <div class="text-[10px] text-slate-400 font-normal">Buffer: +${item.safety_buffer} portions</div>
                          </td>
                          <td class="py-3 px-3 text-center text-amber-700 font-semibold">
                            ${item.usable_inventory > 0 ? item.usable_inventory : '0'}
                          </td>
                          <td class="py-3 px-3 text-center">
                            <span class="inline-block bg-emerald-50 text-emerald-800 font-black text-base px-3 py-1 rounded-lg border border-emerald-200">
                              ${item.recommended_prep}
                            </span>
                          </td>
                          <td class="py-3 px-3 text-right text-slate-500 font-semibold">
                            ${item.confidence_level || (item.confidence_score >= 85 ? 'High' : 'Moderate')}
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Chef Sign-off Footer -->
          <div class="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <div class="font-bold uppercase tracking-wider text-slate-700 mb-1">Kitchen Quality & Temperature Checks:</div>
              <p>Verify walk-in refrigeration temperatures (< 4°C / 40°F) and hot holding (> 65°C / 149°F). Inspect raw prep expiration dates.</p>
            </div>
            <div class="flex flex-col justify-end">
              <div class="border-b border-slate-400 pb-1 mb-1">
                <span class="text-slate-400 font-medium">Head Chef / Sous Chef Signature:</span>
              </div>
              <div class="text-[10px] text-slate-400">IntelliChef Automated Kitchen Production Protocol</div>
            </div>
          </div>

        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="p-4 text-red-600">Error: ${err.message}</div>`;
    }
  },

  toggleItem(itemId) {
    if (this.checkedItems.has(itemId)) {
      this.checkedItems.delete(itemId);
    } else {
      this.checkedItems.add(itemId);
    }
  }
};
