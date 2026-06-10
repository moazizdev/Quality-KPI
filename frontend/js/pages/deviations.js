import { listWithMeta, list, create, update, del } from '../api.js';

let currentPage = 1;
let perPage = 25;
let totalRecords = 0;
let editingDevId = null;

window.init_deviations = async function () {
  const content = document.getElementById('page-deviations');
  content.innerHTML = `
    <div class="toolbar"><h3>${__('Deviations')}</h3><div class="btn-group"><button class="btn btn-primary" onclick="openDevForm()">+ ${__('Add Deviation')}</button><button class="btn btn-secondary" onclick="exportExcel('/deviations/export/excel')">${__('Export Excel')}</button></div></div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>${__('ID')}</th><th>${__('Date')}</th><th>${__('Time')}</th><th>${__('Machine')}</th><th>${__('Product')}</th><th>${__('Defect Category')}</th><th>${__('Qty')}</th><th>${__('Notes')}</th><th>${__('Actions')}</th></tr></thead><tbody id="dev-tbody"></tbody></table></div>
    <div class="pagination" id="dev-pagination"></div></div>
    <div class="modal-overlay" id="dev-modal"><div class="modal">
      <div class="modal-header"><span id="dev-modal-title">${__('Add Deviation')}</span><button class="close" onclick="closeDevForm()">&times;</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label>${__('Machine')}</label><select class="form-control" id="dev-machine"></select></div>
          <div class="form-group"><label>${__('Product')}</label><select class="form-control" id="dev-product"></select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>${__('Defect Category')}</label><select class="form-control" id="dev-defect"></select></div>
          <div class="form-group"><label>${__('Date')}</label><input class="form-control" id="dev-date" type="date"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>${__('Time (24h)')}</label><input class="form-control" id="dev-time" type="time"></div>
          <div class="form-group"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>${__('Quantity')}${info('Number of defective pieces for this defect')}</label><input class="form-control" id="dev-qty" type="number"></div>
          <div class="form-group"><label>${__('Notes')}</label><input class="form-control" id="dev-notes"></div>
        </div>
      </div>
      <div class="modal-footer"><button class="btn" onclick="closeDevForm()">${__('Cancel')}</button><button class="btn btn-primary" onclick="saveDev()">${__('Save')}</button></div>
    </div></div>
  `;
  currentPage = 1;
  await loadDevs();
};

async function loadDevs() {
  const skip = (currentPage - 1) * perPage;
  const [res, machines, products, defects] = await Promise.all([
    listWithMeta(`/deviations?skip=${skip}&limit=${perPage}`),
    list('/machines'), list('/products'), list('/defect-categories')
  ]);
  totalRecords = res.total;
  const mMap = Object.fromEntries(machines.map(m => [m.id, m.machine_code]));
  const pMap = Object.fromEntries(products.map(p => [p.id, p.product_name_ar || p.product_name]));
  const dMap = Object.fromEntries(defects.map(d => [d.id, d.defect_name]));
  document.getElementById('dev-tbody').innerHTML = res.data.map(d => `
    <tr><td>${d.id}</td><td>${d.date}</td><td>${d.deviation_time || '-'}</td><td>${mMap[d.machine_id] || d.machine_id}</td><td>${pMap[d.product_id] || d.product_id}</td><td>${dMap[d.defect_category_id] || d.defect_category_id}</td><td>${d.quantity}</td><td>${d.notes || '-'}</td>
    <td><div class="btn-group"><button class="btn btn-sm" onclick="editDev(${d.id})">${__('Edit')}</button><button class="btn btn-sm btn-danger" onclick="deleteDev(${d.id})">${__('Delete')}</button></div></td></tr>
  `).join('');
  renderPagination();
}

function renderPagination() {
  const totalPages = Math.max(1, Math.ceil(totalRecords / perPage));
  if (currentPage > totalPages) currentPage = totalPages;
  const from = totalRecords === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, totalRecords);
  let html = `<div class="pagination-info">${from}–${to} ${__('of')} ${totalRecords}</div><div class="pagination-controls">`;
  html += `<button class="btn btn-sm" onclick="goDevPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>&laquo; ${__('Prev')}</button>`;
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="btn btn-sm ${i === currentPage ? 'btn-primary' : ''}" onclick="goDevPage(${i})">${i}</button>`;
  }
  html += `<button class="btn btn-sm" onclick="goDevPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>${__('Next')} &raquo;</button>`;
  html += `</div><div class="pagination-perpage"><label>${__('Per page')}: <select onchange="changeDevPerPage(this.value)">`;
  [10, 25, 50, 100].forEach(n => html += `<option value="${n}" ${n === perPage ? 'selected' : ''}>${n}</option>`);
  html += `</select></label></div>`;
  document.getElementById('dev-pagination').innerHTML = html;
}

