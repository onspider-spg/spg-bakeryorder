/**
 * Version 1.3.3 | 15 MAR 2026 | Siam Palette Group
 * ═══════════════════════════════════════════
 * SPG — BC Order v2
 * screens3_bcorder.js — Admin + Reports Screens
 * Fix: User Access boolean comparison, debounced vis search, DRY date presets
 * ═══════════════════════════════════════════
 */

const Scr3 = (() => {

  // ─── CONFIG METADATA (display labels for known keys) ───
  const CONFIG_META = {
    cutoff_time:     { label: '⏰ Cutoff Time',     desc: 'Orders after this time → flag as cutoff violation' },
    delivery_days:   { label: '📅 Delivery Days',   desc: 'Available days for delivery orders' },
    order_id_prefix: { label: '🏷️ Order ID Prefix', desc: 'Prefix for new order IDs' },
  };

  const ROLE_COLORS = {
    store: 'var(--blue)', bc_production: 'var(--green)', bc_management: 'var(--acc)', not_applicable: 'var(--t4)',
  };

  // ─── Shared: resolve date preset → { from, to } ───
  function _datePreset(p) {
    if (p === 'today') return { from: App.todaySydney(), to: App.todaySydney() };
    if (p === '30d') { const d = new Date(App.sydneyNow()); d.setDate(d.getDate() - 30); return { from: App.fmtDate(d), to: App.todaySydney() }; }
    return { from: '', to: '' }; // 'all'
  }

  // ═══ PLACEHOLDER (for screens not yet built) ═══
  function placeholder(title, icon) {
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">${title}</div></div>
      <div class="content"><div class="empty"><div class="empty-icon">${icon || '🚧'}</div><div class="empty-title">Coming Soon</div><div class="empty-desc">อยู่ระหว่างพัฒนา</div></div></div>`;
  }

  // ═══════════════════════════════════════════
  // SYSTEM CONFIG
  // ═══════════════════════════════════════════

  function renderConfig() {
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">System Config</div></div>
      <div class="content" id="configContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillConfig() {
    const el = document.getElementById('configContent');
    if (!el) return;
    const cfg = App.S.config || {};
    const keys = Object.keys(cfg);

    if (!keys.length) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">⚙</div><div class="empty-title">ไม่มีข้อมูล Config</div></div>';
      return;
    }

    const rows = keys.map(k => {
      const meta = CONFIG_META[k] || { label: k, desc: '' };
      return `<div class="adm-row" onclick="Scr3.editConfig('${App.esc(k)}')">
        <div class="adm-row-info">
          <div class="adm-row-label">${meta.label}</div>
          <div class="adm-row-desc">${App.esc(meta.desc)}</div>
          <div class="adm-row-key">${App.esc(k)}</div>
        </div>
        <div class="adm-row-val">${App.esc(cfg[k])}</div>
        <span class="adm-row-edit">✏️</span>
      </div>`;
    }).join('');

    el.innerHTML = `<div style="max-width:700px;margin:0 auto">
      <div style="font-size:10px;color:var(--t4);margin-bottom:8px">${keys.length} config keys — click to edit</div>
      <div class="adm-list">${rows}</div>
    </div>`;
  }

  function editConfig(key) {
    const val = App.S.config[key] || '';
    const meta = CONFIG_META[key] || { label: key, desc: '' };

    App.showDialog(`<div class="popup-sheet" style="width:380px">
      <div class="popup-header"><div class="popup-title">⚙ Edit Config</div><button class="popup-close" onclick="App.closeDialog()">✕</button></div>
      <div style="padding:10px 14px;background:var(--bg3);border-radius:var(--rd);margin-bottom:12px">
        <div style="font-size:12px;font-weight:700">${meta.label}</div>
        <div style="font-size:10px;color:var(--t3);margin-top:2px">${App.esc(meta.desc)}</div>
        <div style="font-size:9px;color:var(--t4);margin-top:2px">key: ${App.esc(key)}</div>
      </div>
      <div class="fg"><label class="lb">Value</label><input class="inp" id="cfgValInput" value="${App.esc(val)}" style="font-size:16px;font-weight:700"></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline" style="flex:1" onclick="App.closeDialog()">Cancel</button>
        <button class="btn btn-primary" style="flex:1" id="cfgSaveBtn" onclick="Scr3.saveConfig('${App.esc(key)}')">💾 Save</button>
      </div>
    </div>`);
  }

  async function saveConfig(key) {
    const btn = document.getElementById('cfgSaveBtn');
    if (!btn || btn.disabled) return;
    const newVal = document.getElementById('cfgValInput')?.value ?? '';
    const oldVal = App.S.config[key] || '';
    if (newVal === oldVal) { App.toast('ไม่มีการเปลี่ยนแปลง', 'warning'); return; }

    btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
    try {
      const resp = await API.saveConfig({ config_key: key, config_value: newVal });
      if (resp.success) {
        App.closeDialog();
        App.toast('✅ บันทึกเรียบร้อย', 'success');
        App.S.config[key] = newVal;
        fillConfig();
      } else {
        App.toast(resp.message || 'Error', 'error');
        btn.disabled = false; btn.textContent = '💾 Save';
      }
    } catch (e) {
      App.toast('Network error', 'error');
      btn.disabled = false; btn.textContent = '💾 Save';
    }
  }

  // ═══════════════════════════════════════════
  // DEPT MAPPING
  // ═══════════════════════════════════════════

  function renderDeptMapping() {
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">Dept Mapping</div></div>
      <div class="content" id="deptMapContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillDeptMapping() {
    const el = document.getElementById('deptMapContent');
    if (!el) return;
    const data = App.S.deptMappings;
    if (!data) { el.innerHTML = '<div class="empty"><div class="empty-icon">🏢</div><div class="empty-title">กำลังโหลด...</div></div>'; return; }

    const rows = data.map(d => {
      const rc = ROLE_COLORS[d.module_role] || 'var(--t4)';
      const isActive = d.is_active !== false;
      return `<div class="adm-row${isActive ? '' : ' adm-row-off'}" onclick="Scr3.editDeptMapping('${App.esc(d.dept_id)}')">
        <div class="adm-row-info" style="flex:1">
          <div style="font-size:12px;font-weight:700">${App.esc(d.dept_name || d.dept_id)}</div>
          <div style="font-size:10px;color:var(--t3);margin-top:2px">${App.esc(d.dept_id)}</div>
        </div>
        <div style="flex:1">
          <span class="adm-role-badge" style="background:${rc}20;color:${rc}">${App.esc(d.module_role)}</span>
        </div>
        <div style="flex:1;font-size:10px;color:var(--t2)">${App.esc(d.section_scope || '—')}</div>
        <div style="width:40px;text-align:center;color:${isActive ? 'var(--green)' : 'var(--red)'};font-size:11px;font-weight:600">${isActive ? 'ON' : 'OFF'}</div>
        <span class="adm-row-edit">✏️</span>
      </div>`;
    }).join('');

    el.innerHTML = `<div style="max-width:900px;margin:0 auto">
      <div style="font-size:10px;color:var(--t4);margin-bottom:8px">${data.length} departments — click ✏️ to edit</div>
      <div class="adm-list">${rows}</div>
    </div>`;
  }

  function editDeptMapping(deptId) {
    const d = (App.S.deptMappings || []).find(x => x.dept_id === deptId);
    if (!d) return;

    const roles = ['store', 'bc_production', 'bc_management', 'not_applicable'];
    const roleOpts = roles.map(r => `<option value="${r}"${r === d.module_role ? ' selected' : ''}>${r}</option>`).join('');
    const isActive = d.is_active !== false;

    App.showDialog(`<div class="popup-sheet" style="width:420px">
      <div class="popup-header"><div class="popup-title">✏️ ${App.esc(d.dept_name || d.dept_id)}</div><button class="popup-close" onclick="App.closeDialog()">✕</button></div>
      <div style="padding:8px 12px;background:var(--bg3);border-radius:var(--rd);margin-bottom:12px;font-size:11px">
        <div style="display:flex;justify-content:space-between"><span style="color:var(--t3)">Dept ID</span><span style="font-weight:700">${App.esc(d.dept_id)}</span></div>
      </div>
      <div class="fg"><label class="lb">Module Role *</label><select class="sel" id="dmRoleInput">${roleOpts}</select></div>
      <div class="fg"><label class="lb">Section Scope</label><input class="inp" id="dmScopeInput" value="${App.esc(d.section_scope || '')}" placeholder="e.g. cake, sauce (comma separated)"><div style="font-size:9px;color:var(--t4);margin-top:2px">ว่าง = ไม่จำกัด scope</div></div>
      <div class="fg"><label class="lb">Status</label><div style="display:flex;gap:8px">
        <div class="chip${isActive ? ' active' : ''}" id="dmActive" onclick="document.getElementById('dmActive').classList.add('active');document.getElementById('dmInactive').classList.remove('active')">Active</div>
        <div class="chip${!isActive ? ' active' : ''}" id="dmInactive" onclick="document.getElementById('dmInactive').classList.add('active');document.getElementById('dmActive').classList.remove('active')">Inactive</div>
      </div></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline" style="flex:1" onclick="App.closeDialog()">Cancel</button>
        <button class="btn btn-primary" style="flex:1" id="dmSaveBtn" onclick="Scr3.saveDeptMapping('${App.esc(d.dept_id)}')">💾 Save</button>
      </div>
    </div>`);
  }

  async function saveDeptMapping(deptId) {
    const btn = document.getElementById('dmSaveBtn');
    if (!btn || btn.disabled) return;

    const moduleRole = document.getElementById('dmRoleInput')?.value;
    const sectionScope = document.getElementById('dmScopeInput')?.value?.trim() || '';
    const isActive = document.getElementById('dmActive')?.classList.contains('active');

    if (!moduleRole) { App.toast('เลือก Module Role', 'error'); return; }

    btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
    try {
      const resp = await API.saveDeptMapping({
        dept_id: deptId,
        module_role: moduleRole,
        section_scope: sectionScope,
        is_active: isActive,
      });
      if (resp.success) {
        App.closeDialog();
        App.toast('✅ บันทึกเรียบร้อย', 'success');
        const d = App.S.deptMappings.find(x => x.dept_id === deptId);
        if (d) { d.module_role = moduleRole; d.section_scope = sectionScope; d.is_active = isActive; }
        fillDeptMapping();
      } else {
        App.toast(resp.message || 'Error', 'error');
        btn.disabled = false; btn.textContent = '💾 Save';
      }
    } catch (e) {
      App.toast('Network error', 'error');
      btn.disabled = false; btn.textContent = '💾 Save';
    }
  }

  // ═══════════════════════════════════════════
  // PRODUCT VISIBILITY MATRIX (Phase 8)
  // ═══════════════════════════════════════════

  let _visSection = 'all';
  let _visSearch = '';

  function renderVisibility() {
    _visSection = 'all';
    _visSearch = '';
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">Product Visibility</div></div>
      <div class="content" id="visContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillVisibility() {
    const el = document.getElementById('visContent');
    if (!el) return;
    const prods = App.S.adminProducts;
    const channels = App.S.adminChannels;
    if (!prods || !channels) { el.innerHTML = '<div class="empty"><div class="empty-icon">👁️</div><div class="empty-title">กำลังโหลด...</div></div>'; return; }

    // Section filter
    const secs = new Set();
    prods.forEach(p => { if (p.section_id) secs.add(p.section_id); });
    const sortedSecs = [...secs].sort();

    const secChips = `<div style="display:flex;gap:5px;margin-bottom:6px;flex-wrap:wrap">
      <div class="chip${_visSection === 'all' ? ' active' : ''}" onclick="Scr3.setVisSection('all')">All</div>
      ${sortedSecs.map(s => `<div class="chip${_visSection === s ? ' active' : ''}" onclick="Scr3.setVisSection('${App.esc(s)}')">${App.esc(s)}</div>`).join('')}
    </div>`;

    const search = `<input class="search-input" style="max-width:300px;margin-bottom:8px" placeholder="🔍 Search products..." value="${App.esc(_visSearch)}" oninput="Scr3.dFilterVis(this.value)">`;

    // Filter products
    let filtered = prods.filter(p => p.is_active);
    if (_visSection !== 'all') filtered = filtered.filter(p => p.section_id === _visSection);
    if (_visSearch) { const s = _visSearch.toLowerCase(); filtered = filtered.filter(p => (p.product_name || '').toLowerCase().includes(s)); }
    filtered.sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''));

    if (!filtered.length) {
      el.innerHTML = `<div style="max-width:1100px;margin:0 auto">${secChips}${search}<div class="empty"><div class="empty-icon">🔍</div><div class="empty-title">ไม่พบสินค้า</div></div></div>`;
      return;
    }

    // Build visibility Set for quick lookup
    const visSet = new Set();
    prods.forEach(p => {
      (p.visibility || []).forEach(v => {
        if (v.is_active !== false) visSet.add(p.product_id + '|' + v.store_id + '|' + v.dept_id);
      });
    });

    // Table header
    let thCols = channels.map(ch => `<th class="vis-th-ch">${App.esc(ch.store_id)}<br><span style="font-size:8px;color:var(--t4)">${App.esc(ch.dept_id)}</span></th>`).join('');

    // Table rows
    let rows = filtered.map(p => {
      const cells = channels.map(ch => {
        const key = p.product_id + '|' + ch.store_id + '|' + ch.dept_id;
        const on = visSet.has(key);
        return `<td class="vis-cell" id="vc-${p.product_id}-${ch.store_id}-${ch.dept_id}" onclick="Scr3.toggleVis('${p.product_id}','${ch.store_id}','${ch.dept_id}')">
          <span style="color:${on ? 'var(--green)' : 'var(--t4)'};font-size:14px;cursor:pointer">${on ? '☑' : '☐'}</span>
        </td>`;
      }).join('');
      return `<tr><td class="vis-prod-name">${App.esc(p.product_name)}</td>${cells}</tr>`;
    }).join('');

    const counter = `<div style="font-size:9px;color:var(--t3);margin-bottom:6px">Tap to toggle — ${filtered.length} products × ${channels.length} channels</div>`;

    el.innerHTML = `<div style="max-width:1100px;margin:0 auto">${secChips}${search}${counter}
      <div style="background:var(--bg);border:1px solid var(--bd);border-radius:var(--rd);overflow-x:auto">
        <table class="vis-tbl"><thead><tr><th style="text-align:left;min-width:140px">Product</th>${thCols}</tr></thead><tbody>${rows}</tbody></table>
      </div>
    </div>`;
  }

  function setVisSection(sec) { _visSection = sec; fillVisibility(); }
  function filterVis(val) { _visSearch = val; fillVisibility(); }
  // ─── Debounced version for search input (250ms) ───
  let _dfvTimer = null;
  function dFilterVis(val) { _visSearch = val; clearTimeout(_dfvTimer); _dfvTimer = setTimeout(fillVisibility, 250); }

  // ─── Optimistic toggle — update UI first, sync DB, rollback on fail ───
  async function toggleVis(productId, storeId, deptId) {
    const key = productId + '|' + storeId + '|' + deptId;
    const p = (App.S.adminProducts || []).find(x => x.product_id === productId);
    if (!p) return;

    // Find current state
    const vis = p.visibility || [];
    const idx = vis.findIndex(v => v.store_id === storeId && v.dept_id === deptId);
    const wasOn = idx >= 0 && vis[idx].is_active !== false;
    const newOn = !wasOn;

    // Optimistic UI
    const cellId = 'vc-' + productId + '-' + storeId + '-' + deptId;
    const cell = document.getElementById(cellId);
    if (cell) cell.innerHTML = `<span style="color:${newOn ? 'var(--green)' : 'var(--t4)'};font-size:14px;cursor:pointer">${newOn ? '☑' : '☐'}</span>`;

    // Update memory
    if (newOn) {
      if (idx >= 0) { vis[idx].is_active = true; }
      else { vis.push({ store_id: storeId, dept_id: deptId, is_active: true }); }
    } else {
      if (idx >= 0) vis.splice(idx, 1);
    }

    // Sync DB (fire-and-forget with rollback)
    try {
      const resp = await API.toggleVisibility({ product_id: productId, store_id: storeId, dept_id: deptId, visible: newOn });
      if (!resp.success) {
        // Rollback
        if (newOn) { const ri = vis.findIndex(v => v.store_id === storeId && v.dept_id === deptId); if (ri >= 0) vis.splice(ri, 1); }
        else { vis.push({ store_id: storeId, dept_id: deptId, is_active: true }); }
        if (cell) cell.innerHTML = `<span style="color:${wasOn ? 'var(--green)' : 'var(--t4)'};font-size:14px;cursor:pointer">${wasOn ? '☑' : '☐'}</span>`;
        App.toast(resp.message || 'Error', 'error');
      }
    } catch (e) {
      // Rollback on network error
      if (newOn) { const ri = vis.findIndex(v => v.store_id === storeId && v.dept_id === deptId); if (ri >= 0) vis.splice(ri, 1); }
      else { vis.push({ store_id: storeId, dept_id: deptId, is_active: true }); }
      if (cell) cell.innerHTML = `<span style="color:${wasOn ? 'var(--green)' : 'var(--t4)'};font-size:14px;cursor:pointer">${wasOn ? '☑' : '☐'}</span>`;
      App.toast('Network error', 'error');
    }
  }

  // ═══════════════════════════════════════════
  // USER ACCESS MATRIX (Phase 8)
  // ═══════════════════════════════════════════

  let _accessData = null; // { functions: [], tiers: [], permissions: {} }

  function renderAccess() {
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">User Access</div></div>
      <div class="content" id="accessContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillAccess() {
    const el = document.getElementById('accessContent');
    if (!el) return;
    if (!_accessData) { el.innerHTML = '<div class="empty"><div class="empty-icon">🔐</div><div class="empty-title">กำลังโหลด...</div></div>'; return; }

    const { functions: fns, tiers, permissions: perms } = _accessData;
    if (!fns.length) { el.innerHTML = '<div class="empty"><div class="empty-icon">🔐</div><div class="empty-title">ไม่มีข้อมูล Functions</div></div>'; return; }

    // Group by section
    const sections = {};
    const secOrder = [];
    fns.forEach(f => {
      if (!sections[f.section]) { sections[f.section] = []; secOrder.push(f.section); }
      sections[f.section].push(f);
    });

    // Table header
    const thTiers = tiers.map(t => `<th class="acc-th-tier">${t}</th>`).join('');

    // Table rows
    let rows = '';
    secOrder.forEach(sec => {
      rows += `<tr><td colspan="${tiers.length + 1}" class="acc-sec-hd">${App.esc(sec)} (${sections[sec].length})</td></tr>`;
      sections[sec].forEach(f => {
        const cells = tiers.map(t => {
          const key = f.function_id + '|' + t;
          const on = !!perms[key];
          return `<td class="acc-cell" id="ac-${f.function_id}-${t}" onclick="Scr3.togglePerm('${f.function_id}','${t}')">
            <div class="acc-toggle${on ? ' acc-on' : ''}">${on ? '✅' : '—'}</div>
          </td>`;
        }).join('');
        rows += `<tr><td class="acc-fn-name"><span class="acc-fn-label">${App.esc(f.function_name)}</span><span class="acc-fn-id">${App.esc(f.function_id)}</span></td>${cells}</tr>`;
      });
    });

    const counter = `<div style="font-size:9px;color:var(--t3);margin-bottom:6px">${fns.length} functions × ${tiers.length} tiers — Tap to toggle (T1/T2 only)</div>`;

    el.innerHTML = `<div style="max-width:1100px;margin:0 auto">${counter}
      <div style="background:var(--bg);border:1px solid var(--bd);border-radius:var(--rd);overflow-x:auto">
        <table class="acc-tbl"><thead><tr><th style="min-width:180px;text-align:left">Function</th>${thTiers}</tr></thead><tbody>${rows}</tbody></table>
      </div>
      <div style="display:flex;justify-content:center;margin:16px 0">
        <button class="btn btn-primary" style="padding:10px 40px" onclick="App.go('home')">✓ Done</button>
      </div>
      <div style="font-size:9px;color:var(--t4);text-align:center">ทุกการเปลี่ยนแปลงจะบันทึกทันทีที่กด toggle</div>
    </div>`;
  }

  // ─── Set access data from loader ───
  function setAccessData(data) { _accessData = data; }

  // ─── Optimistic toggle permission ───
  async function togglePerm(functionId, tierId) {
    if (!_accessData) { App.toast('No access data loaded', 'error'); return; }
    const key = functionId + '|' + tierId;
    const wasOn = !!_accessData.permissions[key];
    const newOn = !wasOn;

    // Optimistic UI
    _accessData.permissions[key] = newOn;
    const cell = document.getElementById('ac-' + functionId + '-' + tierId);
    function setUI(on) {
      if (!cell) return;
      const inner = cell.querySelector('.acc-toggle');
      if (inner) { inner.className = 'acc-toggle' + (on ? ' acc-on' : ''); inner.textContent = on ? '✅' : '—'; }
    }
    setUI(newOn);

    // Sync DB
    try {
      const resp = await API.togglePermission({ function_id: functionId, tier_id: tierId, allowed: newOn });
      if (resp.success) {
        App.toast('✅ อัพเดท Permission', 'success');
      } else {
        _accessData.permissions[key] = wasOn;
        setUI(wasOn);
        App.toast(resp.message || 'Error', 'error');
      }
    } catch (e) {
      _accessData.permissions[key] = wasOn;
      setUI(wasOn);
      App.toast('Network error', 'error');
    }
  }

  // ═══════════════════════════════════════════
  // PLACEHOLDERS (Phase 9-10)
  // ═══════════════════════════════════════════

  // ═══════════════════════════════════════════
  // WASTE DASHBOARD (Phase 9)
  // ═══════════════════════════════════════════

  let _wdDateFrom = '';
  let _wdDateTo = '';

  function renderWasteDashboard() {
    const d30 = new Date(App.sydneyNow()); d30.setDate(d30.getDate() - 30);
    _wdDateFrom = App.fmtDate(d30);
    _wdDateTo = App.todaySydney();
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">Waste Dashboard</div></div>
      <div class="order-date-bar">
        <span class="date-label">📅</span>
        <input type="date" class="date-inp" value="${_wdDateFrom}" onchange="Scr3.setWDDate('from',this.value)">
        <span style="color:var(--t4)">→</span>
        <input type="date" class="date-inp" value="${_wdDateTo}" onchange="Scr3.setWDDate('to',this.value)">
        <span class="date-link" onclick="Scr3.setWDPreset('30d')">30d</span>
        <span class="date-link" onclick="Scr3.setWDPreset('all')">ทั้งหมด</span>
      </div>
      <div class="content" id="wdContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillWasteDashboard() {
    const el = document.getElementById('wdContent');
    if (!el) return;
    const d = App.S.wasteDash;
    if (!d) { el.innerHTML = '<div class="empty"><div class="empty-icon">📊</div><div class="empty-title">กำลังโหลด...</div></div>'; return; }

    // KPI cards
    const kpis = `<div class="rpt-kpis">
      ${rptKpi(d.today, 'Today', 'var(--red)')}
      ${rptKpi(d.week7, '7 days', 'var(--orange)')}
      ${rptKpi(d.total, 'Total', 'var(--blue)')}
      ${rptKpi(d.avg_per_day, 'Avg/day', 'var(--acc)')}
    </div>`;

    // By Reason
    const maxReason = Math.max(...(d.by_reason || []).map(r => r.qty), 1);
    const reasons = (d.by_reason || []).map(r =>
      `<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px"><span style="font-weight:600">${App.esc(r.reason)}</span><span>${r.qty} pcs</span></div>${hBar(r.qty / maxReason * 100, reasonColor(r.reason))}</div>`
    ).join('');
    const reasonBlock = reasons ? `<div class="rpt-section"><div class="rpt-section-title">By Reason</div>${reasons}</div>` : '';

    // Top Waste
    const medals = ['🥇', '🥈', '🥉'];
    const maxTop = Math.max(...(d.top_products || []).map(r => r.qty), 1);
    const tops = (d.top_products || []).slice(0, 5).map((r, i) =>
      `<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px"><span>${medals[i] || '#' + (i + 1)} <b>${App.esc(r.product_name)}</b></span><span style="color:var(--red)">${r.qty}</span></div>${hBar(r.qty / maxTop * 100, 'var(--red)')}</div>`
    ).join('');
    const topBlock = tops ? `<div class="rpt-section"><div class="rpt-section-title">🏆 Top Waste</div>${tops}</div>` : '';

    el.innerHTML = `<div style="max-width:900px;margin:0 auto">${kpis}
      <div class="rpt-grid">${reasonBlock}${topBlock}</div>
    </div>`;
  }

  function setWDDate(which, val) { if (which === 'from') _wdDateFrom = val; else _wdDateTo = val; App.loadWasteDashboard(_wdDateFrom, _wdDateTo); }
  function setWDPreset(p) {
    const r = _datePreset(p); _wdDateFrom = r.from; _wdDateTo = r.to;
    App.loadWasteDashboard(_wdDateFrom, _wdDateTo);
  }

  function reasonColor(r) { return r === 'Expired' ? '#ef4444' : r === 'Damaged' ? '#f97316' : r === 'Production Error' ? 'var(--acc)' : 'var(--blue)'; }

  // ═══════════════════════════════════════════
  // TOP PRODUCTS (Phase 9)
  // ═══════════════════════════════════════════

  let _tpDateFrom = '';
  let _tpDateTo = '';

  function renderTopProducts() {
    const d30 = new Date(App.sydneyNow()); d30.setDate(d30.getDate() - 30);
    _tpDateFrom = App.fmtDate(d30);
    _tpDateTo = App.todaySydney();
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">Top Products</div></div>
      <div class="order-date-bar">
        <span class="date-label">📅</span>
        <input type="date" class="date-inp" value="${_tpDateFrom}" onchange="Scr3.setTPDate('from',this.value)">
        <span style="color:var(--t4)">→</span>
        <input type="date" class="date-inp" value="${_tpDateTo}" onchange="Scr3.setTPDate('to',this.value)">
        <span class="date-link" onclick="Scr3.setTPPreset('30d')">30d</span>
        <span class="date-link" onclick="Scr3.setTPPreset('all')">ทั้งหมด</span>
      </div>
      <div class="content" id="tpContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillTopProducts() {
    const el = document.getElementById('tpContent');
    if (!el) return;
    const d = App.S.topProds;
    if (!d) { el.innerHTML = '<div class="empty"><div class="empty-icon">🏆</div><div class="empty-title">กำลังโหลด...</div></div>'; return; }

    // Most Ordered
    const medals = ['🥇', '🥈', '🥉'];
    const topColors = ['var(--acc)', 'var(--acc)', 'var(--acc)', 'var(--blue)', 'var(--blue)'];
    const maxOrd = Math.max(...(d.top_ordered || []).map(r => r.qty), 1);
    const orderedBars = (d.top_ordered || []).slice(0, 5).map((r, i) =>
      `<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px"><span>${medals[i] || '#' + (i + 1)} <b>${App.esc(r.product_name)}</b></span><span style="font-weight:700">${r.qty}</span></div>${hBar(r.qty / maxOrd * 100, topColors[i] || 'var(--blue)')}</div>`
    ).join('');
    const orderedBlock = orderedBars ? `<div class="rpt-section"><div class="rpt-section-title">🏆 Most Ordered</div>${orderedBars}</div>` : '';

    // By Store
    const storeColors = ['var(--green)', 'var(--blue)', 'var(--orange)', 'var(--acc)', 'var(--red)'];
    const maxStore = Math.max(...(d.by_store || []).map(r => r.qty), 1);
    const storeBars = (d.by_store || []).map((r, i) =>
      `<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px"><span style="font-weight:600">${App.esc(App.getStoreName(r.store_id) || r.store_id)}</span><span>${r.qty}</span></div>${hBar(r.qty / maxStore * 100, storeColors[i % storeColors.length])}</div>`
    ).join('');
    const storeBlock = storeBars ? `<div class="rpt-section"><div class="rpt-section-title">🏪 By Store</div>${storeBars}</div>` : '';

    if (!orderedBars && !storeBars) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">📦</div><div class="empty-title">ไม่มีข้อมูลในช่วงนี้</div></div>';
      return;
    }

    el.innerHTML = `<div style="max-width:800px;margin:0 auto">${orderedBlock}${storeBlock}</div>`;
  }

  function setTPDate(which, val) { if (which === 'from') _tpDateFrom = val; else _tpDateTo = val; App.loadTopProducts(_tpDateFrom, _tpDateTo); }
  function setTPPreset(p) {
    const r = _datePreset(p); _tpDateFrom = r.from; _tpDateTo = r.to;
    App.loadTopProducts(_tpDateFrom, _tpDateTo);
  }

  // ─── SHARED: horizontal bar + KPI card ───
  function hBar(pct, color) {
    return `<div class="rpt-bar"><div class="rpt-bar-fill" style="width:${Math.min(pct, 100)}%;background:${color}"></div></div>`;
  }
  function rptKpi(val, label, color) {
    return `<div class="rpt-kpi" style="border-left:3px solid ${color}"><div class="rpt-kpi-val" style="color:${color}">${val ?? 0}</div><div class="rpt-kpi-label">${label}</div></div>`;
  }
  // ═══════════════════════════════════════════
  // CUTOFF VIOLATIONS (Phase 10)
  // ═══════════════════════════════════════════

  let _coDateFrom = '';
  let _coDateTo = '';
  let _coShowCount = 10;

  function renderCutoff() {
    const d30 = new Date(App.sydneyNow()); d30.setDate(d30.getDate() - 30);
    _coDateFrom = App.fmtDate(d30);
    _coDateTo = App.todaySydney();
    _coShowCount = 10;
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">Cutoff Violations</div></div>
      <div class="order-date-bar">
        <span class="date-label">📅</span>
        <input type="date" class="date-inp" value="${_coDateFrom}" onchange="Scr3.setCODate('from',this.value)">
        <span style="color:var(--t4)">→</span>
        <input type="date" class="date-inp" value="${_coDateTo}" onchange="Scr3.setCODate('to',this.value)">
        <span class="date-link" onclick="Scr3.setCOPreset('today')">Today</span>
        <span class="date-link" onclick="Scr3.setCOPreset('30d')">30d</span>
      </div>
      <div class="content" id="coContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillCutoff() {
    const el = document.getElementById('coContent');
    if (!el) return;
    const data = App.S.cutoffData;
    if (!data) { el.innerHTML = '<div class="empty"><div class="empty-icon">⏰</div><div class="empty-title">กำลังโหลด...</div></div>'; return; }

    const list = data || [];
    if (!list.length) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">✅</div><div class="empty-title">ไม่มี Cutoff Violation</div><div class="empty-desc">ในช่วงเวลาที่เลือก</div></div>';
      return;
    }

    const visible = list.slice(0, _coShowCount);
    const hasMore = list.length > _coShowCount;

    const stsStyle = (s) => {
      if (s === 'Pending') return 'background:var(--red-bg);color:var(--red)';
      if (s === 'Ordered') return 'background:var(--blue-bg);color:#1e40af';
      if (s === 'Fulfilled' || s === 'Delivered') return 'background:var(--green-bg);color:#065f46';
      return 'background:var(--bg3);color:var(--t3)';
    };

    const rows = visible.map(o => `<tr style="border-left:3px solid ${o.status === 'Pending' ? 'var(--red)' : 'var(--bd)'}">
      <td style="font-weight:700;color:var(--acc)">${App.esc(o.order_id)}</td>
      <td>${App.esc(App.getStoreName(o.store_id) || o.store_id)}</td>
      <td style="font-size:10px">${App.esc(o.ordered_time || '')}</td>
      <td>${App.fmtDateAU(o.delivery_date)}</td>
      <td><span class="sts" style="${stsStyle(o.status)}">${App.esc(o.status)}</span></td>
    </tr>`).join('');

    el.innerHTML = `<div style="max-width:900px;margin:0 auto">
      <div style="font-size:10px;color:var(--t3);margin-bottom:6px">⏰ ${list.length} violations</div>
      <div style="background:var(--bg);border:1px solid var(--bd);border-radius:var(--rd);overflow-x:auto">
        <table class="adm-tbl"><thead><tr><th>Order</th><th>Store</th><th>Ordered At</th><th>Delivery</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
      </div>
      ${hasMore ? `<div class="load-more" onclick="Scr3.showMoreCO()">แสดง ${_coShowCount} จาก ${list.length} · โหลดเพิ่ม 10 ↓</div>` : ''}
    </div>`;
  }

  function setCODate(which, val) { if (which === 'from') _coDateFrom = val; else _coDateTo = val; _coShowCount = 10; App.loadCutoffData(_coDateFrom, _coDateTo); }
  function setCOPreset(p) {
    const r = _datePreset(p); _coDateFrom = r.from; _coDateTo = r.to;
    _coShowCount = 10;
    App.loadCutoffData(_coDateFrom, _coDateTo);
  }
  function showMoreCO() { _coShowCount += 10; fillCutoff(); }

  // ═══════════════════════════════════════════
  // AUDIT TRAIL (Phase 10)
  // ═══════════════════════════════════════════

  let _auDateFrom = '';
  let _auDateTo = '';
  let _auFilter = 'all';
  let _auShowCount = 15;

  function renderAudit() {
    const d30 = new Date(App.sydneyNow()); d30.setDate(d30.getDate() - 30);
    _auDateFrom = App.fmtDate(d30);
    _auDateTo = App.todaySydney();
    _auFilter = 'all';
    _auShowCount = 15;
    return `<div class="toolbar"><button class="toolbar-back" onclick="App.go('home')">←</button><div class="toolbar-title">Audit Trail</div></div>
      <div class="order-date-bar">
        <span class="date-label">📅</span>
        <input type="date" class="date-inp" value="${_auDateFrom}" onchange="Scr3.setAUDate('from',this.value)">
        <span style="color:var(--t4)">→</span>
        <input type="date" class="date-inp" value="${_auDateTo}" onchange="Scr3.setAUDate('to',this.value)">
        <span class="date-link" onclick="Scr3.setAUPreset('30d')">30d</span>
        <span class="date-link" onclick="Scr3.setAUPreset('all')">ทั้งหมด</span>
      </div>
      <div class="order-chips" id="auChips"></div>
      <div class="content" id="auContent"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
  }

  function fillAudit() {
    const el = document.getElementById('auContent');
    const chipEl = document.getElementById('auChips');
    if (!el) return;
    const all = App.S.auditData || [];

    // Count by type
    const counts = { all: all.length };
    all.forEach(a => { counts[a.action_type] = (counts[a.action_type] || 0) + 1; });

    // Chips
    const typeLabels = { permission: '🔐 Perm', dept_mapping: '🏢 Dept', config: '⚙ Config', product: '📦 Product', visibility: '👁️ Vis' };
    if (chipEl) {
      let chips = `<div class="chip${_auFilter === 'all' ? ' active' : ''}" onclick="Scr3.setAUFilter('all')">All (${all.length})</div>`;
      for (const [type, label] of Object.entries(typeLabels)) {
        if (counts[type]) chips += `<div class="chip${_auFilter === type ? ' active' : ''}" onclick="Scr3.setAUFilter('${type}')">${label} (${counts[type]})</div>`;
      }
      chipEl.innerHTML = chips;
    }

    // Filter
    let filtered = all;
    if (_auFilter !== 'all') filtered = all.filter(a => a.action_type === _auFilter);

    if (!filtered.length) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">📋</div><div class="empty-title">ไม่มี Audit Log</div></div>';
      return;
    }

    const visible = filtered.slice(0, _auShowCount);
    const hasMore = filtered.length > _auShowCount;

    const badgeStyle = (type) => {
      const map = { permission: 'background:var(--acc2);color:var(--acc)', dept_mapping: 'background:var(--blue-bg);color:var(--blue)', config: 'background:#fffbeb;color:#92400e', product: 'background:var(--green-bg);color:var(--green)', visibility: 'background:var(--bg3);color:var(--t2)' };
      return map[type] || 'background:var(--bg3);color:var(--t2)';
    };

    const rows = visible.map(a => {
      const time = a.changed_at ? new Date(a.changed_at).toLocaleString('en-AU', { timeZone: 'Australia/Sydney', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) : '';
      return `<tr>
        <td style="font-size:9px;white-space:nowrap">${App.esc(time)}</td>
        <td><span style="${badgeStyle(a.action_type)};padding:1px 4px;border-radius:3px;font-size:9px;font-weight:600">${App.esc(a.action_type)}</span></td>
        <td style="font-size:10px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${App.esc(a.target)}">${App.esc(a.target)}</td>
        <td style="color:var(--red);font-size:10px">${App.esc(a.old_value || '—')}</td>
        <td style="color:var(--green);font-size:10px">${App.esc(a.new_value || '—')}</td>
        <td style="font-size:10px">${App.esc(a.changed_by_name || a.changed_by || '')}</td>
      </tr>`;
    }).join('');

    el.innerHTML = `<div style="max-width:1100px;margin:0 auto">
      <div style="background:var(--bg);border:1px solid var(--bd);border-radius:var(--rd);overflow-x:auto">
        <table class="adm-tbl"><thead><tr><th>Time</th><th>Action</th><th>Target</th><th>From</th><th>To</th><th>By</th></tr></thead><tbody>${rows}</tbody></table>
      </div>
      ${hasMore ? `<div class="load-more" onclick="Scr3.showMoreAU()">แสดง ${_auShowCount} จาก ${filtered.length} · โหลดเพิ่ม 15 ↓</div>` : ''}
    </div>`;
  }

  function setAUDate(which, val) { if (which === 'from') _auDateFrom = val; else _auDateTo = val; _auShowCount = 15; App.loadAuditData(_auDateFrom, _auDateTo); }
  function setAUPreset(p) {
    const r = _datePreset(p); _auDateFrom = r.from; _auDateTo = r.to;
    _auShowCount = 15;
    App.loadAuditData(_auDateFrom, _auDateTo);
  }
  function setAUFilter(f) { _auFilter = f; _auShowCount = 15; fillAudit(); }
  function showMoreAU() { _auShowCount += 15; fillAudit(); }

  return {
    renderConfig, fillConfig, editConfig, saveConfig,
    renderDeptMapping, fillDeptMapping, editDeptMapping, saveDeptMapping,
    renderVisibility, fillVisibility, setVisSection, filterVis, dFilterVis, toggleVis,
    renderAccess, fillAccess, setAccessData, togglePerm,
    renderWasteDashboard, fillWasteDashboard, setWDDate, setWDPreset,
    renderTopProducts, fillTopProducts, setTPDate, setTPPreset,
    renderCutoff, fillCutoff, setCODate, setCOPreset, showMoreCO,
    renderAudit, fillAudit, setAUDate, setAUPreset, setAUFilter, showMoreAU,
  };
})();
