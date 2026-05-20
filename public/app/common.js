// Shared client code for the user-facing frontend.
// - injects the site header (brand, search, token bar)
// - exposes a fetch helper with auth header
// - exposes helpers for poster URLs, author names, dates, toasts

const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';
const TMDB_IMG_SMALL = 'https://image.tmdb.org/t/p/w342';

function getToken() {
  return localStorage.getItem('token') || '';
}
function setToken(t) {
  if (t) localStorage.setItem('token', t);
  else localStorage.removeItem('token');
}

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function currentUser() {
  const token = getToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || payload.preferred_username || payload.email || payload.sub,
    role: payload.role,
    expired: payload.exp ? Date.now() / 1000 > payload.exp : false,
  };
}

async function api(method, path, body) {
  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const init = { method, headers };
  if (body !== undefined && body !== null) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(path, init);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || res.statusText || 'Request failed';
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function posterUrl(path) {
  return path ? TMDB_IMG + path : '';
}
function posterUrlSmall(path) {
  return path ? TMDB_IMG_SMALL + path : '';
}

function fmtYear(d) {
  if (!d) return '';
  const m = /^(\d{4})/.exec(String(d));
  return m ? m[1] : '';
}
function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
function fmtAuthor(author) {
  if (!author) return 'Anonymous';
  if (typeof author === 'string') return author;
  return author.name || author.email || author.sub || 'Anonymous';
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let toastTimer = null;
function toast(message, kind) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.className = 'toast show ' + (kind || '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.className = 'toast ' + (kind || '');
  }, 2400);
}

function injectHeader(initialSearch) {
  const params = new URLSearchParams(window.location.search);
  const q = initialSearch?.q ?? params.get('q') ?? '';
  const type = initialSearch?.type ?? params.get('type') ?? 'movie';

  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="site-header-inner">
      <a href="/" class="brand"><span class="brand-dot"></span>Movie Hub</a>
      <form class="header-search" onsubmit="return submitSearch(event)">
        <select id="hdr-type">
          <option value="movie">Movies</option>
          <option value="tv">TV</option>
        </select>
        <input id="hdr-q" type="search" placeholder="Search titles..." />
        <button type="submit">Search</button>
      </form>
      <nav class="header-nav">
        <a href="/report">Report a bug</a>
        <a href="/admin/issues" id="hdr-admin-link" style="display: none">Admin</a>
      </nav>
    </div>
    <div class="token-bar">
      <label>Bearer token</label>
      <input id="hdr-token" type="password" placeholder="paste a JWT to sign in" />
      <button class="secondary" type="button" onclick="saveToken()">Save</button>
      <button class="secondary" type="button" onclick="clearToken()">Sign out</button>
      <span class="who" id="hdr-who">Not signed in</span>
    </div>
  `;
  document.body.insertBefore(header, document.body.firstChild);

  document.getElementById('hdr-type').value = type;
  document.getElementById('hdr-q').value = q;
  document.getElementById('hdr-token').value = getToken();
  renderWho();
}

const ADMIN_ROLES = new Set(['Admin', 'SuperAdmin', 'Owner']);

function renderWho() {
  const el = document.getElementById('hdr-who');
  const adminLink = document.getElementById('hdr-admin-link');
  if (!el) return;
  const user = currentUser();
  if (!user) {
    el.textContent = 'Not signed in';
    el.className = 'who';
    if (adminLink) adminLink.style.display = 'none';
    return;
  }
  if (user.expired) {
    el.textContent = 'Token expired — sign out and paste a new one';
    el.className = 'who err';
    if (adminLink) adminLink.style.display = 'none';
    return;
  }
  el.textContent =
    'Signed in as ' + (user.name || user.sub) + (user.role ? ' (' + user.role + ')' : '');
  el.className = 'who signed';
  // Token's role claim is hint-only; the server is the source of truth.
  // Show the Admin link optimistically — the page itself handles 403s.
  if (adminLink) adminLink.style.display = ADMIN_ROLES.has(user.role) ? '' : 'none';
}

function saveToken() {
  const v = document.getElementById('hdr-token').value.trim();
  setToken(v);
  renderWho();
  toast(v ? 'Token saved.' : 'Token cleared.', 'ok');
}
function clearToken() {
  setToken('');
  document.getElementById('hdr-token').value = '';
  renderWho();
  toast('Signed out.', 'ok');
}
function submitSearch(e) {
  e.preventDefault();
  const q = document.getElementById('hdr-q').value.trim();
  const type = document.getElementById('hdr-type').value;
  if (!q) return false;
  const params = new URLSearchParams({ type, q });
  window.location.href = '/search?' + params.toString();
  return false;
}
