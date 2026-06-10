import { listWithMeta, list, create, update, del } from '../api.js';

let currentPage = 1;
let perPage = 25;
let totalRecords = 0;
let editingProdId = null;

window.init_production = async function () {
  const content = document.getElementById('page-production');
  content.innerHTML = `
    <div class="toolbar"><h3>${__('Production Records')}</h3><input type="search" class="table-search" id="prod-search" placeholder="${__('Search')}..." oninput="filterTable('prod-tbody', this.value)"><div class="btn-group"><button class="btn btn-primary" onclick="openProdForm()">+ ${__('Add Record')}</button><button class="btn btn-secondary" onclick="exportExcel('/production-records/export/excel')">${__('Export Excel')}</button></div></div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>${__('ID')}</th><th>${__('Batch')}</th><th>${__('Date')}</th><th>${__('Time')}</th><th>${__('Shift')}</th><th>${__('Machine')}</th><th>${__('Product')}</th><th>${__('Pieces')}</th><th>${__('Actual Wt')}</th><th>${__('Actions')}</th></tr></thead><tbody id="prod-tbody"></tbody></table></div>
    <div class="pagination" id="prod-pagination"></div></div>
    <div class="modal-overlay" id="prod-modal"><div class="modal">
      <div class="modal-header"><span id="prod-modal-title">${__('Add Production Record')}</span><button class="close" onclick="closeProdForm()">&times;</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label>${__('Machine')}</label><select class="form-control" id="prod-machine"></select></div>
          <div class="form-group"><label>${__('Product')}</label><select class="form-control" id="prod-product"></select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>${__('Batch No')}</label><input class="form-control" id="prod-batch"></div>
          <div class="form-group"><label>${__('Production Date')}</label><input class="form-control" id="prod-date" type="date"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>${__('Time (24h)')}</label><input class="form-control" id="prod-time" type="time"></div>
          <div class="form-group"><label>${__('Shift')}</label><select class="form-control" id="prod-shift"><option value="morning">${__('Morning')}</option><option value="afternoon">${__('Afternoon')}</option><option value="night">${__('Night')}</option></select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>${__('Actual Weight')}${info('Net weight of the production batch')}</label><input class="form-control" id="prod-weight" type="number" step="0.1"></div>
          <div class="form-group"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>${__('Ice Weight')}${info('Weight of the ice/cream component')}</label><input class="form-control" id="prod-ice" type="number" step="0.1"></div>
          <div class="form-group"><label>${__('Sauce Weight')}${info('Weight of the sauce component')}</label><input class="form-control" id="prod-sauce" type="number" step="0.1"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>${__('Biscuit Weight')}${info('Weight of the biscuit/crunch component')}</label><input class="form-control" id="prod-biscuit" type="number" step="0.1"></div>
          <div class="form-group"><label>${__('Pieces Produced')}${info('Total number of individual units produced')}</label><input class="form-control" id="prod-pieces" type="number" placeholder="${__('Total pieces made')}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>${__('Min / Max Weight')}${info('Acceptable weight range for quality control')}</label><div style="display:flex;gap:8px"><input class="form-control" id="prod-min" type="number" step="0.1" placeholder="${__('Min')}"><input class="form-control" id="prod-max" type="number" step="0.1" placeholder="${__('Max')}"></div></div>
        </div>
      </div>
      <div class="modal-footer"><button class="btn" onclick="closeProdForm()">${__('Cancel')}</button><button class="btn btn-primary" onclick="saveProd()">${__('Save')}</button></div>
    </div></div>
  `;
  currentPage = 1;
  await loadProds();
};

async function loadProds() {
  const skip = (currentPage - 1) * perPage;
  const [res, machines, products] = await Promise.all([
    listWithMeta(`/production-records?skip=${skip}&limit=${perPage}`),
    list('/machines'), list('/products')
  ]);
  totalRecords = res.total;
  const mMap = Object.fromEntries(machines.map(m => [m.id, m.machine_code]));
  const pMap = Object.fromEntries(products.map(p => [p.id, p.product_name_ar || p.product_name]));
  document.getElementById('prod-tbody').innerHTML = res.data.map(r => `
    <tr><td>${r.id}</td><td>${r.batch_no}</td><td>${r.production_date}</td><td>${r.production_time || '-'}</td><td>${r.shift}</td><td>${mMap[r.machine_id] || r.machine_id}</td><td>${pMap[r.product_id] || r.product_id}</td><td>${r.pieces_produced || '-'}</td><td>${r.actual_weight || '-'}</td>
    <td><div class="btn-group"><button class="btn btn-sm" onclick="editProd(${r.id})">${__('Edit')}</button><button class="btn btn-sm btn-danger" onclick="deleteProd(${r.id})">${__('Delete')}</button></div></td></tr>
  `).join('');
  renderPagination();
}

function renderPagination() {
  const totalPages = Math.max(1, Math.ceil(totalRecords / perPage));
  if (currentPage > totalPages) currentPage = totalPages;
  const from = totalRecords === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, totalRecords);
  let html = `<div class="pagination-info">${from}–${to} ${__('of')} ${totalRecords}</div><div class="pagination-controls">`;
  html += `<button class="btn btn-sm" onclick="goProdPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>&laquo; ${__('Prev')}</button>`;
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="btn btn-sm ${i === currentPage ? 'btn-primary' : ''}" onclick="goProdPage(${i})">${i}</button>`;
  }
  html += `<button class="btn btn-sm" onclick="goProdPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>${__('Next')} &raquo;</button>`;
  html += `</div><div class="pagination-perpage"><label>${__('Per page')}: <select onchange="changeProdPerPage(this.value)">`;
  [10, 25, 50, 100].forEach(n => html += `<option value="${n}" ${n === perPage ? 'selected' : ''}>${n}</option>`);
  html += `</select></label></div>`;
  document.getElementById('prod-pagination').innerHTML = html;
}

