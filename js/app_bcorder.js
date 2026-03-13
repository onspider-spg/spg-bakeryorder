/**
 * Version 1.0.1 | 14 MAR 2026 | Siam Palette Group
 * ═══════════════════════════════════════════
 * SPG — BC Order v2
 * app_bcorder.js — Router + State + Sidebar + Utilities
 * ═══════════════════════════════════════════
 *
 * Route Map:
 *   #home              → Dashboard (Store)
 *   #browse            → Create Order (browse products)
 *   #cart              → Cart (review + submit)
 *   #orders            → View Orders
 *   #order-detail/ID   → Order Detail
 *   #quota             → Set Quota
 *   #waste             → Waste Log
 *   #returns           → Returns
 */

const App = (() => {
  // ═══ STATE — memory only (except token in localStorage) ═══
  const S = {
    session: null,
    deptMapping: null,
    config: {},
    role: 'store',           // 'store' | 'bc'
    sidebarRole: 'store',    // 'store' | 'bc' | 'admin'
    permissions: [],
    stores: [],
    departments: [],
    orderingChannels: [],
    // Data (lazy loaded)
    categories: [],       _catsLoaded: false,   _catsLoading: false,
    products: [],         _prodsLoaded: false,  _prodsLoading: false,
    orders: [],           _ordersLoaded: false, _ordersLoading: false,
    stock: [],            _stockLoaded: false,  _stockLoading: false,
    wasteLog: [],         _wasteLoaded: false,  _wasteLoading: false,
    returns: [],          _retsLoaded: false,   _retsLoading: false,
    notifications: [],
    dashboard: {},
    // UI state
    cart: [],
    deliveryDate: '',
    headerNote: '',
    editingOrderId: null,
    currentOrder: null,
    productSearch: '',
    productFilter: 'all',
    sidebarCollapsed: false,
  };

  const appEl = () => document.getElementById('app');
  let currentRoute = '';
  let currentParams = {};

  // ─── ROUTES ───
  const ROUTES = {
    'loading':       { render: () => Scr.renderLoading(),       title: 'Loading...' },
    'no-token':      { render: () => Scr.renderNoToken(),       title: 'Login Required' },
    'invalid-token': { render: () => Scr.renderInvalidToken(),  title: 'Session Expired' },
    'blocked':       { render: () => Scr.renderBlocked(),       title: 'Access Denied' },
    'home':          { render: () => Scr.renderDashboard(),     title: 'Dashboard',      onLoad: () => loadDashboardData() },
    'browse':        { render: () => Scr.renderBrowse(),        title: 'Create Order',   onLoad: () => loadProductData() },
    'cart':          { render: () => Scr.renderCart(),           title: 'Cart' },
    'orders':        { render: () => Scr.renderOrders(),        title: 'View Orders',    onLoad: () => loadOrders() },
    'order-detail':  { render: (p) => Scr.renderOrderDetail(p), title: 'Order Detail' },
    'quota':         { render: () => Scr.renderQuota(),         title: 'Set Quota' },
    'waste':         { render: () => Scr.renderWaste(),         title: 'Waste Log',      onLoad: () => loadWaste() },
    'returns':       { render: () => Scr.renderReturns(),       title: 'Returns',        onLoad: () => loadReturns() },
  };

  // ─── NAVIGATE ───
  function go(route, params = {}) {
    const def = ROUTES[route];
    if (!def) return;
    currentRoute = route;
    currentParams = params;

    // Render shell with sidebar for authenticated screens
    const authScreens = ['home','browse','cart','orders','order-detail','quota','waste','returns'];
    if (authScreens.includes(route) && S.session) {
      appEl().innerHTML = renderShell(def.title, def.render(params));
      buildSidebar();
      setupFlyout();
    } else {
      appEl().innerHTML = def.render(params);
    }

    // Post-render
    if (def.onLoad) setTimeout(() => def.onLoad(params), 20);
    window.scrollTo(0, 0);
    const ct = appEl().querySelector('.content');
    if (ct) ct.scrollTop = 0;

    // Hash
    if (route === 'order-detail' && params.id) {
      history.replaceState({ route, params }, '', '#order-detail/' + params.id);
    } else {
      history.replaceState({ route, params }, '', '#' + route);
    }
  }

  // ─── SHELL (topbar + sidebar + main) ───
  function renderShell(title, content) {
    const s = S.session || {};
    const initial = (s.display_name || '?').charAt(0).toUpperCase();
    return `<div class="shell">
      <div class="topbar">
        <div class="hamburger" onclick="App.openSidebar()">☰</div>
        <div class="topbar-logo" onclick="location.href='${API.HOME_URL}'">SPG</div>
        <div class="topbar-title">Bakery Order <span class="screen-name" id="tbTitle">${esc(title)}</span></div>
        <div class="topbar-right">
          <div class="topbar-icon" onclick="App.go('home')" title="Refresh">↻</div>
          <div class="topbar-avatar" onclick="App.showProfilePopup()">${esc(initial)}</div>
        </div>
      </div>
      <div class="shell-body">
        <nav class="sidebar"></nav>
        <div class="shell-main">
          <div class="content" id="mainContent">${content}</div>
        </div>
      </div>
    </div>`;
  }

  function updateTitle(title) {
    const el = document.getElementById('tbTitle');
    if (el) el.textContent = title;
  }

  // ═══ DATA LOADERS (memory first + in-flight guard) ═══

  async function loadDashboardData() {
    try {
      const resp = await API.getDashboard();
      if (resp.success) {
        S.dashboard = resp.data;
        Scr.fillDashboard();
      }
    } catch {}
  }

  async function loadProductData() {
    // Categories — check localStorage cache first
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
    // Products — memory only
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
    if (typeof Scr.fillBrowse === 'function') Scr.fillBrowse();
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

  // ═══ SIDEBAR — Desktop (fixed, flyout) ═══
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

    // Orders group
    const orderItems = [
      { r: 'browse', lbl: 'Create Order', perm: 'fn_create_order', action: 'App.startOrder()' },
      { r: 'orders', lbl: 'View Orders', perm: 'fn_view_own_orders' },
      { r: 'quota',  lbl: 'Set Quota',   perm: 'fn_create_order' },
    ];
    html += sdGroup('orders', '⊞', 'Orders', orderItems.filter(i => !i.perm || hasPerm(i.perm)).map(
      i => `<div class="sd-flyout-item${currentRoute === i.r ? ' active' : ''}" onclick="${i.action || "App.go('" + i.r + "')"}">${i.lbl}</div>`
    ).join(''));

    // Records group
    const recordItems = [
      { r: 'waste',   lbl: 'Waste Log', perm: 'fn_view_waste' },
      { r: 'returns', lbl: 'Returns',   perm: 'fn_view_returns' },
    ];
    html += sdGroup('records', '▤', 'Records', recordItems.filter(i => !i.perm || hasPerm(i.perm)).map(
      i => `<div class="sd-flyout-item${currentRoute === i.r ? ' active' : ''}" onclick="App.go('${i.r}')">${i.lbl}</div>`
    ).join(''));

    html += `<div class="sd-footer">
      <div class="sd-version">v1.0 | 14 Mar 2026</div>
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
    const active = '';
    return `<div class="sd-group" data-group="${id}">
      <div class="sd-group-head${active}"><span class="sd-item-icon">${icon}</span><span class="sd-item-text">${label}</span><span class="sd-group-arr">›</span></div>
      <div class="sd-flyout">${items}</div>
    </div>`;
  }

  function setupFlyout() {
    document.querySelectorAll('.sd-group').forEach(sg => {
      const head = sg.querySelector('.sd-group-head');
      const sub = sg.querySelector('.sd-flyout');
      if (!head || !sub) return;
      let timer = null;
      sg.addEventListener('mouseenter', () => {
        clearTimeout(timer);
        document.querySelectorAll('.sd-flyout.show').forEach(f => { if (f !== sub) f.classList.remove('show'); });
        const rect = head.getBoundingClientRect();
        sub.style.top = rect.top + 'px';
        sub.style.left = rect.right + 'px';
        sub.classList.add('show');
      });
      sg.addEventListener('mouseleave', () => { timer = setTimeout(() => sub.classList.remove('show'), 100); });
      sub.addEventListener('mouseenter', () => clearTimeout(timer));
      sub.addEventListener('mouseleave', () => { timer = setTimeout(() => sub.classList.remove('show'), 100); });
    });
  }

  function toggleSidebar() {
    S.sidebarCollapsed = !S.sidebarCollapsed;
    const sd = document.querySelector('.sidebar');
    if (sd) sd.classList.toggle('collapsed', S.sidebarCollapsed);
  }

  // ─── Mobile Sidebar ───
  function buildMobileSidebar() {
    const panel = document.getElementById('sidebar-panel');
    if (!panel) return;
    const s = S.session || {};
    const initial = (s.display_name || '?').charAt(0).toUpperCase();

    let html = `<div class="mob-sidebar-header">
      <div class="topbar-avatar" style="width:28px;height:28px;font-size:10px">${esc(initial)}</div>
      <div><div style="font-size:12px;font-weight:600">${esc(s.display_name)}</div>
      <div style="font-size:9px;color:var(--t3)">${esc(s.tier_id)} · ${esc(getStoreName(s.store_id))}</div></div>
    </div>`;
    html += mobItem('home', '◇', 'Dashboard');
    html += '<div style="height:8px"></div>';
    html += '<div class="mob-sidebar-section">Orders</div>';
    if (hasPerm('fn_create_order')) html += `<div class="mob-sd-item" onclick="App.closeSidebar();App.startOrder()"><span class="sd-item-icon">⊞</span>Create Order</div>`;
    if (hasPerm('fn_view_own_orders')) html += mobItem('orders', '⊞', 'View Orders');
    if (hasPerm('fn_create_order')) html += mobItem('quota', '⊞', 'Set Quota');
    html += '<div style="height:4px"></div>';
    html += '<div class="mob-sidebar-section">Records</div>';
    if (hasPerm('fn_view_waste')) html += mobItem('waste', '▤', 'Waste Log');
    if (hasPerm('fn_view_returns')) html += mobItem('returns', '▤', 'Returns');
    html += `<div class="mob-sd-footer">
      <div style="font-size:9px;color:var(--t4);margin-bottom:4px">v1.0</div>
      <a href="${API.HOME_URL}" style="font-size:10px;color:var(--t3);text-decoration:none">← Back to Home</a><br>
      <a href="#" style="font-size:10px;color:var(--red);text-decoration:none" onclick="API.logout();return false">→ Log out</a>
    </div>`;
    panel.innerHTML = html;
  }

  function mobItem(route, icon, label) {
    const active = currentRoute === route ? ' active' : '';
    return `<div class="mob-sd-item${active}" onclick="App.closeSidebar();App.go('${route}')"><span class="sd-item-icon">${icon}</span>${label}</div>`;
  }

  function openSidebar() {
    if (!_sidebarBuilt) buildSidebar();
    document.getElementById('sidebar-overlay')?.classList.add('open');
    document.getElementById('sidebar-panel')?.classList.add('open');
  }
  function closeSidebar() {
    document.getElementById('sidebar-overlay')?.classList.remove('open');
    document.getElementById('sidebar-panel')?.classList.remove('open');
  }

  // ═══ TOAST ═══
  function toast(msg, type = 'success') {
    const wrap = document.getElementById('toast-wrap');
    if (!wrap) return;
    const t = document.createElement('div');
    t.className = 'toast-item toast-' + type;
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(-10px)'; setTimeout(() => t.remove(), 300); }, 3000);
  }

  // ═══ DIALOG ═══
  function showDialog(html) {
    const root = document.getElementById('dialog-root');
    root.innerHTML = `<div class="popup-overlay show" onclick="if(event.target===this)App.closeDialog()">${html}</div>`;
  }
  function closeDialog() { document.getElementById('dialog-root').innerHTML = ''; }

  // ═══ PROFILE POPUP ═══
  function showProfilePopup() {
    const s = S.session;
    if (!s) return;
    const initial = (s.display_name || '?').charAt(0).toUpperCase();
    showDialog(`<div class="popup-sheet" style="width:320px">
      <div class="popup-header"><div class="popup-title">Profile</div><button class="popup-close" onclick="App.closeDialog()">✕</button></div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <div class="topbar-avatar" style="width:40px;height:40px;font-size:16px">${esc(initial)}</div>
        <div><div style="font-size:14px;font-weight:700">${esc(s.display_name)}</div>
        <div style="font-size:11px;color:var(--t3)">${esc(s.full_name || '')}</div></div>
      </div>
      <div style="background:var(--bg3);border-radius:var(--rd);padding:12px;font-size:12px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:var(--t3)">Account</span><span style="font-weight:600">${esc(s.account_id)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:var(--t3)">Store</span><span style="font-weight:600">${esc(getStoreName(s.store_id))}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:var(--t3)">Dept</span><span style="font-weight:600">${esc(s.dept_id)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:var(--t3)">Tier</span><span style="font-weight:600">${esc(s.tier_id)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:var(--t3)">Role</span><span style="font-weight:600">${esc(S.deptMapping?.module_role || S.role)}</span></div>
      </div>
      <button class="btn btn-outline btn-full" style="color:var(--red);border-color:var(--red)" onclick="App.closeDialog();API.logout()">Log out</button>
    </div>`);
  }

  // ═══ START ORDER (reset cart + go browse) ═══
  function startOrder() {
    S.cart = [];
    S.deliveryDate = tomorrowSydney();
    S.headerNote = '';
    S.editingOrderId = null;
    S.productSearch = '';
    S.productFilter = 'all';
    go('browse');
  }

  // ═══ PERMISSION CHECK ═══
  function hasPerm(fnId) {
    const tl = parseInt((S.session?.tier_id || 'T9').replace('T', ''));
    if (tl <= 2) return true;
    return S.permissions.includes(fnId);
  }

  // ═══ HELPERS ═══
  function esc(str) {
    if (str == null) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  function sydneyNow() { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' })); }
  function fmtDate(d) { if (typeof d === 'string') return d; return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function todaySydney() { return fmtDate(sydneyNow()); }
  function tomorrowSydney() { const d = sydneyNow(); d.setDate(d.getDate() + 1); return fmtDate(d); }
  function fmtDateThai(str) { if (!str) return ''; const d = new Date(str + 'T00:00:00'); const m = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']; return d.getDate() + ' ' + m[d.getMonth()]; }
  function fmtDateAU(str) { if (!str) return ''; const d = new Date(str + 'T00:00:00'); return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' }); }

  function getStoreName(id) {
    if (!id) return '';
    if (id === 'ALL') return 'ทุกร้าน';
    const s = S.stores.find(s => s.store_id === id);
    return s ? s.store_name : id;
  }

  function getDeptName(id) {
    if (!id) return '';
    if (id === 'ALL') return 'All';
    const d = S.departments.find(d => d.dept_id === id);
    return d ? d.dept_name : id;
  }

  // ═══ SESSION MONITOR (no polling — check expiry only) ═══
  let _sessionTimer = null;
  function startSessionMonitor() {
    if (_sessionTimer) clearInterval(_sessionTimer);
    _sessionTimer = setInterval(() => {
      const exp = S.session?.expires_at;
      if (!exp) return;
      const remaining = new Date(exp).getTime() - Date.now();
      if (remaining <= 0) {
        clearInterval(_sessionTimer);
        API.clearToken();
        go('invalid-token');
        toast('⏰ Session หมดอายุ กรุณา login ใหม่', 'error');
      } else if (remaining <= 10 * 60000 && remaining > 9.5 * 60000) {
        toast('⏰ Session จะหมดอายุใน ' + Math.round(remaining / 60000) + ' นาที', 'warning');
      }
    }, 30000);
  }

  // ═══ INIT — 3-Step Token Fallback ═══
  async function init() {
    go('loading');

    // Step 1: URL param ?token=xxx (from Home)
    const urlParams = new URLSearchParams(location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      API.setToken(urlToken);
      history.replaceState(null, '', location.pathname + location.hash);
    }

    // Step 2: spg_token in localStorage (cross-module / new tab)
    const token = API.getToken();
    if (!token) { go('no-token'); return; }

    // Step 3: Call init_lite
    try {
      const resp = await API.initLite();
      if (!resp.success) {
        API.clearToken();
        go('invalid-token');
        return;
      }

      // Store session data
      S.session = resp.session;
      S.deptMapping = resp.deptMapping;
      S.config = resp.config || {};
      S.permissions = resp.permissions || [];
      S.stores = resp.stores || [];
      S.departments = resp.departments || [];
      S.orderingChannels = resp.orderingChannels || [];

      // Check access
      if (resp.session.access_level === 'no_access') { go('blocked'); return; }
      if (S.deptMapping && S.deptMapping.module_role === 'not_applicable') { go('blocked'); return; }

      // Determine role
      const mr = S.deptMapping?.module_role;
      S.role = (mr === 'bc_production' || mr === 'bc_management') ? 'bc' : 'store';
      const tl = parseInt((S.session.tier_id || 'T9').replace('T', ''));
      S.sidebarRole = tl <= 2 ? 'admin' : S.role;

      // Route to home or deep link
      const { route: hashRoute, params: hashParams } = parseHash(location.hash);
      if (hashRoute && ROUTES[hashRoute] && !['loading', 'no-token', 'invalid-token', 'blocked'].includes(hashRoute)) {
        go(hashRoute, hashParams);
      } else {
        go('home');
      }

      startSessionMonitor();

    } catch (err) {
      console.error('Init error:', err);
      go('invalid-token');
    }
  }

  function parseHash(hash) {
    const clean = (hash || '').replace(/^#/, '');
    if (!clean) return { route: '', params: {} };
    const idx = clean.indexOf('/');
    if (idx === -1) return { route: clean, params: {} };
    return { route: clean.substring(0, idx), params: { id: decodeURIComponent(clean.substring(idx + 1)) } };
  }

  // Browser back/forward
  window.addEventListener('popstate', (e) => {
    if (e.state?.route && ROUTES[e.state.route]) {
      go(e.state.route, e.state.params || {});
    }
  });

  // Mobile sidebar overlay click
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);
  });

  // Boot
  document.addEventListener('DOMContentLoaded', init);

  return {
    S, go, toast, showDialog, closeDialog, esc,
    showProfilePopup, startOrder, hasPerm, updateTitle,
    openSidebar, closeSidebar, toggleSidebar,
    loadOrders, loadWaste, loadReturns, loadProductData,
    getStoreName, getDeptName,
    sydneyNow, fmtDate, todaySydney, tomorrowSydney, fmtDateThai, fmtDateAU,
  };
})();
