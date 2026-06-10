import { listWithMeta, list } from '../api.js';

let currentPage = 0;
const PER_PAGE = 50;

window.init_audit_logs = async function () {
  if (!window.isAdmin()) {
    document.getElementById('page-audit-logs').innerHTML = `<div class="empty">${__('Admin access required')}</div>`;
    return;
  }
  const content = document.getElementById('page-audit-logs');
  content.innerHTML = `
    <div class="toolbar">
      <h3>${__('Audit Logs')}</h3>
      <input type="search" class="table-search" id="audit-search" placeholder="${__('Search')}..." oninput="filterTable('audit-tbody', this.value)">
      <div class="btn-group">
        <select id="audit-filter-action" class="form-control" style="width:auto" onchange="init_audit_logs()">
          <option value="">${__('All Actions')}</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>
        <select id="audit-filter-entity" class="form-control" style="width:auto" onchange="init_audit_logs()">
          <option value="">${__('All Types')}</option>
          <option value="production_record">${__('Production Records')}</option>
          <option value="deviation">${__('Deviations')}</option>
          <option value="capa_case">CAPA</option>
          <option value="complaint">${__('Customer Complaints')}</option>
          <option value="user">${__('Users')}</option>
          <option value="hall">${__('Halls')}</option>
          <option value="machine">${__('Machines')}</option>
          <option value="product">${__('Products')}</option>
          <option value="defect_category">${__('Defect Categories')}</option>
        </select>
        <button class="btn btn-sm" onclick="init_audit_logs()">${__('Refresh')}</button>
      </div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>${__('Time')}</th>
              <th>${__('User')}</th>
              <th>${__('Action')}</th>
              <th>${__('Type')}</th>
              <th>${__('Summary')}</th>
              <th>${__('Details')}</th>
            </tr>
          </thead>
          <tbody id="audit-tbody"><tr><td colspan="6" class="loading">${__('Loading...')}</td></tr></tbody>
        </table>
      </div>
      <div class="pagination" id="audit-pagination"></div>
    </div>
  `;
  currentPage = 0;
  await loadAuditLogs();
};

async function loadAuditLogs() {
  const action = document.getElementById('audit-filter-action').value;
  const entity = document.getElementById('audit-filter-entity').value;
  const params = new URLSearchParams({ skip: currentPage * PER_PAGE, limit: String(PER_PAGE) });
  if (action) params.set('action', action);
  if (entity) params.set('entity_type', entity);

  const { data, total } = await listWithMeta(`/audit-logs?${params}`);
  const tbody = document.getElementById('audit-tbody');

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty">${__('No logs found')}</td></tr>`;
    document.getElementById('audit-pagination').innerHTML = '';
    return;
  }

  tbody.innerHTML = data.map(log => {
    const actionClass = log.action === 'CREATE' ? 'badge-open' : log.action === 'DELETE' ? '' : 'badge-in_progress';
    const actionBadge = log.action === 'DELETE'
      ? `<span style="color:#d32f2f;font-weight:700">${log.action}</span>`
      : `<span class="badge ${actionClass || 'badge-closed'}">${log.action}</span>`;

    const details = log.details ? Object.entries(log.details).map(([k, v]) =>
      `<span style="font-size:11px;color:#64748b">${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}</span>`
    ).join('<br>') : '';

    const time = log.created_at
      ? new Date(log.created_at + 'Z').toLocaleString(getLang() === 'ar' ? 'ar-EG' : 'en-US')
      : '';

    return `<tr>
      <td style="white-space:nowrap;font-size:12px">${time}</td>
      <td>${log.username}</td>
      <td>${actionBadge}</td>
      <td>${__(entityLabel(log.entity_type))}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">${log.summary || ''}</td>
      <td style="max-width:250px;font-size:12px">${details}</td>
    </tr>`;
  }).join('');

  renderPagination(total, currentPage, PER_PAGE, 'audit-pagination');
}

function entityLabel(type) {
  const labels = {
    production_record: 'Production Records',
    deviation: 'Deviations',
    capa_case: 'CAPA Cases',
    complaint: 'Customer Complaints',
    user: 'Users',
    hall: 'Halls',
    machine: 'Machines',
    product: 'Products',
    defect_category: 'Defect Categories',
  };
  return labels[type] || type;
}

function renderPagination(total, page, perPage, containerId) {
  const el = document.getElementById(containerId);
  const totalPages = Math.ceil(total / perPage) || 1;
  el.innerHTML = `
    <div class="pagination-info">${total} ${__('records')}</div>
    <div class="pagination-controls">
      <button class="btn btn-sm" onclick="window.loadAuditPage(${page - 1})" ${page === 0 ? 'disabled' : ''}>${__('Prev')}</button>
      <span class="pagination-perpage">${page + 1} / ${totalPages}</span>
      <button class="btn btn-sm" onclick="window.loadAuditPage(${page + 1})" ${page >= totalPages - 1 ? 'disabled' : ''}>${__('Next')}</button>
    </div>
  `;
}

window.loadAuditPage = function (page) {
  currentPage = page;
  loadAuditLogs();
};
