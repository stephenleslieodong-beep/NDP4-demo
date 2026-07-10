/* ============================================================================
   CIVICTRACK APP ENGINE
   Vanilla JS, hash-based router, no backend. Session state lives in
   sessionStorage only (cleared when the browser tab closes) — appropriate
   for a demo, not a real auth system.
   ========================================================================= */

// ---------------------------------------------------------------------------
// SESSION
// ---------------------------------------------------------------------------
const CT_ROLES = {
  mp:  { label: "Member of Parliament", badge: "Tier 1", badgeClass: "badge-tier1", home: "#/mp/dashboard" },
  lc5: { label: "LC5 — District Council", badge: "LC5", badgeClass: "badge-lc5", home: "#/lc5/dashboard" },
  lc3: { label: "LC3 — Sub-county Council", badge: "LC3", badgeClass: "badge-lc3", home: "#/lc3/dashboard" },
  lc2: { label: "LC2 — Parish Council", badge: "LC2", badgeClass: "badge-lc2", home: "#/lc2/dashboard" },
  lc1: { label: "LC1 — Village Council", badge: "LC1", badgeClass: "badge-lc1", home: "#/lc1/dashboard" }
};

function ctGetSession(){
  try { return JSON.parse(sessionStorage.getItem('ct_session') || 'null'); } catch(e){ return null; }
}
function ctSetSession(role){
  sessionStorage.setItem('ct_session', JSON.stringify({ role, since: Date.now() }));
}
function ctLogout(){
  sessionStorage.removeItem('ct_session');
  location.hash = '#/login';
}
function ctSetPendingRole(role){
  sessionStorage.setItem('ct_pending_role', role);
  location.hash = '#/signin';
}
function ctGetPendingRole(){
  return sessionStorage.getItem('ct_pending_role');
}

// ---------------------------------------------------------------------------
// TOAST — "Demo Mode" confirmations for every simulated submission
// ---------------------------------------------------------------------------
function ctToast(message, opts){
  opts = opts || {};
  let stack = document.querySelector('.toast-stack');
  if (!stack){ stack = document.createElement('div'); stack.className = 'toast-stack'; document.body.appendChild(stack); }
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = '<span class="dot"></span><span>' + message + '</span>';
  stack.appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 250);
  }, opts.duration || 3200);
}
function ctDemoModeToast(action){
  ctToast((action ? action + ' — ' : '') + 'Demo Mode — displayed for demonstration only, not permanently stored.', { duration: 3800 });
}

// ---------------------------------------------------------------------------
// MODAL — two flavors: real content (ctInfoModal) and a DEMO stamp for
// tiles/rows that don't have verified data behind them yet (ctDemoModal).
// Every clickable dashboard element resolves to one of these two — nothing
// is a dead click.
// ---------------------------------------------------------------------------
function ctOpenModal(innerHtml){
  ctCloseModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'ctModalOverlay';
  overlay.onclick = function(e){ if (e.target === overlay) ctCloseModal(); };
  overlay.innerHTML = '<div class="modal-box" style="position:relative;">' +
    '<button class="modal-close" onclick="ctCloseModal()" aria-label="Close">✕</button>' + innerHtml + '</div>';
  document.body.appendChild(overlay);
  document.addEventListener('keydown', ctModalEscHandler);
}
function ctCloseModal(){
  const el = document.getElementById('ctModalOverlay');
  if (el) el.remove();
  document.removeEventListener('keydown', ctModalEscHandler);
}
function ctModalEscHandler(e){ if (e.key === 'Escape') ctCloseModal(); }

function ctInfoModal(title, bodyHtml, sourceLine){
  ctOpenModal(`
    <h3>${title}</h3>
    <div style="margin-top:10px;">${bodyHtml}</div>
    ${sourceLine ? `<div class="footer-note" style="margin-top:16px;text-align:left;font-style:normal;">${sourceLine}</div>` : ''}
  `);
}

function ctDemoModal(title, note){
  ctOpenModal(`
    <div class="demo-stamp-wrap">
      <div class="demo-stamp">DEMO</div>
      <h3 style="margin-top:6px;">${title}</h3>
      <p style="font-size:13px;color:var(--ct-text-secondary);line-height:var(--lh-sm);margin-top:6px;">
        ${note || 'This element is not backed by a verified figure from a reviewed government report in this prototype. In the production version, this would open a live drill-down connected to the underlying data source.'}
      </p>
    </div>`);
}

