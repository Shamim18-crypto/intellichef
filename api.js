// IntelliChef API Client
const API_BASE = window.location.origin.includes('http') ? window.location.origin : 'http://127.0.0.1:8000';

class IntelliChefAPI {
  constructor() {
    this.activeRestaurantId = localStorage.getItem('intellichef_active_rest_id') || 'demo-restaurant-001';
  }

  setRestaurant(restaurantId) {
    this.activeRestaurantId = restaurantId;
    localStorage.setItem('intellichef_active_rest_id', restaurantId);
  }

  async getRestaurants() {
    const res = await fetch(`${API_BASE}/api/restaurants`);
    return await res.json();
  }

  async createRestaurant(data) {
    const res = await fetch(`${API_BASE}/api/restaurants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  }

  async getSummary() {
    const res = await fetch(`${API_BASE}/api/restaurants/${this.activeRestaurantId}/summary`);
    if (!res.ok) throw new Error('Failed to fetch summary');
    return await res.json();
  }

  async getRecommendations(targetDate = null) {
    const url = new URL(`${API_BASE}/api/restaurants/${this.activeRestaurantId}/recommendations`);
    if (targetDate) url.searchParams.set('target_date', targetDate);
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return await res.json();
  }

  async getInventory() {
    const res = await fetch(`${API_BASE}/api/restaurants/${this.activeRestaurantId}/inventory`);
    return await res.json();
  }

  async updateInventory(inventoryList) {
    const res = await fetch(`${API_BASE}/api/restaurants/${this.activeRestaurantId}/inventory`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventory: inventoryList })
    });
    return await res.json();
  }

  async getSalesAnalytics(days = 60, itemId = null) {
    const url = new URL(`${API_BASE}/api/restaurants/${this.activeRestaurantId}/analytics/sales`);
    url.searchParams.set('days', days);
    if (itemId) url.searchParams.set('item_id', itemId);
    const res = await fetch(url);
    return await res.json();
  }

  async getWasteAnalytics() {
    const res = await fetch(`${API_BASE}/api/restaurants/${this.activeRestaurantId}/analytics/waste`);
    return await res.json();
  }

  async getDayOfWeekAnalytics() {
    const res = await fetch(`${API_BASE}/api/restaurants/${this.activeRestaurantId}/analytics/day-of-week`);
    return await res.json();
  }

  async getEvents() {
    const res = await fetch(`${API_BASE}/api/restaurants/${this.activeRestaurantId}/events`);
    return await res.json();
  }

  async addEvent(eventData) {
    const res = await fetch(`${API_BASE}/api/restaurants/${this.activeRestaurantId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    return await res.json();
  }

  async deleteEvent(eventId) {
    const res = await fetch(`${API_BASE}/api/restaurants/${this.activeRestaurantId}/events/${eventId}`, {
      method: 'DELETE'
    });
    return await res.json();
  }

  async getModelPerformance(itemId = null) {
    const url = new URL(`${API_BASE}/api/restaurants/${this.activeRestaurantId}/models`);
    if (itemId) url.searchParams.set('item_id', itemId);
    const res = await fetch(url);
    return await res.json();
  }

  async getSettings() {
    const res = await fetch(`${API_BASE}/api/restaurants/${this.activeRestaurantId}/settings`);
    return await res.json();
  }

  async updateSettings(settings) {
    const res = await fetch(`${API_BASE}/api/restaurants/${this.activeRestaurantId}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return await res.json();
  }

  async seedDemo(days = 365) {
    const res = await fetch(`${API_BASE}/api/demo/seed?days=${days}`, {
      method: 'POST'
    });
    return await res.json();
  }

  async validateCSV(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/api/csv/validate`, {
      method: 'POST',
      body: formData
    });
    return await res.json();
  }

  async importCSV(csvContent, columnMapping) {
    const res = await fetch(`${API_BASE}/api/csv/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_id: this.activeRestaurantId,
        csv_content: csvContent,
        column_mapping: columnMapping
      })
    });
    return await res.json();
  }
}

window.api = new IntelliChefAPI();
