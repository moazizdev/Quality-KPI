import { listWithMeta, list, get, create, update, del } from '../api.js';

let currentPage = 1;
let perPage = 25;
let totalRecords = 0;

window.init_complaints = async function () {
  document.getElementById('page-complaints').innerHTML = `
    <div class="toolbar"><h3>${__('Customer Complaints')}</h3><div class="btn-group"><button class="btn btn-primary" onclick="openComplaintForm()">+ ${__('Add Complaint')}</button><button class="btn btn-secondary" onclick="exportExcel('/complaints/export/excel')">${__('Export Excel')}</button></div></div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>${__('ID')}</th><th>${__('Number')}</th><th>${__('Customer')}</th><th>${__('Date')}</th><th>${__('Time')}</th><th>${__('Status')}</th><th>${__('Department')}</th><th>${__('Actions')}</th></tr></thead><tbody id="complaint-tbody"></tbody></table></div>
    <div class="pagination" id="complaint-pagination"></div></div>
    <div class="modal-overlay" id="complaint-modal"><div class="modal">
      <div class="modal-header"><span id="complaint-modal-title">${__('Add Complaint')}</span><button class="close" onclick="closeComplaintForm()">&times;</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label>${__('Customer Name')}</label><input class="form-control" id="complaint-customer"></div>
          <div class="form-group"><label>${__('Complaint Number')}</label><input class="form-control" id="complaint-number"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>${__('Date')}</label><input class="form-control" id="complaint-date" type="date"></div>
          <div class="form-group"><label>${__('Status')}</label><select class="form-control" id="complaint-status"><option value="open">${__('Open')}</option><option value="under_review">${__('Under Review')}</option><option value="resolved">${__('Resolved')}</option><option value="notified">${__('Notified')}</option></select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>${__('Time (24h)')}</label><input class="form-control" id="complaint-time" type="time"></div>
          <div class="form-group"></div>
        </div>
        <div class="form-group"><label>${__('Summary')}</label><textarea class="form-control" id="complaint-summary" rows="2"></textarea></div>
        <div class="form-row">
          <div class="form-group"><label>${__('Assigned Department')}</label><select class="form-control" id="complaint-dept"><option value="">${__('-- None --')}</option></select></div>
          <div class="form-group"><label>${__('Assigned To')}</label><input class="form-control" id="complaint-to"></div>
        </div>
        <div class="form-group"><label>${__('Corrective Action')}</label><textarea class="form-control" id="complaint-corrective" rows="2"></textarea></div>
        <div class="form-group"><label>${__('Preventive Action')}</label><textarea class="form-control" id="complaint-preventive" rows="2"></textarea></div>
        <div class="form-group"><label>${__('Resolution')}</label><textarea class="form-control" id="complaint-resolution" rows="2"></textarea></div>
      </div>
      <div class="modal-footer"><button class="btn" onclick="closeComplaintForm()">${__('Cancel')}</button><button class="btn btn-primary" onclick="saveComplaint()">${__('Save')}</button></div>
    </div></div>
  `;
  currentPage = 1;
  await loadComplaints();
};

async function loadComplaints() {
  const skip = (currentPage - 1) * perPage;
  const res = await listWithMeta(`/complaints?skip=${skip}&limit=${perPage}`);
  totalRecords = res.total;
  document.getElementById('complaint-tbody').innerHTML = res.data.map(c => `
    <tr><td>${c.id}</td><td>${c.complaint_number}</td><td>${c.customer_name}</td><td>${c.complaint_date}</td><td>${c.complaint_time || '-'}</td><td><span class="badge badge-${c.status}">${c.status.replace('_',' ')}</span></td><td>${c.assigned_department || '-'}</td>
    <td><div class="btn-group"><button class="btn btn-sm btn-primary" onclick="editComplaint(${c.id})">${__('Edit')}</button><button class="btn btn-sm btn-danger" onclick="deleteComplaint(${c.id})">${__('Delete')}</button></div></td></tr>
  `).join('');
  renderPagination();
}

