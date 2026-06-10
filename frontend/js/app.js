import { setAuth, clearAuth, getToken, getUser, isAdmin } from './api.js';
import './translations.js';
import './pages/dashboard.js';
import './pages/halls.js';
import './pages/machines.js';
import './pages/products.js';
import './pages/defect_categories.js';
import './pages/production.js';
import './pages/deviations.js';
import './pages/capa.js';
import './pages/complaints.js';
import './pages/users.js';
import './pages/weekly_report.js';
import './pages/backup.js';
import './pages/audit.js';
import './pages/departments.js';

// ─── Navigation Definition ───────────────────────────────────────────────────
const NAV_ITEMS = [
  { page: 'dashboard', label: 'Dashboard', icon: '&#9783;' },
  { section: 'Operations' },
  { page: 'production', label: 'Production Records', icon: '&#9881;' },
  { page: 'deviations', label: 'Deviations', icon: '&#10060;' },
  { page: 'capa', label: 'CAPA Cases', icon: '&#9997;' },
  { page: 'complaints', label: 'Customer Complaints', icon: '&#9742;' },
  { section: 'Master Data', collapsible: true, children: [
    { page: 'halls', label: 'Halls', icon: '&#9962;', admin: true },
    { page: 'machines', label: 'Machines', icon: '&#9881;', admin: true },
    { page: 'products', label: 'Products', icon: '&#9786;', admin: true },
    { page: 'defect-categories', label: 'Defect Categories', icon: '&#9888;', admin: true },
    { page: 'departments', label: 'Departments', icon: '&#128100;', admin: true },
    { page: 'users', label: 'Users', icon: '&#128101;', admin: true },
  ]},
  { section: 'Reports' },
  { page: 'weekly-report', label: 'Weekly Report', icon: '&#128202;' },
  { page: 'backup', label: 'Backup', icon: '&#128190;', admin: true },
  { page: 'audit-logs', label: 'Audit Logs', icon: '&#128214;', admin: true },
];

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
  } catch { return null; }
}

function isVisible(item) {
  const user = getCurrentUser();
  if (item.admin && (!user || user.role !== 'admin')) return false;
  return true;
}

function buildNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = NAV_ITEMS.map(item => {
    if (item.section && item.collapsible) {
      const children = item.children.filter(isVisible);
      if (children.length === 0) return '';
      const key = `nav_collapse_${item.section.replace(/\s+/g, '_')}`;
      const expanded = localStorage.getItem(key) !== '0';
      const childrenHtml = children.map(ch =>
        `<a href="#/${ch.page}" class="nav-item nav-sub-item" data-page="${ch.page}"><span class="nav-icon">${ch.icon}</span> ${__(ch.label)}</a>`
      ).join('');
      return `<div class="nav-collapsible ${expanded ? 'expanded' : ''}">
        <div class="nav-collapsible-header" onclick="toggleNavCollapse(this)" data-storage-key="${key}">
          <span class="nav-collapsible-title">${__(item.section)}</span>
          <span class="nav-collapse-arrow">&#9660;</span>
        </div>
        <div class="nav-collapsible-body">${childrenHtml}</div>
      </div>`;
    }
    if (item.section) return `<div class="nav-section">${__(item.section)}</div>`;
    if (!isVisible(item)) return '';
    return `<a href="#/${item.page}" class="nav-item" data-page="${item.page}"><span class="nav-icon">${item.icon}</span> ${__(item.label)}</a>`;
  }).join('');
}

window.toggleNavCollapse = function (header) {
  const collapsible = header.closest('.nav-collapsible');
  collapsible.classList.toggle('expanded');
  const key = header.dataset.storageKey;
  if (key) localStorage.setItem(key, collapsible.classList.contains('expanded') ? '1' : '0');
};

const pageNames = {
  dashboard: 'Dashboard',
  halls: 'Halls',
  machines: 'Machines',
  products: 'Products',
  'defect-categories': 'Defect Categories',
  production: 'Production Records',
  deviations: 'Deviations',
  capa: 'CAPA Cases',
  complaints: 'Customer Complaints',
  users: 'Users',
  departments: 'Departments',
  'weekly-report': 'Weekly Report',
  backup: 'Database Backup',
  'audit-logs': 'Audit Logs',
};

// ─── Language Switch ─────────────────────────────────────────────────────────
window.switchLang = function (lang) {
  setLang(lang);
  document.getElementById('lang-select').value = lang;
  document.title = lang === 'ar' ? 'نظام مؤشرات الجودة' : 'Quality KPI System';
  document.getElementById('login-title').textContent = __('Quality KPI System');
  document.getElementById('login-btn').textContent = __('Login');
  buildNav();
  const activePage = document.querySelector('.page.active');
  if (activePage) {
    const pageId = activePage.id.replace('page-', '');
    pageTitle.textContent = __(pageNames[pageId] || pageId);
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navEl = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (navEl) {
      navEl.classList.add('active');
      const parentCollapsible = navEl.closest('.nav-collapsible');
      if (parentCollapsible && !parentCollapsible.classList.contains('expanded')) {
        parentCollapsible.classList.add('expanded');
      }
    }
  }
  // Re-init current page to update its content
  const pageId = location.hash.replace('#/', '') || 'dashboard';
  const fn = window[`init_${pageId.replace(/-/g, '_')}`];
  if (fn) fn();
  // Update pull-to-refresh text
  const ptrText = document.getElementById('ptr-text');
  if (ptrText) ptrText.textContent = __('Pull to refresh');
};

