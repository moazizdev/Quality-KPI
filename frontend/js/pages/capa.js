import { listWithMeta, list, get, create, update, del } from '../api.js';

let currentPage = 1;
let perPage = 25;
let totalRecords = 0;

window.init_capa = async function () {
  document.getElementById('page-capa').innerHTML = `
    <div class="toolbar"><h3>${__('CAPA Cases')}</h3><div class="btn-group"><button class="btn btn-primary" onclick="openCapaForm()">+ ${__('Add CAPA')}</button><button class="btn btn-secondary" onclick="exportExcel('/capa/export/excel')">${__('Export Excel')}</button></div></div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>${__('ID')}</th><th>${__('Deviation')}</th><th>${__('Status')}</th><th>${__('Department')}</th><th>${__('Probable Cause')}</th><th>${__('Time')}</th><th>${__('Created')}</th><th>${__('Actions')}</th></tr></thead><tbody id="capa-tbody"></tbody></table></div>
    <div class="pagination" id="capa-pagination"></div></div>
    <div class="modal-overlay" id="capa-modal"><div class="modal">
      <div class="modal-header"><span id="capa-modal-title">${__('Add CAPA Case')}</span><button class="close" onclick="closeCapaForm()">&times;</button></div>
      <div class="modal-body">
        <div class="form-group"><label>${__('Deviation')}</label><select class="form-control" id="capa-deviation"></select></div>
        <div class="form-group"><label>${__('Probable Cause')}</label><textarea class="form-control" id="capa-cause" rows="2"></textarea></div>
        <div class="form-group"><label>${__('Immediate Correction')}</label><textarea class="form-control" id="capa-immediate" rows="2"></textarea></div>
        <div class="form-group"><label>${__('Corrective Action')}</label><textarea class="form-control" id="capa-corrective" rows="2"></textarea></div>
        <div class="form-group"><label>${__('Preventive Action')}</label><textarea class="form-control" id="capa-preventive" rows="2"></textarea></div>
        <div class="form-row">
          <div class="form-group"><label>${__('Status')}</label><select class="form-control" id="capa-status"><option value="open">${__('Open')}</option><option value="in_progress">${__('In Progress')}</option><option value="closed">${__('Closed')}</option></select></div>
          <div class="form-group"><label>${__('Department')}</label><select class="form-control" id="capa-dept"><option value="">${__('-- None --')}</option></select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>${__('Time (24h)')}</label><input class="form-control" id="capa-time" type="time"></div>
          <div class="form-group"></div>
        </div>
      </div>
      <div class="modal-footer"><button class="btn" onclick="closeCapaForm()">${__('Cancel')}</button><button class="btn btn-primary" onclick="saveCapa()">${__('Save')}</button></div>
    </div></div>
  `;
  currentPage = 1;
  await loadCapas();
};

async function loadCapas() {
  const skip = (currentPage - 1) * perPage;
  const res = await listWithMeta(`/capa?skip=${skip}&limit=${perPage}`);
  totalRecords = res.total;
  document.getElementById('capa-tbody').innerHTML = res.data.map(c => `
    <tr><td>${c.id}</td><td>#${c.deviation_id}</td><td><span class="badge badge-${c.status}">${c.status.replace('_',' ')}</span></td><td>${c.assigned_department || '-'}</td><td>${(c.probable_cause || '').substring(0, 50)}</td><td>${c.capa_time || '-'}</td><td>${new Date(c.created_at).toLocaleDateString()}</td>
    <td><div class="btn-group"><button class="btn btn-sm btn-primary" onclick="editCapa(${c.id})">${__('Edit')}</button><button class="btn btn-sm btn-danger" onclick="deleteCapa(${c.id})">${__('Delete')}</button></div></td></tr>
  `).join('');
  renderPagination();
}

