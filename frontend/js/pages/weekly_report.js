import { get } from '../api.js';

let currentWeekStart = null;
let chartDept = null;
let chartCat = null;

function getWeekStart(d) {
  const day = d.getDay();
  const diff = day === 6 ? 0 : day + 1;
  const start = new Date(d);
  start.setDate(d.getDate() - diff);
  return start.toISOString().split('T')[0];
}

function destroyCharts() {
  if (chartDept) { chartDept.destroy(); chartDept = null; }
  if (chartCat) { chartCat.destroy(); chartCat = null; }
}

window.init_weekly_report = async function () {
  if (!currentWeekStart) currentWeekStart = getWeekStart(new Date());
  const content = document.getElementById('page-weekly-report');
  content.innerHTML = `
    <div class="toolbar">
      <h3>${__('Weekly Performance Report')}</h3>
      <div style="display:flex;gap:8px;align-items:center">
        <label style="font-size:13px">${__('Week starting')}:</label>
        <input class="form-control" id="report-week-start" type="date" value="${currentWeekStart}" style="width:180px">
        <button class="btn btn-primary" onclick="loadReport()">${__('Generate')}</button>
        <button class="btn btn-secondary" onclick="downloadReport('docx')">${__('DOCX')}</button>
        <button class="btn btn-secondary" onclick="downloadReport('pdf')">${__('PDF')}</button>
      </div>
    </div>
    <div id="report-content"><div class="empty" style="padding:40px;text-align:center">${__('Select a week and click Generate')}</div></div>
  `;
  await loadReport();
};