// ─── Navigation ──────────────────────────────────────────────────────────────
const pages = document.querySelectorAll('.page');
const pageTitle = document.getElementById('page-title');
const userInfo = document.getElementById('user-info');
const logoutBtn = document.getElementById('logout-btn');

function showLoader() {
  document.getElementById('page-loader').classList.add('active');
}
function hideLoader() {
  document.getElementById('page-loader').classList.remove('active');
}

const ADMIN_PAGES = ['halls', 'machines', 'products', 'defect-categories', 'departments', 'users', 'backup', 'audit-logs'];

function navigate(pageId) {
  const user = getCurrentUser();
  if (ADMIN_PAGES.includes(pageId) && (!user || user.role !== 'admin')) {
    location.hash = '#/dashboard';
    return;
  }
  const page = document.getElementById(`page-${pageId}`);
  if (!page) return;
  pages.forEach(p => p.classList.remove('active'));
  page.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navEl = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (navEl) {
    navEl.classList.add('active');
    const parentCollapsible = navEl.closest('.nav-collapsible');
    if (parentCollapsible && !parentCollapsible.classList.contains('expanded')) {
      parentCollapsible.classList.add('expanded');
    }
  }
  pageTitle.textContent = __(pageNames[pageId] || pageId);
  showLoader();
  const fn = window[`init_${pageId.replace(/-/g, '_')}`];
  if (fn) {
    const result = fn();
    if (result && typeof result.then === 'function') result.then(hideLoader).catch(hideLoader);
    else hideLoader();
  } else {
    hideLoader();
  }
}

function handleHash() {
  const hash = location.hash.slice(1) || '/dashboard';
  const pageId = hash.replace('/', '');
  if (!getToken()) {
    document.getElementById('login-overlay').classList.add('active');
    return;
  }
  document.getElementById('login-overlay').classList.remove('active');
  document.getElementById('app').style.display = 'flex';
  navigate(pageId);
}

window.addEventListener('hashchange', handleHash);

// ─── Auth ────────────────────────────────────────────────────────────────────
window.authLogin = async function () {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');
  if (!username || !password) {
    errEl.textContent = __('Enter username and password');
    errEl.style.display = 'block';
    return;
  }
  btn.disabled = true;
  btn.textContent = __('Signing in...');
  errEl.style.display = 'none';
  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || __('Login failed'));
    }
    const data = await res.json();
    setAuth(data.access_token, data.user);
    updateUserUI();
    if (!location.hash) location.hash = '#/dashboard';
    handleHash();
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = __('Login');
  }
};

document.getElementById('login-password').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') window.authLogin();
});

window.authLogout = function () {
  clearAuth();
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-overlay').classList.add('active');
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  location.hash = '';
};

const loginErrText = { en: 'Session expired. Please login again.', ar: 'انتهت الجلسة. الرجاء تسجيل الدخول مرة أخرى.' };
window.showAuthRequired = function () {
  alert(getLang() === 'ar' ? loginErrText.ar : loginErrText.en);
  window.authLogout();
};

function updateUserUI() {
  const user = getUser();
  if (user) {
    userInfo.textContent = `${user.full_name || user.username} (${user.role})`;
    logoutBtn.textContent = __('Logout');
    logoutBtn.style.display = 'inline-flex';
    document.querySelectorAll('.nav-item').forEach(n => n.style.display = '');
  } else {
    userInfo.textContent = '';
    logoutBtn.style.display = 'none';
  }
}

// ─── Mobile Sidebar ──────────────────────────────────────────────────────────
function isMobile() { return window.innerWidth <= 768; }

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (isMobile()) {
    sidebar.classList.toggle('open');
    backdrop.classList.toggle('active');
  } else {
    sidebar.classList.toggle('collapsed');
  }
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  sidebar.classList.remove('open');
  backdrop.classList.remove('active');
}

document.getElementById('menu-toggle').addEventListener('click', toggleSidebar);
document.getElementById('sidebar-backdrop').addEventListener('click', closeSidebar);
document.getElementById('nav').addEventListener('click', (e) => {
  if (isMobile() && e.target.closest('.nav-item')) closeSidebar();
});

