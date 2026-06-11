import { get } from '../api.js';

const SystemPage = {
  async render() {
    const el = document.getElementById('page-system');
    if (!el) return;

    el.innerHTML = `
      <div class="page-header">
        <h1><i class="icon-database"></i> ${__('System')}</h1>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-header">${__('System Update')}</div>
        <div class="card-body">
          <div id="sys-version-info">
            <div class="loading">${__('Loading...')}</div>
          </div>
          <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary" id="btn-check-updates">${__('Check for Updates')}</button>
            <button class="btn btn-success" id="btn-update" disabled>${__('Update & Restart')}</button>
          </div>
          <div id="sys-msg" style="margin-top:12px"></div>
        </div>
      </div>
    `;

    document.getElementById('btn-check-updates').onclick = () => this.checkUpdates();
    document.getElementById('btn-update').onclick = () => this.doUpdate();

    this.checkUpdates();
  },

  async checkUpdates() {
    const infoEl = document.getElementById('sys-version-info');
    const btnUpdate = document.getElementById('btn-update');
    const msgEl = document.getElementById('sys-msg');
    msgEl.innerHTML = '';

    try {
      const ver = await get('/system/version');
      if (!ver) return;
      infoEl.innerHTML = `
        <table class="info-table">
          <tr><td>${__('Current Version')}:</td><td><code>${ver.current_commit}</code></td></tr>
          <tr><td>${__('Latest Version')}:</td><td><code>${ver.latest_commit}</code></td></tr>
          <tr><td>${__('Status')}:</td><td>${ver.up_to_date ? '✅ ' + __('Up to date') : '⚠️ ' + __('Update available')}</td></tr>
        </table>
      `;
      btnUpdate.disabled = ver.up_to_date;
    } catch {
      infoEl.innerHTML = `<div class="alert alert-error">${__('Failed to check for updates')}</div>`;
    }
  },

  async doUpdate() {
    const msgEl = document.getElementById('sys-msg');
    const btnUpdate = document.getElementById('btn-update');
    btnUpdate.disabled = true;
    btnUpdate.textContent = '⏳ ' + __('Updating...');
    msgEl.innerHTML = '';

    try {
      const res = await fetch('/system/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        msgEl.innerHTML = `<div class="alert alert-success">✅ ${data.message}</div>`;
        setTimeout(() => location.reload(), 3000);
      } else {
        msgEl.innerHTML = `<div class="alert alert-error">❌ ${data.detail || __('Update failed')}</div>`;
        btnUpdate.disabled = false;
        btnUpdate.textContent = __('Update & Restart');
      }
    } catch {
      msgEl.innerHTML = `<div class="alert alert-error">❌ ${__('Network error')}</div>`;
      btnUpdate.disabled = false;
      btnUpdate.textContent = __('Update & Restart');
    }
  },
};

window.init_system = async function () {
  SystemPage.render();
};