// ---------------------------------------------------------------------------
// THEME TOGGLE
// ---------------------------------------------------------------------------
function ctToggleTheme(){
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('ct_theme', isDark ? 'light' : 'dark');
}
(function ctInitTheme(){
  const saved = localStorage.getItem('ct_theme');
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
})();

// ---------------------------------------------------------------------------
// COMPONENT BUILDERS — small functions returning HTML strings, reused by
// every view so the same KPI card, status pill, etc. looks identical everywhere.
// ---------------------------------------------------------------------------
function ctBreadcrumb(items){
  return '<div class="breadcrumb">' + items.map((it, i) => {
    const sep = i > 0 ? '<span class="sep">/</span>' : '';
    return sep + (it.href ? `<a href="${it.href}">${it.label}</a>` : `<span class="current">${it.label}</span>`);
  }).join('') + '</div>';
}

function ctStatusPill(status, label){
  const map = { stalled: 'stalled', pending: 'pending', ontrack: 'ontrack', complete: 'complete' };
  const cls = map[status] || 'pending';
  const text = label || { stalled: 'Stalled', pending: 'Pending', ontrack: 'On track', complete: 'Complete' }[status];
  return `<span class="status-pill ${cls}">${text}</span>`;
}

function ctProjectRow(p, linkBase){
  const href = linkBase ? `${linkBase}${p.id}` : '#';
  return `
    <a href="${href}" style="text-decoration:none;color:inherit;display:block;">
      <div class="row">
        <div><div class="row-title">${p.name}</div><div class="row-sub">${p.sector || ''}${p.location ? ' · ' + p.location : ''}</div></div>
        ${ctStatusPill(p.stageStatus)}
      </div>
    </a>`;
}

function ctProgrammeTile(prog, opts){
  opts = opts || {};
  const displayPct = prog.pctOfRevised != null ? prog.pctOfRevised : prog.pct;
  const statusClass = displayPct == null ? '' : (displayPct >= (opts.paceTarget || 50) ? 'good' : (displayPct < 20 ? 'danger' : 'amber'));
  const hasExpand = !!(prog.subLines || prog.note);
  const uid = 'exp_' + prog.name.replace(/[^a-z0-9]/gi, '').slice(0, 24) + '_' + (opts.uidSuffix || '');
  let sub = '';
  if (hasExpand){
    sub = `<div class="expand-panel" id="${uid}"><div class="expand-panel-inner">`;
    if (prog.note){
      sub += `<p style="font-size:11px;color:var(--ct-text-muted);margin-bottom:8px;">${prog.note}</p>`;
    }
    (prog.subLines || []).forEach(sl => {
      if (sl.notAvailable){
        sub += `<div class="expand-subrow"><span class="sublabel">${sl.label}</span><span class="subvalue" style="color:var(--ct-text-muted);font-weight:500;font-size:11px;">${sl.note}</span></div>`;
      } else {
        sub += `<div class="expand-subrow"><span class="sublabel">${sl.label}</span><span class="subvalue amber">${sl.pct}% of ${ctFormatUGX(sl.approved)}</span></div>`;
      }
    });
    sub += `</div></div>`;
  }
  return `
    <div class="indicator-card${opts.clickable ? ' clickable' : ''}">
      <div class="icat${hasExpand ? ' expand-trigger' : ''}" ${hasExpand ? `onclick="this.classList.toggle('open');document.getElementById('${uid}').classList.toggle('open')"` : ''}>
        ${prog.name}${hasExpand ? ' <span class="expand-icon">▸</span>' : ''}
      </div>
      <div class="ival ${statusClass}">${displayPct != null ? displayPct + '%' : ctFormatUGX(prog.approved)}</div>
      <div class="isub">of ${ctFormatUGX(prog.revisedApproved || prog.approved)} released</div>
      ${sub}
    </div>`;
}

