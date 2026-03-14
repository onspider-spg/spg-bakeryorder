/**
 * Version 2.2.1 | 14 MAR 2026 | Siam Palette Group
 * ═══════════════════════════════════════════
 * SPG — BC Order v2
 * app_bcorder.js — Router + State + Sidebar + Cart + Utilities
 * Fix: Topbar logo full name + Profile popup redesign
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
    notifications: [], dashboard: {}, printData: null,
    adminProducts: null, adminChannels: null,
    // Quotas
    quotas: {},       _quotasDay: -1,
    quotaMap: {},     // full 7-day map for quota screen
    // Cart + Order
    cart: [], deliveryDate: '', headerNote: '', editingOrderId: null,
    currentOrder: null,
    productSearch: '', productFilter: 'all',
    stockInputs: {},  // { pid: value } or { pid: { s1: v, s2: v } } for 2pt
    sidebarCollapsed: false,
    // Phase 7: Admin data (lazy loaded)
    deptMappings: null,
    wasteDash: null,
    topProds: null,
    cutoffData: null,
    auditData: null,
  };

  const appEl = () => document.getElementById('app');
  let currentRoute = '';
  let currentParams = {};
  let _fromPopstate = false;
  let _shellMounted = false;

  // ─── ROUTES ───
  const ROUTES = {
    'loading':       { render: () => Scr.renderLoading(),       title: 'Loading...' },
    'no-token':      { render: () => Scr.renderNoToken(),       title: 'Login Required' },
    'invalid-token': { render: () => Scr.renderInvalidToken(),  title: 'Session Expired' },
    'blocked':       { render: () => Scr.renderBlocked(),       title: 'Access Denied' },
    'home':          { render: () => S.role === 'bc' ? Scr2.renderBCDashboard() : Scr.renderDashboard(), title: 'Dashboard', onLoad: () => S.role === 'bc' ? loadBCDashboard() : loadDashboardData() },
    'browse':        { render: () => Scr.renderBrowse(),        title: 'Create Order',   onLoad: () => loadBrowseData() },
    'cart':          { render: () => Scr.renderCart(),           title: 'Cart' },
    'orders':        { render: () => Scr.renderOrders(),        title: 'View Orders',    onLoad: () => loadOrders() },
    'order-detail':  { render: (p) => Scr.renderOrderDetail(p), title: 'Order Detail', onLoad: (p) => loadOrderDetail(p.id) },
    'quota':         { render: () => Scr.renderQuota(),         title: 'Set Quota',      onLoad: () => loadQuotaScreen() },
    'waste':         { render: () => Scr.renderWaste(),         title: 'Waste Log',      onLoad: () => loadWasteScreen() },
    'returns':       { render: () => Scr.renderReturns(),       title: 'Returns',        onLoad: () => loadReturnsScreen() },
    // BC-only routes (Phase 2+)
    'accept':        { render: (p) => Scr2.renderAccept(p), title: 'Accept Order', onLoad: (p) => loadAcceptOrder(p.id) },
    'fulfil':        { render: (p) => Scr2.renderFulfil(p), title: 'Fulfilment',   onLoad: (p) => loadFulfilOrder(p.id) },
    'print':         { render: () => Scr2.renderPrint(),        title: 'Print Centre', onLoad: () => loadPrintCentre() },
    'bc-returns':    { render: () => Scr2.renderBCReturns(),    title: 'Incoming Returns', onLoad: () => loadBCReturnsData() },
    'products':      { render: () => Scr2.renderProducts(),     title: 'Manage Products', onLoad: () => loadAdminProducts() },
    'prod-edit':     { render: (p) => Scr2.renderProdEdit(p),   title: 'Edit Product',    onLoad: (p) => loadProdEdit(p.id) },
    // Phase 7: Admin + Reports routes
    'visibility':       { render: () => Scr3.renderVisibility(),     title: 'Visibility',       onLoad: () => loadVisibility() },
    'access':           { render: () => Scr3.renderAccess(),         title: 'User Access',      onLoad: () => loadAccessMatrix() },
    'dept-mapping':     { render: () => Scr3.renderDeptMapping(),    title: 'Dept Mapping',     onLoad: () => loadDeptMappingData() },
    'config':           { render: () => Scr3.renderConfig(),         title: 'Config',           onLoad: () => loadConfigScreen() },
    'waste-dashboard':  { render: () => Scr3.renderWasteDashboard(), title: 'Waste Dashboard',  onLoad: () => loadWasteDashboard() },
    'top-products':     { render: () => Scr3.renderTopProducts(),    title: 'Top Products',     onLoad: () => loadTopProducts() },
    'cutoff':           { render: () => Scr3.renderCutoff(),         title: 'Cutoff',           onLoad: () => loadCutoffData() },
    'audit':            { render: () => Scr3.renderAudit(),          title: 'Audit Trail',      onLoad: () => loadAuditData() },
  };

  // ─── NAVIGATE ───
  function go(route, params = {}, replace = false) {
    const def = ROUTES[route];
    if (!def) return;
    currentRoute = route;
    currentParams = params;

    const authScreens = ['home','browse','cart','orders','order-detail','quota','waste','returns','accept','fulfil','print','bc-returns','products','prod-edit',
      'visibility','access','dept-mapping','config','waste-dashboard','top-products','cutoff','audit'];
    if (authScreens.includes(route) && S.session) {
      if (!_shellMounted) mountShell();
      const main = document.querySelector('.shell-main');
      if (main) main.innerHTML = def.render(params);
      updateSidebarActive();
    } else {
      _shellMounted = false;
      appEl().innerHTML = def.render(params);
    }

    if (def.onLoad) setTimeout(() => def.onLoad(params), 20);
    window.scrollTo(0, 0);
    const ct = appEl().querySelector('.content');
    if (ct) ct.scrollTop = 0;

    const hash = (route === 'order-detail' && params.id) ? '#order-detail/' + params.id : '#' + route;
    if (_fromPopstate) { _fromPopstate = false; }
    else if (replace) { history.replaceState({ route, params }, '', hash); }
    else { history.pushState({ route, params }, '', hash); }
  }

  // ─── SHELL (mount once) ───
  function mountShell() {
    const s = S.session || {};
    const initials = getInitials(s.display_name);
    appEl().innerHTML = `<div class="shell">
      <div class="topbar">
        <div class="hamburger" onclick="App.openSidebar()">☰</div>
        <div class="topbar-logo" onclick="App.go('home')">SPG Bakery Center Order</div>
        <div class="topbar-right">
          <div class="topbar-icon" onclick="App.refreshCurrent()" title="Refresh">↻</div>
          <div class="topbar-avatar" onclick="App.showProfilePopup()">${esc(initials)}</div>
        </div>
      </div>
      <div class="shell-body">
        <nav class="sidebar"></nav>
        <div class="shell-main"></div>
      </div>
    </div>`;
    buildSidebar();
    setupFlyout();
    _shellMounted = true;
  }

  function updateSidebarActive() {
    document.querySelectorAll('[data-route]').forEach(el => {
      el.classList.toggle('active', el.dataset.route === currentRoute);
    });
  }

  // ═══ DATA LOADERS ═══

  async function loadDashboardData() {
    try {
      const resp = await API.getDashboard();
      if (resp.success) { S.dashboard = resp.data; Scr.fillDashboard(); }
    } catch {}
  }

  async function loadBCDashboard() {
    try {
      const resp = await API.getDashboard();
      if (resp.success) { S.dashboard = resp.data; Scr2.fillBCDashboard(); }
    } catch {}
  }

  // ─── Shared: ensure products in memory (memory → cache → API) ───
  async function ensureProducts() {
    if (S._prodsLoaded) return;
    if (S._prodsLoading) return;
    // Try cache
    const cached = API.cache.get('prods');
    if (cached) {
      S.products = cached;
      S._prodsLoaded = true;
      return;
    }
    // API fallback
    S._prodsLoading = true;
    try {
      const resp = await API.getProducts({ include_stock: 'false' });
      if (resp.success) {
        S.products = (resp.data || []).sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''));
        S._prodsLoaded = true;
        API.cache.set('prods', S.products, 60);
      }
    } finally { S._prodsLoading = false; }
  }

  async function loadBrowseData() {
    // Categories: already in memory from init_lite — no fetch needed

    // Products + Stock + Quotas
    const d = new Date(S.deliveryDate + 'T00:00:00');
    const dow = d.getDay();

    if (S._prodsLoaded && S._quotasDay === dow) {
      // Everything in memory — 0 API calls
      Scr.fillBrowse();
      return;
    }

    // Try products from cache
    if (!S._prodsLoaded) {
      const cached = API.cache.get('prods');
      if (cached) { S.products = cached; S._prodsLoaded = true; }
    }

    // Products already loaded → fetch only quotas for new day
    if (S._prodsLoaded && S._quotasDay !== dow) {
      try {
        const resp = await API.getQuotas({ day: String(dow) });
        if (resp.success) {
          const flat = {};
          for (const pid in resp.data) {
            flat[pid] = resp.data[pid]?.[dow] ?? 0;
          }
          S.quotas = flat;
          S._quotasDay = dow;
        }
      } catch {}
      Scr.fillBrowse();
      return;
    }

    // Products not loaded → full bundle (products + stock + quotas)
    if (S._prodsLoading) return;
    S._prodsLoading = true;
    try {
      const resp = await API.initBrowse({ day: String(dow) });
      if (resp.success) {
        S.products = (resp.products || []).sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''));
        S._prodsLoaded = true;
        API.cache.set('prods', S.products, 60);
        S.quotas = resp.quotas || {};
        S._quotasDay = dow;
      }
    } finally { S._prodsLoading = false; }
    Scr.fillBrowse();
  }

  async function loadQuotas() {
    // Called when delivery date changes — only need quotas (products already loaded)
    const d = new Date(S.deliveryDate + 'T00:00:00');
    const dow = d.getDay();
    if (S._quotasDay === dow) return;
    try {
      const resp = await API.getQuotas({ day: String(dow) });
      if (resp.success) {
        // Flatten nested 7-day map → flat map for this day
        const flat = {};
        for (const pid in resp.data) {
          flat[pid] = resp.data[pid]?.[dow] ?? 0;
        }
        S.quotas = flat;
        S._quotasDay = dow;
      }
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

  async function loadAcceptOrder(orderId) {
    if (!orderId) return;
    try {
      const resp = await API.getOrderDetail(orderId);
      if (resp.success) {
        S.currentOrder = resp.data;
        Scr2.fillAccept();
      } else {
        toast(resp.message || 'ไม่พบออเดอร์', 'error');
      }
    } catch (e) {
      toast('Network error', 'error');
    }
  }

  async function loadFulfilOrder(orderId) {
    if (!orderId) return;
    try {
      const resp = await API.getOrderDetail(orderId);
      if (resp.success) {
        S.currentOrder = resp.data;
        Scr2.fillFulfil();
      } else {
        toast(resp.message || 'ไม่พบออเดอร์', 'error');
      }
    } catch (e) {
      toast('Network error', 'error');
    }
  }

  async function loadPrintCentre(date) {
    const d = date || todaySydney();
    try {
      const resp = await API.getProductionSheet({ delivery_date: d });
      if (resp.success) {
        S.printData = resp.data;
        Scr2.fillPrint();
      }
    } catch (e) {
      toast('Network error', 'error');
    }
  }

  async function loadBCReturnsData() {
    await ensureProducts();
    try {
      const resp = await API.getReturns();
      if (resp.success) { S.returns = resp.data; S._retsLoaded = true; }
    } catch {}
    Scr2.fillBCReturns();
  }

  async function loadAdminProducts() {
    try {
      const resp = await API.getAllProducts();
      if (resp.success) {
        S.adminProducts = resp.data.products;
        S.adminChannels = resp.data.channels;
        // Also update categories if fresher
        if (resp.data.categories?.length) {
          S.categories = resp.data.categories.map(c => ({ cat_id: c.category_id, cat_name: c.category_name, section_id: c.section_id }));
        }
        Scr2.fillProducts();
      }
    } catch (e) {
      toast('Network error', 'error');
    }
  }

  function loadProdEdit(productId) {
    // Data already in S.adminProducts from products screen — just fill
    Scr2.fillProdEdit(productId);
  }

  async function loadQuotaScreen() {
    await ensureProducts();
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

  async function loadWasteScreen() {
    await ensureProducts();
    await loadWaste();
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

  async function loadReturnsScreen() {
    await ensureProducts();
    await loadReturns();
  }

  // ═══ Phase 7: ADMIN DATA LOADERS ═══

  function loadConfigScreen() {
    // Config already in S.config from init_lite — 0 API calls
    Scr3.fillConfig();
  }

  async function loadDeptMappingData() {
    if (S.deptMappings) { Scr3.fillDeptMapping(); return; }
    try {
      const resp = await API.getDeptMapping();
      if (resp.success) { S.deptMappings = resp.data; }
    } catch (e) { toast('Network error', 'error'); }
    Scr3.fillDeptMapping();
  }

  async function loadVisibility() {
    // Reuse getAllProducts — already has products + visibility + channels
    if (S.adminProducts) { Scr3.fillVisibility(); return; }
    await loadAdminProducts();
    Scr3.fillVisibility();
  }

  async function loadAccessMatrix() {
    try {
      const resp = await API.getAccessMatrix();
      if (resp.success) { Scr3.setAccessData(resp.data); }
    } catch (e) { toast('Network error', 'error'); }
    Scr3.fillAccess();
  }

  async function loadWasteDashboard(dateFrom, dateTo) {
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    try {
      const resp = await API.getWasteDashboard(params);
      if (resp.success) { S.wasteDash = resp.data; }
    } catch (e) { toast('Network error', 'error'); }
    Scr3.fillWasteDashboard();
  }

  async function loadTopProducts(dateFrom, dateTo) {
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    try {
      const resp = await API.getTopProducts(params);
      if (resp.success) { S.topProds = resp.data; }
    } catch (e) { toast('Network error', 'error'); }
    Scr3.fillTopProducts();
  }

  async function loadCutoffData(dateFrom, dateTo) {
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    try {
      const resp = await API.getCutoffViolations(params);
      if (resp.success) { S.cutoffData = resp.data; }
    } catch (e) { toast('Network error', 'error'); }
    Scr3.fillCutoff();
  }

  async function loadAuditData(dateFrom, dateTo) {
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    try {
      const resp = await API.getAuditTrail(params);
      if (resp.success) { S.auditData = resp.data; }
    } catch (e) { toast('Network error', 'error'); }
    Scr3.fillAudit();
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
        qty, is_urgent: false, note: '', _auto: false,
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
    S.stockInputs = {};
    S.deliveryDate = tomorrowSydney();
    S.headerNote = '';
    S.editingOrderId = null;
    S.productSearch = '';
    S.productFilter = 'all';
    go('browse');
  }

  function goToBrowse() {
    if (S.cart.length > 0 || Object.keys(S.stockInputs).length > 0) {
      go('browse');
    } else {
      startOrder();
    }
  }

  function refreshCurrent() {
    // Hard refresh — เหมือน cmd+shift+R
    location.reload();
  }

  // ═══ SIDEBAR ═══
  let _sidebarBuilt = false;

  function buildSidebar() {
    const s = S.session;
    if (!s) return;
    const cl = S.sidebarCollapsed ? ' collapsed' : '';
    const sd = appEl().querySelector('.sidebar');
    if (!sd) return;
    const isBC = S.sidebarRole === 'bc' || S.sidebarRole === 'admin';
    const isStore = S.sidebarRole === 'store' || S.sidebarRole === 'admin';
    const isAdmin = S.sidebarRole === 'admin';

    let html = `<div class="sidebar-top"><div class="sidebar-toggle" onclick="App.toggleSidebar()">☰</div></div>`;
    html += sdItem('home', '◇', 'Dashboard');
    html += '<div style="height:12px"></div>';

    if (isStore && S.role === 'store') {
      // Store sidebar (original)
      const orderItems = [
        { r: 'browse', lbl: 'Create Order', perm: 'fn_create_order', action: 'App.goToBrowse()' },
        { r: 'orders', lbl: 'View Orders', perm: 'fn_view_own_orders' },
        { r: 'quota',  lbl: 'Set Quota',   perm: 'fn_create_order' },
      ];
      html += sdGroup('orders', '⊞', 'Orders', orderItems.filter(i => !i.perm || hasPerm(i.perm)).map(
        i => `<div class="sd-flyout-item${currentRoute === i.r ? ' active' : ''}" data-route="${i.r}" onclick="${i.action || "App.go('" + i.r + "')"}">${i.lbl}</div>`
      ).join(''));
      const recordItems = [
        { r: 'waste',   lbl: 'Waste Log', perm: 'fn_view_waste' },
        { r: 'returns', lbl: 'Returns',   perm: 'fn_view_returns' },
      ];
      html += sdGroup('records', '▤', 'Records', recordItems.filter(i => !i.perm || hasPerm(i.perm)).map(
        i => `<div class="sd-flyout-item${currentRoute === i.r ? ' active' : ''}" data-route="${i.r}" onclick="App.go('${i.r}')">${i.lbl}</div>`
      ).join(''));
    }

    if (isBC && S.role === 'bc') {
      // BC sidebar — Orders + Records
      const bcOrderItems = [
        { r: 'orders', lbl: 'View Orders' },
        { r: 'print',  lbl: 'Print Centre' },
      ];
      html += sdGroup('orders', '⊞', 'Orders', bcOrderItems.map(
        i => `<div class="sd-flyout-item${currentRoute === i.r ? ' active' : ''}" data-route="${i.r}" onclick="App.go('${i.r}')">${i.lbl}</div>`
      ).join(''));
      const bcRecordItems = [
        { r: 'waste',      lbl: 'Waste Log' },
        { r: 'bc-returns', lbl: 'Incoming Returns' },
      ];
      html += sdGroup('records', '▤', 'Records', bcRecordItems.map(
        i => `<div class="sd-flyout-item${currentRoute === i.r ? ' active' : ''}" data-route="${i.r}" onclick="App.go('${i.r}')">${i.lbl}</div>`
      ).join(''));

      // Admin group (perm-gated)
      const adminItems = [];
      if (hasPerm('fn_manage_products'))    adminItems.push({ r: 'products',     lbl: 'Manage Products' });
      if (hasPerm('fn_manage_visibility'))  adminItems.push({ r: 'visibility',   lbl: 'Product Visibility' });
      if (hasPerm('fn_manage_permissions')) adminItems.push({ r: 'access',       lbl: 'User Access' });
      if (hasPerm('fn_manage_dept_mapping'))adminItems.push({ r: 'dept-mapping', lbl: 'Dept Mapping' });
      if (hasPerm('fn_manage_config'))      adminItems.push({ r: 'config',       lbl: 'System Config' });
      if (adminItems.length) {
        html += sdGroup('admin', '⚙', 'Admin', adminItems.map(
          i => `<div class="sd-flyout-item${currentRoute === i.r ? ' active' : ''}" data-route="${i.r}" onclick="App.go('${i.r}')">${i.lbl}</div>`
        ).join(''));
      }

      // Reports group (perm-gated or admin)
      const reportItems = [];
      if (hasPerm('fn_view_waste'))       reportItems.push({ r: 'waste-dashboard', lbl: 'Waste Dashboard' });
      if (isAdmin || hasPerm('fn_view_all_orders')) reportItems.push({ r: 'top-products', lbl: 'Top Products' });
      if (isAdmin)                        reportItems.push({ r: 'cutoff',          lbl: 'Cutoff Violations' });
      if (hasPerm('fn_view_audit_log'))   reportItems.push({ r: 'audit',           lbl: 'Audit Trail' });
      if (reportItems.length) {
        html += sdGroup('reports', '◈', 'Reports', reportItems.map(
          i => `<div class="sd-flyout-item${currentRoute === i.r ? ' active' : ''}" data-route="${i.r}" onclick="App.go('${i.r}')">${i.lbl}</div>`
        ).join(''));
      }
    }

    html += `<div class="sd-footer">
      <div class="sd-version">v2.2.1 | 14 Mar 2026</div>
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
    return `<div class="sd-item${active}" data-route="${route}" onclick="App.go('${route}')"><span class="sd-item-icon">${icon}</span><span class="sd-item-text">${label}</span></div>`;
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
    const initials = getInitials(s.display_name);
    const isAdmin = S.sidebarRole === 'admin';
    let html = `<div class="mob-sidebar-header"><div class="topbar-avatar" style="width:28px;height:28px;font-size:10px">${esc(initials)}</div><div><div style="font-size:12px;font-weight:600">${esc(s.display_name)}</div><div style="font-size:9px;color:var(--t3)">${esc(s.tier_id)} · ${esc(getStoreName(s.store_id))}</div></div></div>`;
    html += mobItem('home', '◇', 'Dashboard');

    if (S.role === 'store') {
      html += '<div style="height:8px"></div><div class="mob-sidebar-section">Orders</div>';
      if (hasPerm('fn_create_order')) html += `<div class="mob-sd-item" data-route="browse" onclick="App.closeSidebar();App.goToBrowse()"><span class="sd-item-icon">⊞</span>Create Order</div>`;
      if (hasPerm('fn_view_own_orders')) html += mobItem('orders', '⊞', 'View Orders');
      if (hasPerm('fn_create_order')) html += mobItem('quota', '⊞', 'Set Quota');
      html += '<div style="height:4px"></div><div class="mob-sidebar-section">Records</div>';
      if (hasPerm('fn_view_waste')) html += mobItem('waste', '▤', 'Waste Log');
      if (hasPerm('fn_view_returns')) html += mobItem('returns', '▤', 'Returns');
    } else {
      // BC role
      html += '<div style="height:8px"></div><div class="mob-sidebar-section">Orders</div>';
      html += mobItem('orders', '⊞', 'View Orders');
      html += mobItem('print', '⊞', 'Print Centre');
      html += '<div style="height:4px"></div><div class="mob-sidebar-section">Records</div>';
      html += mobItem('waste', '▤', 'Waste Log');
      html += mobItem('bc-returns', '▤', 'Incoming Returns');

      // Admin section
      const hasAnyAdmin = hasPerm('fn_manage_products') || hasPerm('fn_manage_visibility') || hasPerm('fn_manage_permissions') || hasPerm('fn_manage_dept_mapping') || hasPerm('fn_manage_config');
      if (hasAnyAdmin) {
        html += '<div style="height:4px"></div><div class="mob-sidebar-section">Admin</div>';
        if (hasPerm('fn_manage_products'))     html += mobItem('products',     '⚙', 'Manage Products');
        if (hasPerm('fn_manage_visibility'))   html += mobItem('visibility',   '⚙', 'Product Visibility');
        if (hasPerm('fn_manage_permissions'))  html += mobItem('access',       '⚙', 'User Access');
        if (hasPerm('fn_manage_dept_mapping')) html += mobItem('dept-mapping', '⚙', 'Dept Mapping');
        if (hasPerm('fn_manage_config'))       html += mobItem('config',       '⚙', 'System Config');
      }

      // Reports section
      const hasAnyReport = hasPerm('fn_view_waste') || isAdmin || hasPerm('fn_view_audit_log');
      if (hasAnyReport) {
        html += '<div style="height:4px"></div><div class="mob-sidebar-section">Reports</div>';
        if (hasPerm('fn_view_waste'))                      html += mobItem('waste-dashboard', '◈', 'Waste Dashboard');
        if (isAdmin || hasPerm('fn_view_all_orders'))      html += mobItem('top-products',    '◈', 'Top Products');
        if (isAdmin)                                       html += mobItem('cutoff',          '◈', 'Cutoff Violations');
        if (hasPerm('fn_view_audit_log'))                  html += mobItem('audit',           '◈', 'Audit Trail');
      }
    }

    html += `<div class="mob-sd-footer"><div style="font-size:9px;color:var(--t4);margin-bottom:4px">v2.2.1</div><a href="${API.HOME_URL}" style="font-size:10px;color:var(--t3);text-decoration:none">← Back to Home</a><br><a href="#" style="font-size:10px;color:var(--red);text-decoration:none" onclick="API.logout();return false">→ Log out</a></div>`;
    panel.innerHTML = html;
  }
  function mobItem(route, icon, label) {
    const active = currentRoute === route ? ' active' : '';
    return `<div class="mob-sd-item${active}" data-route="${route}" onclick="App.closeSidebar();App.go('${route}')"><span class="sd-item-icon">${icon}</span>${label}</div>`;
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
    const initials = getInitials(s.display_name);
    showDialog(`<div class="popup-sheet" style="width:340px">
      <div class="popup-header"><div class="popup-title">Profile</div><button class="popup-close" onclick="App.closeDialog()">✕</button></div>
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
        <div class="topbar-avatar" style="width:48px;height:48px;font-size:18px">${esc(initials)}</div>
        <div><div style="font-size:16px;font-weight:700">${esc(s.display_name)}</div><div style="font-size:12px;color:var(--t3)">${esc(s.full_name || s.display_name)}</div></div>
      </div>
      <div style="background:var(--bg3);border-radius:var(--rd);padding:14px;font-size:13px;margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:var(--t3)">Store</span><span style="font-weight:600">${esc(getStoreName(s.store_id))}</span></div>
        <div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:var(--t3)">Dept</span><span style="font-weight:600">${esc(s.dept_id)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:var(--t3)">Tier</span><span style="font-weight:600">${esc(s.tier_id)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:var(--t3)">Stock Points</span><span style="font-weight:600">${getStockPoints()}</span></div>
      </div>
      <button class="btn btn-primary btn-full" style="margin-bottom:10px" onclick="App.closeDialog();location.href='${API.HOME_URL}'">View Full Profile</button>
      <button class="btn btn-outline btn-full" style="color:var(--red);border-color:var(--red)" onclick="App.closeDialog();API.logout()">Log out</button>
    </div>`);
  }

  // ═══ HELPERS ═══
  function hasPerm(fnId) { const tl = parseInt((S.session?.tier_id || 'T9').replace('T', '')); return tl <= 2 || S.permissions.includes(fnId); }
  function esc(str) { if (str == null) return ''; const d = document.createElement('div'); d.textContent = String(str); return d.innerHTML; }
  function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }
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
      S.categories = resp.categories || []; S._catsLoaded = true;
      API.cache.set('cats', S.categories, 1440);
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
    showProfilePopup, startOrder, goToBrowse, hasPerm, refreshCurrent,
    openSidebar, closeSidebar, toggleSidebar,
    getStockPoints, getCartItem, setCartQty, setCartStock, toggleCartUrgent, setCartNote,
    loadOrders, loadOrderDetail, loadWaste, loadReturns, loadBrowseData, loadQuotas, loadQuotaScreen,
    loadBCDashboard, loadPrintCentre, loadBCReturnsData, loadAdminProducts, loadProdEdit,
    loadDeptMappingData, loadVisibility, loadAccessMatrix,
    loadWasteDashboard, loadTopProducts, loadCutoffData, loadAuditData,
    getStoreName, getDeptName,
    sydneyNow, fmtDate, todaySydney, tomorrowSydney, fmtDateThai, fmtDateAU,
  };
})();
