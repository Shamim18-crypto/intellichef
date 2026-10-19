// IntelliChef Master Application Router & Controller
class IntelliChefRouter {
  constructor() {
    this.currentRoute = 'dashboard';
    this.routes = {
      'dashboard': window.DashboardComponent,
      'recommendations': window.RecommendationsComponent,
      'prep_sheet': window.PrepSheetComponent,
      'forecasting': window.ForecastingComponent,
      'waste': window.WasteComponent,
      'models': window.ModelsComponent,
      'events': window.EventsComponent,
      'upload': window.UploadComponent,
      'settings': window.SettingsComponent
    };
  }

  async init() {
    await this.updateHeader();
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    this.navigate(hash);

    window.addEventListener('hashchange', () => {
      const newHash = window.location.hash.replace('#', '') || 'dashboard';
      if (newHash !== this.currentRoute) {
        this.navigate(newHash, false);
      }
    });
  }

  async updateHeader() {
    try {
      const rests = await window.api.getRestaurants();
      const currentRest = rests.restaurants.find(r => r.id === window.api.activeRestaurantId) || rests.restaurants[0];
      
      const restSelect = document.getElementById('tenantSelect');
      if (restSelect) {
        restSelect.innerHTML = rests.restaurants.map(r => `
          <option value="${r.id}" ${r.id === window.api.activeRestaurantId ? 'selected' : ''}>
            ${r.name}
          </option>
        `).join('');
      }

      const restBadge = document.getElementById('activeRestBadge');
      if (restBadge && currentRest) {
        const isDemo = currentRest.id.includes('demo');
        restBadge.innerHTML = isDemo 
          ? '<span class="bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-amber-200">Demo Data Active</span>'
          : '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-emerald-200">Live Production</span>';
      }
    } catch (err) {
      console.warn("Header update warning:", err);
    }
  }

  navigate(route, updateHash = true) {
    if (!this.routes[route]) route = 'dashboard';
    this.currentRoute = route;

    if (updateHash) {
      window.location.hash = route;
    }

    // Update active nav link classes
    document.querySelectorAll('.nav-link').forEach(el => {
      const target = el.getAttribute('data-route');
      if (target === route) {
        el.className = 'nav-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 text-white shadow-sm';
      } else {
        el.className = 'nav-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition';
      }
    });

    // Render component
    const mainContainer = document.getElementById('main-content');
    if (mainContainer && this.routes[route]) {
      this.routes[route].render(mainContainer);
    }
  }
}

// Global instance
window.router = new IntelliChefRouter();

// Handle tenant switch from header
window.handleTenantChange = async function(restaurantId) {
  window.api.setRestaurant(restaurantId);
  await window.router.updateHeader();
  window.router.navigate(window.router.currentRoute);
};

// Bootstrap on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  window.router.init();
});