function ctTopbar(title, sub, roleKey){
  const role = CT_ROLES[roleKey];
  return `
    <div class="topbar">
      <button class="theme-toggle nav-arrow-btn" onclick="history.back()" style="position:static;" title="Back">←</button>
      <button class="theme-toggle nav-arrow-btn" onclick="history.forward()" style="position:static;margin-right:4px;" title="Forward">→</button>
      <div class="logo"></div>
      <img src="NICE_UG_Logo.png" alt="NICE-UG" class="nice-ug-logo topbar-nice-logo">
      <div style="flex:1;">
        <div class="topbar-title">${title}</div>
        <div class="topbar-sub">${sub}</div>
      </div>
      <span class="badge ${role.badgeClass}">${role.badge}</span>
      <button class="theme-toggle" onclick="ctToggleTheme()" style="position:static;margin-left:8px;" title="Toggle dark mode">🌓</button>
      <button class="theme-toggle" onclick="ctLogout()" style="position:static;" title="Log out">⎋</button>
    </div>`;
}

function ctDrillTabs(tabs, activeIndex){
  return '<div class="drill-tabs">' + tabs.map((t, i) =>
    `<button class="drill-tab${i === (activeIndex||0) ? ' active' : ''}" onclick="ctSwitchDrillTab(this,'${t.id}')">${t.label}</button>`
  ).join('') + '</div>';
}
function ctSwitchDrillTab(btn, panelId){
  const container = btn.closest('.drill-tabs').parentElement;
  container.querySelectorAll('.drill-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  container.querySelectorAll('.drill-panel').forEach(p => p.classList.remove('active'));
  container.querySelector(`[data-panel="${panelId}"]`).classList.add('active');
}

function ctConstitutionalNote(text){
  return `<div class="constitutional-note"><span class="icon">ⓘ</span><span><strong>Role reminder:</strong> ${text}</span></div>`;
}

function ctPrevNextNav(list, currentId, hrefBase){
  const idx = list.findIndex(p => p.id === currentId);
  if (idx === -1) return '';
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx < list.length - 1 ? list[idx + 1] : null;
  return `
    <div class="proj-nav">
      ${prev
        ? `<a class="proj-nav-btn" href="${hrefBase}${prev.id}"><span class="proj-nav-arrow">‹</span><span><span class="proj-nav-label">Previous</span><span class="proj-nav-name">${prev.name}</span></span></a>`
        : `<span class="proj-nav-btn disabled"><span class="proj-nav-arrow">‹</span><span><span class="proj-nav-label">Previous</span><span class="proj-nav-name">Start of list</span></span></span>`}
      <span class="proj-nav-pos">${idx + 1} / ${list.length}</span>
      ${next
        ? `<a class="proj-nav-btn next" href="${hrefBase}${next.id}"><span><span class="proj-nav-label">Next</span><span class="proj-nav-name">${next.name}</span></span><span class="proj-nav-arrow">›</span></a>`
        : `<span class="proj-nav-btn disabled next"><span><span class="proj-nav-label">Next</span><span class="proj-nav-name">End of list</span></span><span class="proj-nav-arrow">›</span></span>`}
    </div>`;
}

// ---------------------------------------------------------------------------
// ROUTER
// ---------------------------------------------------------------------------
const CT_ROUTES = {};
function ctRoute(path, fn){ CT_ROUTES[path] = fn; }

function ctRender(){
  const app = document.getElementById('app');
  const session = ctGetSession();
  let path = location.hash || '#/login';

  const publicRoutes = ['#/login', '#/signin'];
  if (!publicRoutes.includes(path) && !session){
    location.hash = '#/login';
    return;
  }
  // #/signin requires a role to have been picked in step 1
  if (path === '#/signin' && !ctGetPendingRole()){
    location.hash = '#/login';
    return;
  }
  const roleInPath = Object.keys(CT_ROLES).find(r => path.startsWith('#/' + r + '/'));
  if (roleInPath && session && roleInPath !== session.role){
    if (!path.includes('/project')) { location.hash = CT_ROLES[session.role].home; return; }
  }

  const fn = CT_ROUTES[path.split('?')[0]] || CT_ROUTES['#/login'];
  app.innerHTML = fn(session);
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', ctRender);
window.addEventListener('DOMContentLoaded', () => { if (!location.hash) location.hash = '#/login'; ctRender(); });