window.addEventListener('resize', () => {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!isMobile()) {
    sidebar.classList.remove('open');
    backdrop.classList.remove('active');
  }
});

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setLang(getLang());
  document.getElementById('lang-select').value = getLang();
  document.title = getLang() === 'ar' ? 'نظام مؤشرات الجودة' : 'Quality KPI System';
  document.getElementById('login-title').textContent = __('Quality KPI System');
  document.getElementById('login-btn').textContent = __('Login');
  buildNav();
  if (getToken()) {
    document.getElementById('login-overlay').classList.remove('active');
    document.getElementById('app').style.display = 'flex';
    updateUserUI();
    if (!location.hash) location.hash = '#/dashboard';
    handleHash();
  } else {
    document.getElementById('app').style.display = 'none';
    document.getElementById('login-overlay').classList.add('active');
  }
});

// ─── Table search ─────────────────────────────────────────────────────────────
window.filterTable = function (tbodyId, query) {
  const q = query.toLowerCase().trim();
  document.querySelectorAll(`#${tbodyId} tr`).forEach(tr => {
    if (!q) { tr.style.display = ''; return; }
    tr.style.display = Array.from(tr.querySelectorAll('td')).some(td => td.textContent.toLowerCase().includes(q)) ? '' : 'none';
  });
};

// ─── Table scroll shadow ──────────────────────────────────────────────────────
function updateTableScrollShadows() {
  document.querySelectorAll('.table-wrap').forEach(wrap => {
    const hasScroll = wrap.scrollWidth > wrap.clientWidth;
    wrap.classList.toggle('is-scrollable', hasScroll);
  });
}
document.addEventListener('DOMContentLoaded', updateTableScrollShadows);
const _tableObserver = new MutationObserver(updateTableScrollShadows);
document.addEventListener('DOMContentLoaded', () => {
  _tableObserver.observe(document.getElementById('content'), { childList: true, subtree: true });
});

// ─── Toast Notifications ─────────────────────────────────────────────────────
const TOAST_TYPES = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };

window.showToast = function (message, type) {
  type = type || 'success';
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  el.style.background = TOAST_TYPES[type] || TOAST_TYPES.info;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2500);
};

// ─── Pull to Refresh (mobile) ────────────────────────────────────────────────
let ptrState = { startY: 0, pulling: false, ready: false };
const PTR_THRESHOLD = 70;

async function ptrRefresh() {
  const hash = location.hash.slice(1) || '/dashboard';
  const pageId = hash.replace('/', '');
  const fn = window[`init_${pageId.replace(/-/g, '_')}`];
  if (fn) await fn();
}

function ptrReset() {
  const el = document.getElementById('ptr-indicator');
  if (!el) return;
  el.classList.remove('ptr-active', 'ptr-refreshing');
  el.style.transform = '';
  const arrow = document.getElementById('ptr-arrow');
  if (arrow) { arrow.innerHTML = '&#8595;'; arrow.style.transform = ''; }
  const text = document.getElementById('ptr-text');
  if (text) text.textContent = __('Pull to refresh');
  ptrState.pulling = false;
  ptrState.ready = false;
}

function ptrAnimate(indicator, progress) {
  const clamped = Math.min(progress, 1);
  const translate = clamped * 50;
  const rotate = clamped * 180;
  indicator.style.transform = `translateY(${translate}px)`;
  const arrow = document.getElementById('ptr-arrow');
  if (arrow) arrow.style.transform = `rotate(${rotate}deg)`;
}

let ptrEl = null;
document.addEventListener('touchstart', (e) => {
  const content = document.getElementById('content');
  if (!content.contains(e.target)) return;
  if (content.scrollTop > 0) return;
  if (document.querySelector('.modal-overlay.active')) return;
  ptrState.startY = e.touches[0].clientY;
  ptrEl = document.getElementById('ptr-indicator');
  ptrState.pulling = true;
  ptrState.ready = false;
  ptrEl.classList.add('ptr-active');
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (!ptrState.pulling) return;
  const dy = e.touches[0].clientY - ptrState.startY;
  if (dy <= 0) { ptrAnimate(ptrEl, 0); return; }
  e.preventDefault();
  const progress = dy / PTR_THRESHOLD;
  ptrState.ready = progress >= 1;
  ptrAnimate(ptrEl, progress);
  const text = document.getElementById('ptr-text');
  if (text) text.textContent = ptrState.ready ? __('Release to refresh') : __('Pull to refresh');
}, { passive: false });

document.addEventListener('touchend', async () => {
  if (!ptrState.pulling) return;
  if (ptrState.ready) {
    ptrReset();
    showLoader();
    await ptrRefresh();
    hideLoader();
  } else {
    ptrAnimate(ptrEl, 0);
    ptrReset();
  }
}, { passive: true });

// ─── Exports ─────────────────────────────────────────────────────────────────
window.isAdmin = isAdmin;
window.getUser = getUser;

window.exportExcel = async function (url) {
  try {
    const token = getToken();
    const opts = { method: 'GET', headers: {} };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(__('Export failed'));
    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="?(.+?)"?$/);
    const filename = match ? match[1] : 'export.xlsx';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    showToast(__('Exported successfully'));
  } catch (e) {
    showToast(e.message, 'error');
  }
};
