/**
 * Version 1.7.3 | 15 MAR 2026 | Siam Palette Group
 * ═══════════════════════════════════════════
 * SPG — BC Order v2
 * api_bcorder.js — API Client + Token Manager
 * Fix: Add cache-buster _t param to GET requests
 * ═══════════════════════════════════════════
 */

const API = (() => {
  const BASE = 'https://ahvzblrfzhtrjhvbzdhg.supabase.co/functions/v1/bakeryorder';
  const HOME_URL = 'https://onspider-spg.github.io/spg/';
  const LOGOUT_URL = 'https://onspider-spg.github.io/spg/#logout';
  const TK = 'spg_token';

  // ─── Static cache (categories only — localStorage + TTL) ───
  const _SC = {
    get(k) { try { const r = JSON.parse(localStorage.getItem('bo_c_' + k)); return r && Date.now() < r.x ? r.d : null; } catch { return null; } },
    set(k, d, mins) { try { localStorage.setItem('bo_c_' + k, JSON.stringify({ d, x: Date.now() + mins * 60000 })); } catch {} },
    clear() { Object.keys(localStorage).filter(k => k.startsWith('bo_c_')).forEach(k => localStorage.removeItem(k)); },
  };

  // ─── Token ───
  function getToken() { return localStorage.getItem(TK) || ''; }
  function setToken(t) { if (t) localStorage.setItem(TK, t); }
  function clearToken() { localStorage.removeItem(TK); }

  // ─── Core fetch (GET with query params) ───
  async function get(action, params = {}) {
    const qs = new URLSearchParams({ action, token: getToken(), _t: String(Date.now()), ...params });
    const resp = await fetch(BASE + '?' + qs, { method: 'GET' });
    const json = await resp.json();
    if (!json.success && json.error === 'INVALID_SESSION') {
      clearToken();
      _SC.clear();
      location.href = LOGOUT_URL;
      throw new Error('SESSION_EXPIRED');
    }
    return json;
  }

  // ─── Core fetch (POST with body) ───
  async function post(action, body = {}) {
    const qs = new URLSearchParams({ action, token: getToken() });
    const resp = await fetch(BASE + '?' + qs, { method: 'POST', body: JSON.stringify(body) });
    const json = await resp.json();
    if (!json.success && json.error === 'INVALID_SESSION') {
      clearToken();
      _SC.clear();
      location.href = LOGOUT_URL;
      throw new Error('SESSION_EXPIRED');
    }
    return json;
  }

  function logout() {
    clearToken();
    _SC.clear();
    location.href = LOGOUT_URL;
  }

  return {
    HOME_URL, LOGOUT_URL,
    getToken, setToken, clearToken, cache: _SC, logout,
    // ─── Existing Endpoints (33) ───
    initLite:       ()          => get('init_lite'),
    initBrowse:     (p = {})    => get('init_browse', p),
    getCategories:  ()          => get('get_categories'),
    getProducts:    (p = {})    => get('get_products', p),
    getDashboard:   ()          => get('get_dashboard'),
    getOrders:      (p = {})    => get('get_orders', p),
    getOrderDetail: (id)        => get('get_order_detail', { order_id: id }),
    getStock:       ()          => get('get_stock'),
    getWasteLog:    (p = {})    => get('get_waste_log', p),
    getReturns:     (p = {})    => get('get_returns', p),
    getQuotas:      (p = {})    => get('get_quotas', p),
    getStockHistory: (p = {})   => get('get_stock_history', p),
    createOrder:    (b)         => post('create_order', b),
    editOrder:      (b)         => post('edit_order', b),
    cancelOrder:    (b)         => post('cancel_order', b),
    acceptOrder:    (b)         => post('accept_order', b),
    rejectOrder:    (b)         => post('reject_order', b),
    updateFulfilment: (b)      => post('update_fulfilment', b),
    markDelivered:  (b)         => post('mark_delivered', b),
    getProductionSheet: (p = {}) => get('get_production_sheet', p),
    createWaste:    (b)         => post('create_waste', b),
    editWaste:      (b)         => post('edit_waste', b),
    deleteWaste:    (b)         => post('delete_waste', b),
    reportReturn:   (b)         => post('report_return', b),
    editReturn:     (b)         => post('edit_return', b),
    receiveReturn:  (b)         => post('receive_return', b),
    resolveReturn:  (b)         => post('resolve_return', b),
    saveQuotas:     (b)         => post('save_quotas', b),
    getAllProducts:  ()          => get('get_all_products'),
    saveProduct:    (b)         => post('save_product', b),
    // ─── Phase 7+: Admin + Reports (10 new) ───
    saveConfig:        (b)         => post('save_config', b),
    getDeptMapping:    ()          => get('get_dept_mapping'),
    saveDeptMapping:   (b)         => post('save_dept_mapping', b),
    toggleVisibility:  (b)         => post('toggle_visibility', b),
    getAccessMatrix:   ()          => get('get_access_matrix'),
    togglePermission:  (b)         => post('toggle_permission', b),
    getWasteDashboard: (p = {})    => get('get_waste_dashboard', p),
    getTopProducts:    (p = {})    => get('get_top_products', p),
    getCutoffViolations: (p = {})  => get('get_cutoff_violations', p),
    getAuditTrail:     (p = {})    => get('get_audit_trail', p),
    uploadImage:       (b)         => post('upload_image', b),
  };
})();
