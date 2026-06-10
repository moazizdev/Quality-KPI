import { get, list } from '../api.js';

const BackupPage = {
  async render() {
    const el = document.getElementById('page-backup');
    if (!el) return;

    if (!window.isAdmin()) {
      el.innerHTML = `<div class="alert alert-error">${__('Only admins can manage users.')}</div>`;
      return;
    }
    el.innerHTML = `<div class="loading">${__('Loading...')}</div>`;
    this.loadInfo(el);
  },

  async loadInfo(el) {
    const res = await get('/backup/info');
    if (!res) {
      el.innerHTML = `<div class="alert alert-error">${__('error')}: ${__('Failed to load dashboard')}</div>`;
      return;
    }

    el.innerHTML = `
      <div class="page-header">
        <h1><i class="icon-database"></i> ${__('backup')}</h1>
      </div>

      <div class="card" style="margin-bottom:16px">
        <h3>${__('database_location')}</h3>
        <table class="info-table">
          <tr><td>${__('path')}:</td><td><code>${res.path}</code></td></tr>
          <tr><td>${__('size')}:</td><td>${res.size_mb} MB</td></tr>
          <tr><td>${__('status')}:</td><td>${res.exists ? '✅ ' + __('available') : '❌ ' + __('not_found')}</td></tr>
        </table>
      </div>

      <div class="card" style="margin-bottom:16px">
        <h3>${__('backup_actions')}</h3>
        <div class="btn-group" style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" id="btn-download-backup">
            ⬇ ${__('download_backup')}
          </button>
          <button class="btn btn-secondary" id="btn-copy-backup">
            📁 ${__('create_backup_copy')}
          </button>
        </div>
        <div id="backup-result" style="margin-top:8px"></div>
      </div>

      ${res.backups && res.backups.length > 0 ? `
      <div class="card">
        <h3>${__('existing_backups')}</h3>
        <ul style="list-style:none;padding:0">
          ${res.backups.map(b => `<li style="padding:4px 0;border-bottom:1px solid #eee"><code>${b}</code></li>`).join('')}
        </ul>
      </div>` : ''}
    `;

    document.getElementById('btn-download-backup').onclick = () => this.downloadBackup();
    document.getElementById('btn-copy-backup').onclick = () => this.createCopy();
  },

  async loadInfo(el) {
    const res = await get('/backup/info');
    if (!res) {
      el.innerHTML = `<div class="alert alert-error">${__('network_error')}</div>`;
      return;
    }

    el.innerHTML = `
      <div class="page-header">
        <h1><i class="icon-database"></i> ${__('backup')}</h1>
      </div>

      <div class="card" style="margin-bottom:16px">
        <h3>${__('database_location')}</h3>
        <table class="info-table">
          <tr><td>${__('path')}:</td><td><code>${res.path}</code></td></tr>
          <tr><td>${__('size')}:</td><td>${res.size_mb} MB</td></tr>
          <tr><td>${__('status')}:</td><td>${res.exists ? '✅ ' + __('available') : '❌ ' + __('not_found')}</td></tr>
        </table>
      </div>

      <div class="card" style="margin-bottom:16px">
        <h3>${__('backup_actions')}</h3>
        <div class="btn-group" style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" id="btn-download-backup">
            ⬇ ${__('download_backup')}
          </button>
          <button class="btn btn-secondary" id="btn-copy-backup">
            📁 ${__('create_backup_copy')}
          </button>
        </div>
        <div id="backup-result" style="margin-top:8px"></div>
      </div>

      ${res.backups && res.backups.length > 0 ? `
      <div class="card">
        <h3>${__('existing_backups')}</h3>
        <ul style="list-style:none;padding:0">
          ${res.backups.map(b => `<li style="padding:4px 0;border-bottom:1px solid #eee"><code>${b}</code></li>`).join('')}
        </ul>
      </div>` : ''}
    `;

    document.getElementById('btn-download-backup').onclick = () => this.downloadBackup();
    document.getElementById('btn-copy-backup').onclick = () => this.createCopy();
  },

  async downloadBackup() {
    const btn = document.getElementById('btn-download-backup');
    const resultEl = document.getElementById('backup-result');
    btn.disabled = true;
    btn.textContent = '⏳ ...';
    resultEl.innerHTML = '';

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/backup/download', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || __('error'));
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('content-disposition')?.split('filename="')[1]?.replace('"', '') || 'backup.db';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      resultEl.innerHTML = `<div class="alert alert-success">✅ ${__('backup_downloaded')}</div>`;
    } catch (e) {
      resultEl.innerHTML = `<div class="alert alert-error">❌ ${e.message}</div>`;
    }
    btn.disabled = false;
    btn.textContent = '⬇ ' + __('download_backup');
  },

  async createCopy() {
    const btn = document.getElementById('btn-copy-backup');
    const resultEl = document.getElementById('backup-result');
    btn.disabled = true;
    btn.textContent = '⏳ ...';
    resultEl.innerHTML = '';

    const res = await get('/backup/create-copy');
    if (!res) {
      resultEl.innerHTML = `<div class="alert alert-error">❌ ${__('error')}</div>`;
    } else {
      resultEl.innerHTML = `<div class="alert alert-success">✅ ${res.message} (${res.size_mb} MB)</div>`;
      this.loadInfo(document.getElementById('page-backup'));
    }
    btn.disabled = false;
    btn.textContent = '📁 ' + __('create_backup_copy');
  },
};

window.init_backup = async function () {
  BackupPage.render();
};
