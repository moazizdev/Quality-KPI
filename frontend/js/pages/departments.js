import { list, create, update, del } from '../api.js';

let editingDeptId = null;

window.init_departments = async function () {
  const isAdmin = window.isAdmin();
  const content = document.getElementById('page-departments');
  content.innerHTML = `
    <div class="toolbar"><h3>${__('Manage Departments')}</h3>${isAdmin ? '<button class="btn btn-primary" onclick="openDeptForm()">+ ' + __('Add Department') + '</button>' : ''}</div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>${__('ID')}</th><th>${__('Name')}</th><th>${__('English Name')}</th><th>${__('Defect Prefixes')}</th><th>${__('Sort Order')}</th>${isAdmin ? '<th>' + __('Actions') + '</th>' : ''}</tr></thead><tbody id="depts-tbody"></tbody></table></div></div>
    ${isAdmin ? `<div class="modal-overlay" id="dept-modal"><div class="modal">
      <div class="modal-header"><span id="dept-modal-title">${__('Add Department')}</span><button class="close" onclick="closeDeptForm()">&times;</button></div>
      <div class="modal-body">
        <div class="form-group"><label>${__('Name')}</label><input class="form-control" id="dept-name"></div>
        <div class="form-group"><label>${__('English Name')}</label><input class="form-control" id="dept-name-en"></div>
        <div class="form-group"><label>${__('Defect Prefixes')} <span class="info-circle" title="${__('Comma-separated defect code prefixes, e.g. AD,Q,W')}">&#9432;</span></label><input class="form-control" id="dept-prefixes" placeholder="${__('e.g. AD,Q,W')}"></div>
        <div class="form-group"><label>${__('Sort Order')}</label><input class="form-control" id="dept-sort" type="number" value="0"></div>
      </div>
      <div class="modal-footer"><button class="btn" onclick="closeDeptForm()">${__('Cancel')}</button><button class="btn btn-primary" onclick="saveDept()">${__('Save')}</button></div>
    </div></div>` : ''}
  `;
  editingDeptId = null;
  await loadDepts();
};

async function loadDepts() {
  const isAdmin = window.isAdmin();
  const data = await list('/departments');
  document.getElementById('depts-tbody').innerHTML = data.map(d => `
    <tr><td>${d.id}</td><td>${d.name}</td><td>${d.name_en || '-'}</td><td><code>${d.defect_prefixes || '-'}</code></td><td>${d.sort_order}</td>
    ${isAdmin ? `<td><div class="btn-group"><button class="btn btn-sm" onclick="editDept(${d.id})">${__('Edit')}</button><button class="btn btn-sm btn-danger" onclick="deleteDept(${d.id})">${__('Delete')}</button></div></td>` : ''}</tr>
  `).join('');
}

window.editDept = async (id) => {
  editingDeptId = id;
  const d = await list(`/departments/${id}`);
  document.getElementById('dept-modal-title').textContent = __('Edit Department');
  document.getElementById('dept-name').value = d.name;
  document.getElementById('dept-name-en').value = d.name_en || '';
  document.getElementById('dept-prefixes').value = d.defect_prefixes || '';
  document.getElementById('dept-sort').value = d.sort_order;
  document.getElementById('dept-modal').classList.add('active');
};

window.openDeptForm = () => {
  editingDeptId = null;
  document.getElementById('dept-modal-title').textContent = __('Add Department');
  document.getElementById('dept-name').value = '';
  document.getElementById('dept-name-en').value = '';
  document.getElementById('dept-prefixes').value = '';
  document.getElementById('dept-sort').value = '0';
  document.getElementById('dept-modal').classList.add('active');
};

window.closeDeptForm = () => document.getElementById('dept-modal').classList.remove('active');

window.saveDept = async () => {
  const body = {
    name: document.getElementById('dept-name').value.trim(),
    name_en: document.getElementById('dept-name-en').value.trim() || null,
    defect_prefixes: document.getElementById('dept-prefixes').value.trim() || null,
    sort_order: parseInt(document.getElementById('dept-sort').value) || 0,
  };
  if (!body.name) return showToast(__('Name is required'), 'error');
  try {
    if (editingDeptId) {
      await update(`/departments/${editingDeptId}`, body);
      showToast(__('Department updated'));
    } else {
      await create('/departments', body);
      showToast(__('Department created'));
    }
    closeDeptForm();
    if (!editingDeptId) document.getElementById('content').scrollTop = 0;
    editingDeptId = null;
    await loadDepts();
  } catch (e) { showToast(e.message, 'error'); }
};

window.deleteDept = async (id) => {
  if (!confirm(__('Delete this department?'))) return;
  try { await del(`/departments/${id}`); showToast(__('Department deleted')); await loadDepts(); }
  catch (e) { showToast(e.message, 'error'); }
};