function renderPagination() {
  const totalPages = Math.max(1, Math.ceil(totalRecords / perPage));
  if (currentPage > totalPages) currentPage = totalPages;
  const from = totalRecords === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, totalRecords);
  let html = `<div class="pagination-info">${from}–${to} ${__('of')} ${totalRecords}</div><div class="pagination-controls">`;
  html += `<button class="btn btn-sm" onclick="goComplaintPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>&laquo; ${__('Prev')}</button>`;
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="btn btn-sm ${i === currentPage ? 'btn-primary' : ''}" onclick="goComplaintPage(${i})">${i}</button>`;
  }
  html += `<button class="btn btn-sm" onclick="goComplaintPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>${__('Next')} &raquo;</button>`;
  html += `</div><div class="pagination-perpage"><label>${__('Per page')}: <select onchange="changeComplaintPerPage(this.value)">`;
  [10, 25, 50, 100].forEach(n => html += `<option value="${n}" ${n === perPage ? 'selected' : ''}>${n}</option>`);
  html += `</select></label></div>`;
  document.getElementById('complaint-pagination').innerHTML = html;
}

window.goComplaintPage = (page) => {
  const totalPages = Math.max(1, Math.ceil(totalRecords / perPage));
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  loadComplaints();
};

window.changeComplaintPerPage = (n) => {
  perPage = parseInt(n, 10);
  currentPage = 1;
  loadComplaints();
};

let editingComplaintId = null;

window.openComplaintForm = async (data) => {
  editingComplaintId = data?.id || null;
  document.getElementById('complaint-modal-title').textContent = editingComplaintId ? __('Edit Complaint') : __('Add Complaint');
  document.getElementById('complaint-customer').value = data?.customer_name || '';
  document.getElementById('complaint-number').value = data?.complaint_number || '';
  document.getElementById('complaint-date').value = data?.complaint_date || new Date().toISOString().split('T')[0];
  document.getElementById('complaint-time').value = data?.complaint_time || new Date().toTimeString().slice(0, 5);
  document.getElementById('complaint-status').value = data?.status || 'open';
  document.getElementById('complaint-summary').value = data?.complaint_summary || '';
  const depts = await list('/departments');
  const deptSel = document.getElementById('complaint-dept');
  deptSel.innerHTML = `<option value="">${__('-- None --')}</option>` + depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
  deptSel.value = data?.assigned_department || '';
  document.getElementById('complaint-to').value = data?.assigned_to || '';
  document.getElementById('complaint-corrective').value = data?.corrective_action || '';
  document.getElementById('complaint-preventive').value = data?.preventive_action || '';
  document.getElementById('complaint-resolution').value = data?.resolution || '';
  document.getElementById('complaint-modal').classList.add('active');
};

window.closeComplaintForm = () => document.getElementById('complaint-modal').classList.remove('active');

window.saveComplaint = async () => {
  const body = {
    customer_name: document.getElementById('complaint-customer').value.trim(),
    complaint_number: document.getElementById('complaint-number').value.trim(),
    complaint_date: document.getElementById('complaint-date').value,
    complaint_time: document.getElementById('complaint-time').value || null,
    complaint_summary: document.getElementById('complaint-summary').value.trim(),
    status: document.getElementById('complaint-status').value,
    assigned_department: document.getElementById('complaint-dept').value.trim() || null,
    assigned_to: document.getElementById('complaint-to').value.trim() || null,
    corrective_action: document.getElementById('complaint-corrective').value.trim() || null,
    preventive_action: document.getElementById('complaint-preventive').value.trim() || null,
    resolution: document.getElementById('complaint-resolution').value.trim() || null,
  };
  if (!body.customer_name || !body.complaint_number || !body.complaint_summary)
    return showToast(__('Customer, number, and summary required'), 'error');
  try {
    if (editingComplaintId) {
      await update(`/complaints/${editingComplaintId}`, body);
      showToast(__('Complaint updated'));
    } else {
      await create('/complaints', body);
      showToast(__('Complaint created'));
    }
    closeComplaintForm();
    if (!editingComplaintId) currentPage = 1;
    await loadComplaints();
  } catch (e) { showToast(e.message, 'error'); }
};

window.editComplaint = async (id) => {
  const item = await get(`/complaints/${id}`);
  if (item) window.openComplaintForm(item);
};

window.deleteComplaint = async (id) => {
  if (!confirm(__('Delete this complaint?'))) return;
  try { await del(`/complaints/${id}`); showToast(__('Complaint deleted')); await loadComplaints(); }
  catch (e) { showToast(e.message, 'error'); }
};
