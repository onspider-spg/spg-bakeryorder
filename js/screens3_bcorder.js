/**
 * Version 1.0 | 14 MAR 2026 | Siam Palette Group
 * ═══════════════════════════════════════════
 * SPG — BC Order v2
 * screens3_bcorder.js — Admin + Reports Screens
 * Phase 7: Config + Dept Mapping + placeholders
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
        App.S.config[key] = newVal; // update memory
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
        // Update memory
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
  // PLACEHOLDERS (Phase 8-10)
  // ═══════════════════════════════════════════

  function renderVisibility()     { return placeholder('Product Visibility', '👁️'); }
  function fillVisibility()       {}
  function renderAccess()         { return placeholder('User Access', '🔐'); }
  function fillAccess()           {}
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
    renderVisibility, fillVisibility,
    renderAccess, fillAccess,
    renderWasteDashboard, fillWasteDashboard,
    renderTopProducts, fillTopProducts,
    renderCutoff, fillCutoff,
    renderAudit, fillAudit,
  };
})();
