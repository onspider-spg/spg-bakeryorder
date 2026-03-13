/**
 * Version 1.3 | 14 MAR 2026 | Siam Palette Group
 * ═══════════════════════════════════════════
 * SPG — BC Order v2
 * screens_bcorder.js — Screen Renderers (Store)
 * Phase 4: Set Quota
 * ═══════════════════════════════════════════
 */

const Scr = (() => {
  const HOME = API.HOME_URL;

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
        ${dCard('📝', 'Create Order', "App.startOrder()", true)}
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

    return `
      <div class="browse-header">
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

    let stockHtml;
    if (stockPoints === 2) {
      stockHtml = `<div class="pcard-stock2">
        <div class="pcard-stock2-col"><div class="pcard-col-sub">จุด 1</div><input type="number" step="0.1" id="stk1-${pid}" class="stock-inp-sm" placeholder="—" oninput="Scr.onStock2(this,'${pid}')"></div>
        <div class="pcard-stock2-col"><div class="pcard-col-sub">จุด 2</div><input type="number" step="0.1" id="stk2-${pid}" class="stock-inp-sm" placeholder="—" oninput="Scr.onStock2(this,'${pid}')"></div>
      </div>
      <div class="pcard-stock-sum">รวม <span id="stkSum-${pid}">—</span></div>`;
    } else {
      stockHtml = `<input type="number" step="0.1" id="stk-${pid}" class="stock-inp" placeholder="กรอก" oninput="Scr.onStock1(this,'${pid}')">`;
    }

    return `<div class="pcard${isInCart ? ' pcard-active' : ''}" id="pc-${pid}">
      <div class="pcard-hd">
        <div class="pcard-info"><div class="pcard-name">${App.esc(p.product_name)}</div><div class="pcard-meta">Min ${p.min_order || 1} · Step ${p.order_step || 1} · ${App.esc(p.unit || '')}</div></div>
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

  // ─── STEPPER: Targeted update (RULE 09) ───
  function step(pid, dir) {
    const p = App.S.products.find(pr => pr.product_id === pid);
    if (!p) return;
    const minOrd = p.min_order || 1;
    const stepVal = p.order_step || 1;
    const cart = App.getCartItem(pid);
    let qty = cart ? cart.qty : 0;

    if (dir > 0) {
      qty = qty === 0 ? minOrd : qty + stepVal;
    } else {
      qty = qty - stepVal;
      if (qty < minOrd) qty = 0;
    }

    App.setCartQty(pid, qty);

    // Read stock value and save to cart
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
    // Update stepper button colors
    card?.querySelectorAll('.stp-btn').forEach(b => b.className = 'stp-btn' + (qty > 0 ? ' stp-active' : ''));
    updateCartFooter();
  }

  function toggleUrg(pid) {
    const cart = App.getCartItem(pid);
    if (!cart) return; // can only toggle urgent if in cart
    App.toggleCartUrgent(pid);
    const el = document.getElementById('urg-' + pid);
    if (el) el.className = 'pcard-urg' + (cart.is_urgent ? ' on' : '');
  }

  function readStockValue(pid) {
    const sp = App.getStockPoints();
    if (sp === 2) {
      const v1 = parseFloat(document.getElementById('stk1-' + pid)?.value) || 0;
      const v2 = parseFloat(document.getElementById('stk2-' + pid)?.value) || 0;
      return v1 + v2;
    }
    return parseFloat(document.getElementById('stk-' + pid)?.value) || null;
  }

  function onStock1(el, pid) {
    const cart = App.getCartItem(pid);
    if (cart) App.setCartStock(pid, parseFloat(el.value) || null);
  }

  function onStock2(el, pid) {
    const v1 = parseFloat(document.getElementById('stk1-' + pid)?.value) || 0;
    const v2 = parseFloat(document.getElementById('stk2-' + pid)?.value) || 0;
    const sum = v1 + v2;
    const sumEl = document.getElementById('stkSum-' + pid);
    if (sumEl) sumEl.textContent = (v1 || v2) ? sum : '—';
    const cart = App.getCartItem(pid);
    if (cart) App.setCartStock(pid, sum);
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
  let _orderDateFrom = '';
  let _orderDateTo = '';
  let _orderShowCount = 5;

  function renderOrders() {
    const y = App.sydneyNow(); y.setDate(y.getDate() - 1);
    const t = App.sydneyNow(); t.setDate(t.getDate() + 1);
    _orderDateFrom = _orderDateFrom || App.fmtDate(y);
    _orderDateTo = _orderDateTo || App.fmtDate(t);
    _orderFilter = 'all';
    _orderShowCount = 5;

    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">View Orders</div><div class="topbar-icon" onclick="App.loadOrders(true)" title="Refresh">↻</div></div>
      <div class="order-date-bar">
        <span class="date-label">📅 ส่ง:</span>
        <input type="date" class="date-inp" value="${_orderDateFrom}" onchange="Scr.setOrderDate('from',this.value)">
        <span style="color:var(--t4)">→</span>
        <input type="date" class="date-inp" value="${_orderDateTo}" onchange="Scr.setOrderDate('to',this.value)">
        <span class="date-link" onclick="Scr.setOrderDatePreset('today')">วันนี้</span>
        <span class="date-link" onclick="Scr.setOrderDatePreset('3day')">3 วัน</span>
        <span class="date-link" onclick="Scr.setOrderDatePreset('all')">ทั้งหมด</span>
      </div>
      <div class="order-chips" id="orderChips"></div>
      <div class="content" id="ordersContent"><div class="skel skel-card"></div><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillOrders() {
    const el = document.getElementById('ordersContent');
    const chipEl = document.getElementById('orderChips');
    if (!el) return;

    const all = App.S.orders || [];
    // Filter by date range
    let filtered = all;
    if (_orderDateFrom) filtered = filtered.filter(o => (o.delivery_date || '') >= _orderDateFrom);
    if (_orderDateTo) filtered = filtered.filter(o => (o.delivery_date || '') <= _orderDateTo);

    // Count by status
    const counts = { all: filtered.length, Pending: 0, Ordered: 0, Done: 0, Cancelled: 0 };
    filtered.forEach(o => {
      if (o.status === 'Pending') counts.Pending++;
      else if (o.status === 'Ordered') counts.Ordered++;
      else if (['Fulfilled', 'Delivered', 'InProgress'].includes(o.status)) counts.Done++;
      else if (['Cancelled', 'Rejected'].includes(o.status)) counts.Cancelled++;
    });

    // Chips
    if (chipEl) {
      chipEl.innerHTML = [
        { k: 'all', l: 'ทั้งหมด', c: counts.all },
        { k: 'Pending', l: 'Pending', c: counts.Pending },
        { k: 'Ordered', l: 'Ordered', c: counts.Ordered },
        { k: 'Done', l: 'Done', c: counts.Done },
        { k: 'Cancelled', l: 'Cancel', c: counts.Cancelled },
      ].map(f => `<div class="chip${_orderFilter === f.k ? ' active' : ''}" onclick="Scr.setOrderFilter('${f.k}')">${f.l}${f.c ? ' (' + f.c + ')' : ''}</div>`).join('');
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

    const visible = shown.slice(0, _orderShowCount);
    const hasMore = shown.length > _orderShowCount;

    el.innerHTML = `<div style="font-size:11px;color:var(--t3);margin-bottom:8px">${shown.length} รายการ</div>
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

    return `<div class="ocard${isDone ? ' ocard-done' : ''}" style="border-left-color:${borderColor}" onclick="App.go('order-detail',{id:'${o.order_id}'})">
      <div class="ocard-hd"><span class="ocard-id">${App.esc(o.order_id)}</span><span class="sts ${stsClass}">${o.status}</span></div>
      <div class="ocard-sub">ส่ง ${App.fmtDateThai(o.delivery_date)} · ${App.esc(App.getStoreName(o.store_id))}</div>
      <div class="ocard-items">${App.esc(summary)}</div>
    </div>`;
  }

  function setOrderFilter(f) { _orderFilter = f; fillOrders(); }
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

  function renderQuota() {
    _quotaSearch = '';
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">Set Quota</div></div>
      <div class="content" id="quotaContent"><div class="skel skel-card"></div><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillQuota() {
    const el = document.getElementById('quotaContent');
    if (!el) return;
    const prods = App.S.products;
    if (!prods.length) { el.innerHTML = '<div class="empty"><div class="empty-icon">📊</div><div class="empty-title">ไม่พบสินค้า</div></div>'; return; }

    el.innerHTML = `<div class="q-wrap">
      <div style="font-size:11px;color:var(--t3);margin-bottom:8px">โควตาต่อวัน · ${prods.length} สินค้า</div>
      <input class="search-input" placeholder="🔍 ค้นหา..." value="" oninput="Scr.filterQuota(this.value)" style="max-width:400px;margin-bottom:12px">
      <div id="quotaDesk" class="q-desk-only"></div>
      <div id="quotaMob" class="q-mob-only"></div>
      <div style="display:flex;justify-content:center;margin:14px 0">
        <button class="btn btn-primary" style="padding:10px 40px" id="quotaSaveBtn" onclick="Scr.saveQuota()">💾 บันทึก</button>
      </div>
    </div>`;
    renderQuotaTable();
    renderQuotaMobile();
  }

  function getFilteredProducts() {
    const prods = App.S.products;
    if (!_quotaSearch) return prods;
    const s = _quotaSearch.toLowerCase();
    return prods.filter(p => (p.product_name || '').toLowerCase().includes(s));
  }

  function filterQuota(val) {
    _quotaSearch = val;
    renderQuotaTable();
    renderQuotaMobile();
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
    if (!btn || btn.disabled) return;
    btn.disabled = true;
    btn.textContent = 'กำลังบันทึก...';

    // Collect all values from inputs (both desktop and mobile)
    const quotas = [];
    App.S.products.forEach(p => {
      DAY_MAP.forEach(dow => {
        const inp = document.getElementById('qi-' + p.product_id + '-' + dow);
        if (inp) {
          quotas.push({ product_id: p.product_id, day_of_week: dow, quota_qty: parseInt(inp.value) || 0 });
        }
      });
    });

    try {
      const resp = await API.saveQuotas({
        store_id: App.S.session.store_id,
        dept_id: App.S.session.dept_id,
        quotas,
      });
      if (resp.success) {
        App.toast(resp.message || '✅ บันทึกแล้ว', 'success');
        // Update memory
        const newMap = {};
        quotas.forEach(q => {
          if (!newMap[q.product_id]) newMap[q.product_id] = {};
          newMap[q.product_id][q.day_of_week] = q.quota_qty;
        });
        App.S.quotaMap = newMap;
        App.S._quotasDay = -1; // invalidate browse quotas cache
      } else {
        App.toast(resp.message || 'Error', 'error');
      }
    } catch (e) {
      App.toast('Network error: ' + e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '💾 บันทึก';
    }
  }
  function renderWaste() { return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">Waste Log</div></div><div class="content" id="wasteContent"><div class="skel skel-card"></div></div>`; }
  function fillWaste() { const el = document.getElementById('wasteContent'); if (!el) return; el.innerHTML = App.S.wasteLog.length ? `<div style="font-size:11px;color:var(--t3)">${App.S.wasteLog.length} รายการ — Phase 5</div>` : '<div class="empty"><div class="empty-icon">✅</div><div class="empty-title">ยังไม่มี Waste</div></div>'; }
  function renderReturns() { return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">Returns</div></div><div class="content" id="returnsContent"><div class="skel skel-card"></div></div>`; }
  function fillReturns() { const el = document.getElementById('returnsContent'); if (!el) return; el.innerHTML = App.S.returns.length ? `<div style="font-size:11px;color:var(--t3)">${App.S.returns.length} รายการ — Phase 6</div>` : '<div class="empty"><div class="empty-icon">✅</div><div class="empty-title">ยังไม่มี Return</div></div>'; }
  function fillBrowse() { /* called from App after data load */ filterProducts(); }

  return {
    renderLoading, renderNoToken, renderInvalidToken, renderBlocked,
    renderDashboard, fillDashboard,
    renderBrowse, fillBrowse, filterProducts,
    setDate, step, toggleUrg, onStock1, onStock2,
    renderCart, removeCartItem, submitOrder,
    renderOrders, fillOrders, renderOrderDetail, fillOrderDetail,
    setOrderFilter, setOrderDate, setOrderDatePreset, showMoreOrders,
    showEditItem, saveEditItem, confirmCancel, doCancel,
    renderQuota, fillQuota, filterQuota, toggleQuotaAcc, saveQuota, renderWaste, fillWaste, renderReturns, fillReturns,
  };
})();
