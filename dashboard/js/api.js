/**
 * Maydeni AI — API Client (Dashboard)
 * Smart Field Operations
 */

// Serveur Maydeni — tout est automatique, aucune configuration nécessaire
// Le serveur central gère tous les tenants, chaque directeur accède à SES données via son token
// SECURITY: API_BASE is hardcoded — never accept apiUrl from query params (credential theft vector)
const API_BASE = window.MAYDENI_API_URL || 'https://mega-supervision-api.onrender.com/api';

function getServerUrl() { return API_BASE; }

class MaydeniAPI {
  constructor() {
    // sessionStorage only — credentials never persist after tab/browser close
    this.token = sessionStorage.getItem('fp_token');
    this.user = JSON.parse(sessionStorage.getItem('fp_user') || 'null');
    this.tenant = JSON.parse(sessionStorage.getItem('fp_tenant') || 'null');
  }

  get headers() {
    const h = { 'Content-Type': 'application/json' };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  }

  setAuth(token, user, tenant = null) {
    this.token = token;
    this.user = user;
    this.tenant = tenant;
    sessionStorage.setItem('fp_token', token);
    sessionStorage.setItem('fp_user', JSON.stringify(user));
    if (tenant) sessionStorage.setItem('fp_tenant', JSON.stringify(tenant));
  }

  clearAuth() {
    this.token = null;
    this.user = null;
    this.tenant = null;
    sessionStorage.removeItem('fp_token');
    sessionStorage.removeItem('fp_user');
    sessionStorage.removeItem('fp_tenant');
  }

  isAuthenticated() {
    return !!this.token;
  }

