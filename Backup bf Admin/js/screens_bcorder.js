/**
 * Version 1.5.8 | 14 MAR 2026 | Siam Palette Group
 * ═══════════════════════════════════════════
 * SPG — BC Order v2
 * screens_bcorder.js — Screen Renderers (Store + shared)
 * Phase 2: View Orders BC section filter + click action
 * ═══════════════════════════════════════════
 */

const Scr = (() => {
  const HOME = API.HOME_URL;

  // ─── SORT UTILITY (shared across all lists) ───
  function sortArr(arr, key, dir) {
    return [...arr].sort((a, b) => {
      let va = a[key] ?? '', vb = b[key] ?? '';
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }
  function sortIco(activeKey, key, dir) {
    if (activeKey !== key) return '<span class="sort-ico">⇅</span>';
    return '<span class="sort-ico sort-on">' + (dir > 0 ? '▲' : '▼') + '</span>';
  }

  // ═══ STATUS SCREENS ═══
  function renderLoading() {
    return `<div style="display:flex;align-items:center;justify-content:center;height:100dvh;flex-direction:column;gap:12px"><div class="spinner"></div><div style="font-size:13px;color:var(--t3)">กำลังเชื่อมต่อ...</div></div>`;
  }
  function renderNoToken() {
    return `<div style="display:flex;align-items:center;justify-content:center;height:100dvh;flex-direction:column;gap:16px;padding:24px;text-align:center"><div style="font-size:56px">🔒</div><div style="font-size:18px;font-weight:700">กรุณา Login ผ่าน Home</div><div style="font-size:13px;color:var(--t3)">BC Order ต้องเข้าผ่าน SPG App Home Module</div><button class="btn btn-primary" onclick="location.href='${HOME}'">🏠 ไปหน้า Home</button></div>`;
  }
  function renderInvalidToken() {
    return `<div style="display:flex;align-items:center;justify-content:center;height:100dvh;flex-direction:column;gap:16px;padding:24px;text-align:center"><div style="font-size:56px">⏰</div><div style="font-size:18px;font-weight:700">Session หมดอายุ</div><div style="font-size:13px;color:var(--t3)">กรุณา Login ใหม่ผ่าน Home Module</div><button class="btn btn-primary" onclick="location.href='${HOME}'">🏠 Login ใหม่</button></div>`;
  }
  function renderBlocked() {
    return `<div style="display:flex;align-items:center;justify-content:center;height:100dvh;flex-direction:column;gap:16px;padding:24px;text-align:center"><div style="font-size:56px">⛔</div><div style="font-size:18px;font-weight:700">ไม่สามารถเข้าใช้ได้</div><div style="font-size:13px;color:var(--t3)">Department ของคุณยังไม่ได้ตั้งค่า<br>กรุณาติดต่อ Admin</div><button class="btn btn-outline" onclick="location.href='${HOME}'">🏠 กลับ Home</button></div>`;
  }

  // ═══ DASHBOARD ═══
  function renderDashboard() {
    const s = App.S.session || {};
    return `<div class="content" id="mainContent">
      <div style="margin-bottom:16px"><div style="font-size:14px;font-weight:700;margin-bottom:2px">Welcome, ${App.esc(s.display_name)}</div><div style="font-size:11px;color:var(--t3)">${App.esc(s.tier_id)} · ${App.esc(App.S.deptMapping?.module_role || App.S.role)} · ${App.esc(App.getStoreName(s.store_id))} · ${App.esc(s.dept_id)}</div></div>
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--t3);margin-bottom:6px">Orders</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px">
        ${App.S.cart.length > 0
          ? dCard('📝', 'Continue Order (' + App.S.cart.length + ')', "App.goToBrowse()", true)
          : dCard('📝', 'Create Order', "App.goToBrowse()", true)}
        ${dCard('📋', 'View Orders', "App.go('orders')")}
        ${dCard('📊', 'Set Quota', "App.go('quota')")}
      </div>
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--t3);margin-bottom:6px">Records</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        ${dCard('🗑️', 'Record Waste', "App.go('waste')")}
        ${dCard('↩️', 'Returns', "App.go('returns')")}
      </div>
      <div id="dashStats" style="margin-top:20px"></div>
    </div>`;
  }
  function dCard(icon, label, onclick, accent) {
    return `<div class="card${accent ? ' card-accent' : ''}" onclick="${onclick}"><div class="card-row"><span>${icon}</span><div class="card-label">${label}</div><span class="card-arrow">›</span></div></div>`;
  }
  function fillDashboard() {
    const el = document.getElementById('dashStats'); if (!el) return;
    const d = App.S.dashboard; if (!d?.by_status) { el.innerHTML = ''; return; }
    const bs = d.by_status;
    el.innerHTML = `<div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--t3);margin-bottom:6px">Today</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
        ${sCard('Pending', bs.Pending || 0, 'var(--orange)')}${sCard('Ordered', bs.Ordered || 0, 'var(--blue)')}${sCard('Fulfilled', bs.Fulfilled || 0, 'var(--green)')}
      </div>`;
  }
  function sCard(label, count, color) {
    return `<div style="background:var(--bg);border:1px solid var(--bd2);border-radius:var(--rd);padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:${color}">${count}</div><div style="font-size:10px;color:var(--t3)">${label}</div></div>`;
  }

  // ═══ BROWSE PRODUCTS ═══
  function renderBrowse() {
    const today = App.todaySydney();
    const tmr = App.tomorrowSydney();
    const dd = App.S.deliveryDate || tmr;
    const isToday = dd === today;
    const isTmr = dd === tmr;
    const isCustom = !isToday && !isTmr;
    const hasData = App.S.cart.length > 0 || Object.keys(App.S.stockInputs).length > 0;

    const resumeBar = hasData ? `<div class="browse-resume">
      <span class="browse-resume-text">📝 กำลังสั่ง${App.S.cart.length ? ' (' + App.S.cart.length + ' รายการ)' : ' (มีสต็อกค้าง)'}</span>
      <button class="btn btn-outline" style="padding:3px 10px;font-size:11px" onclick="App.startOrder()">🗑️ ล้างใหม่</button>
    </div>` : '';

    return `
      <div class="browse-header">
        ${resumeBar}
        <div class="date-pills">
          <span class="date-label">ส่งวัน</span>
          <div class="chip${isToday ? ' active' : ''}" onclick="Scr.setDate('today')">วันนี้</div>
          <div class="chip${isTmr ? ' active' : ''}" onclick="Scr.setDate('tomorrow')">พรุ่งนี้</div>
          <div class="chip${isCustom ? ' active' : ''}" onclick="document.getElementById('customDate').showPicker?.();document.getElementById('customDate').focus()">เลือกวัน</div>
          <input type="date" id="customDate" value="${dd}" style="position:absolute;opacity:0;pointer-events:none" onchange="Scr.setDate(this.value)">
          <span class="date-display">${App.fmtDateThai(dd)}</span>
        </div>
        <div class="search-bar">
          <input class="search-input" placeholder="🔍 ค้นหาสินค้า..." value="${App.esc(App.S.productSearch)}" oninput="App.S.productSearch=this.value;Scr.filterProducts()">
        </div>
        <div class="cat-chips" id="catChips"></div>
      </div>
      <div class="content" id="productList">
        <div class="skel skel-card"></div><div class="skel skel-card"></div><div class="skel skel-card"></div>
      </div>
      <div class="cart-footer" id="cartFooter" style="display:none" onclick="App.go('cart')">🛒 ดูตะกร้า (<span id="cartCount">0</span>) →</div>`;
  }

  function fillBrowse() {
    // Category chips
    const chipEl = document.getElementById('catChips');
    if (chipEl) {
      const cats = App.S.categories;
      const f = App.S.productFilter;
      chipEl.innerHTML = `<div class="chip${f === 'all' ? ' active' : ''}" onclick="App.S.productFilter='all';Scr.filterProducts()">ทั้งหมด</div>` +
        cats.map(c => `<div class="chip${f === c.cat_id ? ' active' : ''}" onclick="App.S.productFilter='${c.cat_id}';Scr.filterProducts()">${App.esc(c.cat_name)}</div>`).join('');
    }
    filterProducts();
  }

  function filterProducts() {
    const el = document.getElementById('productList');
    if (!el) return;
    const prods = App.S.products;
    if (!prods.length) { el.innerHTML = '<div class="empty"><div class="empty-icon">📦</div><div class="empty-title">ไม่พบสินค้า</div></div>'; return; }

    const search = (App.S.productSearch || '').toLowerCase();
    const catFilter = App.S.productFilter;
    let filtered = prods;
    if (catFilter !== 'all') filtered = filtered.filter(p => p.cat_id === catFilter || p.category_id === catFilter);
    if (search) filtered = filtered.filter(p => (p.product_name || '').toLowerCase().includes(search));

    if (!filtered.length) { el.innerHTML = '<div class="empty"><div class="empty-icon">🔍</div><div class="empty-title">ไม่พบสินค้า</div><div class="empty-desc">ลองเปลี่ยนคำค้นหา</div></div>'; return; }

    const sp = App.getStockPoints();
    const quotas = App.S.quotas || {};
    el.innerHTML = '<div class="product-grid">' + filtered.map(p => renderProductCard(p, sp, quotas[p.product_id])).join('') + '</div>';
    updateCartFooter();
  }

  function renderProductCard(p, stockPoints, quotaVal) {
    const cart = App.getCartItem(p.product_id);
    const qty = cart ? cart.qty : 0;
    const isInCart = qty > 0;
    const isUrg = cart?.is_urgent || false;
    const pid = p.product_id;
    const qDisplay = quotaVal != null ? quotaVal : '—';
    const maxLabel = p.max_order ? ' · Max ' + p.max_order : '';
    const saved = App.S.stockInputs[pid]; // prefill from memory

    let stockHtml;
    if (stockPoints === 2) {
      const v1 = saved?.s1 ?? '';
      const v2 = saved?.s2 ?? '';
      const sum = (v1 !== '' || v2 !== '') ? (parseFloat(v1) || 0) + (parseFloat(v2) || 0) : '—';
      stockHtml = `<div class="pcard-stock2">
        <div class="pcard-stock2-col"><div class="pcard-col-sub">จุด 1</div><input type="number" step="0.1" id="stk1-${pid}" class="stock-inp-sm" placeholder="—" value="${v1}" oninput="Scr.onStock2(this,'${pid}')"></div>
        <div class="pcard-stock2-col"><div class="pcard-col-sub">จุด 2</div><input type="number" step="0.1" id="stk2-${pid}" class="stock-inp-sm" placeholder="—" value="${v2}" oninput="Scr.onStock2(this,'${pid}')"></div>
      </div>
      <div class="pcard-stock-sum">รวม <span id="stkSum-${pid}">${sum}</span></div>`;
    } else {
      const v = saved ?? '';
      stockHtml = `<input type="number" step="0.1" id="stk-${pid}" class="stock-inp" placeholder="กรอก" value="${v}" oninput="Scr.onStock1(this,'${pid}')">`;
    }

    return `<div class="pcard${isInCart ? ' pcard-active' : ''}" id="pc-${pid}">
      <div class="pcard-hd">
        <div class="pcard-info"><div class="pcard-name">${App.esc(p.product_name)}</div><div class="pcard-meta">Min ${p.min_order || 1} · Step ${p.order_step || 1}${maxLabel} · ${App.esc(p.unit || '')}</div></div>
        <div class="pcard-urg${isUrg ? ' on' : ''}" id="urg-${pid}" onclick="Scr.toggleUrg('${pid}')" title="Urgent">⚡</div>
      </div>
      <div class="pcard-labels"><div>โควตา</div><div>สต็อก</div><div>สั่ง</div></div>
      <div class="pcard-row">
        <div class="pcard-quota"><div class="pcard-quota-val">${qDisplay}</div></div>
        <div class="pcard-stock">${stockHtml}</div>
        <div class="pcard-order">
          <div class="stepper">
            <div class="stp-btn${isInCart ? ' stp-active' : ''}" onclick="Scr.step('${pid}',-1)">−</div>
            <div class="stp-val${isInCart ? ' stp-has' : ''}" id="qty-${pid}">${qty}</div>
            <div class="stp-btn${isInCart ? ' stp-active' : ''}" onclick="Scr.step('${pid}',1)">+</div>
          </div>
        </div>
      </div>
    </div>`;
  }

  // ─── STEPPER: Targeted update (RULE 09) + max_order cap ───
  function step(pid, dir) {
    const p = App.S.products.find(pr => pr.product_id === pid);
    if (!p) return;
    const minOrd = p.min_order || 1;
    const stepVal = p.order_step || 1;
    const maxOrd = p.max_order || 9999;
    const cart = App.getCartItem(pid);
    let qty = cart ? cart.qty : 0;

    if (dir > 0) {
      qty = qty === 0 ? minOrd : qty + stepVal;
      if (qty > maxOrd) { App.toast(p.product_name + ': สูงสุด ' + maxOrd, 'warning'); qty = maxOrd; }
    } else {
      qty = qty - stepVal;
      if (qty < minOrd) qty = 0;
    }

    App.setCartQty(pid, qty);
    const sc = App.getCartItem(pid);
    if (sc) sc._auto = false;

    // Read stock value from memory (not DOM) and save to cart
    if (qty > 0) {
      const sv = readStockValue(pid);
      App.setCartStock(pid, sv);
    }

    // Targeted DOM update (not full re-render)
    const qtyEl = document.getElementById('qty-' + pid);
    if (qtyEl) { qtyEl.textContent = qty; qtyEl.className = 'stp-val' + (qty > 0 ? ' stp-has' : ''); }
    const card = document.getElementById('pc-' + pid);
    if (card) card.className = 'pcard' + (qty > 0 ? ' pcard-active' : '');
    const urgEl = document.getElementById('urg-' + pid);
    if (urgEl && qty === 0) urgEl.className = 'pcard-urg';
    card?.querySelectorAll('.stp-btn').forEach(b => b.className = 'stp-btn' + (qty > 0 ? ' stp-active' : ''));
    updateCartFooter();
  }

  function toggleUrg(pid) {
    const cart = App.getCartItem(pid);
    if (!cart) return;
    App.toggleCartUrgent(pid);
    const el = document.getElementById('urg-' + pid);
    if (el) el.className = 'pcard-urg' + (cart.is_urgent ? ' on' : '');
  }

  function readStockValue(pid) {
    const saved = App.S.stockInputs[pid];
    const sp = App.getStockPoints();
    if (sp === 2) {
      const v1 = parseFloat(saved?.s1) || 0;
      const v2 = parseFloat(saved?.s2) || 0;
      return (v1 || v2) ? v1 + v2 : null;
    }
    return saved != null && saved !== '' ? parseFloat(saved) : null;
  }

  // ─── Stock input handlers: save to S.stockInputs + auto-suggest ───
  function onStock1(el, pid) {
    App.S.stockInputs[pid] = el.value;
    const cart = App.getCartItem(pid);
    if (cart) App.setCartStock(pid, parseFloat(el.value) || null);
    autoSuggest(pid, parseFloat(el.value));
  }

  function onStock2(el, pid) {
    const v1 = document.getElementById('stk1-' + pid)?.value || '';
    const v2 = document.getElementById('stk2-' + pid)?.value || '';
    App.S.stockInputs[pid] = { s1: v1, s2: v2 };
    const n1 = parseFloat(v1) || 0;
    const n2 = parseFloat(v2) || 0;
    const sum = n1 + n2;
    const sumEl = document.getElementById('stkSum-' + pid);
    if (sumEl) sumEl.textContent = (n1 || n2) ? sum : '—';
    const cart = App.getCartItem(pid);
    if (cart) App.setCartStock(pid, (n1 || n2) ? sum : null);
    if (n1 || n2) autoSuggest(pid, sum);
  }

  // ─── Auto-suggest: quota − stock → fill stepper (recalc if auto, skip if user set) ───
  function autoSuggest(pid, stockVal) {
    if (stockVal == null || isNaN(stockVal)) return;
    const cart = App.getCartItem(pid);
    if (cart && cart.qty > 0 && !cart._auto) return; // user กดเอง → ไม่แตะ

    const p = App.S.products.find(pr => pr.product_id === pid);
    if (!p) return;
    const quota = App.S.quotas[pid];
    if (quota == null || quota <= 0) return; // no quota → no suggest

    const minOrd = p.min_order || 1;
    const stepVal = p.order_step || 1;
    const maxOrd = p.max_order || 9999;

    let suggest = Math.max(quota - stockVal, 0);
    if (suggest <= 0) {
      if (cart && cart._auto) {
        App.setCartQty(pid, 0);
        const qtyEl = document.getElementById('qty-' + pid);
        if (qtyEl) { qtyEl.textContent = 0; qtyEl.className = 'stp-val'; }
        const card = document.getElementById('pc-' + pid);
        if (card) card.className = 'pcard';
        card?.querySelectorAll('.stp-btn').forEach(b => b.className = 'stp-btn');
        const urgEl = document.getElementById('urg-' + pid);
        if (urgEl) urgEl.className = 'pcard-urg';
        updateCartFooter();
      }
      return;
    }

    // Round up to min_order
    if (suggest < minOrd) suggest = minOrd;
    // Round to order_step
    if (stepVal > 1) suggest = Math.ceil(suggest / stepVal) * stepVal;
    // Cap at max_order
    if (suggest > maxOrd) suggest = maxOrd;

    // Auto-fill stepper
    App.setCartQty(pid, suggest);
    App.setCartStock(pid, stockVal);
    const ac = App.getCartItem(pid);
    if (ac) ac._auto = true;

    // Targeted DOM update
    const qtyEl = document.getElementById('qty-' + pid);
    if (qtyEl) { qtyEl.textContent = suggest; qtyEl.className = 'stp-val stp-has'; }
    const card = document.getElementById('pc-' + pid);
    if (card) card.className = 'pcard pcard-active';
    card?.querySelectorAll('.stp-btn').forEach(b => b.className = 'stp-btn stp-active');
    updateCartFooter();
  }

  function updateCartFooter() {
    const count = App.S.cart.length;
    const footer = document.getElementById('cartFooter');
    const countEl = document.getElementById('cartCount');
    if (footer) footer.style.display = count > 0 ? '' : 'none';
    if (countEl) countEl.textContent = count;
  }

  function setDate(val) {
    if (val === 'today') App.S.deliveryDate = App.todaySydney();
    else if (val === 'tomorrow') App.S.deliveryDate = App.tomorrowSydney();
    else App.S.deliveryDate = val;
    // Reload quotas for new date then re-render
    App.loadQuotas().then(() => { App.go('browse'); });
  }

  // ═══ CART ═══
  function renderCart() {
    const items = App.S.cart;
    if (items.length === 0) {
      return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('browse')">←</button><div class="toolbar-title">ตะกร้า</div></div>
        <div class="content"><div class="empty"><div class="empty-icon">🛒</div><div class="empty-title">ตะกร้าว่าง</div><div class="empty-desc">กลับไปเลือกสินค้า</div></div></div>`;
    }

    const dd = App.S.deliveryDate;
    const cartHtml = items.map((c, i) => `<div class="cart-item">
      <div class="cart-item-hd">
        <div class="cart-item-name">${App.esc(c.product_name)}</div>
        <div class="cart-item-qty">${c.qty} ${App.esc(c.unit)}</div>
      </div>
      <div class="cart-item-meta">
        ${c.is_urgent ? '<span class="cart-urg">⚡ URGENT</span>' : ''}
        ${c.stock_on_hand != null ? '<span class="cart-stock">สต็อก: ' + c.stock_on_hand + '</span>' : ''}
      </div>
      <div class="cart-item-note">
        <input class="inp" placeholder="Note..." value="${App.esc(c.note || '')}" oninput="App.setCartNote('${c.product_id}',this.value)">
      </div>
      <div class="cart-item-actions">
        <span class="cart-edit" onclick="App.go('browse')">← แก้ไข</span>
        <span class="cart-remove" onclick="Scr.removeCartItem('${c.product_id}')">🗑️ ลบ</span>
      </div>
    </div>`).join('');

    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('browse')">←</button><div class="toolbar-title">ตะกร้า (${items.length})</div><div class="toolbar-sub">ส่ง ${App.fmtDateThai(dd)}</div></div>
      <div class="content" id="cartContent">
        ${cartHtml}
        <div class="cart-note-section">
          <div class="lb">หมายเหตุ (ทั้ง Order)</div>
          <textarea class="inp" rows="2" placeholder="เช่น ส่งก่อน 8 โมง..." oninput="App.S.headerNote=this.value">${App.esc(App.S.headerNote)}</textarea>
        </div>
        <button class="btn btn-green btn-full cart-submit" id="submitBtn" onclick="Scr.submitOrder()">📤 ส่ง Order (${items.length} รายการ)</button>
      </div>`;
  }

  function removeCartItem(pid) {
    App.setCartQty(pid, 0);
    App.go('cart'); // re-render cart
  }

  async function submitOrder() {
    const btn = document.getElementById('submitBtn');
    if (!btn || btn.disabled) return;
    btn.disabled = true;
    btn.textContent = 'กำลังส่ง...';

    const items = App.S.cart.map(c => ({
      product_id: c.product_id,
      qty: c.qty,
      is_urgent: c.is_urgent,
      note: c.note || '',
      stock_on_hand: c.stock_on_hand,
    }));

    // Collect all stock for history
    const allStock = App.S.products.map(p => {
      const cart = App.getCartItem(p.product_id);
      const quota = App.S.quotas[p.product_id] || 0;
      return {
        product_id: p.product_id,
        stock_on_hand: cart?.stock_on_hand || 0,
        quota_qty: quota,
        order_qty: cart?.qty || 0,
      };
    }).filter(s => s.stock_on_hand > 0 || s.order_qty > 0);

    try {
      const resp = await API.createOrder({
        delivery_date: App.S.deliveryDate,
        header_note: App.S.headerNote,
        items,
        all_stock: allStock,
      });

      if (resp.success) {
        App.toast(resp.message || '✅ สั่งเรียบร้อย!', 'success');
        App.S.cart = [];
        App.S._ordersLoaded = false; // force reload orders next time
        App.go('home');
      } else {
        App.toast(resp.message || resp.error || 'เกิดข้อผิดพลาด', 'error');
        btn.disabled = false;
        btn.textContent = '📤 ส่ง Order (' + App.S.cart.length + ' รายการ)';
      }
    } catch (e) {
      App.toast('Network error: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = '📤 ส่ง Order (' + App.S.cart.length + ' รายการ)';
    }
  }

  // ═══ VIEW ORDERS ═══
  let _orderFilter = 'all';
  let _orderSectionFilter = 'all';
  let _orderDateFrom = '';
  let _orderDateTo = '';
  let _orderShowCount = 5;
  let _orderSortKey = 'delivery_date';
  let _orderSortDir = -1;

  function renderOrders() {
    const y = App.sydneyNow(); y.setDate(y.getDate() - 1);
    const t = App.sydneyNow(); t.setDate(t.getDate() + 1);
    _orderDateFrom = _orderDateFrom || App.fmtDate(y);
    _orderDateTo = _orderDateTo || App.fmtDate(t);
    _orderFilter = 'all';
    _orderSectionFilter = 'all';
    _orderShowCount = 5;

    const isBC = App.S.role === 'bc';
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">View Orders</div></div>
      <div class="order-date-bar">
        <span class="date-label">📅 ส่ง:</span>
        <input type="date" class="date-inp" value="${_orderDateFrom}" onchange="Scr.setOrderDate('from',this.value)">
        <span style="color:var(--t4)">→</span>
        <input type="date" class="date-inp" value="${_orderDateTo}" onchange="Scr.setOrderDate('to',this.value)">
        <span class="date-link" onclick="Scr.setOrderDatePreset('today')">วันนี้</span>
        <span class="date-link" onclick="Scr.setOrderDatePreset('3day')">3 วัน</span>
        <span class="date-link" onclick="Scr.setOrderDatePreset('all')">ทั้งหมด</span>
      </div>
      ${isBC ? '<div class="order-chips" id="sectionChips"></div>' : ''}
      <div class="order-chips" id="orderChips"></div>
      <div class="content" id="ordersContent"><div class="skel skel-card"></div><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillOrders() {
    const el = document.getElementById('ordersContent');
    const chipEl = document.getElementById('orderChips');
    const secEl = document.getElementById('sectionChips');
    if (!el) return;
    const isBC = App.S.role === 'bc';

    const all = App.S.orders || [];
    // Filter by date range
    let filtered = all;
    if (_orderDateFrom) filtered = filtered.filter(o => (o.delivery_date || '') >= _orderDateFrom);
    if (_orderDateTo) filtered = filtered.filter(o => (o.delivery_date || '') <= _orderDateTo);

    // BC: Section filter (filter by items' section_id)
    if (isBC && _orderSectionFilter !== 'all') {
      filtered = filtered.filter(o => (o.items || []).some(i => i.section_id === _orderSectionFilter));
    }

    // BC: Populate section chips
    if (secEl && isBC) {
      const secs = new Set();
      all.forEach(o => (o.items || []).forEach(i => { if (i.section_id) secs.add(i.section_id); }));
      const sorted = [...secs].sort();
      secEl.innerHTML = `<div class="chip${_orderSectionFilter === 'all' ? ' active' : ''}" onclick="Scr.setOrderSection('all')">All</div>` +
        sorted.map(s => `<div class="chip${_orderSectionFilter === s ? ' active' : ''}" onclick="Scr.setOrderSection('${s}')">${App.esc(s)}</div>`).join('');
    }

    // Count by status
    const counts = { all: filtered.length, Pending: 0, Ordered: 0, Done: 0, Cancelled: 0 };
    filtered.forEach(o => {
      if (o.status === 'Pending') counts.Pending++;
      else if (o.status === 'Ordered') counts.Ordered++;
      else if (['Fulfilled', 'Delivered', 'InProgress'].includes(o.status)) counts.Done++;
      else if (['Cancelled', 'Rejected'].includes(o.status)) counts.Cancelled++;
    });

    // Status chips
    if (chipEl) {
      const chips = [
        { k: 'all', l: 'ทั้งหมด', c: counts.all },
        { k: 'Pending', l: 'Pending', c: counts.Pending },
        { k: 'Ordered', l: 'Ordered', c: counts.Ordered },
        { k: 'Done', l: 'Done', c: counts.Done },
        { k: 'Cancelled', l: 'Cancel', c: counts.Cancelled },
      ];
      chipEl.innerHTML = chips.map(f => `<div class="chip${_orderFilter === f.k ? ' active' : ''}" onclick="Scr.setOrderFilter('${f.k}')">${f.l}${f.c ? ' (' + f.c + ')' : ''}</div>`).join('');
    }

    // Apply status filter
    let shown = filtered;
    if (_orderFilter === 'Pending') shown = filtered.filter(o => o.status === 'Pending');
    else if (_orderFilter === 'Ordered') shown = filtered.filter(o => o.status === 'Ordered');
    else if (_orderFilter === 'Done') shown = filtered.filter(o => ['Fulfilled', 'Delivered', 'InProgress'].includes(o.status));
    else if (_orderFilter === 'Cancelled') shown = filtered.filter(o => ['Cancelled', 'Rejected'].includes(o.status));

    if (shown.length === 0) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">📋</div><div class="empty-title">ไม่พบ Order</div><div class="empty-desc">ลองเปลี่ยนช่วงวัน</div></div>';
      return;
    }

    // Sort
    shown = sortArr(shown, _orderSortKey, _orderSortDir);

    const visible = shown.slice(0, _orderShowCount);
    const hasMore = shown.length > _orderShowCount;

    const sb = (k, lbl) => `<span class="sort-btn${_orderSortKey === k ? ' sort-active' : ''}" onclick="Scr.sortOrders('${k}')">${lbl} ${sortIco(_orderSortKey, k, _orderSortDir)}</span>`;

    el.innerHTML = `<div class="list-header"><div style="font-size:11px;color:var(--t3)">${shown.length} รายการ</div>
        <div class="sort-bar">Sort: ${sb('delivery_date','วันส่ง')} ${sb('order_id','ID')} ${sb('status','Status')}</div>
      </div>
      <div class="order-list">${visible.map(o => renderOrderCard(o)).join('')}</div>
      ${hasMore ? `<div class="load-more" onclick="Scr.showMoreOrders()">แสดง ${_orderShowCount} จาก ${shown.length} · โหลดเพิ่มอีก 5 ↓</div>` : ''}`;
  }

  function renderOrderCard(o) {
    const items = (o.items || []);
    const summary = items.slice(0, 3).map(i => {
      const name = (i.product_name || '').split(' ')[0];
      return name + ' ×' + i.qty_ordered + (i.is_urgent ? '⚡' : '');
    }).join(', ');
    const isDone = ['Fulfilled', 'Delivered'].includes(o.status);
    const stsClass = { Pending: 'sts-pending', Ordered: 'sts-ordered', InProgress: 'sts-ordered', Fulfilled: 'sts-fulfilled', Delivered: 'sts-fulfilled', Cancelled: 'sts-cancelled', Rejected: 'sts-cancelled' }[o.status] || '';
    const borderColor = { Pending: 'var(--red)', Ordered: 'var(--blue)', InProgress: 'var(--orange)', Fulfilled: 'var(--green)', Delivered: 'var(--green)' }[o.status] || 'var(--bd)';

    // BC: Pending→accept, Ordered→fulfil; Store: always→order-detail
    let onclick;
    if (App.S.role === 'bc') {
      if (o.status === 'Pending') onclick = `App.go('accept',{id:'${o.order_id}'})`;
      else if (o.status === 'Ordered') onclick = `App.go('fulfil',{id:'${o.order_id}'})`;
      else onclick = `App.go('order-detail',{id:'${o.order_id}'})`;
    } else {
      onclick = `App.go('order-detail',{id:'${o.order_id}'})`;
    }

    return `<div class="ocard${isDone ? ' ocard-done' : ''}" style="border-left-color:${borderColor}" onclick="${onclick}">
      <div class="ocard-hd"><span class="ocard-id">${App.esc(o.order_id)}</span><span class="sts ${stsClass}">${o.status}</span></div>
      <div class="ocard-sub">ส่ง ${App.fmtDateThai(o.delivery_date)} · ${App.esc(App.getStoreName(o.store_id))}</div>
      <div class="ocard-items">${App.esc(summary)}</div>
    </div>`;
  }

  function setOrderSection(sec) { _orderSectionFilter = sec; _orderShowCount = 5; fillOrders(); }
  function setOrderFilter(f) { _orderFilter = f; _orderShowCount = 5; fillOrders(); }
  function sortOrders(key) { if (_orderSortKey === key) _orderSortDir *= -1; else { _orderSortKey = key; _orderSortDir = key === 'delivery_date' ? -1 : 1; } fillOrders(); }
  function setOrderDate(which, val) { if (which === 'from') _orderDateFrom = val; else _orderDateTo = val; fillOrders(); }
  function setOrderDatePreset(p) {
    const today = App.todaySydney();
    if (p === 'today') { _orderDateFrom = today; _orderDateTo = today; }
    else if (p === '3day') { const y = App.sydneyNow(); y.setDate(y.getDate() - 1); const t = App.sydneyNow(); t.setDate(t.getDate() + 1); _orderDateFrom = App.fmtDate(y); _orderDateTo = App.fmtDate(t); }
    else { _orderDateFrom = ''; _orderDateTo = ''; }
    fillOrders();
  }
  function showMoreOrders() { _orderShowCount += 5; fillOrders(); }

  // ═══ ORDER DETAIL ═══
  function renderOrderDetail(params) {
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('orders')">←</button><div class="toolbar-title">Order Detail</div></div>
      <div class="content" id="detailContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillOrderDetail() {
    const el = document.getElementById('detailContent');
    if (!el) return;
    const data = App.S.currentOrder;
    if (!data) { el.innerHTML = '<div class="empty"><div class="empty-icon">❌</div><div class="empty-title">ไม่พบข้อมูล</div></div>'; return; }

    const o = data.order;
    const items = data.items || [];
    const canEdit = ['Pending', 'Ordered'].includes(o.status);
    const stsClass = { Pending: 'sts-pending', Ordered: 'sts-ordered', InProgress: 'sts-ordered', Fulfilled: 'sts-fulfilled', Delivered: 'sts-fulfilled', Cancelled: 'sts-cancelled', Rejected: 'sts-cancelled' }[o.status] || '';

    el.innerHTML = `
      <div class="detail-info">
        <div class="detail-hd"><span class="detail-id">${App.esc(o.order_id)}</span><span class="sts ${stsClass}">${o.status}</span></div>
        <div class="detail-grid">
          <div><div class="detail-label">วันสั่ง</div><div class="detail-val">${App.fmtDateThai(o.order_date)}</div></div>
          <div><div class="detail-label">วันส่ง</div><div class="detail-val">${App.fmtDateThai(o.delivery_date)}</div></div>
          <div><div class="detail-label">โดย</div><div class="detail-val">${App.esc(o.display_name)}</div></div>
          <div><div class="detail-label">ร้าน</div><div class="detail-val">${App.esc(App.getStoreName(o.store_id))}</div></div>
        </div>
        ${o.header_note ? '<div class="detail-note">📝 ' + App.esc(o.header_note) + '</div>' : ''}
      </div>

      <div class="detail-section-title">รายการ (${items.length})</div>
      <div class="detail-items">${items.map(i => renderDetailItem(i, canEdit)).join('')}</div>

      ${canEdit ? '<div style="margin-top:14px"><button class="btn btn-danger btn-full" onclick="Scr.confirmCancel(\'' + o.order_id + '\')">🚫 ยกเลิก Order</button></div>' : ''}
      ${o.status === 'Cancelled' ? '<div style="margin-top:8px;font-size:12px;color:var(--red)">ยกเลิกเมื่อ ' + App.fmtDateThai(o.cancelled_at?.substring(0, 10)) + (o.cancel_reason ? ' — ' + App.esc(o.cancel_reason) : '') + '</div>' : ''}`;
  }

  function renderDetailItem(i, canEdit) {
    const isFulfilled = !!i.fulfilment_status;
    return `<div class="ditem${isFulfilled ? ' ditem-done' : ''}" onclick="${canEdit && !isFulfilled ? "Scr.showEditItem('" + i.item_id + "')" : ''}">
      <div class="ditem-hd">
        <div><div class="ditem-name">${App.esc(i.product_name)}</div>
        <div class="ditem-meta">${i.qty_ordered} ${App.esc(i.unit)}${i.is_urgent ? ' · <span style="color:var(--orange)">⚡ URGENT</span>' : ''}</div>
        ${i.stock_on_hand != null ? '<div class="ditem-stock">สต็อก: ' + i.stock_on_hand + ' → สั่ง: ' + i.qty_ordered + '</div>' : ''}
        ${i.item_note ? '<div class="ditem-note">📝 ' + App.esc(i.item_note) + '</div>' : ''}
        </div>
        ${isFulfilled ? '<span class="ditem-ful">✓ ' + (i.fulfilment_status === 'full' ? 'full (' + i.qty_sent + ')' : i.fulfilment_status + ' (' + i.qty_sent + ')') + '</span>' : (canEdit ? '<span class="ditem-edit">แก้ไข ›</span>' : '')}
      </div>
    </div>`;
  }

  // ─── Edit Item Popup ───
  function showEditItem(itemId) {
    const data = App.S.currentOrder;
    if (!data) return;
    const item = data.items.find(i => i.item_id === itemId);
    if (!item) return;

    App.showDialog(`<div class="popup-sheet" style="width:380px">
      <div class="popup-header"><div class="popup-title">แก้ไข — ${App.esc(item.product_name)}</div><button class="popup-close" onclick="App.closeDialog()">✕</button></div>
      <div style="padding:10px 14px;background:var(--bg3);border-radius:var(--rd);margin-bottom:12px;font-size:12px">
        <div style="display:flex;justify-content:space-between"><span style="color:var(--t3)">เดิม</span><span style="font-weight:700">${item.qty_ordered} ${App.esc(item.unit)}</span></div>
        ${item.stock_on_hand != null ? '<div style="display:flex;justify-content:space-between;margin-top:4px"><span style="color:var(--t3)">สต็อก</span><span style="font-weight:600;color:var(--blue)">' + item.stock_on_hand + '</span></div>' : ''}
      </div>
      <div class="fg"><label class="lb">จำนวนใหม่ *</label><input class="inp" type="number" id="editQty" value="${item.qty_ordered}" min="0" style="width:120px;font-size:16px;font-weight:700;text-align:center"><div style="font-size:10px;color:var(--t4);margin-top:4px">ใส่ 0 = ลบรายการ</div></div>
      <div class="fg"><label class="lb">Urgent</label><div style="display:flex;gap:8px"><div class="chip${item.is_urgent ? ' active' : ''}" id="editUrg1" onclick="document.getElementById('editUrg1').classList.add('active');document.getElementById('editUrg0').classList.remove('active')">⚡</div><div class="chip${!item.is_urgent ? ' active' : ''}" id="editUrg0" onclick="document.getElementById('editUrg0').classList.add('active');document.getElementById('editUrg1').classList.remove('active')">ปกติ</div></div></div>
      <div class="fg"><label class="lb">Note</label><input class="inp" id="editNote" value="${App.esc(item.item_note || '')}"></div>
      <div style="display:flex;gap:8px"><button class="btn btn-outline" style="flex:1" onclick="App.closeDialog()">ยกเลิก</button><button class="btn btn-primary" style="flex:1" id="editSaveBtn" onclick="Scr.saveEditItem('${item.item_id}','${data.order.order_id}')">💾 บันทึก</button></div>
    </div>`);
  }

  async function saveEditItem(itemId, orderId) {
    const btn = document.getElementById('editSaveBtn');
    if (!btn || btn.disabled) return;
    btn.disabled = true; btn.textContent = 'กำลังบันทึก...';

    const qty = parseInt(document.getElementById('editQty')?.value) || 0;
    const isUrg = document.getElementById('editUrg1')?.classList.contains('active') || false;
    const note = document.getElementById('editNote')?.value || '';

    try {
      const resp = await API.editOrder({
        order_id: orderId,
        items: [{ item_id: itemId, qty, is_urgent: isUrg, note }],
      });
      if (resp.success) {
        App.closeDialog();
        App.toast(resp.message || '✅ แก้ไขแล้ว', 'success');
        // Update memory
        const item = App.S.currentOrder?.items?.find(i => i.item_id === itemId);
        if (item) { item.qty_ordered = qty; item.is_urgent = isUrg; item.item_note = note; }
        App.S._ordersLoaded = false; // force reload next time
        fillOrderDetail(); // re-render detail from memory
      } else {
        App.toast(resp.message || 'Error', 'error');
        btn.disabled = false; btn.textContent = '💾 บันทึก';
      }
    } catch (e) {
      App.toast('Network error', 'error');
      btn.disabled = false; btn.textContent = '💾 บันทึก';
    }
  }

  // ─── Cancel Order ───
  function confirmCancel(orderId) {
    App.showDialog(`<div class="popup-sheet" style="width:340px">
      <div class="popup-title" style="margin-bottom:12px">🚫 ยกเลิก Order?</div>
      <div style="font-size:13px;color:var(--t2);margin-bottom:12px">${App.esc(orderId)}</div>
      <div class="fg"><label class="lb">เหตุผล (ถ้ามี)</label><input class="inp" id="cancelReason" placeholder="เช่น สั่งผิด..."></div>
      <div style="display:flex;gap:8px"><button class="btn btn-outline" style="flex:1" onclick="App.closeDialog()">ไม่ใช่</button><button class="btn btn-danger" style="flex:1" id="cancelBtn" onclick="Scr.doCancel('${orderId}')">ยกเลิกเลย</button></div>
    </div>`);
  }

  async function doCancel(orderId) {
    const btn = document.getElementById('cancelBtn');
    if (!btn || btn.disabled) return;
    btn.disabled = true; btn.textContent = 'กำลังยกเลิก...';

    const reason = document.getElementById('cancelReason')?.value || '';
    try {
      const resp = await API.cancelOrder({ order_id: orderId, reason });
      if (resp.success) {
        App.closeDialog();
        App.toast(resp.message || '✅ ยกเลิกแล้ว', 'success');
        // Update memory
        if (App.S.currentOrder?.order) App.S.currentOrder.order.status = 'Cancelled';
        const idx = App.S.orders.findIndex(o => o.order_id === orderId);
        if (idx >= 0) App.S.orders[idx].status = 'Cancelled';
        fillOrderDetail();
      } else {
        App.toast(resp.message || 'Error', 'error');
        btn.disabled = false; btn.textContent = 'ยกเลิกเลย';
      }
    } catch (e) {
      App.toast('Network error', 'error');
      btn.disabled = false; btn.textContent = 'ยกเลิกเลย';
    }
  }

  // ═══ SET QUOTA ═══
  const DAYS = ['จ','อ','พ','พฤ','ศ','ส','อา'];
  // day_of_week: 0=Sun,1=Mon...6=Sat → display order: Mon=1,Tue=2,...Sun=0
  const DAY_MAP = [1,2,3,4,5,6,0]; // display order → day_of_week
  let _quotaSearch = '';
  let _quotaCatFilter = 'all';
  let _quotaSnapshot = {};

  function renderQuota() {
    _quotaSearch = '';
    _quotaCatFilter = 'all';
    _quotaSnapshot = {};
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">Set Quota</div></div>
      <div class="content" id="quotaContent"><div class="skel skel-card"></div><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillQuota() {
    const el = document.getElementById('quotaContent');
    if (!el) return;
    const prods = App.S.products;
    if (!prods.length) { el.innerHTML = '<div class="empty"><div class="empty-icon">📊</div><div class="empty-title">ไม่พบสินค้า</div></div>'; return; }

    const cats = App.S.categories || [];
    const catChips = `<div class="chip${_quotaCatFilter === 'all' ? ' active' : ''}" onclick="Scr.setQuotaCat('all')">ทั้งหมด</div>` +
      cats.map(c => `<div class="chip${_quotaCatFilter === c.cat_id ? ' active' : ''}" onclick="Scr.setQuotaCat('${c.cat_id}')">${App.esc(c.cat_name)}</div>`).join('');

    const saveBtn = '<div style="display:flex;justify-content:center;margin-bottom:12px"><button class="btn btn-primary" style="padding:10px 40px" id="quotaSaveBtnTop" onclick="Scr.saveQuota()">💾 บันทึก</button></div>';

    el.innerHTML = `<div class="q-wrap">
      <div style="font-size:11px;color:var(--t3);margin-bottom:8px">โควตาต่อวัน · ${prods.length} สินค้า</div>
      <input class="search-input" placeholder="🔍 ค้นหา..." value="${App.esc(_quotaSearch)}" oninput="Scr.filterQuota(this.value)" style="max-width:400px;margin-bottom:8px">
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">${catChips}</div>
      ${saveBtn}
      <div id="quotaDesk" class="q-desk-only"></div>
      <div id="quotaMob" class="q-mob-only"></div>
      <div style="display:flex;justify-content:center;margin:14px 0">
        <button class="btn btn-primary" style="padding:10px 40px" id="quotaSaveBtn" onclick="Scr.saveQuota()">💾 บันทึก</button>
      </div>
    </div>`;
    renderQuotaTable();
    renderQuotaMobile();

    // Snapshot for diff save
    _quotaSnapshot = {};
    prods.forEach(p => {
      const pq = (App.S.quotaMap || {})[p.product_id] || {};
      DAY_MAP.forEach(dow => {
        _quotaSnapshot[p.product_id + '-' + dow] = pq[dow] || 0;
      });
    });
  }

  function getFilteredProducts() {
    let prods = App.S.products;
    if (_quotaCatFilter !== 'all') prods = prods.filter(p => p.cat_id === _quotaCatFilter || p.category_id === _quotaCatFilter);
    if (_quotaSearch) {
      const s = _quotaSearch.toLowerCase();
      prods = prods.filter(p => (p.product_name || '').toLowerCase().includes(s));
    }
    return prods;
  }

  function filterQuota(val) {
    _quotaSearch = val;
    renderQuotaTable();
    renderQuotaMobile();
  }

  function setQuotaCat(catId) {
    _quotaCatFilter = catId;
    fillQuota();
  }

  // ─── Desktop: Table ───
  function renderQuotaTable() {
    const el = document.getElementById('quotaDesk');
    if (!el) return;
    const prods = getFilteredProducts();
    const qm = App.S.quotaMap || {};

    let rows = prods.map(p => {
      const pq = qm[p.product_id] || {};
      const cells = DAY_MAP.map(dow =>
        `<td><input type="number" min="0" class="q-inp" id="qi-${p.product_id}-${dow}" value="${pq[dow] || 0}"></td>`
      ).join('');
      return `<tr><td class="q-name">${App.esc(p.product_name)}</td>${cells}</tr>`;
    }).join('');

    el.innerHTML = `<div class="q-card"><table class="q-tbl">
      <thead><tr><th>สินค้า</th>${DAYS.map(d => '<th>' + d + '</th>').join('')}</tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  }

  // ─── Mobile: Accordion ───
  function renderQuotaMobile() {
    const el = document.getElementById('quotaMob');
    if (!el) return;
    const prods = getFilteredProducts();
    const qm = App.S.quotaMap || {};

    el.innerHTML = prods.map(p => {
      const pq = qm[p.product_id] || {};
      const summary = DAY_MAP.map(dow => pq[dow] || 0).join('·');
      return `<div class="qacc" id="qacc-${p.product_id}">
        <div class="qacc-hd" onclick="Scr.toggleQuotaAcc('${p.product_id}')">
          <div class="qacc-name">${App.esc(p.product_name)}</div>
          <span class="qacc-sum">${summary}</span>
          <span class="qacc-arr">▸</span>
        </div>
      </div>`;
    }).join('');
  }

  function toggleQuotaAcc(pid) {
    const card = document.getElementById('qacc-' + pid);
    if (!card) return;
    const existing = card.querySelector('.qacc-body');
    const arr = card.querySelector('.qacc-arr');

    if (existing) {
      // Collapse
      existing.remove();
      card.classList.remove('qacc-open');
      if (arr) arr.textContent = '▸';
      return;
    }

    // Expand
    card.classList.add('qacc-open');
    if (arr) arr.textContent = '▾';
    const qm = App.S.quotaMap || {};
    const pq = qm[pid] || {};

    const body = document.createElement('div');
    body.className = 'qacc-body';
    body.innerHTML = `<div class="qacc-grid">${DAY_MAP.map((dow, i) =>
      `<div><div class="qacc-day">${DAYS[i]}</div><input type="number" min="0" class="qacc-inp" id="qi-${pid}-${dow}" value="${pq[dow] || 0}"></div>`
    ).join('')}</div>`;
    card.appendChild(body);
  }

  async function saveQuota() {
    const btn = document.getElementById('quotaSaveBtn');
    const btnTop = document.getElementById('quotaSaveBtnTop');
    if (btn?.disabled || btnTop?.disabled) return;

    // Collect only changed values (diff against snapshot)
    const changed = [];
    App.S.products.forEach(p => {
      DAY_MAP.forEach(dow => {
        const inp = document.getElementById('qi-' + p.product_id + '-' + dow);
        if (!inp) return;
        const newVal = parseInt(inp.value) || 0;
        const oldVal = _quotaSnapshot[p.product_id + '-' + dow] || 0;
        if (newVal !== oldVal) {
          changed.push({ product_id: p.product_id, day_of_week: dow, quota_qty: newVal });
        }
      });
    });

    if (!changed.length) { App.toast('ไม่มีการเปลี่ยนแปลง', 'warning'); return; }

    // Disable both buttons
    if (btn) { btn.disabled = true; btn.textContent = 'กำลังบันทึก...'; }
    if (btnTop) { btnTop.disabled = true; btnTop.textContent = 'กำลังบันทึก...'; }

    try {
      const resp = await API.saveQuotas({
        store_id: App.S.session.store_id,
        dept_id: App.S.session.dept_id,
        quotas: changed,
      });
      if (resp.success) {
        App.toast(`✅ บันทึก ${changed.length} รายการ`, 'success');
        // Update memory + snapshot
        changed.forEach(q => {
          if (!App.S.quotaMap[q.product_id]) App.S.quotaMap[q.product_id] = {};
          App.S.quotaMap[q.product_id][q.day_of_week] = q.quota_qty;
          _quotaSnapshot[q.product_id + '-' + q.day_of_week] = q.quota_qty;
        });
        App.S._quotasDay = -1; // invalidate browse quotas cache
      } else {
        App.toast(resp.message || 'Error', 'error');
      }
    } catch (e) {
      App.toast('Network error: ' + e.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '💾 บันทึก'; }
      if (btnTop) { btnTop.disabled = false; btnTop.textContent = '💾 บันทึก'; }
    }
  }
  // ═══ WASTE LOG ═══
  let _wasteDateFrom = '';
  let _wasteDateTo = '';
  let _wasteShowCount = 5;
  let _wasteSortKey = 'waste_date';
  let _wasteSortDir = -1;

  function renderWaste() {
    const y = App.sydneyNow(); y.setDate(y.getDate() - 1);
    const t = App.sydneyNow(); t.setDate(t.getDate() + 1);
    _wasteDateFrom = _wasteDateFrom || App.fmtDate(y);
    _wasteDateTo = _wasteDateTo || App.fmtDate(t);
    _wasteShowCount = 5;

    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">Waste Log</div></div>
      <div class="order-date-bar">
        <span class="date-label">📅 วันที่:</span>
        <input type="date" class="date-inp" value="${_wasteDateFrom}" onchange="Scr.setWasteDate('from',this.value)">
        <span style="color:var(--t4)">→</span>
        <input type="date" class="date-inp" value="${_wasteDateTo}" onchange="Scr.setWasteDate('to',this.value)">
        <span class="date-link" onclick="Scr.setWasteDatePreset('3day')">3 วัน</span>
        <span class="date-link" onclick="Scr.setWasteDatePreset('all')">ทั้งหมด</span>
      </div>
      <div class="content" id="wasteContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillWaste() {
    const el = document.getElementById('wasteContent');
    if (!el) return;
    const all = App.S.wasteLog || [];

    // Filter by date
    let filtered = all;
    if (_wasteDateFrom) filtered = filtered.filter(w => (w.waste_date || '') >= _wasteDateFrom);
    if (_wasteDateTo) filtered = filtered.filter(w => (w.waste_date || '') <= _wasteDateTo);

    if (!filtered.length) {
      el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div></div><button class="btn btn-primary" onclick="Scr.showWasteForm()">+ บันทึกใหม่</button></div>
        <div class="empty"><div class="empty-icon">✅</div><div class="empty-title">ยังไม่มีรายการ Waste</div></div>`;
      return;
    }

    // Sort
    filtered = sortArr(filtered, _wasteSortKey, _wasteSortDir);

    const visible = filtered.slice(0, _wasteShowCount);
    const hasMore = filtered.length > _wasteShowCount;
    const reasonColor = (r) => r === 'Expired' ? 'var(--red)' : r === 'Damaged' ? 'var(--orange)' : r === 'Production Error' ? 'var(--acc)' : 'var(--t2)';
    const wsb = (k, lbl) => `<span class="sort-btn${_wasteSortKey === k ? ' sort-active' : ''}" onclick="Scr.sortWaste('${k}')">${lbl} ${sortIco(_wasteSortKey, k, _wasteSortDir)}</span>`;

    el.innerHTML = `<div class="list-header">
        <div class="sort-bar">Sort: ${wsb('waste_date','วันที่')} ${wsb('product_name','สินค้า')} ${wsb('quantity','จำนวน')} ${wsb('reason','สาเหตุ')}</div>
        <button class="btn btn-primary" onclick="Scr.showWasteForm()">+ บันทึกใหม่</button>
      </div>
      <div class="waste-list">${visible.map(w => `<div class="wcard" style="border-left-color:${reasonColor(w.reason)}">
        <div class="wcard-hd"><span class="wcard-name">${App.esc(w.product_name)}</span><span class="wcard-qty">−${w.quantity} ${App.esc(w.unit)}</span></div>
        <div class="wcard-meta">${App.fmtDateAU(w.waste_date)} · ${App.esc(w.reason)} · โดย ${App.esc(w.recorded_by_name)}</div>
        <div class="wcard-actions">
          <span class="wcard-edit" onclick="Scr.showWasteEdit('${w.waste_id}')">✏️ แก้ไข</span>
          <span class="wcard-del" onclick="Scr.confirmDeleteWaste('${w.waste_id}')">🗑️ ลบ</span>
        </div>
      </div>`).join('')}</div>
      ${hasMore ? `<div class="load-more" onclick="Scr.showMoreWaste()">แสดง ${_wasteShowCount} จาก ${filtered.length} · โหลดเพิ่มอีก 5 ↓</div>` : ''}`;
  }

  function setWasteDate(which, val) { if (which === 'from') _wasteDateFrom = val; else _wasteDateTo = val; fillWaste(); }
  function sortWaste(key) { if (_wasteSortKey === key) _wasteSortDir *= -1; else { _wasteSortKey = key; _wasteSortDir = key === 'waste_date' ? -1 : 1; } fillWaste(); }
  function setWasteDatePreset(p) {
    if (p === '3day') { const y = App.sydneyNow(); y.setDate(y.getDate() - 1); const t = App.sydneyNow(); t.setDate(t.getDate() + 1); _wasteDateFrom = App.fmtDate(y); _wasteDateTo = App.fmtDate(t); }
    else { _wasteDateFrom = ''; _wasteDateTo = ''; }
    fillWaste();
  }
  function showMoreWaste() { _wasteShowCount += 5; fillWaste(); }

  // ─── Waste Form Popup (Create) ───
  function showWasteForm() {
    const prods = App.S.products || [];
    const opts = prods.map(p => `<option value="${p.product_id}">${App.esc(p.product_name)} (${App.esc(p.unit)})</option>`).join('');
    const s = App.S.session || {};

    App.showDialog(`<div class="popup-sheet">
      <div class="popup-header"><div class="popup-title">🗑️ บันทึกของเสีย</div><button class="popup-close" onclick="App.closeDialog()">✕</button></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--bd2);margin-bottom:6px;font-size:11px"><span style="color:var(--t3)">ผู้บันทึก</span><span style="font-weight:600;color:var(--acc)">${App.esc(s.display_name)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--bd2);margin-bottom:12px;font-size:11px"><span style="color:var(--t3)">วันที่</span><span style="font-weight:600;color:var(--acc)">${App.fmtDateThai(App.todaySydney())} (auto)</span></div>
      <div class="fg"><label class="lb">สินค้า *</label><select class="sel" id="wfProduct"><option value="">🔍 เลือก...</option>${opts}</select></div>
      <div class="fg"><label class="lb">จำนวน *</label><input class="inp" type="number" id="wfQty" placeholder="0" min="1" style="font-size:16px;font-weight:700"></div>
      <div class="fg"><label class="lb">วันผลิต</label><input class="inp" type="date" id="wfProdDate"></div>
      <div class="fg"><label class="lb">สาเหตุ *</label><select class="sel" id="wfReason"><option value="Expired">Expired</option><option value="Damaged">Damaged</option><option value="Production Error">Prod Error</option><option value="Quality">Quality</option></select></div>
      <div style="display:flex;gap:8px"><button class="btn btn-outline" style="flex:1" onclick="App.closeDialog()">ยกเลิก</button><button class="btn btn-primary" style="flex:1" id="wfSaveBtn" onclick="Scr.saveWaste()">💾 บันทึก</button></div>
    </div>`);
  }

  async function saveWaste() {
    const btn = document.getElementById('wfSaveBtn');
    if (!btn || btn.disabled) return;

    const productId = document.getElementById('wfProduct')?.value;
    const qty = parseInt(document.getElementById('wfQty')?.value) || 0;
    const reason = document.getElementById('wfReason')?.value;
    const prodDate = document.getElementById('wfProdDate')?.value || '';

    if (!productId) { App.toast('เลือกสินค้า', 'error'); return; }
    if (!qty || qty <= 0) { App.toast('ใส่จำนวน', 'error'); return; }

    btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
    try {
      const resp = await API.createWaste({ product_id: productId, quantity: qty, reason, production_date: prodDate });
      if (resp.success) {
        App.closeDialog();
        App.toast(resp.message || '✅ บันทึกแล้ว', 'success');
        // Push to memory
        const prod = App.S.products.find(p => p.product_id === productId);
        App.S.wasteLog.unshift({
          waste_id: resp.data.waste_id, product_id: productId, quantity: qty,
          waste_date: App.todaySydney(), production_date: prodDate, reason,
          product_name: prod?.product_name || productId, unit: prod?.unit || '',
          recorded_by_name: App.S.session?.display_name || '',
        });
        fillWaste();
      } else {
        App.toast(resp.message || 'Error', 'error');
        btn.disabled = false; btn.textContent = '💾 บันทึก';
      }
    } catch (e) {
      App.toast('Network error', 'error');
      btn.disabled = false; btn.textContent = '💾 บันทึก';
    }
  }

  // ─── Waste Edit Popup ───
  function showWasteEdit(wasteId) {
    const w = App.S.wasteLog.find(x => x.waste_id === wasteId);
    if (!w) return;

    App.showDialog(`<div class="popup-sheet" style="width:380px">
      <div class="popup-header"><div class="popup-title">✏️ แก้ไข — ${App.esc(w.product_name)}</div><button class="popup-close" onclick="App.closeDialog()">✕</button></div>
      <div class="fg"><label class="lb">จำนวน *</label><input class="inp" type="number" id="weQty" value="${w.quantity}" min="1" style="font-size:16px;font-weight:700"></div>
      <div class="fg"><label class="lb">วันผลิต</label><input class="inp" type="date" id="weProdDate" value="${w.production_date || ''}"></div>
      <div class="fg"><label class="lb">สาเหตุ</label><select class="sel" id="weReason">
        <option value="Expired"${w.reason === 'Expired' ? ' selected' : ''}>Expired</option>
        <option value="Damaged"${w.reason === 'Damaged' ? ' selected' : ''}>Damaged</option>
        <option value="Production Error"${w.reason === 'Production Error' ? ' selected' : ''}>Prod Error</option>
        <option value="Quality"${w.reason === 'Quality' ? ' selected' : ''}>Quality</option>
      </select></div>
      <div style="display:flex;gap:8px"><button class="btn btn-outline" style="flex:1" onclick="App.closeDialog()">ยกเลิก</button><button class="btn btn-primary" style="flex:1" id="weSaveBtn" onclick="Scr.saveWasteEdit('${wasteId}')">💾 บันทึก</button></div>
    </div>`);
  }

  async function saveWasteEdit(wasteId) {
    const btn = document.getElementById('weSaveBtn');
    if (!btn || btn.disabled) return;
    btn.disabled = true; btn.textContent = 'กำลังบันทึก...';

    const qty = parseInt(document.getElementById('weQty')?.value) || 0;
    const reason = document.getElementById('weReason')?.value;
    const prodDate = document.getElementById('weProdDate')?.value || '';

    try {
      const resp = await API.editWaste({ waste_id: wasteId, quantity: qty, reason, production_date: prodDate });
      if (resp.success) {
        App.closeDialog();
        App.toast('✅ แก้ไขแล้ว', 'success');
        // Update memory
        const w = App.S.wasteLog.find(x => x.waste_id === wasteId);
        if (w) { w.quantity = qty; w.reason = reason; w.production_date = prodDate; }
        fillWaste();
      } else {
        App.toast(resp.message || 'Error', 'error');
        btn.disabled = false; btn.textContent = '💾 บันทึก';
      }
    } catch (e) {
      App.toast('Network error', 'error');
      btn.disabled = false; btn.textContent = '💾 บันทึก';
    }
  }

  // ─── Waste Delete ───
  function confirmDeleteWaste(wasteId) {
    App.showDialog(`<div class="popup-sheet" style="width:320px">
      <div class="popup-title" style="margin-bottom:12px">🗑️ ลบรายการนี้?</div>
      <div style="font-size:13px;color:var(--t2);margin-bottom:16px">${App.esc(wasteId)}</div>
      <div style="display:flex;gap:8px"><button class="btn btn-outline" style="flex:1" onclick="App.closeDialog()">ไม่ใช่</button><button class="btn btn-danger" style="flex:1" id="wDelBtn" onclick="Scr.doDeleteWaste('${wasteId}')">ลบเลย</button></div>
    </div>`);
  }

  async function doDeleteWaste(wasteId) {
    const btn = document.getElementById('wDelBtn');
    if (!btn || btn.disabled) return;
    btn.disabled = true; btn.textContent = 'กำลังลบ...';

    try {
      const resp = await API.deleteWaste({ waste_id: wasteId });
      if (resp.success) {
        App.closeDialog();
        App.toast('✅ ลบแล้ว', 'success');
        App.S.wasteLog = App.S.wasteLog.filter(w => w.waste_id !== wasteId);
        fillWaste();
      } else {
        App.toast(resp.message || 'Error', 'error');
        btn.disabled = false; btn.textContent = 'ลบเลย';
      }
    } catch (e) {
      App.toast('Network error', 'error');
      btn.disabled = false; btn.textContent = 'ลบเลย';
    }
  }
  // ═══ RETURNS ═══
  let _retDateFrom = '';
  let _retDateTo = '';
  let _retShowCount = 5;
  let _retSortKey = 'created_at';
  let _retSortDir = -1;

  function renderReturns() {
    const y = App.sydneyNow(); y.setDate(y.getDate() - 1);
    const t = App.sydneyNow(); t.setDate(t.getDate() + 1);
    _retDateFrom = _retDateFrom || App.fmtDate(y);
    _retDateTo = _retDateTo || App.fmtDate(t);
    _retShowCount = 5;

    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">Returns</div></div>
      <div class="order-date-bar">
        <span class="date-label">📅 วันที่:</span>
        <input type="date" class="date-inp" value="${_retDateFrom}" onchange="Scr.setRetDate('from',this.value)">
        <span style="color:var(--t4)">→</span>
        <input type="date" class="date-inp" value="${_retDateTo}" onchange="Scr.setRetDate('to',this.value)">
        <span class="date-link" onclick="Scr.setRetDatePreset('3day')">3 วัน</span>
        <span class="date-link" onclick="Scr.setRetDatePreset('all')">ทั้งหมด</span>
      </div>
      <div class="content" id="returnsContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillReturns() {
    const el = document.getElementById('returnsContent');
    if (!el) return;
    const all = App.S.returns || [];

    let filtered = all;
    if (_retDateFrom) filtered = filtered.filter(r => (r.created_at || '').substring(0, 10) >= _retDateFrom);
    if (_retDateTo) filtered = filtered.filter(r => (r.created_at || '').substring(0, 10) <= _retDateTo);

    if (!filtered.length) {
      el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div></div><button class="btn btn-primary" onclick="Scr.showReturnForm()">➕ แจ้ง Return</button></div>
        <div class="empty"><div class="empty-icon">✅</div><div class="empty-title">ยังไม่มี Return</div></div>`;
      return;
    }

    // Sort
    filtered = sortArr(filtered, _retSortKey, _retSortDir);

    const visible = filtered.slice(0, _retShowCount);
    const hasMore = filtered.length > _retShowCount;
    const rsb = (k, lbl) => `<span class="sort-btn${_retSortKey === k ? ' sort-active' : ''}" onclick="Scr.sortReturns('${k}')">${lbl} ${sortIco(_retSortKey, k, _retSortDir)}</span>`;

    el.innerHTML = `<div class="list-header">
        <div class="sort-bar">Sort: ${rsb('created_at','วันที่')} ${rsb('product_name','สินค้า')} ${rsb('status','Status')}</div>
        <button class="btn btn-primary" onclick="Scr.showReturnForm()">➕ แจ้ง Return</button>
      </div>
      <div class="ret-list">${visible.map(r => renderReturnCard(r)).join('')}</div>
      ${hasMore ? `<div class="load-more" onclick="Scr.showMoreReturns()">แสดง ${_retShowCount} จาก ${filtered.length} · โหลดเพิ่มอีก 5 ↓</div>` : ''}`;
  }

  function renderReturnCard(r) {
    const resolved = ['Reworked', 'Wasted'].includes(r.status);
    const stsStyle = {
      Reported: 'background:#fffbeb;color:#92400e',
      Received: 'background:#dbeafe;color:#1e40af',
      Wasted: 'background:#fef2f2;color:#991b1b',
      Reworked: 'background:#d1fae5;color:#065f46',
    }[r.status] || 'background:var(--bg3);color:var(--t2)';
    const borderColor = { Reported: 'var(--orange)', Received: 'var(--blue)', Wasted: 'var(--red)', Reworked: 'var(--green)' }[r.status] || 'var(--bd)';
    const canEdit = r.status === 'Reported';

    return `<div class="rcard${resolved ? ' rcard-done' : ''}" style="border-left-color:${borderColor}">
      <div class="rcard-hd"><span class="rcard-id">${App.esc(r.return_id)}</span><span class="sts" style="${stsStyle}">${r.status}</span></div>
      <div class="rcard-prod">${App.esc(r.product_name)} ×${r.quantity}</div>
      <div class="rcard-meta">${App.esc(r.issue_type)} · ${App.esc(r.action === 'return_to_bakery' ? 'ส่งคืน BC' : 'ทิ้งที่ร้าน')}</div>
      <div class="rcard-actions">
        <button class="btn btn-outline" style="padding:3px 10px;font-size:11px" onclick="Scr.showReturnDetail('${r.return_id}')">👁️ Detail</button>
        ${canEdit ? `<button class="btn btn-outline" style="padding:3px 10px;font-size:11px;color:var(--acc);border-color:var(--acc)" onclick="Scr.showReturnEdit('${r.return_id}')">✏️ แก้ไข</button>` : resolved ? '<span style="font-size:10px;color:var(--t4);padding:4px 0">✅ BC ดำเนินการแล้ว</span>' : '<span style="font-size:10px;color:var(--t4);padding:4px 0">🔒 BC รับแล้ว</span>'}
      </div>
    </div>`;
  }

  function setRetDate(which, val) { if (which === 'from') _retDateFrom = val; else _retDateTo = val; fillReturns(); }
  function sortReturns(key) { if (_retSortKey === key) _retSortDir *= -1; else { _retSortKey = key; _retSortDir = key === 'created_at' ? -1 : 1; } fillReturns(); }
  function setRetDatePreset(p) {
    if (p === '3day') { const y = App.sydneyNow(); y.setDate(y.getDate() - 1); const t = App.sydneyNow(); t.setDate(t.getDate() + 1); _retDateFrom = App.fmtDate(y); _retDateTo = App.fmtDate(t); }
    else { _retDateFrom = ''; _retDateTo = ''; }
    fillReturns();
  }
  function showMoreReturns() { _retShowCount += 5; fillReturns(); }

  // ─── Return Detail Popup (Timeline) ───
  function showReturnDetail(returnId) {
    const r = App.S.returns.find(x => x.return_id === returnId);
    if (!r) return;
    const actionLabel = r.action === 'return_to_bakery' ? '📦 ส่งคืน BC' : '🗑️ ทิ้งที่ร้าน';
    const stsStyle = { Reported: 'background:#fffbeb;color:#92400e', Received: 'background:#dbeafe;color:#1e40af', Wasted: 'background:#fef2f2;color:#991b1b', Reworked: 'background:#d1fae5;color:#065f46' }[r.status] || '';

    // Timeline
    let timeline = `<div class="ret-tl-item"><div class="ret-tl-dot" style="background:var(--orange)"></div><span><b>Reported</b> — ${App.esc(r.reported_by_name)} · ${App.fmtDateThai(r.created_at?.substring(0, 10))}</span></div>`;
    if (r.status === 'Received') {
      timeline += `<div class="ret-tl-item"><div class="ret-tl-dot" style="background:var(--blue)"></div><span><b>Received</b> — BC รับแล้ว</span></div>`;
      timeline += `<div class="ret-tl-item ret-tl-pending"><div class="ret-tl-dot ret-tl-dot-pending"></div><span>รอดำเนินการ...</span></div>`;
    } else if (['Reworked', 'Wasted'].includes(r.status)) {
      timeline += `<div class="ret-tl-item"><div class="ret-tl-dot" style="background:var(--blue)"></div><span><b>Received</b></span></div>`;
      timeline += `<div class="ret-tl-item"><div class="ret-tl-dot" style="background:var(--green)"></div><span><b>${r.status}</b>${r.resolved_by_name ? ' — ' + App.esc(r.resolved_by_name) : ''}</span></div>`;
    } else {
      timeline += `<div class="ret-tl-item ret-tl-pending"><div class="ret-tl-dot ret-tl-dot-pending"></div><span>รอ BC รับ...</span></div>`;
    }

    const canEdit = r.status === 'Reported';
    App.showDialog(`<div class="popup-sheet" style="width:400px">
      <div class="popup-header"><div class="popup-title">↩️ ${App.esc(r.return_id)}</div><span class="sts" style="${stsStyle}">${r.status}</span></div>
      <div style="font-size:13px;font-weight:600;margin-bottom:4px">${App.esc(r.product_name)}</div>
      <div style="font-size:12px;color:var(--t2);margin-bottom:12px;line-height:1.6">${r.quantity} ${App.esc(r.unit)} · ${App.esc(r.issue_type)}<br>${r.description ? App.esc(r.description) + '<br>' : ''}${actionLabel}</div>
      <div style="font-size:12px;font-weight:600;margin-bottom:6px">📊 Timeline</div>
      <div class="ret-timeline">${timeline}</div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn btn-outline" style="flex:1" onclick="App.closeDialog()">← ปิด</button>
        ${canEdit ? `<button class="btn btn-primary" style="flex:1" onclick="App.closeDialog();Scr.showReturnEdit('${r.return_id}')">✏️ แก้ไข</button>` : ''}
      </div>
    </div>`);
  }

  // ─── Return Form Popup (Create) ───
  function showReturnForm() {
    const prods = App.S.products || [];
    const opts = prods.map(p => `<option value="${p.product_id}">${App.esc(p.product_name)} (${App.esc(p.unit)})</option>`).join('');

    App.showDialog(`<div class="popup-sheet">
      <div class="popup-header"><div class="popup-title">↩️ แจ้ง Return</div><button class="popup-close" onclick="App.closeDialog()">✕</button></div>
      <div class="fg"><label class="lb">❶ สินค้า *</label><select class="sel" id="rfProduct"><option value="">-- เลือก --</option>${opts}</select></div>
      <div class="fg"><label class="lb">❷ จำนวน *</label><input class="inp" type="number" id="rfQty" min="1" style="font-size:16px;font-weight:700"></div>
      <div class="fg"><label class="lb">❸ ปัญหา *</label><select class="sel" id="rfIssue"><option value="Quality">Quality</option><option value="Wrong qty">Wrong qty</option><option value="Wrong product">Wrong product</option><option value="Damaged">Damaged</option></select></div>
      <div class="fg"><label class="lb">❹ รายละเอียด</label><textarea class="inp" id="rfDesc" style="height:60px;resize:none" placeholder="อธิบาย..."></textarea></div>
      <div class="fg"><label class="lb">❺ วันผลิต</label><input class="inp" type="date" id="rfProdDate"></div>
      <div class="fg"><label class="lb">❻ การจัดการ *</label><select class="sel" id="rfAction"><option value="return_to_bakery">ส่งคืน BC</option><option value="discard_at_store">ทิ้งที่ร้าน</option></select></div>
      <div style="display:flex;gap:8px"><button class="btn btn-outline" style="flex:1" onclick="App.closeDialog()">ยกเลิก</button><button class="btn btn-primary" style="flex:1" id="rfSaveBtn" onclick="Scr.saveReturn()">📤 ส่ง</button></div>
    </div>`);
  }

  async function saveReturn() {
    const btn = document.getElementById('rfSaveBtn');
    if (!btn || btn.disabled) return;

    const productId = document.getElementById('rfProduct')?.value;
    const qty = parseInt(document.getElementById('rfQty')?.value) || 0;
    const issueType = document.getElementById('rfIssue')?.value;
    const desc = document.getElementById('rfDesc')?.value || '';
    const prodDate = document.getElementById('rfProdDate')?.value || '';
    const action = document.getElementById('rfAction')?.value;

    if (!productId) { App.toast('เลือกสินค้า', 'error'); return; }
    if (!qty) { App.toast('ใส่จำนวน', 'error'); return; }

    btn.disabled = true; btn.textContent = 'กำลังส่ง...';
    try {
      const resp = await API.reportReturn({ product_id: productId, quantity: qty, issue_type: issueType, description: desc, production_date: prodDate, action });
      if (resp.success) {
        App.closeDialog();
        App.toast(resp.message || '✅ แจ้งแล้ว', 'success');
        const prod = App.S.products.find(p => p.product_id === productId);
        App.S.returns.unshift({
          return_id: resp.data.return_id, product_id: productId, quantity: qty,
          issue_type: issueType, description: desc, action,
          status: action === 'discard_at_store' ? 'Wasted' : 'Reported',
          product_name: prod?.product_name || productId, unit: prod?.unit || '',
          reported_by_name: App.S.session?.display_name || '',
          resolved_by_name: '', created_at: new Date().toISOString(),
        });
        if (action === 'discard_at_store') App.S._wasteLoaded = false; // invalidate waste
        fillReturns();
      } else {
        App.toast(resp.message || 'Error', 'error');
        btn.disabled = false; btn.textContent = '📤 ส่ง';
      }
    } catch (e) {
      App.toast('Network error', 'error');
      btn.disabled = false; btn.textContent = '📤 ส่ง';
    }
  }

  // ─── Return Edit Popup (only Reported status) ───
  function showReturnEdit(returnId) {
    const r = App.S.returns.find(x => x.return_id === returnId);
    if (!r || r.status !== 'Reported') { App.toast('แก้ไขไม่ได้ — สถานะ ' + (r?.status || '?'), 'error'); return; }

    App.showDialog(`<div class="popup-sheet" style="width:380px">
      <div class="popup-header"><div class="popup-title">✏️ แก้ไข — ${App.esc(r.product_name)}</div><button class="popup-close" onclick="App.closeDialog()">✕</button></div>
      <div style="padding:10px 14px;background:var(--bg3);border-radius:var(--rd);margin-bottom:12px;font-size:12px">
        <div style="display:flex;justify-content:space-between"><span style="color:var(--t3)">เดิม</span><span style="font-weight:700">${r.quantity} ${App.esc(r.unit)}</span></div>
      </div>
      <div class="fg"><label class="lb">จำนวนใหม่</label><input class="inp" type="number" id="reQty" value="${r.quantity}" min="1" style="font-size:16px;font-weight:700;width:120px;text-align:center"></div>
      <div class="fg"><label class="lb">ปัญหา</label><select class="sel" id="reIssue">
        <option value="Quality"${r.issue_type === 'Quality' ? ' selected' : ''}>Quality</option>
        <option value="Wrong qty"${r.issue_type === 'Wrong qty' ? ' selected' : ''}>Wrong qty</option>
        <option value="Wrong product"${r.issue_type === 'Wrong product' ? ' selected' : ''}>Wrong product</option>
        <option value="Damaged"${r.issue_type === 'Damaged' ? ' selected' : ''}>Damaged</option>
      </select></div>
      <div class="fg"><label class="lb">รายละเอียด</label><textarea class="inp" id="reDesc" style="height:50px;resize:none">${App.esc(r.description || '')}</textarea></div>
      <div style="display:flex;gap:8px"><button class="btn btn-outline" style="flex:1" onclick="App.closeDialog()">ยกเลิก</button><button class="btn btn-primary" style="flex:1" id="reSaveBtn" onclick="Scr.saveReturnEdit('${r.return_id}')">💾 บันทึก</button></div>
    </div>`);
  }

  async function saveReturnEdit(returnId) {
    const btn = document.getElementById('reSaveBtn');
    if (!btn || btn.disabled) return;
    btn.disabled = true; btn.textContent = 'กำลังบันทึก...';

    const qty = parseInt(document.getElementById('reQty')?.value) || 0;
    const issueType = document.getElementById('reIssue')?.value;
    const desc = document.getElementById('reDesc')?.value || '';

    try {
      const resp = await API.editReturn({ return_id: returnId, quantity: qty, issue_type: issueType, description: desc });
      if (resp.success) {
        App.closeDialog();
        App.toast('✅ แก้ไขแล้ว', 'success');
        const r = App.S.returns.find(x => x.return_id === returnId);
        if (r) { r.quantity = qty; r.issue_type = issueType; r.description = desc; }
        fillReturns();
      } else {
        App.toast(resp.message || 'Error', 'error');
        btn.disabled = false; btn.textContent = '💾 บันทึก';
      }
    } catch (e) {
      App.toast('Network error', 'error');
      btn.disabled = false; btn.textContent = '💾 บันทึก';
    }
  }

  return {
    renderLoading, renderNoToken, renderInvalidToken, renderBlocked,
    renderDashboard, fillDashboard,
    renderBrowse, fillBrowse, filterProducts,
    setDate, step, toggleUrg, onStock1, onStock2,
    renderCart, removeCartItem, submitOrder,
    renderOrders, fillOrders, sortOrders, renderOrderDetail, fillOrderDetail,
    setOrderFilter, setOrderDate, setOrderDatePreset, setOrderSection, showMoreOrders,
    showEditItem, saveEditItem, confirmCancel, doCancel,
    renderQuota, fillQuota, filterQuota, setQuotaCat, toggleQuotaAcc, saveQuota,
    renderWaste, fillWaste, sortWaste, setWasteDate, setWasteDatePreset, showMoreWaste,
    showWasteForm, saveWaste, showWasteEdit, saveWasteEdit, confirmDeleteWaste, doDeleteWaste,
    renderReturns, fillReturns, sortReturns, setRetDate, setRetDatePreset, showMoreReturns,
    showReturnDetail, showReturnForm, saveReturn, showReturnEdit, saveReturnEdit,
  };
})();
