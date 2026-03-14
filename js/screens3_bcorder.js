/**
 * Version 1.1 | 14 MAR 2026 | Siam Palette Group
 * ═══════════════════════════════════════════
 * SPG — BC Order v2
 * screens3_bcorder.js — Admin + Reports Screens
 * Phase 8: Visibility Matrix + User Access Matrix
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

    const search = `<input class="search-input" style="max-width:300px;margin-bottom:8px" placeholder="🔍 Search products..." value="${App.esc(_visSearch)}" oninput="Scr3.filterVis(this.value)">`;

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
          const on = perms[key] === true;
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
    </div>`;
  }

  // ─── Set access data from loader ───
  function setAccessData(data) { _accessData = data; }

  // ─── Optimistic toggle permission ───
  async function togglePerm(functionId, tierId) {
    if (!_accessData) return;
    const key = functionId + '|' + tierId;
    const wasOn = _accessData.permissions[key] === true;
    const newOn = !wasOn;

    // Optimistic UI
    _accessData.permissions[key] = newOn;
    const cell = document.getElementById('ac-' + functionId + '-' + tierId);
    if (cell) {
      const inner = cell.querySelector('.acc-toggle');
      if (inner) { inner.className = 'acc-toggle' + (newOn ? ' acc-on' : ''); inner.textContent = newOn ? '✅' : '—'; }
    }

    // Sync DB
    try {
      const resp = await API.togglePermission({ function_id: functionId, tier_id: tierId, allowed: newOn });
      if (!resp.success) {
        // Rollback
        _accessData.permissions[key] = wasOn;
        if (cell) {
          const inner = cell.querySelector('.acc-toggle');
          if (inner) { inner.className = 'acc-toggle' + (wasOn ? ' acc-on' : ''); inner.textContent = wasOn ? '✅' : '—'; }
        }
        App.toast(resp.message || 'Error', 'error');
      }
    } catch (e) {
      _accessData.permissions[key] = wasOn;
      if (cell) {
        const inner = cell.querySelector('.acc-toggle');
        if (inner) { inner.className = 'acc-toggle' + (wasOn ? ' acc-on' : ''); inner.textContent = wasOn ? '✅' : '—'; }
      }
      App.toast('Network error', 'error');
    }
  }

  // ═══════════════════════════════════════════
  // PLACEHOLDERS (Phase 9-10)
  // ═══════════════════════════════════════════

  function renderWasteDashboard() { return placeholder('Waste Dashboard', '📊'); }
  function fillWasteDashboard()   {}
  function renderTopProducts()    { return placeholder('Top Products', '🏆'); }
  function fillTopProducts()      {}
  function renderCutoff()         { return placeholder('Cutoff Violations', '⏰'); }
  function fillCutoff()           {}
  function renderAudit()          { return placeholder('Audit Trail', '📋'); }
  function fillAudit()            {}

  return {
    renderConfig, fillConfig, editConfig, saveConfig,
    renderDeptMapping, fillDeptMapping, editDeptMapping, saveDeptMapping,
    renderVisibility, fillVisibility, setVisSection, filterVis, toggleVis,
    renderAccess, fillAccess, setAccessData, togglePerm,
    renderWasteDashboard, fillWasteDashboard,
    renderTopProducts, fillTopProducts,
    renderCutoff, fillCutoff,
    renderAudit, fillAudit,
  };
})();
