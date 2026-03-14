/**
 * Version 1.5.1 | 14 MAR 2026 | Siam Palette Group
 * ═══════════════════════════════════════════
 * SPG — BC Order v2
 * screens2_bcorder.js — Screen Renderers (BC Staff)
 * Fix: Print Centre + Products UI sections
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

  // ═══ PRINT CENTRE ═══
  let _printTab = 'sheet'; // 'sheet' | 'slip'
  let _printSection = 'all';
  let _printDate = '';
  let _slipStore = '';

  function renderPrint() {
    _printTab = 'sheet';
    _printSection = 'all';
    _printDate = App.todaySydney();
    _slipStore = '';
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">\u2190</button><div class="toolbar-title">Print Centre</div></div>
      <div class="content" id="printContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillPrint() {
    const el = document.getElementById('printContent');
    if (!el) return;
    const d = App.S.printData;
    if (!d) { el.innerHTML = '<div class="empty"><div class="empty-icon">\uD83D\uDDA8\uFE0F</div><div class="empty-title">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...</div></div>'; return; }

    // Tab chips
    const tabs = `<div style="display:flex;gap:5px;margin-bottom:8px">
      <div class="chip${_printTab === 'sheet' ? ' active' : ''}" onclick="Scr2.setPrintTab('sheet')">\uD83D\uDCC4 Production Sheet</div>
      <div class="chip${_printTab === 'slip' ? ' active' : ''}" onclick="Scr2.setPrintTab('slip')">\uD83E\uDDFE Delivery Slip</div>
    </div>`;

    // Date picker
    const datePicker = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="font-size:12px;font-weight:600">\uD83D\uDCC5 Delivery:</span>
      <input class="inp" type="date" value="${_printDate}" style="width:auto;font-size:12px;padding:6px 10px" onchange="Scr2.setPrintDate(this.value)">
    </div>`;

    // Section chips
    const secs = new Set();
    (d.products || []).forEach(p => { if (p.section_id) secs.add(p.section_id); });
    const sorted = [...secs].sort();
    const secChips = `<div style="display:flex;gap:5px;flex-wrap:wrap">
      <div class="chip${_printSection === 'all' ? ' active' : ''}" onclick="Scr2.setPrintSection('all')">All</div>
      ${sorted.map(s => `<div class="chip${_printSection === s ? ' active' : ''}" onclick="Scr2.setPrintSection('${s}')">${App.esc(s)}</div>`).join('')}
    </div>`;

    // Controls card (white background section)
    let controlsCard = `<div class="section-card" style="margin-bottom:10px">${tabs}${datePicker}${secChips}`;
    if (_printTab === 'slip') {
      if (!_slipStore && d.stores?.length) _slipStore = d.stores[0];
      controlsCard += `<div style="margin-top:8px"><select class="sel" style="max-width:300px" onchange="Scr2.setSlipStore(this.value)">
        ${(d.stores || []).map(s => `<option value="${s}"${s === _slipStore ? ' selected' : ''}>${App.esc(App.getStoreName(s))} (${s})</option>`).join('')}
      </select></div>`;
    }
    controlsCard += '</div>';

    // Print area card (white background section)
    const printArea = _printTab === 'sheet' ? renderProductionSheet(d) : renderDeliverySlip(d);
    const printCard = `<div class="section-card">${printArea}</div>`;

    el.innerHTML = `<div style="max-width:900px;margin:0 auto">${controlsCard}${printCard}</div>`;
  }

  function renderProductionSheet(d) {
    let prods = d.products || [];
    if (_printSection !== 'all') prods = prods.filter(p => p.section_id === _printSection);
    if (!prods.length) return '<div class="empty"><div class="empty-icon">\uD83D\uDCE6</div><div class="empty-title">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</div></div>';

    const stores = d.stores || [];
    const orderIds = (d.orders || []).map(o => o.order_id);

    // Header
    let html = `<div style="text-align:center;margin-bottom:8px">
      <div style="font-size:14px;font-weight:700">PRODUCTION SHEET \u2014 ${_printSection === 'all' ? 'ALL' : _printSection.toUpperCase()}</div>
      <div style="font-size:11px;color:var(--t3)">Delivery: ${App.fmtDateThai(_printDate)} | Orders: ${orderIds.length > 3 ? orderIds.slice(0, 3).join(', ') + '...' : orderIds.join(', ')}</div>
    </div>`;

    // Table
    html += `<div style="overflow-x:auto"><table class="ptbl"><thead><tr>
      <th style="text-align:left">Product</th><th>Total</th>
      ${stores.map(s => `<th>${App.esc(s)}</th>`).join('')}
    </tr></thead><tbody>`;

    prods.forEach(p => {
      const isUrg = p.urgent;
      html += `<tr${isUrg ? ' style="background:#fff3cd"' : ''}>
        <td style="text-align:left"><b>${App.esc(p.product_name)}</b></td>
        <td><b>${p.total}</b></td>
        ${stores.map(s => {
          const sv = p.stores[s];
          if (!sv) return '<td>\u2014</td>';
          return `<td>${sv.qty}${sv.urgent ? '*' : ''}</td>`;
        }).join('')}
      </tr>`;
    });

    html += '</tbody></table></div>';
    html += '<div style="font-size:10px;color:var(--t3);margin-top:4px">* = URGENT \u26A1 | Sorted A-Z by product name</div>';
    html += `<div style="text-align:center;margin-top:12px"><button class="btn btn-primary" style="padding:10px 24px" onclick="window.print()">\uD83D\uDDA8\uFE0F Print Production Sheet</button></div>`;

    return html;
  }

  function renderDeliverySlip(d) {
    if (!_slipStore) return '<div class="empty"><div class="empty-icon">\uD83D\uDCE6</div><div class="empty-title">\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E49\u0E32\u0E19</div></div>';

    let prods = (d.products || []).filter(p => p.stores[_slipStore]);
    if (_printSection !== 'all') prods = prods.filter(p => p.section_id === _printSection);
    if (!prods.length) return '<div class="empty"><div class="empty-icon">\uD83D\uDCE6</div><div class="empty-title">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E23\u0E49\u0E32\u0E19\u0E19\u0E35\u0E49</div></div>';

    // Group by section
    const sections = {};
    prods.forEach(p => {
      const sec = p.section_id || 'other';
      if (!sections[sec]) sections[sec] = [];
      sections[sec].push(p);
    });

    // Collect order IDs for this store
    const storeOrders = (d.orders || []).filter(o => o.store_id === _slipStore);
    const orderStr = storeOrders.map(o => o.order_id).join(', ');
    const displayName = storeOrders[0]?.display_name || '';

    let slip = `<div style="border:1px solid #ccc;padding:12px;font-size:11px;max-width:300px;margin:8px auto;font-family:monospace;line-height:1.5">`;
    slip += `<div style="text-align:center;border-bottom:1px dashed #ccc;padding-bottom:6px;margin-bottom:6px">
      <div style="font-size:14px;font-weight:700">${App.esc(App.getStoreName(_slipStore))}</div>
      <div>Delivery: ${App.fmtDateThai(_printDate)}</div>
      <div style="font-size:10px;color:#aaa">Orders: ${App.esc(orderStr)}</div>
    </div>`;

    for (const sec of Object.keys(sections).sort()) {
      slip += `<div style="font-weight:700;margin:6px 0 2px;border-top:1px solid #eee;padding-top:4px">\u2550\u2550\u2550 ${App.esc(sec.toUpperCase())} \u2550\u2550\u2550</div>`;
      if (displayName) slip += `<div style="font-size:10px;color:#888">--- ${App.esc(displayName)} ---</div>`;
      sections[sec].forEach(p => {
        const sv = p.stores[_slipStore];
        const star = sv?.urgent ? '\u2B50 ' : '';
        slip += `<div style="display:flex;justify-content:space-between;padding:1px 0"><span>${star}<b>${App.esc(p.product_name)}</b></span><span>${sv.qty} \u2192 ___</span></div>`;
      });
    }

    slip += `<div style="border-top:1px dashed #ccc;margin-top:8px;padding-top:6px;font-size:10px">Packed by: ____________<br>Checked by: ___________</div>`;
    slip += '</div>';

    slip += `<div style="text-align:center;margin-top:12px"><button class="btn btn-primary" style="padding:10px 24px" onclick="window.print()">\uD83D\uDDA8\uFE0F Print Delivery Slip</button></div>`;
    return slip;
  }

  function setPrintTab(tab) { _printTab = tab; fillPrint(); }
  function setPrintSection(sec) { _printSection = sec; fillPrint(); }
  function setSlipStore(sid) { _slipStore = sid; fillPrint(); }
  function setPrintDate(val) { _printDate = val; App.loadPrintCentre(val); }

  // ═══ BC INCOMING RETURNS ═══
  let _retDateFrom = '';
  let _retDateTo = '';
  let _retFilter = 'all';
  let _retShowCount = 5;

  function renderBCReturns() {
    const y = App.sydneyNow(); y.setDate(y.getDate() - 3);
    const t = App.sydneyNow(); t.setDate(t.getDate() + 1);
    _retDateFrom = App.fmtDate(y);
    _retDateTo = App.fmtDate(t);
    _retFilter = 'all';
    _retShowCount = 5;
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">\u2190</button><div class="toolbar-title">Incoming Returns</div></div>
      <div class="order-date-bar">
        <span class="date-label">\uD83D\uDCC5 Date:</span>
        <input type="date" class="date-inp" value="${_retDateFrom}" onchange="Scr2.setBCRetDate('from',this.value)">
        <span style="color:var(--t4)">\u2192</span>
        <input type="date" class="date-inp" value="${_retDateTo}" onchange="Scr2.setBCRetDate('to',this.value)">
        <span class="date-link" onclick="Scr2.setBCRetPreset('3day')">3 \u0E27\u0E31\u0E19</span>
        <span class="date-link" onclick="Scr2.setBCRetPreset('all')">\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</span>
      </div>
      <div class="order-chips" id="bcRetChips"></div>
      <div class="content" id="bcRetContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillBCReturns() {
    const el = document.getElementById('bcRetContent');
    const chipEl = document.getElementById('bcRetChips');
    if (!el) return;

    const all = App.S.returns || [];
    // Date filter
    let filtered = all;
    if (_retDateFrom) filtered = filtered.filter(r => (r.created_at || '').substring(0, 10) >= _retDateFrom);
    if (_retDateTo) filtered = filtered.filter(r => (r.created_at || '').substring(0, 10) <= _retDateTo);

    // Count by status
    const counts = { all: filtered.length, Reported: 0, Received: 0, Done: 0 };
    filtered.forEach(r => {
      if (r.status === 'Reported') counts.Reported++;
      else if (r.status === 'Received') counts.Received++;
      else counts.Done++;
    });

    // Chips
    if (chipEl) {
      chipEl.innerHTML = [
        { k: 'all', l: '\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14', c: counts.all },
        { k: 'Reported', l: 'Reported', c: counts.Reported },
        { k: 'Received', l: 'Received', c: counts.Received },
        { k: 'Done', l: 'Done', c: counts.Done },
      ].map(f => `<div class="chip${_retFilter === f.k ? ' active' : ''}" onclick="Scr2.setBCRetFilter('${f.k}')">${f.l}${f.c ? ' (' + f.c + ')' : ''}</div>`).join('');
    }

    // Apply filter
    let shown = filtered;
    if (_retFilter === 'Reported') shown = filtered.filter(r => r.status === 'Reported');
    else if (_retFilter === 'Received') shown = filtered.filter(r => r.status === 'Received');
    else if (_retFilter === 'Done') shown = filtered.filter(r => !['Reported', 'Received'].includes(r.status));

    if (!shown.length) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">\u21A9\uFE0F</div><div class="empty-title">\u0E44\u0E21\u0E48\u0E21\u0E35 Return</div></div>';
      return;
    }

    const visible = shown.slice(0, _retShowCount);
    const hasMore = shown.length > _retShowCount;

    el.innerHTML = `<div style="font-size:11px;color:var(--t3);margin-bottom:8px">${shown.length} records</div>
      <div style="display:flex;flex-direction:column;gap:6px">${visible.map(r => renderBCRetCard(r)).join('')}</div>
      ${hasMore ? `<div class="load-more" onclick="Scr2.showMoreBCRet()">\u0E41\u0E2A\u0E14\u0E07 ${_retShowCount} \u0E08\u0E32\u0E01 ${shown.length} \u00B7 \u0E42\u0E2B\u0E25\u0E14\u0E40\u0E1E\u0E34\u0E48\u0E21 5 \u2193</div>` : ''}`;
  }

  function renderBCRetCard(r) {
    const borderColor = { Reported: 'var(--orange)', Received: 'var(--blue)', Reworked: 'var(--green)', Wasted: 'var(--red)' }[r.status] || 'var(--bd)';
    const stsStyle = {
      Reported: 'background:#fffbeb;color:#92400e',
      Received: 'background:var(--blue-bg);color:#1e40af',
      Reworked: 'background:var(--green-bg);color:#065f46',
      Wasted:   'background:var(--red-bg);color:var(--red)',
    }[r.status] || '';
    const isDone = !['Reported', 'Received'].includes(r.status);
    const store = App.getStoreName(r.store_id) || r.store_id;
    const dateStr = App.fmtDateAU((r.created_at || '').substring(0, 10));

    let actions = '';
    if (r.status === 'Reported') {
      actions = `<div style="display:flex;gap:4px;margin-top:6px">
        <button class="btn" style="background:var(--blue);color:#fff;padding:4px 12px;font-size:11px" onclick="Scr2.doReceive('${r.return_id}')">\uD83D\uDCE5 Receive</button>
        <button class="btn btn-outline" style="padding:4px 12px;font-size:11px" onclick="Scr2.showBCRetDetail('${r.return_id}')">\uD83D\uDC41\uFE0F Detail</button>
      </div>`;
    } else if (r.status === 'Received') {
      actions = `<div style="display:flex;gap:4px;margin-top:6px">
        <button class="btn btn-green" style="padding:4px 12px;font-size:11px" onclick="Scr2.doResolve('${r.return_id}','rework')">\u267B\uFE0F Rework</button>
        <button class="btn btn-danger" style="padding:4px 12px;font-size:11px" onclick="Scr2.doResolve('${r.return_id}','waste')">\uD83D\uDDD1\uFE0F Waste</button>
        <button class="btn btn-outline" style="padding:4px 12px;font-size:11px" onclick="Scr2.showBCRetDetail('${r.return_id}')">\uD83D\uDC41\uFE0F</button>
      </div>`;
    }

    return `<div style="padding:10px 12px;border:1px solid var(--bd2);border-left:3px solid ${borderColor};border-radius:0 var(--rd) var(--rd) 0;background:var(--bg)${isDone ? ';opacity:.6' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-size:12px;font-weight:700;color:${isDone ? 'var(--t3)' : 'var(--acc)'}">${App.esc(r.return_id)}</span>
        <span class="sts" style="${stsStyle}">${r.status}</span>
      </div>
      <div style="font-size:12px;font-weight:600">${App.esc(r.product_name)} \u00D7${r.quantity} ${App.esc(r.unit)}</div>
      <div style="font-size:10px;color:var(--t3);margin-top:2px">${App.esc(store)} \u00B7 ${App.esc(r.issue_type)} \u00B7 ${dateStr}</div>
      ${isDone ? '<div style="font-size:10px;color:var(--t3);margin-top:2px">\u2705 done</div>' : ''}
      ${actions}
    </div>`;
  }

  async function doReceive(returnId) {
    try {
      const resp = await API.receiveReturn({ return_id: returnId });
      if (resp.success) {
        App.toast(resp.message || '\u2705 Receive \u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22', 'success');
        const r = App.S.returns.find(x => x.return_id === returnId);
        if (r) r.status = 'Received';
        fillBCReturns();
      } else {
        App.toast(resp.message || 'Error', 'error');
      }
    } catch (e) {
      App.toast('Network error', 'error');
    }
  }

  async function doResolve(returnId, resolution) {
    try {
      const resp = await API.resolveReturn({ return_id: returnId, resolution });
      if (resp.success) {
        App.toast(resp.message || '\u2705 \u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22', 'success');
        const r = App.S.returns.find(x => x.return_id === returnId);
        if (r) r.status = resolution === 'rework' ? 'Reworked' : 'Wasted';
        if (resolution === 'waste') App.S._wasteLoaded = false; // invalidate waste
        fillBCReturns();
      } else {
        App.toast(resp.message || 'Error', 'error');
      }
    } catch (e) {
      App.toast('Network error', 'error');
    }
  }

  function showBCRetDetail(returnId) {
    const r = App.S.returns.find(x => x.return_id === returnId);
    if (!r) return;

    const stsStyle = {
      Reported: 'background:#fffbeb;color:#92400e',
      Received: 'background:var(--blue-bg);color:#1e40af',
      Reworked: 'background:var(--green-bg);color:#065f46',
      Wasted:   'background:var(--red-bg);color:var(--red)',
    }[r.status] || '';

    // Timeline
    const reportDate = App.fmtDateAU((r.created_at || '').substring(0, 10));
    let timeline = `<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
      <div style="width:8px;height:8px;border-radius:50%;background:var(--orange)"></div>
      <span style="font-size:12px"><b>Reported</b> \u2014 ${App.esc(r.reported_by_name)} \u00B7 ${reportDate}</span>
    </div>`;

    if (['Received', 'Reworked', 'Wasted'].includes(r.status)) {
      const recDate = r.received_at ? App.fmtDateAU(r.received_at.substring(0, 10)) : '';
      timeline += `<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
        <div style="width:8px;height:8px;border-radius:50%;background:var(--blue)"></div>
        <span style="font-size:12px"><b>Received</b> \u00B7 ${recDate}</span>
      </div>`;
    }
    if (['Reworked', 'Wasted'].includes(r.status)) {
      const resDate = r.resolved_at ? App.fmtDateAU(r.resolved_at.substring(0, 10)) : '';
      const resColor = r.status === 'Reworked' ? 'var(--green)' : 'var(--red)';
      timeline += `<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
        <div style="width:8px;height:8px;border-radius:50%;background:${resColor}"></div>
        <span style="font-size:12px"><b>${r.status}</b> ${r.resolved_by_name ? '\u2014 ' + App.esc(r.resolved_by_name) : ''} \u00B7 ${resDate}</span>
      </div>`;
    }
    if (r.status === 'Reported') {
      timeline += `<div style="display:flex;gap:8px;align-items:center;color:var(--t4)">
        <div style="width:8px;height:8px;border-radius:50%;background:var(--bd);border:1px dashed var(--t4)"></div>
        <span style="font-size:12px">Waiting for BC...</span>
      </div>`;
    }
    if (r.status === 'Received') {
      timeline += `<div style="display:flex;gap:8px;align-items:center;color:var(--t4)">
        <div style="width:8px;height:8px;border-radius:50%;background:var(--bd);border:1px dashed var(--t4)"></div>
        <span style="font-size:12px">Waiting resolve...</span>
      </div>`;
    }

    // Action buttons
    let actionBtns = '';
    if (r.status === 'Reported') {
      actionBtns = `<button class="btn" style="background:var(--blue);color:#fff;flex:1" onclick="App.closeDialog();Scr2.doReceive('${r.return_id}')">\uD83D\uDCE5 Receive</button>`;
    } else if (r.status === 'Received') {
      actionBtns = `<button class="btn btn-green" style="flex:1" onclick="App.closeDialog();Scr2.doResolve('${r.return_id}','rework')">\u267B\uFE0F Rework</button>
        <button class="btn btn-danger" style="flex:1" onclick="App.closeDialog();Scr2.doResolve('${r.return_id}','waste')">\uD83D\uDDD1\uFE0F Waste</button>`;
    }

    App.showDialog(`<div class="popup-sheet" style="width:420px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:15px;font-weight:700">\u21A9\uFE0F ${App.esc(r.return_id)}</div>
        <span class="sts" style="${stsStyle}">${r.status}</span>
      </div>
      <div style="font-size:13px;font-weight:600;margin-bottom:4px">${App.esc(r.product_name)} \u00B7 ${r.quantity} ${App.esc(r.unit)}</div>
      <div style="font-size:12px;color:var(--t2);margin-bottom:12px;line-height:1.6">
        ${App.esc(r.issue_type)}${r.description ? ' \u00B7 ' + App.esc(r.description) : ''}<br>
        \uD83D\uDCE6 ${App.esc(r.action === 'return_to_bakery' ? 'Return to BC' : 'Discard at store')}<br>
        ${r.production_date ? 'Production: ' + App.fmtDateThai(r.production_date) : ''}
      </div>
      <div style="font-size:12px;font-weight:600;margin-bottom:6px">\uD83D\uDCCA Timeline</div>
      <div style="margin-bottom:14px">${timeline}</div>
      <div style="display:flex;gap:8px">
        ${actionBtns}
        <button class="btn btn-outline" style="flex:1" onclick="App.closeDialog()">\u2190 Close</button>
      </div>
    </div>`);
  }

  function setBCRetDate(which, val) { if (which === 'from') _retDateFrom = val; else _retDateTo = val; fillBCReturns(); }
  function setBCRetPreset(p) {
    if (p === '3day') { const y = App.sydneyNow(); y.setDate(y.getDate() - 3); _retDateFrom = App.fmtDate(y); const t = App.sydneyNow(); t.setDate(t.getDate() + 1); _retDateTo = App.fmtDate(t); }
    else { _retDateFrom = ''; _retDateTo = ''; }
    fillBCReturns();
  }
  function setBCRetFilter(f) { _retFilter = f; _retShowCount = 5; fillBCReturns(); }
  function showMoreBCRet() { _retShowCount += 5; fillBCReturns(); }

  // ═══ MANAGE PRODUCTS ═══
  let _prodTab = 'active'; // 'active' | 'inactive'
  let _prodSearch = '';
  let _prodSectionFilter = 'all';

  function renderProducts() {
    _prodTab = 'active'; _prodSearch = ''; _prodSectionFilter = 'all';
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">\u2190</button><div class="toolbar-title">Manage Products</div></div>
      <div class="content" id="prodListContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillProducts() {
    const el = document.getElementById('prodListContent');
    if (!el) return;
    const prods = App.S.adminProducts;
    if (!prods) { el.innerHTML = '<div class="empty"><div class="empty-icon">\uD83D\uDCE6</div><div class="empty-title">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...</div></div>'; return; }

    const active = prods.filter(p => p.is_active);
    const inactive = prods.filter(p => !p.is_active);
    const list = _prodTab === 'active' ? active : inactive;

    // Sections from products
    const secs = new Set();
    list.forEach(p => { if (p.section_id) secs.add(p.section_id); });
    const sortedSecs = [...secs].sort();

    // Filter
    let filtered = list;
    if (_prodSectionFilter !== 'all') filtered = filtered.filter(p => p.section_id === _prodSectionFilter);
    if (_prodSearch) { const s = _prodSearch.toLowerCase(); filtered = filtered.filter(p => (p.product_name || '').toLowerCase().includes(s)); }

    const tabs = `<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
      <div class="chip${_prodTab === 'active' ? ' active' : ''}" onclick="Scr2.setProdTab('active')">Active (${active.length})</div>
      <div class="chip${_prodTab === 'inactive' ? ' active' : ''}" onclick="Scr2.setProdTab('inactive')">Inactive (${inactive.length})</div>
      <div style="flex:1"></div>
      <button class="btn btn-primary" style="padding:6px 16px;font-size:12px" onclick="App.go('prod-edit',{id:'new'})">+ Add</button>
    </div>`;

    const search = `<input class="search-input" style="max-width:400px;margin-bottom:8px" placeholder="\uD83D\uDD0D Search products..." value="${App.esc(_prodSearch)}" oninput="Scr2.filterProds(this.value)">`;

    const secChips = `<div style="display:flex;gap:5px;margin-bottom:6px;flex-wrap:wrap">
      <div class="chip${_prodSectionFilter === 'all' ? ' active' : ''}" onclick="Scr2.setProdSection('all')">All</div>
      ${sortedSecs.map(s => `<div class="chip${_prodSectionFilter === s ? ' active' : ''}" onclick="Scr2.setProdSection('${s}')">${App.esc(s)}</div>`).join('')}
    </div>`;

    const sortNote = `<div style="font-size:10px;color:var(--t4);margin-bottom:10px">Sort: A-Z by product name \u00B7 ${filtered.length} items</div>`;

    let cards = '';
    if (!filtered.length) {
      cards = '<div class="empty"><div class="empty-icon">\uD83D\uDD0D</div><div class="empty-title">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</div></div>';
    } else {
      cards = '<div style="display:flex;flex-direction:column;gap:4px">' + filtered.map(p => {
        const catName = (App.S.categories.find(c => c.cat_id === p.category_id) || {}).cat_name || p.category_id;
        const stsBg = p.is_active ? 'background:var(--green-bg);color:var(--green)' : 'background:var(--bg3);color:var(--t3)';
        return `<div style="padding:12px;border:1px solid var(--bd2);border-radius:var(--rd);background:var(--bg);display:flex;align-items:center;gap:10px;cursor:pointer" onclick="App.go('prod-edit',{id:'${p.product_id}'})">
          <div style="flex:1"><div style="font-size:12px;font-weight:600">${App.esc(p.product_name)}</div><div style="font-size:10px;color:var(--t3)">${App.esc(catName)} \u00B7 ${App.esc(p.section_id)} \u00B7 ${App.esc(p.unit)} \u00B7 Min ${p.min_order || 1}</div></div>
          <span class="sts" style="${stsBg}">${p.is_active ? 'Active' : 'Hidden'}</span>
          <span>\u270F\uFE0F</span>
        </div>`;
      }).join('') + '</div>';
    }

    el.innerHTML = `<div class="section-card" style="margin-bottom:10px">${tabs}${search}${secChips}${sortNote}</div><div class="section-card">${cards}</div>`;
  }

  function setProdTab(tab) { _prodTab = tab; _prodSectionFilter = 'all'; fillProducts(); }
  function filterProds(val) { _prodSearch = val; fillProducts(); }
  function setProdSection(sec) { _prodSectionFilter = sec; fillProducts(); }

  // ═══ PRODUCT EDIT ═══
  function renderProdEdit(params) {
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('products')">\u2190</button><div class="toolbar-title">Edit Product</div></div>
      <div class="content" id="prodEditContent"><div class="skel skel-card"></div></div>`;
  }

  function fillProdEdit(productId) {
    const el = document.getElementById('prodEditContent');
    if (!el) return;

    const isNew = !productId || productId === 'new';
    const p = isNew ? {} : (App.S.adminProducts || []).find(x => x.product_id === productId);
    if (!isNew && !p) { el.innerHTML = '<div class="empty"><div class="empty-icon">\u274C</div><div class="empty-title">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</div></div>'; return; }

    const cats = App.S.categories || [];
    const catOpts = cats.map(c => `<option value="${c.cat_id}"${c.cat_id === (p.category_id || '') ? ' selected' : ''}>${App.esc(c.cat_name)}</option>`).join('');

    // Sections from categories
    const secs = [...new Set(cats.map(c => c.section_id).filter(Boolean))].sort();
    const secOpts = secs.map(s => `<option value="${s}"${s === (p.section_id || '') ? ' selected' : ''}>${App.esc(s)}</option>`).join('');

    // Visibility
    const channels = App.S.adminChannels || [];
    const vis = p.visibility || [];
    const visSet = new Set(vis.map(v => v.store_id + '|' + v.dept_id));

    const visRows = channels.map(ch => {
      const key = ch.store_id + '|' + ch.dept_id;
      const checked = visSet.has(key);
      return `<div style="display:flex;justify-content:space-between;padding:5px 8px;background:var(--bg);border:1px solid var(--bd2);border-radius:4px">
        <span style="font-size:10px;font-weight:600">${App.esc(App.getStoreName(ch.store_id))} \u00B7 ${App.esc(ch.dept_id)}</span>
        <input type="checkbox" class="vis-cb" data-store="${ch.store_id}" data-dept="${ch.dept_id}"${checked ? ' checked' : ''}>
      </div>`;
    }).join('');

    const isActive = p.is_active !== false;

    el.innerHTML = `<div style="max-width:500px;margin:0 auto">
      <div style="font-size:15px;font-weight:700;margin-bottom:14px">${isNew ? '\u2795 Add Product' : '\u270F\uFE0F ' + App.esc(p.product_name)}</div>
      <div class="fg"><label class="lb">\u2776 Product Name *</label><input class="inp" id="peNameInput" value="${App.esc(p.product_name || '')}"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="fg"><label class="lb">\u2777 Category *</label><select class="sel" id="peCatInput"><option value="">-- select --</option>${catOpts}</select></div>
        <div class="fg"><label class="lb">\u2778 Section *</label><select class="sel" id="peSecInput"><option value="">-- select --</option>${secOpts}</select></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        <div class="fg"><label class="lb">\u2779 Unit</label><select class="sel" id="peUnitInput"><option value="pcs"${(p.unit || 'pcs') === 'pcs' ? ' selected' : ''}>pcs</option><option value="btl"${'btl' === p.unit ? ' selected' : ''}>btl</option><option value="pack"${'pack' === p.unit ? ' selected' : ''}>pack</option><option value="kg"${'kg' === p.unit ? ' selected' : ''}>kg</option><option value="box"${'box' === p.unit ? ' selected' : ''}>box</option></select></div>
        <div class="fg"><label class="lb">\u277A Min Order</label><input class="inp" type="number" id="peMinInput" value="${p.min_order || 1}" min="1"></div>
        <div class="fg"><label class="lb">\u277B Step</label><input class="inp" type="number" id="peStepInput" value="${p.order_step || 1}" min="1"></div>
      </div>
      <div class="fg"><label class="lb">\u277C Image URL</label><input class="inp" id="peImgInput" placeholder="https://..." value="${App.esc(p.image_url || '')}"></div>
      <div class="fg"><label class="lb">Status</label><div style="display:flex;gap:8px">
        <div class="chip${isActive ? ' active' : ''}" id="peStsActive" onclick="document.getElementById('peStsActive').classList.add('active');document.getElementById('peStsHidden').classList.remove('active')">Active</div>
        <div class="chip${!isActive ? ' active' : ''}" id="peStsHidden" onclick="document.getElementById('peStsHidden').classList.add('active');document.getElementById('peStsActive').classList.remove('active')">Hidden</div>
      </div></div>
      <div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;margin:14px 0 6px">\uD83D\uDC41\uFE0F Store Visibility</div>
      <div style="font-size:10px;color:var(--t4);margin-bottom:6px">Select stores that can order this product</div>
      <div style="display:flex;flex-direction:column;gap:2px;margin-bottom:8px">${visRows}</div>
      <div style="display:flex;gap:8px;font-size:10px;margin-bottom:14px">
        <span style="color:var(--blue);cursor:pointer" onclick="document.querySelectorAll('.vis-cb').forEach(c=>c.checked=true)">\u2705 Select all</span>
        <span style="color:var(--red);cursor:pointer" onclick="document.querySelectorAll('.vis-cb').forEach(c=>c.checked=false)">\u274C Deselect all</span>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline" style="flex:1" onclick="App.go('products')">Cancel</button>
        <button class="btn btn-primary" style="flex:1" id="peSaveBtn" onclick="Scr2.saveProduct('${isNew ? '' : p.product_id}')">\uD83D\uDCBE Save</button>
      </div>
    </div>`;
  }

  async function saveProduct(productId) {
    const btn = document.getElementById('peSaveBtn');
    if (!btn || btn.disabled) return;

    const name = document.getElementById('peNameInput')?.value?.trim();
    const catId = document.getElementById('peCatInput')?.value;
    const secId = document.getElementById('peSecInput')?.value;
    const unit = document.getElementById('peUnitInput')?.value || 'pcs';
    const minOrder = parseInt(document.getElementById('peMinInput')?.value) || 1;
    const step = parseInt(document.getElementById('peStepInput')?.value) || 1;
    const imgUrl = document.getElementById('peImgInput')?.value?.trim() || '';
    const isActive = document.getElementById('peStsActive')?.classList.contains('active');

    if (!name) { App.toast('\u0E01\u0E23\u0E38\u0E13\u0E32\u0E43\u0E2A\u0E48\u0E0A\u0E37\u0E48\u0E2D\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32', 'error'); return; }
    if (!catId) { App.toast('\u0E40\u0E25\u0E37\u0E2D\u0E01 Category', 'error'); return; }
    if (!secId) { App.toast('\u0E40\u0E25\u0E37\u0E2D\u0E01 Section', 'error'); return; }

    // Collect visibility
    const visibility = [];
    document.querySelectorAll('.vis-cb:checked').forEach(cb => {
      visibility.push({ store_id: cb.dataset.store, dept_id: cb.dataset.dept });
    });

    btn.disabled = true; btn.textContent = '\u0E01\u0E33\u0E25\u0E31\u0E07\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01...';
    try {
      const resp = await API.saveProduct({
        product_id: productId || undefined,
        product_name: name, category_id: catId, section_id: secId,
        unit, min_order: minOrder, order_step: step,
        image_url: imgUrl, is_active: isActive, visibility,
      });
      if (resp.success) {
        App.toast(resp.message || '\u2705 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22', 'success');
        // Invalidate caches
        App.S.adminProducts = null;
        App.S._prodsLoaded = false;
        API.cache.clear();
        App.go('products');
      } else {
        App.toast(resp.message || 'Error', 'error');
        btn.disabled = false; btn.textContent = '\uD83D\uDCBE Save';
      }
    } catch (e) {
      App.toast('Network error', 'error');
      btn.disabled = false; btn.textContent = '\uD83D\uDCBE Save';
    }
  }

  return {
    renderBCDashboard, fillBCDashboard,
    renderAccept, fillAccept, doAccept, showRejectDialog, doReject,
    renderFulfil, fillFulfil, fulfilFull, fulfilPartial, setFulfilQty, setFulfilNote,
    saveFulfilment, doMarkDelivered,
    renderPrint, fillPrint, setPrintTab, setPrintSection, setSlipStore, setPrintDate,
    renderBCReturns, fillBCReturns, doReceive, doResolve, showBCRetDetail,
    setBCRetDate, setBCRetPreset, setBCRetFilter, showMoreBCRet,
    renderProducts, fillProducts, setProdTab, filterProds, setProdSection,
    renderProdEdit, fillProdEdit, saveProduct,
  };
})();
