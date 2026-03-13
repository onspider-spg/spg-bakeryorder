/**
 * Version 1.3 | 14 MAR 2026 | Siam Palette Group
 * ═══════════════════════════════════════════
 * SPG — BC Order v2
 * app_bcorder.js — Router + State + Sidebar + Cart + Utilities
 * Phase 2: Create Order support
 * ═══════════════════════════════════════════
 */

const App = (() => {
  // ═══ STATE ═══
  const S = {
    session: null, deptMapping: null, config: {},
    role: 'store', sidebarRole: 'store', permissions: [],
    stores: [], departments: [], orderingChannels: [],
    categories: [],  _catsLoaded: false,  _catsLoading: false,
    products: [],    _prodsLoaded: false, _prodsLoading: false,
    orders: [],      _ordersLoaded: false, _ordersLoading: false,
    stock: [],       _stockLoaded: false, _stockLoading: false,
    wasteLog: [],    _wasteLoaded: false, _wasteLoading: false,
    returns: [],     _retsLoaded: false,  _retsLoading: false,
    notifications: [], dashboard: {},
    // Quotas
    quotas: {},       _quotasDay: -1,
    quotaMap: {},     // full 7-day map for quota screen
    // Cart + Order
    cart: [], deliveryDate: '', headerNote: '', editingOrderId: null,
    currentOrder: null,
    productSearch: '', productFilter: 'all',
    sidebarCollapsed: false,
  };

  const appEl = () => document.getElementById('app');
  let currentRoute = '';
  let currentParams = {};
  let _fromPopstate = false;

  // ─── ROUTES ───
  const ROUTES = {
    'loading':       { render: () => Scr.renderLoading(),       title: 'Loading...' },
    'no-token':      { render: () => Scr.renderNoToken(),       title: 'Login Required' },
    'invalid-token': { render: () => Scr.renderInvalidToken(),  title: 'Session Expired' },
    'blocked':       { render: () => Scr.renderBlocked(),       title: 'Access Denied' },
    'home':          { render: () => Scr.renderDashboard(),     title: 'Dashboard',      onLoad: () => loadDashboardData() },
    'browse':        { render: () => Scr.renderBrowse(),        title: 'Create Order',   onLoad: () => loadBrowseData() },
    'cart':          { render: () => Scr.renderCart(),           title: 'Cart' },
    'orders':        { render: () => Scr.renderOrders(),        title: 'View Orders',    onLoad: () => loadOrders() },
    'order-detail':  { render: (p) => Scr.renderOrderDetail(p), title: 'Order Detail', onLoad: (p) => loadOrderDetail(p.id) },
    'quota':         { render: () => Scr.renderQuota(),         title: 'Set Quota',      onLoad: () => loadQuotaScreen() },
    'waste':         { render: () => Scr.renderWaste(),         title: 'Waste Log',      onLoad: () => loadWaste() },
    'returns':       { render: () => Scr.renderReturns(),       title: 'Returns',        onLoad: () => loadReturns() },
  };

  // ─── NAVIGATE ───
  function go(route, params = {}, replace = false) {
    const def = ROUTES[route];
    if (!def) return;
    currentRoute = route;
    currentParams = params;

    const authScreens = ['home','browse','cart','orders','order-detail','quota','waste','returns'];
    if (authScreens.includes(route) && S.session) {
      appEl().innerHTML = renderShell(def.render(params));
      buildSidebar();
      setupFlyout();
    } else {
      appEl().innerHTML = def.render(params);
    }

    // Update topbar title
    const titleEl = document.getElementById('tbTitle');
    if (titleEl) titleEl.textContent = def.title;

    if (def.onLoad) setTimeout(() => def.onLoad(params), 20);
    window.scrollTo(0, 0);
    const ct = appEl().querySelector('.content');
    if (ct) ct.scrollTop = 0;

    const hash = (route === 'order-detail' && params.id) ? '#order-detail/' + params.id : '#' + route;
    if (_fromPopstate) { _fromPopstate = false; }
    else if (replace) { history.replaceState({ route, params }, '', hash); }
    else { history.pushState({ route, params }, '', hash); }
  }

  // ─── SHELL ───
  function renderShell(mainContent) {
    const s = S.session || {};
    const init = (s.display_name || '?').charAt(0).toUpperCase();
    return `<div class="shell">
      <div class="topbar">
        <div class="hamburger" onclick="App.openSidebar()">☰</div>
        <div class="topbar-logo" onclick="location.href='${API.HOME_URL}'">SPG</div>
        <div class="topbar-title">Bakery Order <span class="screen-name" id="tbTitle"></span></div>
        <div class="topbar-right">
          <div class="topbar-icon" onclick="App.refreshCurrent()" title="Refresh">↻</div>
          <div class="topbar-avatar" onclick="App.showProfilePopup()">${esc(init)}</div>
        </div>
      </div>
      <div class="shell-body">
        <nav class="sidebar"></nav>
        <div class="shell-main">${mainContent}</div>
      </div>
    </div>`;
  }

  // ═══ DATA LOADERS ═══

  async function loadDashboardData() {
    try {
      const resp = await API.getDashboard();
      if (resp.success) { S.dashboard = resp.data; Scr.fillDashboard(); }
    } catch {}
  }

  async function loadBrowseData() {
    // Categories (localStorage cache)
    if (!S._catsLoaded) {
      const cached = API.cache.get('cats');
      if (cached) { S.categories = cached; S._catsLoaded = true; }
      else if (!S._catsLoading) {
        S._catsLoading = true;
        try {
          const resp = await API.getCategories();
          if (resp.success) { S.categories = resp.data; S._catsLoaded = true; API.cache.set('cats', resp.data, 1440); }
        } finally { S._catsLoading = false; }
      }
    }
    // Products (memory only)
    if (!S._prodsLoaded && !S._prodsLoading) {
      S._prodsLoading = true;
      try {
        const resp = await API.getProducts({ include_stock: 'true' });
        if (resp.success) {
          S.products = (resp.data || []).sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''));
          S._prodsLoaded = true;
        }
      } finally { S._prodsLoading = false; }
    }
    // Quotas (for delivery date's day of week)
    await loadQuotas();
    Scr.fillBrowse();
  }

  async function loadQuotas() {
    const d = new Date(S.deliveryDate + 'T00:00:00');
    const dow = d.getDay();
    if (S._quotasDay === dow && Object.keys(S.quotas).length > 0) return;
    try {
      const resp = await API.getQuotas({ day: String(dow) });
      if (resp.success) { S.quotas = resp.data; S._quotasDay = dow; }
    } catch {}
  }

  async function loadOrders(force) {
    if (S._ordersLoaded && !force) { Scr.fillOrders(); return; }
    if (S._ordersLoading) return;
    S._ordersLoading = true;
    try {
      const resp = await API.getOrders({ limit: '200' });
      if (resp.success) { S.orders = resp.data; S._ordersLoaded = true; }
    } finally { S._ordersLoading = false; }
    Scr.fillOrders();
  }

  async function loadOrderDetail(orderId) {
    if (!orderId) return;
    try {
      const resp = await API.getOrderDetail(orderId);
      if (resp.success) {
        S.currentOrder = resp.data;
        Scr.fillOrderDetail();
      } else {
        toast(resp.message || 'ไม่พบออเดอร์', 'error');
      }
    } catch (e) {
      toast('Network error', 'error');
    }
  }

  async function loadQuotaScreen() {
    // Need products + full quota map
    if (!S._prodsLoaded && !S._prodsLoading) {
      S._prodsLoading = true;
      try {
        const resp = await API.getProducts({ include_stock: 'false' });
        if (resp.success) {
          S.products = (resp.data || []).sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''));
          S._prodsLoaded = true;
        }
      } finally { S._prodsLoading = false; }
    }
    // Full 7-day quota map
    try {
      const resp = await API.getQuotas({});
      if (resp.success) S.quotaMap = resp.data || {};
    } catch {}
    Scr.fillQuota();
  }

  async function loadWaste(force) {
    if (S._wasteLoaded && !force) { Scr.fillWaste(); return; }
    if (S._wasteLoading) return;
    S._wasteLoading = true;
    try {
      const d = sydneyNow(); d.setDate(d.getDate() - 14);
      const resp = await API.getWasteLog({ date_from: fmtDate(d) });
      if (resp.success) { S.wasteLog = resp.data; S._wasteLoaded = true; }
    } finally { S._wasteLoading = false; }
    Scr.fillWaste();
  }

  async function loadReturns(force) {
    if (S._retsLoaded && !force) { Scr.fillReturns(); return; }
    if (S._retsLoading) return;
    S._retsLoading = true;
    try {
      const resp = await API.getReturns();
      if (resp.success) { S.returns = resp.data; S._retsLoaded = true; }
    } finally { S._retsLoading = false; }
    Scr.fillReturns();
  }

  // ═══ CART MANAGEMENT ═══

  function getStockPoints() {
    const ch = S.orderingChannels.find(c => c.store_id === S.session?.store_id && c.dept_id === S.session?.dept_id);
    return ch?.stock_points || 1;
  }

  function getCartItem(pid) { return S.cart.find(c => c.product_id === pid); }

  function setCartQty(pid, qty) {
    const idx = S.cart.findIndex(c => c.product_id === pid);
    if (qty <= 0) {
      if (idx >= 0) S.cart.splice(idx, 1);
      return;
    }
    if (idx >= 0) {
      S.cart[idx].qty = qty;
    } else {
      const p = S.products.find(pr => pr.product_id === pid);
      if (!p) return;
      S.cart.push({
        product_id: pid, product_name: p.product_name, unit: p.unit || '',
        qty, is_urgent: false, note: '',
        stock_on_hand: null, section_id: p.section_id,
        min_order: p.min_order || 1, order_step: p.order_step || 1,
      });
    }
  }

  function setCartStock(pid, stockVal) {
    const item = S.cart.find(c => c.product_id === pid);
    if (item) item.stock_on_hand = stockVal;
  }

  function toggleCartUrgent(pid) {
    const item = S.cart.find(c => c.product_id === pid);
    if (item) item.is_urgent = !item.is_urgent;
  }

  function setCartNote(pid, note) {
    const item = S.cart.find(c => c.product_id === pid);
    if (item) item.note = note;
  }

  function startOrder() {
    S.cart = [];
    S.deliveryDate = tomorrowSydney();
    S.headerNote = '';
    S.editingOrderId = null;
    S.productSearch = '';
    S.productFilter = 'all';
    go('browse');
  }

  function refreshCurrent() {
    if (currentRoute === 'home') { loadDashboardData(); }
    else if (currentRoute === 'orders') { loadOrders(true); }
    else if (currentRoute === 'waste') { loadWaste(true); }
    else if (currentRoute === 'returns') { loadReturns(true); }
    else if (currentRoute === 'browse') { S._prodsLoaded = false; loadBrowseData(); }
    toast('↻ Refreshing...', 'info');
  }

  // ═══ SIDEBAR ═══
  let _sidebarBuilt = false;

  function buildSidebar() {
    const s = S.session;
    if (!s) return;
    const cl = S.sidebarCollapsed ? ' collapsed' : '';
    const sd = appEl().querySelector('.sidebar');
    if (!sd) return;

    let html = `<div class="sidebar-top"><div class="sidebar-toggle" onclick="App.toggleSidebar()">☰</div></div>`;
    html += sdItem('home', '◇', 'Dashboard');
    html += '<div style="height:12px"></div>';

    const orderItems = [
      { r: 'browse', lbl: 'Create Order', perm: 'fn_create_order', action: 'App.startOrder()' },
      { r: 'orders', lbl: 'View Orders', perm: 'fn_view_own_orders' },
      { r: 'quota',  lbl: 'Set Quota',   perm: 'fn_create_order' },
    ];
    html += sdGroup('orders', '⊞', 'Orders', orderItems.filter(i => !i.perm || hasPerm(i.perm)).map(
      i => `<div class="sd-flyout-item${currentRoute === i.r ? ' active' : ''}" onclick="${i.action || "App.go('" + i.r + "')"}">${i.lbl}</div>`
    ).join(''));

    const recordItems = [
      { r: 'waste',   lbl: 'Waste Log', perm: 'fn_view_waste' },
      { r: 'returns', lbl: 'Returns',   perm: 'fn_view_returns' },
    ];
    html += sdGroup('records', '▤', 'Records', recordItems.filter(i => !i.perm || hasPerm(i.perm)).map(
      i => `<div class="sd-flyout-item${currentRoute === i.r ? ' active' : ''}" onclick="App.go('${i.r}')">${i.lbl}</div>`
    ).join(''));

    html += `<div class="sd-footer">
      <div class="sd-version">v1.3 | 14 Mar 2026</div>
      <a href="${API.HOME_URL}"><span>←</span><span class="sd-item-text"> Back to Home</span></a>
      <a href="#" class="danger" onclick="API.logout();return false"><span>→</span><span class="sd-item-text"> Log out</span></a>
    </div>`;
    sd.innerHTML = html;
    sd.className = 'sidebar' + cl;
    _sidebarBuilt = true;
    buildMobileSidebar();
  }

  function sdItem(route, icon, label) {
    const active = currentRoute === route ? ' active' : '';
    return `<div class="sd-item${active}" onclick="App.go('${route}')"><span class="sd-item-icon">${icon}</span><span class="sd-item-text">${label}</span></div>`;
  }
  function sdGroup(id, icon, label, items) {
    return `<div class="sd-group" data-group="${id}"><div class="sd-group-head"><span class="sd-item-icon">${icon}</span><span class="sd-item-text">${label}</span><span class="sd-group-arr">›</span></div><div class="sd-flyout">${items}</div></div>`;
  }
  function setupFlyout() {
    document.querySelectorAll('.sd-group').forEach(sg => {
      const head = sg.querySelector('.sd-group-head');
      const sub = sg.querySelector('.sd-flyout');
      if (!head || !sub) return;
      let timer = null;
      sg.addEventListener('mouseenter', () => { clearTimeout(timer); document.querySelectorAll('.sd-flyout.show').forEach(f => { if (f !== sub) f.classList.remove('show'); }); const r = head.getBoundingClientRect(); sub.style.top = r.top + 'px'; sub.style.left = r.right + 'px'; sub.classList.add('show'); });
      sg.addEventListener('mouseleave', () => { timer = setTimeout(() => sub.classList.remove('show'), 100); });
      sub.addEventListener('mouseenter', () => clearTimeout(timer));
      sub.addEventListener('mouseleave', () => { timer = setTimeout(() => sub.classList.remove('show'), 100); });
    });
  }
  function toggleSidebar() { S.sidebarCollapsed = !S.sidebarCollapsed; document.querySelector('.sidebar')?.classList.toggle('collapsed', S.sidebarCollapsed); }

  function buildMobileSidebar() {
    const panel = document.getElementById('sidebar-panel');
    if (!panel) return;
    const s = S.session || {};
    const init = (s.display_name || '?').charAt(0).toUpperCase();
    let html = `<div class="mob-sidebar-header"><div class="topbar-avatar" style="width:28px;height:28px;font-size:10px">${esc(init)}</div><div><div style="font-size:12px;font-weight:600">${esc(s.display_name)}</div><div style="font-size:9px;color:var(--t3)">${esc(s.tier_id)} · ${esc(getStoreName(s.store_id))}</div></div></div>`;
    html += mobItem('home', '◇', 'Dashboard');
    html += '<div style="height:8px"></div><div class="mob-sidebar-section">Orders</div>';
    if (hasPerm('fn_create_order')) html += `<div class="mob-sd-item" onclick="App.closeSidebar();App.startOrder()"><span class="sd-item-icon">⊞</span>Create Order</div>`;
    if (hasPerm('fn_view_own_orders')) html += mobItem('orders', '⊞', 'View Orders');
    if (hasPerm('fn_create_order')) html += mobItem('quota', '⊞', 'Set Quota');
    html += '<div style="height:4px"></div><div class="mob-sidebar-section">Records</div>';
    if (hasPerm('fn_view_waste')) html += mobItem('waste', '▤', 'Waste Log');
    if (hasPerm('fn_view_returns')) html += mobItem('returns', '▤', 'Returns');
    html += `<div class="mob-sd-footer"><div style="font-size:9px;color:var(--t4);margin-bottom:4px">v1.1</div><a href="${API.HOME_URL}" style="font-size:10px;color:var(--t3);text-decoration:none">← Back to Home</a><br><a href="#" style="font-size:10px;color:var(--red);text-decoration:none" onclick="API.logout();return false">→ Log out</a></div>`;
    panel.innerHTML = html;
  }
  function mobItem(route, icon, label) {
    const active = currentRoute === route ? ' active' : '';
    return `<div class="mob-sd-item${active}" onclick="App.closeSidebar();App.go('${route}')"><span class="sd-item-icon">${icon}</span>${label}</div>`;
  }
  function openSidebar() { if (!_sidebarBuilt) buildSidebar(); document.getElementById('sidebar-overlay')?.classList.add('open'); document.getElementById('sidebar-panel')?.classList.add('open'); }
  function closeSidebar() { document.getElementById('sidebar-overlay')?.classList.remove('open'); document.getElementById('sidebar-panel')?.classList.remove('open'); }

  // ═══ TOAST / DIALOG / PROFILE ═══
  function toast(msg, type = 'success') {
    const wrap = document.getElementById('toast-wrap');
    if (!wrap) return;
    const t = document.createElement('div');
    t.className = 'toast-item toast-' + type;
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(-10px)'; setTimeout(() => t.remove(), 300); }, 3000);
  }

  function showDialog(html) { document.getElementById('dialog-root').innerHTML = `<div class="popup-overlay show" onclick="if(event.target===this)App.closeDialog()">${html}</div>`; }
  function closeDialog() { document.getElementById('dialog-root').innerHTML = ''; }

  function showProfilePopup() {
    const s = S.session; if (!s) return;
    const init = (s.display_name || '?').charAt(0).toUpperCase();
    showDialog(`<div class="popup-sheet" style="width:320px">
      <div class="popup-header"><div class="popup-title">Profile</div><button class="popup-close" onclick="App.closeDialog()">✕</button></div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px"><div class="topbar-avatar" style="width:40px;height:40px;font-size:16px">${esc(init)}</div><div><div style="font-size:14px;font-weight:700">${esc(s.display_name)}</div><div style="font-size:11px;color:var(--t3)">${esc(s.full_name || '')}</div></div></div>
      <div style="background:var(--bg3);border-radius:var(--rd);padding:12px;font-size:12px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:var(--t3)">Store</span><span style="font-weight:600">${esc(getStoreName(s.store_id))}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:var(--t3)">Dept</span><span style="font-weight:600">${esc(s.dept_id)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:var(--t3)">Tier</span><span style="font-weight:600">${esc(s.tier_id)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:var(--t3)">Stock Points</span><span style="font-weight:600">${getStockPoints()}</span></div>
      </div>
      <button class="btn btn-outline btn-full" style="color:var(--red);border-color:var(--red)" onclick="App.closeDialog();API.logout()">Log out</button>
    </div>`);
  }

  // ═══ HELPERS ═══
  function hasPerm(fnId) { const tl = parseInt((S.session?.tier_id || 'T9').replace('T', '')); return tl <= 2 || S.permissions.includes(fnId); }
  function esc(str) { if (str == null) return ''; const d = document.createElement('div'); d.textContent = String(str); return d.innerHTML; }
  function sydneyNow() { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' })); }
  function fmtDate(d) { if (typeof d === 'string') return d; return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function todaySydney() { return fmtDate(sydneyNow()); }
  function tomorrowSydney() { const d = sydneyNow(); d.setDate(d.getDate() + 1); return fmtDate(d); }
  function fmtDateThai(str) { if (!str) return ''; const d = new Date(str + 'T00:00:00'); const m = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']; return d.getDate() + ' ' + m[d.getMonth()] + ' ' + d.getFullYear(); }
  function fmtDateAU(str) { if (!str) return ''; const d = new Date(str + 'T00:00:00'); return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' }); }
  function getStoreName(id) { if (!id) return ''; if (id === 'ALL') return 'ทุกร้าน'; const s = S.stores.find(s => s.store_id === id); return s ? s.store_name : id; }
  function getDeptName(id) { if (!id) return ''; if (id === 'ALL') return 'All'; const d = S.departments.find(d => d.dept_id === id); return d ? d.dept_name : id; }

  // ═══ SESSION MONITOR ═══
  let _sessionTimer = null;
  function startSessionMonitor() {
    if (_sessionTimer) clearInterval(_sessionTimer);
    _sessionTimer = setInterval(() => {
      const exp = S.session?.expires_at; if (!exp) return;
      const rem = new Date(exp).getTime() - Date.now();
      if (rem <= 0) { clearInterval(_sessionTimer); API.clearToken(); go('invalid-token', {}, true); toast('⏰ Session หมดอายุ', 'error'); }
      else if (rem <= 10 * 60000 && rem > 9.5 * 60000) { toast('⏰ Session จะหมดอายุใน ' + Math.round(rem / 60000) + ' นาที', 'warning'); }
    }, 30000);
  }

  // ═══ INIT ═══
  async function init() {
    go('loading', {}, true);
    const urlParams = new URLSearchParams(location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) { API.setToken(urlToken); history.replaceState(null, '', location.pathname + location.hash); }
    const token = API.getToken();
    if (!token) { go('no-token', {}, true); return; }
    try {
      const resp = await API.initLite();
      if (!resp.success) { API.clearToken(); go('invalid-token', {}, true); return; }
      S.session = resp.session; S.deptMapping = resp.deptMapping; S.config = resp.config || {};
      S.permissions = resp.permissions || []; S.stores = resp.stores || [];
      S.departments = resp.departments || []; S.orderingChannels = resp.orderingChannels || [];
      if (resp.session.access_level === 'no_access') { go('blocked', {}, true); return; }
      if (S.deptMapping && S.deptMapping.module_role === 'not_applicable') { go('blocked', {}, true); return; }
      const mr = S.deptMapping?.module_role;
      S.role = (mr === 'bc_production' || mr === 'bc_management') ? 'bc' : 'store';
      const tl = parseInt((S.session.tier_id || 'T9').replace('T', '')); S.sidebarRole = tl <= 2 ? 'admin' : S.role;
      const { route: hr, params: hp } = parseHash(location.hash);
      if (hr && ROUTES[hr] && !['loading', 'no-token', 'invalid-token', 'blocked'].includes(hr)) go(hr, hp, true);
      else go('home', {}, true);
      startSessionMonitor();
    } catch (err) { console.error('Init error:', err); go('invalid-token', {}, true); }
  }

  function parseHash(hash) {
    const clean = (hash || '').replace(/^#/, ''); if (!clean) return { route: '', params: {} };
    const idx = clean.indexOf('/'); if (idx === -1) return { route: clean, params: {} };
    return { route: clean.substring(0, idx), params: { id: decodeURIComponent(clean.substring(idx + 1)) } };
  }

  window.addEventListener('popstate', (e) => { if (e.state?.route && ROUTES[e.state.route]) { _fromPopstate = true; go(e.state.route, e.state.params || {}); } });
  document.addEventListener('DOMContentLoaded', () => { document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar); });
  document.addEventListener('DOMContentLoaded', init);

  return {
    S, go, toast, showDialog, closeDialog, esc,
    showProfilePopup, startOrder, hasPerm, refreshCurrent,
    openSidebar, closeSidebar, toggleSidebar,
    getStockPoints, getCartItem, setCartQty, setCartStock, toggleCartUrgent, setCartNote,
    loadOrders, loadOrderDetail, loadWaste, loadReturns, loadBrowseData, loadQuotas, loadQuotaScreen,
    getStoreName, getDeptName,
    sydneyNow, fmtDate, todaySydney, tomorrowSydney, fmtDateThai, fmtDateAU,
  };
})();