window.goDevPage = (page) => {
  const totalPages = Math.max(1, Math.ceil(totalRecords / perPage));
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  loadDevs();
};

window.changeDevPerPage = (n) => {
  perPage = parseInt(n, 10);
  currentPage = 1;
  loadDevs();
};

window.editDev = async (id) => {
  editingDevId = id;
  const d = await list(`/deviations/${id}`);
  document.getElementById('dev-modal-title').textContent = __('Edit');
  const [machines, products, defects] = await Promise.all([
    list('/machines'), list('/products'), list('/defect-categories')
  ]);
  document.getElementById('dev-machine').innerHTML = machines.map(m => `<option value="${m.id}" ${m.id === d.machine_id ? 'selected' : ''}>${m.machine_code} - ${m.machine_name}</option>`).join('');
  document.getElementById('dev-product').innerHTML = products.map(p => `<option value="${p.id}" ${p.id === d.product_id ? 'selected' : ''}>${p.product_name_ar || p.product_name}</option>`).join('');
  document.getElementById('dev-defect').innerHTML = defects.map(dc => `<option value="${dc.id}" ${dc.id === d.defect_category_id ? 'selected' : ''}>[${dc.defect_code}] ${dc.defect_name}</option>`).join('');
  document.getElementById('dev-date').value = d.date;
  document.getElementById('dev-time').value = d.deviation_time || '';
  document.getElementById('dev-qty').value = d.quantity;
  document.getElementById('dev-notes').value = d.notes || '';
  document.getElementById('dev-modal').classList.add('active');
};

window.openDevForm = async () => {
  editingDevId = null;
  document.getElementById('dev-modal-title').textContent = __('Add Deviation');
  document.getElementById('dev-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('dev-time').value = new Date().toTimeString().slice(0, 5);
  document.getElementById('dev-qty').value = '1';
  document.getElementById('dev-notes').value = '';
  const [machines, products, defects] = await Promise.all([
    list('/machines'), list('/products'), list('/defect-categories')
  ]);
  document.getElementById('dev-machine').innerHTML = machines.map(m => `<option value="${m.id}">${m.machine_code} - ${m.machine_name}</option>`).join('');
  document.getElementById('dev-product').innerHTML = products.map(p => `<option value="${p.id}">${p.product_name_ar || p.product_name}</option>`).join('');
  document.getElementById('dev-defect').innerHTML = defects.map(d => `<option value="${d.id}">[${d.defect_code}] ${d.defect_name}</option>`).join('');
  document.getElementById('dev-modal').classList.add('active');
};

window.closeDevForm = () => document.getElementById('dev-modal').classList.remove('active');

window.saveDev = async () => {
  const body = {
    machine_id: parseInt(document.getElementById('dev-machine').value),
    product_id: parseInt(document.getElementById('dev-product').value),
    defect_category_id: parseInt(document.getElementById('dev-defect').value),
    date: document.getElementById('dev-date').value,
    deviation_time: document.getElementById('dev-time').value || null,
    quantity: parseInt(document.getElementById('dev-qty').value) || 0,
    notes: document.getElementById('dev-notes').value.trim() || null,
  };
  if (!body.date || !body.quantity) return showToast(__('Date and quantity required'), 'error');
  try {
    const wasEditing = !!editingDevId;
    if (wasEditing) {
      await update(`/deviations/${editingDevId}`, body);
      showToast(__('Deviation updated'));
    } else {
      await create('/deviations', body);
      showToast(__('Deviation created'));
    }
    closeDevForm();
    editingDevId = null;
    if (!wasEditing) { currentPage = 1; document.getElementById('content').scrollTop = 0; }
    await loadDevs();
  } catch (e) { showToast(e.message, 'error'); }
};

window.deleteDev = async (id) => {
  if (!confirm(__('Delete this deviation?'))) return;
  try { await del(`/deviations/${id}`); showToast(__('Deviation deleted')); await loadDevs(); }
  catch (e) { showToast(e.message, 'error'); }
};
