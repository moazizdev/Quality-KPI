import { list, create, update, del } from '../api.js';

window.init_users = async function () {
  if (!window.isAdmin()) {
    document.getElementById('page-users').innerHTML = '<div class="empty">' + __('Only admins can manage users.') + '</div>';
    return;
  }
  const content = document.getElementById('page-users');
  content.innerHTML = `
    <div class="toolbar"><h3>${__('Manage Users')}</h3><button class="btn btn-primary" onclick="openUserForm()">+ ${__('Add User')}</button></div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>${__('ID')}</th><th>${__('Username')}</th><th>${__('Full Name')}</th><th>${__('Role')}</th><th>${__('Status')}</th><th>${__('Assigned Machines')}</th><th>${__('Actions')}</th></tr></thead><tbody id="users-tbody"></tbody></table></div></div>
    <div class="modal-overlay" id="user-modal"><div class="modal">
      <div class="modal-header"><span id="user-modal-title">${__('Add User')}</span><button class="close" onclick="closeUserForm()">&times;</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label>${__('Username')}</label><input class="form-control" id="user-username"></div>
          <div class="form-group"><label>${__('Password')}</label><input class="form-control" id="user-password" type="password" placeholder="${__('Leave blank to keep')}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>${__('Full Name')}</label><input class="form-control" id="user-fullname"></div>
          <div class="form-group"><label>${__('Role')}</label><select class="form-control" id="user-role"><option value="eng">${__('Engineer')}</option><option value="admin">${__('Admin')}</option></select></div>
        </div>
        <div class="form-group"><label>${__('Assigned Machines')}</label>
          <div id="user-machines" style="max-height:160px;overflow-y:auto;border:1px solid var(--border);border-radius:6px;padding:8px"></div>
        </div>
      </div>
      <div class="modal-footer"><button class="btn" onclick="closeUserForm()">${__('Cancel')}</button><button class="btn btn-primary" onclick="saveUser()">${__('Save')}</button></div>
    </div></div>
  `;
  await loadUsers();
};

async function loadUsers() {
  const [users, machines] = await Promise.all([list('/auth/users'), list('/machines')]);
  const machineByUser = {};
  machines.forEach(m => {
    if (m.assigned_user_id) {
      (machineByUser[m.assigned_user_id] = machineByUser[m.assigned_user_id] || []).push(m.machine_code);
    }
  });
  document.getElementById('users-tbody').innerHTML = users.map(u => `
    <tr>
      <td>${u.id}</td>
      <td>${u.username}</td>
      <td>${u.full_name || '-'}</td>
      <td><span class="badge ${u.role === 'admin' ? 'badge-in_progress' : 'badge-open'}">${u.role}</span></td>
      <td>${u.is_active !== 0 ? __('Active') : __('Inactive')}</td>
      <td>${(machineByUser[u.id] || []).join(', ') || '-'}</td>
      <td><div class="btn-group">
        <button class="btn btn-sm btn-primary" onclick="editUser(${u.id})">${__('Edit')}</button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id})">${__('Delete')}</button>
      </div></td>
    </tr>
  `).join('');
}

let editingUserId = null;

window.openUserForm = async (data) => {
  editingUserId = data?.id || null;
  document.getElementById('user-modal-title').textContent = editingUserId ? __('Edit User') : __('Add User');
  document.getElementById('user-username').value = data?.username || '';
  document.getElementById('user-username').disabled = !!editingUserId;
  document.getElementById('user-password').value = '';
  document.getElementById('user-password').placeholder = editingUserId ? __('Leave blank to keep') : __('Required');
  document.getElementById('user-fullname').value = data?.full_name || '';
  document.getElementById('user-role').value = data?.role || 'eng';
  const machines = await list('/machines');
  const container = document.getElementById('user-machines');
  const assignedIds = data ? machines.filter(m => m.assigned_user_id === data.id).map(m => m.id) : [];
  container.innerHTML = machines.map(m => `
    <label style="display:flex;align-items:center;gap:6px;padding:2px 0;font-size:13px">
      <input type="checkbox" class="machine-check" value="${m.id}" ${assignedIds.includes(m.id) ? 'checked' : ''}>
      ${m.machine_code} — ${m.machine_name}
    </label>
  `).join('');
  document.getElementById('user-modal').classList.add('active');
};

window.closeUserForm = () => {
  document.getElementById('user-modal').classList.remove('active');
  document.getElementById('user-username').disabled = false;
};

window.saveUser = async () => {
  const body = {
    username: document.getElementById('user-username').value.trim(),
    password: document.getElementById('user-password').value,
    full_name: document.getElementById('user-fullname').value.trim() || null,
    role: document.getElementById('user-role').value,
    assigned_machine_ids: Array.from(document.querySelectorAll('.machine-check:checked')).map(cb => parseInt(cb.value)),
  };
  if (!body.username) return showToast(__('Username is required'), 'error');
  if (!editingUserId && !body.password) return showToast(__('Password is required for new users'), 'error');
  if (!editingUserId && body.password.length < 3) return showToast(__('Password too short'), 'error');
  try {
    if (editingUserId) {
      const updateBody = {
        full_name: body.full_name,
        role: body.role,
        assigned_machine_ids: body.assigned_machine_ids,
      };
      if (body.password) updateBody.password = body.password;
      await update(`/auth/users/${editingUserId}`, updateBody);
      showToast(__('User updated'));
    } else {
      await create('/auth/users', body);
      showToast(__('User created'));
    }
    closeUserForm();
    await loadUsers();
  } catch (e) { showToast(e.message, 'error'); }
};

window.editUser = async (id) => {
  const users = await list('/auth/users');
  const item = users.find(u => u.id === id);
  if (item) window.openUserForm(item);
};

window.deleteUser = async (id) => {
  if (!confirm(__('Delete this user? Machines assigned to them will be unassigned.'))) return;
  try { await del(`/auth/users/${id}`); showToast(__('User deleted')); await loadUsers(); }
  catch (e) { showToast(e.message, 'error'); }
};
