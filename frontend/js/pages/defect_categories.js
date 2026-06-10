import { list, create, update, del } from '../api.js';

let editingDefectId = null;

window.init_defect_categories = async function () {
  const isAdmin = window.isAdmin();
  const content = document.getElementById('page-defect-categories');
  content.innerHTML = `
    <div class="toolbar"><h3>${__('Defect Categories')}</h3>${isAdmin ? '<button class="btn btn-primary" onclick="openDefectForm()">+ ' + __('Add Category') + '</button>' : ''}</div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>${__('ID')}</th><th>${__('Code')}</th><th>${__('Name')}</th><th>${__('Description')}</th>${isAdmin ? '<th>' + __('Actions') + '</th>' : ''}</tr></thead><tbody id="defcat-tbody"></tbody></table></div></div>
    ${isAdmin ? `<div class="modal-overlay" id="defcat-modal"><div class="modal">
      <div class="modal-header"><span id="defcat-modal-title">${__('Add Defect Category')}</span><button class="close" onclick="closeDefectForm()">&times;</button></div>
      <div class="modal-body">
        <div class="form-group"><label>${__('Defect Code')}</label><input class="form-control" id="defcat-code"></div>
        <div class="form-group"><label>${__('Defect Name')}</label><input class="form-control" id="defcat-name"></div>
        <div class="form-group"><label>${__('Description')}</label><textarea class="form-control" id="defcat-desc" rows="2"></textarea></div>
      </div>
      <div class="modal-footer"><button class="btn" onclick="closeDefectForm()">${__('Cancel')}</button><button class="btn btn-primary" onclick="saveDefectCategory()">${__('Save')}</button></div>
    </div></div>` : ''}
  `;
  editingDefectId = null;
  await loadDefectCategories();
};

async function loadDefectCategories() {
  const isAdmin = window.isAdmin();
  const data = await list('/defect-categories');
  document.getElementById('defcat-tbody').innerHTML = data.map(d => `
    <tr><td>${d.id}</td><td>${d.defect_code}</td><td>${d.defect_name}</td><td>${d.description || '-'}</td>
    ${isAdmin ? `<td><div class="btn-group"><button class="btn btn-sm" onclick="editDefectCategory(${d.id})">${__('Edit')}</button><button class="btn btn-sm btn-danger" onclick="deleteDefectCategory(${d.id})">${__('Delete')}</button></div></td>` : ''}</tr>
  `).join('');
}

window.editDefectCategory = async (id) => {
  editingDefectId = id;
  const d = await list(`/defect-categories/${id}`);
  document.getElementById('defcat-modal-title').textContent = __('Edit');
  document.getElementById('defcat-code').value = d.defect_code;
  document.getElementById('defcat-name').value = d.defect_name;
  document.getElementById('defcat-desc').value = d.description || '';
  document.getElementById('defcat-modal').classList.add('active');
};

window.openDefectForm = () => {
  editingDefectId = null;
  document.getElementById('defcat-modal-title').textContent = __('Add Defect Category');
  document.getElementById('defcat-code').value = '';
  document.getElementById('defcat-name').value = '';
  document.getElementById('defcat-desc').value = '';
  document.getElementById('defcat-modal').classList.add('active');
};
window.closeDefectForm = () => document.getElementById('defcat-modal').classList.remove('active');

window.saveDefectCategory = async () => {
  const defect_code = document.getElementById('defcat-code').value.trim();
  const defect_name = document.getElementById('defcat-name').value.trim();
  const description = document.getElementById('defcat-desc').value.trim() || null;
  if (!defect_code || !defect_name) return showToast(__('Code and name required'), 'error');
  try {
    if (editingDefectId) {
      await update(`/defect-categories/${editingDefectId}`, { defect_code, defect_name, description });
      showToast(__('Category updated'));
    } else {
      await create('/defect-categories', { defect_code, defect_name, description });
      showToast(__('Category created'));
    }
    closeDefectForm();
    if (!editingDefectId) document.getElementById('content').scrollTop = 0;
    editingDefectId = null;
    await loadDefectCategories();
  } catch (e) { showToast(e.message, 'error'); }
};

window.deleteDefectCategory = async (id) => {
  if (!confirm(__('Delete this category?'))) return;
  try { await del(`/defect-categories/${id}`); showToast(__('Category deleted')); await loadDefectCategories(); }
  catch (e) { showToast(e.message, 'error'); }
};
