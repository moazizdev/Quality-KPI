import { loadKpiSummary, loadDefectsByCategory, loadDefectsByMachine } from '../api.js';

let initialized = false;
let chartCategory = null;
let chartMachine = null;

let dateFrom = '';
let dateTo = '';

function buildLayout(content) {
  content.innerHTML = `
    <div class="filter-bar" style="display:flex;gap:12px;align-items:end;margin-bottom:16px;flex-wrap:wrap">
      <div class="form-group" style="margin:0"><label>${__('Date From')}</label><input class="form-control" id="dash-date-from" type="date" style="height:36px"></div>
      <div class="form-group" style="margin:0"><label>${__('Date To')}</label><input class="form-control" id="dash-date-to" type="date" style="height:36px"></div>
      <button class="btn btn-primary" onclick="applyDashFilter()" style="height:36px">${__('Apply')}</button>
      <button class="btn" onclick="clearDashFilter()" style="height:36px">${__('Clear')}</button>
    </div>
    <div class="kpi-grid" id="kpi-grid"></div>
    <div class="chart-grid">
      <div class="card"><div class="card-header">${__('Defects by Category')}</div><div class="card-body"><canvas id="chart-category"></canvas></div></div>
      <div class="card"><div class="card-header">${__('Defects by Machine')}</div><div class="card-body"><canvas id="chart-machine"></canvas></div></div>
    </div>
  `;
}

window.applyDashFilter = function () {
  dateFrom = document.getElementById('dash-date-from').value;
  dateTo = document.getElementById('dash-date-to').value;
  resetCharts();
  init_dashboard();
};

window.clearDashFilter = function () {
  dateFrom = '';
  dateTo = '';
  document.getElementById('dash-date-from').value = '';
  document.getElementById('dash-date-to').value = '';
  resetCharts();
  init_dashboard();
};

function resetCharts() {
  if (chartCategory) { chartCategory.destroy(); chartCategory = null; }
  if (chartMachine) { chartMachine.destroy(); chartMachine = null; }
  initialized = false;
}

window.init_dashboard = async function () {
  const content = document.getElementById('page-dashboard');

  if (!initialized) {
    buildLayout(content);
    initialized = true;
  }

  const catCanvas = document.getElementById('chart-category');
  const machCanvas = document.getElementById('chart-machine');
  if (!catCanvas || !machCanvas) {
    resetCharts();
    buildLayout(content);
    initialized = true;
  }

  try {
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    const summary = await loadKpiSummary(params);
    document.getElementById('kpi-grid').innerHTML = `
      <div class="kpi-card primary"><div class="kpi-label">${__('Production Records')}</div><div class="kpi-value">${summary.total_production_records}</div></div>
      <div class="kpi-card warning"><div class="kpi-label">${__('Deviations')}</div><div class="kpi-value">${summary.total_deviations}</div></div>
      <div class="kpi-card danger"><div class="kpi-label">${__('Defect Rate')}${info('% of defective pieces out of total production')}</div><div class="kpi-value">${summary.defect_rate_percent}%</div><div class="kpi-sub">${summary.total_defect_quantity} ${__('total defect qty')}</div></div>
      <div class="kpi-card success"><div class="kpi-label">${__('Open CAPA Cases')}${info('CAPA cases still open or in progress')}</div><div class="kpi-value">${summary.open_capa_cases}</div></div>
      <div class="kpi-card primary"><div class="kpi-label">${__('Open Complaints')}${info('Complaints still open or under review')}</div><div class="kpi-value">${summary.open_complaints}</div></div>
    `;
    const [cats, machines] = await Promise.all([loadDefectsByCategory(params), loadDefectsByMachine(params)]);
    const colors = ['#1a73e8','#2e7d32','#f9a825','#d32f2f','#7b1fa2','#00838f','#e65100','#37474f'];

    if (cats.length) {
      if (chartCategory) {
        chartCategory.data.labels = cats.map(c => c.defect_name);
        chartCategory.data.datasets[0].data = cats.map(c => c.total_quantity);
        chartCategory.data.datasets[0].backgroundColor = colors.slice(0, cats.length);
        chartCategory.update();
      } else {
        chartCategory = new Chart(document.getElementById('chart-category'), {
          type: 'bar',
          data: { labels: cats.map(c => c.defect_name), datasets: [{ label: __('Quantity'), data: cats.map(c => c.total_quantity), backgroundColor: colors.slice(0, cats.length) }] },
          options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
      }
    }

    if (machines.length) {
      if (chartMachine) {
        chartMachine.data.labels = machines.map(m => `${m.machine_code} (${m.hall})`);
        chartMachine.data.datasets[0].data = machines.map(m => m.total_quantity);
        chartMachine.data.datasets[0].backgroundColor = colors.slice(0, machines.length);
        chartMachine.update();
      } else {
        chartMachine = new Chart(document.getElementById('chart-machine'), {
          type: 'bar',
          data: { labels: machines.map(m => `${m.machine_code} (${m.hall})`), datasets: [{ label: __('Quantity'), data: machines.map(m => m.total_quantity), backgroundColor: colors.slice(0, machines.length) }] },
          options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
      }
    }
  } catch (e) {
    if (e.message !== 'Session expired') {
      resetCharts();
      content.innerHTML = `<div class="empty">${__('Failed to load dashboard')}: ${e.message}</div>`;
    }
  }
};