  // Generic request: accepts (method, path, body) OR (path, method, body)
  async request(methodOrPath, pathOrMethod = null, body = null) {
    let method, path;
    // If first arg starts with '/', it's (path, method, body) style
    if (typeof methodOrPath === 'string' && methodOrPath.startsWith('/')) {
      path = methodOrPath;
      method = pathOrMethod || 'GET';
    } else {
      method = methodOrPath;
      path = pathOrMethod;
    }

    const opts = { method, headers: this.headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Erreur ${res.status}`);
    }

    return data;
  }

  // File upload (FormData)
  async uploadFile(path, formData) {
    const opts = {
      method: 'POST',
      headers: {},
      body: formData,
    };
    if (this.token) opts.headers['Authorization'] = `Bearer ${this.token}`;
    // Don't set Content-Type — browser sets multipart boundary automatically

    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
    return data;
  }

  // ─── Shorthand helpers ────────────────────────────────
  get(path) { return this.request('GET', path); }
  post(path, body) { return this.request('POST', path, body); }
  put(path, body) { return this.request('PUT', path, body); }
  del(path) { return this.request('DELETE', path); }

  // ─── Auth ─────────────────────────────────────────────
  login(username, password) {
    return this.request('POST', '/login', { username, password });
  }

  changePassword(currentPassword, newPassword) {
    return this.request('PUT', '/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  getMe() {
    return this.request('GET', '/me');
  }

  // ─── Users ────────────────────────────────────────────
  getUsers() {
    return this.request('GET', '/users');
  }

  createUser(data) {
    return this.request('POST', '/create-user', data);
  }

  deleteUser(id) {
    return this.request('DELETE', `/delete-user/${id}`);
  }

  // ─── Prospects ────────────────────────────────────────
  getProspects(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('GET', `/prospects${qs ? '?' + qs : ''}`);
  }

  getProspect(id) {
    return this.request('GET', `/prospects/${id}`);
  }

  getProspectCities() {
    return this.request('GET', '/prospects/cities');
  }

  // ─── Visits ───────────────────────────────────────────
  getAllVisits(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('GET', `/visits/all${qs ? '?' + qs : ''}`);
  }

  // ─── Orders ───────────────────────────────────────────
  getOrders(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('GET', `/orders${qs ? '?' + qs : ''}`);
  }

  // ─── Validation preuves commandes ─────────────────────
  getPendingOrders() {
    return this.request('GET', '/orders/pending');
  }

  getPendingOrdersCount() {
    return this.request('GET', '/orders/pending/count');
  }

  validateOrder(id, decision, rejection_reason) {
    return this.request('PUT', `/orders/${id}/validate`, { decision, rejection_reason });
  }

  // ─── Affectations prospects ───────────────────────────
  getAssignments(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('GET', `/assignments${qs ? '?' + qs : ''}`);
  }

  getAssignmentsSummary() {
    return this.request('GET', '/assignments/summary');
  }

  assignProspects(user_id, prospect_ids) {
    return this.request('POST', '/assignments', { user_id, prospect_ids });
  }

  replaceAssignments(user_id, prospect_ids) {
    return this.request('PUT', '/assignments/replace', { user_id, prospect_ids });
  }

  deleteAssignment(id) {
    return this.request('DELETE', `/assignments/${id}`);
  }

  // ─── Planning visites ────────────────────────────────
  getPlanning(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('GET', `/planning${qs ? '?' + qs : ''}`);
  }

  getPlanningStats(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('GET', `/planning/stats${qs ? '?' + qs : ''}`);
  }

  createPlanning(plans) {
    return this.request('POST', '/planning', { plans });
  }

  updatePlan(id, data) {
    return this.request('PUT', `/planning/${id}`, data);
  }

  deletePlan(id) {
    return this.request('DELETE', `/planning/${id}`);
  }

  // ─── Dashboard ────────────────────────────────────────
  getStats() {
    return this.request('GET', '/dashboard/stats');
  }

  getLeaderboard() {
    return this.request('GET', '/dashboard/leaderboard');
  }

  getAlerts() {
    return this.request('GET', '/dashboard/alerts');
  }

  getHeatmap(days = 30) {
    return this.request('GET', `/dashboard/heatmap?days=${days}`);
  }

  getDailyReport(date) {
    return this.request('GET', `/dashboard/daily-report${date ? '?date=' + date : ''}`);
  }

  getGeofenceSettings() {
    return this.request('GET', '/dashboard/geofence-settings');
  }

  updateGeofenceSetting(data) {
    return this.request('PUT', '/dashboard/geofence-settings', data);
  }

  // ─── GPS Live ─────────────────────────────────────────
  getGpsLive() {
    return this.request('GET', '/gps/live');
  }

  // ─── GPS Schedule ─────────────────────────────────────
  getGpsSchedule() {
    return this.request('GET', '/dashboard/gps-schedule');
  }

  updateGpsSchedule(schedule) {
    return this.request('PUT', '/dashboard/gps-schedule', { schedule });
  }

  // ─── Reports ──────────────────────────────────────────
  async generateReport(dateFrom, dateTo, format = 'json') {
    if (format === 'csv' || format === 'excel' || format === 'pdf') {
      const res = await fetch(
        `${API_BASE}/reports/generate?date_from=${dateFrom}&date_to=${dateTo}&format=${format}`,
        { headers: this.headers }
      );
      if (!res.ok) throw new Error('Erreur export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = format === 'excel' ? 'xlsx' : format;
      a.download = `rapport_${dateFrom}_${dateTo}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      return { downloaded: true };
    }
    return this.request('GET', `/reports/generate?date_from=${dateFrom}&date_to=${dateTo}&format=${format}`);
  }

  // ─── Analytics (Tendances) ────────────────────────────
  getRevenueTrend(months = 6, groupBy = 'month') {
    return this.request('GET', `/analytics/revenue-trend?months=${months}&group_by=${groupBy}`);
  }

  getRevenueByProduct(months = 6) {
    return this.request('GET', `/analytics/revenue-by-product?months=${months}`);
  }

  getRevenueByProductTrend(months = 6) {
    return this.request('GET', `/analytics/revenue-by-product-trend?months=${months}`);
  }

