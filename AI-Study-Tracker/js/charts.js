/**
 * AI Study Tracker - Charts.js (Chart.js wrappers + shared utilities)
 */

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') 
  ? 'http://localhost:5000' 
  : window.location.origin;

// ── API helpers ───────────────────────────────────────────────────────────────
async function api(endpoint, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  };
  const uid = localStorage.getItem('user_id');
  const uname = localStorage.getItem('username');
  if (uid) opts.headers['X-User-Id'] = uid;
  if (uname) opts.headers['X-Username'] = uname;

  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + endpoint, opts);
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

// ── Auth guard ────────────────────────────────────────────────────────────────
async function requireAuth() {
  const uid = localStorage.getItem('user_id');
  if (!uid) {
    window.location.href = '../login.html';
    return null;
  }
  try {
    const data = await api('/check_auth');
    if (!data.logged_in) {
      localStorage.clear();
      window.location.href = '../login.html';
      return null;
    }
    return data;
  } catch {
    window.location.href = '../login.html';
    return null;
  }
}

async function requireAuthRoot() {
  const uid = localStorage.getItem('user_id');
  if (!uid) {
    window.location.href = 'login.html';
    return null;
  }
  try {
    const data = await api('/check_auth');
    if (!data.logged_in) {
      localStorage.clear();
      window.location.href = 'login.html';
      return null;
    }
    return data;
  } catch {
    window.location.href = 'login.html';
    return null;
  }
}

// ── Chart defaults ────────────────────────────────────────────────────────────
const CHART_DEFAULTS = {
  font: { family: 'Inter, sans-serif', size: 12 },
  color: '#94a3b8',
  grid: 'rgba(255,255,255,0.05)',
  tooltip: {
    backgroundColor: 'rgba(17,24,39,0.95)',
    titleColor: '#f0f4ff',
    bodyColor: '#94a3b8',
    borderColor: 'rgba(99,130,255,0.2)',
    borderWidth: 1,
    padding: 12,
    cornerRadius: 8
  }
};

Chart.defaults.font.family = CHART_DEFAULTS.font.family;
Chart.defaults.font.size = CHART_DEFAULTS.font.size;
Chart.defaults.color = CHART_DEFAULTS.color;

const PALETTE = {
  blue: '#6382ff',
  purple: '#a855f7',
  cyan: '#22d3ee',
  green: '#10b981',
  orange: '#f59e0b',
  red: '#ef4444',
  pink: '#ec4899'
};

// ── Create Line Chart ─────────────────────────────────────────────────────────
function createLineChart(canvasId, labels, datasets, title = '') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          display: datasets.length > 1,
          labels: { color: '#94a3b8', boxWidth: 12, padding: 16 }
        },
        title: title ? { display: true, text: title, color: '#f0f4ff', font: { size: 14, weight: '600' } } : { display: false },
        tooltip: CHART_DEFAULTS.tooltip
      },
      scales: {
        x: {
          grid: { color: CHART_DEFAULTS.grid },
          ticks: { color: '#64748b' },
          border: { color: CHART_DEFAULTS.grid }
        },
        y: {
          grid: { color: CHART_DEFAULTS.grid },
          ticks: { color: '#64748b' },
          border: { color: CHART_DEFAULTS.grid },
          beginAtZero: true
        }
      }
    }
  });
}

// ── Create Bar Chart ──────────────────────────────────────────────────────────
function createBarChart(canvasId, labels, datasets, title = '') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: datasets.length > 1,
          labels: { color: '#94a3b8', boxWidth: 12 }
        },
        tooltip: CHART_DEFAULTS.tooltip
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748b' },
          border: { color: CHART_DEFAULTS.grid }
        },
        y: {
          grid: { color: CHART_DEFAULTS.grid },
          ticks: { color: '#64748b' },
          border: { color: CHART_DEFAULTS.grid },
          beginAtZero: true
        }
      }
    }
  });
}

// ── Create Doughnut Chart ─────────────────────────────────────────────────────
function createDoughnutChart(canvasId, labels, data, colors) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors || [PALETTE.blue, PALETTE.purple, PALETTE.cyan, PALETTE.green, PALETTE.orange, PALETTE.pink, PALETTE.red],
        borderColor: 'transparent',
        hoverOffset: 8,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94a3b8', boxWidth: 12, padding: 14 }
        },
        tooltip: CHART_DEFAULTS.tooltip
      }
    }
  });
}