function renderPagination() {
  const totalPages = Math.max(1, Math.ceil(totalRecords / perPage));
  if (currentPage > totalPages) currentPage = totalPages;
  const from = totalRecords === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, totalRecords);
  let html = `<div class="pagination-info">${from}–${to} ${__('of')} ${totalRecords}</div><div class="pagination-controls">`;
  html += `<button class="btn btn-sm" onclick="goCapaPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>&laquo; ${__('Prev')}</button>`;
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="btn btn-sm ${i === currentPage ? 'btn-primary' : ''}" onclick="goCapaPage(${i})">${i}</button>`;
  }
  html += `<button class="btn btn-sm" onclick="goCapaPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>${__('Next')} &raquo;</button>`;
  html += `</div><div class="pagination-perpage"><label>${__('Per page')}: <select onchange="changeCapaPerPage(this.value)">`;
  [10, 25, 50, 100].forEach(n => html += `<option value="${n}" ${n === perPage ? 'selected' : ''}>${n}</option>`);
  html += `</select></label></div>`;
  document.getElementById('capa-pagination').innerHTML = html;
}

window.goCapaPage = (page) => {
  const totalPages = Math.max(1, Math.ceil(totalRecords / perPage));
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  loadCapas();
};

window.changeCapaPerPage = (n) => {
  perPage = parseInt(n, 10);
  currentPage = 1;
  loadCapas();
};

let editingCapaId = null;

window.openCapaForm = async (data) => {
  editingCapaId = data?.id || null;
  document.getElementById('capa-modal-title').textContent = editingCapaId ? __('Edit CAPA Case') : __('Add CAPA Case');
  document.getElementById('capa-cause').value = data?.probable_cause || '';
  document.getElementById('capa-time').value = data?.capa_time || new Date().toTimeString().slice(0, 5);
  document.getElementById('capa-immediate').value = data?.immediate_correction || '';
  document.getElementById('capa-corrective').value = data?.corrective_action || '';
  document.getElementById('capa-preventive').value = data?.preventive_action || '';
  document.getElementById('capa-status').value = data?.status || 'open';
  const depts = await list('/departments');
  const deptSel = document.getElementById('capa-dept');
  deptSel.innerHTML = `<option value="">${__('-- None --')}</option>` + depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
  deptSel.value = data?.assigned_department || '';
  const deviations = await list('/deviations');
  const sel = document.getElementById('capa-deviation');
  sel.innerHTML = deviations.map(d => `<option value="${d.id}" ${data && d.id === data.deviation_id ? 'selected' : ''}>#${d.id} - ${d.date}</option>`).join('');
  document.getElementById('capa-modal').classList.add('active');
};

window.closeCapaForm = () => document.getElementById('capa-modal').classList.remove('active');

window.saveCapa = async () => {
  const body = {
    deviation_id: parseInt(document.getElementById('capa-deviation').value),
    capa_time: document.getElementById('capa-time').value || null,
    probable_cause: document.getElementById('capa-cause').value.trim() || null,
    immediate_correction: document.getElementById('capa-immediate').value.trim() || null,
    corrective_action: document.getElementById('capa-corrective').value.trim() || null,
    preventive_action: document.getElementById('capa-preventive').value.trim() || null,
    status: document.getElementById('capa-status').value,
    assigned_department: document.getElementById('capa-dept').value.trim() || null,
  };
  try {
    if (editingCapaId) {
      await update(`/capa/${editingCapaId}`, body);
      showToast(__('CAPA updated'));
    } else {
      await create('/capa', body);
      showToast(__('CAPA created'));
    }
    closeCapaForm();
    if (!editingCapaId) currentPage = 1;
    await loadCapas();
  } catch (e) { showToast(e.message, 'error'); }
};

window.editCapa = async (id) => {
  const item = await get(`/capa/${id}`);
  if (item) window.openCapaForm(item);
};

window.deleteCapa = async (id) => {
  if (!confirm(__('Delete this CAPA case?'))) return;
  try { await del(`/capa/${id}`); showToast(__('CAPA deleted')); await loadCapas(); }
  catch (e) { showToast(e.message, 'error'); }
};
