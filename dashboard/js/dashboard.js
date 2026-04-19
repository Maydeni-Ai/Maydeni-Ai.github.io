/**
 * Maydeni AI — Dashboard Controller
 * Maydeni AI
 */

// XSS prevention: sanitize any server/user data before inserting into DOM
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Toast notification utility
function showToast(message, type) {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  const bg = type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : '#3B82F6';
  toast.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;padding:12px 20px;border-radius:10px;color:#fff;font-weight:600;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,.15);transition:opacity .3s;background:' + bg;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(function() { toast.style.opacity = '0'; setTimeout(function() { toast.remove(); }, 300); }, 3000);
}

let map = null;
let heatLayer = null;
let markersLayer = null;
let showHeatmap = false;
let refreshInterval = null;

// ─── Tenant currency (set on login from /api/me → tenant.currency) ──
let TENANT_CURRENCY = 'TND';
let TENANT_CURRENCY_SYMBOL = 'DT';

// ═══════════════════════════════════════════════════════════
// INITIALISATION
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // Intro cinématographique → 13s puis affiche login ou dashboard
  setTimeout(async () => {
    const overlay = document.getElementById('intro-overlay');
    if (overlay) overlay.style.display = 'none';
    applyTranslations();
    try {
      if (api.isAuthenticated()) {
        // Validate token is still valid by calling /me
        try {
          const meData = await api.getMe();
          if (meData && meData.user) {
            api.user = meData.user;
            // Set tenant currency for all monetary displays
            if (meData.tenant && meData.tenant.currency) {
              setTenantCurrency(meData.tenant.currency);
            }
            showDashboard();
          } else {
            api.clearAuth();
            document.getElementById('login-screen').style.display = 'flex';
          }
        } catch (authErr) {
          // Token expired or invalid
          api.clearAuth();
          document.getElementById('login-screen').style.display = 'flex';
        }
      } else {
        document.getElementById('login-screen').style.display = 'flex';
      }
    } catch (e) {
      console.error('Init error:', e);
      document.getElementById('login-screen').style.display = 'flex';
    }
  }, 13500);

  setupEventListeners();
});

function setupEventListeners() {
  // ─── Login ──────────────────────────────────────────
  document.getElementById('login-form').addEventListener('submit', handleLogin);

  // ─── Hidden admin access ─────────────────────────────
  const adminTrigger = document.getElementById('admin-access-trigger');
  if (adminTrigger) {
    let clickCount = 0;
    let clickTimer = null;
    adminTrigger.addEventListener('click', () => {
      clickCount++;
      clearTimeout(clickTimer);
      if (clickCount >= 3) {
        clickCount = 0;
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
      clickTimer = setTimeout(() => { clickCount = 0; }, 1500);
    });
  }

  // ─── Admin login form (via API authentication) ────────
  const adminForm = document.getElementById('admin-login-form');
  if (adminForm) {
    adminForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('admin-username').value;
      const code = document.getElementById('admin-code').value;
      const err = document.getElementById('admin-login-error');
      err.style.display = 'none';
      try {
        // Authenticate via the real API
        const data = await api.login(username, code);
        if (data.user && data.user.role === 'admin') {
          api.setAuth(data.token, data.user, data.tenant);
          document.getElementById('admin-login-section').style.display = 'none';
          document.getElementById('admin-main').style.display = 'block';
          if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
          err.textContent = 'Accès réservé aux administrateurs';
          err.style.display = 'block';
        }
      } catch (ex) {
        err.textContent = 'Code incorrect';
        err.style.display = 'block';
      }
    });
  }

  // ─── Admin tabs ──────────────────────────────────────
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  // ─── Change password toggle ─────────────────────────
  document.getElementById('show-change-pwd').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('change-pwd-form').style.display = 'block';
  });

  document.getElementById('back-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('change-pwd-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('cp-error').style.display = 'none';
    document.getElementById('cp-success').style.display = 'none';
  });

  // ─── Change password submit ─────────────────────────
  document.getElementById('change-pwd-form').addEventListener('submit', handleChangePassword);

  // ─── Sidebar navigation ─────────────────────────────
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      navigateTo(section);
    });
  });

  // ─── Logout ─────────────────────────────────────────
  document.getElementById('btn-logout').addEventListener('click', handleLogout);

  // ─── Visit filters ─────────────────────────────────
  document.getElementById('visit-date-filter').addEventListener('change', loadVisits);
  document.getElementById('visit-suspect-filter').addEventListener('change', loadVisits);

  // ─── Heatmap toggle ────────────────────────────────
  document.getElementById('toggle-heatmap').addEventListener('click', toggleHeatmap);

  // ─── Create user form ──────────────────────────────
  document.getElementById('create-user-form').addEventListener('submit', handleCreateUser);

  // ─── Fetch live plan prices for demo cards ─────────
  fetch(API_BASE + '/plans')
    .then(r => r.json())
    .then(data => {
      (data.plans || []).forEach(p => {
        const priceEl = document.querySelector('.demo-plan-price[data-plan-name="' + p.name + '"]');
        if (priceEl) priceEl.innerHTML = p.price_dt + ' ' + TENANT_CURRENCY_SYMBOL + '<small style="font-size:.65em;opacity:.5">HT</small><span>/mois</span>';
        const agentsEl = document.querySelector('.demo-plan-agents[data-plan-name="' + p.name + '"]');
        if (agentsEl) agentsEl.textContent = (p.max_delegates < 0 ? 'Agents illimités' : p.max_delegates + ' agents terrain');
      });
    }).catch(() => {});
}

// ═══════════════════════════════════════════════════════════
// AUTHENTIFICATION
// ═══════════════════════════════════════════════════════════

async function handleLogin(e) {
  e.preventDefault();
  const errorEl = document.getElementById('login-error');
  errorEl.style.display = 'none';

  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const data = await api.login(username, password);
    api.setAuth(data.token, data.user, data.tenant);
    // Lock currency from tenant
    if (data.tenant && data.tenant.currency) {
      setTenantCurrency(data.tenant.currency);
    }
    document.getElementById('login-screen').style.display = 'none';
    showDashboard();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
}

