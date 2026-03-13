/**
 * Version 1.0 | 14 MAR 2026 | Siam Palette Group
 * ═══════════════════════════════════════════
 * SPG — BC Order v2
 * screens_bcorder.js — Screen Renderers (Store)
 * Phase 0: Dashboard + Status Screens
 * ═══════════════════════════════════════════
 */

const Scr = (() => {
  const HOME = API.HOME_URL;

  // ═══ STATUS SCREENS ═══

  function renderLoading() {
    return `<div style="display:flex;align-items:center;justify-content:center;height:100dvh;flex-direction:column;gap:12px">
      <div class="spinner"></div><div style="font-size:13px;color:var(--t3)">กำลังเชื่อมต่อ...</div>
    </div>`;
  }

  function renderNoToken() {
    return `<div style="display:flex;align-items:center;justify-content:center;height:100dvh;flex-direction:column;gap:16px;padding:24px;text-align:center">
      <div style="font-size:56px">🔒</div>
      <div style="font-size:18px;font-weight:700">กรุณา Login ผ่าน Home</div>
      <div style="font-size:13px;color:var(--t3)">BC Order ต้องเข้าผ่าน SPG App Home Module</div>
      <button class="btn btn-primary" onclick="location.href='${HOME}'">🏠 ไปหน้า Home</button>
    </div>`;
  }

  function renderInvalidToken() {
    return `<div style="display:flex;align-items:center;justify-content:center;height:100dvh;flex-direction:column;gap:16px;padding:24px;text-align:center">
      <div style="font-size:56px">⏰</div>
      <div style="font-size:18px;font-weight:700">Session หมดอายุ</div>
      <div style="font-size:13px;color:var(--t3)">กรุณา Login ใหม่ผ่าน Home Module</div>
      <button class="btn btn-primary" onclick="location.href='${HOME}'">🏠 Login ใหม่</button>
    </div>`;
  }

  function renderBlocked() {
    return `<div style="display:flex;align-items:center;justify-content:center;height:100dvh;flex-direction:column;gap:16px;padding:24px;text-align:center">
      <div style="font-size:56px">⛔</div>
      <div style="font-size:18px;font-weight:700">ไม่สามารถเข้าใช้ได้</div>
      <div style="font-size:13px;color:var(--t3)">Department ของคุณยังไม่ได้ตั้งค่าใน BC Order<br>กรุณาติดต่อ Admin</div>
      <button class="btn btn-outline" onclick="location.href='${HOME}'">🏠 กลับ Home</button>
    </div>`;
  }

  // ═══ DASHBOARD (Store) ═══

  function renderDashboard() {
    const s = App.S.session || {};
    return `<div style="margin-bottom:16px">
        <div style="font-size:14px;font-weight:700;margin-bottom:2px">Welcome, ${App.esc(s.display_name)}</div>
        <div style="font-size:11px;color:var(--t3)">${App.esc(s.tier_id)} · ${App.esc(App.S.deptMapping?.module_role || App.S.role)} · ${App.esc(App.getStoreName(s.store_id))} · ${App.esc(s.dept_id)}</div>
      </div>
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--t3);margin-bottom:6px">Orders</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px">
        ${dashCard('📝', 'Create Order', "App.startOrder()", true)}
        ${dashCard('📋', 'View Orders', "App.go('orders')")}
        ${dashCard('📊', 'Set Quota', "App.go('quota')")}
      </div>
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--t3);margin-bottom:6px">Records</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        ${dashCard('🗑️', 'Record Waste', "App.go('waste')")}
        ${dashCard('↩️', 'Returns', "App.go('returns')")}
      </div>
      <div id="dashStats" style="margin-top:20px"></div>`;
  }

  function dashCard(icon, label, onclick, accent) {
    const borderStyle = accent ? 'border-left:3px solid var(--acc)' : '';
    return `<div class="card" style="${borderStyle}" onclick="${onclick}">
      <div class="card-row"><span>${icon}</span><div class="card-label">${label}</div><span class="card-arrow">›</span></div>
    </div>`;
  }

  function fillDashboard() {
    const el = document.getElementById('dashStats');
    if (!el) return;
    const d = App.S.dashboard;
    if (!d || !d.by_status) { el.innerHTML = ''; return; }
    const bs = d.by_status;
    el.innerHTML = `<div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--t3);margin-bottom:6px">Today</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
        ${statCard('Pending', bs.Pending || 0, 'var(--orange)')}
        ${statCard('Ordered', bs.Ordered || 0, 'var(--blue)')}
        ${statCard('Fulfilled', bs.Fulfilled || 0, 'var(--green)')}
      </div>`;
  }

  function statCard(label, count, color) {
    return `<div style="background:var(--bg);border:1px solid var(--bd2);border-radius:var(--rd);padding:10px;text-align:center">
      <div style="font-size:20px;font-weight:800;color:${color}">${count}</div>
      <div style="font-size:10px;color:var(--t3)">${label}</div>
    </div>`;
  }

  // ═══ PLACEHOLDER SCREENS (Phase 2+) ═══

  function renderBrowse() {
    return `<div class="empty"><div class="empty-icon">📝</div><div class="empty-title">Create Order</div><div class="empty-desc">Coming in Phase 2</div></div>`;
  }

  function renderCart() {
    return `<div class="empty"><div class="empty-icon">🛒</div><div class="empty-title">Cart</div><div class="empty-desc">Coming in Phase 2</div></div>`;
  }

  function renderOrders() {
    return `<div id="ordersContent"><div class="skel skel-card"></div><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }
  function fillOrders() {
    const el = document.getElementById('ordersContent');
    if (!el) return;
    if (App.S.orders.length === 0) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">📋</div><div class="empty-title">ยังไม่มี Order</div></div>';
      return;
    }
    el.innerHTML = `<div style="font-size:11px;color:var(--t3);margin-bottom:8px">${App.S.orders.length} รายการ</div>
      <div style="font-size:13px;color:var(--t3)">View Orders — Coming in Phase 3</div>`;
  }

  function renderOrderDetail(params) {
    return `<div class="empty"><div class="empty-icon">📋</div><div class="empty-title">Order Detail</div><div class="empty-desc">Coming in Phase 3</div></div>`;
  }

  function renderQuota() {
    return `<div class="empty"><div class="empty-icon">📊</div><div class="empty-title">Set Quota</div><div class="empty-desc">Coming in Phase 4</div></div>`;
  }

  function renderWaste() {
    return `<div id="wasteContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }
  function fillWaste() {
    const el = document.getElementById('wasteContent');
    if (!el) return;
    if (App.S.wasteLog.length === 0) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">✅</div><div class="empty-title">ยังไม่มี Waste</div></div>';
      return;
    }
    el.innerHTML = `<div style="font-size:11px;color:var(--t3);margin-bottom:8px">${App.S.wasteLog.length} รายการ</div>
      <div style="font-size:13px;color:var(--t3)">Waste Log — Coming in Phase 5</div>`;
  }

  function renderReturns() {
    return `<div id="returnsContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }
  function fillReturns() {
    const el = document.getElementById('returnsContent');
    if (!el) return;
    if (App.S.returns.length === 0) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">✅</div><div class="empty-title">ยังไม่มี Return</div></div>';
      return;
    }
    el.innerHTML = `<div style="font-size:11px;color:var(--t3);margin-bottom:8px">${App.S.returns.length} รายการ</div>
      <div style="font-size:13px;color:var(--t3)">Returns — Coming in Phase 6</div>`;
  }

  function fillBrowse() {
    // Phase 2
  }

  return {
    renderLoading, renderNoToken, renderInvalidToken, renderBlocked,
    renderDashboard, fillDashboard,
    renderBrowse, fillBrowse, renderCart,
    renderOrders, fillOrders,
    renderOrderDetail,
    renderQuota,
    renderWaste, fillWaste,
    renderReturns, fillReturns,
  };
})();
