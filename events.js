// IntelliChef Festivals & Events Intelligence Calendar Component
window.EventsComponent = {
  async render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
        <span class="ml-3 text-slate-600 font-medium">Loading festival & event calendar...</span>
      </div>
    `;

    try {
      const data = await window.api.getEvents();

      container.innerHTML = `
        <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Festival & Holiday Intelligence</h1>
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Demand Multipliers Active
              </span>
            </div>
            <p class="text-slate-500 text-sm mt-1">
              Anticipate holiday rushes and local events with calibrated impact factors that automatically adjust prep quantities.
            </p>
          </div>

          <button 
            onclick="window.EventsComponent.openAddModal()"
            class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2 shrink-0"
          >
            <span>➕</span>
            <span>Add Event or Festival</span>
          </button>
        </div>

        <!-- Explanation card -->
        <div class="mb-6 p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
          <span class="text-xl">ℹ️</span>
          <div>
            <span class="font-bold">How IntelliChef uses festival intelligence:</span>
            When an event or festival is scheduled, both the statistical baseline and the Random Forest regression model incorporate the event's historical demand factor (e.g. 1.35 = +35% surge). This prevents kitchen stockouts during holidays while maintaining tight post-festival waste controls.
          </div>
        </div>

        <!-- Events List -->
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div class="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="font-bold text-slate-900 text-sm">Scheduled Festivals & Holidays</h3>
            <span class="text-xs text-slate-400">${data.events.length} Events on Record</span>
          </div>

          <div class="divide-y divide-slate-100">
            ${data.events.length === 0 ? `
              <div class="p-8 text-center text-slate-400 text-sm">No scheduled events. Click 'Add Event or Festival' above to add one.</div>
            ` : data.events.map(ev => {
              const lift = Math.round((ev.impact_factor - 1.0) * 100);
              return `
                <div class="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition">
                  <div class="flex items-start gap-3.5">
                    <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-lg shrink-0">
                      🗓️
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <h4 class="font-bold text-slate-900 text-sm">${ev.name}</h4>
                        <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          ${ev.category || 'Holiday'}
                        </span>
                      </div>
                      <div class="text-xs text-slate-500 mt-0.5">
                        Date: <strong class="text-slate-800">${ev.date}</strong> • ${ev.description || 'Special service period'}
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-4 self-end sm:self-center">
                    <div class="text-right">
                      <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Demand Lift</div>
                      <div class="text-base font-black text-amber-600">+${lift}% Surge</div>
                    </div>
                    <button 
                      onclick="window.EventsComponent.deleteEvent('${ev.id}')"
                      class="text-xs text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition"
                      title="Delete event"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Add Event Modal Container -->
        <div id="addEventModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm hidden flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 class="font-bold text-slate-900 text-base">Add Special Event or Festival</h3>
              <button onclick="window.EventsComponent.closeAddModal()" class="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
            </div>

            <form onsubmit="window.EventsComponent.submitEvent(event)" class="space-y-4 mt-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Event / Festival Name</label>
                <input type="text" id="evName" required placeholder="e.g. Downtown Food & Wine Festival" class="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input type="date" id="evDate" required class="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select id="evCategory" class="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500">
                    <option value="Festival">Festival</option>
                    <option value="Holiday">National Holiday</option>
                    <option value="Local Event">Local Sporting / Concert</option>
                    <option value="Special Promotion">Special Promotion</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Expected Demand Factor (Multiplier)</label>
                <input type="number" id="evImpact" step="0.05" min="0.5" max="2.5" value="1.30" class="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500" />
                <span class="text-[10px] text-slate-400">1.30 = +30% demand boost. 0.85 = -15% demand drop (e.g. storm).</span>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
                <textarea id="evDesc" rows="2" placeholder="Notes for kitchen staff regarding bookings or reservations..." class="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"></textarea>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button type="button" onclick="window.EventsComponent.closeAddModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" class="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="p-4 text-red-600">Error: ${err.message}</div>`;
    }
  },

  openAddModal() {
    const modal = document.getElementById('addEventModal');
    if (modal) modal.classList.remove('hidden');
  },

  closeAddModal() {
    const modal = document.getElementById('addEventModal');
    if (modal) modal.classList.add('hidden');
  },

  async submitEvent(e) {
    e.preventDefault();
    const name = document.getElementById('evName').value;
    const date = document.getElementById('evDate').value;
    const category = document.getElementById('evCategory').value;
    const impact_factor = parseFloat(document.getElementById('evImpact').value) || 1.25;
    const description = document.getElementById('evDesc').value;

    await window.api.addEvent({
      name, date, category, impact_factor, description
    });

    this.closeAddModal();
    await this.render(document.getElementById('main-content'));
  },

  async deleteEvent(eventId) {
    if (confirm("Remove this event from calendar?")) {
      await window.api.deleteEvent(eventId);
      await this.render(document.getElementById('main-content'));
    }
  }
};
