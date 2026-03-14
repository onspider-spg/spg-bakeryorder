/**
 * Version 1.0 | 14 MAR 2026 | Siam Palette Group
 * ═══════════════════════════════════════════
 * SPG — BC Order v2
 * screens2_bcorder.js — Screen Renderers (BC Staff)
 * Phase 1B: BC Dashboard
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

    // KPIs
    const kpiEl = document.getElementById('bcKpis');
    if (kpiEl) {
      kpiEl.innerHTML = kpi('Pending', bs.Pending || 0, 'var(--red-bg)', 'var(--red)')
        + kpi('Ordered', bs.Ordered || 0, 'var(--blue-bg)', 'var(--blue)')
        + kpi('In Prog', bs.InProgress || 0, 'var(--orange-bg)', 'var(--orange)')
        + kpi('Done', done, 'var(--green-bg)', 'var(--green)');
    }

    // Progress bar
    const progEl = document.getElementById('bcProgress');
    if (progEl) {
      progEl.innerHTML = `<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:2px"><span>Today</span><span style="color:var(--green)">${done}/${total}</span></div>
        <div class="bc-progress-bar"><div class="bc-progress-fill" style="width:${pct}%"></div></div>`;
    }

    // Alerts
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

  // ═══ PLACEHOLDER SCREENS (Phase 2+) ═══
  function renderPlaceholder(title) {
    return `<div class="content"><div class="empty"><div class="empty-icon">🚧</div><div class="empty-title">${App.esc(title)}</div><div class="empty-desc">Coming in next update</div></div></div>`;
  }

  function renderAccept()    { return renderPlaceholder('Accept Order'); }
  function renderFulfil()    { return renderPlaceholder('Fulfilment'); }
  function renderPrint()     { return renderPlaceholder('Print Centre'); }
  function renderBCReturns() { return renderPlaceholder('Incoming Returns'); }
  function renderProducts()  { return renderPlaceholder('Manage Products'); }
  function renderProdEdit()  { return renderPlaceholder('Edit Product'); }

  return {
    renderBCDashboard, fillBCDashboard,
    renderAccept, renderFulfil, renderPrint,
    renderBCReturns, renderProducts, renderProdEdit,
  };
})();