  getRevenueByDelegue(months = 6) {
    return this.request('GET', `/analytics/revenue-by-delegue?months=${months}`);
  }

  getRevenueByZone(months = 6) {
    return this.request('GET', `/analytics/revenue-by-zone?months=${months}`);
  }

  getDropDetection(threshold = 20) {
    return this.request('GET', `/analytics/drop-detection?threshold=${threshold}`);
  }

  getDelegueDropDetection() {
    return this.request('GET', `/analytics/delegue-drop-detection`);
  }

  // ─── Prédictions IA ───────────────────────────────────
  getPredictionsSummary() {
    return this.request('GET', '/predictions/summary');
  }

  getRevenueForecast() {
    return this.request('GET', '/predictions/revenue-forecast');
  }

  getZonesAnalysis() {
    return this.request('GET', '/predictions/zones');
  }

  getProspectScoring(minScore = 0) {
    return this.request('GET', `/predictions/prospect-scoring?min_score=${minScore}`);
  }

  getStockForecast() {
    return this.request('GET', '/predictions/stock-forecast');
  }

  // ─── Business Intelligence (Enterprise) ──────────────
  checkBIAccess() {
    return this.request('GET', '/bi/check-access');
  }

  generateBI(months = 12) {
    return this.request('GET', `/bi/generate?months=${months}`);
  }

  exportBIData() {
    return this.request('GET', '/bi/export');
  }

  // ─── Points & Conversions ─────────────────────────────
  getPointsConfig() {
    return this.request('GET', '/points/config');
  }

  updatePointsConfig(pointsPerDt) {
    return this.request('PUT', '/points/config', { points_per_dt: pointsPerDt });
  }

  addPoints(userId, points, reason) {
    return this.request('POST', '/points/add', { user_id: userId, points, reason });
  }

  penalizeAgent(userId, reason, customPoints = null, penaltyNote = null) {
    const body = { user_id: userId, reason };
    if (customPoints) body.custom_points = customPoints;
    if (penaltyNote) body.penalty_note = penaltyNote;
    return this.request('POST', '/points/penalize', body);
  }

  getAgentNotifications() {
    return this.request('GET', '/points/notifications');
  }

  markPointsNotificationsRead() {
    return this.request('PUT', '/points/notifications/read');
  }

  getPointsHistory(userId) {
    return this.request('GET', `/points/history/${userId}`);
  }

  getConversionRequests(status) {
    const qs = status ? `?status=${status}` : '';
    return this.request('GET', `/points/requests${qs}`);
  }

  getPendingCount() {
    return this.request('GET', '/points/requests/pending/count');
  }

  reviewConversion(id, status, notes) {
    return this.request('PUT', `/points/requests/${id}`, { status, notes });
  }

  // ─── Payments & Billing ───────────────────────────────
  getPaymentHistory() {
    return this.request('GET', '/payments/history');
  }

  getPendingPayments() {
    return this.request('GET', '/payments/pending');
  }

  confirmPayment(paymentId) {
    return this.request('PUT', `/payments/confirm/${paymentId}`);
  }

  rejectPayment(paymentId) {
    return this.request('PUT', `/payments/reject/${paymentId}`);
  }

  getPaymentNotifications() {
    return this.request('GET', '/payments/notifications');
  }

  markPaymentNotificationsRead() {
    return this.request('PUT', '/payments/notifications/read');
  }

  getMySubscription() {
    return this.request('GET', '/payments/subscription');
  }

  initiatePayment(tenantId, billingMonths = 1) {
    return this.request('POST', '/payments/initiate', { tenant_id: tenantId, billing_months: billingMonths });
  }

  // ─── Multi-Currency ───────────────────────────────────
  getCurrencies() {
    return this.request('GET', '/payments/currencies');
  }

  convertPrice(amountDT, currency) {
    return this.request('GET', `/payments/convert-price?amount_dt=${amountDT}&currency=${currency}`);
  }
}

// Instance globale
const api = new MaydeniAPI();