window.downloadReport = async function (fmt) {
  const ws = document.getElementById('report-week-start').value;
  const { getToken } = await import('../api.js');
  try {
    const res = await fetch(`/reports/weekly/${fmt}?week_start=${ws}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly_report_${ws}.${fmt}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert(__('Download failed') + `: ${e.message}`);
  }
};

window.loadReport = async function () {
  currentWeekStart = document.getElementById('report-week-start').value;
  destroyCharts();
  const content = document.getElementById('report-content');
  content.innerHTML = '<div class="empty" style="padding:40px;text-align:center">' + __('Loading...') + '</div>';
  try {
    const report = await get(`/reports/weekly?week_start=${currentWeekStart}`);
    renderReport(report, content);
  } catch (e) {
    content.innerHTML = `<div class="empty">${__('Failed to load report')}: ${e.message}</div>`;
  }
};

const DEPT_COLORS = {
  'الإنتاج': '#1a73e8',
  'الإنتاج (قسم التشغيل)': '#7b1fa2',
  'الصيانة': '#d32f2f',
  'المشتريات': '#f9a825',
  'الجودة': '#2e7d32',
};

function renderReport(report, container) {
  const { week_start, week_end, total_production_records, total_pieces_produced, total_defect_quantity, overall_defect_rate, machines, department_summary, category_summary } = report;

  let html = `
    <div class="kpi-grid" style="margin-bottom:20px">
      <div class="kpi-card primary"><div class="kpi-label">${__('Period')}</div><div class="kpi-value" style="font-size:16px">${week_start} – ${week_end}</div></div>
      <div class="kpi-card primary"><div class="kpi-label">${__('Production Records')}</div><div class="kpi-value">${total_production_records}</div></div>
      <div class="kpi-card primary"><div class="kpi-label">${__('Pieces Produced')}</div><div class="kpi-value">${total_pieces_produced}</div></div>
      <div class="kpi-card danger"><div class="kpi-label">${__('Total Defect Qty')}</div><div class="kpi-value">${total_defect_quantity}</div></div>
      <div class="kpi-card warning"><div class="kpi-label">${__('Overall Defect Rate')}${info('(total defects ÷ total pieces) × 100')}</div><div class="kpi-value">${overall_defect_rate}%</div></div>
    </div>
  `;

  // ── Charts Row ──────────────────────────────────────────────────────
  html += `<div class="chart-grid" style="margin-bottom:20px">
    <div class="card"><div class="card-header">${__('Department Distribution')}</div><div class="card-body"><canvas id="chart-dept"></canvas></div></div>
    <div class="card"><div class="card-header">${__('Top Defect Categories')}</div><div class="card-body"><canvas id="chart-cat"></canvas></div></div>
  </div>`;

  // ── Department Summary Table ────────────────────────────────────────
  html += `<div class="card" style="margin-bottom:20px">
    <div class="card-header">${__('Department Defect Distribution')}</div>
    <div class="card-body">
      <div class="table-wrap"><table>
        <thead><tr><th>${__('Department')}</th><th>${__('Total Defect Qty')}</th><th>${__('Percentage')}${info('(this dept defects ÷ total defects) × 100')}</th></tr></thead>
        <tbody>`;
  department_summary.forEach(d => {
    const color = DEPT_COLORS[d.department] || '#64748b';
    html += `<tr><td><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:${color};margin-right:8px"></span>${d.department}</td><td>${d.total_quantity}</td><td>${d.percentage}%</td></tr>`;
  });
  html += `</tbody></table></div></div></div>`;

  // ── Machine Reports ──────────────────────────────────────────────────
  machines.forEach(m => {
    html += `<div class="card" style="margin-bottom:16px">
      <div class="card-header">${m.machine_code} — ${m.hall}  <span style="font-weight:400;font-size:13px;color:var(--text-muted)">${__('Pieces')}: ${m.total_pieces_produced} | ${__('Defects')}: ${m.total_defect_quantity} | ${__('Rate')}: ${m.overall_defect_rate}%</span></div>
      <div class="card-body">
        <div class="table-wrap"><table>
          <thead><tr><th>${__('Defect Code')}</th><th>${__('Defect Name')}</th><th>${__('Quantity')}</th><th>${__('Rate %')}${info('(this defect qty ÷ total pieces on this machine) × 100')}</th></tr></thead>
          <tbody>`;
    if (m.defects.length === 0) {
      html += `<tr><td colspan="4" class="empty">${__('No defects recorded')}</td></tr>`;
    } else {
      m.defects.forEach(d => {
        const barWidth = Math.min(d.rate_percent * 10, 100);
        html += `<tr>
          <td>${d.defect_code}</td>
          <td>${d.defect_name}</td>
          <td>${d.quantity}</td>
          <td><div style="display:flex;align-items:center;gap:6px"><div style="width:80px;height:8px;background:#e2e8f0;border-radius:4px"><div style="width:${barWidth}%;height:100%;background:${d.rate_percent > 1 ? '#d32f2f' : '#f9a825'};border-radius:4px"></div></div>${d.rate_percent}%</div></td>
        </tr>`;
      });
    }
    html += `</tbody></table></div></div></div>`;
  });

  // ── Category Summary Table ──────────────────────────────────────────
  html += `<div class="card" style="margin-bottom:16px">
    <div class="card-header">${__('All Defect Categories By Quantity')}</div>
    <div class="card-body">
      <div class="table-wrap"><table>
        <thead><tr><th>${__('Code')}</th><th>${__('Defect Name')}</th><th>${__('Total Quantity')}</th></tr></thead>
        <tbody>`;
  category_summary.slice(0, 20).forEach(c => {
    html += `<tr><td>${c.defect_code}</td><td>${c.defect_name}</td><td>${c.total_quantity}</td></tr>`;
  });
  html += `</tbody></table></div></div></div>`;

  container.innerHTML = html;

  // ── Render Charts ────────────────────────────────────────────────────
  renderCharts(department_summary, category_summary);
}

function renderCharts(department_summary, category_summary) {
  const colors = ['#1a73e8', '#7b1fa2', '#d32f2f', '#f9a825', '#2e7d32', '#00838f', '#e65100', '#37474f'];

  // Department pie chart
  const deptCanvas = document.getElementById('chart-dept');
  if (deptCanvas && department_summary.length) {
    chartDept = new Chart(deptCanvas, {
      type: 'doughnut',
      data: {
        labels: department_summary.map(d => `${d.department} (${d.percentage}%)`),
        datasets: [{
          data: department_summary.map(d => d.total_quantity),
          backgroundColor: department_summary.map(d => DEPT_COLORS[d.department] || '#64748b'),
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
        },
      },
    });
  }

  // Category bar chart (top 10)
  const catCanvas = document.getElementById('chart-cat');
  if (catCanvas && category_summary.length) {
    const top = category_summary.slice(0, 10);
    chartCat = new Chart(catCanvas, {
      type: 'bar',
      data: {
        labels: top.map(c => c.defect_code),
        datasets: [{
          label: __('Total Quantity'),
          data: top.map(c => c.total_quantity),
          backgroundColor: colors.slice(0, top.length),
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });
  }
}


