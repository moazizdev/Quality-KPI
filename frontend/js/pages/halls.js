import { list, create, update, del } from '../api.js';

let editingHallId = null;

window.init_halls = async function () {
  const isAdmin = window.isAdmin();
  const content = document.getElementById('page-halls');
  content.innerHTML = `
    <div class="toolbar"><h3>${__('Manage Halls')}</h3>${isAdmin ? '<button class="btn btn-primary" onclick="openHallForm()">+ ' + __('Add Hall') + '</button>' : ''}</div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>${__('ID')}</th><th>${__('Name')}</th>${isAdmin ? '<th>' + __('Actions') + '</th>' : ''}</tr></thead><tbody id="halls-tbody"></tbody></table></div></div>
    ${isAdmin ? `<div class="modal-overlay" id="hall-modal"><div class="modal">
      <div class="modal-header"><span id="hall-modal-title">${__('Add Hall')}</span><button class="close" onclick="closeHallForm()">&times;</button></div>
      <div class="modal-body"><div class="form-group"><label>${__('Hall Name')}</label><input class="form-control" id="hall-name"></div></div>
      <div class="modal-footer"><button class="btn" onclick="closeHallForm()">${__('Cancel')}</button><button class="btn btn-primary" onclick="saveHall()">${__('Save')}</button></div>
    </div></div>` : ''}
  `;
  editingHallId = null;
  await loadHalls();
};

async function loadHalls() {
  const isAdmin = window.isAdmin();
  const data = await list('/halls');
  document.getElementById('halls-tbody').innerHTML = data.map(h => `
    <tr><td>${h.id}</td><td>${h.name}</td>
    ${isAdmin ? `<td><div class="btn-group"><button class="btn btn-sm" onclick="editHall(${h.id})">${__('Edit')}</button><button class="btn btn-sm btn-danger" onclick="deleteHall(${h.id})">${__('Delete')}</button></div></td>` : ''}</tr>
  `).join('');
}

window.editHall = async (id) => {
  editingHallId = id;
  const h = await list(`/halls/${id}`);
  document.getElementById('hall-modal-title').textContent = __('Edit');
  document.getElementById('hall-name').value = h.name;
  document.getElementById('hall-modal').classList.add('active');
};

window.openHallForm = () => {
  editingHallId = null;
  document.getElementById('hall-modal-title').textContent = __('Add Hall');
  document.getElementById('hall-name').value = '';
  document.getElementById('hall-modal').classList.add('active');
};
window.closeHallForm = () => document.getElementById('hall-modal').classList.remove('active');

window.saveHall = async () => {
  const name = document.getElementById('hall-name').value.trim();
  if (!name) return showToast(__('Name is required'), 'error');
  try {
    if (editingHallId) {
      await update(`/halls/${editingHallId}`, { name });
      showToast(__('Hall updated'));
    } else {
      await create('/halls', { name });
      showToast(__('Hall created'));
    }
    closeHallForm();
    if (!editingHallId) document.getElementById('content').scrollTop = 0;
    editingHallId = null;
    await loadHalls();
  } catch (e) { showToast(e.message, 'error'); }
};

window.deleteHall = async (id) => {
  if (!confirm(__('Delete this hall?'))) return;
  try { await del(`/halls/${id}`); showToast(__('Hall deleted')); await loadHalls(); }
  catch (e) { showToast(e.message, 'error'); }
};
