/**
 * Version 1.0.0 | 19 MAR 2026 | Siam Palette Group
 * ═══════════════════════════════════════════
 * SPG — BC Order v2
 * screens4_bcorder.js — Executive Dashboard Screens
 * New: Overview Dashboard, Operational Health, Alerts Setup
 * ═══════════════════════════════════════════
 */

const Scr4 = (() => {

  // ─── Shared: resolve date preset → { from, to } ───
  function _datePreset(p) {
    if (p === 'today') return { from: App.todaySydney(), to: App.todaySydney() };
    if (p === '30d') { const d = new Date(App.sydneyNow()); d.setDate(d.getDate() - 30); return { from: App.fmtDate(d), to: App.todaySydney() }; }
    return { from: '', to: '' };
  }

  // ─── Shared: horizontal bar + KPI card ───
  function hBar(pct, color) {
    return `<div class="rpt-bar"><div class="rpt-bar-fill" style="width:${Math.min(pct, 100)}%;background:${color}"></div></div>`;
  }
  function kpiCard(val, label, color, change) {
    const chg = change ? `<div style="font-size:9px;margin-top:2px;color:${change.startsWith('▲') ? (change.includes('-') ? 'var(--red)' : 'var(--green)') : 'var(--green)'}">${change}</div>` : '';
    return `<div class="rpt-kpi" style="border-left:3px solid ${color}"><div class="rpt-kpi-val" style="color:${color}">${val ?? '—'}</div><div class="rpt-kpi-label">${label}</div>${chg}</div>`;
  }

  // ─── Health badge ───
  function healthBadge(score) {
    if (score >= 90) return `<span class="sts" style="background:var(--green-bg);color:var(--green)">Good</span>`;
    if (score >= 75) return `<span class="sts" style="background:var(--orange-bg);color:var(--orange)">Fair</span>`;
    return `<span class="sts" style="background:var(--red-bg);color:var(--red)">Alert</span>`;
  }
  function countBadge(val, thresholds) {
    const color = val <= (thresholds?.[0] ?? 1) ? 'var(--green)' : val <= (thresholds?.[1] ?? 3) ? 'var(--orange)' : 'var(--red)';
    const bg = val <= (thresholds?.[0] ?? 1) ? 'var(--green-bg)' : val <= (thresholds?.[1] ?? 3) ? 'var(--orange-bg)' : 'var(--red-bg)';
    return `<span class="sts" style="background:${bg};color:${color}">${val}</span>`;
  }

  // ═══════════════════════════════════════════
  // 1. EXECUTIVE OVERVIEW DASHBOARD
  // ═══════════════════════════════════════════

  function renderExecOverview() {
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">Executive Overview</div></div>
      <div class="content" id="execOverviewContent"><div class="skel skel-card"></div><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  async function fillExecOverview() {
    const el = document.getElementById('execOverviewContent');
    if (!el) return;

    try {
      const resp = await API.get('getExecDashboard', { days: '30' });
      if (resp.success) {
        App.S.execDash = resp.data;
        _renderOverviewData(el, resp.data);
      } else {
        el.innerHTML = `<div class="empty"><div class="empty-icon">📊</div><div class="empty-title">ไม่สามารถโหลดข้อมูลได้</div><div class="empty-desc">${App.esc(resp.message || '')}</div></div>`;
      }
    } catch (e) {
      console.error('Exec dashboard:', e);
      el.innerHTML = '<div class="empty"><div class="empty-icon">⚠</div><div class="empty-title">Network Error</div></div>';
    }
  }

  function _renderOverviewData(el, d) {
    if (!d) { el.innerHTML = '<div class="empty"><div class="empty-icon">📊</div><div class="empty-title">ไม่มีข้อมูล</div></div>'; return; }

    const k = d.kpis || {};

    // KPI Cards
    const kpis = `<div class="exec-kpi-grid">
      ${kpiCard(k.total_orders ?? 0, 'Total Orders (30d)', 'var(--acc)')}
      ${kpiCard(k.total_waste ?? 0, 'Total Waste', 'var(--red)')}
      ${kpiCard(k.fulfilment_rate != null ? k.fulfilment_rate + '%' : '—', 'Fulfilment Rate', 'var(--green)')}
      ${kpiCard(k.cutoff_violations ?? 0, 'Cutoff Violations', 'var(--orange)')}
      ${kpiCard(k.returns ?? 0, 'Returns', 'var(--blue)')}
    </div>`;

    // Waste Snapshot
    const ws = d.waste_snapshot || {};
    const maxReason = Math.max(...(ws.by_reason || []).map(r => r.count), 1);
    const reasonBars = (ws.by_reason || []).map(r => {
      const color = r.reason === 'Expired' ? 'var(--red)' : r.reason === 'Damaged' ? 'var(--orange)' : 'var(--acc)';
      return `<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px"><span style="font-weight:600">${App.esc(r.reason)}</span><span style="color:${color}">${r.count}</span></div>${hBar(r.count / maxReason * 100, color)}</div>`;
    }).join('');

    const wasteCard = `<div class="section-card">
      <div style="font-size:12px;font-weight:700;margin-bottom:8px">📊 Waste Snapshot</div>
      <div style="display:flex;gap:14px;margin-bottom:10px">
        <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--red)">${ws.today ?? 0}</div><div style="font-size:8px;color:var(--t3)">Today</div></div>
        <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--orange)">${ws.week ?? 0}</div><div style="font-size:8px;color:var(--t3)">7 days</div></div>
        <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--acc)">${ws.avg_day ?? 0}</div><div style="font-size:8px;color:var(--t3)">Avg/day</div></div>
      </div>
      ${reasonBars}
      <div style="text-align:right;margin-top:6px"><a style="font-size:9px;color:var(--acc);cursor:pointer" onclick="App.go('waste-dashboard')">Full Report →</a></div>
    </div>`;

    // Top Ordered
    const medals = ['🥇', '🥈', '🥉'];
    const topOrd = d.top_ordered || [];
    const maxOrd = Math.max(...topOrd.map(r => (r.count || r.qty || 0)), 1);
    const topBars = topOrd.slice(0, 5).map((r, i) => {
      const v = r.count || r.qty || 0;
      return `<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px"><span>${medals[i] || '#' + (i + 1)} <b>${App.esc(r.product_name || r.name)}</b></span><span style="font-weight:700">${v}</span></div>${hBar(v / maxOrd * 100, i < 3 ? 'var(--acc)' : 'var(--blue)')}</div>`;
    }).join('');

    const topCard = `<div class="section-card">
      <div style="font-size:12px;font-weight:700;margin-bottom:8px">🏆 Top Ordered</div>
      ${topBars || '<div style="font-size:11px;color:var(--t3)">ไม่มีข้อมูล</div>'}
      <div style="text-align:right;margin-top:6px"><a style="font-size:9px;color:var(--acc);cursor:pointer" onclick="App.go('top-products')">Full Report →</a></div>
    </div>`;

    // Store Health
    const stores = d.store_health || [];
    const storeRows = stores.map(s => {
      const score = s.score ?? s.health_score ?? 0;
      return `<tr${score < 70 ? ' style="background:var(--red-bg)"' : ''}>
        <td style="font-weight:600${score < 70 ? ';color:var(--red)' : ''}">${App.esc(s.store_name || App.getStoreName(s.store_id) || s.store_id)}</td>
        <td>${s.fulfilment != null ? s.fulfilment + '%' : '—'}</td>
        <td>${countBadge(s.cutoff_violations ?? s.cutoff ?? 0, [1, 2])}</td>
        <td>${healthBadge(score)}</td>
      </tr>`;
    }).join('');

    const healthCard = `<div class="section-card">
      <div style="font-size:12px;font-weight:700;margin-bottom:8px">🏥 Store Health</div>
      ${stores.length ? `<table class="adm-tbl"><thead><tr><th>Store</th><th>Fulfil</th><th>Cutoff</th><th>Health</th></tr></thead><tbody>${storeRows}</tbody></table>` : '<div style="font-size:11px;color:var(--t3)">ไม่มีข้อมูล</div>'}
      <div style="text-align:right;margin-top:6px"><a style="font-size:9px;color:var(--acc);cursor:pointer" onclick="App.go('exec-ops')">Full Report →</a></div>
    </div>`;

    // Active Alerts
    const alerts = d.alerts || [];
    const alertItems = alerts.slice(0, 5).map(a => {
      const typeStyle = a.type === 'waste' ? 'background:var(--red-bg);border-left:3px solid var(--red)' :
        a.type === 'cutoff' ? 'background:var(--orange-bg);border-left:3px solid var(--orange)' :
        'background:var(--orange-bg);border-left:3px solid var(--orange)';
      const icon = a.type === 'waste' ? '🚨' : a.type === 'cutoff' ? '⏰' : '📦';
      return `<div style="${typeStyle};padding:6px;border-radius:var(--rd);display:flex;align-items:center;gap:6px;margin-bottom:4px">
        <span>${icon}</span>
        <div style="flex:1;font-size:10px"><b>${App.esc(a.title)}</b> · ${App.esc(a.detail)}</div>
        <span style="font-size:8px;color:var(--t3)">${App.esc(a.ago || '')}</span>
      </div>`;
    }).join('');

    const alertCard = `<div class="section-card">
      <div style="font-size:12px;font-weight:700;margin-bottom:8px">🔔 Active Alerts</div>
      ${alertItems || '<div style="font-size:11px;color:var(--t3)">ไม่มี alert</div>'}
    </div>`;

    el.innerHTML = `<div style="max-width:1000px;margin:0 auto">
      ${kpis}
      <div class="rpt-grid">${wasteCard}${topCard}</div>
      <div class="rpt-grid" style="margin-top:14px">${healthCard}${alertCard}</div>
    </div>`;
  }

  // ═══════════════════════════════════════════
  // 2. OPERATIONAL HEALTH
  // ═══════════════════════════════════════════

  let _ohDateFrom = '';
  let _ohDateTo = '';

  function renderExecOps() {
    const d30 = new Date(App.sydneyNow()); d30.setDate(d30.getDate() - 30);
    _ohDateFrom = App.fmtDate(d30);
    _ohDateTo = App.todaySydney();
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">Operational Health</div></div>
      <div class="order-date-bar">
        <span class="date-label">📅</span>
        <input type="date" class="date-inp" value="${_ohDateFrom}" onchange="Scr4.setOHDate('from',this.value)">
        <span style="color:var(--t4)">→</span>
        <input type="date" class="date-inp" value="${_ohDateTo}" onchange="Scr4.setOHDate('to',this.value)">
        <span class="date-link" onclick="Scr4.setOHPreset('30d')">30d</span>
        <span class="date-link" onclick="Scr4.setOHPreset('all')">ทั้งหมด</span>
      </div>
      <div class="content" id="execOpsContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  async function fillExecOps() {
    const el = document.getElementById('execOpsContent');
    if (!el) return;

    try {
      const params = {};
      if (_ohDateFrom) params.date_from = _ohDateFrom;
      if (_ohDateTo) params.date_to = _ohDateTo;
      const resp = await API.get('getExecDashboard', params);
      if (resp.success) {
        App.S.execDash = resp.data;
        _renderOpsData(el, resp.data);
      } else {
        el.innerHTML = `<div class="empty"><div class="empty-icon">🏥</div><div class="empty-title">ไม่สามารถโหลดข้อมูลได้</div></div>`;
      }
    } catch (e) {
      console.error('Ops health:', e);
      el.innerHTML = '<div class="empty"><div class="empty-icon">⚠</div><div class="empty-title">Network Error</div></div>';
    }
  }

  function _renderOpsData(el, d) {
    if (!d) { el.innerHTML = '<div class="empty"><div class="empty-icon">🏥</div><div class="empty-title">ไม่มีข้อมูล</div></div>'; return; }

    const k = d.kpis || {};

    // KPIs
    const kpis = `<div class="rpt-kpis">
      ${kpiCard(k.fulfilment_rate != null ? k.fulfilment_rate + '%' : '—', 'Fulfilment Rate', 'var(--green)')}
      ${kpiCard(k.cutoff_violations ?? 0, 'Cutoff Violations', 'var(--orange)')}
      ${kpiCard(k.returns ?? 0, 'Returns', 'var(--red)')}
      ${kpiCard(k.health_score != null ? k.health_score + '%' : '—', 'Health Score', 'var(--acc)')}
    </div>`;

    // Store Health Matrix
    const stores = d.store_health || [];
    const matrixRows = stores.map(s => {
      const score = s.score ?? s.health_score ?? 0;
      const fulfilPct = s.fulfilment != null ? s.fulfilment : 0;
      const fulfilStyle = fulfilPct >= 95 ? 'background:var(--green-bg);color:var(--green)' :
        fulfilPct >= 90 ? 'background:var(--orange-bg);color:var(--orange)' :
        'background:var(--red-bg);color:var(--red)';
      return `<tr${score < 70 ? ' style="background:var(--red-bg)"' : ''}>
        <td style="font-weight:600${score < 70 ? ';color:var(--red)' : ''}">${App.esc(s.store_name || App.getStoreName(s.store_id) || s.store_id)}</td>
        <td>${s.orders ?? '—'}</td>
        <td><span class="sts" style="${fulfilStyle}">${fulfilPct}%</span></td>
        <td>${s.waste ?? '—'}</td>
        <td>${s.returns ?? '—'}</td>
        <td>${countBadge(s.cutoff_violations ?? s.cutoff ?? 0, [1, 2])}</td>
        <td style="font-weight:700;color:${score >= 90 ? 'var(--green)' : score >= 75 ? 'var(--orange)' : 'var(--red)'}">${score}</td>
      </tr>`;
    }).join('');

    const matrixCard = `<div class="section-card" style="margin-bottom:14px">
      <div style="font-size:12px;font-weight:700;margin-bottom:8px">🏪 Store Health Matrix</div>
      ${stores.length ? `<div style="overflow-x:auto"><table class="adm-tbl"><thead><tr><th>Store</th><th>Orders</th><th>Fulfil</th><th>Waste</th><th>Returns</th><th>Cutoff</th><th>Score</th></tr></thead><tbody>${matrixRows}</tbody></table></div>` : '<div style="font-size:11px;color:var(--t3)">ไม่มีข้อมูล</div>'}
    </div>`;

    // Cutoff Violations
    const cutoffs = d.cutoff_violations_detail || [];
    const cutoffRows = cutoffs.slice(0, 10).map(o => {
      const stsStyle = o.status === 'Pending' ? 'background:var(--red-bg);color:var(--red)' :
        'background:var(--blue-bg);color:#1e40af';
      return `<tr style="border-left:3px solid ${o.status === 'Pending' ? 'var(--red)' : 'var(--bd)'}">
        <td style="font-weight:700;color:var(--acc)">${App.esc(o.order_id)}</td>
        <td>${App.esc(o.store_name || App.getStoreName(o.store_id) || o.store_id)}</td>
        <td style="font-size:10px">${App.esc(o.ordered_time || o.time || '')}</td>
        <td><span class="sts" style="${stsStyle}">${App.esc(o.status)}</span></td>
      </tr>`;
    }).join('');

    const cutoffCard = `<div class="section-card">
      <div style="font-size:12px;font-weight:700;margin-bottom:8px">⏰ Cutoff Violations</div>
      ${cutoffs.length ? `<table class="adm-tbl"><thead><tr><th>Order</th><th>Store</th><th>Time</th><th>Status</th></tr></thead><tbody>${cutoffRows}</tbody></table>` : '<div style="font-size:11px;color:var(--t3)">ไม่มี violations</div>'}
    </div>`;

    // Return Summary
    const returnsByReason = d.returns_by_reason || [];
    const maxRet = Math.max(...returnsByReason.map(r => r.count), 1);
    const retColors = ['var(--red)', 'var(--orange)', 'var(--blue)', 'var(--acc)'];
    const retBars = returnsByReason.map((r, i) =>
      `<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px"><span style="font-weight:600">${App.esc(r.reason)}</span><span style="color:${retColors[i % retColors.length]}">${r.count}</span></div>${hBar(r.count / maxRet * 100, retColors[i % retColors.length])}</div>`
    ).join('');

    const retCard = `<div class="section-card">
      <div style="font-size:12px;font-weight:700;margin-bottom:8px">🔄 Return Summary</div>
      ${retBars || '<div style="font-size:11px;color:var(--t3)">ไม่มี returns</div>'}
    </div>`;

    el.innerHTML = `<div style="max-width:1000px;margin:0 auto">
      ${kpis}${matrixCard}
      <div class="rpt-grid">${cutoffCard}${retCard}</div>
    </div>`;
  }

  function setOHDate(which, val) { if (which === 'from') _ohDateFrom = val; else _ohDateTo = val; fillExecOps(); }
  function setOHPreset(p) { const r = _datePreset(p); _ohDateFrom = r.from; _ohDateTo = r.to; fillExecOps(); }

  // ═══════════════════════════════════════════
  // 3. ALERTS SETUP
  // ═══════════════════════════════════════════

  function renderExecAlerts() {
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">Alerts Setup</div></div>
      <div class="content" id="execAlertsContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  async function fillExecAlerts() {
    const el = document.getElementById('execAlertsContent');
    if (!el) return;

    try {
      const resp = await API.get('getAlertConfig');
      if (resp.success) {
        App.S.alertConfig = resp.data || {};
        _renderAlertsForm(el, App.S.alertConfig);
      } else {
        // Render with defaults if no config yet
        App.S.alertConfig = {};
        _renderAlertsForm(el, {});
      }
    } catch (e) {
      console.error('Alert config:', e);
      App.S.alertConfig = {};
      _renderAlertsForm(el, {});
    }
  }

  function _renderAlertsForm(el, cfg) {
    const waste_daily = cfg.waste_daily_threshold ?? 30;
    const waste_spike = cfg.waste_spike_pct ?? 20;
    const waste_daily_on = cfg.waste_daily_enabled !== false;
    const waste_spike_on = cfg.waste_spike_enabled !== false;
    const cutoff_on = cfg.cutoff_enabled !== false;
    const low_fulfil = cfg.low_fulfilment_threshold ?? 90;
    const low_fulfil_on = cfg.low_fulfilment_enabled !== false;
    const high_returns = cfg.high_returns_threshold ?? 1;
    const high_returns_on = cfg.high_returns_enabled ?? false;
    const ch_inapp = cfg.channel_inapp !== false;
    const ch_email = cfg.channel_email ?? false;
    const ch_line = cfg.channel_line ?? false;

    function toggle(id, on) {
      return `<div class="exec-toggle${on ? ' on' : ''}" id="${id}" onclick="Scr4.toggleSwitch('${id}')"><div class="exec-toggle-knob"></div></div>`;
    }

    function alertRule(icon, title, desc, inputHtml, toggleId, toggleOn) {
      return `<div class="exec-alert-rule">
        <div style="font-size:14px">${icon}</div>
        <div style="flex:1"><div style="font-weight:600;font-size:11px">${title}</div><div style="font-size:9px;color:var(--t3)">${desc}</div></div>
        ${inputHtml}
        ${toggle(toggleId, toggleOn)}
      </div>`;
    }

    const thInp = (id, val, unit) => `<input type="number" class="exec-threshold-inp" id="${id}" value="${val}"><span style="font-size:9px;color:var(--t3)">${unit}</span>`;

    el.innerHTML = `<div style="max-width:650px;margin:0 auto">
      <div class="section-card" style="margin-bottom:12px">
        <div style="font-size:12px;font-weight:700;margin-bottom:8px">📊 Waste Alerts</div>
        ${alertRule('🚨', 'Daily Waste Threshold', 'Alert เมื่อ waste/day เกิน threshold per store', thInp('al_waste_daily', waste_daily, 'pcs'), 'tgl_waste_daily', waste_daily_on)}
        ${alertRule('📈', 'Waste Spike (WoW)', 'Alert เมื่อ waste สัปดาห์นี้เพิ่มเกิน %', thInp('al_waste_spike', waste_spike, '%'), 'tgl_waste_spike', waste_spike_on)}
      </div>

      <div class="section-card" style="margin-bottom:12px">
        <div style="font-size:12px;font-weight:700;margin-bottom:8px">🏥 Operational Alerts</div>
        ${alertRule('⏰', 'Cutoff Violation', 'Alert ทุกครั้งที่สั่งหลัง cutoff', '<span style="font-size:9px;color:var(--t3)">Always on</span>', 'tgl_cutoff', cutoff_on)}
        ${alertRule('📦', 'Low Fulfilment', 'Alert เมื่อ fulfilment ต่ำกว่า threshold', thInp('al_low_fulfil', low_fulfil, '%'), 'tgl_low_fulfil', low_fulfil_on)}
        ${alertRule('🔄', 'High Returns', 'Alert เมื่อ return rate เกิน threshold', thInp('al_high_returns', high_returns, '%'), 'tgl_high_returns', high_returns_on)}
      </div>

      <div class="section-card" style="margin-bottom:12px">
        <div style="font-size:12px;font-weight:700;margin-bottom:8px">🔔 Notification Channels</div>
        ${alertRule('📱', 'In-App', 'แสดงใน Dashboard', '', 'tgl_ch_inapp', ch_inapp)}
        ${alertRule('📧', 'Email Daily Summary', 'ส่งสรุปทุกเช้า 8 AM', '', 'tgl_ch_email', ch_email)}
        ${alertRule('💬', 'LINE Notify', 'ส่ง alert ทันที', ch_line ? '' : '<span class="sts" style="background:var(--orange-bg);color:var(--orange);font-size:8px">Not Connected</span>', 'tgl_ch_line', ch_line)}
      </div>

      <div style="text-align:right">
        <button class="btn btn-primary" id="alertSaveBtn" onclick="Scr4.saveAlertConfig()" style="padding:10px 28px">💾 Save Settings</button>
      </div>
    </div>`;
  }

  function toggleSwitch(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('on');
  }

  async function saveAlertConfig() {
    const btn = document.getElementById('alertSaveBtn');
    if (!btn || btn.disabled) return;

    const getVal = (id) => { const el = document.getElementById(id); return el ? Number(el.value) : 0; };
    const isOn = (id) => document.getElementById(id)?.classList.contains('on') ?? false;

    const body = {
      waste_daily_threshold: getVal('al_waste_daily'),
      waste_daily_enabled: isOn('tgl_waste_daily'),
      waste_spike_pct: getVal('al_waste_spike'),
      waste_spike_enabled: isOn('tgl_waste_spike'),
      cutoff_enabled: isOn('tgl_cutoff'),
      low_fulfilment_threshold: getVal('al_low_fulfil'),
      low_fulfilment_enabled: isOn('tgl_low_fulfil'),
      high_returns_threshold: getVal('al_high_returns'),
      high_returns_enabled: isOn('tgl_high_returns'),
      channel_inapp: isOn('tgl_ch_inapp'),
      channel_email: isOn('tgl_ch_email'),
      channel_line: isOn('tgl_ch_line'),
    };

    btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
    try {
      const resp = await API.post('saveAlertConfig', body);
      if (resp.success) {
        App.S.alertConfig = body;
        App.toast('✅ บันทึก Alert Settings เรียบร้อย', 'success');
      } else {
        App.toast(resp.message || 'Error', 'error');
      }
    } catch (e) {
      App.toast('Network error', 'error');
    }
    btn.disabled = false; btn.textContent = '💾 Save Settings';
  }

  // ═══════════════════════════════════════════
  // EXPORTS
  // ═══════════════════════════════════════════

  return {
    renderExecOverview, fillExecOverview,
    renderExecOps, fillExecOps, setOHDate, setOHPreset,
    renderExecAlerts, fillExecAlerts, toggleSwitch, saveAlertConfig,
  };
})();
