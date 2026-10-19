// IntelliChef CSV Data Importer & Column Mapping Wizard
window.UploadComponent = {
  rawCsvContent: null,
  validationData: null,

  async render(container) {
    this.rawCsvContent = null;
    this.validationData = null;

    container.innerHTML = `
      <div class="mb-6">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Historical Sales CSV Import Wizard</h1>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Smart Column Mapping
          </span>
        </div>
        <p class="text-slate-500 text-sm mt-1">
          Upload your restaurant's historical sales CSV. IntelliChef validates data integrity and learns your unique demand patterns.
        </p>
      </div>

      <!-- Step 1: Upload Dropzone -->
      <div id="dropzoneSection" class="bg-white rounded-2xl p-8 border-2 border-dashed border-slate-300 hover:border-emerald-500 transition text-center mb-6 shadow-sm">
        <div class="max-w-md mx-auto">
          <div class="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-4">
            📄
          </div>
          <h3 class="text-base font-bold text-slate-900">Drag & Drop your Sales CSV here</h3>
          <p class="text-xs text-slate-500 mt-1 mb-5">Supports exports from Toast, Square, Clover, Micros, Lightspeed, or custom spreadsheets.</p>
          
          <label class="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-sm cursor-pointer transition">
            <span>Browse CSV File</span>
            <input type="file" id="csvFileInput" accept=".csv" class="hidden" onchange="window.UploadComponent.handleFile(this.files[0])" />
          </label>

          <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-xs text-slate-400">
            <span>✓ Date / Quantity / Item required</span>
            <span>✓ Waste & covers optional</span>
          </div>
        </div>
      </div>

      <!-- Quick Sample CSV Generator Button -->
      <div class="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          <span class="font-bold text-slate-800">Need sample CSV format?</span>
          <span>Click to populate a valid 60-day sample sales CSV to test mapping immediately.</span>
        </div>
        <button 
          onclick="window.UploadComponent.loadSampleCsv()" 
          class="bg-white hover:bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition shrink-0"
        >
          Load Sample Sales CSV
        </button>
      </div>

      <!-- Dynamic Wizard Container for Step 2 & 3 -->
      <div id="wizardDetailsContainer"></div>
    `;
  },

  async handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      this.rawCsvContent = e.target.result;
      await this.runValidation();
    };
    reader.readAsText(file);
  },

  async loadSampleCsv() {
    const today = new Date();
    const rows = ["date,dish_name,qty_sold,category,covers,waste_portions,unit_cost,price"];
    
    for (let i = 60; i >= 1; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dtStr = d.toISOString().split('T')[0];
      const dow = d.getDay();
      const mult = (dow === 0 || dow === 6) ? 1.3 : 1.0;
      
      const biryaniQty = Math.round(140 * mult + (Math.random() * 15 - 7));
      const butterChknQty = Math.round(110 * mult + (Math.random() * 12 - 6));
      const naanQty = Math.round(200 * mult + (Math.random() * 20 - 10));
      const paneerQty = Math.round(75 * mult + (Math.random() * 8 - 4));

      rows.push(`${dtStr},Royal Biryani,${biryaniQty},Main,${Math.round(biryaniQty*1.4)},${Math.round(biryaniQty*0.08)},6.0,18.0`);
      rows.push(`${dtStr},Smoked Butter Chicken,${butterChknQty},Main,${Math.round(butterChknQty*1.4)},${Math.round(butterChknQty*0.07)},5.0,17.0`);
      rows.push(`${dtStr},Garlic Naan,${naanQty},Sides,${Math.round(naanQty*1.4)},${Math.round(naanQty*0.05)},1.0,5.0`);
      rows.push(`${dtStr},Paneer Tikka,${paneerQty},Appetizers,${Math.round(paneerQty*1.4)},${Math.round(paneerQty*0.06)},3.5,13.0`);
    }

    this.rawCsvContent = rows.join("\n");
    await this.runValidation();
  },

  async runValidation() {
    const container = document.getElementById('wizardDetailsContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="flex items-center justify-center p-8 bg-white rounded-xl border border-slate-200">
        <div class="inline-block animate-spin rounded-full h-6 w-6 border-3 border-emerald-500 border-t-transparent"></div>
        <span class="ml-3 text-slate-600 text-sm font-medium">Validating CSV schema and parsing columns...</span>
      </div>
    `;

    // Send file to validator API
    const blob = new Blob([this.rawCsvContent], { type: 'text/csv' });
    const formData = new FormData();
    formData.append('file', blob, 'import.csv');

    try {
      const res = await fetch(`${API_BASE}/api/csv/validate`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      this.validationData = data;
      this.renderMappingAndPreview();
    } catch (err) {
      container.innerHTML = `<div class="p-4 bg-red-50 text-red-700 rounded-lg">Validation Error: ${err.message}</div>`;
    }
  },

  renderMappingAndPreview() {
    const data = this.validationData;
    const container = document.getElementById('wizardDetailsContainer');
    if (!container) return;

    const cols = data.columns || [];
    const mapping = data.suggested_mapping || {};

    const canonFields = [
      { key: 'date', label: 'Sale Date', required: true, desc: 'Daily transaction date (YYYY-MM-DD, MM/DD/YYYY)' },
      { key: 'item_name', label: 'Menu Item Name', required: true, desc: 'Name of the prepared food dish' },
      { key: 'quantity_sold', label: 'Quantity Sold', required: true, desc: 'Portions or units served' },
      { key: 'category', label: 'Category / Course', required: false, desc: 'e.g. Main Course, Appetizer, Sides' },
      { key: 'customers_count', label: 'Total Guests / Covers', required: false, desc: 'Daily dining guest count' },
      { key: 'waste_quantity', label: 'Waste / Unsold Portions', required: false, desc: 'Food waste logged' },
      { key: 'cost_price', label: 'Unit Cost ($)', required: false, desc: 'Food prep cost per portion' },
      { key: 'selling_price', label: 'Selling Price ($)', required: false, desc: 'Menu sales price' }
    ];

    container.innerHTML = `
      <!-- Step 2: Column Mapping -->
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div>
            <h3 class="font-bold text-slate-900 text-base">Step 2: Verify Smart Column Mapping</h3>
            <p class="text-xs text-slate-400">Match your CSV column headers to canonical IntelliChef fields</p>
          </div>
          <span class="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
            Auto-Detected
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${canonFields.map(f => {
            const mappedVal = mapping[f.key] || '';
            return `
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div class="flex items-center justify-between mb-1.5">
                  <label class="text-xs font-bold text-slate-800">
                    ${f.label} ${f.required ? '<span class="text-red-500">*</span>' : ''}
                  </label>
                  <span class="text-[10px] text-slate-400 font-mono">${f.key}</span>
                </div>
                <select 
                  id="map_${f.key}" 
                  class="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Ignore / Not in CSV --</option>
                  ${cols.map(c => `
                    <option value="${c}" ${c === mappedVal ? 'selected' : ''}>${c}</option>
                  `).join('')}
                </select>
                <div class="text-[10px] text-slate-400 mt-1">${f.desc}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Step 3: Data Integrity Summary & Preview -->
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div>
            <h3 class="font-bold text-slate-900 text-base">Step 3: Data Integrity Summary</h3>
            <p class="text-xs text-slate-400">Validated against date consistency and numerical bounds</p>
          </div>
          <span class="text-xs font-bold ${data.success ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'} px-2.5 py-1 rounded-full">
            ${data.success ? '✓ Schema Valid' : '⚠️ Issues Found'}
          </span>
        </div>

        <!-- Metric Badges -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 text-center">
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div class="text-xs text-slate-400">Total Rows</div>
            <div class="text-lg font-bold text-slate-800">${data.total_rows}</div>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div class="text-xs text-slate-400">Discovered Menu Items</div>
            <div class="text-lg font-bold text-slate-800">${data.unique_items_count}</div>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div class="text-xs text-slate-400">Date Range</div>
            <div class="text-xs font-bold text-slate-800 mt-1">${data.date_range.min || 'N/A'} to ${data.date_range.max || 'N/A'}</div>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div class="text-xs text-slate-400">Validation Status</div>
            <div class="text-sm font-bold text-emerald-600 mt-0.5">Ready for Import</div>
          </div>
        </div>

        <!-- Preview Rows Table -->
        <div class="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <div class="p-3 bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200">
            Previewing first ${data.preview_rows.length} rows:
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs font-mono">
              <thead class="bg-slate-100 text-[10px] text-slate-500 uppercase">
                <tr>
                  ${cols.map(c => `<th class="py-2 px-3">${c}</th>`).join('')}
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${data.preview_rows.map(row => `
                  <tr>
                    ${cols.map(c => `<td class="py-2 px-3 text-slate-700">${row[c] !== undefined ? row[c] : ''}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Confirm Import Action -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button 
            onclick="window.UploadComponent.render(document.getElementById('main-content'))" 
            class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Clear / Start Over
          </button>
          <button 
            onclick="window.UploadComponent.executeImport()" 
            class="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition flex items-center gap-2"
          >
            <span>🚀 Ingest Sales Data & Train Models</span>
          </button>
        </div>

      </div>
    `;
  },

  async executeImport() {
    const finalMapping = {
      date: document.getElementById('map_date').value,
      item_name: document.getElementById('map_item_name').value,
      quantity_sold: document.getElementById('map_quantity_sold').value,
      category: document.getElementById('map_category').value,
      customers_count: document.getElementById('map_customers_count').value,
      waste_quantity: document.getElementById('map_waste_quantity').value,
      cost_price: document.getElementById('map_cost_price').value,
      selling_price: document.getElementById('map_selling_price').value
    };

    if (!finalMapping.date || !finalMapping.item_name || !finalMapping.quantity_sold) {
      alert("Please ensure Date, Menu Item Name, and Quantity Sold columns are mapped.");
      return;
    }

    const container = document.getElementById('wizardDetailsContainer');
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent mb-4"></div>
        <h3 class="text-base font-bold text-slate-900">Ingesting Sales Data & Retraining Models...</h3>
        <p class="text-xs text-slate-500 mt-1">Calculating day-of-week seasonality, customer covers elasticity, and chronological backtests.</p>
      </div>
    `;

    try {
      const res = await window.api.importCSV(this.rawCsvContent, finalMapping);
      if (res.success) {
        container.innerHTML = `
          <div class="p-8 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
            <div class="text-4xl mb-3">🎉</div>
            <h3 class="text-lg font-black text-emerald-900">Import & Model Training Successful!</h3>
            <p class="text-xs text-emerald-700 mt-1 mb-5">
              Successfully ingested ${res.rows_imported} sales records across ${res.new_items_created} items.
            </p>
            <button 
              onclick="window.router.navigate('recommendations')" 
              class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm"
            >
              View Tomorrow's Prep Recommendations →
            </button>
          </div>
        `;
      } else {
        alert("Import failed: " + (res.error || "Unknown error"));
      }
    } catch (err) {
      alert("Import error: " + err.message);
    }
  }
};
