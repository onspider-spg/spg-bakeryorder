/**
 * Version 1.2 | 14 MAR 2026 | Siam Palette Group
 * ═══════════════════════════════════════════
 * SPG — BC Order v2
 * screens2_bcorder.js — Screen Renderers (BC Staff)
 * Phase 3: BC Dashboard + Accept + Fulfilment
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
        ${menuCard('\uD83D\uDCCB', 'View Orders', "App.go('orders')")}
        ${menuCard('\uD83D\uDDA8\uFE0F', 'Print Centre', "App.go('print')")}
      </div>
      <div class="bc-section-title">Records</div>
      <div class="bc-menu-grid">
        ${menuCard('\uD83D\uDDD1\uFE0F', 'Record Waste', "App.go('waste')")}
        ${menuCard('\u21A9\uFE0F', 'Incoming Returns', "App.go('bc-returns')")}
      </div>
      ${App.hasPerm('fn_manage_products') ? `<div class="bc-section-title">Admin</div>
      <div class="bc-menu-grid">
        ${menuCard('\uD83D\uDCE6', 'Manage Products', "App.go('products')")}
      </div>` : ''}
    </div>`;
  }

  function menuCard(icon, label, onclick) {
    return `<div class="card" onclick="${onclick}"><div class="card-row"><span>${icon}</span><div class="card-label">${label}</div><span class="card-arrow">\u203A</span></div></div>`;
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
      if (bs.Pending > 0) html += `<div class="bc-alert" style="background:var(--red-bg);color:var(--red)">\uD83D\uDEA8 ${bs.Pending} orders pending accept</div>`;
      if (d.urgent_items > 0) html += `<div class="bc-alert" style="background:#fef3c7;color:#92400e">\u26A1 ${d.urgent_items} urgent items</div>`;
      if (d.pending_returns > 0) html += `<div class="bc-alert" style="background:var(--blue-bg);color:var(--blue)">\u21A9\uFE0F ${d.pending_returns} returns pending</div>`;
      if (html) html += '<div style="height:8px"></div>';
      alertEl.innerHTML = html;
    }
  }

  function kpi(label, val, bg, color) {
    return `<div class="bc-kpi" style="background:${bg}"><div class="bc-kpi-label" style="color:${color}">${label}</div><div class="bc-kpi-val" style="color:${color}">${val}</div></div>`;
  }

  // ═══ ACCEPT ORDER ═══
  function renderAccept(params) {
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('orders')">\u2190</button><div class="toolbar-title">Accept Order</div></div>
      <div class="content" id="acceptContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillAccept() {
    const el = document.getElementById('acceptContent');
    if (!el) return;
    const data = App.S.currentOrder;
    if (!data) { el.innerHTML = '<div class="empty"><div class="empty-icon">\u274C</div><div class="empty-title">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25</div></div>'; return; }

    const o = data.order;
    const items = data.items || [];
    if (o.status !== 'Pending') {
      el.innerHTML = `<div class="empty"><div class="empty-icon">\u2139\uFE0F</div><div class="empty-title">\u0E2A\u0E16\u0E32\u0E19\u0E30 ${App.esc(o.status)}</div><div class="empty-desc">Accept \u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30 Pending \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19</div><button class="btn btn-outline" style="margin-top:12px" onclick="App.go('order-detail',{id:'${o.order_id}'})">\u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14 \u2192</button></div>`;
      return;
    }

    const cutoffBadge = o.is_cutoff_violation ? '<span class="sts sts-pending" style="margin-left:6px">cutoff</span>' : '';

    const rows = items.map(i => `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--bd2);border-left:3px solid ${i.is_urgent ? 'var(--red)' : 'var(--bd)'};border-radius:0 var(--rd) var(--rd) 0;background:var(--bg)">
      <div style="flex:1"><div style="font-size:13px;font-weight:700">${App.esc(i.product_name)}</div><div style="font-size:11px;color:var(--t3)">${i.qty_ordered} ${App.esc(i.unit)}${i.is_urgent ? ' \u00B7 <span style="color:var(--red)">\u26A1 URGENT</span>' : ''}${i.item_note ? ' \u00B7 \uD83D\uDCDD ' + App.esc(i.item_note) : ''}</div></div>
    </div>`).join('');

    el.innerHTML = `
      <div style="padding:12px 16px;background:var(--red-bg);border-radius:var(--rd);margin-bottom:10px;font-size:12px;color:var(--red);font-weight:600">
        ${App.esc(o.order_id)} \u00B7 ${App.esc(App.getStoreName(o.store_id))} \u00B7 ${App.esc(o.display_name || '')} \u00B7 \u0E2A\u0E48\u0E07 ${App.fmtDateThai(o.delivery_date)}${cutoffBadge}
      </div>
      ${o.header_note ? '<div style="padding:8px 12px;background:var(--bg3);border-radius:var(--rd);margin-bottom:10px;font-size:12px">\uD83D\uDCDD ' + App.esc(o.header_note) + '</div>' : ''}
      <div style="font-size:11px;color:var(--t3);margin-bottom:6px">${items.length} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</div>
      <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:14px">${rows}</div>
      <div style="display:flex;flex-direction:column;gap:5px">
        <button class="btn btn-green btn-full" id="acceptBtn" onclick="Scr2.doAccept('${o.order_id}')">\u2713 Accept All</button>
        <button class="btn btn-danger btn-full" id="rejectBtn" onclick="Scr2.showRejectDialog('${o.order_id}')">\u2717 Reject</button>
        <button class="btn btn-outline btn-full" style="color:var(--red);border-color:var(--red)" onclick="Scr.confirmCancel('${o.order_id}')">\uD83D\uDEAB Cancel Order</button>
      </div>`;
  }

  async function doAccept(orderId) {
    const btn = document.getElementById('acceptBtn');
    if (!btn || btn.disabled) return;
    btn.disabled = true; btn.textContent = '\u0E01\u0E33\u0E25\u0E31\u0E07 Accept...';
    try {
      const resp = await API.acceptOrder({ order_id: orderId });
      if (resp.success) {
        App.toast(resp.message || '\u2705 Accept \u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22', 'success');
        if (App.S.currentOrder?.order) App.S.currentOrder.order.status = 'Ordered';
        const idx = App.S.orders.findIndex(o => o.order_id === orderId);
        if (idx >= 0) App.S.orders[idx].status = 'Ordered';
        App.go('orders');
      } else {
        App.toast(resp.message || 'Error', 'error');
        btn.disabled = false; btn.textContent = '\u2713 Accept All';
      }
    } catch (e) {
      App.toast('Network error', 'error');
      btn.disabled = false; btn.textContent = '\u2713 Accept All';
    }
  }

  function showRejectDialog(orderId) {
    App.showDialog(`<div class="popup-sheet" style="width:340px">
      <div class="popup-title" style="margin-bottom:12px">\u2717 Reject Order?</div>
      <div style="font-size:13px;color:var(--t2);margin-bottom:12px">${App.esc(orderId)}</div>
      <div class="fg"><label class="lb">\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25 *</label><input class="inp" id="rejectReason" placeholder="\u0E40\u0E0A\u0E48\u0E19 \u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E44\u0E21\u0E48\u0E1E\u0E2D..."></div>
      <div style="display:flex;gap:8px"><button class="btn btn-outline" style="flex:1" onclick="App.closeDialog()">\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48</button><button class="btn btn-danger" style="flex:1" id="rejectConfirmBtn" onclick="Scr2.doReject('${orderId}')">Reject \u0E40\u0E25\u0E22</button></div>
    </div>`);
  }

  async function doReject(orderId) {
    const btn = document.getElementById('rejectConfirmBtn');
    if (!btn || btn.disabled) return;
    const reason = document.getElementById('rejectReason')?.value || '';
    if (!reason.trim()) { App.toast('\u0E01\u0E23\u0E38\u0E13\u0E32\u0E43\u0E2A\u0E48\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25', 'error'); return; }

    btn.disabled = true; btn.textContent = '\u0E01\u0E33\u0E25\u0E31\u0E07 Reject...';
    try {
      const resp = await API.rejectOrder({ order_id: orderId, reason });
      if (resp.success) {
        App.closeDialog();
        App.toast(resp.message || '\u2705 Reject \u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22', 'success');
        if (App.S.currentOrder?.order) App.S.currentOrder.order.status = 'Rejected';
        const idx = App.S.orders.findIndex(o => o.order_id === orderId);
        if (idx >= 0) App.S.orders[idx].status = 'Rejected';
        App.go('orders');
      } else {
        App.toast(resp.message || 'Error', 'error');
        btn.disabled = false; btn.textContent = 'Reject \u0E40\u0E25\u0E22';
      }
    } catch (e) {
      App.toast('Network error', 'error');
      btn.disabled = false; btn.textContent = 'Reject \u0E40\u0E25\u0E22';
    }
  }

  // ═══ FULFILMENT ═══
  let _fulfilState = {}; // { item_id: { status, qty_sent, note } }

  function renderFulfil(params) {
    _fulfilState = {};
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('orders')">\u2190</button><div class="toolbar-title">Fulfilment</div></div>
      <div class="content" id="fulfilContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillFulfil() {
    const el = document.getElementById('fulfilContent');
    if (!el) return;
    const data = App.S.currentOrder;
    if (!data) { el.innerHTML = '<div class="empty"><div class="empty-icon">\u274C</div><div class="empty-title">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25</div></div>'; return; }

    const o = data.order;
    const items = data.items || [];
    if (!['Ordered', 'InProgress'].includes(o.status)) {
      el.innerHTML = `<div class="empty"><div class="empty-icon">\u2139\uFE0F</div><div class="empty-title">\u0E2A\u0E16\u0E32\u0E19\u0E30 ${App.esc(o.status)}</div><div class="empty-desc">Fulfilment \u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30 Ordered/InProgress</div><button class="btn btn-outline" style="margin-top:12px" onclick="App.go('order-detail',{id:'${o.order_id}'})">\u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14 \u2192</button></div>`;
      return;
    }

    // Init state from existing data
    items.forEach(i => {
      if (!_fulfilState[i.item_id]) {
        _fulfilState[i.item_id] = {
          status: i.fulfilment_status || '',
          qty_sent: i.qty_sent ?? i.qty_ordered,
          note: i.fulfilment_note || '',
        };
      }
    });

    renderFulfilBody(el, o, items);
  }

  function renderFulfilBody(el, o, items) {
    const doneCount = items.filter(i => _fulfilState[i.item_id]?.status).length;
    const total = items.length;
    const pct = total > 0 ? Math.round(doneCount / total * 100) : 0;
    const stsClass = { Ordered: 'sts-ordered', InProgress: 'sts-ordered' }[o.status] || '';

    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:13px;font-weight:700;color:var(--acc)">${App.esc(o.order_id)}</span>
        <span class="sts ${stsClass}" style="margin-left:auto">${o.status}</span>
      </div>
      <div style="font-size:12px;color:var(--t3);margin-bottom:6px">${App.esc(App.getStoreName(o.store_id))} \u00B7 ${App.esc(o.display_name || '')} \u00B7 \u0E2A\u0E48\u0E07 ${App.fmtDateThai(o.delivery_date)}</div>

      <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:3px"><span>${doneCount} / ${total} items</span><span style="color:var(--green)">${pct}%</span></div>
      <div class="bc-progress-bar" style="margin-bottom:12px"><div class="bc-progress-fill" style="width:${pct}%"></div></div>

      <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:14px">
        ${items.map(i => renderFulfilItem(i)).join('')}
      </div>

      <div style="display:flex;flex-direction:column;gap:5px">
        <button class="btn" style="background:var(--blue);color:#fff;width:100%" id="fulfilSaveBtn" onclick="Scr2.saveFulfilment('${o.order_id}')">\uD83D\uDCBE Save In-Progress</button>
        <button class="btn btn-outline btn-full" style="color:var(--acc);border-color:var(--acc)" id="deliverBtn" onclick="Scr2.doMarkDelivered('${o.order_id}')">\uD83D\uDE9A Mark as Delivered</button>
        <button class="btn btn-outline btn-full" style="color:var(--red);border-color:var(--red)" onclick="Scr.confirmCancel('${o.order_id}')">\uD83D\uDEAB Cancel Order</button>
      </div>`;
  }

  function renderFulfilItem(i) {
    const fs = _fulfilState[i.item_id] || {};
    const st = fs.status;
    const isFull = st === 'full';
    const isPartial = st === 'partial';

    const borderColor = isFull ? 'var(--green)' : isPartial ? 'var(--orange)' : 'var(--bd)';
    const bg = isFull ? 'var(--green-bg)' : '';
    const urgLabel = i.is_urgent ? ' \u26A1' : '';

    let actionHtml;
    if (isFull) {
      actionHtml = `<div style="padding:6px 12px;border-radius:var(--rd);font-size:14px;font-weight:700;background:var(--green);color:#fff;min-width:38px;text-align:center">\u2713</div>`;
    } else if (isPartial) {
      actionHtml = `<div style="padding:6px 12px;border-radius:var(--rd);font-size:14px;font-weight:700;background:var(--orange);color:#fff;min-width:38px;text-align:center">\u2717</div>`;
    } else {
      actionHtml = `<div style="display:flex;gap:3px">
        <div style="padding:6px 12px;border-radius:var(--rd);font-size:14px;font-weight:700;background:var(--green);color:#fff;cursor:pointer;min-width:38px;text-align:center" onclick="Scr2.fulfilFull('${i.item_id}')">\u2713</div>
        <div style="padding:6px 12px;border-radius:var(--rd);font-size:14px;font-weight:700;background:var(--orange);color:#fff;cursor:pointer;min-width:38px;text-align:center" onclick="Scr2.fulfilPartial('${i.item_id}')">\u2717</div>
      </div>`;
    }

    let partialInput = '';
    if (isPartial) {
      partialInput = `<div style="padding:8px 12px;background:var(--orange-bg);border-radius:var(--rd);margin-top:4px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <span style="font-size:12px;font-weight:600;color:var(--orange)">Actual qty:</span>
          <input type="number" min="0" max="${i.qty_ordered}" value="${fs.qty_sent}" style="width:60px;padding:4px 6px;border:1px solid var(--orange);border-radius:var(--rd);font-size:14px;font-weight:700;text-align:center;font-family:inherit" oninput="Scr2.setFulfilQty('${i.item_id}',this.value)">
          <span style="font-size:11px;color:var(--t3)">/ ${i.qty_ordered} ${App.esc(i.unit)}</span>
        </div>
        <input style="width:100%;padding:6px 8px;border:1px solid var(--orange);border-radius:var(--rd);font-size:12px;font-family:inherit" placeholder="Reason..." value="${App.esc(fs.note)}" oninput="Scr2.setFulfilNote('${i.item_id}',this.value)">
      </div>`;
    }

    const qtyDisplay = isPartial ? fs.qty_sent : i.qty_ordered;
    const qtyColor = isFull ? 'var(--green)' : isPartial ? 'var(--orange)' : 'var(--t1)';
    const subQty = isPartial ? `<div style="font-size:10px;color:var(--orange)">/ ${i.qty_ordered} ${App.esc(i.unit)}</div>` : `<div style="font-size:10px;color:var(--t3)">${App.esc(i.unit)}</div>`;

    return `<div id="fi-${i.item_id}" style="display:flex;align-items:center;gap:8px;padding:12px 14px;border:1px solid var(--bd2);border-left:4px solid ${borderColor};border-radius:0 var(--rd) var(--rd) 0;background:${bg || 'var(--bg)'}">
      <div style="flex:1"><div style="font-size:13px;font-weight:700">${App.esc(i.product_name)}${urgLabel}</div></div>
      <div style="text-align:center"><div style="font-size:18px;font-weight:800;color:${qtyColor}">${qtyDisplay}</div>${subQty}</div>
      ${actionHtml}
    </div>${partialInput}`;
  }

  function fulfilFull(itemId) {
    const data = App.S.currentOrder;
    if (!data) return;
    const item = data.items.find(i => i.item_id === itemId);
    if (!item) return;
    _fulfilState[itemId] = { status: 'full', qty_sent: item.qty_ordered, note: '' };
    const el = document.getElementById('fulfilContent');
    if (el) renderFulfilBody(el, data.order, data.items);
  }

  function fulfilPartial(itemId) {
    const data = App.S.currentOrder;
    if (!data) return;
    _fulfilState[itemId] = { status: 'partial', qty_sent: 0, note: '' };
    const el = document.getElementById('fulfilContent');
    if (el) renderFulfilBody(el, data.order, data.items);
  }

  function setFulfilQty(itemId, val) {
    if (_fulfilState[itemId]) _fulfilState[itemId].qty_sent = parseInt(val) || 0;
  }

  function setFulfilNote(itemId, val) {
    if (_fulfilState[itemId]) _fulfilState[itemId].note = val;
  }

  async function saveFulfilment(orderId) {
    const btn = document.getElementById('fulfilSaveBtn');
    if (!btn || btn.disabled) return;

    const marked = [];
    for (const itemId in _fulfilState) {
      const fs = _fulfilState[itemId];
      if (fs.status) {
        marked.push({ item_id: itemId, fulfilment_status: fs.status, qty_sent: fs.qty_sent, fulfilment_note: fs.note || '' });
      }
    }
    if (!marked.length) { App.toast('\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 mark \u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32', 'warning'); return; }

    btn.disabled = true; btn.textContent = '\u0E01\u0E33\u0E25\u0E31\u0E07\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01...';
    try {
      const resp = await API.updateFulfilment({ order_id: orderId, items: marked });
      if (resp.success) {
        App.toast(resp.message || '\u2705 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22', 'success');
        if (App.S.currentOrder?.order) App.S.currentOrder.order.status = 'InProgress';
        const idx = App.S.orders.findIndex(o => o.order_id === orderId);
        if (idx >= 0) App.S.orders[idx].status = 'InProgress';
        marked.forEach(m => {
          const item = App.S.currentOrder?.items?.find(i => i.item_id === m.item_id);
          if (item) { item.fulfilment_status = m.fulfilment_status; item.qty_sent = m.qty_sent; item.fulfilment_note = m.fulfilment_note; }
        });
      } else {
        App.toast(resp.message || 'Error', 'error');
      }
    } catch (e) {
      App.toast('Network error', 'error');
    } finally {
      btn.disabled = false; btn.textContent = '\uD83D\uDCBE Save In-Progress';
    }
  }

  async function doMarkDelivered(orderId) {
    const btn = document.getElementById('deliverBtn');
    if (!btn || btn.disabled) return;
    btn.disabled = true; btn.textContent = '\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2A\u0E48\u0E07...';
    try {
      const resp = await API.markDelivered({ order_id: orderId });
      if (resp.success) {
        App.toast(resp.message || '\u2705 \u0E2A\u0E48\u0E07\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22', 'success');
        if (App.S.currentOrder?.order) App.S.currentOrder.order.status = 'Delivered';
        const idx = App.S.orders.findIndex(o => o.order_id === orderId);
        if (idx >= 0) App.S.orders[idx].status = 'Delivered';
        App.go('orders');
      } else {
        App.toast(resp.message || 'Error', 'error');
        btn.disabled = false; btn.textContent = '\uD83D\uDE9A Mark as Delivered';
      }
    } catch (e) {
      App.toast('Network error', 'error');
      btn.disabled = false; btn.textContent = '\uD83D\uDE9A Mark as Delivered';
    }
  }

  // ═══ PLACEHOLDER SCREENS (Phase 4+) ═══
  function renderPlaceholder(title) {
    return `<div class="content"><div class="empty"><div class="empty-icon">\uD83D\uDEA7</div><div class="empty-title">${App.esc(title)}</div><div class="empty-desc">Coming in next update</div></div></div>`;
  }

  function renderPrint()     { return renderPlaceholder('Print Centre'); }
  function renderBCReturns() { return renderPlaceholder('Incoming Returns'); }
  function renderProducts()  { return renderPlaceholder('Manage Products'); }
  function renderProdEdit()  { return renderPlaceholder('Edit Product'); }

  return {
    renderBCDashboard, fillBCDashboard,
    renderAccept, fillAccept, doAccept, showRejectDialog, doReject,
    renderFulfil, fillFulfil, fulfilFull, fulfilPartial, setFulfilQty, setFulfilNote,
    saveFulfilment, doMarkDelivered,
    renderPrint, renderBCReturns, renderProducts, renderProdEdit,
  };
})();
