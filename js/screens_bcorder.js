/**
 * Version 1.1 | 14 MAR 2026 | Siam Palette Group
 * ═══════════════════════════════════════════
 * SPG — BC Order v2
 * screens_bcorder.js — Screen Renderers (Store)
 * Phase 2: Browse + Cart + Create Order
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

  // ═══ PLACEHOLDER SCREENS ═══
  function renderOrders() {
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">View Orders</div></div>
      <div class="content" id="ordersContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }
  function fillOrders() {
    const el = document.getElementById('ordersContent'); if (!el) return;
    if (!App.S.orders.length) { el.innerHTML = '<div class="empty"><div class="empty-icon">📋</div><div class="empty-title">ยังไม่มี Order</div></div>'; return; }
    el.innerHTML = `<div style="font-size:11px;color:var(--t3);margin-bottom:8px">${App.S.orders.length} รายการ — Phase 3</div>`;
  }
  function renderOrderDetail(p) { return `<div class="content"><div class="empty"><div class="empty-icon">📋</div><div class="empty-title">Order Detail — Phase 3</div></div></div>`; }
  function renderQuota() { return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">Set Quota</div></div><div class="content"><div class="empty"><div class="empty-icon">📊</div><div class="empty-title">Set Quota — Phase 4</div></div></div>`; }
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
    renderOrders, fillOrders, renderOrderDetail,
    renderQuota, renderWaste, fillWaste, renderReturns, fillReturns,
  };
})();
