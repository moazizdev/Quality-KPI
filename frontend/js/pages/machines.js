import { list, create, update, del } from '../api.js';

let editingMachineId = null;

window.init_machines = async function () {
  const isAdmin = window.isAdmin();
  const content = document.getElementById('page-machines');
  content.innerHTML = `
    <div class="toolbar"><h3>${__('Manage Machines')}</h3>${isAdmin ? '<button class="btn btn-primary" onclick="openMachineForm()">+ ' + __('Add Machine') + '</button>' : ''}</div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>${__('ID')}</th><th>${__('Code')}</th><th>${__('Name')}</th><th>${__('Hall')}</th><th>${__('Assigned User')}</th>${isAdmin ? '<th>' + __('Actions') + '</th>' : ''}</tr></thead><tbody id="machines-tbody"></tbody></table></div></div>
    ${isAdmin ? `<div class="modal-overlay" id="machine-modal"><div class="modal">
      <div class="modal-header"><span id="machine-modal-title">${__('Add Machine')}</span><button class="close" onclick="closeMachineForm()">&times;</button></div>
      <div class="modal-body">
        <div class="form-group"><label>${__('Machine Code')}</label><input class="form-control" id="machine-code"></div>
        <div class="form-group"><label>${__('Machine Name')}</label><input class="form-control" id="machine-name"></div>
        <div class="form-group"><label>${__('Hall')}</label><select class="form-control" id="machine-hall"></select></div>
        <div class="form-group"><label>${__('Assigned Engineer')}</label><select class="form-control" id="machine-user"><option value="">${__('-- None --')}</option></select></div>
      </div>
      <div class="modal-footer"><button class="btn" onclick="closeMachineForm()">${__('Cancel')}</button><button class="btn btn-primary" onclick="saveMachine()">${__('Save')}</button></div>
    </div></div>` : ''}
  `;
  editingMachineId = null;
  await loadMachines();
};

async function loadMachines() {
  const isAdmin = window.isAdmin();
  const [machines, halls, users] = await Promise.all([list('/machines'), list('/halls'), list('/auth/users')]);
  const hallMap = Object.fromEntries(halls.map(h => [h.id, h.name]));
  const userMap = Object.fromEntries(users.map(u => [u.id, u.full_name || u.username]));
  document.getElementById('machines-tbody').innerHTML = machines.map(m => `
    <tr><td>${m.id}</td><td>${m.machine_code}</td><td>${m.machine_name}</td><td>${hallMap[m.hall_id] || m.hall_id}</td><td>${m.assigned_user_id ? (userMap[m.assigned_user_id] || m.assigned_user_id) : '-'}</td>
    ${isAdmin ? `<td><div class="btn-group"><button class="btn btn-sm" onclick="editMachine(${m.id})">${__('Edit')}</button><button class="btn btn-sm btn-danger" onclick="deleteMachine(${m.id})">${__('Delete')}</button></div></td>` : ''}</tr>
  `).join('');
}

window.editMachine = async (id) => {
  editingMachineId = id;
  const m = await list(`/machines/${id}`);
  document.getElementById('machine-modal-title').textContent = __('Edit');
  document.getElementById('machine-code').value = m.machine_code;
  document.getElementById('machine-name').value = m.machine_name;
  const [halls, users] = await Promise.all([list('/halls'), list('/auth/users')]);
  document.getElementById('machine-hall').innerHTML = halls.map(h => `<option value="${h.id}" ${h.id === m.hall_id ? 'selected' : ''}>${h.name}</option>`).join('');
  const sel = document.getElementById('machine-user');
  sel.innerHTML = '<option value="">-- None --</option>' + users.filter(u => u.role === 'eng').map(u => `<option value="${u.id}" ${u.id === m.assigned_user_id ? 'selected' : ''}>${u.full_name || u.username}</option>`).join('');
  document.getElementById('machine-modal').classList.add('active');
};

window.openMachineForm = async () => {
  editingMachineId = null;
  document.getElementById('machine-modal-title').textContent = __('Add Machine');
  document.getElementById('machine-code').value = '';
  document.getElementById('machine-name').value = '';
  const [halls, users] = await Promise.all([list('/halls'), list('/auth/users')]);
  document.getElementById('machine-hall').innerHTML = halls.map(h => `<option value="${h.id}">${h.name}</option>`).join('');
  const sel = document.getElementById('machine-user');
  sel.innerHTML = '<option value="">-- None --</option>' + users.filter(u => u.role === 'eng').map(u => `<option value="${u.id}">${u.full_name || u.username}</option>`).join('');
  document.getElementById('machine-modal').classList.add('active');
};

window.closeMachineForm = () => document.getElementById('machine-modal').classList.remove('active');

window.saveMachine = async () => {
  const machine_code = document.getElementById('machine-code').value.trim();
  const machine_name = document.getElementById('machine-name').value.trim();
  const hall_id = parseInt(document.getElementById('machine-hall').value);
  const assigned_user_id = parseInt(document.getElementById('machine-user').value) || null;
  if (!machine_code || !machine_name) return showToast(__('All fields required'), 'error');
  try {
    if (editingMachineId) {
      await update(`/machines/${editingMachineId}`, { machine_code, machine_name, hall_id, assigned_user_id });
      showToast(__('Machine updated'));
    } else {
      await create('/machines', { machine_code, machine_name, hall_id, assigned_user_id });
      showToast(__('Machine created'));
    }
    closeMachineForm();
    if (!editingMachineId) document.getElementById('content').scrollTop = 0;
    editingMachineId = null;
    await loadMachines();
  } catch (e) { showToast(e.message, 'error'); }
};

window.deleteMachine = async (id) => {
  if (!confirm(__('Delete this machine?'))) return;
  try { await del(`/machines/${id}`); showToast(__('Machine deleted')); await loadMachines(); }
  catch (e) { showToast(e.message, 'error'); }
};
