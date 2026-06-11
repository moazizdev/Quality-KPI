let TOKEN = localStorage.getItem('token') || null;
let CURRENT_USER = JSON.parse(localStorage.getItem('user') || 'null');

export function getToken() { return TOKEN; }
export function getUser() { return CURRENT_USER; }

export function setAuth(token, user) {
  TOKEN = token;
  CURRENT_USER = user;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  TOKEN = null;
  CURRENT_USER = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function isAdmin() {
  return CURRENT_USER && CURRENT_USER.role === 'admin';
}

export async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (TOKEN) opts.headers['Authorization'] = `Bearer ${TOKEN}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (res.status === 402) {
    window.showLicenseRequired();
    return null;
  }
  if (res.status === 401) {
    clearAuth();
    window.location.hash = '#/login';
    window.showAuthRequired();
    return null;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const list = (path) => api('GET', path);
export const get = (path) => api('GET', path);
export const create = (path, body) => api('POST', path, body);
export const update = (path, body) => api('PATCH', path, body);
export const del = (path) => api('DELETE', path);

export async function listWithMeta(path) {
  const opts = { method: 'GET', headers: { 'Content-Type': 'application/json' } };
  if (TOKEN) opts.headers['Authorization'] = `Bearer ${TOKEN}`;
  const res = await fetch(path, opts);
  if (res.status === 402) {
    window.showLicenseRequired();
    return { data: [], total: 0 };
  }
  if (res.status === 401) {
    clearAuth();
    window.location.hash = '#/login';
    window.showAuthRequired();
    return { data: [], total: 0 };
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  const data = await res.json();
  const total = parseInt(res.headers.get('X-Total-Count') || data.length, 10);
  return { data, total };
}

export async function loadKpiSummary(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api('GET', `/kpi/summary${qs ? '?' + qs : ''}`);
}
export async function loadDefectsByCategory(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api('GET', `/kpi/defects-by-category${qs ? '?' + qs : ''}`);
}
export async function loadDefectsByMachine(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api('GET', `/kpi/defects-by-machine${qs ? '?' + qs : ''}`);
}