window.goProdPage = (page) => {
  const totalPages = Math.max(1, Math.ceil(totalRecords / perPage));
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  loadProds();
};

window.changeProdPerPage = (n) => {
  perPage = parseInt(n, 10);
  currentPage = 1;
  loadProds();
};

window._prodProducts = [];

function fillProductDefaults(productId) {
  const p = window._prodProducts.find(x => x.id === productId);
  if (!p) return;
  if (p.default_ice_weight) document.getElementById('prod-ice').value = p.default_ice_weight;
  if (p.default_sauce_weight) document.getElementById('prod-sauce').value = p.default_sauce_weight;
  if (p.default_biscuit_weight) document.getElementById('prod-biscuit').value = p.default_biscuit_weight;
  if (p.default_min_weight) document.getElementById('prod-min').value = p.default_min_weight;
  if (p.default_max_weight) document.getElementById('prod-max').value = p.default_max_weight;
  if (p.default_pieces) document.getElementById('prod-pieces').value = p.default_pieces;
}

window.editProd = async (id) => {
  editingProdId = id;
  const r = await list(`/production-records/${id}`);
  document.getElementById('prod-modal-title').textContent = __('Edit');
  const [machines, products] = await Promise.all([list('/machines'), list('/products')]);
  window._prodProducts = products;
  document.getElementById('prod-machine').innerHTML = machines.map(m => `<option value="${m.id}" ${m.id === r.machine_id ? 'selected' : ''}>${m.machine_code} - ${m.machine_name}</option>`).join('');
  document.getElementById('prod-product').innerHTML = products.map(p => `<option value="${p.id}" ${p.id === r.product_id ? 'selected' : ''}>${p.product_name_ar || p.product_name}</option>`).join('');
  document.getElementById('prod-product').onchange = function () { fillProductDefaults(parseInt(this.value)); };
  document.getElementById('prod-batch').value = r.batch_no;
  document.getElementById('prod-date').value = r.production_date;
  document.getElementById('prod-time').value = r.production_time || '';
  document.getElementById('prod-shift').value = r.shift;
  document.getElementById('prod-weight').value = r.actual_weight || '';
  document.getElementById('prod-ice').value = r.ice_weight || '';
  document.getElementById('prod-sauce').value = r.sauce_weight || '';
  document.getElementById('prod-biscuit').value = r.biscuit_weight || '';
  document.getElementById('prod-pieces').value = r.pieces_produced || '';
  document.getElementById('prod-min').value = r.min_weight || '';
  document.getElementById('prod-max').value = r.max_weight || '';
  document.getElementById('prod-modal').classList.add('active');
};

window.openProdForm = async () => {
  editingProdId = null;
  document.getElementById('prod-modal-title').textContent = __('Add Production Record');
  document.getElementById('prod-batch').value = '';
  document.getElementById('prod-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('prod-time').value = new Date().toTimeString().slice(0, 5);
  document.getElementById('prod-weight').value = '';
  document.getElementById('prod-ice').value = '';
  document.getElementById('prod-sauce').value = '';
  document.getElementById('prod-biscuit').value = '';
  document.getElementById('prod-pieces').value = '';
  document.getElementById('prod-min').value = '';
  document.getElementById('prod-max').value = '';
  const [machines, products] = await Promise.all([list('/machines'), list('/products')]);
  window._prodProducts = products;
  document.getElementById('prod-machine').innerHTML = machines.map(m => `<option value="${m.id}">${m.machine_code} - ${m.machine_name}</option>`).join('');
  document.getElementById('prod-product').innerHTML = products.map(p => `<option value="${p.id}">${p.product_name_ar || p.product_name}</option>`).join('');
  document.getElementById('prod-product').onchange = null;
  document.getElementById('prod-modal').classList.add('active');
};

window.closeProdForm = () => document.getElementById('prod-modal').classList.remove('active');

window.saveProd = async () => {
  const body = {
    machine_id: parseInt(document.getElementById('prod-machine').value),
    product_id: parseInt(document.getElementById('prod-product').value),
    batch_no: document.getElementById('prod-batch').value.trim(),
    production_date: document.getElementById('prod-date').value,
    production_time: document.getElementById('prod-time').value || null,
    shift: document.getElementById('prod-shift').value,
    actual_weight: parseFloat(document.getElementById('prod-weight').value) || null,
    ice_weight: parseFloat(document.getElementById('prod-ice').value) || null,
    sauce_weight: parseFloat(document.getElementById('prod-sauce').value) || null,
    biscuit_weight: parseFloat(document.getElementById('prod-biscuit').value) || null,
    pieces_produced: parseInt(document.getElementById('prod-pieces').value) || null,
    min_weight: parseFloat(document.getElementById('prod-min').value) || null,
    max_weight: parseFloat(document.getElementById('prod-max').value) || null,
  };
  if (!body.batch_no || !body.production_date) return showToast(__('Batch and date required'), 'error');
  try {
    const wasEditing = !!editingProdId;
    if (wasEditing) {
      await update(`/production-records/${editingProdId}`, body);
      showToast(__('Record updated'));
    } else {
      await create('/production-records', body);
      showToast(__('Record created'));
    }
    closeProdForm();
    editingProdId = null;
    if (!wasEditing) { currentPage = 1; document.getElementById('content').scrollTop = 0; }
    await loadProds();
  } catch (e) { showToast(e.message, 'error'); }
};

window.deleteProd = async (id) => {
  if (!confirm(__('Delete this record?'))) return;
  try { await del(`/production-records/${id}`); showToast(__('Record deleted')); await loadProds(); }
  catch (e) { showToast(e.message, 'error'); }
};
