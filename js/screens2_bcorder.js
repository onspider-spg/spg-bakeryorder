/**
 * Version 1.1 | 14 MAR 2026 | Siam Palette Group
 * ═══════════════════════════════════════════
 * SPG — BC Order v2
 * screens2_bcorder.js — Screen Renderers (BC Staff)
 * Phase 2: BC Dashboard + Accept Order
 * ═══════════════════════════════════════════
 */

const Scr2 = (() => {

  // ═══ BC DASHBOARD ═══
  function renderBCDashboard() {
    const s = App.S.session || {};
    return `<div class="content" id="mainContent">
      <div style="margin-bottom:16px"><div style="font-size:14px;font-weight:700;margin-bottom:2px">Welcome, ${App.esc(s.display_name)}</div><div style="font-size:11px;color:var(--t3)">${App.esc(s.tier_id)} · BC Staff · ${App.esc(s.dept_id)}</div></div>
      <div class="bc-kpis" id="bcKpis"></div>
      <div class="bc-progress" id="bcProgress"></div>
      <div id="bcAlerts"></div>
      <div class="bc-section-title">Orders</div>
      <div class="bc-menu-grid">
        ${menuCard('📋', 'View Orders', "App.go('orders')")}
        ${menuCard('🖨️', 'Print Centre', "App.go('print')")}
      </div>
      <div class="bc-section-title">Records</div>
      <div class="bc-menu-grid">
        ${menuCard('🗑️', 'Record Waste', "App.go('waste')")}
        ${menuCard('↩️', 'Incoming Returns', "App.go('bc-returns')")}
      </div>
      ${App.hasPerm('fn_manage_products') ? `<div class="bc-section-title">Admin</div>
      <div class="bc-menu-grid">
        ${menuCard('📦', 'Manage Products', "App.go('products')")}
      </div>` : ''}
    </div>`;
  }

  function menuCard(icon, label, onclick) {
    return `<div class="card" onclick="${onclick}"><div class="card-row"><span>${icon}</span><div class="card-label">${label}</div><span class="card-arrow">›</span></div></div>`;
  }

  function fillBCDashboard() {
    const d = App.S.dashboard;
    if (!d?.by_status) return;
    const bs = d.by_status;
    const done = (bs.Fulfilled || 0) + (bs.Delivered || 0);
    const total = d.today_total || 0;
    const pct = total > 0 ? Math.round(done / total * 100) : 0;

    const kpiEl = document.getElementById('bcKpis');
    if (kpiEl) {
      kpiEl.innerHTML = kpi('Pending', bs.Pending || 0, 'var(--red-bg)', 'var(--red)')
        + kpi('Ordered', bs.Ordered || 0, 'var(--blue-bg)', 'var(--blue)')
        + kpi('In Prog', bs.InProgress || 0, 'var(--orange-bg)', 'var(--orange)')
        + kpi('Done', done, 'var(--green-bg)', 'var(--green)');
    }

    const progEl = document.getElementById('bcProgress');
    if (progEl) {
      progEl.innerHTML = `<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:2px"><span>Today</span><span style="color:var(--green)">${done}/${total}</span></div>
        <div class="bc-progress-bar"><div class="bc-progress-fill" style="width:${pct}%"></div></div>`;
    }

    const alertEl = document.getElementById('bcAlerts');
    if (alertEl) {
      let html = '';
      if (bs.Pending > 0) html += `<div class="bc-alert" style="background:var(--red-bg);color:var(--red)">🚨 ${bs.Pending} orders pending accept</div>`;
      if (d.urgent_items > 0) html += `<div class="bc-alert" style="background:#fef3c7;color:#92400e">⚡ ${d.urgent_items} urgent items</div>`;
      if (d.pending_returns > 0) html += `<div class="bc-alert" style="background:var(--blue-bg);color:var(--blue)">↩️ ${d.pending_returns} returns pending</div>`;
      if (html) html += '<div style="height:8px"></div>';
      alertEl.innerHTML = html;
    }
  }

  function kpi(label, val, bg, color) {
    return `<div class="bc-kpi" style="background:${bg}"><div class="bc-kpi-label" style="color:${color}">${label}</div><div class="bc-kpi-val" style="color:${color}">${val}</div></div>`;
  }

  // ═══ ACCEPT ORDER ═══
  function renderAccept(params) {
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('orders')">←</button><div class="toolbar-title">Accept Order</div></div>
      <div class="content" id="acceptContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillAccept() {
    const el = document.getElementById('acceptContent');
    if (!el) return;
    const data = App.S.currentOrder;
    if (!data) { el.innerHTML = '<div class="empty"><div class="empty-icon">❌</div><div class="empty-title">ไม่พบข้อมูล</div></div>'; return; }

    const o = data.order;
    const items = data.items || [];
    if (o.status !== 'Pending') {
      el.innerHTML = `<div class="empty"><div class="empty-icon">ℹ️</div><div class="empty-title">สถานะ ${App.esc(o.status)}</div><div class="empty-desc">Accept ได้เฉพาะ Pending เท่านั้น</div><button class="btn btn-outline" style="margin-top:12px" onclick="App.go('order-detail',{id:'${o.order_id}'})">ดูรายละเอียด →</button></div>`;
      return;
    }

    const cutoffBadge = o.is_cutoff_violation ? '<span class="sts sts-pending" style="margin-left:6px">cutoff</span>' : '';

    // Items table
    const rows = items.map(i => `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--bd2);border-left:3px solid ${i.is_urgent ? 'var(--red)' : 'var(--bd)'};border-radius:0 var(--rd) var(--rd) 0;background:var(--bg)">
      <div style="flex:1"><div style="font-size:13px;font-weight:700">${App.esc(i.product_name)}</div><div style="font-size:11px;color:var(--t3)">${i.qty_ordered} ${App.esc(i.unit)}${i.is_urgent ? ' · <span style="color:var(--red)">⚡ URGENT</span>' : ''}${i.item_note ? ' · 📝 ' + App.esc(i.item_note) : ''}</div></div>
    </div>`).join('');

    el.innerHTML = `
      <div style="padding:12px 16px;background:var(--red-bg);border-radius:var(--rd);margin-bottom:10px;font-size:12px;color:var(--red);font-weight:600">
        ${App.esc(o.order_id)} · ${App.esc(App.getStoreName(o.store_id))} · ${App.esc(o.display_name || '')} · ส่ง ${App.fmtDateThai(o.delivery_date)}${cutoffBadge}
      </div>
      ${o.header_note ? '<div style="padding:8px 12px;background:var(--bg3);border-radius:var(--rd);margin-bottom:10px;font-size:12px">📝 ' + App.esc(o.header_note) + '</div>' : ''}
      <div style="font-size:11px;color:var(--t3);margin-bottom:6px">${items.length} รายการ</div>
      <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:14px">${rows}</div>
      <div style="display:flex;flex-direction:column;gap:5px">
        <button class="btn btn-green btn-full" id="acceptBtn" onclick="Scr2.doAccept('${o.order_id}')">✓ Accept All</button>
        <button class="btn btn-danger btn-full" id="rejectBtn" onclick="Scr2.showRejectDialog('${o.order_id}')">✗ Reject</button>
        <button class="btn btn-outline btn-full" style="color:var(--red);border-color:var(--red)" onclick="Scr.confirmCancel('${o.order_id}')">🚫 Cancel Order</button>
      </div>`;
  }

  async function doAccept(orderId) {
    const btn = document.getElementById('acceptBtn');
    if (!btn || btn.disabled) return;
    btn.disabled = true; btn.textContent = 'กำลัง Accept...';
    try {
      const resp = await API.acceptOrder({ order_id: orderId });
      if (resp.success) {
        App.toast(resp.message || '✅ Accept เรียบร้อย', 'success');
        // Update memory
        if (App.S.currentOrder?.order) App.S.currentOrder.order.status = 'Ordered';
        const idx = App.S.orders.findIndex(o => o.order_id === orderId);
        if (idx >= 0) App.S.orders[idx].status = 'Ordered';
        App.go('orders');
      } else {
        App.toast(resp.message || 'Error', 'error');
        btn.disabled = false; btn.textContent = '✓ Accept All';
      }
    } catch (e) {
      App.toast('Network error', 'error');
      btn.disabled = false; btn.textContent = '✓ Accept All';
    }
  }

  function showRejectDialog(orderId) {
    App.showDialog(`<div class="popup-sheet" style="width:340px">
      <div class="popup-title" style="margin-bottom:12px">✗ Reject Order?</div>
      <div style="font-size:13px;color:var(--t2);margin-bottom:12px">${App.esc(orderId)}</div>
      <div class="fg"><label class="lb">เหตุผล *</label><input class="inp" id="rejectReason" placeholder="เช่น วัตถุดิบไม่พอ..."></div>
      <div style="display:flex;gap:8px"><button class="btn btn-outline" style="flex:1" onclick="App.closeDialog()">ไม่ใช่</button><button class="btn btn-danger" style="flex:1" id="rejectConfirmBtn" onclick="Scr2.doReject('${orderId}')">Reject เลย</button></div>
    </div>`);
  }

  async function doReject(orderId) {
    const btn = document.getElementById('rejectConfirmBtn');
    if (!btn || btn.disabled) return;
    const reason = document.getElementById('rejectReason')?.value || '';
    if (!reason.trim()) { App.toast('กรุณาใส่เหตุผล', 'error'); return; }

    btn.disabled = true; btn.textContent = 'กำลัง Reject...';
    try {
      const resp = await API.rejectOrder({ order_id: orderId, reason });
      if (resp.success) {
        App.closeDialog();
        App.toast(resp.message || '✅ Reject เรียบร้อย', 'success');
        if (App.S.currentOrder?.order) App.S.currentOrder.order.status = 'Rejected';
        const idx = App.S.orders.findIndex(o => o.order_id === orderId);
        if (idx >= 0) App.S.orders[idx].status = 'Rejected';
        App.go('orders');
      } else {
        App.toast(resp.message || 'Error', 'error');
        btn.disabled = false; btn.textContent = 'Reject เลย';
      }
    } catch (e) {
      App.toast('Network error', 'error');
      btn.disabled = false; btn.textContent = 'Reject เลย';
    }
  }

  // ═══ PLACEHOLDER SCREENS (Phase 3+) ═══
  function renderPlaceholder(title) {
    return `<div class="content"><div class="empty"><div class="empty-icon">🚧</div><div class="empty-title">${App.esc(title)}</div><div class="empty-desc">Coming in next update</div></div></div>`;
  }

  function renderFulfil(p)   { return renderPlaceholder('Fulfilment'); }
  function renderPrint()     { return renderPlaceholder('Print Centre'); }
  function renderBCReturns() { return renderPlaceholder('Incoming Returns'); }
  function renderProducts()  { return renderPlaceholder('Manage Products'); }
  function renderProdEdit()  { return renderPlaceholder('Edit Product'); }

  return {
    renderBCDashboard, fillBCDashboard,
    renderAccept, fillAccept, doAccept, showRejectDialog, doReject,
    renderFulfil, renderPrint,
    renderBCReturns, renderProducts, renderProdEdit,
  };
})();