async function handleChangePassword(e) {
  e.preventDefault();
  const errorEl = document.getElementById('cp-error');
  const successEl = document.getElementById('cp-success');
  errorEl.style.display = 'none';
  successEl.style.display = 'none';

  const username = document.getElementById('cp-username').value.trim();
  const current = document.getElementById('cp-current').value;
  const newPwd = document.getElementById('cp-new').value;
  const confirm = document.getElementById('cp-confirm').value;

  if (newPwd !== confirm) {
    errorEl.textContent = 'Les nouveaux mots de passe ne correspondent pas';
    errorEl.style.display = 'block';
    return;
  }

  if (newPwd.length < 6) {
    errorEl.textContent = 'Le nouveau mot de passe doit contenir au moins 6 caractères';
    errorEl.style.display = 'block';
    return;
  }

  try {
    // Login d'abord pour obtenir un token
    const loginData = await api.login(username, current);
    api.setAuth(loginData.token, loginData.user, loginData.tenant);

    // Ensuite changer le mot de passe
    await api.changePassword(current, newPwd);

    successEl.textContent = 'Mot de passe modifié avec succès ! Vous pouvez vous connecter.';
    successEl.style.display = 'block';
    api.clearAuth();

    // Reset form
    document.getElementById('cp-current').value = '';
    document.getElementById('cp-new').value = '';
    document.getElementById('cp-confirm').value = '';

    // Revenir au login après 2s
    setTimeout(() => {
      document.getElementById('change-pwd-form').style.display = 'none';
      document.getElementById('login-form').style.display = 'block';
      successEl.style.display = 'none';
    }, 2500);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
}

function handleLogout() {
  api.clearAuth();
  // Clear all form fields to prevent credential leakage
  document.querySelectorAll('input[type="password"], input[type="text"]').forEach(el => { el.value = ''; });
  // Reset admin panel state
  const adminMain = document.getElementById('admin-main');
  const adminLogin = document.getElementById('admin-login-section');
  if (adminMain) adminMain.style.display = 'none';
  if (adminLogin) adminLogin.style.display = '';
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  if (refreshInterval) clearInterval(refreshInterval);
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ═══════════════════════════════════════════════════════════

function showDashboard() {
  document.getElementById('dashboard').style.display = 'flex';

  // Infos utilisateur dans sidebar
  const user = api.user;
  if (user) {
    document.getElementById('user-name').textContent = user.full_name;
    document.getElementById('user-role').textContent = user.role;
    document.getElementById('user-avatar').textContent =
      user.full_name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  // Date
  document.getElementById('current-date').textContent =
    new Date().toLocaleDateString(getDateLocale(), {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

  // Date par défaut pour les filtres
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('visit-date-filter').value = today;
  document.getElementById('report-date-from').value = today;
  document.getElementById('report-date-to').value = today;

  // Charger les données
  loadOverview();

  // Auto-refresh toutes les 30s
  refreshInterval = setInterval(loadOverview, 30000);

  // Badge points en attente
  updatePointsBadge();

  // Badge commandes en attente de validation
  updateOrderValidationBadge();

  // Show admin-only sections if user is admin
  if (user && user.role === 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
    checkPendingBadge();
    checkPaymentBadge();
    // Admin only sees admin sections — hide director/field sections
    if (!DEMO_MODE.active) {
      const directorSections = ['overview','map','leaderboard','delegues','prospects','visits','alerts','reports','trends','predictions','analytics','points','import','subscription','settings','order-validation','assignments','planning'];
      directorSections.forEach(s => {
        const nav = document.querySelector(`.nav-item[data-section="${s}"]`);
        if (nav) nav.style.display = 'none';
      });
      // Navigate to platform by default
      navigateTo('platform');
    }
  }

  // Directeur → force navigate to overview and hide admin sections
  if (user && user.role === 'directeur') {
    // Ensure admin sections stay hidden
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    checkSubscriptionBadge();
    // Navigate to overview by default
    navigateTo('overview');
  }

  // Plan-based feature gating for directors
  if (user && user.role === 'directeur' && api.tenant) {
    const features = api.tenant.features || {};
    // Starter plan: hide advanced analytics & predictions
    if (features.analytics === 'basic') {
      ['analytics', 'predictions'].forEach(s => {
        const nav = document.querySelector(`.nav-item[data-section="${s}"]`);
        if (nav) { nav.style.display = 'none'; }
      });
    }
    // Starter/Pro: hide predictions
    if (!features.predictions) {
      const navPred = document.querySelector('.nav-item[data-section="predictions"]');
      if (navPred) { navPred.style.display = 'none'; }
    }
  }

  // Check BI access for Enterprise users
  checkBIAccess();

  // Setup import forms
  setupImportForms();
  // Setup tenant creation form
  setupTenantForm();

  // Apply translations
  applyTranslations();

  // Re-translate on language change
  document.addEventListener('langChanged', () => {
    // Update date format
    document.getElementById('current-date').textContent =
      new Date().toLocaleDateString(getDateLocale(), {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    // Reload current active section
    const active = document.querySelector('.section.active');
    if (active) {
      const sectionId = active.id.replace('section-', '');
      navigateTo(sectionId);
    }
  });

  // Check for updates
  checkForUpdates();
}

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════

function navigateTo(section) {
  // Active sidebar
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-section="${section}"]`);
  if (navItem) navItem.classList.add('active');

  // Active section
  document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
  const sectionEl = document.getElementById(`section-${section}`);
  if (sectionEl) sectionEl.classList.add('active');
  if (!sectionEl) { console.warn('Section introuvable:', section); return; }

  // Charger le contenu de la section
  switch (section) {
    case 'overview': loadOverview(); break;
    case 'map': initMap(); break;
    case 'leaderboard': loadLeaderboard(); break;
    case 'delegues': loadDelegues(); break;
    case 'prospects': loadProspectsList(); break;
    case 'assignments': loadAssignmentsSection(); break;
    case 'planning': loadPlanningSection(); break;
    case 'formations': loadFormationsSection(); break;
    case 'visits': loadVisits(); break;
    case 'alerts': loadAlerts(); break;
    case 'trends': loadTrends(); break;
    case 'predictions': loadPredictions(); break;
    case 'analytics': loadBusinessAnalytics(); break;
    case 'points': loadPointsSection(); break;
    case 'order-validation': loadOrderValidation('en_attente'); break;
    case 'settings': loadSettings(); break;
    case 'tenants': loadTenants(); break;
    case 'subscriptions': loadSubscriptions(); break;
    case 'platform': loadPlatformStats(); break;
    case 'pending': loadPendingRegistrations(); break;
    case 'payments': loadPaymentsSection(); break;
    case 'licenses': loadLicensesSection(); break;
    case 'subscription': loadSubscriptionStatus(); break;
    case 'import': break; // Static content
    case 'demo-simulation': if (typeof lucide !== 'undefined') lucide.createIcons(); break;
    // app-agent section removed (redundant with pre-login simulation)
  }
}

// ═══════════════════════════════════════════════════════════
// VUE D'ENSEMBLE
// ═══════════════════════════════════════════════════════════

async function loadOverview() {
  try {
    const [statsR, leaderboardR, alertsR] = await Promise.allSettled([
      api.getStats(),
      api.getLeaderboard(),
      api.getAlerts(),
    ]);
    const stats = statsR.status === 'fulfilled' ? statsR.value : {};
    const leaderboard = leaderboardR.status === 'fulfilled' ? leaderboardR.value : { leaderboard: [] };
    const alerts = alertsR.status === 'fulfilled' ? alertsR.value : { alerts: [] };

    // Stats
    document.getElementById('stat-delegues').textContent = stats.total_delegues ?? 0;
    document.getElementById('stat-visits').textContent = stats.today_visits ?? 0;
    document.getElementById('stat-suspect').textContent = stats.today_suspect ?? 0;
    document.getElementById('stat-orders').textContent = stats.today_orders ?? 0;
    document.getElementById('stat-revenue').textContent =
      new Intl.NumberFormat('fr-FR').format(stats.today_revenue ?? 0) + ' ' + TENANT_CURRENCY_SYMBOL;
    document.getElementById('stat-online').textContent = stats.active_agents ?? 0;

    // Quick leaderboard
    renderQuickLeaderboard(leaderboard.leaderboard);

    // Alerts badge + list
    const critAlerts = alerts.alerts.filter(a => a.severity === 'critical');
    const badge = document.getElementById('alert-badge');
    if (critAlerts.length > 0) {
      badge.textContent = critAlerts.length;
      badge.style.display = 'inline';
    } else {
      badge.style.display = 'none';
    }

    renderRecentAlerts(alerts.alerts.slice(0, 5));

    // Load BI quick insights for Enterprise users
    loadBIOverviewWidget();
  } catch (err) {
    console.error('Erreur chargement overview:', err);
  }
}

function renderQuickLeaderboard(leaderboard) {
  const container = document.getElementById('quick-leaderboard');
  if (!leaderboard || leaderboard.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="trophy"></i></div><div class="empty-state-text">' + t('leaderboard.none') + '</div></div>';
    lucide.createIcons();
    return;
  }

  const medals = ['<i data-lucide="medal" style="width:20px;height:20px;color:#FFD700;display:inline-block;vertical-align:middle;"></i>', '<i data-lucide="medal" style="width:20px;height:20px;color:#C0C0C0;display:inline-block;vertical-align:middle;"></i>', '<i data-lucide="medal" style="width:20px;height:20px;color:#CD7F32;display:inline-block;vertical-align:middle;"></i>', '4', '5'];
  container.innerHTML = `
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th>${t('leaderboard.rank')}</th>
          <th>${t('leaderboard.agent')}</th>
          <th>${t('leaderboard.total_score')}</th>
          <th>${t('leaderboard.today_visits')}</th>
          <th>${t('leaderboard.today_score')}</th>
          <th>${t('leaderboard.combo')}</th>
        </tr>
      </thead>
      <tbody>
        ${leaderboard.slice(0, 5).map((d, i) => `
          <tr>
            <td class="rank-cell">${medals[i] || (i + 1)}</td>
            <td><strong>${escapeHtml(d.full_name)}</strong></td>
            <td class="score-cell">${d.total_score}</td>
            <td>${d.today_visits}</td>
            <td>${d.today_score >= 0 ? '+' : ''}${d.today_score}</td>
            <td>${d.combo_streak > 0 ? `<span class="combo-badge"><i data-lucide="flame" style="width:14px;height:14px;display:inline-block;vertical-align:middle;color:#F97316;"></i> ${d.combo_streak}</span>` : '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  lucide.createIcons();
}

function renderRecentAlerts(alerts) {
  const container = document.getElementById('recent-alerts');
  if (!alerts || alerts.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="check-circle"></i></div><div class="empty-state-text">' + t('alerts.none') + '</div></div>';
    lucide.createIcons();
    return;
  }

  container.innerHTML = alerts.map(a => `
    <div class="alert-item ${a.severity}">
      <div class="alert-icon"><i data-lucide="${a.severity === 'critical' ? 'alert-octagon' : 'alert-triangle'}" style="width:20px;height:20px;"></i></div>
      <div class="alert-body">
        <div class="alert-title">${escapeHtml(a.event_type.replace(/_/g, ' ').toUpperCase())}</div>
        <div class="alert-desc">${escapeHtml(a.description || '')} ${a.agent_name ? '— ' + escapeHtml(a.agent_name) : ''}</div>
      </div>
      <div class="alert-time">${formatTime(a.created_at)}</div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════════
// CARTE LIVE
// ═══════════════════════════════════════════════════════════

function initMap() {
  if (map) {
    refreshMap();
    return;
  }

  // Centré sur la Tunisie
  map = L.map('map-container').setView([36.80, 10.18], 7);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a> — Maydeni AI',
    maxZoom: 20,
    subdomains: 'abcd',
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);

  refreshMap();

  // Auto-refresh de la carte toutes les 30 secondes
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(refreshMap, 30000);
}

async function refreshMap() {
  if (!map) return;

  try {
    const [posR, heatR] = await Promise.allSettled([
      api.getGpsLive(),
      api.getHeatmap(),
    ]);
    const positions = posR.status === 'fulfilled' ? posR.value : { positions: [] };
    const heatmapData = heatR.status === 'fulfilled' ? heatR.value : { heatmap: [] };

    // Clear existing markers
    markersLayer.clearLayers();

    // Positions live des agents terrain
    if (positions.positions) {
      positions.positions.forEach(pos => {
        // Marqueur circulaire
        const marker = L.circleMarker([pos.latitude, pos.longitude], {
          radius: 10,
          color: '#0D6B6E',
          fillColor: '#1B9EA1',
          fillOpacity: 0.8,
          weight: 2,
        }).addTo(markersLayer);

        // Popup au clic
        marker.bindPopup(`
          <strong>${escapeHtml(pos.full_name)}</strong><br>
          <small>${t('map.last_position')}: ${formatTime(pos.recorded_at)}</small><br>
          <small>${t('map.accuracy')}: ${pos.accuracy ? pos.accuracy.toFixed(0) + 'm' : 'N/A'}</small>
        `);

        // Label permanent avec le nom de l'Agent
        marker.bindTooltip(escapeHtml(pos.full_name), {
          permanent: true,
          direction: 'top',
          offset: [0, -12],
          className: 'agent-label',
        });
      });

      // Fit bounds si des positions existent
      if (positions.positions.length > 0) {
        const bounds = positions.positions.map(p => [p.latitude, p.longitude]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }

    // Heatmap
    if (heatmapData.points && heatmapData.points.length > 0 && showHeatmap) {
      if (heatLayer) map.removeLayer(heatLayer);
      const heatPoints = heatmapData.points.map(p => [
        parseFloat(p.lat), parseFloat(p.lng), parseInt(p.intensity)
      ]);
      heatLayer = L.heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 16,
        gradient: { 0.2: '#1B9EA1', 0.4: '#10B981', 0.6: '#FFD700', 0.8: '#FF6B35', 1: '#EF4444' },
      }).addTo(map);
    }
  } catch (err) {
    console.error('Erreur carte:', err);
  }
}

function toggleHeatmap() {
  showHeatmap = !showHeatmap;
  const btn = document.getElementById('toggle-heatmap');
  btn.innerHTML = showHeatmap ? '<i data-lucide="flame" style="width:14px;height:14px;display:inline-block;vertical-align:middle;"></i> Masquer Heatmap' : '<i data-lucide="flame" style="width:14px;height:14px;display:inline-block;vertical-align:middle;"></i> Heatmap';
  lucide.createIcons();

  if (!showHeatmap && heatLayer) {
    map.removeLayer(heatLayer);
    heatLayer = null;
  } else {
    refreshMap();
  }
}

// ═══════════════════════════════════════════════════════════
// CLASSEMENT / GAMIFICATION
// ═══════════════════════════════════════════════════════════

async function loadLeaderboard() {
  try {
    const data = await api.getLeaderboard();
    const lb = data.leaderboard;
    const container = document.getElementById('leaderboard-content');

    if (!lb || lb.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="trophy"></i></div><div class="empty-state-text">' + t('leaderboard.none') + '</div></div>';
      lucide.createIcons();
      return;
    }

    // Podium (top 3)
    const podiumHtml = lb.length >= 3 ? `
      <div class="leaderboard-podium">
        <div class="podium-item silver">
          <div class="podium-rank"><i data-lucide="medal" style="width:28px;height:28px;color:#C0C0C0;"></i></div>
          <div class="podium-name">${escapeHtml(lb[1].full_name)}</div>
          <div class="podium-score">${lb[1].total_score}</div>
          <div class="podium-points" style="${lb[1].total_points < 0 ? 'color:#EF4444;font-weight:700;' : ''}">${lb[1].total_points} pts</div>
        </div>
        <div class="podium-item gold" style="transform:scale(1.1);">
          <div class="podium-rank"><i data-lucide="medal" style="width:32px;height:32px;color:#FFD700;"></i></div>
          <div class="podium-name">${escapeHtml(lb[0].full_name)}</div>
          <div class="podium-score">${lb[0].total_score}</div>
          <div class="podium-points" style="${lb[0].total_points < 0 ? 'color:#EF4444;font-weight:700;' : ''}">${lb[0].total_points} pts</div>
        </div>
        <div class="podium-item bronze">
          <div class="podium-rank"><i data-lucide="medal" style="width:28px;height:28px;color:#CD7F32;"></i></div>
          <div class="podium-name">${escapeHtml(lb[2].full_name)}</div>
          <div class="podium-score">${lb[2].total_score}</div>
          <div class="podium-points" style="${lb[2].total_points < 0 ? 'color:#EF4444;font-weight:700;' : ''}">${lb[2].total_points} pts</div>
        </div>
      </div>
    ` : '';

    // Table complète
    container.innerHTML = `
      ${podiumHtml}
      <div class="card">
        <div class="card-header"><h3>${t('section.leaderboard')}</h3></div>
        <div class="card-body" style="padding:0;">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th>${t('leaderboard.rank')}</th>
                <th>${t('leaderboard.agent')}</th>
                <th>Score</th>
                <th>Points</th>
                <th>${t('leaderboard.today_visits')}</th>
                <th>${t('leaderboard.today_score')}</th>
                <th>${t('leaderboard.combo')}</th>
              </tr>
            </thead>
            <tbody>
              ${lb.map((d, i) => `
                <tr>
                  <td class="rank-cell">${i + 1}</td>
                  <td><strong>${escapeHtml(d.full_name)}</strong></td>
                  <td class="score-cell">${d.total_score}</td>
                  <td class="points-cell" style="${d.total_points < 0 ? 'color:#EF4444;font-weight:700;' : ''}">${d.total_points} pts${d.total_points < 0 ? ' ⚠️' : ''}</td>
                  <td>${d.today_visits}</td>
                  <td>${d.today_score >= 0 ? '+' : ''}${d.today_score}</td>
                  <td>${d.combo_streak > 0 ? `<span class="combo-badge"><i data-lucide="flame" style="width:14px;height:14px;display:inline-block;vertical-align:middle;color:#F97316;"></i> ${d.combo_streak}</span>` : '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Afficher les déductions salariales si des agents ont des points négatifs
    const negativeAgents = lb.filter(d => d.total_points < 0);
    if (negativeAgents.length > 0) {
      const configR = await api.getPointsConfig().catch(() => ({ config: { points_per_dt: 100 } }));
      const rate = configR.config ? parseFloat(configR.config.points_per_dt) : 100;
      container.innerHTML += `
        <div class="card" style="margin-top:16px;border-left:4px solid #EF4444;">
          <div class="card-header"><h3 style="color:#EF4444;">⚠️ Déductions salariales</h3></div>
          <div class="card-body" style="padding:0;">
            <p style="padding:12px 16px;font-size:13px;color:#64748B;margin:0;">Les agents en points négatifs auront l'équivalent déduit de leur salaire (taux: ${rate} pts = 1 ${TENANT_CURRENCY_SYMBOL})</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead><tr style="background:#FEF2F2;"><th style="padding:10px;text-align:left;">Agent</th><th style="padding:10px;text-align:right;">Points</th><th style="padding:10px;text-align:right;color:#EF4444;font-weight:700;">Déduction salaire</th></tr></thead>
              <tbody>
                ${negativeAgents.map(d => {
                  const deduction = rate > 0 ? (Math.abs(d.total_points) / rate).toFixed(2) : 0;
                  return `<tr style="border-bottom:1px solid #FEE2E2;"><td style="padding:10px;"><strong>${escapeHtml(d.full_name)}</strong></td><td style="padding:10px;text-align:right;color:#EF4444;font-weight:700;">${d.total_points} pts</td><td style="padding:10px;text-align:right;color:#EF4444;font-weight:700;font-size:16px;">-${deduction} ${TENANT_CURRENCY_SYMBOL}</td></tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    lucide.createIcons();
  } catch (err) {
    console.error('Erreur classement:', err);
  }
}

// ═══════════════════════════════════════════════════════════
// AGENTS TERRAIN
// ═══════════════════════════════════════════════════════════

async function loadDelegues() {
  try {
    const data = await api.getUsers();
    const container = document.getElementById('delegues-list');

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Identifiant</th>
            <th>Nom</th>
            <th>Rôle</th>
            <th>Téléphone</th>
            <th>Score</th>
            <th>Points</th>
            <th>Statut</th>
            <th>Dernière connexion</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${data.users.map(u => `
            <tr>
              <td><code>${escapeHtml(u.username)}</code></td>
              <td><strong>${escapeHtml(u.full_name)}</strong></td>
              <td><span class="badge badge-info">${u.role}</span></td>
              <td>${u.phone || '—'}</td>
              <td class="score-cell">${u.total_score}</td>
              <td class="points-cell">${u.total_points} pts</td>
              <td>${u.is_active
                ? '<span class="badge badge-success">Actif</span>'
                : '<span class="badge badge-danger">Inactif</span>'}</td>
              <td>${u.last_login ? formatTime(u.last_login) : 'Jamais'}</td>
              <td>
                ${u.role === 'delegue' && u.is_active
                  ? `<button class="btn btn-sm btn-danger" onclick="confirmDeleteUser('${u.id}', '${escapeHtml(u.full_name)}')">Désactiver</button>`
                  : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error('Erreur agents terrain:', err);
  }
}

function showCreateUserModal() {
  // Force-clear all fields to prevent browser autofill
  ['cu-fullname','cu-username','cu-email','cu-password','cu-phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('cu-role').value = 'delegue';
  const err = document.getElementById('cu-error');
  if (err) err.style.display = 'none';
  document.getElementById('modal-create-user').style.display = 'flex';
  // Delayed clear — some browsers autofill after display
  setTimeout(() => {
    ['cu-username','cu-password'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value && el !== document.activeElement) el.value = '';
    });
  }, 50);
}

function openCreateTenantModal() {
  ['ct-name','ct-industry','ct-city','ct-phone','ct-email','ct-dir-name','ct-dir-username','ct-dir-password','ct-dir-email'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const err = document.getElementById('ct-error');
  if (err) err.style.display = 'none';
  document.getElementById('modal-create-tenant').style.display = 'flex';
  setTimeout(() => {
    ['ct-dir-username','ct-dir-password'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value && el !== document.activeElement) el.value = '';
    });
  }, 50);
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

async function handleCreateUser(e) {
  e.preventDefault();
  const errorEl = document.getElementById('cu-error');
  errorEl.style.display = 'none';

  const data = {
    full_name: document.getElementById('cu-fullname').value.trim(),
    username: document.getElementById('cu-username').value.trim(),
    email: document.getElementById('cu-email').value.trim() || undefined,
    password: document.getElementById('cu-password').value,
    role: document.getElementById('cu-role').value,
    phone: document.getElementById('cu-phone').value.trim() || undefined,
  };

  try {
    await api.createUser(data);
    closeModal('modal-create-user');
    document.getElementById('create-user-form').reset();
    loadDelegues();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
}

async function confirmDeleteUser(id, name) {
  if (confirm(`Désactiver l'Agent ${name} ?`)) {
    try {
      await api.deleteUser(id);
      loadDelegues();
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// PROSPECTS
// ═══════════════════════════════════════════════════════════

async function loadProspectsList() {
  const container = document.getElementById('prospects-list');
  try {
    const search = document.getElementById('prospect-search-filter')?.value || '';
    const city = document.getElementById('prospect-city-filter')?.value || '';
    const params = { limit: 100 };
    if (search) params.search = search;
    if (city) params.city = city;

    const data = await api.getProspects(params);

    // Populate city filter if empty
    const citySelect = document.getElementById('prospect-city-filter');
    if (citySelect && citySelect.options.length <= 1) {
      try {
        const cities = await api.getProspectCities();
        (cities.cities || []).forEach(c => {
          const opt = document.createElement('option');
          opt.value = c; opt.textContent = c;
          citySelect.appendChild(opt);
        });
      } catch (_) {}
    }

    if (!data.prospects || data.prospects.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="building-2"></i></div><div class="empty-state-text">' + t('prospects.none') + '</div></div>';
      lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div style="margin-bottom:8px;color:var(--muted);font-size:0.9em;">${data.total || data.prospects.length} prospects</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Ville</th>
            <th>Type</th>
            <th>Visites</th>
            <th>Temps total</th>
            <th>Dernière visite</th>
            <th>Calibré</th>
          </tr>
        </thead>
        <tbody>
          ${data.prospects.map(p => {
            const dur = parseFloat(p.total_duration_minutes) || 0;
            const durStr = dur >= 60 ? Math.floor(dur / 60) + 'h ' + Math.round(dur % 60) + 'min' : Math.round(dur) + ' min';
            return `
            <tr>
              <td><strong>${escapeHtml(p.name)}</strong>${p.specialty ? '<br><small style="color:var(--muted);">' + escapeHtml(p.specialty) + '</small>' : ''}</td>
              <td>${escapeHtml(p.city || '—')}</td>
              <td><span class="badge badge-info">${escapeHtml(p.type || p.type_name || 'autre')}</span></td>
              <td>${p.visit_count || 0}</td>
              <td style="font-weight:600;${dur > 0 ? 'color:var(--primary);' : ''}">${dur > 0 ? durStr : '—'}</td>
              <td>${p.last_visit ? formatTime(p.last_visit) : '—'}</td>
              <td>${p.is_calibrated ? '<span class="badge badge-success">✓</span>' : '<span class="badge badge-warning">Non</span>'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;
    lucide.createIcons();
  } catch (err) {
    console.error('Erreur prospects:', err);
    container.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

// Set up prospect filters (live search/city)
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('prospect-search-filter');
  const citySelect = document.getElementById('prospect-city-filter');
  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => loadProspectsList(), 400);
    });
  }
  if (citySelect) {
    citySelect.addEventListener('change', () => loadProspectsList());
  }
});

// ═══════════════════════════════════════════════════════════
// AFFECTATIONS PROSPECTS
// ═══════════════════════════════════════════════════════════

async function loadAssignmentsSection() {
  try {
    const [summaryResult, usersResult, prospectsResult] = await Promise.allSettled([
      api.getAssignmentsSummary(),
      api.getUsers(),
      api.getProspects({ limit: 500 })
    ]);

    const summaryData = summaryResult.status === 'fulfilled' ? summaryResult.value : { summary: [] };
    const usersData = usersResult.status === 'fulfilled' ? usersResult.value : { users: [] };
    const prospectsData = prospectsResult.status === 'fulfilled' ? prospectsResult.value : { prospects: [] };

    const delegues = (usersData.users || []).filter(u => u.role === 'delegue' && u.is_active);
    const prospects = prospectsData.prospects || [];

    // Remplir le sélecteur d'agent
    const select = document.getElementById('assign-agent-select');
    const currentVal = select.value;
    select.innerHTML = '<option value="">' + t('agents.select') + '</option>';
    delegues.forEach(d => {
      select.innerHTML += `<option value="${d.id}">${escapeHtml(d.full_name)}</option>`;
    });
    if (currentVal) select.value = currentVal;

    // Résumé par agent
    const summary = summaryData.summary || [];
    const totalProspects = prospects.length;
    const assignedProspects = new Set();

    let summaryHtml = '<div class="stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr));margin-bottom:24px;">';

    summary.forEach(s => {
      const names = (s.prospect_names || []).filter(Boolean);
      names.forEach(n => assignedProspects.add(n));
      const pCount = parseInt(s.prospect_count) || 0;
      summaryHtml += `
        <div class="card" style="cursor:pointer;transition:all .2s;" onclick="document.getElementById('assign-agent-select').value='${s.id}';loadAgentAssignments();">
          <div class="card-body" style="padding:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <strong style="font-size:15px;">${escapeHtml(s.full_name)}</strong>
              <span style="background:${pCount > 0 ? 'var(--primary)' : 'var(--muted)'};color:#FFF;padding:2px 10px;border-radius:20px;font-size:13px;font-weight:700;">${pCount}</span>
            </div>
            ${pCount > 0
              ? `<div style="font-size:12px;color:var(--muted);line-height:1.5;">${names.slice(0, 5).map(n => escapeHtml(n)).join(', ')}${names.length > 5 ? ` <em>+${names.length - 5} autres</em>` : ''}</div>`
              : '<div style="font-size:12px;color:var(--danger);">⚠️ Aucun prospect affecté</div>'}
          </div>
        </div>`;
    });

    const unassigned = totalProspects - assignedProspects.size;
    summaryHtml += `
      <div class="card" style="border:2px dashed ${unassigned > 0 ? 'var(--warning)' : 'var(--success)'};">
        <div class="card-body" style="padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:800;color:${unassigned > 0 ? 'var(--warning)' : 'var(--success)'};">${unassigned}</div>
          <div style="font-size:12px;color:var(--muted);">Prospects non affectés</div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px;">sur ${totalProspects} total</div>
        </div>
      </div>`;

    summaryHtml += '</div>';
    document.getElementById('assignments-summary').innerHTML = summaryHtml;

    // Stocker les données pour l'affectation
    window._assignProspects = prospects;
    window._assignDelegues = delegues;

    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) {
    console.error('Erreur chargement affectations:', err);
  }
}

async function loadAgentAssignments() {
  const agentId = document.getElementById('assign-agent-select').value;
  const container = document.getElementById('assignments-prospect-list');
  const saveBtn = document.getElementById('btn-save-assignments');

  if (!agentId) {
    container.innerHTML = '';
    saveBtn.style.display = 'none';
    return;
  }

  try {
    const data = await api.getAssignments({ user_id: agentId });
    const assignedIds = new Set((data.assignments || []).map(a => a.prospect_id));
    const prospects = window._assignProspects || [];

    saveBtn.style.display = '';

    // Grouper par ville
    const byCity = {};
    prospects.forEach(p => {
      const city = p.city || 'Sans ville';
      if (!byCity[city]) byCity[city] = [];
      byCity[city].push(p);
    });

    let html = `<div style="margin-bottom:12px;display:flex;gap:12px;align-items:center;">
      <span style="color:var(--muted);font-size:13px;">${assignedIds.size} prospect(s) affecté(s) sur ${prospects.length}</span>
      <button class="btn btn-sm btn-outline" onclick="toggleAllAssignments(true)">Tout cocher</button>
      <button class="btn btn-sm btn-outline" onclick="toggleAllAssignments(false)">Tout décocher</button>
    </div>`;

    for (const [city, cityProspects] of Object.entries(byCity).sort()) {
      const cityAssigned = cityProspects.filter(p => assignedIds.has(p.id)).length;
      html += `<div style="margin-bottom:16px;">
        <h4 style="font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--border);">
          📍 ${escapeHtml(city)} <span style="font-weight:400;">(${cityAssigned}/${cityProspects.length})</span>
        </h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:6px;">`;

      cityProspects.forEach(p => {
        const checked = assignedIds.has(p.id) ? 'checked' : '';
        html += `
          <label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;cursor:pointer;background:${checked ? 'rgba(13,107,110,.08)' : 'var(--bg)'};border:1px solid ${checked ? 'var(--primary)' : 'var(--border)'};transition:all .15s;">
            <input type="checkbox" class="assign-checkbox" value="${p.id}" ${checked} style="width:16px;height:16px;">
            <div>
              <div style="font-weight:600;font-size:13px;">${escapeHtml(p.name)}</div>
              ${p.specialty ? `<div style="font-size:11px;color:var(--muted);">${escapeHtml(p.specialty)}</div>` : ''}
            </div>
          </label>`;
      });

      html += '</div></div>';
    }

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<p style="color:var(--danger);">Erreur: ${escapeHtml(err.message)}</p>`;
  }
}

function toggleAllAssignments(state) {
  document.querySelectorAll('.assign-checkbox').forEach(cb => cb.checked = state);
}

async function saveAssignments() {
  const agentId = document.getElementById('assign-agent-select').value;
  if (!agentId) return;

  const prospectIds = [];
  document.querySelectorAll('.assign-checkbox:checked').forEach(cb => {
    prospectIds.push(cb.value);
  });

  if (!confirm(`Affecter ${prospectIds.length} prospect(s) à cet agent ?`)) return;

  try {
    await api.replaceAssignments(agentId, prospectIds);
    alert(`${prospectIds.length} prospect(s) affecté(s) avec succès !`);
    loadAssignmentsSection();
  } catch (err) {
    alert('Erreur: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════
// PLANNING VISITES
// ═══════════════════════════════════════════════════════════

async function loadPlanningSection() {
  try {
    // Remplir le filtre agents si vide
    const agentFilter = document.getElementById('planning-agent-filter');
    if (agentFilter && agentFilter.options.length <= 1) {
      const usersData = await api.getUsers();
      const delegues = (usersData.users || []).filter(u => u.role === 'delegue' && u.is_active);
      delegues.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.full_name;
        agentFilter.appendChild(opt);
      });
    }

    // Dates par défaut : cette semaine
    const dateFrom = document.getElementById('planning-date-from');
    const dateTo = document.getElementById('planning-date-to');
    if (dateFrom && !dateFrom.value) {
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      dateFrom.value = monday.toISOString().split('T')[0];
    }
    if (dateTo && !dateTo.value) {
      const sunday = new Date();
      sunday.setDate(sunday.getDate() - sunday.getDay() + 7);
      dateTo.value = sunday.toISOString().split('T')[0];
    }

    // Construire les paramètres
    const params = {};
    if (agentFilter.value) params.user_id = agentFilter.value;
    if (dateFrom.value) params.date_from = dateFrom.value;
    if (dateTo.value) params.date_to = dateTo.value;
    const statusFilter = document.getElementById('planning-status-filter');
    if (statusFilter && statusFilter.value) params.status = statusFilter.value;

    const [planR, statsR2] = await Promise.allSettled([
      api.getPlanning(params),
      api.getPlanningStats({ date_from: dateFrom.value, date_to: dateTo.value })
    ]);
    const planData = planR.status === 'fulfilled' ? planR.value : { items: [] };
    const statsData = statsR2.status === 'fulfilled' ? statsR2.value : { stats: [] };

    // Stats
    const stats = statsData.stats || [];
    let totalPlanned = 0, totalDone = 0, totalMissed = 0;
    stats.forEach(s => {
      totalPlanned += parseInt(s.planned) || 0;
      totalDone += parseInt(s.completed) || 0;
      totalMissed += parseInt(s.missed) || 0;
    });
    const complianceRate = (totalPlanned + totalDone + totalMissed) > 0
      ? Math.round(totalDone / (totalPlanned + totalDone + totalMissed) * 100) : 0;

    document.getElementById('planning-stats').innerHTML = `
      <div class="stat-card stat-blue"><div class="stat-value">${totalPlanned}</div><div class="stat-label">Planifiées</div></div>
      <div class="stat-card stat-green"><div class="stat-value">${totalDone}</div><div class="stat-label">Effectuées</div></div>
      <div class="stat-card stat-red"><div class="stat-value">${totalMissed}</div><div class="stat-label">Manquées</div></div>
      <div class="stat-card" style="background:linear-gradient(135deg,${complianceRate >= 70 ? '#10B981' : complianceRate >= 40 ? '#F59E0B' : '#EF4444'},${complianceRate >= 70 ? '#059669' : complianceRate >= 40 ? '#D97706' : '#DC2626'});color:#FFF;">
        <div class="stat-value">${complianceRate}%</div><div class="stat-label" style="color:rgba(255,255,255,.8);">Taux respect planning</div>
      </div>
    `;

    // Tableau
    renderPlanningTable(planData.plans || []);
  } catch (err) {
    console.error('Erreur chargement planning:', err);
    document.getElementById('planning-content').innerHTML = `<p style="color:var(--danger);">${escapeHtml(err.message)}</p>`;
  }
}

function renderPlanningTable(plans) {
  const container = document.getElementById('planning-content');

  if (!plans.length) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--muted);">
        <i data-lucide="calendar-x" style="width:48px;height:48px;margin-bottom:12px;"></i>
        <p>Aucune visite planifiée sur cette période</p>
      </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  // Grouper par date
  const byDate = {};
  plans.forEach(p => {
    if (!byDate[p.planned_date]) byDate[p.planned_date] = [];
    byDate[p.planned_date].push(p);
  });

  let html = '';
  for (const [date, dayPlans] of Object.entries(byDate).sort()) {
    const d = new Date(date + 'T00:00:00');
    const dayName = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const isToday = date === new Date().toISOString().split('T')[0];

    html += `<div style="margin-bottom:20px;">
      <h3 style="font-size:14px;text-transform:capitalize;margin-bottom:10px;padding:8px 12px;background:${isToday ? 'linear-gradient(135deg,var(--primary),#1B9EA1)' : 'var(--bg)'};color:${isToday ? '#FFF' : 'var(--text)'};border-radius:8px;">
        ${isToday ? '📅 Aujourd\'hui — ' : ''}${dayName}
        <span style="font-weight:400;opacity:.7;">(${dayPlans.length} visite${dayPlans.length > 1 ? 's' : ''})</span>
      </h3>`;

    dayPlans.forEach(p => {
      const statusClass = p.status === 'planifiee' ? 'badge-warning'
        : p.status === 'effectuee' ? 'badge-success' : 'badge-danger';
      const statusLabel = p.status === 'planifiee' ? '📋 Planifiée'
        : p.status === 'effectuee' ? '✅ Effectuée' : '❌ Manquée';

      html += `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;background:var(--card);">
        <div style="min-width:50px;text-align:center;font-weight:700;color:var(--primary);">${p.planned_time || '—'}</div>
        <div style="flex:1;">
          <strong>${escapeHtml(p.prospect_name)}</strong>
          <span style="color:var(--muted);font-size:12px;"> · ${escapeHtml(p.prospect_city || '')}</span>
          <div style="font-size:12px;color:var(--muted);">Agent: ${escapeHtml(p.agent_name)}</div>
          ${p.notes ? `<div style="font-size:12px;color:var(--muted);font-style:italic;">${escapeHtml(p.notes)}</div>` : ''}
        </div>
        <span class="badge ${statusClass}">${statusLabel}</span>
        ${p.status === 'planifiee' ? `
          <button class="btn btn-sm btn-outline" onclick="markPlanStatus('${p.id}','manquee')" title="Marquer manquée" style="color:var(--danger);">✗</button>
        ` : ''}
        <button class="btn btn-sm btn-outline" onclick="deletePlanItem('${p.id}')" title="Supprimer" style="color:var(--danger);font-size:16px;">🗑</button>
      </div>`;
    });

    html += '</div>';
  }

  container.innerHTML = html;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function showPlanningModal() {
  document.getElementById('modal-planning').style.display = 'flex';
  const agentSelect = document.getElementById('plan-agent');
  if (agentSelect.options.length <= 1) {
    const delegues = window._assignDelegues || [];
    // If not loaded yet, fetch
    if (delegues.length === 0) {
      api.getUsers().then(data => {
        const users = (data.users || []).filter(u => u.role === 'delegue' && u.is_active);
        users.forEach(d => {
          const opt = document.createElement('option');
          opt.value = d.id;
          opt.textContent = d.full_name;
          agentSelect.appendChild(opt);
        });
      });
    } else {
      delegues.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.full_name;
        agentSelect.appendChild(opt);
      });
    }
  }

  // Date par défaut: demain
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('plan-date').value = tomorrow.toISOString().split('T')[0];

  document.getElementById('plan-prospects-list').innerHTML = '<p style="color:var(--muted);font-size:13px;">Sélectionnez un agent pour voir ses prospects affectés</p>';
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function loadAgentProspectsForPlanning() {
  const agentId = document.getElementById('plan-agent').value;
  const container = document.getElementById('plan-prospects-list');

  if (!agentId) {
    container.innerHTML = '<p style="color:var(--muted);font-size:13px;">Sélectionnez un agent</p>';
    return;
  }

  try {
    const data = await api.getAssignments({ user_id: agentId });
    const assignments = data.assignments || [];

    if (assignments.length === 0) {
      container.innerHTML = '<p style="color:var(--danger);font-size:13px;">⚠️ ' + t('prospects.select_agent_first') + '</p>';
      return;
    }

    container.innerHTML = assignments.map(a => `
      <label style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;cursor:pointer;margin-bottom:2px;">
        <input type="checkbox" class="plan-prospect-cb" value="${a.prospect_id}" checked style="width:16px;height:16px;">
        <div>
          <span style="font-weight:600;font-size:13px;">${escapeHtml(a.prospect_name)}</span>
          <span style="font-size:11px;color:var(--muted);"> · ${escapeHtml(a.prospect_city || '')}</span>
        </div>
      </label>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p style="color:var(--danger);">${escapeHtml(err.message)}</p>`;
  }
}

async function handleCreatePlanning(e) {
  e.preventDefault();
  const agentId = document.getElementById('plan-agent').value;
  const date = document.getElementById('plan-date').value;

  if (!agentId || !date) {
    alert(t('visits.select_both'));
    return;
  }

  const plans = [];
  document.querySelectorAll('.plan-prospect-cb:checked').forEach(cb => {
    plans.push({
      user_id: agentId,
      prospect_id: cb.value,
      planned_date: date,
    });
  });

  if (plans.length === 0) {
    alert(t('visits.select_prospects'));
    return;
  }

  try {
    await api.createPlanning(plans);
    alert(`${plans.length} visite(s) planifiée(s) !`);
    closeModal('modal-planning');
    loadPlanningSection();
  } catch (err) {
    alert('Erreur: ' + err.message);
  }
}

async function markPlanStatus(id, status) {
  const label = status === 'manquee' ? 'manquée' : 'effectuée';
  if (!confirm(`Marquer cette visite comme ${label} ?`)) return;
  try {
    await api.updatePlan(id, { status });
    loadPlanningSection();
  } catch (err) {
    alert('Erreur: ' + err.message);
  }
}

async function deletePlanItem(id) {
  if (!confirm(t('visits.delete_confirm'))) return;
  try {
    await api.deletePlan(id);
    loadPlanningSection();
  } catch (err) {
    alert('Erreur: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════
// VISITES
// ═══════════════════════════════════════════════════════════

async function loadVisits() {
  try {
    const date = document.getElementById('visit-date-filter').value;
    const suspect = document.getElementById('visit-suspect-filter').checked;

    const params = {};
    if (date) params.date = date;
    if (suspect) params.suspect = 'true';

    const data = await api.getAllVisits(params);
    const container = document.getElementById('visits-list');

    if (!data.visits || data.visits.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="map-pin"></i></div><div class="empty-state-text">' + t('visits.none') + '</div></div>';
      lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Agent</th>
            <th>Prospect</th>
            <th>Ville</th>
            <th>Type</th>
            <th>Début</th>
            <th>Durée</th>
            <th>Score</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${data.visits.map(v => {
            const suspectReasons = v.suspect_reasons && v.suspect_reasons.length > 0
              ? v.suspect_reasons.map(r => escapeHtml(r)).join('<br>')
              : '';
            return `
            <tr style="${v.is_suspect ? 'background:#FEF2F2;' : ''}">
              <td><strong>${escapeHtml(v.agent_name)}</strong></td>
              <td>${escapeHtml(v.prospect_name)}</td>
              <td>${escapeHtml(v.prospect_city || '')}</td>
              <td><span class="badge badge-info">${v.prospect_type}</span></td>
              <td>${formatTime(v.start_time)}</td>
              <td>${v.duration_seconds ? formatDuration(v.duration_seconds) : '<i data-lucide="clock" style="width:12px;height:12px;display:inline-block;vertical-align:middle;"></i> En cours'}</td>
              <td class="${v.score_awarded >= 0 ? 'score-cell' : ''}" style="${v.score_awarded < 0 ? 'color:var(--danger);font-weight:700;' : ''}">
                ${v.score_awarded >= 0 ? '+' : ''}${v.score_awarded}
              </td>
              <td>
                ${v.is_suspect
                  ? '<span class="badge badge-danger"><i data-lucide="alert-triangle" style="width:12px;height:12px;display:inline-block;vertical-align:middle;"></i> Suspecte</span>'
                  : v.status === 'terminee'
                    ? '<span class="badge badge-success"><i data-lucide="check-circle" style="width:12px;height:12px;display:inline-block;vertical-align:middle;"></i> Terminée</span>'
                    : '<span class="badge badge-warning"><i data-lucide="clock" style="width:12px;height:12px;display:inline-block;vertical-align:middle;"></i> En cours</span>'}
                ${v.photo_proof_url ? ' <i data-lucide="camera" style="width:14px;height:14px;display:inline-block;vertical-align:middle;"></i>' : ''}
              </td>
            </tr>
            ${v.is_suspect && suspectReasons ? `<tr style="background:#FEF2F2;"><td colspan="8" style="padding:4px 16px 8px 16px;font-size:0.85em;"><i data-lucide="info" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;color:var(--danger);"></i><strong style="color:var(--danger);">Raisons :</strong> <span style="color:#991B1B;">${suspectReasons}</span></td></tr>` : ''}
          `}).join('')}
        </tbody>
      </table>
    `;
    lucide.createIcons();
  } catch (err) {
    console.error('Erreur visites:', err);
  }
}

// ═══════════════════════════════════════════════════════════
// ALERTES
// ═══════════════════════════════════════════════════════════

async function loadAlerts() {
  try {
    const data = await api.getAlerts();
    const container = document.getElementById('alerts-list');

    if (!data.alerts || data.alerts.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="shield-check"></i></div><div class="empty-state-text">' + t('alerts.no_security') + '</div></div>';
      lucide.createIcons();
      return;
    }

    container.innerHTML = data.alerts.map(a => `
      <div class="alert-item ${a.severity}">
        <div class="alert-icon"><i data-lucide="${a.severity === 'critical' ? 'alert-octagon' : 'alert-triangle'}" style="width:20px;height:20px;"></i></div>
        <div class="alert-body">
          <div class="alert-title">${escapeHtml(a.event_type.replace(/_/g, ' ').toUpperCase())}</div>
          <div class="alert-desc">
            ${escapeHtml(a.description || '')}
            ${a.agent_name ? '<br><strong>Agent:</strong> ' + escapeHtml(a.agent_name) : ''}
          </div>
        </div>
        <div class="alert-time">${formatTime(a.created_at)}</div>
      </div>
    `).join('');
    lucide.createIcons();
  } catch (err) {
    console.error('Erreur alertes:', err);
  }
}

// ═══════════════════════════════════════════════════════════
// RAPPORTS
// ═══════════════════════════════════════════════════════════

async function generateReport() {
  const dateFrom = document.getElementById('report-date-from').value;
  const dateTo = document.getElementById('report-date-to').value;
  const format = document.getElementById('report-format').value;
  const container = document.getElementById('report-result');

  if (!dateFrom || !dateTo) {
    container.innerHTML = '<div class="error-msg">Veuillez remplir les dates</div>';
    return;
  }

  try {
    const data = await api.generateReport(dateFrom, dateTo, format);

    if (data.downloaded) {
      container.innerHTML = '<div class="success-msg"><i data-lucide="check-circle" style="width:16px;height:16px;display:inline-block;vertical-align:middle;color:#10B981;"></i> Fichier téléchargé avec succès</div>';
      lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div class="report-summary">
        <div class="report-stat">
          <div class="report-stat-value">${data.summary.total_visits}</div>
          <div class="report-stat-label">Visites totales</div>
        </div>
        <div class="report-stat">
          <div class="report-stat-value" style="color:var(--danger)">${data.summary.suspect_visits}</div>
          <div class="report-stat-label">Visites suspectes</div>
        </div>
        <div class="report-stat">
          <div class="report-stat-value">${data.summary.total_orders}</div>
          <div class="report-stat-label">Commandes</div>
        </div>
        <div class="report-stat">
          <div class="report-stat-value">${new Intl.NumberFormat('fr-FR').format(data.summary.total_revenue)} ${TENANT_CURRENCY_SYMBOL}</div>
          <div class="report-stat-label">Chiffre d'affaires</div>
        </div>
        <div class="report-stat">
          <div class="report-stat-value" style="color:var(--warning)">${data.summary.total_anomalies}</div>
          <div class="report-stat-label">Anomalies</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>Performance par agent terrain</h3></div>
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Visites</th>
                <th>Suspectes</th>
                <th>Score</th>
                <th>Durée moy.</th>
                <th>Prospects uniques</th>
              </tr>
            </thead>
            <tbody>
              ${(data.agent_stats || []).map(d => `
                <tr>
                  <td><strong>${escapeHtml(d.full_name)}</strong></td>
                  <td>${d.total_visits}</td>
                  <td style="${parseInt(d.suspect_visits) > 0 ? 'color:var(--danger);font-weight:700;' : ''}">${d.suspect_visits}</td>
                  <td class="score-cell">${d.total_score}</td>
                  <td>${formatDuration(Math.round(parseFloat(d.avg_duration)))}</td>
                  <td>${d.unique_prospects}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="error-msg">Erreur: ${escapeHtml(err.message)}</div>`;
  }
}

// ═══════════════════════════════════════════════════════════
// PARAMÈTRES GEOFENCING
// ═══════════════════════════════════════════════════════════

async function loadSettings() {
  try {
    const [geoR, schedR] = await Promise.allSettled([
      api.getGeofenceSettings(),
      api.getGpsSchedule(),
    ]);
    const geoData = geoR.status === 'fulfilled' ? geoR.value : { settings: [] };
    const schedData = schedR.status === 'fulfilled' ? schedR.value : { schedule: [] };
    const container = document.getElementById('settings-content');

    // Dynamic labels — each tenant defines their own prospect types
    const typeIcons = { officine: 'building-2', depot: 'warehouse', clinique: 'hospital', pharmacie: 'pill', parapharmacie: 'heart-pulse', hopital: 'hospital', magasin: 'store', bureau: 'briefcase', usine: 'factory', entrepot: 'warehouse', restaurant: 'utensils', hotel: 'bed', ecole: 'graduation-cap' };
    const formatTypeLabel = (raw) => {
      const icon = typeIcons[raw] || 'map-pin';
      const label = raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `<i data-lucide="${icon}" style="width:16px;height:16px;display:inline-block;vertical-align:middle;"></i> ${label}`;
    };

    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    container.innerHTML = `
      <h3 style="margin-bottom:16px;font-size:18px;color:#111827;"><i data-lucide="map-pin" style="width:20px;height:20px;display:inline-block;vertical-align:middle;margin-right:6px;color:#0D6B6E;"></i> Types de prospects & Geofencing</h3>
      <p style="color:#6B7280;font-size:13px;margin-bottom:16px;">Définissez vos types de prospects (pharmacie, dépôt, clinique, magasin…) et configurez le rayon de validation GPS pour chaque type.</p>
      <div class="settings-grid">
        ${geoData.settings.map(s => `
          <div class="setting-card">
            <h4>${formatTypeLabel(s.prospect_type)}</h4>
            <div class="setting-row">
              <label>Rayon min (m)</label>
              <input type="number" id="geo-min-${s.prospect_type}" value="${s.radius_min}" min="5" max="500">
            </div>
            <div class="setting-row">
              <label>Rayon max (m)</label>
              <input type="number" id="geo-max-${s.prospect_type}" value="${s.radius_max}" min="5" max="500">
            </div>
            <button class="btn btn-primary" style="margin-top:12px;width:100%"
              onclick="saveGeofence('${s.prospect_type}')">Enregistrer</button>
          </div>
        `).join('')}
        <div class="setting-card" style="border:2px dashed #D1D5DB;background:#F9FAFB;">
          <h4 style="color:#0D6B6E;"><i data-lucide="plus-circle" style="width:16px;height:16px;display:inline-block;vertical-align:middle;"></i> Ajouter un type</h4>
          <div class="setting-row">
            <label>Nom du type</label>
            <input type="text" id="new-type-name" placeholder="Ex: magasin, bureau, hôpital…" style="width:100%;padding:6px 10px;border:1px solid #D1D5DB;border-radius:6px;">
          </div>
          <div class="setting-row">
            <label>Rayon min (m)</label>
            <input type="number" id="new-type-min" value="20" min="5" max="500">
          </div>
          <div class="setting-row">
            <label>Rayon max (m)</label>
            <input type="number" id="new-type-max" value="50" min="5" max="500">
          </div>
          <button class="btn btn-primary" style="margin-top:12px;width:100%"
            onclick="addNewProspectType()"><i data-lucide="plus" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> Ajouter</button>
        </div>
      </div>

      <h3 style="margin:32px 0 16px;font-size:18px;color:#111827;"><i data-lucide="clock" style="width:20px;height:20px;display:inline-block;vertical-align:middle;margin-right:6px;color:#0D6B6E;"></i> Planning GPS — Horaires d'activation</h3>
      <p style="color:#6B7280;font-size:13px;margin-bottom:16px;">Définissez les jours et heures pendant lesquels le GPS des agents terrain est actif. En dehors de ces plages, le suivi GPS est désactivé.</p>
      <div class="gps-schedule-grid">
        ${dayNames.map((name, i) => {
          const day = (schedData.schedule || []).find(d => d.day_of_week === i) || { start_time: '08:00', end_time: '18:00', is_active: i >= 1 && i <= 5 };
          return `
          <div class="gps-schedule-row ${day.is_active ? '' : 'gps-day-off'}">
            <label class="gps-day-toggle">
              <input type="checkbox" id="gps-active-${i}" ${day.is_active ? 'checked' : ''} onchange="toggleGpsDay(${i})">
              <span class="gps-day-name">${name}</span>
            </label>
            <div class="gps-time-inputs" id="gps-times-${i}" style="${day.is_active ? '' : 'opacity:0.3;pointer-events:none;'}">
              <input type="time" id="gps-start-${i}" value="${day.start_time}" step="900">
              <span style="color:#9CA3AF;">→</span>
              <input type="time" id="gps-end-${i}" value="${day.end_time}" step="900">
            </div>
          </div>`;
        }).join('')}
      </div>
      <button class="btn btn-primary" style="margin-top:16px;" onclick="saveGpsSchedule()">
        <i data-lucide="save" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:6px;"></i> Enregistrer le planning GPS
      </button>
      <div id="gps-schedule-msg" style="margin-top:8px;font-size:13px;"></div>
    `;
    lucide.createIcons();
  } catch (err) {
    console.error('Erreur paramètres:', err);
  }
}

function toggleGpsDay(dayIdx) {
  const checked = document.getElementById('gps-active-' + dayIdx).checked;
  const timesEl = document.getElementById('gps-times-' + dayIdx);
  const rowEl = timesEl.closest('.gps-schedule-row');
  timesEl.style.opacity = checked ? '1' : '0.3';
  timesEl.style.pointerEvents = checked ? '' : 'none';
  rowEl.classList.toggle('gps-day-off', !checked);
}

async function saveGpsSchedule() {
  const schedule = [];
  for (let i = 0; i < 7; i++) {
    schedule.push({
      day_of_week: i,
      start_time: document.getElementById('gps-start-' + i).value || '08:00',
      end_time: document.getElementById('gps-end-' + i).value || '18:00',
      is_active: document.getElementById('gps-active-' + i).checked,
    });
  }
  const msgEl = document.getElementById('gps-schedule-msg');
  try {
    await api.updateGpsSchedule(schedule);
    msgEl.innerHTML = '<span style="color:#10B981;">✓ Planning GPS enregistré avec succès</span>';
    setTimeout(() => { msgEl.innerHTML = ''; }, 3000);
  } catch (err) {
    msgEl.innerHTML = '<span style="color:#DC2626;">Erreur: ' + escapeHtml(err.message || 'Erreur serveur') + '</span>';
  }
}

async function saveGeofence(type) {
  const minVal = parseInt(document.getElementById(`geo-min-${type}`).value, 10);
  const maxVal = parseInt(document.getElementById(`geo-max-${type}`).value, 10);

  try {
    await api.updateGeofenceSetting({
      prospect_type: type,
      radius_min: minVal,
      radius_max: maxVal,
    });
    alert('Paramètres sauvegardés avec succès');
  } catch (err) {
    alert('Erreur: ' + err.message);
  }
}

async function addNewProspectType() {
  const nameEl = document.getElementById('new-type-name');
  const name = nameEl.value.trim().toLowerCase().replace(/[^a-zàâéèêëïîôùûüÿç0-9\s]/gi, '').replace(/\s+/g, '_');
  if (!name || name.length < 2) return alert('Entrez un nom de type (min 2 caractères)');
  const minVal = parseInt(document.getElementById('new-type-min').value, 10) || 20;
  const maxVal = parseInt(document.getElementById('new-type-max').value, 10) || 50;
  try {
    await api.updateGeofenceSetting({ prospect_type: name, radius_min: minVal, radius_max: maxVal });
    alert('Type "' + name.replace(/_/g, ' ') + '" ajouté avec succès');
    loadSettings(); // Reload to show the new type
  } catch (err) {
    alert('Erreur: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════
// TENDANCES & HISTORIQUE
// ═══════════════════════════════════════════════════════════

let chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

async function loadTrends() {
  const months = document.getElementById('trends-period').value;
  try {
    const [trendR, productsR, deleguesR, zonesR, dropsR] = await Promise.allSettled([
      api.getRevenueTrend(months),
      api.getRevenueByProduct(months),
      api.getRevenueByDelegue(months),
      api.getRevenueByZone(months),
      api.getDropDetection(),
    ]);
    if (trendR.status === 'fulfilled') renderRevenueTrendChart(trendR.value);
    if (productsR.status === 'fulfilled') renderProductRevenue(productsR.value);
    if (deleguesR.status === 'fulfilled') renderDelegueRevenue(deleguesR.value);
    if (zonesR.status === 'fulfilled') renderZoneRevenue(zonesR.value);
    if (dropsR.status === 'fulfilled') renderDropDetection(dropsR.value);
  } catch (err) {
    console.error('Erreur tendances:', err);
  }
}

function renderRevenueTrendChart(data) {
  const container = document.getElementById('chart-revenue-trend');
  if (!data.trend || data.trend.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="trending-up"></i></div><div class="empty-state-text">Pas encore de données. Les graphiques apparaîtront après plusieurs cycles de commandes.</div></div>';
    lucide.createIcons();
    return;
  }
  container.innerHTML = '<canvas id="canvas-revenue-trend" height="300"></canvas>';
  destroyChart('revenue-trend');
  const ctx = document.getElementById('canvas-revenue-trend').getContext('2d');
  chartInstances['revenue-trend'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.trend.map(r => r.period),
      datasets: [{
        label: 'CA (' + TENANT_CURRENCY_SYMBOL + ')',
        data: data.trend.map(r => parseFloat(r.revenue)),
        borderColor: '#0D6B6E',
        backgroundColor: 'rgba(0,85,164,0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 5,
        pointBackgroundColor: '#0D6B6E',
      }, {
        label: 'Commandes',
        data: data.trend.map(r => parseInt(r.order_count)),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16,185,129,0.1)',
        fill: false,
        tension: 0.3,
        yAxisID: 'y1',
      }],
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'CA (' + TENANT_CURRENCY_SYMBOL + ')' } },
        y1: { beginAtZero: true, position: 'right', title: { display: true, text: 'Commandes' }, grid: { drawOnChartArea: false } },
      },
    },
  });
}

function renderProductRevenue(data) {
  const container = document.getElementById('chart-product-revenue');
  if (!data.products || data.products.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="package"></i></div><div class="empty-state-text">' + t('analytics.no_product_data') + '</div></div>';
    lucide.createIcons();
    return;
  }
  const top10 = data.products.slice(0, 10);
  container.innerHTML = '<canvas id="canvas-product-revenue" height="300"></canvas>';
  destroyChart('product-revenue');
  const ctx = document.getElementById('canvas-product-revenue').getContext('2d');
  const colors = ['#0D6B6E','#1B9EA1','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316','#6366F1'];
  chartInstances['product-revenue'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top10.map(p => p.product_name),
      datasets: [{
        label: 'CA (' + TENANT_CURRENCY_SYMBOL + ')',
        data: top10.map(p => parseFloat(p.revenue)),
        backgroundColor: colors,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, title: { display: true, text: 'CA (' + TENANT_CURRENCY_SYMBOL + ')' } } },
    },
  });
}

function renderDelegueRevenue(data) {
  const container = document.getElementById('chart-delegue-revenue');
  if (!data.delegues || data.delegues.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="users"></i></div><div class="empty-state-text">' + t('analytics.no_agent_data') + '</div></div>';
    lucide.createIcons();
    return;
  }
  container.innerHTML = `
    <table class="data-table">
      <thead><tr><th>Agent</th><th>Commandes</th><th>CA (${TENANT_CURRENCY_SYMBOL})</th><th>Prospects uniques</th><th>Barre</th></tr></thead>
      <tbody>
        ${data.delegues.map(d => {
          const maxRev = Math.max(...data.delegues.map(x => parseFloat(x.revenue)));
          const pct = maxRev > 0 ? (parseFloat(d.revenue) / maxRev * 100) : 0;
          return `<tr>
            <td><strong>${escapeHtml(d.agent_name)}</strong></td>
            <td>${d.order_count}</td>
            <td>${fmtDT(d.revenue)}</td>
            <td>${d.unique_prospects}</td>
            <td><div class="bar-cell"><div class="bar-fill" style="width:${pct}%"></div></div></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
}

function renderZoneRevenue(data) {
  const container = document.getElementById('chart-zone-revenue');
  if (!data.zones || data.zones.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="map"></i></div><div class="empty-state-text">' + t('analytics.no_zone_data') + '</div></div>';
    lucide.createIcons();
    return;
  }
  container.innerHTML = `
    <table class="data-table">
      <thead><tr><th>Zone</th><th>Commandes</th><th>CA (${TENANT_CURRENCY_SYMBOL})</th><th>Agents terrain</th><th>Prospects</th></tr></thead>
      <tbody>
        ${data.zones.map(z => `<tr>
          <td><strong>${escapeHtml(z.zone)}</strong></td>
          <td>${z.order_count}</td>
          <td>${fmtDT(z.revenue)}</td>
          <td>${z.agents}</td>
          <td>${z.prospects}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  `;
}

function renderDropDetection(data) {
  const container = document.getElementById('drop-detection-results');
  if (!data.all || data.all.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="bar-chart-3"></i></div><div class="empty-state-text">Pas assez de données pour détecter les baisses. Les alertes apparaîtront après 2 cycles de commandes (60 jours).</div></div>';
    lucide.createIcons();
    return;
  }

  const hasDrops = data.drops && data.drops.length > 0;
  const hasRises = data.rises && data.rises.length > 0;

  container.innerHTML = `
    ${hasDrops ? `
      <div class="alert-banner alert-danger">
        <strong><i data-lucide="trending-down" style="width:16px;height:16px;display:inline-block;vertical-align:middle;"></i> ${data.drops.length} produit(s) en baisse (&gt;${data.threshold}%)</strong>
      </div>
      <table class="data-table">
        <thead><tr><th>Produit</th><th>CA précédent</th><th>CA actuel</th><th>Variation</th><th>Qté préc.</th><th>Qté act.</th></tr></thead>
        <tbody>
          ${data.drops.map(d => `<tr style="background:#FEF2F2">
            <td><strong>${escapeHtml(d.product_name)}</strong></td>
            <td>${fmtDT(d.previous_revenue)}</td>
            <td>${fmtDT(d.current_revenue)}</td>
            <td><span class="badge badge-danger">${d.revenue_change_pct}%</span></td>
            <td>${d.previous_qty}</td>
            <td>${d.current_qty}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    ` : '<div class="alert-banner alert-success"><i data-lucide="check-circle" style="width:16px;height:16px;display:inline-block;vertical-align:middle;"></i> Aucune baisse significative détectée</div>'}
    ${hasRises ? `
      <div class="alert-banner alert-success" style="margin-top:16px;">
        <strong><i data-lucide="trending-up" style="width:16px;height:16px;display:inline-block;vertical-align:middle;"></i> ${data.rises.length} produit(s) en hausse (&gt;${data.threshold}%)</strong>
      </div>
      <table class="data-table">
        <thead><tr><th>Produit</th><th>CA précédent</th><th>CA actuel</th><th>Variation</th></tr></thead>
        <tbody>
          ${data.rises.map(d => `<tr style="background:#F0FDF4">
            <td><strong>${escapeHtml(d.product_name)}</strong></td>
            <td>${fmtDT(d.previous_revenue)}</td>
            <td>${fmtDT(d.current_revenue)}</td>
            <td><span class="badge badge-success">+${d.revenue_change_pct}%</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    ` : ''}
  `;
  lucide.createIcons();
}

// ═══════════════════════════════════════════════════════════
// IA PRÉDICTIVE
// ═══════════════════════════════════════════════════════════

async function loadPredictions() {
  try {
    const [summaryR, forecastR, zonesR2, scoringR, stockR] = await Promise.allSettled([
      api.getPredictionsSummary(),
      api.getRevenueForecast(),
      api.getZonesAnalysis(),
      api.getProspectScoring(),
      api.getStockForecast(),
    ]);
    if (summaryR.status === 'fulfilled') renderAISummary(summaryR.value);
    if (forecastR.status === 'fulfilled') renderRevenueForecast(forecastR.value);
    if (zonesR2.status === 'fulfilled') renderZonesAnalysis(zonesR2.value);
    if (scoringR.status === 'fulfilled') renderProspectScoring(scoringR.value);
    if (stockR.status === 'fulfilled') renderStockForecast(stockR.value);
  } catch (err) {
    console.error('Erreur prédictions:', err);
  }
}

function renderAISummary(data) {
  const container = document.getElementById('ai-summary-stats');
  const changeIcon = data.month_change_pct > 0 ? '<i data-lucide="trending-up" style="width:20px;height:20px;"></i>' : data.month_change_pct < 0 ? '<i data-lucide="trending-down" style="width:20px;height:20px;"></i>' : '<i data-lucide="minus" style="width:20px;height:20px;"></i>';
  const changeColor = data.month_change_pct > 0 ? 'stat-green' : data.month_change_pct < 0 ? 'stat-red' : 'stat-blue';

  container.innerHTML = `
    <div class="stat-card stat-gold">
      <div class="stat-icon"><i data-lucide="banknote" style="width:24px;height:24px;"></i></div>
      <div class="stat-value">${fmtDT(data.current_month_revenue)}</div>
      <div class="stat-label">CA mois en cours</div>
    </div>
    <div class="stat-card ${changeColor}">
      <div class="stat-icon">${changeIcon}</div>
      <div class="stat-value">${data.month_change_pct !== null ? (data.month_change_pct > 0 ? '+' : '') + data.month_change_pct + '%' : 'N/A'}</div>
      <div class="stat-label">vs mois précédent</div>
    </div>
    <div class="stat-card stat-purple">
      <div class="stat-icon"><i data-lucide="package" style="width:24px;height:24px;"></i></div>
      <div class="stat-value">${data.current_month_orders}</div>
      <div class="stat-label">Commandes ce mois</div>
    </div>
    <div class="stat-card stat-red">
      <div class="stat-icon"><i data-lucide="map" style="width:24px;height:24px;"></i></div>
      <div class="stat-value">${data.under_exploited_zones}</div>
      <div class="stat-label">Zones sous-exploitées</div>
    </div>
  `;
  lucide.createIcons();
}

function renderRevenueForecast(data) {
  const container = document.getElementById('revenue-forecast-content');
  if (!data.history || data.history.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="brain"></i></div><div class="empty-state-text">L\'IA a besoin de données historiques pour ses prédictions. Les prévisions se préciseront après plusieurs cycles de commandes.</div></div>';
    lucide.createIcons();
    return;
  }

  const pred = data.predictions;
  const cm = data.current_month;
  const confColor = pred.confidence === 'haute' ? '#10B981' : pred.confidence === 'moyenne' ? '#F59E0B' : '#EF4444';

  container.innerHTML = `
    <div class="forecast-grid">
      <div class="forecast-card">
        <div class="forecast-label">CA actuel (jour ${cm.day_of_month}/${cm.days_in_month})</div>
        <div class="forecast-value">${fmtDT(cm.revenue)}</div>
        <div class="forecast-sub">${cm.orders} commandes • ${cm.daily_rate.toLocaleString('fr-FR')} ${TENANT_CURRENCY_SYMBOL}/jour</div>
      </div>
      <div class="forecast-card forecast-highlight">
        <div class="forecast-label"><i data-lucide="crosshair" style="width:16px;height:16px;display:inline-block;vertical-align:middle;"></i> Prévision fin de mois</div>
        <div class="forecast-value">${fmtDT(pred.best_estimate)}</div>
        <div class="forecast-sub">Confiance: <span style="color:${confColor};font-weight:700">${pred.confidence}</span></div>
      </div>
      <div class="forecast-card">
        <div class="forecast-label">Projection linéaire</div>
        <div class="forecast-value">${fmtDT(pred.linear_projection)}</div>
        <div class="forecast-sub">Basée sur le rythme actuel</div>
      </div>
      <div class="forecast-card">
        <div class="forecast-label">Régression historique</div>
        <div class="forecast-value">${fmtDT(pred.regression_prediction)}</div>
        <div class="forecast-sub">Tendance: ${data.regression ? data.regression.trend : 'N/A'} (R²: ${data.regression ? data.regression.r2 : 'N/A'})</div>
      </div>
    </div>
    <div style="margin-top:20px;">
      <canvas id="canvas-forecast" height="250"></canvas>
    </div>
  `;

  // Chart historique + prévision
  destroyChart('forecast');
  const labels = data.history.map(h => h.month);
  const values = data.history.map(h => parseFloat(h.revenue));
  labels.push('Prévision');
  const forecastValues = [...values.map(() => null)];
  forecastValues[forecastValues.length - 1] = values[values.length - 1];
  forecastValues.push(pred.best_estimate);
  values.push(null);

  const ctx = document.getElementById('canvas-forecast').getContext('2d');
  chartInstances['forecast'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'CA Historique',
        data: values,
        borderColor: '#0D6B6E',
        backgroundColor: 'rgba(0,85,164,0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 5,
      }, {
        label: 'Prévision IA',
        data: forecastValues,
        borderColor: '#F59E0B',
        borderDash: [8, 4],
        pointRadius: 8,
        pointBackgroundColor: '#F59E0B',
        fill: false,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'CA (' + TENANT_CURRENCY_SYMBOL + ')' } } },
    },
  });
  lucide.createIcons();
}

function renderZonesAnalysis(data) {
  const container = document.getElementById('zones-analysis-content');
  if (!data.zones || data.zones.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="map"></i></div><div class="empty-state-text">Aucun prospect enregistré</div></div>';
    lucide.createIcons();
    return;
  }

  container.innerHTML = `
    <div class="zone-summary">
      <span class="badge badge-info">${data.summary.total_zones} zones</span>
      <span class="badge badge-danger">${data.summary.under_exploited_count} sous-exploitées</span>
      <span class="badge badge-warning">Pénétration moyenne: ${data.summary.avg_penetration}%</span>
    </div>
    <table class="data-table">
      <thead><tr><th>Zone</th><th>Prospects</th><th>Actifs</th><th>Pénétration</th><th>CA (${TENANT_CURRENCY_SYMBOL})</th><th>Visites</th><th>Statut</th></tr></thead>
      <tbody>
        ${data.zones.map(z => {
          const statusBadge = z.status === 'sous-exploitée'
            ? '<span class="badge badge-danger"><i data-lucide="alert-triangle" style="width:12px;height:12px;display:inline-block;vertical-align:middle;"></i> Sous-exploitée</span>'
            : z.status === 'potentiel'
              ? '<span class="badge badge-warning"><i data-lucide="lightbulb" style="width:12px;height:12px;display:inline-block;vertical-align:middle;"></i> Potentiel</span>'
              : '<span class="badge badge-success"><i data-lucide="check-circle" style="width:12px;height:12px;display:inline-block;vertical-align:middle;"></i> Exploitée</span>';
          return `<tr style="${z.status === 'sous-exploitée' ? 'background:#FEF2F2;' : ''}">
            <td><strong>${escapeHtml(z.zone)}</strong></td>
            <td>${z.total_prospects}</td>
            <td>${z.active_prospects}</td>
            <td><strong>${z.penetration_rate}%</strong></td>
            <td>${fmtDT(z.revenue)}</td>
            <td>${z.total_visits}</td>
            <td>${statusBadge}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
  lucide.createIcons();
}

function renderProspectScoring(data) {
  const container = document.getElementById('prospect-scoring-content');
  if (!data.prospects || data.total === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="map"></i></div><div class="empty-state-text">' + t('prospects.no_data') + '</div></div>';
    lucide.createIcons();
    return;
  }

  const dist = data.distribution;
  container.innerHTML = `
    <div class="scoring-dist">
      <div class="scoring-dist-item" style="background:#ECFDF5;border-left:4px solid #10B981;">
        <strong>${dist.tres_probable}</strong><span>Très probable</span>
      </div>
      <div class="scoring-dist-item" style="background:#EFF6FF;border-left:4px solid #3B82F6;">
        <strong>${dist.probable}</strong><span>Probable</span>
      </div>
      <div class="scoring-dist-item" style="background:#FEF3C7;border-left:4px solid #F59E0B;">
        <strong>${dist.peu_probable}</strong><span>Peu probable</span>
      </div>
      <div class="scoring-dist-item" style="background:#F3F4F6;border-left:4px solid #9CA3AF;">
        <strong>${dist.inactif}</strong><span>Inactif</span>
      </div>
    </div>
    <table class="data-table">
      <thead><tr><th>Prospect</th><th>Ville</th><th>Type</th><th>Score</th><th>Commandes</th><th>Visites (3m)</th><th>Proba.</th></tr></thead>
      <tbody>
        ${data.prospects.slice(0, 30).map(p => {
          const scoreColor = p.score >= 75 ? '#10B981' : p.score >= 50 ? '#3B82F6' : p.score >= 25 ? '#F59E0B' : '#9CA3AF';
          return `<tr>
            <td><strong>${escapeHtml(p.name)}</strong></td>
            <td>${escapeHtml(p.city || '')}</td>
            <td><span class="badge badge-info">${p.type}</span></td>
            <td><div class="score-gauge"><div class="score-fill" style="width:${p.score}%;background:${scoreColor}"></div><span>${p.score}/100</span></div></td>
            <td>${p.total_orders}</td>
            <td>${p.recent_visits}</td>
            <td><span class="badge" style="background:${scoreColor};color:#FFF">${p.label}</span></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
  lucide.createIcons();
}

function renderStockForecast(data) {
  const container = document.getElementById('stock-forecast-content');
  if (!data.forecasts || data.forecasts.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="package"></i></div><div class="empty-state-text">Pas assez de données de vente pour prévoir les ruptures de stock. Le modèle s\'entraîne après plusieurs mois de commandes.</div></div>';
    lucide.createIcons();
    return;
  }

  const sum = data.summary;
  container.innerHTML = `
    <div class="zone-summary">
      <span class="badge badge-info">${sum.total_products} produits analysés</span>
      <span class="badge badge-danger">${sum.high_risk} risque élevé</span>
      <span class="badge badge-warning">${sum.medium_risk} risque moyen</span>
      <span class="badge badge-success">${sum.low_risk} risque faible</span>
    </div>
    <table class="data-table">
      <thead><tr><th>Produit</th><th>Moy./mois</th><th>Prévision</th><th>Pic estimé</th><th>Tendance</th><th>Risque</th><th>Recommandation</th></tr></thead>
      <tbody>
        ${data.forecasts.map(f => {
          const riskBadge = f.risk_level === 'élevé'
            ? '<span class="badge badge-danger"><i data-lucide="circle" style="width:10px;height:10px;display:inline-block;vertical-align:middle;fill:#EF4444;color:#EF4444;"></i> Élevé</span>'
            : f.risk_level === 'moyen'
              ? '<span class="badge badge-warning"><i data-lucide="circle" style="width:10px;height:10px;display:inline-block;vertical-align:middle;fill:#F59E0B;color:#F59E0B;"></i> Moyen</span>'
              : '<span class="badge badge-success"><i data-lucide="circle" style="width:10px;height:10px;display:inline-block;vertical-align:middle;fill:#10B981;color:#10B981;"></i> Faible</span>';
          const trendIcon = f.velocity === 'hausse' ? '<i data-lucide="trending-up" style="width:14px;height:14px;display:inline-block;vertical-align:middle;color:#10B981;"></i>' : f.velocity === 'baisse' ? '<i data-lucide="trending-down" style="width:14px;height:14px;display:inline-block;vertical-align:middle;color:#EF4444;"></i>' : '<i data-lucide="minus" style="width:14px;height:14px;display:inline-block;vertical-align:middle;"></i>';
          return `<tr style="${f.risk_level === 'élevé' ? 'background:#FEF2F2;' : ''}">
            <td><strong>${escapeHtml(f.name)}</strong></td>
            <td>${f.stats.avg_monthly} u.</td>
            <td><strong>${f.stats.next_month_forecast} u.</strong></td>
            <td>${f.stats.peak_demand} u.</td>
            <td>${trendIcon} ${f.velocity}</td>
            <td>${riskBadge}</td>
            <td><small>${escapeHtml(f.recommendation)}</small></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
  lucide.createIcons();
}

// Currency symbol mapping (code → display symbol)
const CURRENCY_SYMBOLS = {
  TND: 'DT', EUR: '€', USD: '$', GBP: '£', XOF: 'FCFA', XAF: 'FCFA',
  MAD: 'MAD', DZD: 'DA', SAR: 'SAR', AED: 'AED', QAR: 'QAR',
  KWD: 'KWD', BHD: 'BHD', OMR: 'OMR', JOD: 'JOD', EGP: 'EGP',
  IQD: 'IQD', LYD: 'LYD', SDG: 'SDG', LBP: 'LBP', MRU: 'MRU',
  CDF: 'FC', GNF: 'GNF', KMF: 'KMF', DJF: 'DJF', HTG: 'HTG',
  CHF: 'CHF', CAD: 'CAD',
};

function setTenantCurrency(code) {
  TENANT_CURRENCY = code || 'TND';
  TENANT_CURRENCY_SYMBOL = CURRENCY_SYMBOLS[TENANT_CURRENCY] || TENANT_CURRENCY;
}

function fmtDT(val) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(parseFloat(val) || 0) + ' ' + TENANT_CURRENCY_SYMBOL;
}

// ═══════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════

// escapeHtml is defined at the top of the file

function formatTime(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleString(typeof getDateLocale === 'function' ? getDateLocale() : 'fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ═══════════════════════════════════════════════════════════
// POINTS & CONVERSIONS
// ═══════════════════════════════════════════════════════════

async function loadPointsSection() {
  try {
    // Charger config + demandes en parallèle
    const [configR, reqR, usersR2, pendR] = await Promise.allSettled([
      api.getPointsConfig(),
      api.getConversionRequests('en_attente'),
      api.getUsers(),
      api.getPendingCount()
    ]);
    const configData = configR.status === 'fulfilled' ? configR.value : { config: null };
    const requestsData = reqR.status === 'fulfilled' ? reqR.value : { requests: [] };
    const usersData = usersR2.status === 'fulfilled' ? usersR2.value : { users: [] };
    const pendingData = pendR.status === 'fulfilled' ? pendR.value : { count: 0 };

    // Afficher taux actuel
    const config = configData.config;
    if (config) {
      document.getElementById('points-per-dt').value = config.points_per_dt;
      const info = config.updated_by_name
        ? `Dernière modif: ${config.updated_by_name} le ${formatDate(config.updated_at)}`
        : '';
      document.getElementById('rate-info').textContent = info;
    }

    // Remplir select des agents terrain
    const select = document.getElementById('add-points-delegue');
    select.innerHTML = '<option value="">-- Choisir un Agent --</option>';
    const delegues = (usersData.users || []).filter(u => u.role === 'delegue');
    delegues.forEach(d => {
      const negWarning = d.total_points < 0 ? ' ⚠️ NÉGATIF' : '';
      select.innerHTML += `<option value="${escapeHtml(d.id)}">${escapeHtml(d.full_name)} (${d.total_points} pts${negWarning})</option>`;
    });

    // Remplir select pénalité aussi
    const penalizeSelect = document.getElementById('penalize-delegue');
    if (penalizeSelect) {
      penalizeSelect.innerHTML = '<option value="">-- Choisir un Agent --</option>';
      delegues.forEach(d => {
        const negWarning = d.total_points < 0 ? ' ⚠️ NÉGATIF' : '';
        penalizeSelect.innerHTML += `<option value="${escapeHtml(d.id)}">${escapeHtml(d.full_name)} (${d.total_points} pts${negWarning})</option>`;
      });
    }

    // Badge demandes en attente
    const count = pendingData.pending_count || 0;
    const badge = document.getElementById('points-badge');
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }

    // Afficher les demandes
    renderConversionRequests(requestsData.requests || []);
  } catch (err) {
    console.error('Erreur chargement points:', err);
  }
}

function renderConversionRequests(requests) {
  const container = document.getElementById('conversion-requests-content');

  if (!requests.length) {
    container.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">' + t('points.no_requests') + '</p>';
    return;
  }

  let html = `<table class="data-table">
    <thead>
      <tr>
        <th>Agent</th>
        <th>Points demandés</th>
        <th>Taux appliqué</th>
        <th>Montant ${TENANT_CURRENCY_SYMBOL}</th>
        <th>Date</th>
        <th>Statut</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>`;

  requests.forEach(r => {
    const statusClass = r.status === 'en_attente' ? 'badge-warning'
      : r.status === 'approuvee' ? 'badge-success' : 'badge-danger';
    const statusLabel = r.status === 'en_attente' ? '⏳ En attente'
      : r.status === 'approuvee' ? '✅ Approuvée' : '❌ Refusée';

    let actions = '';
    if (r.status === 'en_attente') {
      actions = `
        <button class="btn btn-sm btn-success" onclick="reviewRequest('${r.id}', 'approuvee')" title="Approuver">✓</button>
        <button class="btn btn-sm btn-danger" onclick="reviewRequest('${r.id}', 'refusee')" title="Refuser">✗</button>
      `;
    } else {
      actions = r.notes ? `<small style="color:var(--muted);">${escapeHtml(r.notes)}</small>` : '—';
    }

    html += `<tr>
      <td><strong>${escapeHtml(r.agent_name || r.agent_username)}</strong></td>
      <td class="points-cell">${r.points_requested} pts</td>
      <td>${r.points_per_dt_at_request} pts/${TENANT_CURRENCY_SYMBOL}</td>
      <td style="color:var(--success);font-weight:600;">${parseFloat(r.montant_dt).toFixed(3)} ${TENANT_CURRENCY_SYMBOL}</td>
      <td>${formatDate(r.created_at)}</td>
      <td><span class="badge ${statusClass}">${statusLabel}</span></td>
      <td>${actions}</td>
    </tr>`;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

async function savePointsRate() {
  const val = document.getElementById('points-per-dt').value;
  if (!val || val < 1) {
    alert('Valeur invalide (minimum 1)');
    return;
  }
  try {
    const data = await api.updatePointsConfig(parseFloat(val));
    document.getElementById('rate-info').textContent = '✅ Taux mis à jour !';
    setTimeout(() => loadPointsSection(), 1000);
  } catch (err) {
    alert('Erreur: ' + err.message);
  }
}

async function addPointsToDelegue() {
  const userId = document.getElementById('add-points-delegue').value;
  const points = document.getElementById('add-points-amount').value;
  const reason = document.getElementById('add-points-reason').value;

  if (!userId) { alert('Sélectionnez un agent terrain'); return; }
  if (!points || points < 1) { alert('Nombre de points invalide'); return; }

  try {
    const data = await api.addPoints(userId, parseInt(points), reason);
    alert(data.message);
    document.getElementById('add-points-amount').value = '';
    document.getElementById('add-points-reason').value = '';
    loadPointsSection();
  } catch (err) {
    alert('Erreur: ' + err.message);
  }
}

const PENALTY_LABELS = {
  GPS_ANOMALY: 'Anomalie GPS (-10 pts)',
  SHORT_VISIT: 'Visite trop courte (-5 pts)',
  OUT_OF_ZONE: 'Hors zone autorisée (-20 pts)',
  INACTIVITY: 'Inactivité prolongée (-15 pts)',
  REPEAT_FRAUD: 'Récidive de fraude (-25 pts)',
  CUSTOM: 'Pénalité personnalisée',
};

function updateCustomPointsHint() {
  const reason = document.getElementById('penalize-reason').value;
  const customInput = document.getElementById('penalize-custom-points');
  if (reason === 'CUSTOM') {
    customInput.required = true;
    customInput.placeholder = 'Requis';
  } else {
    customInput.required = false;
    customInput.placeholder = 'Auto';
  }
}

async function penalizeDelegue() {
  const userId = document.getElementById('penalize-delegue').value;
  const reason = document.getElementById('penalize-reason').value;
  const customPoints = document.getElementById('penalize-custom-points').value;
  const penaltyNote = document.getElementById('penalize-note').value;

  if (!userId) { alert('Sélectionnez un agent terrain'); return; }
  if (!reason) { alert('Choisissez un motif de pénalité'); return; }
  if (reason === 'CUSTOM' && !customPoints) { alert('Indiquez le nombre de points pour une pénalité personnalisée'); return; }

  const ptsLabel = customPoints ? `${customPoints} pts` : PENALTY_LABELS[reason];
  if (!confirm(`Appliquer la pénalité "${ptsLabel}" à cet agent ? Une notification sera envoyée.`)) return;

  try {
    const data = await api.penalizeAgent(userId, reason, customPoints ? parseInt(customPoints) : null, penaltyNote || null);
    alert(data.message + (data.notification_sent ? '\n📩 Notification envoyée à l\'agent.' : ''));
    document.getElementById('penalize-custom-points').value = '';
    document.getElementById('penalize-note').value = '';
    loadPointsSection();
  } catch (err) {
    alert('Erreur: ' + err.message);
  }
}

async function loadConversionRequests(status) {
  // Update filter button styles
  ['pending', 'approved', 'refused', 'all'].forEach(f => {
    const btn = document.getElementById(`btn-filter-${f}`);
    if (btn) btn.className = 'btn btn-sm btn-outline';
  });
  if (status === 'en_attente') document.getElementById('btn-filter-pending').className = 'btn btn-sm';
  else if (status === 'approuvee') document.getElementById('btn-filter-approved').className = 'btn btn-sm';
  else if (status === 'refusee') document.getElementById('btn-filter-refused').className = 'btn btn-sm';
  else document.getElementById('btn-filter-all').className = 'btn btn-sm';

  try {
    const data = await api.getConversionRequests(status);
    renderConversionRequests(data.requests || []);
  } catch (err) {
    document.getElementById('conversion-requests-content').innerHTML =
      `<p style="color:var(--danger);text-align:center;">Erreur: ${escapeHtml(err.message)}</p>`;
  }
}

async function reviewRequest(id, status) {
  const action = status === 'approuvee' ? 'approuver' : 'refuser';
  let notes = '';
  if (status === 'refusee') {
    notes = prompt('Raison du refus (optionnel):') || '';
  }

  if (!confirm(`Voulez-vous ${action} cette demande ?`)) return;

  try {
    await api.reviewConversion(id, status, notes);
    loadPointsSection();
  } catch (err) {
    alert('Erreur: ' + err.message);
  }
}

// Charger le badge au démarrage
async function updatePointsBadge() {
  try {
    const data = await api.getPendingCount();
    const count = data.pending_count || 0;
    const badge = document.getElementById('points-badge');
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (_) {}
}

// ═══════════════════════════════════════════════════════════
// VALIDATION COMMANDES (ANTI-FRAUDE)
// ═══════════════════════════════════════════════════════════

async function loadOrderValidation(status) {
  // Update filter buttons
  ['pending', 'approved', 'refused', 'all'].forEach(f => {
    const btn = document.getElementById(`btn-ov-${f}`);
    if (btn) btn.className = 'btn btn-sm btn-outline';
  });
  if (status === 'en_attente') document.getElementById('btn-ov-pending').className = 'btn btn-sm';
  else if (status === 'validee') document.getElementById('btn-ov-approved').className = 'btn btn-sm';
  else if (status === 'refusee') document.getElementById('btn-ov-refused').className = 'btn btn-sm';
  else document.getElementById('btn-ov-all').className = 'btn btn-sm';

  const container = document.getElementById('order-validation-content');
  try {
    let data;
    if (status === 'en_attente') {
      data = await api.getPendingOrders();
    } else {
      data = await api.getOrders(status ? { proof_status: status } : {});
    }
    renderOrderValidation(data.orders || []);
  } catch (err) {
    container.innerHTML = `<p style="color:var(--danger);text-align:center;">Erreur: ${escapeHtml(err.message)}</p>`;
  }
}

function renderOrderValidation(orders) {
  const container = document.getElementById('order-validation-content');
  if (typeof lucide !== 'undefined') lucide.createIcons();

  if (!orders.length) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--muted);">
        <i data-lucide="check-circle-2" style="width:48px;height:48px;margin-bottom:16px;color:var(--success);"></i>
        <p style="font-size:16px;">Aucune commande à valider</p>
      </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  let html = '';
  orders.forEach(o => {
    const statusClass = o.proof_status === 'en_attente' ? 'badge-warning'
      : o.proof_status === 'validee' ? 'badge-success' : 'badge-danger';
    const statusLabel = o.proof_status === 'en_attente' ? '⏳ En attente'
      : o.proof_status === 'validee' ? '✅ Validée' : '❌ Refusée';

    const products = (typeof o.products === 'string' ? JSON.parse(o.products) : o.products) || [];
    const productList = products.slice(0, 3).map(p =>
      `<span style="background:var(--bg);padding:2px 8px;border-radius:6px;font-size:12px;">${escapeHtml(p.name)} x${p.quantity}</span>`
    ).join(' ');
    const moreProducts = products.length > 3 ? `<span style="color:var(--muted);font-size:12px;">+${products.length - 3} autres</span>` : '';

    // Triple preuve indicators
    const hasPhoto = o.proof_photo_url ? '✅' : '❌';
    const hasSignature = o.proof_signature ? '✅' : '❌';
    const hasGPS = (o.proof_gps_lat && o.proof_gps_lng) ? '✅' : '❌';

    let actions = '';
    if (o.proof_status === 'en_attente') {
      actions = `
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-sm" onclick="showProofModal('${o.id}')" style="background:var(--info);color:#FFF;">
            <i data-lucide="eye" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:4px;"></i>
            Examiner les preuves
          </button>
          <button class="btn btn-sm btn-success" onclick="approveOrder('${o.id}')">
            <i data-lucide="check" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:4px;"></i>
            Valider
          </button>
          <button class="btn btn-sm btn-danger" onclick="rejectOrder('${o.id}')">
            <i data-lucide="x" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:4px;"></i>
            Refuser
          </button>
        </div>`;
    } else if (o.proof_status === 'refusee' && o.proof_rejection_reason) {
      actions = `<p style="margin-top:8px;color:var(--danger);font-size:13px;"><strong>Motif:</strong> ${escapeHtml(o.proof_rejection_reason)}</p>`;
    }

    html += `
    <div class="card" style="margin-bottom:16px;border-left:4px solid ${o.proof_status === 'en_attente' ? '#F59E0B' : o.proof_status === 'validee' ? '#10B981' : '#EF4444'};">
      <div class="card-body" style="padding:20px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
          <div style="flex:1;min-width:200px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
              <strong style="font-size:16px;">${escapeHtml(o.prospect_name)}</strong>
              <span class="badge ${statusClass}">${statusLabel}</span>
              ${o.points_awarded ? '<span class="badge badge-success">🎯 Points attribués</span>' : ''}
            </div>
            <p style="color:var(--muted);font-size:13px;margin-bottom:8px;">
              Agent: <strong>${escapeHtml(o.agent_name)}</strong> · ${formatDate(o.created_at)}
              ${o.prospect_city ? ` · ${escapeHtml(o.prospect_city)}` : ''}
            </p>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
              ${productList} ${moreProducts}
            </div>
            <p style="font-size:18px;font-weight:700;color:var(--primary);">${parseFloat(o.total_amount).toFixed(3)} ${TENANT_CURRENCY_SYMBOL}</p>
          </div>
          <div style="text-align:right;min-width:200px;">
            <p style="font-size:12px;color:var(--muted);margin-bottom:8px;font-weight:600;">TRIPLE PREUVE</p>
            <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">
              <span style="font-size:13px;">${hasPhoto} Photo in-app</span>
              <span style="font-size:13px;">${hasSignature} Signature prospect</span>
              <span style="font-size:13px;">${hasGPS} Géolocalisation</span>
            </div>
            ${o.reviewer_name ? `<p style="font-size:12px;color:var(--muted);margin-top:8px;">Validé par: ${escapeHtml(o.reviewer_name)}</p>` : ''}
          </div>
        </div>
        ${actions}
      </div>
    </div>`;
  });

  container.innerHTML = html;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Stocker les commandes chargées pour le modal
let _loadedOrders = [];

async function showProofModal(orderId) {
  const modal = document.getElementById('proof-modal');
  const body = document.getElementById('proof-modal-body');

  // Chercher la commande dans le DOM ou re-fetcher
  let orderData;
  try {
    const data = await api.getOrders({});
    const allOrders = data.orders || [];
    orderData = allOrders.find(o => o.id === orderId);
    if (!orderData) {
      // Try pending
      const pending = await api.getPendingOrders();
      orderData = (pending.orders || []).find(o => o.id === orderId);
    }
  } catch (e) {
    body.innerHTML = `<p style="color:var(--danger);">Erreur chargement</p>`;
    modal.style.display = 'flex';
    return;
  }

  if (!orderData) {
    body.innerHTML = `<p style="color:var(--danger);">Commande introuvable</p>`;
    modal.style.display = 'flex';
    return;
  }

  const o = orderData;
  const products = (typeof o.products === 'string' ? JSON.parse(o.products) : o.products) || [];

  let productsHtml = products.map(p => `
    <tr>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.variant_ref || p.dimensions || '')}</td>
      <td style="text-align:center;">${p.quantity}</td>
      <td style="text-align:right;">${parseFloat(p.unit_price).toFixed(3)} ${TENANT_CURRENCY_SYMBOL}</td>
      <td style="text-align:right;font-weight:600;">${(p.quantity * p.unit_price).toFixed(3)} ${TENANT_CURRENCY_SYMBOL}</td>
    </tr>
  `).join('');

  // GPS map link
  const gpsLink = (o.proof_gps_lat && o.proof_gps_lng)
    ? `<a href="https://www.google.com/maps?q=${o.proof_gps_lat},${o.proof_gps_lng}" target="_blank" rel="noopener" style="color:var(--info);">
        📍 ${parseFloat(o.proof_gps_lat).toFixed(5)}, ${parseFloat(o.proof_gps_lng).toFixed(5)}
       </a>`
    : '<span style="color:var(--danger);">Non disponible</span>';

  body.innerHTML = `
    <h2 style="margin-bottom:20px;">
      <i data-lucide="shield-check" style="width:20px;height:20px;display:inline;vertical-align:middle;margin-right:8px;color:var(--primary);"></i>
      Examen des Preuves
    </h2>

    <div style="background:var(--bg);border-radius:12px;padding:16px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <p style="font-weight:600;font-size:16px;">${escapeHtml(o.prospect_name)}</p>
          <p style="color:var(--muted);font-size:13px;">Agent: ${escapeHtml(o.agent_name)} · ${formatDate(o.created_at)}</p>
        </div>
        <div style="text-align:right;">
          <p style="font-size:20px;font-weight:700;color:var(--primary);">${parseFloat(o.total_amount).toFixed(3)} ${TENANT_CURRENCY_SYMBOL}</p>
        </div>
      </div>
    </div>

    <!-- Produits -->
    <h3 style="margin-bottom:12px;">📦 Produits commandés</h3>
    <table class="data-table" style="margin-bottom:20px;">
      <thead><tr><th>Produit</th><th>Variante</th><th>Qté</th><th>Prix U.</th><th>Total</th></tr></thead>
      <tbody>${productsHtml}</tbody>
    </table>

    <!-- Triple preuve -->
    <h3 style="margin-bottom:12px;">🔒 Triple Preuve Anti-Fraude</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
      <div style="background:var(--bg);border-radius:12px;padding:16px;">
        <p style="font-weight:600;margin-bottom:8px;">📸 Photo preuve (caméra in-app)</p>
        ${o.proof_photo_url
          ? `<img src="${escapeHtml(o.proof_photo_url)}" alt="Photo preuve" style="width:100%;border-radius:8px;max-height:300px;object-fit:cover;">`
          : '<p style="color:var(--danger);">Aucune photo</p>'}
      </div>
      <div style="background:var(--bg);border-radius:12px;padding:16px;">
        <p style="font-weight:600;margin-bottom:8px;">✍️ Signature du prospect</p>
        ${o.proof_signature
          ? `<img src="${escapeHtml(o.proof_signature)}" alt="Signature" style="width:100%;background:#FFF;border-radius:8px;max-height:200px;object-fit:contain;padding:8px;">`
          : '<p style="color:var(--danger);">Aucune signature</p>'}
      </div>
    </div>
    <div style="background:var(--bg);border-radius:12px;padding:16px;margin-bottom:20px;">
      <p style="font-weight:600;margin-bottom:8px;">📍 Géolocalisation</p>
      ${gpsLink}
      ${o.proof_timestamp ? `<p style="color:var(--muted);font-size:12px;margin-top:4px;">Horodatage: ${new Date(o.proof_timestamp).toLocaleString('fr-FR')}</p>` : ''}
    </div>

    ${o.proof_status === 'en_attente' ? `
    <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:24px;padding-top:20px;border-top:1px solid var(--border);">
      <button class="btn btn-danger" onclick="rejectOrder('${o.id}')">
        <i data-lucide="x" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:4px;"></i>
        Refuser
      </button>
      <button class="btn btn-success" onclick="approveOrder('${o.id}')" style="min-width:160px;">
        <i data-lucide="check" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:4px;"></i>
        Valider & Attribuer Points
      </button>
    </div>` : ''}
  `;

  modal.style.display = 'flex';
  modal.style.alignItems = 'flex-start';
  modal.style.justifyContent = 'center';
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeProofModal() {
  document.getElementById('proof-modal').style.display = 'none';
}

async function approveOrder(orderId) {
  if (!confirm('Valider cette commande et attribuer les points ?')) return;
  try {
    const data = await api.validateOrder(orderId, 'validee');
    alert(data.message || 'Commande validée !');
    closeProofModal();
    loadOrderValidation('en_attente');
    updateOrderValidationBadge();
  } catch (err) {
    alert('Erreur: ' + err.message);
  }
}

async function rejectOrder(orderId) {
  const reason = prompt('Motif du refus :');
  if (reason === null) return; // cancelled
  if (!confirm('Refuser cette commande ?')) return;
  try {
    const data = await api.validateOrder(orderId, 'refusee', reason);
    alert(data.message || 'Commande refusée.');
    closeProofModal();
    loadOrderValidation('en_attente');
    updateOrderValidationBadge();
  } catch (err) {
    alert('Erreur: ' + err.message);
  }
}

async function updateOrderValidationBadge() {
  try {
    const data = await api.getPendingOrdersCount();
    const count = data.count || 0;
    const badge = document.getElementById('order-validation-badge');
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (_) {}
}

// ═══════════════════════════════════════════════════════════
// ADMIN: TENANTS MANAGEMENT
// ═══════════════════════════════════════════════════════════

async function loadTenants() {
  const container = document.getElementById('tenants-content');
  try {
    const data = await api.request('/admin/tenants');
    const tenants = data.tenants || [];
    
    if (tenants.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Aucune société enregistrée</p></div>';
      return;
    }

    container.innerHTML = `
      <div class="stats-grid" style="margin-bottom:24px;">
        <div class="stat-card stat-blue">
          <div class="stat-value">${tenants.length}</div>
          <div class="stat-label">Sociétés</div>
        </div>
        <div class="stat-card stat-green">
          <div class="stat-value">${tenants.filter(t => t.subscription_status === 'active').length}</div>
          <div class="stat-label">Actives</div>
        </div>
        <div class="stat-card stat-orange">
          <div class="stat-value">${tenants.reduce((s, t) => s + parseInt(t.delegate_count || 0), 0)}</div>
          <div class="stat-label">Agents terrain total</div>
        </div>
        <div class="stat-card stat-purple">
          <div class="stat-value">${tenants.reduce((s, t) => s + parseFloat(t.price_dt || 0), 0).toFixed(0)} ${TENANT_CURRENCY_SYMBOL}</div>
          <div class="stat-label">MRR</div>
        </div>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead><tr>
            <th>Société</th><th>Secteur</th><th>Forfait</th><th>Agents terrain</th><th>Prospects</th><th>Statut</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${tenants.map(t => `
              <tr>
                <td><strong>${escHtml(t.name)}</strong><br><small style="color:#888;">${escHtml(t.slug)}</small></td>
                <td>${escHtml(t.industry || '—')}</td>
                <td><span class="tag tag-blue">${escHtml(t.plan_name || '—')}</span><br><small>${t.price_dt || 0} ${TENANT_CURRENCY_SYMBOL} HT/mois</small></td>
                <td>${t.delegate_count || 0} / ${t.max_delegates || '∞'}</td>
                <td>${t.prospect_count || 0}</td>
                <td><span class="tag ${t.subscription_status === 'active' ? 'tag-green' : 'tag-red'}">${t.subscription_status}</span></td>
                <td>
                  <button class="btn btn-sm btn-outline" onclick="alert('Fonctionnalité à venir')">Modifier</button>
                  ${t.subscription_status === 'active' 
                    ? `<button class="btn btn-sm btn-danger" onclick="suspendTenant('${t.id}', '${escHtml(t.name)}')">Suspendre</button>`
                    : `<button class="btn btn-sm btn-success" onclick="reactivateTenant('${t.id}')">Réactiver</button>`
                  }
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

async function suspendTenant(id, name) {
  if (!confirm(`Suspendre la société "${name}" ? Tous ses utilisateurs seront désactivés.`)) return;
  try {
    await api.request(`/admin/tenants/${id}`, 'DELETE');
    loadTenants();
  } catch (err) {
    alert(err.message);
  }
}

async function reactivateTenant(id) {
  try {
    await api.request(`/admin/tenants/${id}`, 'PUT', { subscription_status: 'active', is_active: true });
    loadTenants();
  } catch (err) {
    alert(err.message);
  }
}

function setupTenantForm() {
  const form = document.getElementById('create-tenant-form');
  if (!form) return;

  // Load plans into select
  api.request('/admin/plans').then(data => {
    const select = document.getElementById('ct-plan');
    (data.plans || []).forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.display_name} — ${p.price_dt} ${TENANT_CURRENCY_SYMBOL} HT/mois (${p.max_delegates < 0 ? '∞ agents terrain' : 'max ' + p.max_delegates + ' agents terrain'})`;
      select.appendChild(opt);
    });
  }).catch(() => {});

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('ct-error');
    errorEl.style.display = 'none';

    try {
      await api.request('/admin/tenants', 'POST', {
        name: document.getElementById('ct-name').value.trim(),
        industry: document.getElementById('ct-industry').value.trim(),
        city: document.getElementById('ct-city').value.trim(),
        phone: document.getElementById('ct-phone').value.trim(),
        email: document.getElementById('ct-email').value.trim(),
        plan_id: parseInt(document.getElementById('ct-plan').value),
        director_name: document.getElementById('ct-dir-name').value.trim(),
        director_username: document.getElementById('ct-dir-username').value.trim(),
        director_password: document.getElementById('ct-dir-password').value,
        director_email: document.getElementById('ct-dir-email').value.trim(),
      });
      closeModal('modal-create-tenant');
      form.reset();
      loadTenants();
      alert('Société créée avec succès !');
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    }
  });
}

// ═══════════════════════════════════════════════════════════
// ADMIN: SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════

async function loadSubscriptions() {
  const container = document.getElementById('subscriptions-content');
  try {
    const data = await api.request('/admin/plans');
    const plans = data.plans || [];
    
    container.innerHTML = `
      <h3 style="margin-bottom:16px;">Forfaits disponibles</h3>
      <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#92400E;">
        💡 Les prix modifiés ici sont <strong>immédiatement visibles</strong> sur la page web publique et la page d'inscription.
      </div>

      <!-- Concept explication -->
      <div style="background:linear-gradient(135deg,#F0FDFA,#ECFDF5);border:1px solid #99F6E4;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
        <div style="font-weight:700;color:#0D6B6E;margin-bottom:8px;">📋 Parcours client</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:13px;color:#374151;">
          <span style="background:#0D6B6E;color:white;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:700;">1</span> Achat licence (one-time)
          <span style="color:#D1D5DB;">→</span>
          <span style="background:#0D6B6E;color:white;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:700;">2</span> Calibrage IA (gratuit)
          <span style="color:#D1D5DB;">→</span>
          <span style="background:#0D6B6E;color:white;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:700;">3</span> 1 mois offert
          <span style="color:#D1D5DB;">→</span>
          <span style="background:#0D6B6E;color:white;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:700;">4</span> Abonnement mensuel
        </div>
      </div>

      <div class="grid-3" style="gap:20px;">
        ${plans.map(p => {
          const licensePrices = { starter: 1500, pro: 3500, enterprise: 6000 };
          const licPrice = p.license_price_dt ? Math.round(parseFloat(p.license_price_dt)) : (licensePrices[p.name] || 0);
          return `
          <div class="card" style="padding:24px;border:2px solid ${p.name === 'pro' ? 'var(--primary)' : '#e5e7eb'};">
            ${p.name === 'pro' ? '<div style="background:var(--primary);color:white;padding:4px 12px;border-radius:20px;font-size:11px;margin-bottom:12px;display:inline-block;text-align:center;">POPULAIRE</div>' : ''}
            <div style="text-align:center;">
              <h3 style="font-size:24px;margin-bottom:8px;">${escHtml(p.display_name)}</h3>
              <div style="background:#F0FDFA;border:1px solid #99F6E4;border-radius:10px;padding:10px;margin-bottom:10px;">
                <div style="font-size:10px;color:#0D6B6E;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Licence (paiement unique)</div>
                <div style="font-size:26px;font-weight:900;color:#0D6B6E;">${licPrice.toLocaleString('fr-FR')} <span style="font-size:14px;">${TENANT_CURRENCY_SYMBOL}<small style='font-size:.65em;opacity:.5'>HT</small></span></div>
              </div>
              <div style="font-size:36px;font-weight:900;color:var(--primary);margin-bottom:4px;">${Math.round(parseFloat(p.price_dt))} <span style="font-size:16px;color:#888;">${TENANT_CURRENCY_SYMBOL}<small style='font-size:.65em;opacity:.5'>HT</small>/mois</span></div>
              <div style="color:#9CA3AF;font-size:12px;margin-bottom:4px;">après calibrage + 1 mois offert</div>
              <div style="color:#888;margin-bottom:16px;">${p.max_delegates < 0 ? '∞ Agents terrain illimités' : 'Max ' + p.max_delegates + ' agents terrain'}</div>
            </div>
            <div style="text-align:left;font-size:13px;color:var(--text-light);margin-bottom:16px;">
              ${Object.entries(p.features || {}).map(([k, v]) => 
                `<div style="padding:4px 0;">${v === true ? '✅' : v === false ? '❌' : '📊'} ${k.replace(/_/g, ' ')}: ${v === true ? 'Oui' : v === false ? 'Non' : v}</div>`
              ).join('')}
            </div>
            <div style="border-top:1px solid var(--border);padding-top:16px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                <label style="font-size:12px;color:var(--muted);min-width:60px;">Licence</label>
                <input type="number" value="${licPrice}" id="plan-license-${p.id}" class="form-input" style="width:80px;text-align:center;"> <span style="font-size:12px;color:var(--muted);">DT (one-time)</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                <label style="font-size:12px;color:var(--muted);min-width:60px;">Prix</label>
                <input type="number" value="${Math.round(parseFloat(p.price_dt))}" id="plan-price-${p.id}" class="form-input" style="width:80px;text-align:center;"> <span style="font-size:12px;color:var(--muted);">DT/mois</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                <label style="font-size:12px;color:var(--muted);min-width:60px;">Agents</label>
                <input type="number" value="${p.max_delegates}" id="plan-max-${p.id}" class="form-input" style="width:80px;text-align:center;"> <span style="font-size:12px;color:var(--muted);">max</span>
              </div>
              <button class="btn btn-sm btn-primary" style="width:100%;" onclick="updatePlan(${p.id})">💾 Enregistrer</button>
            </div>
          </div>
        `}).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

async function updatePlan(planId) {
  const price = parseFloat(document.getElementById(`plan-price-${planId}`).value);
  const maxDelegates = parseInt(document.getElementById(`plan-max-${planId}`).value);
  const licensePrice = parseFloat(document.getElementById(`plan-license-${planId}`).value);
  if (isNaN(price) || price < 0) return alert('Prix invalide');
  if (isNaN(maxDelegates) || maxDelegates < 1) return alert('Nombre d\'agents invalide');
  if (isNaN(licensePrice) || licensePrice < 0) return alert('Prix licence invalide');
  try {
    await api.request(`/admin/plans/${planId}`, 'PUT', { price_dt: price, max_delegates: maxDelegates, license_price_dt: licensePrice });
    alert('✅ Forfait mis à jour ! Les changements sont visibles immédiatement sur la page web.');
    loadSubscriptions();
  } catch (err) {
    alert('Erreur: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════
// ADMIN: PLATFORM STATS
// ═══════════════════════════════════════════════════════════

async function loadPlatformStats() {
  const container = document.getElementById('platform-content');
  try {
    const data = await api.request('/admin/stats');
    container.innerHTML = `
      <div class="stats-grid" style="margin-bottom:24px;">
        <div class="stat-card stat-blue">
          <div class="stat-value">${data.tenants?.total || 0}</div>
          <div class="stat-label">Sociétés Total</div>
        </div>
        <div class="stat-card stat-green">
          <div class="stat-value">${data.tenants?.active || 0}</div>
          <div class="stat-label">Actives</div>
        </div>
        <div class="stat-card stat-orange">
          <div class="stat-value">${data.users?.delegates || 0}</div>
          <div class="stat-label">Agents terrain</div>
        </div>
        <div class="stat-card stat-purple">
          <div class="stat-value">${data.mrr?.toFixed(0) || 0} ${TENANT_CURRENCY_SYMBOL}</div>
          <div class="stat-label">Revenu Mensuel (MRR)</div>
        </div>
      </div>
      <h3 style="margin-bottom:12px;">Dernières sociétés inscrites</h3>
      <div class="table-wrapper">
        <table class="data-table">
          <thead><tr><th>Société</th><th>Forfait</th><th>Inscrit le</th></tr></thead>
          <tbody>
            ${(data.recent_tenants || []).map(t => `
              <tr>
                <td>${escHtml(t.name)}</td>
                <td><span class="tag tag-blue">${escHtml(t.plan_name || '—')}</span></td>
                <td>${new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

// ═══════════════════════════════════════════════════════════
// DIRECTOR: IMPORT EXCEL
// ═══════════════════════════════════════════════════════════

function setupImportForms() {
  const dropzone = document.getElementById('import-dropzone');
  const fileInput = document.getElementById('import-smart-file');
  const importBtn = document.getElementById('import-smart-btn');
  const fileInfo = document.getElementById('import-file-info');
  const resultEl = document.getElementById('import-smart-result');
  const brain3d = document.getElementById('ai-brain-3d');
  const progressWrap = document.getElementById('import-progress-wrap');
  const progressBar = document.getElementById('import-progress-bar');
  const progressLabel = document.getElementById('import-progress-label');
  const progressPct = document.getElementById('import-progress-pct');
  const progressSteps = document.getElementById('import-progress-steps');
  const removeBtn = document.getElementById('import-file-remove');

  if (!dropzone || !fileInput) return;

  let selectedFile = null;

  // Click to browse
  dropzone.addEventListener('click', () => fileInput.click());

  // Drag & drop
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-over');
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      selectFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) selectFile(fileInput.files[0]);
  });

  // Remove file
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedFile = null;
      fileInfo.style.display = 'none';
      importBtn.style.display = 'none';
      resultEl.style.display = 'none';
      fileInput.value = '';
    });
  }

  function selectFile(file) {
    selectedFile = file;
    document.getElementById('import-file-name').textContent = file.name;
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    document.getElementById('import-file-size').textContent = `${sizeMB} MB`;
    fileInfo.style.display = 'flex';
    importBtn.style.display = 'inline-flex';
    resultEl.style.display = 'none';
    if (progressWrap) progressWrap.style.display = 'none';
    if (brain3d) { brain3d.classList.remove('processing', 'success'); }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // ─── Progress animation engine ─────────────────────
  function setProgress(pct, label, step) {
    if (progressBar) {
      progressBar.style.width = pct + '%';
    }
    if (progressPct) progressPct.textContent = pct + '%';
    if (progressLabel) progressLabel.textContent = label;

    // Update step indicators
    if (progressSteps) {
      const steps = progressSteps.querySelectorAll('.ai-step');
      steps.forEach(s => {
        const sn = parseInt(s.dataset.step);
        s.classList.remove('active', 'done');
        if (sn < step) s.classList.add('done');
        else if (sn === step) s.classList.add('active');
      });
    }
  }

  async function animateProgress(phases) {
    for (const phase of phases) {
      setProgress(phase.pct, phase.label, phase.step);
      await new Promise(r => setTimeout(r, phase.duration));
    }
  }

  importBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    // Reset & show progress
    importBtn.style.display = 'none';
    resultEl.style.display = 'none';
    if (progressWrap) progressWrap.style.display = 'block';
    if (brain3d) brain3d.classList.add('processing');

    // Determine file type label
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    const typeLabels = { xlsx: 'Excel', xls: 'Excel', csv: 'CSV', pdf: 'PDF', json: 'JSON', txt: 'Texte', tsv: 'TSV' };
    const fmtLabel = typeLabels[ext] || ext.toUpperCase();

    // Phase 1: Reading file
    const lang = getLang();
    const labels = {
      reading: lang === 'fr' ? `Lecture du fichier ${fmtLabel}...` : `Reading ${fmtLabel} file...`,
      analyzing: lang === 'fr' ? 'Analyse sémantique des colonnes...' : 'Semantic column analysis...',
      detecting: lang === 'fr' ? 'Détection du type de données par l\'IA...' : 'AI data type detection...',
      importing: lang === 'fr' ? 'Importation et validation des données...' : 'Importing and validating data...',
      finalizing: lang === 'fr' ? 'Finalisation et synchronisation...' : 'Finalizing and syncing...',
    };

    // Start the progress animation (non-blocking)
    const progressPromise = animateProgress([
      { pct: 8, label: labels.reading, step: 1, duration: 600 },
      { pct: 20, label: labels.reading, step: 1, duration: 500 },
      { pct: 35, label: labels.analyzing, step: 2, duration: 800 },
      { pct: 50, label: labels.analyzing, step: 2, duration: 700 },
      { pct: 65, label: labels.detecting, step: 3, duration: 900 },
      { pct: 75, label: labels.detecting, step: 3, duration: 600 },
      { pct: 80, label: labels.importing, step: 4, duration: 1000 },
      { pct: 85, label: labels.importing, step: 4, duration: 3000 },
    ]);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Start API call in parallel with animation
      const dataPromise = api.uploadFile('/import', formData);

      // Wait for both: API and minimum animation
      const [data] = await Promise.all([dataPromise, progressPromise]);

      // Complete progress to 100%
      await animateProgress([
        { pct: 92, label: labels.finalizing, step: 5, duration: 300 },
        { pct: 100, label: lang === 'fr' ? 'Terminé !' : 'Complete!', step: 5, duration: 400 },
      ]);

      // Brain success state
      if (brain3d) {
        brain3d.classList.remove('processing');
        brain3d.classList.add('success');
      }

      await new Promise(r => setTimeout(r, 500));

      // Build result
      console.log('[IMPORT] API response:', JSON.stringify(data).substring(0, 500));
      if (data.multi_sheet) {
        // ─── MULTI-SHEET RESULT ─────────────────────
        let html = '<div class="ai-result-success">';
        html += '<div style="text-align:center;margin-bottom:16px;"><div style="font-size:36px;margin-bottom:8px;">🧠</div>';
        html += `<div style="font-size:18px;font-weight:800;color:var(--primary);">${escapeHtml(data.message)}</div></div>`;
        
        // Per-sheet results
        const sheetIcons = { prospects: '�', products: '💊', orders: '🧾', agents: '🧑‍💼' };
        const sheetLabels = { prospects: 'Clients', products: 'Produits', orders: 'Commandes', agents: 'Agents' };
        
        html += '<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-bottom:16px;">';
        for (const r of data.results) {
          const icon = sheetIcons[r.data_type] || '📄';
          html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:12px 18px;min-width:140px;text-align:center;">
            <div style="font-size:24px;margin-bottom:4px;">${icon}</div>
            <div style="font-size:12px;color:var(--text-light);margin-bottom:4px;">${escapeHtml(r.sheet)}</div>
            <div style="font-size:22px;font-weight:900;color:var(--success);">${r.imported || 0}</div>
            <div style="font-size:11px;color:var(--text-light);">${escapeHtml(sheetLabels[r.data_type] || r.data_type)} importé(e)s</div>
            ${r.skipped ? `<div style="font-size:10px;color:var(--warning);">${r.skipped} ignoré(e)s</div>` : ''}
            ${r.errors ? `<div style="font-size:10px;color:var(--danger);">⚠️ ${r.errors.length} erreur(s)</div>` : ''}
          </div>`;
        }
        html += '</div>';
        
        // Show created agents with credentials
        if (data.agents_created && data.agents_created.length > 0) {
          html += `<div style="background:linear-gradient(135deg,#F0FDFA,#ECFDF5);border:2px solid #10B981;border-radius:14px;padding:16px 20px;margin-top:12px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <span style="font-size:20px;">👥</span>
              <strong style="color:#065F46;font-size:15px;">${data.agents_created.length} agent(s) créé(s) automatiquement</strong>
            </div>
            <p style="font-size:12px;color:#6B7280;margin:0 0 10px;">Communiquez ces identifiants à vos agents pour qu'ils se connectent à l'app mobile :</p>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="background:#0D6B6E;color:white;">
                  <th style="padding:8px 12px;text-align:left;border-radius:8px 0 0 0;">Nom</th>
                  <th style="padding:8px 12px;text-align:left;">Identifiant</th>
                  <th style="padding:8px 12px;text-align:left;border-radius:0 8px 0 0;">Mot de passe</th>
                </tr>
              </thead>
              <tbody>`;
          for (const agent of data.agents_created) {
            html += `<tr style="border-bottom:1px solid #D1FAE5;">
              <td style="padding:8px 12px;font-weight:600;">${escapeHtml(agent.full_name)}</td>
              <td style="padding:8px 12px;"><code style="background:#E5E7EB;padding:2px 8px;border-radius:6px;font-size:12px;">${escapeHtml(agent.username)}</code></td>
              <td style="padding:8px 12px;"><code style="background:#FEF3C7;padding:2px 8px;border-radius:6px;font-size:12px;font-weight:700;color:#92400E;">${escapeHtml(agent.password)}</code></td>
            </tr>`;
          }
          html += `</tbody></table>
            <p style="font-size:11px;color:#9CA3AF;margin:8px 0 0;font-style:italic;">💡 Les agents pourront changer leur mot de passe après la première connexion.</p>
          </div>`;
        }
        
        html += `<div class="ai-result-meta" style="margin-top:12px;">📁 ${escapeHtml(data.file_info?.name || '')} &bull; ${data.file_info?.sheets?.length || 0} onglets</div>`;
        html += '</div>';
        
        resultEl.innerHTML = html;
        resultEl.style.display = 'block';
      } else {
      // ─── SINGLE-SHEET RESULT ─────────────────────
      const typeIcons = { prospects: '📋', products: '📦', orders: '🧾' };
      const typeColors = { prospects: 'var(--primary)', products: 'var(--warning)', orders: 'var(--purple)' };
      const typeCss = { prospects: 'prospects', products: 'products', orders: 'orders' };
      const icon = typeIcons[data.data_type] || '📄';
      const color = typeColors[data.data_type] || 'var(--primary)';
      const css = typeCss[data.data_type] || 'prospects';
      const conf = data.detection?.confidence || 'N/A';
      const confPct = typeof conf === 'string' && conf.includes('%') ? parseInt(conf) : conf === 'high' ? 95 : conf === 'medium' ? 70 : conf === 'low' ? 40 : 50;

      resultEl.innerHTML = `
        <div class="ai-result-success">
          <div class="ai-result-header">
            <div class="ai-result-icon ${escapeHtml(css)}">${icon}</div>
            <div>
              <div class="ai-result-title">${escapeHtml(data.data_type_label || data.data_type)} ${lang === 'fr' ? 'détecté(e)s' : 'detected'}</div>
              <div class="ai-result-confidence">
                <span>${lang === 'fr' ? 'Confiance IA' : 'AI Confidence'}:</span>
                <div class="ai-conf-bar"><div class="ai-conf-fill" style="width:${confPct}%;background:${confPct > 80 ? 'var(--success)' : confPct > 60 ? 'var(--warning)' : 'var(--danger)'};"></div></div>
                <span style="font-weight:700;color:${confPct > 80 ? 'var(--success)' : confPct > 60 ? 'var(--warning)' : 'var(--danger)'}">${escapeHtml(String(conf))}</span>
              </div>
            </div>
          </div>
          <div class="ai-result-stats">
            <div class="ai-result-stat">
              <div class="ai-result-stat-value" style="color:var(--success);">${data.result?.imported ?? 0}</div>
              <div class="ai-result-stat-label">${t('import.imported')}</div>
            </div>
            <div class="ai-result-stat">
              <div class="ai-result-stat-value" style="color:var(--warning);">${data.result?.skipped ?? 0}</div>
              <div class="ai-result-stat-label">${t('import.skipped')}</div>
            </div>
            <div class="ai-result-stat">
              <div class="ai-result-stat-value" style="color:var(--text);">${data.file_info?.total_rows ?? 0}</div>
              <div class="ai-result-stat-label">${t('import.rows_read')}</div>
            </div>
          </div>
          <div class="ai-result-meta">
            📁 ${escapeHtml(data.file_info?.name || '')} &bull; Format: ${escapeHtml(data.file_info?.format || 'auto')}
            ${data.result?.types_created?.length ? '<br>🏷️ Types: ' + data.result.types_created.map(tt => escapeHtml(tt.label)).join(', ') : ''}
            ${data.result?.errors?.length ? '<br>⚠️ Erreurs: ' + data.result.errors.map(ee => escapeHtml(ee)).join('; ') : ''}
          </div>
        </div>
      `;
      resultEl.style.display = 'block';
      } // end single-sheet else

    } catch (err) {
      if (brain3d) brain3d.classList.remove('processing', 'success');

      setProgress(100, lang === 'fr' ? 'Erreur' : 'Error', 5);
      if (progressBar) progressBar.style.background = 'var(--danger)';

      resultEl.innerHTML = `
        <div class="ai-result-error" style="position:relative;">
          <div style="font-size:36px;margin-bottom:12px;">❌</div>
          <div style="font-size:16px;font-weight:700;color:var(--danger);margin-bottom:8px;">${lang === 'fr' ? 'Erreur d\'import' : 'Import Error'}</div>
          <p style="font-size:13px;color:var(--text-light);">${escapeHtml(err.message)}</p>
        </div>
      `;
      resultEl.style.display = 'block';
    }

    // Reset for next import
    setTimeout(() => {
      if (progressWrap) progressWrap.style.display = 'none';
      if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.style.background = '';
      }
      importBtn.style.display = 'inline-flex';
      importBtn.disabled = false;
      if (brain3d) brain3d.classList.remove('processing', 'success');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 2000);
  });
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ═══════════════════════════════════════════════════════════
// INSCRIPTIONS EN ATTENTE (ADMIN)
// ═══════════════════════════════════════════════════════════

async function checkPendingBadge() {
  try {
    const data = await api.get('/admin/pending/count');
    const badge = document.getElementById('pending-badge');
    if (badge && data.pending_count > 0) {
      badge.textContent = data.pending_count;
      badge.style.display = 'flex';
    } else if (badge) {
      badge.style.display = 'none';
    }
  } catch (err) { /* ignore */ }
}

async function loadPendingRegistrations() {
  const container = document.getElementById('pending-content');
  if (!container) return;
  container.innerHTML = '<div class="loading">Chargement...</div>';
  try {
    const data = await api.get('/admin/pending');
    const pending = data.pending || [];
    if (pending.length === 0) {
      container.innerHTML = `
        <div class="card" style="padding:40px;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">✅</div>
          <h3 style="margin-bottom:8px;">Aucune inscription en attente</h3>
          <p style="color:#6B7280;">Toutes les demandes ont été traitées.</p>
        </div>`;
      return;
    }
    container.innerHTML = pending.map(t => `
      <div class="card" style="margin-bottom:16px;padding:20px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
          <div style="flex:1;min-width:250px;">
            <h3 style="margin:0 0 8px;">${escHtml(t.name)}</h3>
            <div style="color:#6B7280;font-size:14px;margin-bottom:4px;">
              <strong>Secteur:</strong> ${escHtml(t.industry || 'Non précisé')} | 
              <strong>Ville:</strong> ${escHtml(t.city || 'Non précisé')}
            </div>
            <div style="color:#6B7280;font-size:14px;margin-bottom:4px;">
              <strong>Adresse:</strong> ${escHtml(t.address || 'Non précisée')} | 
              <strong>Matricule fiscale:</strong> ${escHtml(t.matricule_fiscale || 'Non précisé')}
            </div>
            <div style="color:#6B7280;font-size:14px;margin-bottom:4px;">
              <strong>Email:</strong> ${escHtml(t.email)} | 
              <strong>Tél:</strong> ${escHtml(t.phone || '-')}
            </div>
            <div style="color:#6B7280;font-size:14px;margin-bottom:4px;">
              <strong>Directeur:</strong> ${escHtml(t.director_name)} (${escHtml(t.director_username)})
            </div>
            <div style="color:#6B7280;font-size:14px;">
              <strong>Forfait:</strong> ${escHtml(t.plan_name)} (${t.price_dt} ${TENANT_CURRENCY_SYMBOL} HT/mois, ${t.max_delegates < 0 ? '∞ agents' : 'max ' + t.max_delegates + ' agents'})
            </div>
            <div style="color:#9CA3AF;font-size:12px;margin-top:8px;">
              Inscrit le ${new Date(t.created_at).toLocaleDateString('fr-FR')} à ${new Date(t.created_at).toLocaleTimeString('fr-FR')}
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:flex-start;">
            <button class="btn btn-primary" onclick="approvePending('${t.id}')" style="background:#10B981;">
              ✅ Approuver
            </button>
            <button class="btn" onclick="rejectPending('${t.id}', '${escHtml(t.name)}')" style="background:#EF4444;color:#FFF;">
              ❌ Rejeter
            </button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="error-msg" style="display:block;">Erreur: ${escapeHtml(err.message)}</div>`;
  }
}

async function approvePending(tenantId) {
  if (!confirm('Approuver cette société ? Elle aura 30 jours d\'essai gratuit.')) return;
  try {
    const data = await api.put('/admin/pending/' + tenantId + '/approve');
    alert(data.message || 'Société approuvée !');
    loadPendingRegistrations();
    checkPendingBadge();
  } catch (err) {
    alert('Erreur: ' + err.message);
  }
}

async function rejectPending(tenantId, name) {
  if (!confirm('Rejeter la demande de "' + name + '" ?')) return;
  try {
    const data = await api.put('/admin/pending/' + tenantId + '/reject');
    alert(data.message || 'Demande rejetée.');
    loadPendingRegistrations();
    checkPendingBadge();
  } catch (err) {
    alert('Erreur: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════
// ADMIN: PAYMENTS MANAGEMENT
// ═══════════════════════════════════════════════════════════

async function checkPaymentBadge() {
  try {
    const data = await api.getPendingPayments();
    const count = (data.pending_payments || []).length;
    const badge = document.getElementById('payment-badge');
    if (badge) {
      if (count > 0) { badge.textContent = count; badge.style.display = 'flex'; }
      else { badge.style.display = 'none'; }
    }
  } catch (_) {}
}

async function loadPaymentsSection() {
  loadPendingPayments();
  loadPaymentHistory();
  // Load notifications
  try {
    const data = await api.getPaymentNotifications();
    renderAdminNotifications(data.notifications || [], data.unread_count || 0);
  } catch (_) {}
}

async function loadPendingPayments() {
  const container = document.getElementById('pending-payments-content');
  if (!container) return;
  try {
    const data = await api.getPendingPayments();
    const payments = data.pending_payments || [];
    if (payments.length === 0) {
      container.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">✅ Aucun paiement en attente de confirmation</p>';
      return;
    }
    container.innerHTML = `
      <table class="data-table">
        <thead><tr>
          <th>Société</th><th>Directeur</th><th>Forfait</th><th>Montant</th><th>Référence</th><th>Date</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${payments.map(p => `
            <tr style="background:#FFFBEB;">
              <td><strong>${escHtml(p.tenant_name)}</strong></td>
              <td>${escHtml(p.director_name || '—')}</td>
              <td><span class="tag tag-blue">${escHtml(p.plan_name || '—')}</span></td>
              <td style="font-weight:700;color:#10B981;">${parseFloat(p.amount_dt).toFixed(3)} ${TENANT_CURRENCY_SYMBOL}</td>
              <td><code style="font-size:12px;background:#F3F4F6;padding:2px 6px;border-radius:4px;">${escHtml(p.payment_ref)}</code></td>
              <td>${new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
              <td style="display:flex;gap:8px;">
                <button class="btn btn-sm btn-success" onclick="confirmPayment('${p.id}')">✅ Confirmer</button>
                <button class="btn btn-sm btn-danger" onclick="rejectPayment('${p.id}')">❌ Rejeter</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = `<div class="error-msg" style="display:block;">Erreur: ${escHtml(err.message)}</div>`;
  }
}

async function loadPaymentHistory() {
  const container = document.getElementById('payment-history-content');
  if (!container) return;
  try {
    const data = await api.getPaymentHistory();
    const payments = data.payments || [];
    if (payments.length === 0) {
      container.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">Aucun paiement enregistré</p>';
      return;
    }
    const totalMRR = payments.filter(p => p.status === 'completed')
      .reduce((s, p) => s + parseFloat(p.amount_dt || 0), 0);

    container.innerHTML = `
      <div style="background:#F0FDF4;border-radius:10px;padding:16px;margin-bottom:16px;display:flex;gap:32px;align-items:center;">
        <div><div style="font-size:11px;color:#888;font-weight:600;">Total reçu (tous temps)</div>
        <div style="font-size:28px;font-weight:900;color:#10B981;">${fmtDT(totalMRR)}</div></div>
        <div><div style="font-size:11px;color:#888;font-weight:600;">Paiements confirmés</div>
        <div style="font-size:28px;font-weight:900;color:#0D6B6E;">${payments.filter(p=>p.status==='completed').length}</div></div>
      </div>
      <table class="data-table">
        <thead><tr>
          <th>Société</th><th>Forfait</th><th>Montant</th><th>Référence</th><th>Statut</th><th>Date paiement</th>
        </tr></thead>
        <tbody>
          ${payments.map(p => `
            <tr>
              <td><strong>${escHtml(p.tenant_name)}</strong></td>
              <td>${escHtml(p.plan_name || '—')}</td>
              <td style="font-weight:700;color:${p.status==='completed'?'#10B981':'#9CA3AF'}">${parseFloat(p.amount_dt).toFixed(3)} ${TENANT_CURRENCY_SYMBOL}</td>
              <td><code style="font-size:11px;">${escHtml(p.payment_ref)}</code></td>
              <td><span class="badge ${p.status==='completed'?'badge-success':p.status==='failed'?'badge-danger':'badge-warning'}">
                ${p.status==='completed'?'✅ Payé':p.status==='failed'?'❌ Échoué':'⏳ En attente'}
              </span></td>
              <td>${p.paid_at ? new Date(p.paid_at).toLocaleDateString('fr-FR') : new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = `<div class="error-msg" style="display:block;">Erreur: ${escHtml(err.message)}</div>`;
  }
}

async function confirmPayment(paymentId) {
  if (!confirm('Confirmer ce paiement ? Le compte client sera activé immédiatement.')) return;
  try {
    const data = await api.confirmPayment(paymentId);
    alert('✅ ' + (data.message || 'Paiement confirmé !'));
    loadPaymentsSection();
    checkPaymentBadge();
  } catch (err) {
    alert('Erreur: ' + err.message);
  }
}

async function rejectPayment(paymentId) {
  if (!confirm('Rejeter ce paiement ?')) return;
  try {
    await api.rejectPayment(paymentId);
    alert('Paiement rejeté.');
    loadPaymentsSection();
    checkPaymentBadge();
  } catch (err) {
    alert('Erreur: ' + err.message);
  }
}

function renderAdminNotifications(notifications, unreadCount) {
  // Could render a notification panel — for now just update page title
  if (unreadCount > 0) {
    document.title = `(${unreadCount}) Maydeni AI | Dashboard`;
  }
}

// ═══════════════════════════════════════════════════════════
// DIRECTOR: SUBSCRIPTION STATUS
// ═══════════════════════════════════════════════════════════

async function checkSubscriptionBadge() {
  try {
    const data = await api.getMySubscription();
    const sub = data.subscription;
    if (!sub) return;
    const badge = document.getElementById('subscription-badge');
    if (!badge) return;
    if (sub.needs_renewal || sub.status === 'suspended') {
      badge.textContent = sub.status === 'suspended' ? 'SUSPENDU' : `${sub.days_left}j restants`;
      badge.style.display = 'inline';
      badge.style.background = sub.days_left <= 2 || sub.status === 'suspended' ? '#EF4444' : '#F59E0B';
    }
  } catch (_) {}
}

async function loadSubscriptionStatus() {
  const container = document.getElementById('subscription-content');
  if (!container) return;
  try {
    const data = await api.getMySubscription();
    const sub = data.subscription;
    if (!sub) {
      container.innerHTML = '<p style="color:var(--muted);text-align:center;padding:40px;">Aucune information d\'abonnement disponible.</p>';
      return;
    }

    const expiresDate = sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('fr-FR') : '—';
    const statusColor = sub.status === 'active' ? '#10B981' : sub.status === 'suspended' ? '#EF4444' : '#F59E0B';
    const statusLabel = sub.status === 'active' ? '✅ Actif' : sub.status === 'suspended' ? '⛔ Suspendu' : '⏳ En attente';
    const daysLeftColor = sub.days_left !== null ? (sub.days_left <= 2 ? '#EF4444' : sub.days_left <= 5 ? '#F59E0B' : '#10B981') : '#9CA3AF';

    container.innerHTML = `
      <div class="stats-grid" style="margin-bottom:24px;">
        <div class="stat-card" style="border-left:4px solid ${statusColor};">
          <div class="stat-icon"><i data-lucide="badge-check" style="color:${statusColor};"></i></div>
          <div class="stat-value" style="color:${statusColor};">${statusLabel}</div>
          <div class="stat-label">Statut abonnement</div>
        </div>
        <div class="stat-card stat-blue">
          <div class="stat-icon"><i data-lucide="package"></i></div>
          <div class="stat-value">${escHtml(sub.plan)}</div>
          <div class="stat-label">Forfait actuel</div>
        </div>
        <div class="stat-card" style="border-left:4px solid #0D6B6E;">
          <div class="stat-icon"><i data-lucide="banknote"></i></div>
          <div class="stat-value">${parseFloat(sub.price_dt).toFixed(0)} ${TENANT_CURRENCY_SYMBOL} <small style="font-size:.6em;opacity:.5">HT</small></div>
          <div class="stat-label">Tarif mensuel</div>
        </div>
        <div class="stat-card" style="border-left:4px solid ${daysLeftColor};">
          <div class="stat-icon"><i data-lucide="calendar"></i></div>
          <div class="stat-value" style="color:${daysLeftColor};">${sub.days_left !== null ? sub.days_left + 'j' : '—'}</div>
          <div class="stat-label">Jours restants (exp. ${expiresDate})</div>
        </div>
      </div>

      ${sub.needs_renewal ? `
        <div class="card" style="border:2px solid #F59E0B;margin-bottom:20px;">
          <div class="card-body" style="background:#FFFBEB;border-radius:14px;">
            <h3 style="color:#92400E;margin-bottom:12px;">⚠️ Renouvellement requis dans ${sub.days_left} jour(s)</h3>
            <p style="color:#B45309;margin-bottom:16px;">Votre abonnement expire le <strong>${expiresDate}</strong>. Choisissez la durée de renouvellement :</p>
            ${buildBillingPicker(parseFloat(sub.price_dt))}
            <button class="btn btn-primary" onclick="initiateRenewal()" style="margin-top:12px;">� Payer pour renouveler</button>
          </div>
        </div>
      ` : ''}

      ${sub.status === 'suspended' ? `
        <div class="card" style="border:2px solid #EF4444;margin-bottom:20px;">
          <div class="card-body" style="background:#FEF2F2;border-radius:14px;text-align:center;padding:32px;">
            <div style="font-size:48px;margin-bottom:12px;">⛔</div>
            <h3 style="color:#991B1B;margin-bottom:8px;">Compte suspendu pour défaut de paiement</h3>
            <p style="color:#B91C1C;margin-bottom:20px;">Votre abonnement a expiré. Choisissez la durée et payez pour réactiver immédiatement :</p>
            ${buildBillingPicker(parseFloat(sub.price_dt))}
            <button class="btn btn-primary" onclick="initiateRenewal()" style="background:#EF4444;margin-top:12px;">� Payer maintenant pour réactiver</button>
          </div>
        </div>
      ` : ''}

      ${sub.last_payment ? `
        <div class="card">
          <div class="card-header"><h3>Dernier paiement effectué</h3></div>
          <div class="card-body">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;font-size:14px;">
              <div><div style="color:#888;font-size:12px;">Montant</div><strong>${parseFloat(sub.last_payment.amount_dt).toFixed(3)} ${TENANT_CURRENCY_SYMBOL}</strong></div>
              <div><div style="color:#888;font-size:12px;">Référence</div><code style="font-size:12px;">${escHtml(sub.last_payment.payment_ref)}</code></div>
              <div><div style="color:#888;font-size:12px;">Date</div><strong>${sub.last_payment.paid_at ? new Date(sub.last_payment.paid_at).toLocaleDateString('fr-FR') : '—'}</strong></div>
              <div><div style="color:#888;font-size:12px;">Statut</div><span class="badge badge-success">✅ Payé</span></div>
            </div>
          </div>
        </div>
      ` : ''}
    `;
    lucide.createIcons();
  } catch (err) {
    container.innerHTML = `<div class="error-msg" style="display:block;">Erreur: ${escHtml(err.message)}</div>`;
  }
}

async function initiateRenewal() {
  try {
    const selected = document.querySelector('input[name="billing_months"]:checked');
    const billingMonths = selected ? parseInt(selected.value) : 1;
    const data = await api.initiatePayment(api.user?.tenant_id, billingMonths);

    if (data.payment_methods) {
      // Show payment methods modal
      const m = data.payment_methods;
      const ref = data.payment_ref || '—';
      const amount = data.amount_dt ? data.amount_dt + ' ' + TENANT_CURRENCY_SYMBOL : '—';

      let html = `
        <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;" id="pay-modal" onclick="if(event.target===this)this.remove()">
          <div style="background:#FFF;border-radius:16px;padding:28px;max-width:500px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">
            <div style="text-align:center;margin-bottom:20px;">
              <h2 style="color:#0D6B6E;margin-bottom:4px;">Paiement de renouvellement</h2>
              <div style="font-size:28px;font-weight:900;color:#10B981;margin:8px 0;">${amount}</div>
              <div style="font-size:13px;color:#6B7280;">Réf: <code>${escHtml(ref)}</code></div>
            </div>
      `;

      if (m.flouci) {
        html += `
          <div style="border:2px solid #E5E7EB;border-radius:12px;padding:14px;margin-bottom:10px;">
            <div style="font-weight:700;font-size:15px;">📱 Flouci</div>
            <p style="font-size:13px;color:#374151;margin-top:6px;">
              Envoyez <strong>${amount}</strong> au numéro <strong style="color:#0D6B6E;">${escHtml(m.flouci.phone)}</strong> via l'app Flouci.<br>
              Note/motif : <code>${escHtml(ref)}</code>
            </p>
          </div>`;
      }
      if (m.d17) {
        html += `
          <div style="border:2px solid #E5E7EB;border-radius:12px;padding:14px;margin-bottom:10px;">
            <div style="font-weight:700;font-size:15px;">📮 D17 (La Poste)</div>
            <p style="font-size:13px;color:#374151;margin-top:6px;">
              Envoyez <strong>${amount}</strong> au numéro <strong style="color:#0D6B6E;">${escHtml(m.d17.phone)}</strong> via D17.
            </p>
          </div>`;
      }
      if (m.virement) {
        html += `
          <div style="border:2px solid #E5E7EB;border-radius:12px;padding:14px;margin-bottom:10px;">
            <div style="font-weight:700;font-size:15px;">🏦 Virement bancaire</div>
            <div style="font-size:13px;color:#374151;margin-top:6px;line-height:1.8;">
              <div><strong>IBAN :</strong> <code>${escHtml(m.virement.iban)}</code></div>
              <div><strong>SWIFT :</strong> ${escHtml(m.virement.swift)}</div>
              <div><strong>Bénéficiaire :</strong> ${escHtml(m.virement.beneficiary)}</div>
              <div><strong>Motif :</strong> <code>${escHtml(ref)}</code></div>
            </div>
          </div>`;
      }

      html += `
            <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:12px;margin-top:12px;">
              <p style="font-size:12px;color:#92400E;margin:0;"><strong>⏱</strong> Votre compte sera réactivé sous 24h après réception du paiement.</p>
            </div>
            <button onclick="document.getElementById('pay-modal').remove()" style="width:100%;padding:10px;background:#6B7280;color:#FFF;border:none;border-radius:8px;font-size:14px;cursor:pointer;margin-top:12px;">Fermer</button>
          </div>
        </div>`;

      document.body.insertAdjacentHTML('beforeend', html);

    } else if (data.error) {
      alert(data.error);
    } else {
      alert('Erreur lors de la création du paiement.');
    }
  } catch (err) {
    alert('Erreur: ' + err.message);
  }
}

function buildBillingPicker(monthlyPrice) {
  const options = [
    { months: 1,  discount: 0,  label: '1 mois',  badge: '' },
    { months: 3,  discount: 10, label: '3 mois',  badge: '🔥 -10%' },
    { months: 6,  discount: 20, label: '6 mois',  badge: '⭐ -20%' },
    { months: 12, discount: 30, label: '12 mois', badge: '💎 -30%' },
  ];
  let html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:12px 0;">';
  options.forEach(opt => {
    const total = +(monthlyPrice * opt.months * (1 - opt.discount / 100)).toFixed(2);
    const perMonth = +(total / opt.months).toFixed(0);
    const checked = opt.months === 1 ? 'checked' : '';
    const border = opt.discount > 0 ? '#0D6B6E' : '#D1D5DB';
    const bg = opt.discount > 0 ? '#EFF6FF' : '#FFF';
    html += `
      <label style="cursor:pointer;border:2px solid ${border};border-radius:10px;padding:12px;text-align:center;background:${bg};position:relative;transition:all .2s;"
             onclick="this.querySelector('input').checked=true; document.querySelectorAll('label[data-bp]').forEach(l=>l.style.boxShadow='none'); this.style.boxShadow='0 0 0 3px rgba(0,85,164,0.3)';" data-bp>
        <input type="radio" name="billing_months" value="${opt.months}" ${checked} style="position:absolute;opacity:0;">
        ${opt.badge ? `<div style="font-size:11px;font-weight:700;color:#0D6B6E;margin-bottom:4px;">${opt.badge}</div>` : ''}
        <div style="font-weight:700;font-size:15px;color:#1F2937;">${opt.label}</div>
        <div style="font-size:20px;font-weight:900;color:#10B981;margin:4px 0;">${total} ${TENANT_CURRENCY_SYMBOL} <small style="font-size:.55em;opacity:.5">HT</small></div>
        ${opt.discount > 0 ? `<div style="font-size:11px;color:#6B7280;text-decoration:line-through;">${(monthlyPrice * opt.months).toFixed(0)} ${TENANT_CURRENCY_SYMBOL}</div>` : ''}
        <div style="font-size:11px;color:#6B7280;">${perMonth} ${TENANT_CURRENCY_SYMBOL} HT/mois</div>
      </label>`;
  });
  html += '</div>';
  return html;
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('fr-FR');
}

// ═══════════════════════════════════════════════════════════
// AUTO-UPDATE SYSTEM
// ═══════════════════════════════════════════════════════════

const CURRENT_VERSION = '1.0.0';
const VERSION_CHECK_URL = 'https://neolamcha.github.io/Mega-Supervision/version.json';

async function checkForUpdates() {
  try {
    const resp = await fetch(VERSION_CHECK_URL + '?t=' + Date.now(), { cache: 'no-store' });
    if (!resp.ok) return;
    const data = await resp.json();

    // Compare versions
    if (data.version && data.version !== CURRENT_VERSION && isNewerVersion(data.version, CURRENT_VERSION)) {
      showUpdateBanner(data);
    }
  } catch (e) {
    // Silently fail — no network or no version file yet
    console.log('Update check skipped:', e.message);
  }
}

function isNewerVersion(newVer, oldVer) {
  const a = newVer.split('.').map(Number);
  const b = oldVer.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) > (b[i] || 0)) return true;
    if ((a[i] || 0) < (b[i] || 0)) return false;
  }
  return false;
}

function showUpdateBanner(data) {
  const banner = document.getElementById('update-banner');
  if (!banner) return;

  // Check if user dismissed this version
  const dismissed = localStorage.getItem('maydeni_update_dismissed');
  if (dismissed === data.version) return;

  document.getElementById('update-new-version').textContent = data.version;

  // Build changelog
  const changelogEl = document.getElementById('update-changelog');
  if (data.changelog && data.changelog.length > 0) {
    changelogEl.textContent = data.changelog.slice(0, 3).join(' • ');
  }

  // Store data for download
  banner.dataset.version = data.version;
  banner.dataset.downloadUrl = '';

  // Dashboard is a web app — update = reload, no native file to download
  banner.dataset.downloadUrl = '';

  banner.style.display = 'flex';

  // Re-render lucide icons in the banner
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function dismissUpdate() {
  const banner = document.getElementById('update-banner');
  if (banner) {
    localStorage.setItem('maydeni_update_dismissed', banner.dataset.version || '');
    banner.style.display = 'none';
  }
}

function startUpdate() {
  const banner = document.getElementById('update-banner');
  banner.style.display = 'none';

  // Show progress modal
  const modal = document.getElementById('update-modal');
  modal.style.display = 'flex';
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Simulate download progress
  let progress = 0;
  const progressBar = document.getElementById('update-progress-bar');
  const progressPct = document.getElementById('update-progress-pct');
  const stepText = document.getElementById('update-step-text');

  const interval = setInterval(() => {
    progress += Math.random() * 8 + 2;
    if (progress > 100) progress = 100;

    progressBar.style.width = Math.round(progress) + '%';
    progressPct.textContent = Math.round(progress) + '%';

    if (progress >= 30 && progress < 60) {
      stepText.textContent = 'Vérification de l\'intégrité...';
    } else if (progress >= 60 && progress < 85) {
      stepText.textContent = 'Installation de la mise à jour...';
    } else if (progress >= 85 && progress < 100) {
      stepText.textContent = 'Finalisation...';
    }

    if (progress >= 100) {
      clearInterval(interval);
      stepText.textContent = 'Mise à jour installée !';
      document.getElementById('update-complete').style.display = 'block';

      // Clear dismissed version
      localStorage.removeItem('maydeni_update_dismissed');

      // Dashboard is a web app — just reload to get the latest version
      // Reload after 3s
      setTimeout(() => {
        modal.style.display = 'none';
        location.reload();
      }, 3000);
    }
  }, 200);
}

// Check for updates every 30 minutes
setInterval(checkForUpdates, 30 * 60 * 1000);


// ═══════════════════════════════════════════════════════════
// DEMO SIMULATION ENGINE
// ═══════════════════════════════════════════════════════════

const DEMO_MODE = { active: false, plan: null };

// Tunisian city data for realistic simulation (24 governorates)
const TN_CITIES = [
  { name: 'Tunis', lat: 36.8065, lng: 10.1815 },
  { name: 'Sfax', lat: 34.7406, lng: 10.7603 },
  { name: 'Sousse', lat: 35.8254, lng: 10.6360 },
  { name: 'Ariana', lat: 36.8627, lng: 10.1953 },
  { name: 'Ben Arous', lat: 36.7472, lng: 10.2313 },
  { name: 'Nabeul', lat: 36.4513, lng: 10.7356 },
  { name: 'Kairouan', lat: 35.6781, lng: 10.0963 },
  { name: 'Bizerte', lat: 37.2746, lng: 9.8739 },
  { name: 'Gabès', lat: 33.8881, lng: 10.0975 },
  { name: 'Monastir', lat: 35.7643, lng: 10.8113 },
  { name: 'Manouba', lat: 36.8101, lng: 10.0967 },
  { name: 'Médenine', lat: 33.3540, lng: 10.5054 },
  { name: 'Kasserine', lat: 35.1722, lng: 8.8309 },
  { name: 'Gafsa', lat: 34.4250, lng: 8.7842 },
  { name: 'Sidi Bouzid', lat: 35.0382, lng: 9.4858 },
  { name: 'Jendouba', lat: 36.5014, lng: 8.7802 },
  { name: 'Tozeur', lat: 33.9197, lng: 8.1339 },
  { name: 'Mahdia', lat: 35.5047, lng: 11.0622 },
  { name: 'Kef', lat: 36.1747, lng: 8.7049 },
  { name: 'Siliana', lat: 36.0850, lng: 9.3708 },
  { name: 'Zaghouan', lat: 36.4029, lng: 10.1429 },
  { name: 'Béja', lat: 36.7256, lng: 9.1817 },
  { name: 'Tataouine', lat: 32.9297, lng: 10.4518 },
  { name: 'Kébili', lat: 33.7050, lng: 8.9650 },
];

const TN_PHARMACIES = [
  'Pharmacie El-Amir', 'Pharmacie Centrale', 'Pharmacie du Lac', 'Pharmacie Ibn Sina',
  'Pharmacie El-Manar', 'Pharmacie Pasteur', 'Pharmacie El-Azhar', 'Pharmacie Carthage',
  'Pharmacie El-Firdaws', 'Pharmacie Hannibal', 'Pharmacie El-Yasmine', 'Pharmacie Ennasr',
  'Pharmacie El-Amen', 'Pharmacie El-Menzah', 'Pharmacie Bab El-Khadra', 'Pharmacie El-Omrane',
  'Pharmacie Bardo', 'Pharmacie El-Intilaka', 'Pharmacie El-Ghazala', 'Pharmacie El-Mourouj',
  'Pharmacie La Marsa', 'Pharmacie Sidi Bou Said', 'Pharmacie Hammam-Lif', 'Pharmacie Ezzahra',
  'Pharmacie Borj Cedria', 'Pharmacie Radès', 'Pharmacie Mégrine', 'Pharmacie El-Kram',
  'Pharmacie La Goulette', 'Pharmacie El-Ouardia', 'Pharmacie Bab Souika', 'Pharmacie Médina',
  'Pharmacie Lac 1', 'Pharmacie Lac 2', 'Pharmacie Les Berges', 'Pharmacie El-Menzah 9',
];
const TN_DEPOTS = [
  'Dépôt Médical Tunis', 'Dépôt Sahel Pharma', 'Dépôt Pharma Sud', 'Dépôt Central Nord',
  'Dépôt Pharma Express', 'Dépôt Médical Sfax', 'Dépôt Pharma Plus', 'Dépôt Bio Santé',
  'Dépôt El-Hikma', 'Dépôt PharmaGros', 'Dépôt Medistock', 'Dépôt Pharma Rapid',
];
const TN_CLINIQUES = [
  'Clinique les Oliviers', 'Clinique El-Yosr', 'Clinique Taoufik', 'Clinique El-Amen',
  'Clinique Hannibal', 'Clinique Pasteur', 'Clinique El-Manar', 'Clinique Avicenne',
  'Clinique El-Omrane', 'Clinique Carthagène', 'Clinique Ibn Khaldoun', 'Clinique Essalem',
];
const TN_PARA = [
  'Parapharmacie Belle Santé', 'Parapharmacie Naturelle', 'Parapharmacie Bio Plus',
  'Parapharmacie El-Jawhara', 'Parapharmacie Derma Care', 'Parapharmacie Vita Santé',
  'Parapharmacie El-Baraka', 'Parapharmacie Beauté & Santé', 'Parapharmacie Harmonie',
];

const TN_AGENTS = [
  'Ahmed Ben Salah', 'Mohamed Trabelsi', 'Sami Khelifi', 'Yassine Bouazizi', 'Nizar Hammami',
  'Walid Gharbi', 'Riadh Mejri', 'Karim Ben Amor', 'Hatem Chaabane', 'Amine Jlassi',
  'Fathi Maatoug', 'Hichem Dridi', 'Bilel Hajji', 'Sofiane Nasri', 'Oussama Sassi',
  'Ramzi Belhaj', 'Tarek Manai', 'Mehdi Ayari', 'Chaker Brahmi', 'Lotfi Jelassi',
  'Nabil Riahi', 'Slim Rafrafi', 'Adel Ferchichi', 'Zied Karray', 'Mounir Zaghdoudi',
  'Khaled Mbarki', 'Wael Bouslama', 'Hamza Guesmi', 'Seif Tlili', 'Houssem Saidi',
  'Anis Beji', 'Marwen Kacem', 'Ghassen Amri', 'Skander Oueslati', 'Aymen Khemiri',
  'Raed Masmoudi', 'Bassem Hannachi', 'Fares Bouzidi', 'Omar Selmi', 'Jamel Arbi',
  'Ridha Belhadj', 'Taha Ammar', 'Moez Boujelben', 'Ayoub Chouchane', 'Nidhal Hamdi',
  'Imed Daoud', 'Maher Rezgui', 'Faker Zarrouk', 'Habib Gassoumi', 'Ali Chahed',
];

const PLAN_CONFIG = {
  starter: {
    company: 'PharmaCorp Tunisie',
    agentCount: 3,
    prospects: 150,
    dailyVisits: 15,
    hasAnalytics: false,
    hasAI: false,
    hasImport: false
  },
  pro: {
    company: 'MedDistrib Pro SARL',
    agentCount: 10,
    prospects: 800,
    dailyVisits: 60,
    hasAnalytics: true,
    hasAI: false,
    hasImport: true
  },
  enterprise: {
    company: 'Groupe Santé National SA',
    agentCount: 25,
    prospects: 3000,
    dailyVisits: 200,
    hasAnalytics: true,
    hasAI: true,
    hasImport: true
  }
};

// renderAppAgentMockup removed — redundant with pre-login phone simulation

function launchDemo(plan) {
  DEMO_MODE.active = true;
  DEMO_MODE.plan = plan;
  const config = PLAN_CONFIG[plan];

  // Simulate logged-in director
  const demoUser = {
    id: 9999,
    username: 'D_' + plan.toUpperCase(),
    full_name: 'Directeur ' + config.company,
    role: 'directeur',
    tenant_id: 9999
  };

  // Store in api mock
  localStorage.setItem('maydeni_demo_mode', plan);
  api.token = 'demo-token-' + plan;
  api.user = demoUser;

  // Override API methods to return demo data
  setupDemoAPI(plan, config);

  // Hide admin panel, show dashboard
  document.getElementById('admin-panel').style.display = 'none';
  showDashboard();

  // Inject demo data after dashboard renders
  setTimeout(() => injectDemoData(plan), 600);
}

function loginAsAdmin() {
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-username').value = '';
  document.getElementById('login-username').focus();
}

// ═══════════════════════════════════════════════════════════
// DEMO API MOCK — Intercepts all API calls during demo mode
// ═══════════════════════════════════════════════════════════

const TN_PRODUCTS = [
  { id: 'P001', name: 'Doliprane 1000mg', price: 4.5 },
  { id: 'P002', name: 'Amoxicilline 500mg', price: 8.2 },
  { id: 'P003', name: 'Voltarène Gel 50g', price: 12.5 },
  { id: 'P004', name: 'Augmentin 1g', price: 15.8 },
  { id: 'P005', name: 'Glucophage 850mg', price: 6.3 },
  { id: 'P006', name: 'Crestor 10mg', price: 22.0 },
  { id: 'P007', name: 'Ventoline Spray', price: 9.8 },
  { id: 'P008', name: 'Kardégic 75mg', price: 7.5 },
  { id: 'P009', name: 'Inexium 20mg', price: 18.5 },
  { id: 'P010', name: 'Levothyrox 50µg', price: 5.2 },
  { id: 'P011', name: 'Tahor 20mg', price: 25.0 },
  { id: 'P012', name: 'Spasfon Lyoc', price: 6.8 },
  { id: 'P013', name: 'Dafalgan Codéine', price: 11.3 },
  { id: 'P014', name: 'Mopral 20mg', price: 14.2 },
  { id: 'P015', name: 'Efferalgan 500mg', price: 3.8 },
];

function generateDemoAgents(plan) {
  const config = PLAN_CONFIG[plan];
  const agents = [];
  for (let i = 0; i < config.agentCount; i++) {
    const visits = plan === 'enterprise' ? Math.floor(Math.random() * 15) + 8 : plan === 'pro' ? Math.floor(Math.random() * 10) + 5 : Math.floor(Math.random() * 8) + 3;
    const orders = Math.floor(visits * (0.3 + Math.random() * 0.4));
    const score = plan === 'enterprise' ? Math.floor(Math.random() * 600) + 400 : plan === 'pro' ? Math.floor(Math.random() * 500) + 300 : Math.floor(Math.random() * 400) + 200;
    const cityIdx = i % TN_CITIES.length;
    agents.push({
      id: 'demo-agent-' + i,
      username: plan === 'starter' ? 'A_STARTER_0' + (i+1) : plan === 'pro' ? 'A_PRO_' + String(i+1).padStart(2,'0') : 'A_ENT_' + String(i+1).padStart(2,'0'),
      full_name: TN_AGENTS[i % TN_AGENTS.length],
      role: 'delegue',
      phone: '+216 9' + Math.floor(Math.random()*9) + ' ' + String(Math.floor(Math.random()*999)).padStart(3,'0') + ' ' + String(Math.floor(Math.random()*999)).padStart(3,'0'),
      total_score: score * 3 + Math.floor(Math.random()*500),
      total_points: Math.floor(score * 1.5),
      today_visits: visits,
      today_score: score,
      combo_streak: Math.floor(Math.random() * 6),
      is_active: true,
      last_login: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      city: TN_CITIES[cityIdx].name,
      lat: TN_CITIES[cityIdx].lat + (Math.random() - 0.5) * 0.06,
      lng: TN_CITIES[cityIdx].lng + (Math.random() - 0.5) * 0.06,
      orders, revenue: orders * (plan === 'enterprise' ? (500 + Math.random() * 1500) : plan === 'pro' ? (300 + Math.random() * 600) : (150 + Math.random() * 300)),
    });
  }
  return agents.sort((a, b) => b.total_score - a.total_score);
}

function generateDemoProspects(plan) {
  const config = PLAN_CONFIG[plan];
  const count = config.prospects;
  const prospects = new Array(count);
  const allNames = TN_PHARMACIES.concat(TN_DEPOTS, TN_CLINIQUES, TN_PARA);
  const types = ['pharmacie', 'depot', 'clinique', 'parapharmacie'];
  const typeSrc = [TN_PHARMACIES, TN_DEPOTS, TN_CLINIQUES, TN_PARA];
  const cityCount = TN_CITIES.length;
  const agentCount = TN_AGENTS.length;
  // Seeded lightweight random for deterministic but fast generation
  let seed = 42;
  const rng = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; };

  for (let i = 0; i < count; i++) {
    const typeIdx = i % 4;
    const src = typeSrc[typeIdx];
    const cityIdx = i % cityCount;
    const city = TN_CITIES[cityIdx];
    const nameBase = src[i % src.length];
    // Generate unique name: base + city or numbering
    const suffix = i < allNames.length ? '' : ' ' + city.name + (i >= allNames.length * cityCount ? ' #' + Math.floor(i / (allNames.length * cityCount) + 1) : '');
    prospects[i] = {
      id: 'dp-' + i,
      name: nameBase + suffix,
      city: city.name,
      type: types[typeIdx],
      contact_person: TN_AGENTS[i % agentCount],
      phone: '+216 7' + ((i * 7 + 3) % 10) + ' ' + String((i * 137 + 421) % 1000).padStart(3, '0') + ' ' + String((i * 251 + 89) % 1000).padStart(3, '0'),
      latitude: city.lat + (rng() - 0.5) * 0.1,
      longitude: city.lng + (rng() - 0.5) * 0.1,
      visit_count: Math.floor(rng() * 20),
      last_visit: new Date(Date.now() - rng() * 30 * 86400000).toISOString(),
    };
  }
  return prospects;
}

function generateDemoVisits(agents, prospects) {
  const visits = [];
  const now = Date.now();
  const prospectCount = prospects.length;
  // Cap displayed visits to avoid memory issues (show latest 200)
  const maxVisits = 200;
  let count = 0;
  for (let a = 0; a < agents.length && count < maxVisits; a++) {
    const agent = agents[a];
    const vCount = Math.min(agent.today_visits, Math.ceil(maxVisits / agents.length));
    for (let j = 0; j < vCount && count < maxVisits; j++) {
      const pr = prospects[(a * 7 + j * 13) % prospectCount];
      const startTime = new Date(now - (count * 120000 + Math.random() * 3600000));
      const duration = Math.floor(Math.random() * 1800) + 300;
      const isSuspect = Math.random() < 0.05;
      const SUSPECT_REASONS = ['GPS simulé détecté','Vitesse anormale entre positions','Visite trop courte (< 2 min)','Fréquence de visites suspecte'];
      visits[count] = {
        id: 'dv-' + count,
        user_id: agent.id, agent_name: agent.full_name,
        prospect_id: pr.id, prospect_name: pr.name,
        start_time: startTime.toISOString(),
        end_time: new Date(startTime.getTime() + duration * 1000).toISOString(),
        duration_seconds: duration,
        status: 'terminee',
        is_suspect: isSuspect,
        suspect_reasons: isSuspect ? [SUSPECT_REASONS[Math.floor(Math.random()*SUSPECT_REASONS.length)]] : null,
        latitude: pr.latitude, longitude: pr.longitude,
      };
      count++;
    }
  }
  return visits.sort((a, b) => b.start_time > a.start_time ? 1 : -1);
}

function generateDemoOrders(agents, prospects, plan) {
  const orders = [];
  const prospectCount = prospects.length;
  // Scale orders by plan for realistic revenue
  const maxOrders = plan === 'enterprise' ? 2000 : plan === 'pro' ? 500 : 150;
  const minQty = plan === 'enterprise' ? 5 : plan === 'pro' ? 2 : 1;
  const maxQty = plan === 'enterprise' ? 50 : plan === 'pro' ? 30 : 20;
  const minProducts = plan === 'enterprise' ? 2 : 1;
  const maxProducts = plan === 'enterprise' ? 6 : plan === 'pro' ? 5 : 4;
  let count = 0;
  for (let a = 0; a < agents.length && count < maxOrders; a++) {
    const agent = agents[a];
    const oCount = Math.min(agent.orders, Math.ceil(maxOrders / agents.length));
    for (let j = 0; j < oCount && count < maxOrders; j++) {
      const pr = prospects[(a * 11 + j * 17) % prospectCount];
      const numProducts = Math.floor(Math.random() * (maxProducts - minProducts + 1)) + minProducts;
      const products = [];
      let total = 0;
      for (let k = 0; k < numProducts; k++) {
        const prod = TN_PRODUCTS[(count * 3 + k) % TN_PRODUCTS.length];
        const qty = Math.floor(Math.random() * (maxQty - minQty + 1)) + minQty;
        products.push({ product_id: prod.id, name: prod.name, unit_price: prod.price, quantity: qty });
        total += prod.price * qty;
      }
      orders[count] = {
        id: 'do-' + count,
        user_id: agent.id, agent_name: agent.full_name,
        prospect_id: pr.id, prospect_name: pr.name,
        products, total_amount: Math.round(total * 100) / 100,
        created_at: new Date(Date.now() - count * 300000 - Math.random() * 3600000).toISOString(),
      };
      count++;
    }
  }
  return orders;
}

function generateDemoAlerts(agents) {
  const types = [
    { type: 'visite_suspecte', sev: 'critical', desc: 'Durée inférieure à 2 minutes' },
    { type: 'zone_non_autorisee', sev: 'critical', desc: 'Agent hors de sa zone assignée' },
    { type: 'inactivite', sev: 'warning', desc: 'Aucune visite depuis 3 heures' },
    { type: 'objectif_atteint', sev: 'info', desc: 'Objectif journalier de visites atteint' },
    { type: 'nouveau_record', sev: 'info', desc: 'Nouveau record de score hebdomadaire' },
    { type: 'geofence_violation', sev: 'critical', desc: 'Visite confirmée hors du périmètre geofence' },
  ];
  const alerts = [];
  for (let i = 0; i < 8; i++) {
    const t = types[Math.floor(Math.random() * types.length)];
    const ag = agents[Math.floor(Math.random() * agents.length)];
    alerts.push({
      id: 'demo-alert-' + i,
      event_type: t.type, severity: t.sev, description: t.desc,
      agent_name: ag.full_name,
      created_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    });
  }
  return alerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function setupDemoAPI(plan, config) {
  const agents = generateDemoAgents(plan);
  const prospects = generateDemoProspects(plan);
  const visits = generateDemoVisits(agents, prospects);
  const orders = generateDemoOrders(agents, prospects, plan);
  const alerts = generateDemoAlerts(agents);

  // Store for section renderers
  DEMO_MODE.agents = agents;
  DEMO_MODE.prospects = prospects;
  DEMO_MODE.visits = visits;
  DEMO_MODE.orders = orders;
  DEMO_MODE.alerts = alerts;

  const totalRevenue = orders.reduce((s, o) => s + o.total_amount, 0);
  const activeNow = Math.ceil(config.agentCount * 0.7);

  // Override API methods
  api.getStats = async () => ({
    total_delegues: config.agentCount,
    today_visits: visits.length,
    today_suspect: visits.filter(v => v.is_suspect).length,
    today_orders: orders.length,
    today_revenue: Math.round(totalRevenue),
    active_agents: activeNow,
  });

  api.getLeaderboard = async () => ({
    leaderboard: agents.map(a => ({
      full_name: a.full_name, total_score: a.total_score,
      total_points: a.total_points || Math.floor(a.total_score * 0.8),
      today_visits: a.today_visits, today_score: a.today_score,
      combo_streak: a.combo_streak,
    })),
  });

  api.getAlerts = async () => ({ alerts });

  api.getUsers = async () => ({
    users: [
      { id: 'demo-dir', username: 'D_' + plan.toUpperCase(), full_name: 'Directeur ' + config.company, role: 'directeur', phone: '+216 98 123 456', total_score: 0, total_points: 0, is_active: true, last_login: new Date().toISOString() },
      ...agents,
    ]
  });

  // FIX: dashboard calls getAllVisits, not getVisits — supporte filtres
  api.getAllVisits = async (params = {}) => {
    let filtered = visits;
    if (params.date) filtered = filtered.filter(v => v.start_time && v.start_time.includes(params.date));
    if (params.suspect_only) filtered = filtered.filter(v => v.is_suspect === true);
    if (params.user_id) filtered = filtered.filter(v => v.user_id === params.user_id);
    return {
      visits: filtered.map(v => ({
        ...v, prospect_city: prospects.find(p => p.id === v.prospect_id)?.city || '',
        prospect_type: prospects.find(p => p.id === v.prospect_id)?.type || 'client',
        score_awarded: Math.floor(Math.random() * 80) + 10,
      })),
    };
  };

  api.getProspects = async (params) => {
    const page = parseInt(params?.page) || 1;
    const limit = Math.min(parseInt(params?.limit) || 50, 200);
    const offset = (page - 1) * limit;
    const search = params?.search?.toLowerCase();
    const city = params?.city?.toLowerCase();
    // Enrich prospects with visit stats
    const enriched = prospects.map(p => {
      const pVisits = visits.filter(v => v.prospect_id === p.id);
      const totalSec = pVisits.reduce((s, v) => s + (v.duration_seconds || 0), 0);
      const lastV = pVisits.length ? pVisits.sort((a, b) => new Date(b.start_time) - new Date(a.start_time))[0].start_time : null;
      return { ...p, visit_count: pVisits.length, total_duration_minutes: Math.round(totalSec / 60 * 10) / 10, last_visit: lastV };
    });
    let filtered = enriched;
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search) || p.city.toLowerCase().includes(search));
    if (city) filtered = filtered.filter(p => p.city.toLowerCase().includes(city));
    return { prospects: filtered.slice(offset, offset + limit), total: filtered.length, page, limit };
  };

  api.getProspectCities = async () => {
    const cities = [...new Set(prospects.map(p => p.city).filter(Boolean))].sort();
    return { cities };
  };

  api.getOrders = async () => ({ orders });

  // FIX: dashboard calls getGpsLive, not getGPSPositions
  api.getGpsLive = async () => ({
    positions: agents.slice(0, activeNow).map(a => ({
      user_id: a.id, full_name: a.full_name,
      latitude: a.lat, longitude: a.lng,
      recorded_at: new Date().toISOString(), speed: Math.random() * 40,
    })),
  });

  // FIX: heatmap mock was missing — renderer reads data.points
  api.getHeatmap = async () => ({
    points: prospects.slice(0, 100).map(p => ({
      lat: p.latitude, lng: p.longitude, intensity: Math.floor(Math.random() * 10) + 1,
    })),
  });

  // FIX: reports mock — returns JSON summary or blob depending on format
  api.generateReport = async (dateFrom, dateTo, format) => {
    if (format === 'csv' || format === 'excel' || format === 'pdf') {
      return { downloaded: true };
    }
    return {
      summary: {
        total_visits: visits.length, suspect_visits: visits.filter(v => v.is_suspect).length,
        total_orders: orders.length, total_revenue: Math.round(totalRevenue), total_anomalies: Math.floor(Math.random() * 3),
      },
      agent_stats: agents.slice(0, 10).map(a => ({
        full_name: a.full_name, total_visits: a.today_visits * 5,
        suspect_visits: Math.floor(Math.random() * 2), total_score: a.today_score * 5,
        avg_duration: 1110, unique_prospects: Math.floor(Math.random() * 15 + 3),
      })),
    };
  };
  api.getDailyReport = async () => ({
    report: { date: new Date().toISOString().slice(0, 10), total_visits: visits.length, total_orders: orders.length, total_revenue: Math.round(totalRevenue), agents_active: activeNow, suspect_visits: visits.filter(v => v.is_suspect).length },
  });

  // Analytics: revenue trends
  const monthlyData = [];
  for (let m = 11; m >= 0; m--) {
    const d = new Date(); d.setMonth(d.getMonth() - m);
    const base = totalRevenue / 12 * (0.7 + Math.random() * 0.6);
    monthlyData.push({
      month: d.toISOString().slice(0, 7),
      period: d.toISOString().slice(0, 7),
      revenue: Math.round(base),
      orders: Math.floor(orders.length / 12 * (0.8 + Math.random() * 0.4)),
      order_count: Math.floor(orders.length / 12 * (0.8 + Math.random() * 0.4)),
    });
  }

  api.getRevenueTrend = async () => ({ trend: monthlyData });
  api.getRevenueByProduct = async () => ({
    products: TN_PRODUCTS.slice(0, plan === 'starter' ? 5 : plan === 'pro' ? 10 : 15).map(p => ({
      product_name: p.name, total_quantity: Math.floor(Math.random() * (plan === 'enterprise' ? 2000 : plan === 'pro' ? 800 : 500) + (plan === 'enterprise' ? 200 : 50)),
      revenue: Math.round(p.price * (Math.random() * (plan === 'enterprise' ? 2000 : plan === 'pro' ? 800 : 500) + (plan === 'enterprise' ? 200 : 100))),
      total_revenue: Math.round(p.price * (Math.random() * (plan === 'enterprise' ? 2000 : plan === 'pro' ? 800 : 500) + (plan === 'enterprise' ? 200 : 100))),
      order_count: Math.floor(Math.random() * (plan === 'enterprise' ? 300 : plan === 'pro' ? 150 : 80) + (plan === 'enterprise' ? 40 : 10)),
    })),
  });
  // FIX: renderer reads agent_name, revenue, unique_prospects
  api.getRevenueByDelegue = async () => ({
    delegues: agents.map(a => ({
      agent_name: a.full_name, revenue: Math.round(a.revenue * 30),
      order_count: a.orders * 30, visit_count: a.today_visits * 30,
      unique_prospects: Math.floor(Math.random() * 30 + 5),
    })),
  });
  // FIX: renderer reads zone, delegues, prospects
  api.getRevenueByZone = async () => ({
    zones: TN_CITIES.map(c => ({
      zone: c.name, revenue: Math.round(Math.random() * (plan === 'enterprise' ? 300000 : plan === 'pro' ? 130000 : 80000) + (plan === 'enterprise' ? 50000 : plan === 'pro' ? 20000 : 8000)),
      prospects: Math.floor(config.prospects / TN_CITIES.length + Math.random() * 20),
      order_count: Math.floor(Math.random() * (plan === 'enterprise' ? 400 : plan === 'pro' ? 200 : 100) + (plan === 'enterprise' ? 60 : plan === 'pro' ? 30 : 15)),
      agents: Math.floor(Math.random() * (plan === 'enterprise' ? 15 : 5) + 1),
    })),
  });
  // FIX: renderer reads data.all, data.drops, data.rises, data.threshold
  api.getDropDetection = async () => {
    const items = [
      { product_name: TN_PRODUCTS[0].name, previous_revenue: 3200, current_revenue: 4800, revenue_change_pct: 50 },
      { product_name: TN_PRODUCTS[2].name, previous_revenue: 2100, current_revenue: 2900, revenue_change_pct: 38 },
    ];
    return { threshold: 20, all: items, drops: [], rises: items };
  };
  api.getDelegueDropDetection = async () => ({ drops: [] });

  // FIX: renderAISummary reads current_month_revenue, month_change_pct, current_month_orders, under_exploited_zones
  api.getPredictionsSummary = async () => ({
    current_month_revenue: Math.round(totalRevenue),
    month_change_pct: plan === 'enterprise' ? 15.2 : plan === 'pro' ? 11.5 : 8.5,
    current_month_orders: orders.length,
    under_exploited_zones: 3,
  });
  // FIX: renderRevenueForecast reads data.history, data.predictions, data.current_month, data.regression
  api.getRevenueForecast = async () => {
    const now = new Date();
    return {
      history: monthlyData.map(m => ({ month: m.month, revenue: m.revenue })),
      current_month: {
        revenue: Math.round(totalRevenue * 0.65), orders: orders.length,
        day_of_month: now.getDate(), days_in_month: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
        daily_rate: Math.round(totalRevenue * 0.65 / now.getDate()),
      },
      predictions: {
        best_estimate: Math.round(totalRevenue * 1.08),
        linear_projection: Math.round(totalRevenue * 1.05),
        regression_prediction: Math.round(totalRevenue * 1.12),
        confidence: 'haute',
      },
      regression: { trend: 'hausse', r2: 0.85 },
    };
  };
  // FIX: renderZonesAnalysis reads data.summary + data.zones with zone, total_prospects, active_prospects, penetration_rate, revenue, total_visits, status
  api.getZonesAnalysis = async () => ({
    summary: { total_zones: TN_CITIES.length, under_exploited_count: 3, avg_penetration: 42 },
    zones: TN_CITIES.map((c, i) => {
      const total = Math.floor(config.prospects / TN_CITIES.length + Math.random() * 20);
      const active = Math.floor(total * (0.2 + Math.random() * 0.5));
      const pen = Math.round(active / total * 100);
      const status = pen < 30 ? 'sous-exploitée' : pen < 60 ? 'potentiel' : 'exploitée';
      return {
        zone: c.name, total_prospects: total, active_prospects: active,
        penetration_rate: pen, revenue: Math.round(Math.random() * (plan === 'enterprise' ? 200000 : plan === 'pro' ? 80000 : 50000) + (plan === 'enterprise' ? 30000 : plan === 'pro' ? 10000 : 5000)),
        total_visits: Math.floor(Math.random() * 100 + 10), status,
      };
    }),
  });
  // FIX: renderProspectScoring reads data.total, data.distribution, p.total_orders, p.recent_visits, p.label
  api.getProspectScoring = async () => {
    const scored = prospects.slice(0, 30).map(p => {
      const score = Math.round(Math.random() * 80 + 20);
      return {
        ...p, score,
        total_orders: Math.floor(Math.random() * 20),
        recent_visits: Math.floor(Math.random() * 8),
        label: score >= 75 ? 'Très probable' : score >= 50 ? 'Probable' : score >= 25 ? 'Peu probable' : 'Inactif',
      };
    });
    const dist = {
      tres_probable: scored.filter(p => p.score >= 75).length,
      probable: scored.filter(p => p.score >= 50 && p.score < 75).length,
      peu_probable: scored.filter(p => p.score >= 25 && p.score < 50).length,
      inactif: scored.filter(p => p.score < 25).length,
    };
    return { prospects: scored, total: config.prospects, distribution: dist };
  };
  // FIX: renderStockForecast reads data.forecasts, data.summary, f.name, f.stats, f.velocity, f.risk_level, f.recommendation
  api.getStockForecast = async () => {
    const forecasts = TN_PRODUCTS.slice(0, 8).map(p => {
      const avg = Math.floor(Math.random() * 100 + 20);
      const risk = Math.random() > 0.6 ? 'élevé' : Math.random() > 0.3 ? 'moyen' : 'faible';
      const vel = Math.random() > 0.6 ? 'hausse' : Math.random() > 0.3 ? 'stable' : 'baisse';
      return {
        name: p.name,
        stats: { avg_monthly: avg, next_month_forecast: Math.round(avg * (0.9 + Math.random() * 0.3)), peak_demand: Math.round(avg * 1.5) },
        velocity: vel, risk_level: risk,
        recommendation: risk === 'élevé' ? 'Commander en urgence' : risk === 'moyen' ? 'Surveiller le stock' : 'Stock suffisant',
      };
    });
    return {
      forecasts,
      summary: {
        total_products: forecasts.length,
        high_risk: forecasts.filter(f => f.risk_level === 'élevé').length,
        medium_risk: forecasts.filter(f => f.risk_level === 'moyen').length,
        low_risk: forecasts.filter(f => f.risk_level === 'faible').length,
      },
    };
  };

  // FIX: code reads configData.config.points_per_dt
  api.getPointsConfig = async () => ({ config: { points_per_dt: 100, updated_by_name: 'Système', updated_at: new Date().toISOString() } });
  api.getConversionRequests = async () => ({ requests: [] });
  // FIX: code reads data.pending_count
  api.getPendingCount = async () => ({ pending_count: 0 });
  api.penalizeAgent = async (userId, reason, customPoints = null, penaltyNote = null) => {
    const labels = { GPS_ANOMALY: 'Anomalie GPS détectée', SHORT_VISIT: 'Visite trop courte', OUT_OF_ZONE: 'Visite hors zone autorisée', INACTIVITY: 'Inactivité prolongée', REPEAT_FRAUD: 'Récidive de fraude', CUSTOM: 'Pénalité personnalisée' };
    const pts = { GPS_ANOMALY: 10, SHORT_VISIT: 5, OUT_OF_ZONE: 20, INACTIVITY: 15, REPEAT_FRAUD: 25 };
    const actualPts = customPoints || pts[reason] || 10;
    const agent = agents.find(a => a.id === userId);
    return { message: `Pénalité appliquée à ${agent ? agent.full_name : 'Agent'}: ${labels[reason]}${penaltyNote ? ' — ' + penaltyNote : ''}`, points_retires: actualPts, nouveau_total: Math.max(0, (agent?.total_points || 0) - actualPts), motif: labels[reason], notification_sent: true };
  };
  api.getPointsHistory = async () => ({
    history: [
      { reason: 'Commande validée', points_change: 15, score_change: 10, created_at: new Date(Date.now() - 3600000).toISOString() },
      { reason: 'Anomalie GPS détectée', points_change: -10, score_change: -20, created_at: new Date(Date.now() - 7200000).toISOString() },
      { reason: 'Commande validée', points_change: 15, score_change: 10, created_at: new Date(Date.now() - 14400000).toISOString() },
      { reason: 'Visite trop courte (<2 min)', points_change: -5, score_change: -10, created_at: new Date(Date.now() - 28800000).toISOString() },
      { reason: 'Commande validée', points_change: 15, score_change: 10, created_at: new Date(Date.now() - 43200000).toISOString() },
    ]
  });

  // Geofencing & GPS schedule mocks — mutable for demo
  const demoGeoSettings = [
    { prospect_type: 'pharmacie', radius_min: 20, radius_max: 30 },
    { prospect_type: 'depot', radius_min: 40, radius_max: 60 },
    { prospect_type: 'clinique', radius_min: 80, radius_max: 150 },
    { prospect_type: 'parapharmacie', radius_min: 25, radius_max: 40 },
  ];
  api.getGeofenceSettings = async () => ({ settings: demoGeoSettings });
  api.getGpsSchedule = async () => ({
    schedule: [0,1,2,3,4,5,6].map(i => ({ day_of_week: i, start_time: '08:00', end_time: '18:00', is_active: i >= 1 && i <= 5 })),
  });
  api.updateGeofenceSetting = async (data) => {
    const existing = demoGeoSettings.find(s => s.prospect_type === data.prospect_type);
    if (existing) { existing.radius_min = data.radius_min; existing.radius_max = data.radius_max; }
    else { demoGeoSettings.push({ prospect_type: data.prospect_type, radius_min: data.radius_min, radius_max: data.radius_max }); }
    return { success: true };
  };
  api.updateGpsSchedule = async () => ({ success: true });

  // BI (Enterprise)
  api.checkBIAccess = async () => ({
    has_access: plan === 'enterprise',
    plan: plan, analytics_level: plan === 'enterprise' ? 'full' : plan === 'pro' ? 'advanced' : 'basic',
  });

  if (plan === 'enterprise') {
    api.generateBI = async (months) => {
      const biRevenue = Math.round(totalRevenue * (months || 12));
      return {
        generated_at: new Date().toISOString(),
        period_months: months || 12,
        kpi: {
          total_revenue: biRevenue, total_orders: orders.length * (months || 12),
          avg_order_value: Math.round(biRevenue / (orders.length * (months || 12) || 1)),
          max_order_value: Math.round(Math.max(...orders.map(o => o.total_amount))),
          active_agents: config.agentCount, unique_clients: Math.floor(config.prospects * 0.6),
          total_prospects: config.prospects, total_visits: visits.length * (months || 12),
          completed_visits: Math.floor(visits.length * (months || 12) * 0.92),
          suspect_visits: Math.floor(visits.length * (months || 12) * 0.04),
          avg_visit_duration_min: 22,
          visit_to_order_pct: Math.round(orders.length / (visits.length || 1) * 1000) / 10,
          revenue_growth_pct: 12.5,
        },
        forecast: {
          next_month: Math.round(biRevenue / (months || 12) * 1.08),
          next_quarter: Math.round(biRevenue / (months || 12) * 3.2),
          trend: 'hausse', confidence: 'haute', r2: 0.847,
        },
        monthly_trend: monthlyData,
        agents: agents.slice(0, 15).map(a => ({
          id: a.id, name: a.full_name, visits: a.today_visits * 30,
          orders: a.orders * 30, revenue: Math.round(a.revenue * 30),
          avg_visit_min: 22, suspect: 1, score: a.total_score, points: a.total_points,
          prospects_covered: Math.floor(Math.random() * 30 + 10),
        })),
        agent_efficiency: agents.slice(0, 15).map(a => ({
          id: a.id, name: a.full_name, visits: a.today_visits * 30, orders: a.orders * 30,
          conversion_pct: Math.round(a.orders / (a.today_visits || 1) * 1000) / 10,
          revenue: Math.round(a.revenue * 30),
          revenue_per_visit: Math.round(a.revenue * 30 / (a.today_visits * 30 || 1)),
        })),
        products: TN_PRODUCTS.map((p, i) => {
          const qty = Math.floor(Math.random() * 3000 + 200);
          const rev = Math.round(p.price * qty);
          return { product_name: p.name, total_qty: qty, revenue: rev, revenue_pct: 0, cumulative_pct: 0, client_count: Math.floor(Math.random() * 40 + 5) };
        }).sort((a, b) => b.revenue - a.revenue).map((p, i, arr) => {
          const totalR = arr.reduce((s, x) => s + x.revenue, 0);
          p.revenue_pct = Math.round(p.revenue / totalR * 1000) / 10;
          p.cumulative_pct = Math.round(arr.slice(0, i + 1).reduce((s, x) => s + x.revenue, 0) / totalR * 1000) / 10;
          return p;
        }),
        zones: TN_CITIES.map(c => ({
          zone: c.name, prospects: Math.floor(config.prospects / TN_CITIES.length + Math.random() * 30),
          orders: Math.floor(Math.random() * 500 + 80), revenue: Math.round(Math.random() * 400000 + 50000),
          visits: Math.floor(Math.random() * 600 + 100),
          active_clients: Math.floor(config.prospects / TN_CITIES.length * 0.4 + Math.random() * 20),
          penetration_pct: Math.round(Math.random() * 60 + 15),
          avg_revenue_per_client: Math.round(Math.random() * 10000 + 2000),
        })),
        weekday_analysis: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'].map((d, i) => ({
          day: d, day_index: i,
          orders: i === 0 || i === 6 ? Math.floor(Math.random()*10) : Math.floor(Math.random()*120+40),
          revenue: i === 0 || i === 6 ? Math.round(Math.random()*2000) : Math.round(Math.random()*40000+10000),
        })),
        rfm_segments: {
          segments: {
            champions: { count: Math.floor(config.prospects * 0.1), label: 'Champions', color: '#10B981' },
            loyaux: { count: Math.floor(config.prospects * 0.2), label: 'Clients Loyaux', color: '#3B82F6' },
            potentiels: { count: Math.floor(config.prospects * 0.25), label: 'Potentiels', color: '#F59E0B' },
            a_risque: { count: Math.floor(config.prospects * 0.15), label: 'À Risque', color: '#F97316' },
            perdus: { count: Math.floor(config.prospects * 0.1), label: 'Perdus', color: '#EF4444' },
          },
          details: [],
        },
        top_clients: prospects.slice(0, 20).map(p => ({
          id: p.id, name: p.name, city: p.city, type: p.type,
          orders: Math.floor(Math.random() * 80 + 15),
          revenue: Math.round(Math.random() * 50000 + 8000),
          last_order: new Date(Date.now() - Math.random() * 604800000).toISOString(),
        })),
        clients_at_risk: prospects.slice(20, 35).map(p => ({
          id: p.id, name: p.name, city: p.city, type: p.type,
          last_order: new Date(Date.now() - (70 + Math.random() * 90) * 86400000).toISOString(),
          historical_orders: Math.floor(Math.random() * 15 + 3),
          historical_revenue: Math.round(Math.random() * 8000 + 1000),
          days_inactive: Math.floor(70 + Math.random() * 90),
        })),
      };
    };
  }

  // FIX: dashboard calls getMySubscription, not getSubscriptionStatus
  api.getMySubscription = async () => ({
    subscription: {
      plan: plan.charAt(0).toUpperCase() + plan.slice(1),
      plan_name: plan,
      price_dt: plan === 'starter' ? 99 : plan === 'pro' ? 199 : 399,
      max_delegates: plan === 'starter' ? 5 : plan === 'pro' ? 12 : -1,
      status: 'active',
      start_date: new Date(Date.now() - 90 * 86400000).toISOString(),
      expires_at: new Date(Date.now() + 270 * 86400000).toISOString(),
      days_left: 270,
      needs_renewal: false,
      features: plan === 'enterprise'
        ? { analytics: 'full', api_access: true, excel_export: true, gps_tracking: true, points_system: true, custom_branding: true }
        : plan === 'pro'
          ? { analytics: 'advanced', excel_export: true, gps_tracking: true, points_system: true }
          : { analytics: 'basic', gps_tracking: true },
    },
  });

  // ── Assignments (Affectations) mocks ──
  const demoAssignments = [];
  const prospectsPerAgent = Math.floor(prospects.length / agents.length);
  agents.forEach((agent, idx) => {
    const start = idx * prospectsPerAgent;
    const end = idx === agents.length - 1 ? prospects.length : start + prospectsPerAgent;
    for (let i = start; i < end; i++) {
      demoAssignments.push({ id: 'da-' + demoAssignments.length, user_id: agent.id, prospect_id: prospects[i].id, prospect_name: prospects[i].name, agent_name: agent.full_name });
    }
  });

  api.getAssignmentsSummary = async () => ({
    summary: agents.map(a => {
      const assigned = demoAssignments.filter(da => da.user_id === a.id);
      return { id: a.id, full_name: a.full_name, prospect_count: assigned.length, prospect_names: assigned.map(da => da.prospect_name) };
    })
  });

  api.getAssignments = async (params) => {
    let filtered = demoAssignments;
    if (params && params.user_id) filtered = filtered.filter(a => a.user_id === params.user_id);
    return { assignments: filtered };
  };

  api.replaceAssignments = async () => ({ success: true, message: 'Affectations mises à jour (démo)' });
  api.deleteAssignment = async () => ({ success: true });

  // ── Planning mocks ──
  const demoPlans = [];
  const planToday = new Date();
  for (let d = -2; d <= 5; d++) {
    const date = new Date(planToday);
    date.setDate(planToday.getDate() + d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dateStr = date.toISOString().split('T')[0];
    const plansPerDay = Math.min(Math.floor(config.agentCount * 0.6), agents.length);
    for (let j = 0; j < plansPerDay; j++) {
      const agent = agents[j % agents.length];
      const prospect = prospects[(Math.abs(d) * 7 + j * 13) % prospects.length];
      const hour = 8 + (j % 10);
      const status = d < 0 ? (Math.random() > 0.2 ? 'effectuee' : 'manquee') : d === 0 ? (Math.random() > 0.5 ? 'effectuee' : 'planifiee') : 'planifiee';
      demoPlans.push({
        id: 'dp-' + demoPlans.length,
        user_id: agent.id, agent_name: agent.full_name,
        prospect_id: prospect.id, prospect_name: prospect.name,
        prospect_city: prospect.city,
        planned_date: dateStr,
        planned_time: String(hour).padStart(2, '0') + ':' + (Math.random() > 0.5 ? '00' : '30'),
        status,
        notes: Math.random() > 0.7 ? 'Suivi commande' : null,
      });
    }
  }

  api.getPlanning = async (params) => {
    let filtered = demoPlans;
    if (params && params.user_id) filtered = filtered.filter(p => p.user_id === params.user_id);
    if (params && params.date_from) filtered = filtered.filter(p => p.planned_date >= params.date_from);
    if (params && params.date_to) filtered = filtered.filter(p => p.planned_date <= params.date_to);
    if (params && params.status) filtered = filtered.filter(p => p.status === params.status);
    return { plans: filtered.sort((a, b) => a.planned_date.localeCompare(b.planned_date) || a.planned_time.localeCompare(b.planned_time)) };
  };

  api.getPlanningStats = async () => ({
    stats: agents.map(a => {
      const agentPlans = demoPlans.filter(p => p.user_id === a.id);
      return {
        user_id: a.id, full_name: a.full_name,
        planned: agentPlans.filter(p => p.status === 'planifiee').length,
        completed: agentPlans.filter(p => p.status === 'effectuee').length,
        missed: agentPlans.filter(p => p.status === 'manquee').length,
      };
    })
  });

  api.createPlanning = async () => ({ success: true, message: 'Planning créé (démo)' });
  api.updatePlan = async () => ({ success: true });
  api.deletePlan = async () => ({ success: true });

  // ── Order Validation (Pending Orders) mocks ──
  const pendingOrders = orders.slice(0, Math.min(12, orders.length)).map((o, i) => ({
    ...o,
    proof_status: i < 8 ? 'en_attente' : i < 10 ? 'validee' : 'refusee',
    proof_photo_url: Math.random() > 0.2 ? 'https://placehold.co/400x300?text=Preuve+Photo' : null,
    proof_signature: Math.random() > 0.3 ? 'data:image/png;base64,demo' : null,
    proof_gps_lat: Math.random() > 0.15 ? (33.8 + Math.random() * 3) : null,
    proof_gps_lng: Math.random() > 0.15 ? (8 + Math.random() * 3) : null,
    points_awarded: i >= 8 && i < 10 ? Math.floor(o.total_amount * 100) : null,
    reviewer_name: i >= 8 ? 'Dir. ' + config.company : null,
    proof_rejection_reason: i >= 10 ? 'Photo floue, veuillez reprendre' : null,
    prospect_city: prospects.find(p => p.id === o.prospect_id)?.city || '',
  }));

  api.getPendingOrders = async () => ({
    orders: pendingOrders.filter(o => o.proof_status === 'en_attente')
  });

  api.getPendingOrdersCount = async () => ({
    count: pendingOrders.filter(o => o.proof_status === 'en_attente').length
  });

  api.validateOrder = async (orderId, status, reason) => ({
    success: true,
    message: status === 'validee' ? 'Commande validée et points attribués (démo)' : 'Commande refusée (démo)'
  });

  // Upload mock (import)
  api.uploadFile = async () => ({
    success: true,
    message: 'Démo: 15 prospects importés avec succès',
    data_type: 'prospects',
    data_type_label: 'Prospects/Clients',
    detection: { detected_as: 'prospects', confidence: '92%', was_forced: false },
    file_info: { name: 'demo.xlsx', format: 'excel', sheets: ['Feuil1'], total_rows: 18 },
    result: { imported: 15, skipped: 3, total_parsed: 18 },
  });

  // Getme
  api.getMe = async () => ({ user: api.user });

  // ── Formations / Assistance mocks ──
  const demoFormations = [
    {
      id: 101, tenant_id: 9999, request_type: 'meeting', session_date: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
      start_time: '09:00:00', end_time: '10:00:00', status: 'booked',
      problem_description: 'Problème de synchronisation GPS avec les agents en zone rurale. Les positions ne se mettent plus à jour.',
      meeting_link: null, notes: null, admin_response: null,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(), updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      tenant_name: 'Pharma Centre Tunis', director_name: 'Ahmed Ben Salah', director_email: 'ahmed@pharma-centre.tn'
    },
    {
      id: 102, tenant_id: 9998, request_type: 'email', session_date: null,
      start_time: null, end_time: null, status: 'pending',
      problem_description: 'Comment exporter les rapports mensuels en PDF ? Je ne trouve pas l\'option dans le dashboard.',
      meeting_link: null, notes: null, admin_response: null,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(), updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      tenant_name: 'MediPharm Sousse', director_name: 'Fatma Gharbi', director_email: 'fatma@medipharm.tn'
    },
    {
      id: 103, tenant_id: 9997, request_type: 'meeting', session_date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
      start_time: '10:00:00', end_time: '11:00:00', status: 'completed',
      problem_description: 'Configuration des zones de geofencing pour les nouveaux dépôts.',
      meeting_link: 'https://meet.google.com/abc-defg-hij', notes: 'Client satisfait, geofencing configuré.', admin_response: null,
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(), updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      tenant_name: 'BioPharm Sfax', director_name: 'Mohamed Trabelsi', director_email: 'mohamed@biopharm.tn'
    },
    {
      id: 104, tenant_id: 9996, request_type: 'email', session_date: null,
      start_time: null, end_time: null, status: 'responded',
      problem_description: 'Les points de fidélité ne s\'affichent pas correctement pour un de mes agents.',
      meeting_link: null, notes: null, admin_response: 'Le problème venait d\'un cache navigateur. Videz le cache (Ctrl+Shift+R) et les points s\'afficheront correctement. Si le problème persiste, vérifiez que l\'agent a bien effectué des visites validées.',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(), updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      tenant_name: 'ParaSanté Bizerte', director_name: 'Leila Hammami', director_email: 'leila@parasante.tn'
    },
  ];

  // Intercept generic request for /formations/ paths
  const _originalRequest = api.request.bind(api);
  api.request = async function(methodOrPath, pathOrMethod, body) {
    let method, path;
    if (typeof methodOrPath === 'string' && methodOrPath.startsWith('/')) {
      path = methodOrPath; method = pathOrMethod || 'GET';
    } else {
      method = methodOrPath; path = pathOrMethod;
    }

    if (path && path.startsWith('/formations/')) {
      // GET /formations/available-dates
      if (path.includes('/available-dates')) {
        const monthMatch = path.match(/month=([\d-]+)/);
        const month = monthMatch ? monthMatch[1] : new Date().toISOString().slice(0, 7);
        const [yr, mn] = month.split('-').map(Number);
        const dates = [];
        const today = new Date(); today.setHours(0,0,0,0);
        const minD = new Date(today); minD.setDate(minD.getDate() + 2);
        for (let d = 1; d <= new Date(yr, mn, 0).getDate(); d++) {
          const dt = new Date(yr, mn - 1, d);
          if (dt.getDay() === 0 || dt.getDay() === 6 || dt < minD) continue;
          const ds = dt.toISOString().slice(0, 10);
          const booked = demoFormations.filter(f => f.session_date === ds && (f.status === 'booked' || f.status === 'completed')).length;
          dates.push({ date: ds, available: 5 - booked, total: 5, full: booked >= 5 });
        }
        return { month, dates };
      }
      // GET /formations/slots
      if (path.includes('/slots?')) {
        const dateMatch = path.match(/date=([\d-]+)/);
        const date = dateMatch ? dateMatch[1] : '';
        const bookedTimes = new Set(demoFormations.filter(f => f.session_date === date && (f.status === 'booked' || f.status === 'completed')).map(f => f.start_time.slice(0, 5)));
        const slots = [];
        for (let h = 8; h < 13; h++) {
          const st = String(h).padStart(2, '0') + ':00';
          slots.push({ start: st, end: String(h+1).padStart(2, '0') + ':00', available: !bookedTimes.has(st) });
        }
        return { date, slots };
      }
      // GET /formations/my
      if (path === '/formations/my') {
        return { sessions: [{
          id: 201, tenant_id: 9999, request_type: 'meeting',
          session_date: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
          start_time: '10:00:00', end_time: '11:00:00', status: 'booked',
          problem_description: 'Configuration des alertes automatiques pour les visites suspectes.',
          meeting_link: null, admin_response: null,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        }] };
      }
      // GET /formations/admin/all
      if (path.includes('/admin/all')) {
        const url = new URLSearchParams(path.split('?')[1] || '');
        let filtered = [...demoFormations];
        const st = url.get('status'); if (st) filtered = filtered.filter(f => f.status === st);
        const fr = url.get('from'); if (fr) filtered = filtered.filter(f => (f.session_date || f.created_at.slice(0,10)) >= fr);
        const to = url.get('to'); if (to) filtered = filtered.filter(f => (f.session_date || f.created_at.slice(0,10)) <= to);
        return { sessions: filtered };
      }
      // POST /formations/book
      if (path === '/formations/book' && method === 'POST') {
        return { message: 'Rendez-vous réservé avec succès ! (démo)', session: { id: 999, ...body, status: 'booked', request_type: 'meeting' } };
      }
      // POST /formations/email-request
      if (path === '/formations/email-request' && method === 'POST') {
        return { message: 'Demande envoyée ! Vous recevrez une réponse par email. (démo)', session: { id: 998, ...body, status: 'pending', request_type: 'email' } };
      }
      // DELETE /formations/cancel/
      if (path.includes('/formations/cancel/') && method === 'DELETE') {
        return { message: 'Demande annulée (démo)' };
      }
      // PUT /formations/admin/
      if (path.includes('/formations/admin/') && method === 'PUT') {
        return { session: { id: parseInt(path.split('/').pop()), ...body, updated_at: new Date().toISOString() } };
      }
      return { sessions: [] };
    }

    // Non-formation paths: use original (will hit other mocks or real API)
    return _originalRequest(methodOrPath, pathOrMethod, body);
  };
}

function injectDemoData(plan) {
  const config = PLAN_CONFIG[plan];
  const now = new Date();

  // Update user info display
  document.getElementById('user-name').textContent = 'Dir. ' + config.company;
  document.getElementById('user-role').textContent = 'directeur — Démo ' + plan.toUpperCase();
  document.getElementById('user-avatar').textContent = plan[0].toUpperCase() + plan[1].toUpperCase();

  // Add demo banner
  const mainContent = document.querySelector('.main-content');
  if (mainContent && !document.getElementById('demo-banner')) {
    const banner = document.createElement('div');
    banner.id = 'demo-banner';
    banner.style.cssText = 'background:linear-gradient(135deg,#F59E0B,#D97706);color:#FFF;padding:14px 24px;text-align:center;font-size:13px;font-weight:700;letter-spacing:1px;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;';
    banner.innerHTML = '⚡ MODE DÉMONSTRATION — Forfait ' + plan.toUpperCase() + ' — <strong>' + config.company + '</strong> — ' + config.agentCount + ' agents, ' + new Intl.NumberFormat('fr-FR').format(config.prospects) + ' prospects — <em>Données 100% fictives</em>' +
      '<button onclick="exitDemo()" style="background:rgba(0,0,0,.2);color:#FFF;border:none;border-radius:6px;padding:6px 16px;font-size:12px;font-weight:600;cursor:pointer;margin-left:8px;">✕ Quitter la démo</button>';
    mainContent.insertBefore(banner, mainContent.firstChild);
  }

  // Date display
  document.getElementById('current-date').textContent =
    now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ' (Simulation)';

  // Show all director nav items (in case admin launched demo)
  const directorSections = ['overview','map','leaderboard','delegues','prospects','visits','alerts','reports','trends','predictions','analytics','points','import','subscription','settings','formations','order-validation','assignments','planning'];
  directorSections.forEach(s => {
    const nav = document.querySelector('.nav-item[data-section="' + s + '"]');
    if (nav) nav.style.display = '';
  });

  // Disable features not available in plan — truly unclickable
  const disableNav = (section, msg) => {
    const nav = document.querySelector('.nav-item[data-section="' + section + '"]');
    if (nav) {
      nav.style.opacity = '0.35';
      nav.style.pointerEvents = 'none';
      nav.title = msg;
    }
  };
  if (!config.hasAI) disableNav('predictions', 'Disponible dans le forfait Enterprise');
  if (!config.hasImport) disableNav('import', 'Disponible dans le forfait Pro');
  if (!config.hasAnalytics) disableNav('trends', 'Disponible dans le forfait Pro');

  // Show BI nav only for Enterprise
  const biNav = document.querySelector('.bi-enterprise-only');
  if (biNav) biNav.style.display = plan === 'enterprise' ? '' : 'none';

  // Subscription badge
  const subBadge = document.getElementById('subscription-badge');
  if (subBadge) {
    subBadge.textContent = plan.toUpperCase();
    subBadge.style.display = 'inline-block';
    subBadge.style.background = plan === 'enterprise' ? '#8B5CF6' : plan === 'pro' ? '#0D6B6E' : '#6B7280';
  }

  // Hide admin-only sections in demo
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');



  // Navigate to overview
  navigateTo('overview');

  console.log('[DEMO] ' + plan.toUpperCase() + ' — ' + config.company + ' — ' + config.agentCount + ' agents, ' + config.prospects + ' prospects');
}

function exitDemo() {
  DEMO_MODE.active = false;
  DEMO_MODE.plan = null;
  localStorage.removeItem('maydeni_demo_mode');
  location.reload();
}

// ═══════════════════════════════════════════════════════════
// BUSINESS ANALYTICS (Enterprise)
// ═══════════════════════════════════════════════════════════

let biChartTrend = null;
let biChartWeekday = null;

// ── BI Quick Widget on Overview page ─────────────────────
async function loadBIOverviewWidget() {
  const widget = document.getElementById('bi-overview-widget');
  if (!widget) return;
  try {
    const access = await api.checkBIAccess();
    if (!access.has_access) { widget.style.display = 'none'; return; }

    widget.style.display = 'block';
    const data = await api.generateBI(6); // 6 months for quick overview
    if (!data || !data.kpi) return;

    const kpi = data.kpi;
    const fmt = (v) => new Intl.NumberFormat('fr-FR').format(Math.round(v));
    const fmtD = (v) => new Intl.NumberFormat('fr-FR', {minimumFractionDigits:1,maximumFractionDigits:1}).format(v);

    // Mini KPI cards
    const kpiGrid = document.getElementById('bi-overview-kpis');
    const items = [
      { label: 'CA 6 mois', value: fmt(kpi.total_revenue) + ' ' + TENANT_CURRENCY_SYMBOL, color: '#10B981' },
      { label: 'Commandes', value: fmt(kpi.total_orders), color: '#3B82F6' },
      { label: 'Panier Moyen', value: fmt(kpi.avg_order_value) + ' ' + TENANT_CURRENCY_SYMBOL, color: '#8B5CF6' },
      { label: 'Croissance', value: (kpi.revenue_growth_pct >= 0 ? '+' : '') + fmtD(kpi.revenue_growth_pct) + '%', color: kpi.revenue_growth_pct >= 0 ? '#10B981' : '#EF4444' },
      { label: 'Conversion', value: fmtD(kpi.visit_to_order_pct) + '%', color: '#F59E0B' },
      { label: 'Clients actifs', value: fmt(kpi.unique_clients), color: '#0D6B6E' },
    ];
    kpiGrid.innerHTML = items.map(k => `
      <div style="text-align:center;padding:12px;background:var(--surface);border-radius:10px;border-top:3px solid ${k.color};">
        <div style="font-size:20px;font-weight:700;color:var(--text);">${k.value}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px;">${k.label}</div>
      </div>
    `).join('');

    // Forecast mini
    const forecastEl = document.getElementById('bi-overview-forecast');
    if (data.forecast) {
      const f = data.forecast;
      const tColor = f.trend === 'hausse' ? '#10B981' : f.trend === 'baisse' ? '#EF4444' : '#6B7280';
      forecastEl.innerHTML = `
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:10px;"><i data-lucide="trending-up" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:4px;color:${tColor};"></i> Prévision IA</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <div><div style="font-size:11px;color:var(--muted);">Mois prochain</div><div style="font-size:18px;font-weight:700;">${fmt(f.next_month)} ${TENANT_CURRENCY_SYMBOL}</div></div>
          <div><div style="font-size:11px;color:var(--muted);">Trimestre</div><div style="font-size:18px;font-weight:700;">${fmt(f.next_quarter)} ${TENANT_CURRENCY_SYMBOL}</div></div>
        </div>
        <div style="margin-top:8px;font-size:12px;color:var(--muted);">Tendance : <span style="color:${tColor};font-weight:600;">${f.trend}</span> • Confiance : ${f.confidence}</div>`;
    } else {
      forecastEl.innerHTML = '<div style="font-size:13px;color:var(--muted);padding:12px;">Données insuffisantes pour les prévisions.</div>';
    }

    // RFM mini
    const rfmEl = document.getElementById('bi-overview-rfm');
    if (data.rfm_segments && data.rfm_segments.segments) {
      const segs = data.rfm_segments.segments;
      rfmEl.innerHTML = `
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:10px;"><i data-lucide="pie-chart" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:4px;color:#8B5CF6;"></i> Segmentation Clients</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${Object.values(segs).map(s => `
            <div style="display:flex;align-items:center;gap:6px;background:var(--card-bg);border-radius:8px;padding:6px 10px;">
              <div style="width:10px;height:10px;border-radius:50%;background:${s.color};"></div>
              <span style="font-size:12px;color:var(--text);"><strong>${s.count}</strong> ${s.label}</span>
            </div>
          `).join('')}
        </div>`;
    } else {
      rfmEl.innerHTML = '<div style="font-size:13px;color:var(--muted);padding:12px;">Aucune donnée de segmentation.</div>';
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (e) {
    widget.style.display = 'none';
    console.warn('BI overview widget skipped:', e.message || e);
  }
}

async function checkBIAccess() {
  try {
    // Admin doesn't need BI nav — it's a director feature
    const user = api.user;
    if (user && user.role === 'admin' && !DEMO_MODE.active) return;

    const result = await api.checkBIAccess();
    const navItem = document.querySelector('.bi-enterprise-only');
    if (!navItem) return;
    if (result.has_access) {
      navItem.style.display = '';
      navItem.querySelector('.nav-badge').style.display = 'none';
    } else {
      // Show nav for all so they can see the upgrade prompt
      navItem.style.display = '';
    }
  } catch (e) {
    console.warn('BI access check failed:', e);
  }
}

async function loadBusinessAnalytics() {
  try {
    const access = await api.checkBIAccess();
    const upgradeEl = document.getElementById('bi-upgrade-prompt');
    const contentEl = document.getElementById('bi-content');
    const actionsEl = document.getElementById('bi-actions');

    if (!access.has_access) {
      upgradeEl.style.display = '';
      contentEl.style.display = 'none';
      actionsEl.style.display = 'none';
      lucide.createIcons();
      return;
    }

    upgradeEl.style.display = 'none';
    contentEl.style.display = '';
    actionsEl.style.display = 'flex';

    const months = parseInt(document.getElementById('bi-period').value) || 12;
    const data = await api.generateBI(months);
    renderBI(data);
  } catch (err) {
    console.error('Erreur Business Analytics:', err);
    const contentEl = document.getElementById('bi-content');
    if (contentEl) contentEl.innerHTML = '<div class="alert alert-danger">Erreur lors du chargement des analytics.</div>';
  }
}

function renderBI(data) {
  if (!data || !data.kpi) return;
  const kpi = data.kpi;
  const fmt = (v) => new Intl.NumberFormat('fr-FR').format(Math.round(v));
  const fmtD = (v) => new Intl.NumberFormat('fr-FR', {minimumFractionDigits:1,maximumFractionDigits:1}).format(v);

  // ─── KPI Cards ───────────────────────────────────
  const kpiGrid = document.getElementById('bi-kpi-grid');
  const kpiItems = [
    { label: 'CA Total', value: fmt(kpi.total_revenue) + ' ' + TENANT_CURRENCY_SYMBOL, icon: 'banknote', color: '#10B981' },
    { label: 'Commandes', value: fmt(kpi.total_orders), icon: 'shopping-cart', color: '#3B82F6' },
    { label: 'Panier Moyen', value: fmt(kpi.avg_order_value) + ' ' + TENANT_CURRENCY_SYMBOL, icon: 'receipt', color: '#8B5CF6' },
    { label: 'Clients Actifs', value: fmt(kpi.unique_clients), icon: 'users', color: '#F59E0B' },
    { label: 'Agents Actifs', value: fmt(kpi.active_agents), icon: 'user-check', color: '#0D6B6E' },
    { label: 'Visites', value: fmt(kpi.total_visits), icon: 'map-pin', color: '#6366F1' },
    { label: 'Conversion Visite→Cmd', value: fmtD(kpi.visit_to_order_pct) + '%', icon: 'target', color: kpi.visit_to_order_pct >= 20 ? '#10B981' : '#EF4444' },
    { label: 'Croissance CA', value: (kpi.revenue_growth_pct >= 0 ? '+' : '') + fmtD(kpi.revenue_growth_pct) + '%', icon: 'trending-up', color: kpi.revenue_growth_pct >= 0 ? '#10B981' : '#EF4444' },
  ];
  kpiGrid.innerHTML = kpiItems.map(k => `
    <div class="stat-card" style="border-top:3px solid ${k.color};">
      <div class="stat-icon" style="color:${k.color};"><i data-lucide="${k.icon}" style="width:20px;height:20px;"></i></div>
      <div class="stat-value">${k.value}</div>
      <div class="stat-label">${k.label}</div>
    </div>
  `).join('');

  // ─── Forecast ─────────────────────────────────────
  const forecastEl = document.getElementById('bi-forecast-content');
  if (data.forecast) {
    const f = data.forecast;
    const trendIcon = f.trend === 'hausse' ? 'trending-up' : f.trend === 'baisse' ? 'trending-down' : 'minus';
    const trendColor = f.trend === 'hausse' ? '#10B981' : f.trend === 'baisse' ? '#EF4444' : '#6B7280';
    const confBadge = f.confidence === 'haute' ? '#10B981' : f.confidence === 'moyenne' ? '#F59E0B' : '#EF4444';
    forecastEl.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">
        <div style="background:var(--surface);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:12px;color:var(--muted);margin-bottom:4px;">Prévision Mois Prochain</div>
          <div style="font-size:24px;font-weight:700;color:var(--text);">${fmt(f.next_month)} ${TENANT_CURRENCY_SYMBOL}</div>
        </div>
        <div style="background:var(--surface);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:12px;color:var(--muted);margin-bottom:4px;">Prévision Trimestre</div>
          <div style="font-size:24px;font-weight:700;color:var(--text);">${fmt(f.next_quarter)} ${TENANT_CURRENCY_SYMBOL}</div>
        </div>
        <div style="background:var(--surface);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:12px;color:var(--muted);margin-bottom:4px;">Tendance</div>
          <div style="font-size:20px;font-weight:600;color:${trendColor};"><i data-lucide="${trendIcon}" style="width:20px;height:20px;display:inline;vertical-align:middle;margin-right:4px;"></i> ${f.trend.charAt(0).toUpperCase() + f.trend.slice(1)}</div>
        </div>
        <div style="background:var(--surface);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:12px;color:var(--muted);margin-bottom:4px;">Confiance (R²: ${f.r2})</div>
          <div style="font-size:16px;font-weight:600;"><span style="background:${confBadge};color:#FFF;padding:4px 12px;border-radius:20px;">${f.confidence.charAt(0).toUpperCase() + f.confidence.slice(1)}</span></div>
        </div>
      </div>`;
  } else {
    forecastEl.innerHTML = '<p style="color:var(--muted);text-align:center;">Données insuffisantes pour la prévision (minimum 3 mois requis).</p>';
  }

  // ─── Monthly Trend Chart ──────────────────────────
  if (data.monthly_trend && data.monthly_trend.length > 0) {
    const ctx = document.getElementById('bi-trend-chart');
    if (biChartTrend) biChartTrend.destroy();
    biChartTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.monthly_trend.map(m => m.month),
        datasets: [{
          label: 'CA (' + TENANT_CURRENCY_SYMBOL + ')',
          data: data.monthly_trend.map(m => m.revenue),
          borderColor: '#0D6B6E',
          backgroundColor: 'rgba(13,107,110,0.1)',
          fill: true,
          tension: 0.3,
        }, {
          label: 'Commandes',
          data: data.monthly_trend.map(m => m.orders),
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245,158,11,0.1)',
          fill: false,
          tension: 0.3,
          yAxisID: 'y1',
        }],
      },
      options: {
        responsive: true,
        interaction: { intersect: false, mode: 'index' },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'CA (' + TENANT_CURRENCY_SYMBOL + ')' } },
          y1: { position: 'right', beginAtZero: true, title: { display: true, text: 'Commandes' }, grid: { drawOnChartArea: false } },
        },
      },
    });
  }

  // ─── Weekday Chart ────────────────────────────────
  if (data.weekday_analysis && data.weekday_analysis.length > 0) {
    const ctx = document.getElementById('bi-weekday-chart');
    if (biChartWeekday) biChartWeekday.destroy();
    biChartWeekday = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.weekday_analysis.map(d => d.day),
        datasets: [{
          label: 'CA (' + TENANT_CURRENCY_SYMBOL + ')',
          data: data.weekday_analysis.map(d => d.revenue),
          backgroundColor: '#0D6B6E',
          borderRadius: 6,
        }, {
          label: 'Commandes',
          data: data.weekday_analysis.map(d => d.orders),
          backgroundColor: '#4DC9D9',
          borderRadius: 6,
        }],
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } },
    });
  }

  // ─── Agent Performance ────────────────────────────
  const agentsEl = document.getElementById('bi-agents-content');
  if (data.agents && data.agents.length > 0) {
    agentsEl.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>Agent</th><th>Visites</th><th>Commandes</th><th>CA</th><th>Score</th></tr></thead>
          <tbody>${data.agents.slice(0, 15).map((a, i) => `
            <tr>
              <td><strong>${i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}${escapeHtml(a.name)}</strong></td>
              <td>${a.visits}</td>
              <td>${a.orders}</td>
              <td><strong>${fmt(a.revenue)} ${TENANT_CURRENCY_SYMBOL}</strong></td>
              <td>${a.score || 0}</td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>`;
  } else {
    agentsEl.innerHTML = '<p style="color:var(--muted);text-align:center;">Aucune donnée agent.</p>';
  }

  // ─── Agent Efficiency ─────────────────────────────
  const effEl = document.getElementById('bi-efficiency-content');
  if (data.agent_efficiency && data.agent_efficiency.length > 0) {
    effEl.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>Agent</th><th>Visites</th><th>Conv. %</th><th>CA/Visite</th></tr></thead>
          <tbody>${data.agent_efficiency.slice(0, 15).map(a => `
            <tr>
              <td>${escapeHtml(a.name)}</td>
              <td>${a.visits}</td>
              <td><span style="color:${a.conversion_pct >= 20 ? '#10B981' : a.conversion_pct >= 10 ? '#F59E0B' : '#EF4444'};font-weight:600;">${fmtD(a.conversion_pct)}%</span></td>
              <td>${fmt(a.revenue_per_visit)} ${TENANT_CURRENCY_SYMBOL}</td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>`;
  } else {
    effEl.innerHTML = '<p style="color:var(--muted);text-align:center;">Aucune donnée.</p>';
  }

  // ─── Products Pareto ──────────────────────────────
  const prodEl = document.getElementById('bi-products-content');
  if (data.products && data.products.length > 0) {
    prodEl.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>Produit</th><th>Qté</th><th>CA</th><th>% CA</th><th>Cumul %</th><th>Clients</th></tr></thead>
          <tbody>${data.products.map(p => `
            <tr>
              <td><strong>${escapeHtml(p.product_name || 'N/A')}</strong></td>
              <td>${fmt(p.total_qty)}</td>
              <td>${fmt(p.revenue)} ${TENANT_CURRENCY_SYMBOL}</td>
              <td>${fmtD(p.revenue_pct)}%</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="flex:1;background:#E5E7EB;border-radius:4px;height:8px;"><div style="width:${Math.min(p.cumulative_pct, 100)}%;background:${p.cumulative_pct <= 80 ? '#10B981' : '#F59E0B'};border-radius:4px;height:100%;"></div></div>
                  <span style="font-size:12px;white-space:nowrap;">${fmtD(p.cumulative_pct)}%</span>
                </div>
              </td>
              <td>${p.client_count}</td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>
      <p style="font-size:12px;color:var(--muted);margin-top:8px;"><i data-lucide="info" style="width:12px;height:12px;display:inline;vertical-align:middle;margin-right:4px;"></i> Règle de Pareto : ~20% des produits génèrent ~80% du CA.</p>`;
  } else {
    prodEl.innerHTML = '<p style="color:var(--muted);text-align:center;">Aucune donnée produit.</p>';
  }

  // ─── Zones ────────────────────────────────────────
  const zonesEl = document.getElementById('bi-zones-content');
  if (data.zones && data.zones.length > 0) {
    zonesEl.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>Zone</th><th>Prospects</th><th>Actifs</th><th>Pénétration</th><th>CA</th></tr></thead>
          <tbody>${data.zones.slice(0, 20).map(z => `
            <tr>
              <td><strong>${escapeHtml(z.zone)}</strong></td>
              <td>${z.prospects}</td>
              <td>${z.active_clients}</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="flex:1;background:#E5E7EB;border-radius:4px;height:8px;max-width:80px;"><div style="width:${Math.min(z.penetration_pct, 100)}%;background:${z.penetration_pct >= 50 ? '#10B981' : z.penetration_pct >= 25 ? '#F59E0B' : '#EF4444'};border-radius:4px;height:100%;"></div></div>
                  <span style="font-size:12px;">${fmtD(z.penetration_pct)}%</span>
                </div>
              </td>
              <td>${fmt(z.revenue)} ${TENANT_CURRENCY_SYMBOL}</td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>`;
  } else {
    zonesEl.innerHTML = '<p style="color:var(--muted);text-align:center;">Aucune donnée zone.</p>';
  }

  // ─── RFM Segmentation ─────────────────────────────
  const rfmEl = document.getElementById('bi-rfm-content');
  if (data.rfm_segments && data.rfm_segments.segments) {
    const segs = data.rfm_segments.segments;
    const totalRFM = Object.values(segs).reduce((s, seg) => s + seg.count, 0);
    rfmEl.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px;">
        ${Object.entries(segs).map(([key, seg]) => `
          <div style="background:var(--surface);border-radius:12px;padding:16px;text-align:center;border-left:4px solid ${seg.color};">
            <div style="font-size:24px;font-weight:700;color:${seg.color};">${seg.count}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px;">${seg.label}</div>
            <div style="font-size:11px;color:var(--muted);">${totalRFM > 0 ? Math.round(seg.count / totalRFM * 100) : 0}%</div>
          </div>
        `).join('')}
      </div>
      <p style="font-size:12px;color:var(--muted);"><i data-lucide="info" style="width:12px;height:12px;display:inline;vertical-align:middle;margin-right:4px;"></i> Segmentation RFM : Récence (dernier achat) × Fréquence (nombre de commandes) × Montant (volume d'achat).</p>`;
  } else {
    rfmEl.innerHTML = '<p style="color:var(--muted);text-align:center;">Aucune donnée RFM.</p>';
  }

  // ─── Top Clients ──────────────────────────────────
  const topEl = document.getElementById('bi-top-clients');
  if (data.top_clients && data.top_clients.length > 0) {
    topEl.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>#</th><th>Client</th><th>Ville</th><th>Cmd</th><th>CA</th></tr></thead>
          <tbody>${data.top_clients.map((c, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><strong>${escapeHtml(c.name)}</strong></td>
              <td>${escapeHtml(c.city || '-')}</td>
              <td>${c.orders}</td>
              <td><strong>${fmt(c.revenue)} ${TENANT_CURRENCY_SYMBOL}</strong></td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>`;
  } else {
    topEl.innerHTML = '<p style="color:var(--muted);text-align:center;">Aucun client.</p>';
  }

  // ─── Clients at Risk ──────────────────────────────
  const riskEl = document.getElementById('bi-risk-clients');
  if (data.clients_at_risk && data.clients_at_risk.length > 0) {
    riskEl.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>Client</th><th>Ville</th><th>Inactif</th><th>Hist. CA</th></tr></thead>
          <tbody>${data.clients_at_risk.slice(0, 15).map(c => `
            <tr>
              <td><strong>${escapeHtml(c.name)}</strong></td>
              <td>${escapeHtml(c.city || '-')}</td>
              <td><span style="color:#EF4444;font-weight:600;">${c.days_inactive}j</span></td>
              <td>${fmt(c.historical_revenue)} ${TENANT_CURRENCY_SYMBOL}</td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>
      <p style="font-size:12px;color:var(--muted);margin-top:8px;"><i data-lucide="alert-triangle" style="width:12px;height:12px;display:inline;vertical-align:middle;margin-right:4px;color:#EF4444;"></i> Clients ayant commandé par le passé mais inactifs depuis 60+ jours.</p>`;
  } else {
    riskEl.innerHTML = '<p style="color:var(--muted);text-align:center;">Aucun client à risque détecté.</p>';
  }

  lucide.createIcons();
}

async function exportBIData() {
  try {
    const data = await api.exportBIData();
    if (!data || !data.data) return;
    // Generate CSV for each dataset
    const sheets = Object.entries(data.data);
    sheets.forEach(([name, rows]) => {
      if (!rows || rows.length === 0) return;
      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(';'),
        ...rows.map(r => headers.map(h => {
          let v = r[h];
          if (v === null || v === undefined) v = '';
          if (typeof v === 'object') v = JSON.stringify(v);
          return String(v).replace(/;/g, ',').replace(/\n/g, ' ');
        }).join(';')),
      ].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bi_export_${name}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  } catch (err) {
    console.error('Erreur export BI:', err);
    alert('Erreur lors de l\'export. Veuillez réessayer.');
  }
}

// ═══════════════════════════════════════════════════════════
// GESTION DES LICENCES
// ═══════════════════════════════════════════════════════════

async function loadLicensesSection() {
  try {
    const data = await api.get('/licenses');
    const licenses = data.licenses || [];

    // Stats
    const total = licenses.length;
    const available = licenses.filter(l => l.status === 'available').length;
    const activated = licenses.filter(l => l.status === 'activated').length;
    const revoked = licenses.filter(l => l.status === 'revoked').length;

    document.getElementById('lic-total').textContent = total;
    document.getElementById('lic-available').textContent = available;
    document.getElementById('lic-activated').textContent = activated;
    document.getElementById('lic-revoked').textContent = revoked;

    // Table
    const tbody = document.getElementById('licenses-table-body');
    if (licenses.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-light);">Aucune licence. Cliquez sur "Générer une licence" pour commencer.</td></tr>';
    } else {
      tbody.innerHTML = licenses.map(l => {
        const statusBadge = {
          'available': '<span style="background:#ECFDF5;color:#10B981;padding:4px 10px;border-radius:20px;font-weight:600;font-size:11px;">Disponible</span>',
          'activated': '<span style="background:#FEF3C7;color:#D97706;padding:4px 10px;border-radius:20px;font-weight:600;font-size:11px;">Activée</span>',
          'revoked': '<span style="background:#FEE2E2;color:#EF4444;padding:4px 10px;border-radius:20px;font-weight:600;font-size:11px;">Révoquée</span>',
        }[l.status] || l.status;

        const date = l.activated_at ? new Date(l.activated_at).toLocaleDateString('fr-FR') : new Date(l.created_at).toLocaleDateString('fr-FR');
        const client = l.tenant_name || l.buyer_name || '—';
        const actions = l.status === 'available'
          ? `<button onclick="copyLicenseKey('${l.license_key}')" style="background:var(--teal);color:#FFF;border:none;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:11px;margin-right:4px;" title="Copier la clé">Copier</button>
             <button onclick="revokeLicense('${l.id}')" style="background:#FEE2E2;color:#EF4444;border:none;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:11px;" title="Révoquer">Révoquer</button>`
          : l.status === 'activated'
          ? `<span style="color:var(--text-light);font-size:11px;">Liée à ${client}</span>`
          : '<span style="color:var(--text-light);font-size:11px;">—</span>';

        return `<tr style="border-bottom:1px solid var(--border-color);">
          <td style="padding:10px 16px;font-family:monospace;font-weight:700;letter-spacing:1px;">${l.license_key}</td>
          <td style="padding:10px 16px;">${l.plan_name}</td>
          <td style="padding:10px 16px;text-align:right;font-weight:600;">${parseFloat(l.price_dt).toLocaleString()} ${TENANT_CURRENCY_SYMBOL} <small style="font-size:.75em;opacity:.5">HT</small></td>
          <td style="padding:10px 16px;text-align:center;">${statusBadge}</td>
          <td style="padding:10px 16px;">${client}</td>
          <td style="padding:10px 16px;color:var(--text-light);">${date}</td>
          <td style="padding:10px 16px;text-align:center;">${actions}</td>
        </tr>`;
      }).join('');
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) {
    console.error('Erreur chargement licences:', err);
  }
}

function copyLicenseKey(key) {
  navigator.clipboard.writeText(key).then(() => {
    showToast('Clé copiée: ' + key, 'success');
  }).catch(() => {
    prompt('Copier la clé:', key);
  });
}

async function revokeLicense(id) {
  if (!confirm('Révoquer cette licence ? Cette action est irréversible.')) return;
  try {
    await api.post('/licenses/revoke/' + id);
    showToast('Licence révoquée', 'success');
    loadLicensesSection();
  } catch (err) {
    showToast('Erreur: ' + err.message, 'error');
  }
}

function showGenerateLicenseModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width:480px;">
      <div class="modal-header">
        <h2 style="margin:0;">Générer une licence</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body" style="padding:24px;">
        <div style="margin-bottom:16px;">
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:13px;">Forfait</label>
          <select id="gen-plan" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;">
            <option value="1">Starter — 5 agents — 1 500 ${TENANT_CURRENCY_SYMBOL}</option>
            <option value="2">Pro — 12 agents — 3 500 ${TENANT_CURRENCY_SYMBOL}</option>
            <option value="3">Enterprise — Illimité — 6 000 ${TENANT_CURRENCY_SYMBOL}</option>
          </select>
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:13px;">Nom du client (optionnel)</label>
          <input type="text" id="gen-buyer" placeholder="Ex: Société ABC" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;box-sizing:border-box;">
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:13px;">Email client (optionnel)</label>
          <input type="email" id="gen-email" placeholder="client@email.com" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;box-sizing:border-box;">
        </div>
        <div style="margin-bottom:20px;">
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:13px;">Téléphone (optionnel)</label>
          <input type="text" id="gen-phone" placeholder="+216 XX XXX XXX" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;box-sizing:border-box;">
        </div>
        <button onclick="generateLicense()" class="btn-primary" style="width:100%;padding:12px;font-size:15px;font-weight:700;">
          Générer la clé de licence
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function generateLicense() {
  const plan_id = parseInt(document.getElementById('gen-plan').value);
  const buyer_name = document.getElementById('gen-buyer').value.trim();
  const buyer_email = document.getElementById('gen-email').value.trim();
  const buyer_phone = document.getElementById('gen-phone').value.trim();

  try {
    const data = await api.post('/licenses/generate', { plan_id, count: 1, buyer_name, buyer_email, buyer_phone });

    document.querySelector('.modal-overlay').remove();

    if (data.licenses && data.licenses.length > 0) {
      const lic = data.licenses[0];
      // Show key in a prominent dialog
      const keyModal = document.createElement('div');
      keyModal.className = 'modal-overlay';
      keyModal.innerHTML = `
        <div class="modal" style="max-width:500px;text-align:center;">
          <div class="modal-body" style="padding:32px;">
            <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#10B981,#059669);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
              <i data-lucide="key-round" style="width:28px;height:28px;color:#FFF;"></i>
            </div>
            <h2 style="margin:0 0 8px;">Licence générée !</h2>
            <p style="color:var(--text-light);margin:0 0 20px;">${lic.plan} — ${parseFloat(lic.price_dt).toLocaleString()} ${TENANT_CURRENCY_SYMBOL}</p>
            <div style="background:var(--bg-dark);border-radius:12px;padding:16px;margin-bottom:20px;">
              <div style="font-family:monospace;font-size:22px;font-weight:800;letter-spacing:3px;color:#FFF;">${lic.license_key}</div>
            </div>
            <p style="font-size:12px;color:var(--text-light);margin-bottom:20px;">Cette clé ne peut être utilisée qu'une seule fois. Communiquez-la au client.</p>
            <button onclick="copyLicenseKey('${lic.license_key}');this.closest('.modal-overlay').remove();" class="btn-primary" style="width:100%;padding:12px;font-size:15px;">
              Copier la clé & Fermer
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(keyModal);
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    loadLicensesSection();
  } catch (err) {
    showToast('Erreur: ' + (err.message || 'Génération échouée'), 'error');
  }
}

// ═══════════════════════════════════════════════════════════
// FORMATIONS SECTION — Stub (feature coming soon)
// ═══════════════════════════════════════════════════════════
function loadFormationsSection() {
  const main = document.getElementById('main-content');
  if (main) {
    main.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-light);">
      <i data-lucide="book-open" style="width:48px;height:48px;margin-bottom:16px;opacity:.4"></i>
      <h3>Formations</h3>
      <p>Cette section sera bientôt disponible.</p>
    </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}