// ── Create Radar Chart ────────────────────────────────────────────────────────
function createRadarChart(canvasId, labels, datasets) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'radar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#94a3b8' } },
        tooltip: CHART_DEFAULTS.tooltip
      },
      scales: {
        r: {
          grid: { color: CHART_DEFAULTS.grid },
          angleLines: { color: CHART_DEFAULTS.grid },
          pointLabels: { color: '#94a3b8', font: { size: 12 } },
          ticks: { color: '#64748b', backdropColor: 'transparent' }
        }
      }
    }
  });
}

// ── Gradient helpers ──────────────────────────────────────────────────────────
function makeGradient(ctx, color1, color2) {
  const g = ctx.createLinearGradient(0, 0, 0, 300);
  g.addColorStop(0, color1);
  g.addColorStop(1, color2);
  return g;
}

function makeAreaGradient(chartCtx, color) {
  const g = chartCtx.chart.ctx.createLinearGradient(0, 0, 0, 300);
  g.addColorStop(0, color + '40');
  g.addColorStop(1, color + '00');
  return g;
}

// ── User display helpers ──────────────────────────────────────────────────────
function setUserDisplay(username) {
  document.querySelectorAll('.user-display-name').forEach(el => el.textContent = username || 'Student');
  document.querySelectorAll('.user-avatar-text').forEach(el => el.textContent = (username || 'S')[0].toUpperCase());
}

// ── Logout ────────────────────────────────────────────────────────────────────
async function logout() {
  localStorage.clear();
  try { await api('/logout', 'POST'); } catch {}
  window.location.href = '../login.html';
}
async function logoutRoot() {
  localStorage.clear();
  try { await api('/logout', 'POST'); } catch {}
  window.location.href = 'login.html';
}

// ── Notification badge ────────────────────────────────────────────────────────
async function loadNotifBadge() {
  try {
    const data = await api('/get_notifications');
    const cnt = data.unread_count || 0;
    document.querySelectorAll('.notif-badge').forEach(el => {
      el.textContent = cnt;
      el.style.display = cnt > 0 ? 'flex' : 'none';
    });
  } catch {}
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const existing = document.getElementById('toast-container');
  if (!existing) {
    const c = document.createElement('div');
    c.id = 'toast-container';
    c.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(c);
  }
  const toast = document.createElement('div');
  const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#6382ff' };
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  toast.style.cssText = `
    display:flex;align-items:center;gap:10px;
    background:#1a2035;border:1px solid ${colors[type]}40;
    color:#f0f4ff;font-size:13px;font-weight:500;
    padding:12px 18px;border-radius:10px;
    box-shadow:0 8px 32px rgba(0,0,0,0.4);
    animation:slideUp 0.3s ease;
    border-left:3px solid ${colors[type]};
    max-width:360px;
  `;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ── Alert helper ──────────────────────────────────────────────────────────────
function showAlert(containerId, message, type = 'info') {
  const c = document.getElementById(containerId);
  if (!c) return;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  c.innerHTML = `<div class="alert ${type}"><span>${icons[type]}</span><span>${message}</span></div>`;
  setTimeout(() => c.innerHTML = '', 5000);
}

// ── Loading state ─────────────────────────────────────────────────────────────
function setLoading(btnId, loading, loadingText = 'Loading...') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.dataset.original = btn.dataset.original || btn.innerHTML;
  btn.innerHTML = loading ? `<div class="spinner" style="width:18px;height:18px;margin:0"></div> ${loadingText}` : btn.dataset.original;
}

// ── Format helpers ────────────────────────────────────────────────────────────
function formatHours(h) { return h >= 1 ? `${h.toFixed(1)}h` : `${Math.round(h * 60)}m`; }
function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

function focusColor(val) {
  if (val >= 8) return '#10b981';
  if (val >= 6) return '#6382ff';
  if (val >= 4) return '#f59e0b';
  return '#ef4444';
}

function ratingStars(r) {
  return Array(5).fill(0).map((_, i) => `<span style="color:${i < r ? '#f59e0b' : '#2d3748'}">★</span>`).join('');
}

// ── Active nav ────────────────────────────────────────────────────────────────
function setActiveNav(href) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('href') === href || item.dataset.href === href);
  });
}
