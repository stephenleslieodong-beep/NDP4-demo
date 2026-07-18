/* ============================================================================
   CIVICTRACK APP ENGINE
   Vanilla JS, hash-based router, no backend. Session state lives in
   sessionStorage only (cleared when the browser tab closes) — appropriate
   for a demo, not a real auth system.

   Session shape: { role, since, geoId, constituencyId, subCountyId, wardId,
   cellId } — geoId is always one of the canonical ids in CT_DATA.geo; the
   deeper picks are the same id scheme (see data.js).
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
// Called when the demo sign-in completes (this demo accepts ANY credentials,
// including blank — there is no real validation). Geography is not chosen
// yet; the router sends the user to #/geography next.
function ctCreateSession(role){
  sessionStorage.setItem('ct_session', JSON.stringify({ role: role, since: Date.now(), geoId: null }));
}
function ctUpdateSession(patch){
  const s = ctGetSession() || {};
  Object.assign(s, patch);
  sessionStorage.setItem('ct_session', JSON.stringify(s));
}
// Records the geography pick into the session and sends the user home.
// picks: { geoId, constituencyId?, subCountyId?, wardId?, cellId? }
function ctSelectGeography(picks){
  ctUpdateSession({
    geoId: picks.geoId || null,
    constituencyId: picks.constituencyId || null,
    subCountyId: picks.subCountyId || null,
    wardId: picks.wardId || null,
    cellId: picks.cellId || null
  });
  const s = ctGetSession();
  location.hash = CT_ROLES[s.role].home;
}
// Logout fully clears session state — INCLUDING any pending role pick — so a
// fresh login always starts back at role selection.
function ctLogout(){
  sessionStorage.removeItem('ct_session');
  sessionStorage.removeItem('ct_pending_role');
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
// NICE-UG LOGO — inline SVG data URI so the four delivered files are fully
// self-contained (the original referenced an external NICE_UG_Logo.png that
// was not part of the uploaded file set).
// ---------------------------------------------------------------------------
const CT_NICE_UG_LOGO = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 40">' +
  '<rect x="0" y="0" width="96" height="40" rx="8" fill="#ffffff"/>' +
  '<rect x="0" y="0" width="96" height="40" rx="8" fill="none" stroke="#DEDBD1"/>' +
  '<rect x="8" y="9" width="30" height="7" fill="#1A1A1A"/>' +
  '<rect x="8" y="17" width="30" height="7" fill="#FCDC04"/>' +
  '<rect x="8" y="25" width="30" height="7" fill="#D21034"/>' +
  '<text x="44" y="26" font-family="Arial,Helvetica,sans-serif" font-size="12" font-weight="700" fill="#1A1A1A">NICE-UG</text>' +
  '</svg>'
);

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
function ctOpenModal(innerHtml, opts){
  opts = opts || {};
  ctCloseModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'ctModalOverlay';
  overlay.onclick = function(e){ if (e.target === overlay) ctCloseModal(); };
  overlay.innerHTML = '<div class="modal-box' + (opts.wide ? ' modal-wide' : '') + '" style="position:relative;">' +
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

// DEMO watermark overlay — for whole views or panels that have no verified
// underlying data. The screen still opens and renders normally; the watermark
// makes the placeholder status unmistakable (brief requirement 3).
function ctDemoWatermark(note){
  return `<div class="demo-watermark-overlay" aria-hidden="true"><span class="demo-watermark-text">DEMO</span></div>` +
    (note ? `<div class="demo-watermark-note">${note}</div>` : '');
}

// Small availability chip used by the four-dimension views.
function ctDimChip(available){
  return available
    ? '<span class="dim-chip verified">✓ verified data</span>'
    : '<span class="dim-chip demo">DEMO — no data</span>';
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
  const clickAttr = opts.onClick ? ` onclick="${opts.onClick}"` : '';
  const clickable = opts.onClick ? ' clickable' : (opts.clickable ? ' clickable' : '');
  const cta = opts.onClick ? '<div class="cta">Programme breakdown →</div>' : '';
  return `
    <div class="indicator-card${clickable}"${clickAttr}>
      <div class="icat${hasExpand ? ' expand-trigger' : ''}" ${hasExpand ? `onclick="event.stopPropagation();this.classList.toggle('open');document.getElementById('${uid}').classList.toggle('open')"` : ''}>
        ${prog.name}${hasExpand ? ' <span class="expand-icon">▸</span>' : ''}
      </div>
      <div class="ival ${statusClass}">${displayPct != null ? displayPct + '%' : ctFormatUGX(prog.approved)}</div>
      <div class="isub">of ${ctFormatUGX(prog.revisedApproved || prog.approved)} released</div>
      ${sub}${cta}
    </div>`;
}

// Topbar with browser-style back/forward, NICE-UG chip, role badge and the
// current session geography (clickable — re-opens the geography picker).
function ctTopbar(title, sub, roleKey){
  const role = CT_ROLES[roleKey];
  const s = ctGetSession() || {};
  const geoChip = s.geoId
    ? `<a href="#/geography" class="geo-chip" title="Change area">📍 ${ctGeoName(s.constituencyId || s.subCountyId || s.wardId || s.cellId || s.geoId)}</a>`
    : '';
  return `
    <div class="topbar">
      <button class="theme-toggle nav-arrow-btn" onclick="history.back()" style="position:static;" title="Back">←</button>
      <button class="theme-toggle nav-arrow-btn" onclick="history.forward()" style="position:static;margin-right:4px;" title="Forward">→</button>
      <div class="logo"></div>
      <img src="${CT_NICE_UG_LOGO}" alt="NICE-UG" class="nice-ug-logo topbar-nice-logo">
      <div style="flex:1;min-width:0;">
        <div class="topbar-title">${title}</div>
        <div class="topbar-sub">${sub}</div>
      </div>
      ${geoChip}
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
// ROUTER — exact paths plus :param patterns (e.g. #/place/:geoId).
// ---------------------------------------------------------------------------
const CT_ROUTES = {};
const CT_ROUTE_PATTERNS = [];
function ctRoute(path, fn){
  if (path.indexOf(':') !== -1){
    const parts = path.split('/');
    CT_ROUTE_PATTERNS.push({ parts: parts, fn: fn });
  } else {
    CT_ROUTES[path] = fn;
  }
}
// Returns { fn, params } for a hash path (query string already stripped), or null.
function ctMatchRoute(path){
  if (CT_ROUTES[path]) return { fn: CT_ROUTES[path], params: {} };
  const segs = path.split('/');
  for (const pat of CT_ROUTE_PATTERNS){
    if (pat.parts.length !== segs.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < pat.parts.length; i++){
      const pp = pat.parts[i];
      if (pp.charAt(0) === ':'){ params[pp.slice(1)] = decodeURIComponent(segs[i]); }
      else if (pp !== segs[i]){ ok = false; break; }
    }
    if (ok) return { fn: pat.fn, params: params };
  }
  return null;
}

function ctGetQuery(){
  const h = location.hash;
  const q = h.indexOf('?');
  const out = {};
  if (q !== -1){
    h.slice(q + 1).split('&').forEach(kv => {
      const pair = kv.split('=');
      if (pair[0]) out[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    });
  }
  return out;
}

function ctRender(){
  const app = document.getElementById('app');
  const session = ctGetSession();
  let path = (location.hash || '#/login').split('?')[0];

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
  // Signed-in but no geography chosen yet → geography picker is mandatory
  // before any role screen (it is what scopes the session's data).
  if (session && !session.geoId && path !== '#/geography'){
    location.hash = '#/geography';
    return;
  }
  const roleInPath = Object.keys(CT_ROLES).find(r => path.startsWith('#/' + r + '/'));
  if (roleInPath && session && roleInPath !== session.role){
    if (!path.includes('/project')) { location.hash = CT_ROLES[session.role].home; return; }
  }

  const match = ctMatchRoute(path) || ctMatchRoute(session ? CT_ROLES[session.role].home : '#/login');
  app.innerHTML = match.fn(session, match.params);
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', ctRender);
window.addEventListener('DOMContentLoaded', () => { if (!location.hash) location.hash = '#/login'; ctRender(); });
