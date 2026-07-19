/* ============================================================================
   CIVICTRACK VIEWS
   Each function returns an HTML string for the #app mount point.
   Registered against the router in app.js via ctRoute(path, fn).

   All views read the session geography (one of the canonical geoIds in
   CT_DATA.geo) and pull every dimension through that ONE key via the
   ctProgrammeOf / ctRepresentationOf / ctQoLOf / ctMobilizationOf accessors.
   A dimension recorded as { notAvailable: true } renders as a
   DEMO-watermarked panel — the view always opens, never breaks.
   ========================================================================= */

const D = CT_DATA; // shorthand
const CT_GEO_IDS = ["UG-KYG", "UG-JJD", "UG-JJC"]; // district order for prev/next

// LC5 project list uses a prefix per district so one flat list can span
// districts (used by prev/next navigation on project detail screens).
const CT_GEO_PREFIX = { "UG-KYG": "kyg-", "UG-JJD": "jd-", "UG-JJC": "jc-" };
const CT_PREFIX_GEO = { "kyg-": "UG-KYG", "jd-": "UG-JJD", "jc-": "UG-JJC" };
const CT_LC5_PROJECTS = CT_GEO_IDS.flatMap(g =>
  ctProgrammeOf(g).projects.map(p => ({ id: CT_GEO_PREFIX[g] + p.id, name: p.name }))
);

const CT_ROLE_DESC = {
  mp:  "Constituency-level oversight & advocacy",
  lc5: "District-level performance & comparison",
  lc3: "Sub-county contractor & service monitoring",
  lc2: "Parish-level project oversight & mobilization",
  lc1: "Village-level field reporting"
};

// ---------------------------------------------------------------------------
// SESSION CONTEXT HELPERS
// ---------------------------------------------------------------------------
function ctSess(){ return ctGetSession() || {}; }
function ctSessDistrict(){ return ctProgrammeOf(ctSess().geoId); }
function ctSessGeo(){ return ctGeoDistrict(ctSess().geoId); }
// Projects physically located in a sub-area (matched by the shared subCountyId
// key first, then by the location text as a fallback for rows whose sub-county
// was not itemized in the reviewed report).
function ctProjectsInSubArea(geoId, subCountyId){
  const dist = ctProgrammeOf(geoId);
  if (!dist) return [];
  const sub = (ctGeoDistrict(geoId).subCounties || []).find(x => x.id === subCountyId);
  return dist.projects.filter(p => {
    if (p.subCountyId && p.subCountyId === subCountyId) return true;
    if (!p.subCountyId && sub){
      const base = sub.name.toLowerCase().replace(/\s*(sub-county|division|town council)\s*/g, '').trim();
      return base.length > 2 && (p.location || '').toLowerCase().indexOf(base) !== -1;
    }
    return false;
  });
}
// Leaders for a district + all of its constituencies, flattened for the
// directory. Each entry carries the geoId it was found under — proof the
// representation dimension hangs off the shared key.
function ctLeadersForDistrict(geoId){
  const dist = ctGeoDistrict(geoId);
  const out = [];
  const distRep = ctRepresentationOf(dist.id);
  (distRep ? distRep.leaders : []).forEach(l => out.push(Object.assign({}, l, { geoId: dist.id, geoName: dist.name })));
  dist.constituencies.forEach(cid => {
    const rep = ctRepresentationOf(cid);
    (rep ? rep.leaders : []).forEach(l => out.push(Object.assign({}, l, { geoId: cid, geoName: ctGeoName(cid) })));
  });
  return out;
}

// ---------------------------------------------------------------------------
// PROGRAMME BREAKDOWN MODAL (brief item 4) — opened from the compare-cards
// and from any programme tile. Shows the district's full NDP IV Programme
// breakdown plus the availability of the other three dimensions for the SAME
// geoId — the join made visible.
// ---------------------------------------------------------------------------
function ctProgrammeBreakdownModal(geoId, focusName){
  const distId = ctDistrictIdOf(geoId);
  const dist = ctProgrammeOf(distId);
  const geo = ctGeoDistrict(distId);
  if (!dist){ ctDemoModal('Programme breakdown', 'No programme data for this geography in the reviewed documents.'); return; }

  const qol = ctQoLOf(distId), mob = ctMobilizationOf(distId), rep = ctRepresentationOf(distId);
  const dimStrip = `
    <div class="dim-strip">
      <span class="dim-chip verified">✓ Representation (${ctLeadersForDistrict(distId).length} office-holders)</span>
      ${qol && !qol.notAvailable ? '<span class="dim-chip verified">✓ Quality of life (NPHC 2024)</span>' : '<span class="dim-chip demo">DEMO — quality of life</span>'}
      ${mob && ((mob.voters && !mob.voters.notAvailable) || (mob.pdm && !mob.pdm.notAvailable)) ? '<span class="dim-chip verified">✓ Mobilization</span>' : '<span class="dim-chip demo">DEMO — mobilization</span>'}
      <span class="dim-chip verified">✓ NDP IV Programmes</span>
    </div>
    <div style="font-size:10.5px;color:var(--ct-text-muted);margin:6px 0 12px;">All four dimensions retrieved through the one geography key <strong>${distId}</strong>.</div>`;

  let body = '';
  if (dist.dataKind === 'budget'){
    body += `<div class="card" style="background:var(--ct-panel-grey);border-style:dashed;margin:0 0 12px;box-shadow:none;">
      <div style="font-size:11.5px;color:#4A4943;"><strong>Note:</strong> ${dist.documentType} — so this breakdown shows funded amounts, not % released.</div></div>`;
    body += `<div class="card" style="margin:0 0 12px;box-shadow:none;padding:0;">
      <div class="row"><div class="row-title">Approved budget FY2025/26</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(dist.budget.current)}</div></div>
      <div class="row"><div class="row-title">Prior year</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(dist.budget.prior)}</div></div>
      </div>`;
    body += '<div class="card-title" style="margin-top:4px;">Funded projects, FY2025/26</div>';
    body += '<div class="card" style="margin:0 0 12px;box-shadow:none;padding:0;">' + dist.projects.map(p => `
      <div class="row"><div><div class="row-title">${p.name}</div><div class="row-sub">${p.sector} · ${p.location}</div><br><span class="office-chip">${ctOfficeOf(p)}</span></div>
      <div class="row-sub" style="text-align:right;font-weight:600;">${ctFormatUGX(p.amount)}</div></div>`).join('') + '</div>';
    body += '<div class="card-title">Health facility budgets</div>';
    body += '<div class="card" style="margin:0;box-shadow:none;padding:0;">' + dist.healthFacilityBudgets.map(h => `
      <div class="row"><div class="row-title">${h.name}</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(h.government)} gov’t + ${ctFormatUGX(h.resultsBased)} RBF</div></div>`).join('') + '</div>';
  } else {
    body += `<div class="card" style="margin:0 0 12px;box-shadow:none;padding:0;">
      ${dist.budget.revised ? `<div class="row"><div class="row-title">Approved budget (revised)</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(dist.budget.revised)}</div></div>` : ''}
      <div class="row"><div class="row-title">Approved budget</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(dist.budget.approved)}</div></div>
      <div class="row"><div class="row-title">Receipts</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(dist.budget.receipts)} (${dist.budget.receiptsPct}%)</div></div>
      <div class="row"><div class="row-title">Expenditure</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(dist.budget.expenditure)} (${dist.budget.expenditurePct}%)</div></div>
      <div class="row"><div class="row-title">Reporting quarter</div><div class="row-sub" style="text-align:right;">${dist.quarter} · pace target ${dist.paceTarget}%</div></div>
      </div>`;
    body += '<div class="card-title">NDP IV Programme breakdown</div>';
    body += '<div class="card" style="margin:0 0 12px;box-shadow:none;padding:0;">' + dist.programmes.map(p => {
      const pct = p.pctOfRevised != null ? p.pctOfRevised : p.pct;
      const cls = pct >= dist.paceTarget ? 'good' : (pct < 20 ? 'danger' : 'amber');
      const focused = focusName === p.name ? ' style="background:var(--ct-yellow-soft);border-radius:8px;"' : '';
      return `<div class="row"${focused}><div class="row-title" style="max-width:62%;">${p.name}</div>
        <div class="row-sub" style="text-align:right;"><span class="subvalue ${cls}" style="font-weight:700;">${pct}%</span> of ${ctFormatUGX(p.revisedApproved || p.approved)}</div></div>`;
    }).join('') + '</div>';
    const projs = focusName ? dist.projects.filter(p => p.programme === focusName) : dist.projects;
    if (focusName){
      body += `<div class="card-title">Projects under “${focusName}”</div>`;
      body += projs.length
        ? '<div class="card" style="margin:0;box-shadow:none;padding:0;">' + projs.map(p =>
            `<div class="row"><div><div class="row-title">${p.name}</div><div class="row-sub">${p.sector || ''} · ${p.location || ''}</div><br><span class="office-chip">${ctOfficeOf(p)}</span></div>${ctStatusPill(p.stageStatus)}</div>`).join('') + '</div>'
        : '<div style="font-size:12px;color:var(--ct-text-muted);">No discrete projects itemized under this Programme in the reviewed report.</div>';
    }
  }

  // Flagship initiatives housed under these Programmes (PDM, Emyooga, UWEP/YLP)
  const flags = ctFlagshipsOf(distId);
  if (flags.length){
    body += '<div class="card-title" style="margin-top:14px;">Flagship initiatives under these Programmes</div>';
    body += '<div class="card" style="margin:0;box-shadow:none;padding:0;">' + flags.map(f => `
      <div class="row" style="cursor:pointer;" onclick="ctFlagshipModal('${distId}','${f.id}')">
        <div><div class="row-title">${f.name}</div>
        <div class="row-sub">${f.status === 'reported' ? f.summary : (f.status === 'issue' ? '⚠ ' + f.summary : 'DEMO — no geo-level figures in reviewed documents')}</div></div>
        <span class="chevron">›</span></div>`).join('') + '</div>';
  }

  // Leader actions wherever challenges are visible in this breakdown
  const belowPaceN = dist.dataKind === 'performance'
    ? dist.programmes.filter(p => (p.pctOfRevised != null ? p.pctOfRevised : p.pct) < dist.paceTarget - 15).length : 0;
  const stalledN = dist.projects.filter(p => p.stageStatus === 'stalled').length;
  const issueFlags = flags.filter(f => f.status === 'issue' || f.status === 'notAvailable').length;
  if (belowPaceN || stalledN || issueFlags){
    body += ctLeaderActions([
      { icon: '📞', label: 'Contact LC1 chairman on the ground' },
      { icon: '📄', label: 'Request CAO explanation' },
      { icon: '⚡', label: 'Escalate to OPM' },
      { icon: '🏛️', label: 'Table before council' }
    ], { title: `Challenges flagged here (${belowPaceN} programme(s) behind pace · ${stalledN} stalled project(s)) — options to consider` });
  }

  body += `<a href="#/place/${distId}" onclick="ctCloseModal();" style="display:inline-block;margin-top:14px;font-size:12.5px;font-weight:600;color:var(--ct-black);">Open full place profile (all four dimensions) →</a>`;

  ctOpenModal(`
    <h3>Programme breakdown — ${geo.name}</h3>
    <div style="font-size:11.5px;color:var(--ct-text-secondary);margin-bottom:10px;">${dist.dataKind === 'budget' ? dist.documentType : 'LG Performance Report, ' + dist.quarter + ' · signed ' + dist.reportSigned + ' · Accounting Officer ' + dist.accountingOfficer}</div>
    ${dimStrip}
    ${body}
    <div class="footer-note" style="margin-top:14px;text-align:left;font-style:normal;">Source: ${dist.dataKind === 'budget' ? 'Jinja City Approved Budget Estimates, FY2025/26.' : geo.name + ' LG Performance Report (' + dist.quarter + '), Section A2.'}</div>
  `, { wide: true });
}

// ---------------------------------------------------------------------------
// LEADER ACTIONS — options to consider wherever a challenge surfaces
// (procurement delays, below-pace programmes, non-released grants, missing
// data). Rendered consistently across all indicators; every action is
// simulated and confirms with a Demo Mode toast — nothing is actually sent.
// ---------------------------------------------------------------------------
function ctLeaderActions(actions, opts){
  opts = opts || {};
  return `
    <div class="actions-block"${opts.flush ? ' style="margin-top:12px;"' : ''}>
      <div class="actions-title">${opts.title || 'Options to consider'}</div>
      <div class="action-chip-row">
        ${actions.map(a => `<button class="action-chip" onclick="ctDemoModeToast('${a.toast || a.label}')">${a.icon ? `<span class="action-icon">${a.icon}</span>` : ''}${a.label}</button>`).join('')}
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// FLAGSHIP MODAL — PDM, Emyooga, UWEP/YLP, housed under the NDP IV
// Programmes. Shows national context, geo-level progress BEYOND cash
// (institutional reach, facilitation, non-cash activities — gaps marked
// honestly), and leader actions where there are challenges.
// ---------------------------------------------------------------------------
function ctFlagshipModal(geoId, fid){
  const distId = ctDistrictIdOf(geoId);
  const f = ctFlagship(distId, fid);
  const g = ctGeoDistrict(distId);
  if (!f){ ctDemoModal('Flagship initiative', 'No flagship record for this geography in the reviewed documents.'); return; }

  let nationalCard = '';
  if (f.national){
    const n = f.national;
    nationalCard = `<div class="card" style="margin:0 0 12px;box-shadow:none;padding:0;">
      ${n.capitalization ? `<div class="row"><div class="row-title">National capitalization</div><div class="row-sub" style="text-align:right;">${n.capitalization}</div></div>` : ''}
      ${n.saccos ? `<div class="row"><div class="row-title">National footprint</div><div class="row-sub" style="text-align:right;">${n.saccos}</div></div>` : ''}
      ${n.launched ? `<div class="row"><div class="row-title">Launched</div><div class="row-sub" style="text-align:right;">${n.launched}</div></div>` : ''}
      ${n.admin ? `<div class="row"><div class="row-title">Administered by</div><div class="row-sub" style="text-align:right;max-width:58%;">${n.admin}</div></div>` : ''}
      ${n.categories ? `<div class="row"><div class="row-title">Coverage</div><div class="row-sub" style="text-align:right;max-width:58%;">${n.categories}</div></div>` : ''}
      ${n.seed ? `<div class="row"><div class="row-title">Seed capital</div><div class="row-sub" style="text-align:right;max-width:58%;">${n.seed}</div></div>` : ''}
      ${n.goal ? `<div class="row"><div class="row-title">Stated goal</div><div class="row-sub" style="text-align:right;max-width:58%;">${n.goal}</div></div>` : ''}
      <div style="font-size:10px;color:var(--ct-text-muted);padding-top:6px;">National context — source: ${n.source}.</div>
    </div>`;
  }

  let progressHtml = '';
  if (f.status === 'reported' && f.progress){
    progressHtml = `<div class="card-title">Progress in ${g.name} — beyond disbursements</div>
      <div class="card" style="margin:0 0 12px;box-shadow:none;padding:0;">
        ${f.progress.map(p => `
          <div class="row">
            <div class="row-title" style="max-width:62%;">${p.label}${p.kind === 'noncash' ? ' <span class="kind-chip">non-cash</span>' : ''}</div>
            <div class="row-sub" style="text-align:right;${p.gap ? 'color:var(--ct-text-muted);' : 'font-weight:600;'}">${p.gap ? 'DEMO — ' : ''}${p.value}</div>
          </div>`).join('')}
        ${f.note ? `<div style="font-size:10.5px;color:var(--ct-text-muted);padding-top:8px;">${f.note}</div>` : ''}
      </div>`;
  } else if (f.status === 'issue' && f.progress){
    progressHtml = `<div class="card-title">Status in ${g.name} — challenge flagged</div>
      <div class="card" style="margin:0 0 12px;box-shadow:none;padding:0;">
        ${f.progress.map(p => `<div class="row"><div class="row-title" style="max-width:62%;">${p.label}</div><div class="row-sub" style="text-align:right;color:var(--ct-red);font-weight:600;">${p.value}</div></div>`).join('')}
      </div>`;
  } else {
    progressHtml = `<div class="card demo-watermark-host" style="margin:0 0 12px;box-shadow:none;">
        ${ctDemoWatermark()}
        <div class="card-title">Progress in ${g.name} ${ctDimChip(false)}</div>
        <p style="font-size:12px;color:var(--ct-text-secondary);line-height:1.55;">${f.note || 'No geo-level figures for this initiative in the reviewed documents.'}</p>
      </div>`;
  }

  const actionsByStatus = {
    reported: [
      { icon: '📞', label: 'Contact district focal point person' },
      { icon: '📄', label: 'Request parish-level detail report' },
      { icon: '🏛️', label: 'Table progress before council' }
    ],
    issue: [
      { icon: '📞', label: 'Contact district focal point person' },
      { icon: '📨', label: 'Raise with responsible Ministry' },
      { icon: '⚡', label: 'Escalate to OPM' },
      { icon: '📄', label: 'Request CAO explanation' }
    ],
    notAvailable: [
      { icon: '📄', label: 'Request data from focal point person' },
      { icon: '📞', label: 'Contact district planner' }
    ]
  };

  ctOpenModal(`
    <h3>${f.name}</h3>
    <div style="font-size:11.5px;color:var(--ct-text-secondary);margin-bottom:10px;">${f.kind} · housed under NDP IV Programmes · geography key <strong>${distId}</strong></div>
    ${nationalCard}
    ${progressHtml}
    ${ctLeaderActions(actionsByStatus[f.status] || actionsByStatus.notAvailable, { title: 'Options to consider — ' + g.shortName })}
    <div class="footer-note" style="margin-top:14px;text-align:left;font-style:normal;">${f.source ? 'Source: ' + f.source + '.' : 'Geo-level figures not in the reviewed documents; national context as cited.'}</div>
  `, { wide: true });
}

// PDM modal is now the PDM flagship view (housed under Programmes).
function ctPDMModal(geoId){ ctFlagshipModal(geoId, 'pdm'); }

// ---------------------------------------------------------------------------
// PERSON MODAL — directory entries. window._ctDirLeaders is rebuilt every
// time the directory (or a leaders panel) renders.
// ---------------------------------------------------------------------------
function ctPersonModal(idx){
  const l = (window._ctDirLeaders || [])[idx];
  if (!l){ ctDemoModal('Leadership record'); return; }
  ctInfoModal(l.name, `
    <div class="card" style="margin:0;box-shadow:none;padding:0;">
      <div class="row"><div class="row-title">Office</div><div class="row-sub" style="text-align:right;">${l.office}</div></div>
      <div class="row"><div class="row-title">Party</div><div class="row-sub" style="text-align:right;">${l.party}</div></div>
      <div class="row"><div class="row-title">Area</div><div class="row-sub" style="text-align:right;">${l.geoName}</div></div>
      <div class="row"><div class="row-title">Elected</div><div class="row-sub" style="text-align:right;max-width:60%;">${l.elected}</div></div>
      <div class="row"><div class="row-title">Geography key</div><div class="row-sub" style="text-align:right;"><code style="font-size:11px;">${l.geoId}</code></div></div>
    </div>
    <div class="verify-note" style="margin-top:12px;"><strong>Verification:</strong> ${l.verified}. CivicTrack verifies office-holders against the Electoral Commission's elected office-holder roll and Parliament's membership records — NICE-UG does not issue credentials independently.</div>
    <a href="#/place/${ctDistrictIdOf(l.geoId)}" onclick="ctCloseModal();" style="display:inline-block;margin-top:12px;font-size:12.5px;font-weight:600;color:var(--ct-black);">View place profile →</a>`,
    'Source: Parliament of Uganda, 11th Parliament (2021–2026) membership records.');
}

// ---------------------------------------------------------------------------
// RECOMMENDATIONS PANEL (brief item 2) — rule-based, derived only from the
// reviewed data for the session's geoId. Every recommendation is clickable
// and resolves to a real view, modal, or DEMO-labeled placeholder.
// ---------------------------------------------------------------------------
function ctRecommendations(geoId, roleKey){
  const distId = ctDistrictIdOf(geoId);
  const dist = ctProgrammeOf(distId);
  const mob = ctMobilizationOf(distId), qol = ctQoLOf(distId);
  const recs = [];

  if (dist && dist.programmes){
    dist.programmes
      .filter(p => (p.pctOfRevised != null ? p.pctOfRevised : p.pct) < (dist.paceTarget - 15))
      .sort((a, b) => (a.pctOfRevised != null ? a.pctOfRevised : a.pct) - (b.pctOfRevised != null ? b.pctOfRevised : b.pct))
      .slice(0, 2)
      .forEach(p => {
        const pct = p.pctOfRevised != null ? p.pctOfRevised : p.pct;
        recs.push({
          icon: '⚠️',
          text: `<strong>${p.name}</strong> is at ${pct}% against the ${dist.paceTarget}% pace target for ${dist.quarter}.`,
          action: `ctProgrammeBreakdownModal('${distId}','${p.name}')`,
          cta: 'Open breakdown →'
        });
      });
    dist.projects.filter(p => p.stageStatus === 'stalled').slice(0, 1).forEach(p => {
      const href = roleKey === 'lc5'
        ? `#/lc5/project/${CT_GEO_PREFIX[distId]}${p.id}`
        : (roleKey === 'mp' ? `#/mp/project/${p.id}` : null);
      recs.push({
        icon: '🛑',
        text: `<strong>${p.name}</strong> is stalled — “${p.statusQuote}”.`,
        action: href ? `ctCloseModal();location.hash='${href}'` : `ctProgrammeBreakdownModal('${distId}','${p.programme || ''}')`,
        cta: href ? 'Open project →' : 'Open breakdown →'
      });
    });
    if (dist.localRevenuePct != null && dist.localRevenuePct < 50 && (roleKey === 'lc5' || roleKey === 'mp')){
      recs.push({
        icon: '📉',
        text: `Local revenue performance is <strong>${dist.localRevenuePct}%</strong> — reported cause: ${dist.localRevenueCause}.`,
        action: `ctInfoModal('Local revenue — ${dist.name}', '<p style=&quot;font-size:12.5px;line-height:1.55;&quot;>Local revenue performed at <strong>${dist.localRevenuePct}%</strong> in ${dist.quarter}. The district attributes this to: <em>${dist.localRevenueCause}</em>.</p>', 'Source: ${dist.name} LG Performance Report, ${dist.quarter}.')`,
        cta: 'View detail →'
      });
    }
  }
  // Flagship initiatives with a flagged challenge (e.g. UWEP/YLP non-release)
  ctFlagshipsOf(distId).filter(f => f.status === 'issue').forEach(f => {
    recs.push({
      icon: '🚩',
      text: `<strong>${f.name}</strong>: ${f.summary} — named in the district's own report.`,
      action: `ctFlagshipModal('${distId}','${f.id}')`,
      cta: 'Open initiative →'
    });
  });
  if (qol && qol.notAvailable){
    recs.push({
      icon: '📊',
      text: `Quality-of-life indicators (NPHC 2024) are <strong>not yet available</strong> for ${ctGeoDistrict(distId).name} in this prototype.`,
      action: `ctDemoModal('Quality of life — data request', '${qol.note} In production this panel would draw from the UBOS NPHC 2024 district profile.')`,
      cta: 'Request data feed →'
    });
  }
  if (mob && mob.pdm && mob.pdm.notAvailable){
    recs.push({
      icon: '🏘️',
      text: `PDM mobilization figures for ${ctGeoDistrict(distId).name} are <strong>not in the reviewed reports</strong>.`,
      action: `ctPDMModal('${distId}')`,
      cta: 'View status →'
    });
  }

  if (!recs.length) return '';
  return `
    <div class="card rec-panel">
      <div class="card-title">Recommended actions</div>
      ${recs.slice(0, 4).map(r => `
        <div class="rec-row" onclick="${r.action}">
          <span class="rec-icon">${r.icon}</span>
          <span class="rec-text">${r.text}</span>
          <span class="rec-cta">${r.cta}</span>
        </div>`).join('')}
      <div style="font-size:10px;color:var(--ct-text-muted);margin-top:8px;">Generated by rule from the reviewed figures for geography key ${distId} — not AI, not advice.</div>
    </div>`;
}

// A reusable lower-level panel: opens normally, always, with the DEMO
// watermark when the reviewed documents have no data for that level (brief
// item 3).
function ctDemoLevelPanel(title, note){
  return `
    <div class="card demo-watermark-host">
      ${ctDemoWatermark()}
      <div class="card-title">${title}</div>
      <p style="font-size:12.5px;color:var(--ct-text-secondary);line-height:1.55;">${note}</p>
    </div>`;
}

// ---------------------------------------------------------------------------
// LOGIN — a natural sign-in screen. This demo accepts ANY input (including a
// blank submission) — there is no real credential validation. After sign-in
// the user picks a demo account (MP or LC) on #/accounts.
// ---------------------------------------------------------------------------
ctRoute('#/login', function(){
  return `
    <div class="login-wrap">
      <div class="login-card card">
        <div class="login-logo-row">${ctBrandLogos('lg')}</div>
        <h1>Sign in to CivicTrack</h1>
        <p>NDP IV Planning &amp; Intelligence Platform</p>

        <div class="login-field-label">Official phone number or Staff ID</div>
        <input class="login-field" id="ctSigninId" type="text" placeholder="e.g. 07XX XXX XXX or LC5-KYG-014" autocomplete="off">

        <div class="login-field-label">Password</div>
        <input class="login-field" id="ctSigninPw" type="password" placeholder="••••••••••" onkeydown="if(event.key==='Enter')ctCompleteSignin()">

        <button class="btn btn-black btn-large" onclick="ctCompleteSignin()">Sign in</button>
        <button class="btn" onclick="ctDemoModal('Sign in with OTP', 'The OTP flow is not part of this demo. The main Sign in button above accepts any credentials — including none — and proceeds to picking a demo account.')">Sign in with OTP instead</button>

        <div class="verify-note">
          <strong>Demo mode:</strong> this prototype accepts <strong>any</strong> phone number / Staff ID and password — or neither — and proceeds. In production, identity would be verified against the Electoral Commission's elected office-holder roll and the Ministry of Local Government's LC1–LC5 structure records. NICE-UG does not issue credentials independently.
        </div>
        <div class="help-link">New here? <a href="#" onclick="ctToast('Field support officer contact — demo only.');return false;">Contact your sub-region field support officer →</a></div>
      </div>
    </div>`;
});

function ctCompleteSignin(){
  ctCreateSession();
  ctToast('Signed in (demo — no credentials validated).');
  location.hash = '#/accounts';
}

// ---------------------------------------------------------------------------
// DEMO ACCOUNT PICKER — after sign-in, pick who to explore as (MP or LC).
// Each persona carries the role + full geography picks. MP and LC5 personas
// are verified office-holders from the representation dimension; LC3/LC2/LC1
// cards show the office and area only, because office-holder names for those
// levels are not in the reviewed records (no invented names).
// ---------------------------------------------------------------------------
function ctBuildPersonas(){
  // Exactly 10 fixed, curated personas — one rural + one urban at each of the
  // 5 role tiers. Real verified records wherever they exist; the two rural
  // LC2/LC1 tiers are honest DEMO entries because Kayunga parish/village names
  // are not in the reviewed records (no invented names, ever).
  const P = (urban, name, office, area, session, verified) => ({ urban, name, office, area, session, verified });
  return {
    mp: [
      P(false, 'Charles Tebandeke', 'MP — Bbaale County', 'Kayunga District · NUP',
        { role: 'mp', geoId: 'UG-KYG', constituencyId: 'UG-KYG-BBA', label: 'Hon. Charles Tebandeke' }, true),
      P(true, 'Isabirye David Iga', 'MP — Jinja North', 'Jinja City · FDC',
        { role: 'mp', geoId: 'UG-JJC', constituencyId: 'UG-JJC-JN', label: 'Hon. Isabirye David Iga' }, true)
    ],
    lc5: [
      P(false, 'Andrew Muwonge', 'LC5 Chairperson', 'Kayunga District · NRM',
        { role: 'lc5', geoId: 'UG-KYG', label: 'Andrew Muwonge' }, true),
      P(true, 'Peter Kasolo Okocha', 'City Mayor', 'Jinja City · NUP',
        { role: 'lc5', geoId: 'UG-JJC', label: 'Peter Kasolo Okocha' }, true)
    ],
    lc3: [
      P(false, 'Bbaale Sub-county', 'LC3 Chairperson', 'Kayunga District · 3 stalled projects itemized in reviewed reports',
        { role: 'lc3', geoId: 'UG-KYG', subCountyId: 'UG-KYG-SC-BBAALE', label: 'LC3 Chairperson, Bbaale Sub-county' }, false),
      P(true, 'Mpumudde Division', 'LC3 Chairperson', 'Jinja City · maternity-roof renovation funded FY2025/26',
        { role: 'lc3', geoId: 'UG-JJC', subCountyId: 'UG-JJC-DV-MPUMUDDE', label: 'LC3 Chairperson, Mpumudde Division' }, false)
    ],
    lc2: [
      P(false, 'A parish in Kayunga', 'LC2 Chairperson', 'Parish names not itemized in reviewed Kayunga records — DEMO view',
        { role: 'lc2', geoId: 'UG-KYG', label: 'LC2 Chairperson, Kayunga parish (demo)' }, false),
      P(true, 'Jinja North Ward', 'LC2 Chairperson', 'Jinja City · real project data (Namulesa Market)',
        { role: 'lc2', geoId: 'UG-JJC', wardId: 'UG-JJC-W-JN', label: 'LC2 Chairperson, Jinja North Ward' }, false)
    ],
    lc1: [
      P(false, 'A village in Kayunga', 'LC1 Chairperson', 'Village names not itemized in reviewed Kayunga records — DEMO view',
        { role: 'lc1', geoId: 'UG-KYG', label: 'LC1 Chairperson, Kayunga village (demo)' }, false),
      P(true, 'Namulesa Cell', 'LC1 Chairperson', 'Jinja North Ward, Jinja City · real project data',
        { role: 'lc1', geoId: 'UG-JJC', cellId: 'UG-JJC-C-NAM', label: 'LC1 Chairperson, Namulesa Cell' }, false)
    ]
  };
}

function ctPersonaPick(i){
  const p = (window._ctPersonas || [])[i];
  if (p) ctLoginAsPersona(p);
}

// Two-step picker steps (position -> area). Re-defined here after the
// 10-persona rationalization.
const CT_ROLE_STEPS = [
  { key: 'mp',  icon: '🏛️', title: 'Member of Parliament', sub: 'Constituency oversight, legislation & national advocacy' },
  { key: 'lc5', icon: '🏢', title: 'LC5 — District / City', sub: 'District chairperson or city mayor — the whole Local Government' },
  { key: 'lc3', icon: '🏘️', title: 'LC3 — Sub-county / Division', sub: 'Sub-county chairperson — projects across several parishes' },
  { key: 'lc2', icon: '🌾', title: 'LC2 — Parish / Ward', sub: 'Parish chief — PDM SACCO level, mobilization & ward projects' },
  { key: 'lc1', icon: '🏠', title: 'LC1 — Village / Cell', sub: 'Village chairperson — eyes and ears on every site' }
];
ctRoute('#/accounts', function(){
  const tiers = ctBuildPersonas();
  const q = ctGetQuery();
  const role = q.role && tiers[q.role] ? q.role : null;

  // STEP 1 — position
  if (!role){
    return `
      <div class="login-wrap" style="max-width:640px;">
        <div class="login-card card" style="padding-bottom:22px;">
          <div class="login-logo-row">${ctBrandLogos('lg')}</div>
          <h1 style="font-size:20px;">Choose a demo account</h1>
          <p>Signed in ✓ (demo — no credentials checked). Step 1 of 2 — pick a position; step 2 offers one rural + one urban account for it (10 curated accounts in total).</p>
        </div>
        ${CT_ROLE_STEPS.map(r => `
          <div class="card role-step-card" onclick="location.hash='#/accounts?role=${r.key}'">
            <div class="role-step-icon">${r.icon}</div>
            <div style="flex:1;">
              <div class="row-title">${r.title}</div>
              <div class="row-sub">${r.sub}</div>
            </div>
            <div style="text-align:right;">
              <div class="dim-chip">${tiers[r.key].length} demo account${tiers[r.key].length > 1 ? 's' : ''}</div>
              <div class="chevron" style="margin-top:6px;">›</div>
            </div>
          </div>`).join('')}
        <p style="text-align:center;font-size:11px;color:var(--ct-text-muted);margin-top:18px;">
          Only these five positions have real, reviewed data behind them in this prototype.
        </p>
      </div>`;
  }

  // STEP 2 — area / account within the chosen position
  const meta = CT_ROLE_STEPS.find(r => r.key === role);
  window._ctPersonas = [];
  const card = (p) => {
    const i = window._ctPersonas.push(p.session) - 1;
    const initials = p.name.split(' ').filter(w => /^[A-Z]/.test(w)).map(w => w[0]).slice(0, 2).join('');
    return `<div class="leader-card card acct-card" onclick="ctPersonaPick(${i})">
      <div class="leader-avatar">${initials}</div>
      <div class="leader-name">${p.name}</div>
      <div class="leader-office">${p.office}</div>
      <div class="leader-meta"><span class="dim-chip ${p.urban ? '' : 'demo'}" style="${p.urban ? '' : ''}">${p.urban ? '🏙️ URBAN' : '🌾 RURAL'}</span> ${p.verified ? '<span class="dim-chip verified">✓ verified</span>' : '<span class="dim-chip demo">DEMO data area</span>'}</div>
      <div class="leader-geo">${p.area}</div>
    </div>`;
  };
  const subs = {
    mp: 'Verified 11th Parliament (2021–2026) office-holders — one rural county, one urban constituency.',
    lc5: 'Verified district chairperson (Kayunga) and the Jinja City mayor.',
    lc3: 'Office shown without a personal name — LC3 office-holder names are not in the reviewed records.',
    lc2: 'The rural parish is an honest DEMO entry — Kayunga parish names are not in the reviewed records.',
    lc1: 'The rural village is an honest DEMO entry — Kayunga village names are not in the reviewed records.'
  };
  return `
    <div class="login-wrap" style="max-width:960px;">
      <div class="login-card card" style="padding-bottom:22px;">
        <div class="login-logo-row">${ctBrandLogos('lg')}</div>
        <h1 style="font-size:20px;">${meta.icon} ${meta.title}</h1>
        <p>Step 2 of 2 — pick the area / account to explore. Every account opens that leader's own geography and data.</p>
        <a href="#/accounts" style="font-size:12.5px;font-weight:600;color:var(--ct-black);text-decoration:none;">← Change position</a>
      </div>
      ${subs[role] ? `<div style="font-size:11px;color:var(--ct-text-muted);margin:14px 4px 8px;">${subs[role]}</div>` : ''}
      <div class="leader-grid">${tiers[role].map(card).join('')}</div>
      <p style="text-align:center;font-size:11px;color:var(--ct-text-muted);margin-top:22px;max-width:560px;margin-left:auto;margin-right:auto;">
        Exactly 10 curated demo accounts — one rural, one urban per position. Additional institutional roles (Ministry, NPA, District Planner, CAO, RDC, Development Partner) are planned once real data feeds for each are confirmed.
      </p>
    </div>`;
});

// ---------------------------------------------------------------------------
// LEADERSHIP DIRECTORY (brief item 6) — browsable, clickable, tied to the
// session geography. Every record carries its verification basis.
// ---------------------------------------------------------------------------
ctRoute('#/directory', function(){
  const s = ctSess();
  const g = ctSessGeo();
  const dist = ctSessDistrict();
  const leaders = ctLeadersForDistrict(s.geoId);
  window._ctDirLeaders = leaders;
  const mps = leaders.filter(l => l.level === 'constituency');
  const districtWide = leaders.filter(l => l.level === 'district');
  const card = (l) => {
    const i = leaders.indexOf(l);
    return `<div class="leader-card card" onclick="ctPersonModal(${i})">
      <div class="leader-avatar">${l.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</div>
      <div class="leader-name">${l.name}</div>
      <div class="leader-office">${l.office}</div>
      <div class="leader-meta"><span class="party-chip">${l.party}</span> <span class="dim-chip verified">✓ verified</span></div>
      <div class="leader-geo">${l.geoName}</div>
    </div>`;
  };

  // -- The oversight & reachability chain: every level, both directions ------
  const chainRoles = [
    { key: 'mp',  label: 'MP', icon: '🏛️', blurb: 'National oversight & advocacy — asks downward, escalates upward to ministries & OPM.' },
    { key: 'lc5', label: 'LC5', icon: '🏢', blurb: 'District delivery — answers to the MP & council, directs the technical wing, asks LC3s.' },
    { key: 'lc3', label: 'LC3', icon: '🏘️', blurb: 'Sub-county follow-up — reports upward, convenes parishes, chases projects on site.' },
    { key: 'lc2', label: 'LC2', icon: '🌾', blurb: 'Parish mobilization — PDM SACCO level, verifies what is actually happening.' },
    { key: 'lc1', label: 'LC1', icon: '🏠', blurb: 'Village eyes & ears — first-hand reports with photo and location.' }
  ];
  const youIdx = chainRoles.findIndex(r => r.key === s.role);
  const chainStrip = `
    <div class="card">
      <div class="card-title">The reachability network — ask down, report up</div>
      <div style="font-size:11px;color:var(--ct-text-muted);margin-bottom:10px;">
        Any NDP IV programme, project or policy question travels this chain in both directions: oversight questions go <strong>down</strong> to where direct oversight lies, ground truth comes <strong>up</strong> with location and photo. Tap a level to see the channel.
      </div>
      <div class="chain-strip">
        ${chainRoles.map((r, i) => `
          <div class="chain-node${i === youIdx ? ' you' : ''}" onclick="ctDemoModal('${r.label} channel', '${r.blurb} In this demo the contact action is simulated — in production it opens a direct message or call with the office-holder, attached to the programme or project in question.')">
            <div class="chain-node-icon">${r.icon}</div>
            <div class="chain-node-label">${r.label}</div>
            ${i === youIdx ? '<div class="chain-you">YOU</div>' : ''}
          </div>
          ${i < chainRoles.length - 1 ? '<div class="chain-link">⇄</div>' : ''}`).join('')}
      </div>
    </div>`;

  // -- Verified office-holders ------------------------------------------------
  const verifiedSection = `
    <div class="card-title" style="margin-top:14px;">Parliament — 11th Parliament (2021–2026)</div>
    <div class="leader-grid">${mps.map(card).join('')}</div>
    <div class="card-title" style="margin-top:16px;">District-wide representation &amp; local government</div>
    <div class="leader-grid">${districtWide.map(card).join('')}</div>`;

  // -- Technical wing (delivery side) — real CAO names where signed ----------
  const techs = (CT_DATA.technocrats[g.id] || []);
  const techSection = `
    <div class="card-title" style="margin-top:18px;">Technical wing — who leaders ask about delivery</div>
    <div class="leader-grid">
      ${techs.map(t => t.verified
        ? `<div class="leader-card card" onclick="ctDemoModal('${t.office}', '${t.basis}. In production this card opens contact and the accounting officer\\'s latest signed report.')">
            <div class="leader-avatar">${t.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</div>
            <div class="leader-name">${t.name}</div>
            <div class="leader-office">${t.office}</div>
            <div class="leader-meta"><span class="dim-chip verified">✓ verified</span></div>
            <div class="leader-geo">${t.basis}</div>
          </div>`
        : `<div class="leader-card card" onclick="ctDemoModal('${t.office}', '${t.basis} Placeholder shown with the DEMO disclaimer — no name is invented.')">
            <div class="leader-avatar acct-avatar-dots">?</div>
            <div class="leader-name">Office-holder not in reviewed records</div>
            <div class="leader-office">${t.office}</div>
            <div class="leader-meta"><span class="dim-chip demo">DEMO placeholder</span></div>
            <div class="leader-geo">${t.basis}</div>
          </div>`).join('')}
      ${['District Engineer — works & infrastructure', 'PDM focal point person — SACCO & disbursements'].map(role =>
        `<div class="leader-card card" onclick="ctDemoModal('${role.split(' — ')[0]}', 'This technical contact is not named in the reviewed documents. Placeholder shown with the DEMO disclaimer — in production it comes from the district staff establishment.')">
          <div class="leader-avatar acct-avatar-dots">?</div>
          <div class="leader-name">Not in reviewed records</div>
          <div class="leader-office">${role}</div>
          <div class="leader-meta"><span class="dim-chip demo">DEMO placeholder</span></div>
          <div class="leader-geo">Reachable for ${g.shortName} delivery questions once the staff register is connected</div>
        </div>`).join('')}
    </div>`;

  // -- Lower levels — real area names, placeholder persons --------------------
  const subAreas = (g.subCounties || []);
  const lc3Rows = subAreas.map(sc => {
    const nProjs = dist ? ctProjectsInSubArea(g.id, sc.id).length : 0;
    return `<div class="row" style="cursor:pointer;" onclick="ctDemoModeToast('Contact LC3 — ${sc.name}')">
      <div><div class="row-title">LC3 Chairperson — ${sc.name}</div>
      <div class="row-sub">${nProjs ? nProjs + ' project(s) itemized in reviewed reports · ' : ''}office-holder name not in reviewed records</div></div>
      <span class="dim-chip demo">DEMO placeholder</span></div>`;
  }).join('');
  const mob = ctMobilizationOf(g.id);
  const parishCount = mob && mob.voters && !mob.voters.notAvailable ? mob.voters.parishes : null;
  const wardCount = (g.wards || []).length;
  const lowerSection = `
    <div class="card-title" style="margin-top:18px;">LC3 — sub-counties &amp; divisions of ${g.shortName} (reachable from MP / LC5)</div>
    <div class="card" style="padding:0;">${lc3Rows || '<div class="row"><div class="row-sub">No sub-counties itemized.</div></div>'}</div>
    <div class="card-title" style="margin-top:18px;">LC2 &amp; LC1 — parishes and villages</div>
    <div class="card">
      <div style="font-size:12px;color:var(--ct-text-secondary);line-height:1.6;">
        ${parishCount != null
          ? `The Electoral Commission counts <strong>${parishCount} parishes</strong> and <strong>${mob.voters.pollingStations} polling stations</strong> in ${g.name} — each parish has an LC2 and each village an LC1 chairperson. Their names are not in the reviewed records, so they appear here as <span class="dim-chip demo">DEMO placeholder</span> offices, not invented people.`
          : wardCount
            ? `${g.name} has <strong>${wardCount} wards</strong> itemized in this demo's records (Jinja City's divisions/wards). Village and parish office-holder names are not in the reviewed records — placeholders, not invented people.`
            : `Parish and village office-holder names for ${g.shortName} are not in the reviewed records — placeholders, not invented people.`}
        When an MP, LC5 or LC3 needs to know what is actually happening with a programme, project or policy, this is where the answer lives: the LC1/LC2 under whose jurisdiction direct oversight lies, reachable with one tap.
      </div>
      <div class="action-chip-row" style="margin-top:10px;">
        <button class="action-chip" onclick="ctDemoModeToast('Contact LC1 chairman')"><span class="action-icon">📞</span>Contact LC1 chairman (demo)</button>
        <button class="action-chip" onclick="ctDemoModeToast('Contact LC2 parish chief')"><span class="action-icon">📞</span>Contact LC2 parish chief (demo)</button>
        <button class="action-chip" onclick="ctDemoModeToast('Ground-truth request broadcast')"><span class="action-icon">📡</span>Request ground-truth report (demo)</button>
      </div>
    </div>`;

  return ctTopbar('Leadership network', g.name + ' · ' + g.region, s.role) + `
    <div class="content">
      ${ctBreadcrumb([{ label: 'Dashboard', href: CT_ROLES[s.role].home }, { label: 'Leadership network' }])}
      <div class="screen-title">Leadership network — ${g.name}</div>
      <div class="screen-sub">Everyone a leader may need to reach about NDP IV delivery — verified office-holders where records exist, clearly-marked placeholders where they don't. Verified against Parliament of Uganda 11th Parliament records and Electoral Commission declarations.</div>
      ${chainStrip}
      ${verifiedSection}
      ${techSection}
      ${lowerSection}
      <div class="card-title" style="margin-top:18px;">Cross-cutting institutions — who leaders plug citizens into</div>
      <div class="card" style="padding:0;">
        ${(window._ctInstitutions = CT_DATA.moneyEconomy.institutions) && CT_DATA.moneyEconomy.institutions.map((t, i) => `
          <div class="row" style="cursor:pointer;" onclick="ctInstitutionModal(${i})">
            <div style="display:flex;gap:10px;align-items:flex-start;"><span style="font-size:18px;">${t.icon}</span>
            <div><div class="row-title" style="font-size:12.5px;">${t.name}</div>
            <div class="row-sub">${t.role}</div></div></div>
            <span class="dim-chip demo">DEMO contact</span></div>`).join('')}
      </div>

      <a href="#/place/${g.id}" style="text-decoration:none;">
        <div class="indicator-card clickable" style="margin-top:16px;">
          <div class="icat">Place profile</div>
          <div class="isub">See representation + quality of life + mobilization + programme data for ${g.name} together, through the same geography key.</div>
          <div class="cta">Open place profile →</div>
        </div>
      </a>
      <div class="footer-note">MP records: Parliament of Uganda 11th Parliament membership, cross-checked with press coverage of the 2021 results. LC5/Mayor records: Electoral Commission declarations. CAO records: signed LG performance reports. Lower-level and technical contacts: placeholders under the DEMO disclaimer until the Electoral Commission LC rolls and district staff registers are connected.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// PLACE PROFILE — #/place/:geoId. The shared-key join rendered as one screen:
// representation + quality of life + mobilization + programmes, all fetched
// through the one geoId. Missing dimensions get the DEMO watermark (brief
// item 3), never a broken join.
// ---------------------------------------------------------------------------
ctRoute('#/place/:geoId', function(session, params){
  const distId = ctDistrictIdOf(params.geoId) || 'UG-KYG';
  const g = CT_DATA.geo[distId];
  const dist = ctProgrammeOf(distId);
  const qol = ctQoLOf(distId), mob = ctMobilizationOf(distId);
  const leaders = ctLeadersForDistrict(distId);
  const navList = CT_GEO_IDS.map(id => ({ id: id, name: CT_DATA.geo[id].name }));

  // Panel 1 — representation
  const repPanel = `
    <div class="card place-panel">
      <div class="card-title">Representation ${ctDimChip(leaders.length > 0)}</div>
      ${leaders.slice(0, 4).map(l => `<div class="row"><div><div class="row-title">${l.name}</div><div class="row-sub">${l.office} · ${l.party}</div></div></div>`).join('')}
      ${leaders.length > 4 ? `<div style="font-size:11px;color:var(--ct-text-muted);padding-top:6px;">+ ${leaders.length - 4} more in the directory</div>` : ''}
      <a href="#/directory" class="cta-link">Open leadership directory →</a>
    </div>`;

  // Panel 2 — quality of life
  let qolPanel;
  if (qol && !qol.notAvailable){
    qolPanel = `
      <div class="card place-panel">
        <div class="card-title">Quality of life ${ctDimChip(true)}</div>
        <div class="row"><div class="row-title">Population (${qol.census})</div><div class="row-sub" style="text-align:right;">${qol.population.toLocaleString()}</div></div>
        <div class="row"><div class="row-title">Male / female</div><div class="row-sub" style="text-align:right;">${qol.male.toLocaleString()} / ${qol.female.toLocaleString()}</div></div>
        <div class="row"><div class="row-title">Households</div><div class="row-sub" style="text-align:right;">${qol.households.toLocaleString()}</div></div>
        ${qol.facilities ? `<div class="row"><div class="row-title">Health facilities / primary schools</div><div class="row-sub" style="text-align:right;">${qol.facilities.health} / ${qol.facilities.primarySchools}</div></div>` : ''}
        <div style="font-size:10px;color:var(--ct-text-muted);padding-top:8px;">Source: ${qol.source}</div>
      </div>`;
  } else {
    qolPanel = `
      <div class="card place-panel demo-watermark-host">
        ${ctDemoWatermark()}
        <div class="card-title">Quality of life ${ctDimChip(false)}</div>
        <p style="font-size:12px;color:var(--ct-text-secondary);line-height:1.55;">${qol ? qol.note : 'No quality-of-life data recorded for this geography.'}</p>
      </div>`;
  }

  // Panel 3 — mobilization (voters + PDM handled independently)
  let mobInner = '';
  if (mob && mob.voters && !mob.voters.notAvailable){
    mobInner += `
      <div class="row"><div class="row-title">Registered voters (EC, 2021)</div><div class="row-sub" style="text-align:right;">${mob.voters.registered.toLocaleString()}</div></div>
      <div class="row"><div class="row-title">Polling stations / parishes</div><div class="row-sub" style="text-align:right;">${mob.voters.pollingStations} / ${mob.voters.parishes}</div></div>
      ${mob.voters.note ? `<div style="font-size:10px;color:var(--ct-text-muted);padding-top:4px;">${mob.voters.note}</div>` : ''}`;
  } else {
    mobInner += `<div class="row"><div class="row-title">Registered voters</div><div class="row-sub" style="text-align:right;color:var(--ct-text-muted);">DEMO — ${mob && mob.voters ? mob.voters.note : 'not available'}</div></div>`;
  }
  if (mob && mob.pdm && !mob.pdm.notAvailable){
    mobInner += `
      <div class="row" style="cursor:pointer;" onclick="ctPDMModal('${distId}')"><div class="row-title">PDM households facilitated</div><div class="row-sub" style="text-align:right;">${mob.pdm.householdsFacilitated.toLocaleString()} ›</div></div>
      <div class="row"><div class="row-title">PDM parishes</div><div class="row-sub" style="text-align:right;">${mob.pdm.parishes}</div></div>`;
  } else {
    mobInner += `<div class="row" style="cursor:pointer;" onclick="ctPDMModal('${distId}')"><div class="row-title">PDM figures</div><div class="row-sub" style="text-align:right;color:var(--ct-text-muted);">DEMO — not in reviewed reports ›</div></div>`;
  }
  const mobPanel = `
    <div class="card place-panel">
      <div class="card-title">Citizen mobilization ${ctDimChip(!!(mob && ((mob.voters && !mob.voters.notAvailable) || (mob.pdm && !mob.pdm.notAvailable))))}</div>
      ${mobInner}
      <div style="font-size:10px;color:var(--ct-text-muted);padding-top:8px;">Source: Electoral Commission voter statistics (2021); district performance reports.</div>
    </div>`;

  // Panel 4 — NDP IV programmes
  let progPanel;
  if (dist && dist.dataKind === 'performance'){
    progPanel = `
      <div class="card place-panel">
        <div class="card-title">NDP IV Programmes ${ctDimChip(true)}</div>
        <div class="row"><div class="row-title">Overall released (${dist.quarter})</div><div class="row-sub" style="text-align:right;">${dist.budget.expenditurePct}% of ${ctFormatUGX(dist.budget.revised || dist.budget.approved)}</div></div>
        <div class="row"><div class="row-title">Programmes tracked</div><div class="row-sub" style="text-align:right;">${dist.programmes.length}</div></div>
        <div class="row"><div class="row-title">Capital projects tracked</div><div class="row-sub" style="text-align:right;">${dist.projects.length} (${dist.projects.filter(p => p.stageStatus === 'stalled').length} stalled)</div></div>
        <a href="#/programmes" class="cta-link">Open in the 4 clusters &amp; 18 programmes →</a>
      </div>`;
  } else if (dist){
    progPanel = `
      <div class="card place-panel">
        <div class="card-title">NDP IV Programmes ${ctDimChip(true)}</div>
        <div class="row"><div class="row-title">Approved budget FY2025/26</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(dist.budget.current)}</div></div>
        <div class="row"><div class="row-title">Funded projects</div><div class="row-sub" style="text-align:right;">${dist.projects.length}</div></div>
        <div style="font-size:10.5px;color:var(--ct-text-muted);padding-top:4px;">${dist.documentType}</div>
        <a href="#/programmes" class="cta-link">Open in the 4 clusters &amp; 18 programmes →</a>
      </div>`;
  } else {
    progPanel = `<div class="card place-panel demo-watermark-host">${ctDemoWatermark()}<div class="card-title">NDP IV Programmes ${ctDimChip(false)}</div><p style="font-size:12px;color:var(--ct-text-secondary);">No programme data recorded for this geography.</p></div>`;
  }

  return ctTopbar('Place profile — ' + g.name, 'Geography key ' + g.id + ' · ' + g.region, session.role) + `
    <div class="content">
      ${ctBreadcrumb([{ label: 'Dashboard', href: CT_ROLES[session.role].home }, { label: 'Place profile' }, { label: g.name }])}
      ${ctPrevNextNav(navList, distId, '#/place/')}
      <div class="screen-title">${g.name}</div>
      <div class="screen-sub">One geography key — <code>${g.id}</code> — four dimensions joined: representation, quality of life, mobilization, NDP IV programmes.</div>
      <div class="place-grid">
        ${repPanel}
        ${qolPanel}
        ${mobPanel}
        ${progPanel}
      </div>
      <div class="footer-note">Every panel above was fetched through the same geography id (${g.id}). Panels without reviewed data carry the DEMO watermark instead of being silently omitted.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// MP — context + DASHBOARD (scoped by the session constituency, brief item 5)
// ---------------------------------------------------------------------------
function ctMpCtx(){
  const s = ctSess();
  const dist = ctSessDistrict();
  const consId = s.constituencyId;
  const consName = consId ? ctGeoName(consId) : ctSessGeo().name;
  const rep = consId ? ctRepresentationOf(consId) : null;
  const mp = rep && rep.leaders[0];
  return { s, dist, consId, consName, mp };
}
function ctMpTitle(ctx){
  return ctx.mp ? `Hon. ${ctx.mp.name} — ${ctx.consName}` : `Hon. [MP] — ${ctx.consName}`;
}

ctRoute('#/mp/dashboard', function(){
  const ctx = ctMpCtx();
  const dist = ctx.dist;
  const g = ctSessGeo();
  const stalledMine = dist.projects.filter(p => p.stageStatus === 'stalled' && (!ctx.consId || p.constituencyId === ctx.consId)).length;
  const stalledAll = dist.projects.filter(p => p.stageStatus === 'stalled').length;
  const mob = ctMobilizationOf(g.id);

  // Cluster tiles: the 18 NDP IV programmes compressed into the 4 clusters —
  // the dashboard stays a compass, the full 18 live one tap away at #/programmes.
  const matchProg = (pn) => (dist.programmes || []).find(p => ctNormProg(p.name) === ctNormProg(pn)
    || ctNormProg(CT_DATA.ndp4.aliases[ctNormProg(p.name)] || '') === ctNormProg(pn));
  const tiles = CT_DATA.ndp4.clusters.map(c => {
    if (dist.dataKind === 'performance'){
      const reported = c.programmes.map(pn => matchProg(pn)).filter(Boolean);
      const behind = reported.filter(p => (p.pctOfRevised != null ? p.pctOfRevised : p.pct) < dist.paceTarget);
      const weakest = reported.slice().sort((a, b) => (a.pctOfRevised != null ? a.pctOfRevised : a.pct) - (b.pctOfRevised != null ? b.pctOfRevised : b.pct))[0];
      const wpct = weakest ? (weakest.pctOfRevised != null ? weakest.pctOfRevised : weakest.pct) : null;
      return `<div class="indicator-card clickable" onclick="location.hash='#/programmes?cluster=${c.id}'">
        <div class="icat">${c.icon} ${c.name}</div>
        <div class="ival ${behind.length ? 'amber' : 'good'}" style="font-size:22px;">${behind.length} behind</div>
        <div class="isub">${reported.length} of ${c.programmes.length} programmes reported · weakest: ${weakest ? weakest.name + ' (' + wpct + '%)' : '—'}</div>
        <div class="cta">Open cluster →</div>
      </div>`;
    }
    const mine = dist.projects.filter(p => { const cp = ctCityProg(p); return cp && c.programmes.some(pn => ctNormProg(pn) === ctNormProg(cp)); });
    const sum = mine.reduce((a, p) => a + (p.amount || 0), 0);
    return `<div class="indicator-card clickable" onclick="location.hash='#/programmes?cluster=${c.id}'">
      <div class="icat">${c.icon} ${c.name}</div>
      <div class="ival" style="font-size:22px;">${ctFormatUGX(sum)}</div>
      <div class="isub">${mine.length} funded project${mine.length === 1 ? '' : 's'} in the FY2025/26 budget</div>
      <div class="cta">Open cluster →</div>
    </div>`;
  }).join('');

  return ctTopbar(ctMpTitle(ctx), g.name + ', ' + g.region + (ctx.mp ? ' · verified against Parliament records' : ''), 'mp') + `
    <div class="content">
      <div class="screen-title">Dashboard</div>
      <div class="screen-sub">
        ${dist.dataKind === 'performance'
          ? `NDP IV in ${g.name} (${dist.quarter}, pace target ${dist.paceTarget}%) — the 18 programmes compressed into their 4 clusters; projects are scoped to ${ctx.consName} where the report names the sub-county.`
          : `${g.name}: ${dist.documentType} — funded amounts by cluster, not % released.`}
      </div>

      ${ctCompassPanel('mp')}

      <div class="indicator-grid">
        ${tiles}
        <a href="#/mp/projects" style="text-decoration:none;">
          <div class="indicator-card clickable" style="border-color:#E29A9A;background:var(--ct-red-tint);">
            <div class="icat" style="color:#791F1F;">Projects</div>
            <div class="ival danger">${stalledMine} stalled</div>
            <div class="isub">in ${ctx.consName} · ${stalledAll} stalled of ${dist.projects.length} tracked district-wide</div>
            <div class="cta">View all projects →</div>
          </div>
        </a>
        <a href="#/directory" style="text-decoration:none;">
          <div class="indicator-card clickable">
            <div class="icat">Leadership directory</div>
            <div class="ival" style="font-size:16px;color:var(--ct-text-secondary);">${ctLeadersForDistrict(g.id).length} verified</div>
            <div class="isub">MPs, Woman MP &amp; LC5 for ${g.shortName} — verified office-holders</div>
            <div class="cta">Open directory →</div>
          </div>
        </a>
        <a href="#/place/${g.id}" style="text-decoration:none;">
          <div class="indicator-card clickable">
            <div class="icat">Place profile</div>
            <div class="ival" style="font-size:16px;color:var(--ct-text-secondary);">4 dimensions</div>
            <div class="isub">Representation + quality of life + mobilization + programmes, one key: ${g.id}</div>
            <div class="cta">Open profile →</div>
          </div>
        </a>
      </div>

      ${ctFlagshipParityCard()}
      ${ctGrantStreamCard()}

      ${ctRolePanel('mp')}

      <div class="card">
        <div class="card-title">Collect data from your constituency</div>
        <div style="font-size:11.5px;color:var(--ct-text-secondary);margin-bottom:10px;">Structured monitoring prompts for the NDP IV aspects CivicTrack tracks — file a field report yourself, or ask your LC structures to report upward on any of them.</div>
        <div class="filter-strip" style="margin-bottom:0;">
          ${CT_COLLECT_ASPECTS.map(a => `<a class="filter-chip" href="#/collect?aspect=${a.id}" style="text-decoration:none;">${a.icon} ${a.label}</a>`).join('')}
        </div>
      </div>

      ${ctRecommendations(g.id, 'mp')}
      <div class="footer-note">Sample screen — ${dist.dataKind === 'performance' ? 'every figure sourced from ' + g.name + '\'s own Local Government Performance Report, ' + dist.quarter + ', Section A2' : 'figures sourced from the Jinja City Approved Budget Estimates, FY2025/26'}.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// MP — PROJECTS LIST (working filter chips — previously dead clicks)
// ---------------------------------------------------------------------------
ctRoute('#/mp/projects', function(){
  const ctx = ctMpCtx();
  const dist = ctx.dist;
  const f = (ctGetQuery().f || 'all');
  const match = { all: () => true,
    stalled: p => p.stageStatus === 'stalled',
    pending: p => p.stageStatus === 'pending',
    ontrack: p => ['ontrack', 'complete'].includes(p.stageStatus) }[f] || (() => true);
  const list = dist.projects.filter(match);
  const chip = (key, label) =>
    `<a class="filter-chip${f === key ? ' active' : ''}" href="#/mp/projects?f=${key}" style="text-decoration:none;">${label}</a>`;

  return ctTopbar(ctMpTitle(ctx), 'Projects › ' + ctx.consName, 'mp') + `
    <div class="content">
      ${ctBreadcrumb([{ label: 'Dashboard', href: '#/mp/dashboard' }, { label: 'Projects' }])}
      <div class="screen-title">Projects in my constituency</div>
      <div class="screen-sub">Capital projects tracked in ${ctSessGeo().name}; rows marked “◆ your constituency” are located inside ${ctx.consName} per the reviewed report.</div>
      <div class="filter-strip">
        ${chip('all', `All stages (${dist.projects.length})`)}
        ${chip('stalled', `Stalled (${dist.projects.filter(p => p.stageStatus === 'stalled').length})`)}
        ${chip('pending', `Pending (${dist.projects.filter(p => p.stageStatus === 'pending').length})`)}
        ${chip('ontrack', `On track / Complete (${dist.projects.filter(p => ['ontrack', 'complete'].includes(p.stageStatus)).length})`)}
      </div>
      <div class="card">
        ${list.length ? list.map(p => {
          const mine = ctx.consId && p.constituencyId === ctx.consId;
          return `<a href="#/mp/project/${p.id}" style="text-decoration:none;color:inherit;display:block;">
            <div class="row">
              <div><div class="row-title">${mine ? '◆ ' : ''}${p.name}</div><div class="row-sub">${p.sector || ''}${p.location ? ' · ' + p.location : ''}${mine ? ' · <strong>your constituency</strong>' : ''}</div></div>
              ${ctStatusPill(p.stageStatus)}
            </div>
          </a>`;
        }).join('') : '<div style="padding:14px;font-size:12.5px;color:var(--ct-text-muted);">No projects match this filter.</div>'}
      </div>
      <div class="footer-note">Click any row to open its full detail and oversight screen. Filters are live — they change the list, not just the label.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// MP — PROJECT DETAIL (Bbaale HC IV) — the flagship drill chain
// ---------------------------------------------------------------------------
ctRoute('#/mp/project/bbaale-hc4', function(){
  const ctx = ctMpCtx();
  const proj = ctProgrammeOf('UG-KYG').projects.find(p => p.id === 'bbaale-hc4');
  const related = proj.relatedFacilities.map(id => ctProgrammeOf('UG-KYG').projects.find(p => p.id === id));
  return ctTopbar(ctMpTitle(ctx), 'Projects › ' + proj.name, 'mp') + `
    <div class="content">
      ${ctBreadcrumb([{ label: 'Dashboard', href: '#/mp/dashboard' }, { label: 'Projects', href: '#/mp/projects' }, { label: proj.name }])}
      ${ctPrevNextNav(ctProgrammeOf('UG-KYG').projects, proj.id, '#/mp/project/')}

      <div class="alert-banner">
        <div class="alert-banner-title">Uganda ranks second-worst globally for project delays — World Bank</div>
        <div class="alert-banner-source">Cited by the Secretary to the Treasury, 2026 Public Procurement Cadre Forum</div>
      </div>

      <div class="screen-title">${proj.name}</div>
      <div class="screen-sub">${proj.sector} facility · ${proj.location}, Kayunga District · Constituency: ${ctGeoName(proj.constituencyId)}</div>

      <div class="card" style="background:var(--ct-panel-grey);border-style:dashed;margin-bottom:16px;">
        <div style="font-size:12px;color:#4A4943;">
          <strong>NDP IV Programme ${proj.programmeCode} — ${proj.programme}</strong> · PIAP Output ${proj.piapOutput} — "${proj.piapOutputName}"
        </div>
      </div>

      <div class="stage-tracker">
        <div class="stage-pill done">Idea</div>
        <div class="stage-pill done">Feasibility</div>
        <div class="stage-pill stuck">Procurement</div>
        <div class="stage-pill">Implementation</div>
        <div class="stage-pill">Complete</div>
      </div>
      <div class="stage-caption">District report status: "${proj.statusQuote}"</div>

      <div class="two-col">
        <div>
          ${ctDrillTabs([{ label: 'Overview', id: 'overview' }, { label: 'Timeline', id: 'timeline' }, { label: 'Related Facilities', id: 'related' }])}

          <div class="drill-panel active" data-panel="overview">
            <div class="card">
              <div class="card-title">Timeliness — is this a normal delay?</div>
              <div class="row"><div class="row-title">Typical procurement cycle</div><div class="row-sub" style="text-align:right;">~${D.national.procurementBenchmark.typicalCycleDays} days (PPDA open domestic bidding benchmark)</div></div>
              <div class="row"><div class="row-title">Mandatory standstill before contract signing</div><div class="row-sub" style="text-align:right;">${D.national.procurementBenchmark.standstillDays} working days after best-evaluated-bidder notice</div></div>
              <div class="row"><div class="row-title">Time in this stage so far</div><div class="row-sub" style="text-align:right;color:var(--ct-red);font-weight:600;">180+ days — still open in Q2, no contractor engaged</div></div>
              <div class="row"><div class="row-title">Overshoot vs. typical benchmark</div><div class="row-sub" style="text-align:right;color:var(--ct-red);font-weight:600;">at least 90 days over</div></div>
              <div style="font-size:10.5px;color:var(--ct-text-muted);margin-top:8px;">${D.national.procurementBenchmark.typicalCycleNote}. The standstill period is a hard PPDA Regulation requirement.</div>
            </div>
            <div class="card">
              <div class="card-title">Programme-wide context</div>
              <div class="row"><div class="row-title">Human Capital Development, district-wide</div><div class="row-sub" style="text-align:right;">41% released</div></div>
              <div class="row"><div class="row-title">Water &amp; Sanitation sub-line (same Programme)</div><div class="row-sub" style="text-align:right;">16% released</div></div>
              <div class="row"><div class="row-title">Responsible office</div><div class="row-sub" style="text-align:right;">District Health Office</div></div>
              <div style="font-size:10.5px;color:var(--ct-text-muted);background:var(--ct-bg);border-radius:8px;padding:8px 10px;margin-top:6px;"><span class="dim-chip demo" style="margin-right:4px;">DEMO</span>${ctOfficeReleaseNote(ctProgrammeOf('UG-KYG'), proj)}</div>
              <div class="row" style="cursor:pointer;" onclick="ctProgrammeBreakdownModal('UG-KYG','Human Capital Development')"><div class="row-title">Full Programme breakdown</div><span class="chevron">›</span></div>
              <div style="font-size:11px;color:var(--ct-text-secondary);margin-top:8px;">Source: Kayunga District LG Quarterly Performance Report, FY2025/26 <span class="source-tag">verified</span></div>
            </div>
          </div>

          <div class="drill-panel" data-panel="timeline">
            <div class="card">
              <div class="card-title">What's confirmed vs. what isn't</div>
              <div class="row"><div class="row-title">Idea &amp; Feasibility</div><div class="row-sub" style="text-align:right;">${proj.timeline.ideaFeasibility}</div></div>
              <div class="row"><div class="row-title">Procurement opened</div><div class="row-sub" style="text-align:right;">${proj.timeline.procurementOpened}</div></div>
              <div class="row"><div class="row-title">Contractor engaged</div><div class="row-sub" style="text-align:right;color:var(--ct-red);font-weight:600;">${proj.timeline.contractorEngaged}</div></div>
              <div class="row"><div class="row-title">Exact stage-entry dates</div><div class="row-sub" style="text-align:right;color:var(--ct-text-muted);">${proj.timeline.exactDates}</div></div>
              <div style="font-size:10.5px;color:var(--ct-text-muted);margin-top:8px;">CivicTrack shows the honest resolution of the source data: quarter-level confirmation, not a fabricated day-by-day timeline the report doesn't contain.</div>
            </div>
          </div>

          <div class="drill-panel" data-panel="related">
            <div class="card">
              <div class="card-title">Same blocker, same Programme</div>
              ${related.map(r => `<div class="row"><div><div class="row-title">${r.name}</div><div class="row-sub">${r.statusQuote}</div></div>${ctStatusPill(r.stageStatus)}</div>`).join('')}
            </div>
          </div>
        </div>

        <div>
          <div class="card">
            <div class="card-title">Advocacy &amp; Lobbying Toolkit</div>
            <p style="font-size:12px;color:var(--ct-text-secondary);margin-bottom:12px;">3 facilities share the same blocker: stalled procurement.</p>
            <button class="btn btn-red" onclick="ctDemoModeToast('Parliamentary Question drafted')">Draft Parliamentary Question</button>
            <button class="btn" onclick="ctDemoModeToast('Escalation sent to OPM')">Escalate to OPM</button>
            <button class="btn" onclick="ctDemoModeToast('Ministry briefing requested')">Request Ministry briefing</button>
            <a href="#/outcome" class="btn btn-yellow" style="text-decoration:none;">What success would look like →</a>
            ${ctLeaderActions([
              { icon: '📞', label: 'Contact LC1 Chairman, Bbaale' },
              { icon: '👷', label: 'Contact district engineer' },
              { icon: '📄', label: 'Request CAO status briefing' },
              { icon: '🏛️', label: 'Raise at district council' }
            ], { title: 'More options to consider' })}
            ${ctConstitutionalNote('MPs do not personally fund projects. This toolkit supports oversight, coordination, and advocacy — raising issues, requesting briefings, and escalating blockers to the government agency actually responsible for delivery.')}
          </div>
          <div class="card">
            <div class="card-title">Other MPs facing the same gap</div>
            <span class="ally-chip" style="cursor:pointer;" onclick="ctDemoModal('Neighbouring constituency MP', 'Cross-MP coordination workflows are not yet built in this prototype.')"><span class="avatar"></span>Ntenjeru North MP</span>
            <span class="ally-chip" style="cursor:pointer;" onclick="ctDemoModal('Neighbouring constituency MP', 'Cross-MP coordination workflows are not yet built in this prototype.')"><span class="avatar"></span>Ntenjeru South MP</span>
          </div>
        </div>
      </div>
      <div class="footer-note">Sample screen — figures sourced from the Kayunga District LG Quarterly Performance Report, FY2025/26, and PPDA Regulations.</div>
    </div>`;
});

// generic detail route for the other, non-flagship projects (all districts)
CT_GEO_IDS.forEach(function(gid){
  ctProgrammeOf(gid).projects.forEach(function(proj){
    if (CT_ROUTES['#/mp/project/' + proj.id]) return;
    ctRoute('#/mp/project/' + proj.id, function(){
      const ctx = ctMpCtx();
      const dist = ctProgrammeOf(gid);
      return ctTopbar(ctMpTitle(ctx), 'Projects › ' + proj.name, 'mp') + `
        <div class="content">
          ${ctBreadcrumb([{ label: 'Dashboard', href: '#/mp/dashboard' }, { label: 'Projects', href: '#/mp/projects' }, { label: proj.name }])}
          ${ctPrevNextNav(dist.projects, proj.id, '#/mp/project/')}
          <div class="screen-title">${proj.name}</div>
          <div class="screen-sub">${proj.sector} · ${proj.location} · NDP IV Programme: ${proj.programme || proj.sector}</div>
          <div class="card">
            <div class="card-title">Status</div>
            <div class="row"><div class="row-title">Current stage</div>${ctStatusPill(proj.stageStatus)}</div>
            ${proj.statusQuote ? `<div class="row"><div class="row-title">District report says</div><div class="row-sub" style="text-align:right;">"${proj.statusQuote}"</div></div>` : ''}
            ${proj.amount ? `<div class="row"><div class="row-title">Funded amount</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(proj.amount)}</div></div>` : ''}
            ${proj.statusNote ? `<div class="row"><div class="row-title">Note</div><div class="row-sub" style="text-align:right;">${proj.statusNote}</div></div>` : ''}
            ${ctOfficeBlock(dist, proj)}
            <div class="row" style="cursor:pointer;" onclick="ctProgrammeBreakdownModal('${gid}','${proj.programme || ''}')"><div class="row-title">Programme breakdown — ${dist.name}</div><span class="chevron">›</span></div>
          </div>
          <div class="footer-note">Sample screen — ${dist.name} reviewed documents.</div>
        </div>`;
    });
  });
});

// ---------------------------------------------------------------------------
// LC5 — DASHBOARD (compare-cards; every card opens its district's full
// Programme breakdown modal — brief item 4)
// ---------------------------------------------------------------------------
ctRoute('#/lc5/dashboard', function(){
  const s = ctSess();
  const k = ctProgrammeOf('UG-KYG'), j = ctProgrammeOf('UG-JJD'), c = ctProgrammeOf('UG-JJC');
  const mine = s.geoId;
  const yours = (id) => mine === id ? '<span class="dim-chip verified" style="margin-left:6px;">YOUR DISTRICT</span>' : '';

  const perfCard = (dist, distId, extraRows) => `
    <div class="compare-card clickable" onclick="ctProgrammeBreakdownModal('${distId}')" title="Open full Programme breakdown">
      <h4>${dist.name}${yours(distId)}</h4>
      <div class="compare-type">${dist.type === 'rural' ? 'Rural' : 'Rural fringe'} · ${dist.region} · ${dist.quarter} · pace target ${dist.paceTarget}%</div>
      <div class="compare-row"><span class="label">Overall released</span><span class="value amber">${dist.budget.expenditurePct}%</span></div>
      ${extraRows}
      <div class="compare-row"><span class="label">Stalled projects flagged</span><span class="value danger">${dist.projects.filter(p => p.stageStatus === 'stalled').length}</span></div>
      <div class="compare-row" onclick="event.stopPropagation();location.hash='#/programmes'" style="cursor:pointer;"><span class="label">Flagship initiatives</span><span class="value" style="font-size:11.5px;font-weight:600;">PDM · Emyooga · UWEP/YLP — under Programmes ›</span></div>
      <div class="compare-cta">Full Programme breakdown →</div>
    </div>`;

  const progRow = (dist, name) => {
    const p = dist.programmes.find(x => x.name === name);
    const pct = p.pctOfRevised != null ? p.pctOfRevised : p.pct;
    return `<div class="compare-row"><span class="label">${name.length > 34 ? name.slice(0, 33) + '…' : name}</span><span class="value ${pct >= dist.paceTarget ? 'good' : (pct < 20 ? 'danger' : 'amber')}">${pct}%</span></div>`;
  };

  return ctTopbar('District Council Dashboard', 'Comparing real Local Governments, by NDP IV Programme', 'lc5') + `
    <div class="content">
      <div class="screen-title">Dashboard</div>
      <div class="screen-sub">Same NDP IV Programme structure across Local Governments — pace-adjusted, since each reports a different quarter/document</div>

      ${ctCompassPanel('lc5')}
      ${ctClusterStrip('lc5')}

      <div class="card" style="background:var(--ct-panel-grey);border-style:dashed;">
        <div style="font-size:12px;color:#4A4943;">
          <strong>Reading this fairly:</strong> Kayunga's report is for ${k.quarter} (pace target ${k.paceTarget}%). Jinja District's report is for ${j.quarter} (pace target ${j.paceTarget}%). Jinja City is an approved budget, not a performance report — no % released exists for it yet. Click any card for that Local Government's full Programme breakdown.
        </div>
      </div>

      <div class="compare-grid">
        ${perfCard(k, 'UG-KYG',
          progRow(k, 'Human Capital Development') +
          progRow(k, 'Integrated Transport Infrastructure and Services') +
          `<div class="compare-row"><span class="label">Public Sector Transformation</span><span class="value danger">${k.programmes.find(p => p.name === 'Public Sector Transformation').pct}%</span></div>`)}
        ${perfCard(j, 'UG-JJD',
          progRow(j, 'Human Capital Development') +
          `<div class="compare-row"><span class="label">Integrated Transport Infrastructure</span><span class="value danger">${j.programmes.find(p => p.name === 'Integrated Transport Infrastructure and Services').pct}%</span></div>` +
          `<div class="compare-row"><span class="label">Sustainable Urbanisation &amp; Housing</span><span class="value danger">${j.programmes.find(p => p.name === 'Sustainable Urbanisation and Housing').pct}%</span></div>`)}
        <div class="compare-card clickable" onclick="ctProgrammeBreakdownModal('UG-JJC')" title="Open full budget breakdown">
          <h4>${c.name}${yours('UG-JJC')}</h4>
          <div class="compare-type">Urban · ${c.region} · approved budget FY2025/26 (no performance report yet)</div>
          <div class="compare-row"><span class="label">Approved budget</span><span class="value amber">${ctFormatUGX(c.budget.current)}</span></div>
          <div class="compare-row"><span class="label">Prior year</span><span class="value">${ctFormatUGX(c.budget.prior)}</span></div>
          <div class="compare-row"><span class="label">Funded projects</span><span class="value amber">${c.projects.length}</span></div>
          <div class="compare-row"><span class="label">Transport programme</span><span class="value">${ctFormatUGX(c.transportPogrammeTotal)}</span></div>
          <div class="compare-row"><span class="label">Stalled projects flagged</span><span class="value" style="color:var(--ct-text-muted);font-weight:500;font-size:12px;">n/a — budget doc</span></div>
          <div class="compare-cta">Full budget breakdown →</div>
        </div>
      </div>

      <div class="card" style="margin-top:6px;">
        <div style="font-size:12px;color:var(--ct-text-secondary);">
          <strong>What this shows:</strong> Kayunga is running roughly on pace overall, but its Public Sector Transformation Programme is badly behind. Jinja District is close to on-pace overall for Q1, but its Integrated Transport Infrastructure (7%) and Sustainable Urbanisation &amp; Housing (0%) Programmes are the ones to watch.
        </div>
      </div>

      ${ctGrantStreamCard()}

      <a href="#/lc5/projects" style="text-decoration:none;">
        <div class="indicator-card clickable" style="border-color:#E29A9A;background:var(--ct-red-tint);margin-top:16px;">
          <div class="icat" style="color:#791F1F;">Projects</div>
          <div class="ival danger">4 stalled across both districts</div>
          <div class="isub">Kayunga: Bbaale HC IV, Bukamba HC III, Nkokonjeru RGC · Jinja: Buwolero–Kitanaba road</div>
          <div class="cta">View all projects →</div>
        </div>
      </a>

      <a href="#/directory" style="text-decoration:none;">
        <div class="indicator-card clickable" style="margin-top:4px;">
          <div class="icat">Leadership directory</div>
          <div class="ival" style="font-size:16px;color:var(--ct-text-secondary);">${ctLeadersForDistrict(mine).length} verified</div>
          <div class="isub">MPs, Woman MP &amp; chairperson for ${ctGeoDistrict(mine).shortName} — verified office-holders</div>
          <div class="cta">Open directory →</div>
        </div>
      </a>

      ${ctRolePanel('lc5')}

      ${ctRecommendations(mine, 'lc5')}
      <div class="footer-note">Sample screen — Kayunga: FY2025/26 Q2. Jinja District: FY2025/26 Q1. Jinja City: approved budget FY2025/26.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// LC5 — PROJECTS (tabbed per Local Government)
// ---------------------------------------------------------------------------
ctRoute('#/lc5/projects', function(){
  const k = ctProgrammeOf('UG-KYG'), j = ctProgrammeOf('UG-JJD'), c = ctProgrammeOf('UG-JJC');
  return ctTopbar('District Council Dashboard', 'Projects › All Local Governments', 'lc5') + `
    <div class="content">
      ${ctBreadcrumb([{ label: 'Dashboard', href: '#/lc5/dashboard' }, { label: 'Projects' }])}
      <div class="screen-title">Projects</div>
      ${ctDrillTabs([
        { label: `Kayunga District (${k.projects.length})`, id: 'kayunga' },
        { label: `Jinja District (${j.projects.length})`, id: 'jinja' },
        { label: `Jinja City (${c.projects.length})`, id: 'city' }
      ])}
      <div class="drill-panel active" data-panel="kayunga">
        <div class="card">${k.projects.map(p => ctProjectRow(p, '#/lc5/project/kyg-')).join('')}</div>
      </div>
      <div class="drill-panel" data-panel="jinja">
        <div class="card">${j.projects.map(p => ctProjectRow(p, '#/lc5/project/jd-')).join('')}</div>
      </div>
      <div class="drill-panel" data-panel="city">
        <div class="card">${c.projects.map(p => ctProjectRow(p, '#/lc5/project/jc-')).join('')}</div>
      </div>
      <div class="footer-note">Sample screen — Jinja District items sourced from its FY2024/25 Q4 and FY2025/26 Q1 reports; Jinja City items from its approved FY2025/26 budget.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// LC5 — PROJECT DETAIL (Buwolero-Kitanaba road)
// ---------------------------------------------------------------------------
ctRoute('#/lc5/project/jd-buwolero-road', function(){
  const proj = ctProgrammeOf('UG-JJD').projects.find(p => p.id === 'buwolero-road');
  return ctTopbar('District Council Dashboard', 'Projects › Jinja District › ' + proj.name, 'lc5') + `
    <div class="content">
      ${ctBreadcrumb([{ label: 'Dashboard', href: '#/lc5/dashboard' }, { label: 'Projects', href: '#/lc5/projects' }, { label: proj.name }])}
      ${ctPrevNextNav(CT_LC5_PROJECTS, 'jd-' + proj.id, '#/lc5/project/')}
      <div class="alert-banner">
        <div class="alert-banner-title">Uganda ranks second-worst globally for project delays — World Bank</div>
        <div class="alert-banner-source">Cited by the Secretary to the Treasury, 2026 Public Procurement Cadre Forum</div>
      </div>
      <div class="screen-title">${proj.name}</div>
      <div class="screen-sub">${proj.length} · ${proj.sector} &amp; Engineering · Jinja District</div>
      <div class="card" style="background:var(--ct-panel-grey);border-style:dashed;margin-bottom:16px;">
        <div style="font-size:12px;color:#4A4943;"><strong>NDP IV Programme ${proj.programmeCode} — ${proj.programme}</strong> · PIAP Output ${proj.piapOutput} — "${proj.piapOutputName}"</div>
      </div>
      <div class="stage-tracker">
        <div class="stage-pill done">Idea</div><div class="stage-pill done">Feasibility</div><div class="stage-pill done">Procurement</div>
        <div class="stage-pill stuck">Implementation</div><div class="stage-pill">Complete</div>
      </div>
      <div class="stage-caption">District report status: "${proj.statusQuote}"</div>
      <div class="two-col">
        <div>
          <div class="card">
            <div class="card-title">Timeliness — is this a normal delay?</div>
            <div class="row"><div class="row-title">Reported incomplete in</div><div class="row-sub" style="text-align:right;color:var(--ct-red);font-weight:600;">${proj.confirmedPersistence}</div></div>
            <div class="row"><div class="row-title">Engineering-standard duration benchmark</div><div class="row-sub" style="text-align:right;">${proj.engineeringBenchmark.note}</div></div>
            <div style="font-size:10.5px;color:var(--ct-text-muted);margin-top:8px;">Unlike Bbaale HC IV's procurement delay, no PPDA-style statutory benchmark applies here — this is a more conservative claim than an estimated day-count.</div>
          </div>
          <div class="card">
            <div class="card-title">What the record shows</div>
            <div class="row"><div class="row-title">Reported blocker</div><div class="row-sub" style="text-align:right;">${proj.statusQuote}</div></div>
            <div class="row"><div class="row-title">Contributing cause</div><div class="row-sub" style="text-align:right;">${proj.contributingCause}</div></div>
            <div class="row"><div class="row-title">District roads budget performance</div><div class="row-sub" style="text-align:right;">Only 7% of the roads budget spent</div></div>
            <div class="row" style="cursor:pointer;" onclick="ctProgrammeBreakdownModal('UG-JJD','Integrated Transport Infrastructure and Services')"><div class="row-title">Full Programme breakdown</div><span class="chevron">›</span></div>
          </div>
        </div>
        <div>
          <div class="card">
            <div class="card-title">Advocacy &amp; Lobbying Toolkit</div>
            <p style="font-size:12px;color:var(--ct-text-secondary);margin-bottom:12px;">A terrain-related blocker plus a funding-release problem — two distinct asks.</p>
            <button class="btn btn-red" onclick="ctDemoModeToast('Parliamentary Question drafted')">Draft Parliamentary Question — URF release</button>
            <button class="btn" onclick="ctDemoModeToast('Engineering assessment requested')">Request engineering assessment</button>
            <button class="btn" onclick="ctDemoModeToast('Escalated to Uganda Road Fund')">Escalate to Uganda Road Fund</button>
            ${ctLeaderActions([
              { icon: '📞', label: 'Contact LC1 chairpersons along the road' },
              { icon: '👷', label: 'Contact district works department' },
              { icon: '📄', label: 'Request CAO briefing' },
              { icon: '⚡', label: 'Escalate to OPM' }
            ], { title: 'More options to consider' })}
            ${ctConstitutionalNote("the District Council's role is oversight and coordination — verifying, escalating, and holding the Uganda Road Fund and contractor accountable — not directly financing the repair itself.")}
          </div>
        </div>
      </div>
      <div class="footer-note">Sample screen — Jinja District LG Performance Reports.</div>
    </div>`;
});

// generic fallback for remaining LC5-listed projects (kyg-*, jd-*, jc-*)
CT_GEO_IDS.forEach(function(gid){
  const dist = ctProgrammeOf(gid);
  dist.projects.forEach(function(proj){
    const key = '#/lc5/project/' + CT_GEO_PREFIX[gid] + proj.id;
    if (CT_ROUTES[key]) return;
    ctRoute(key, function(){
      return ctTopbar('District Council Dashboard', 'Projects › ' + dist.name + ' › ' + proj.name, 'lc5') + `
        <div class="content">
          ${ctBreadcrumb([{ label: 'Dashboard', href: '#/lc5/dashboard' }, { label: 'Projects', href: '#/lc5/projects' }, { label: proj.name }])}
          ${ctPrevNextNav(CT_LC5_PROJECTS, CT_GEO_PREFIX[gid] + proj.id, '#/lc5/project/')}
          <div class="screen-title">${proj.name}</div>
          <div class="screen-sub">${proj.sector} · ${proj.location}</div>
          <div class="card">
            <div class="row"><div class="row-title">Current stage</div>${ctStatusPill(proj.stageStatus)}</div>
            ${proj.statusQuote ? `<div class="row"><div class="row-title">Report says</div><div class="row-sub" style="text-align:right;">"${proj.statusQuote}"</div></div>` : ''}
            ${proj.amount ? `<div class="row"><div class="row-title">Funded amount</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(proj.amount)}</div></div>` : ''}
            ${ctOfficeBlock(dist, proj)}
            <div class="row" style="cursor:pointer;" onclick="ctProgrammeBreakdownModal('${gid}','${proj.programme || ''}')"><div class="row-title">Programme breakdown — ${dist.name}</div><span class="chevron">›</span></div>
          </div>
        </div>`;
    });
  });
});

// ---------------------------------------------------------------------------
// LC3 — metric modals (Jinja City, real budget figures)
// ---------------------------------------------------------------------------
function ctLC3MetricModal(which){
  const c = ctProgrammeOf('UG-JJC');
  const mpumudde = c.projects.find(p => p.id === 'mpumudde-hc4');
  const namulesa = c.projects.find(p => p.id === 'namulesa-market');
  const src = 'Source: Jinja City Approved Budget Estimates, FY2025/26.';
  if (which === 'health'){
    ctInfoModal('Human Capital Development — Jinja City', `
      <div class="card" style="margin:0;box-shadow:none;padding:0;">
        <div class="row"><div class="row-title">${mpumudde.name}</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(mpumudde.amount)}</div></div>
        <div class="row"><div class="row-title">Coverage</div><div class="row-sub" style="text-align:right;">Plus city-wide health &amp; education budget lines</div></div>
      </div>`, src);
  } else if (which === 'transport'){
    ctInfoModal('Integrated Transport Infrastructure — Jinja City', `
      <div class="card" style="margin:0;box-shadow:none;padding:0;">
        <div class="row"><div class="row-title">City-wide transport programme</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(c.transportPogrammeTotal)}</div></div>
        <div class="row"><div class="row-title">Patching various roads</div><div class="row-sub" style="text-align:right;">UGX 465m</div></div>
        <div class="row"><div class="row-title">Drainage &amp; road repairs</div><div class="row-sub" style="text-align:right;">UGX 465m</div></div>
      </div>`, src);
  } else {
    ctInfoModal('Private Sector Development — Jinja City', `
      <div class="card" style="margin:0;box-shadow:none;padding:0;">
        <div class="row"><div class="row-title">${namulesa.name}</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(namulesa.amount)}</div></div>
        <div class="row"><div class="row-title">Location</div><div class="row-sub" style="text-align:right;">${namulesa.location}</div></div>
      </div>`, src);
  }
}

// ---------------------------------------------------------------------------
// LC3 — DASHBOARD (sub-county / division scoped by session geography)
// ---------------------------------------------------------------------------
ctRoute('#/lc3/dashboard', function(){
  const s = ctSess();
  const g = ctSessGeo();
  const dist = ctSessDistrict();
  const subName = s.subCountyId ? ctGeoName(s.subCountyId) : g.name;

  // Jinja City keeps its richer, budget-specific dashboard
  if (g.id === 'UG-JJC'){
    const c = dist;
    const mpumudde = c.projects.find(p => p.id === 'mpumudde-hc4');
    return ctTopbar(subName, 'Jinja City, Eastern Region', 'lc3') + `
      <div class="content">
        <div class="screen-title">Dashboard</div>
        <div class="screen-sub">NDP IV Programmes budgeted for Jinja City, FY2025/26</div>
        ${ctCompassPanel('lc3')}
        ${ctClusterStrip('lc3')}
        <div class="card" style="background:var(--ct-panel-grey);border-style:dashed;">
          <div style="font-size:11.5px;color:#4A4943;"><strong>Note:</strong> ${c.documentType} — so this screen shows Programme-level funding, not % released.</div>
        </div>
        <div class="metric-card" style="margin-bottom:12px;cursor:pointer;" onclick="ctLC3MetricModal('health')">
          <div class="metric-label">Human Capital Development</div>
          <div class="metric-value good">${ctFormatUGX(mpumudde.amount)}+</div>
          <div class="isub">Mpumudde maternity roof renovation, plus city-wide health &amp; education lines</div>
        </div>
        <div class="metric-card" style="margin-bottom:12px;cursor:pointer;" onclick="ctLC3MetricModal('transport')">
          <div class="metric-label">Integrated Transport Infrastructure</div>
          <div class="metric-value good">${ctFormatUGX(c.transportPogrammeTotal)}</div>
          <div class="isub">city-wide — includes patching &amp; drainage repairs, UGX 465m each</div>
        </div>
        <div class="metric-card" style="margin-bottom:12px;cursor:pointer;" onclick="ctLC3MetricModal('private')">
          <div class="metric-label">Private Sector Development</div>
          <div class="metric-value good">${ctFormatUGX(c.projects.find(p => p.id === 'namulesa-market').amount)}</div>
          <div class="isub">Namulesa Market completion (Jinja North Division)</div>
        </div>
        <div class="stage-tracker">
          <div class="stage-pill done">Idea</div><div class="stage-pill done">Feasibility</div><div class="stage-pill done">Funded</div>
          <div class="stage-pill stuck">Implementation</div><div class="stage-pill">Complete</div>
        </div>
        <div class="stage-caption">Mpumudde maternity roof: funded, implementation status not yet reported</div>
        <a href="#/lc3/monitoring" style="text-decoration:none;">
          <div class="indicator-card clickable" style="border-color:#E8D9A0;background:var(--ct-amber-tint);margin-top:8px;">
            <div class="icat" style="color:#8A5A00;">Projects</div>
            <div class="ival amber">1 funded, status pending</div>
            <div class="isub">Mpumudde maternity roof renovation</div>
            <div class="cta">View project →</div>
          </div>
        </a>
        <a href="#/directory" style="text-decoration:none;">
          <div class="indicator-card clickable" style="margin-top:4px;">
            <div class="icat">Leadership directory</div>
            <div class="isub">MPs, Woman MP &amp; Mayor for Jinja City</div>
            <div class="cta">Open directory →</div>
          </div>
        </a>
        <a href="#/collect" style="text-decoration:none;">
          <div class="indicator-card clickable" style="margin-top:4px;">
            <div class="icat">Field data collection</div>
            <div class="isub">Report on any NDP IV aspect — health, education, roads, water, PDM groups, markets — with photo evidence</div>
            <div class="cta">Open collection prompts →</div>
          </div>
        </a>
        ${ctFlagshipParityCard()}
        ${ctRolePanel('lc3')}
        ${ctRecommendations(g.id, 'lc3')}
        <div class="footer-note">Sample screen — Jinja City's approved FY2025/26 Budget Estimates, organized by NDP IV Programme.</div>
      </div>`;
  }

  // Rural districts: sub-county scoped project view
  const local = ctProjectsInSubArea(g.id, s.subCountyId);
  const stalledHere = local.filter(p => p.stageStatus === 'stalled').length;
  return ctTopbar(subName, g.name + ', ' + g.region, 'lc3') + `
    <div class="content">
      <div class="screen-title">Dashboard</div>
      <div class="screen-sub">Projects recorded in ${subName} in ${g.name}'s ${dist.quarter} performance report</div>
      ${ctCompassPanel('lc3')}
      ${ctClusterStrip('lc3')}

      ${local.length ? `
        <div class="indicator-grid" style="grid-template-columns:repeat(2,1fr);">
          <div class="indicator-card">
            <div class="icat">Projects here</div>
            <div class="ival">${local.length}</div>
            <div class="isub">${stalledHere} stalled</div>
          </div>
          <div class="indicator-card clickable" onclick="ctProgrammeBreakdownModal('${g.id}')">
            <div class="icat">District context</div>
            <div class="ival amber">${dist.budget.expenditurePct}%</div>
            <div class="isub">of ${ctFormatUGX(dist.budget.revised || dist.budget.approved)} released district-wide (${dist.quarter})</div>
            <div class="cta">Programme breakdown →</div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">Projects in ${subName}</div>
          ${local.map(p => `<div class="row"><div><div class="row-title">${p.name}</div><div class="row-sub">${p.statusQuote || ''}</div></div>${ctStatusPill(p.stageStatus)}</div>`).join('')}
        </div>
        <a href="#/lc3/monitoring" style="text-decoration:none;">
          <div class="indicator-card clickable" style="border-color:#E8D9A0;background:var(--ct-amber-tint);margin-top:8px;">
            <div class="icat" style="color:#8A5A00;">Monitoring</div>
            <div class="ival amber">${local[0].name.split('—')[0].trim()}</div>
            <div class="isub">Open the contractor &amp; service monitoring screen</div>
            <div class="cta">View project →</div>
          </div>
        </a>`
      : ctDemoLevelPanel('Projects in ' + subName,
          'No capital projects in ' + subName + ' were itemized in the reviewed ' + g.name + ' performance report (' + dist.quarter + '). This panel would list them once the district\'s project register is connected. The district-wide Programme breakdown remains available below.')
        + `<div class="indicator-card clickable" onclick="ctProgrammeBreakdownModal('${g.id}')">
            <div class="icat">District context</div>
            <div class="ival amber">${dist.budget.expenditurePct}%</div>
            <div class="isub">released district-wide (${dist.quarter})</div>
            <div class="cta">Programme breakdown →</div>
          </div>`}

      <a href="#/directory" style="text-decoration:none;">
        <div class="indicator-card clickable" style="margin-top:8px;">
          <div class="icat">Leadership directory</div>
          <div class="isub">MPs, Woman MP &amp; LC5 for ${g.shortName}</div>
          <div class="cta">Open directory →</div>
        </div>
      </a>
      <a href="#/collect" style="text-decoration:none;">
        <div class="indicator-card clickable" style="margin-top:4px;">
          <div class="icat">Field data collection</div>
          <div class="isub">Report on any NDP IV aspect — health, education, roads, water, PDM groups, markets — with photo evidence</div>
          <div class="cta">Open collection prompts →</div>
        </div>
      </a>
      ${ctFlagshipParityCard()}
      ${ctRolePanel('lc3')}
      ${ctRecommendations(g.id, 'lc3')}
      <div class="footer-note">Sample screen — ${g.name} LG Performance Report, ${dist.quarter}.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// LC3 — MONITORING (first local project; richer screen for Mpumudde HC IV)
// ---------------------------------------------------------------------------
ctRoute('#/lc3/monitoring', function(){
  const s = ctSess();
  const g = ctSessGeo();
  const dist = ctSessDistrict();
  const subName = s.subCountyId ? ctGeoName(s.subCountyId) : g.name;
  const blockerField = `
    <select class="field" style="color:var(--ct-text);" onchange="ctToast('Blocker type set to: ' + this.value)">
      <option>Funding disbursement</option>
      <option>Contractor absent from site</option>
      <option>Materials not delivered</option>
      <option>Community complaint</option>
      <option>Other</option>
    </select>`;

  if (g.id === 'UG-JJC'){
    const proj = dist.projects.find(p => p.id === 'mpumudde-hc4');
    return ctTopbar(subName, 'Projects › ' + proj.name, 'lc3') + `
      <div class="content">
        ${ctBreadcrumb([{ label: 'Dashboard', href: '#/lc3/dashboard' }, { label: proj.name }])}
        <div class="screen-title">Contractor &amp; service monitoring</div>
        <div class="screen-sub">${proj.name} — ${ctFormatUGX(proj.amount)}, FY2025/26</div>
        <div class="card">
          <div class="card-title">Site visit log</div>
          <div class="photo-box" onclick="ctDemoModeToast('Photo capture')"><div class="icon">📷</div>Tap to take a photo — site visit</div>
          <div class="row"><div class="row-title">Observed</div><div class="row-sub" style="text-align:right;">No visible roofing works started as of this visit</div></div>
          <div class="row"><div class="row-title">Budget status</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(proj.amount)} allocated, disbursement not yet confirmed locally</div></div>
          <div class="row"><div class="row-title">Responsible office</div><div class="row-sub" style="text-align:right;">${ctOfficeOf(proj)}</div></div>
        </div>
        <button class="btn btn-red" onclick="ctDemoModeToast('Blocker reported')">Report a blocker</button>
        ${blockerField}
        <button class="btn btn-black" onclick="ctDemoModeToast('Escalated to LC5 / Jinja City Council')">Escalate to LC5 / Jinja City Council</button>
        ${ctLeaderActions([
          { icon: '📞', label: 'Contact LC1 chairman' },
          { icon: '👷', label: 'Contact contractor via city engineer' },
          { icon: '📷', label: 'Request LC1 photo verification' }
        ], { title: 'More options to consider' })}
        <div class="footer-note">Sample screen — Jinja City's FY2025/26 budget confirms funding; on-the-ground status is field-reported, not yet in an official performance report.</div>
      </div>`;
  }

  const local = ctProjectsInSubArea(g.id, s.subCountyId);
  if (!local.length){
    return ctTopbar(subName, 'Projects › monitoring', 'lc3') + `
      <div class="content">
        ${ctBreadcrumb([{ label: 'Dashboard', href: '#/lc3/dashboard' }, { label: 'Monitoring' }])}
        ${ctDemoLevelPanel('Contractor & service monitoring', 'No capital projects in ' + subName + ' were itemized in the reviewed ' + g.name + ' report, so there is no site to monitor in this demo. This screen would open the site-visit workflow once the district project register is connected.')}
        <a href="#/lc3/dashboard" class="btn" style="text-decoration:none;">← Back to dashboard</a>
      </div>`;
  }
  const proj = local[0];
  return ctTopbar(subName, 'Projects › ' + proj.name, 'lc3') + `
    <div class="content">
      ${ctBreadcrumb([{ label: 'Dashboard', href: '#/lc3/dashboard' }, { label: proj.name }])}
      <div class="screen-title">Contractor &amp; service monitoring</div>
      <div class="screen-sub">${proj.name} — ${proj.location}, ${g.name}</div>
      <div class="card">
        <div class="card-title">Site visit log</div>
        <div class="photo-box" onclick="ctDemoModeToast('Photo capture')"><div class="icon">📷</div>Tap to take a photo — site visit</div>
        <div class="row"><div class="row-title">District report status</div><div class="row-sub" style="text-align:right;">"${proj.statusQuote || 'recorded in district report'}"</div></div>
        <div class="row"><div class="row-title">Current stage</div>${ctStatusPill(proj.stageStatus)}</div>
        <div class="row"><div class="row-title">Responsible office</div><div class="row-sub" style="text-align:right;">${ctOfficeOf(proj)}</div></div>
      </div>
      <button class="btn btn-red" onclick="ctDemoModeToast('Blocker reported')">Report a blocker</button>
      ${blockerField}
      <button class="btn btn-black" onclick="ctDemoModeToast('Escalated to LC5 / ' + '${g.name}' + ' Council')">Escalate to LC5 / ${g.name} Council</button>
      ${ctLeaderActions([
        { icon: '📞', label: 'Contact LC1 chairman' },
        { icon: '👷', label: 'Contact contractor via district engineer' },
        { icon: '📷', label: 'Request LC1 photo verification' }
      ], { title: 'More options to consider' })}
      <div class="footer-note">Sample screen — ${g.name} LG Performance Report, ${dist.quarter}; field status is demo-reported.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// LC2 — DASHBOARD (ward / parish scoped by session geography)
// ---------------------------------------------------------------------------
function ctLC2NamulesaModal(){
  const proj = ctProgrammeOf('UG-JJC').projects.find(p => p.id === 'namulesa-market');
  ctInfoModal('Namulesa Market completion', `
    <div class="card" style="margin:0;box-shadow:none;padding:0;">
      <div class="row"><div class="row-title">Funded amount</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(proj.amount)}</div></div>
      <div class="row"><div class="row-title">Location</div><div class="row-sub" style="text-align:right;">${proj.location}</div></div>
      <div class="row"><div class="row-title">Stage</div><div class="row-sub" style="text-align:right;">Funded, FY2025/26 — completion works</div></div>
    </div>`, 'Source: Jinja City Approved Budget Estimates, FY2025/26.');
}

ctRoute('#/lc2/dashboard', function(){
  const s = ctSess();
  const g = ctSessGeo();
  const wardName = s.wardId ? ctGeoName(s.wardId) : 'Parish level';

  // Jinja North Ward keeps its real-data Namulesa dashboard
  if (s.wardId === 'UG-JJC-W-JN'){
    const proj = ctProgrammeOf('UG-JJC').projects.find(p => p.id === 'namulesa-market');
    return ctTopbar(wardName, 'Jinja City, Eastern Region', 'lc2') + `
      <div class="content">
        <div class="screen-title">Dashboard</div>
        <div class="screen-sub">Ward-level view, Jinja City FY2025/26 approved budget</div>
        ${ctCompassPanel('lc2')}
        ${ctRolePanel('lc2')}
        ${ctClusterStrip('lc2')}
        ${ctCommunityScorecard('LC2')}
        <div class="metric-card" style="margin-bottom:12px;cursor:pointer;" onclick="ctLC2NamulesaModal()">
          <div class="metric-label">Namulesa Market completion</div>
          <div class="metric-value good">${ctFormatUGX(proj.amount)}</div>
          <div class="isub">funded, FY2025/26</div>
        </div>
        <div class="metric-card" style="margin-bottom:12px;cursor:pointer;" onclick="ctDemoModal('Vendors affected', 'This estimate (Sample: 140) is illustrative for this prototype — no verified vendor count exists in the budget document reviewed.')">
          <div class="metric-label">Vendors affected</div>
          <div class="metric-value">Sample: 140</div>
          <div class="isub">estimated market stall holders</div>
        </div>
        <div class="stage-tracker">
          <div class="stage-pill done">Idea</div><div class="stage-pill done">Feasibility</div><div class="stage-pill done">Funded</div>
          <div class="stage-pill stuck">Completion works</div><div class="stage-pill">Complete</div>
        </div>
        <div class="stage-caption">Funded to completion — construction status not yet field-verified</div>
        <div class="card">
          <div class="card-title">Mobilization tasks</div>
          <div class="row" style="cursor:pointer;" onclick="ctDemoModal('Market vendor association', 'Per-group mobilization workflows are not yet built in this prototype.')"><div class="row-title">Market vendor association</div><span class="chevron">›</span></div>
          <div class="row" style="cursor:pointer;" onclick="ctDemoModal('Boda-boda stage leaders', 'Per-group mobilization workflows are not yet built in this prototype.')"><div class="row-title">Boda-boda stage leaders</div><span class="chevron">›</span></div>
          <div class="row" style="cursor:pointer;" onclick="ctDemoModal('Church leaders', 'Per-group mobilization workflows are not yet built in this prototype.')"><div class="row-title">Church leaders</div><span class="chevron">›</span></div>
        </div>
        <a href="#/lc2/mobilize" class="btn btn-yellow" style="text-decoration:none;display:block;text-align:center;">Open mobilization workspace →</a>
        <a href="#/collect" style="text-decoration:none;">
          <div class="indicator-card clickable" style="margin-top:12px;">
            <div class="icat">Field data collection</div>
            <div class="isub">Report on any NDP IV aspect — health, education, roads, water, PDM groups, markets — with photo evidence</div>
            <div class="cta">Open collection prompts →</div>
          </div>
        </a>
        <div class="footer-note">Sample screen — funding figure sourced from Jinja City's approved FY2025/26 Budget Estimates; vendor count and mobilization detail are illustrative.</div>
      </div>`;
  }

  // Any other ward, or a district whose parish names aren't itemized:
  // the view opens normally with the DEMO watermark (brief item 3).
  const dist = ctSessDistrict();
  const mob = ctMobilizationOf(g.id);
  return ctTopbar(wardName, g.name + ', ' + g.region, 'lc2') + `
    <div class="content">
      <div class="screen-title">Dashboard</div>
      <div class="screen-sub">Parish-level view — ${g.name}</div>
      ${ctCompassPanel('lc2')}
      ${ctRolePanel('lc2')}
      ${ctClusterStrip('lc2')}
      ${ctCommunityScorecard('LC2')}
      ${ctDemoLevelPanel('Parish projects & mobilization — ' + wardName,
        (g.levelsNote || 'Parish-level items are not itemized in the reviewed documents for this Local Government.') +
        ' This dashboard would list the parish\'s projects, PDM SACCO status and mobilization tasks once the parish register is connected.')}
      ${mob && mob.pdm && !mob.pdm.notAvailable ? `
        <div class="indicator-card clickable" onclick="ctPDMModal('${g.id}')">
          <div class="icat">Parish Development Model (district-wide)</div>
          <div class="ival good">${mob.pdm.householdsFacilitated.toLocaleString()}</div>
          <div class="isub">households facilitated across ${mob.pdm.parishes} parishes — parish-level split not in the reviewed report</div>
          <div class="cta">View district PDM detail →</div>
        </div>` : `
        <div class="indicator-card clickable" onclick="ctPDMModal('${g.id}')">
          <div class="icat">Parish Development Model</div>
          <div class="ival" style="font-size:16px;color:var(--ct-text-muted);">DEMO</div>
          <div class="isub">PDM figures not in the reviewed reports for ${g.shortName}</div>
          <div class="cta">View status →</div>
        </div>`}
      <div class="indicator-card clickable" onclick="ctProgrammeBreakdownModal('${g.id}')">
        <div class="icat">District context</div>
        <div class="ival amber">${dist.dataKind === 'performance' ? dist.budget.expenditurePct + '% released' : ctFormatUGX(dist.budget.current)}</div>
        <div class="isub">${dist.dataKind === 'performance' ? 'district-wide, ' + dist.quarter : 'approved FY2025/26 budget'}</div>
        <div class="cta">Programme breakdown →</div>
      </div>
      <a href="#/directory" style="text-decoration:none;">
        <div class="indicator-card clickable">
          <div class="icat">Leadership directory</div>
          <div class="isub">MPs, Woman MP &amp; LC5 for ${g.shortName}</div>
          <div class="cta">Open directory →</div>
        </div>
      </a>
      <a href="#/collect" style="text-decoration:none;">
        <div class="indicator-card clickable" style="margin-top:4px;">
          <div class="icat">Field data collection</div>
          <div class="isub">Report on any NDP IV aspect — health, education, roads, water, PDM groups, markets — with photo evidence</div>
          <div class="cta">Open collection prompts →</div>
        </div>
      </a>
      <div class="footer-note">Sample screen — parish-level detail shown as DEMO where the reviewed documents do not itemize it.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// LC2 — MOBILIZATION
// ---------------------------------------------------------------------------
ctRoute('#/lc2/mobilize', function(){
  const s = ctSess();
  if (s.wardId !== 'UG-JJC-W-JN'){
    const g = ctSessGeo();
    const wardName = s.wardId ? ctGeoName(s.wardId) : 'Parish level';
    return ctTopbar(wardName, 'Mobilization', 'lc2') + `
      <div class="content">
        ${ctBreadcrumb([{ label: 'Dashboard', href: '#/lc2/dashboard' }, { label: 'Mobilization' }])}
        ${ctDemoLevelPanel('Mobilization workspace — ' + wardName,
          'No parish-level project is itemized for this area in the reviewed documents, so there is no live mobilization target in this demo. The workspace would open here once the parish register is connected.')}
        <a href="#/lc2/dashboard" class="btn" style="text-decoration:none;">← Back to dashboard</a>
      </div>`;
  }
  const proj = ctProgrammeOf('UG-JJC').projects.find(p => p.id === 'namulesa-market');
  return ctTopbar('Jinja North Ward', 'Projects › ' + proj.name, 'lc2') + `
    <div class="content">
      ${ctBreadcrumb([{ label: 'Dashboard', href: '#/lc2/dashboard' }, { label: proj.name }])}
      <div class="screen-title">Mobilize community input</div>
      <div class="screen-sub">${proj.name} — ${ctFormatUGX(proj.amount)}, funded FY2025/26</div>
      <div class="card">
        <div class="card-title">Upcoming: vendor meeting on market completion</div>
        <div class="row"><div class="row-title">Date</div><div class="row-sub">Sample: 14 March, 9:00am</div></div>
        <div class="row"><div class="row-title">Location</div><div class="row-sub">Namulesa Market grounds</div></div>
        <div class="row"><div class="row-title">RSVP'd</div><div class="row-sub">Sample: 34 confirmed</div></div>
      </div>
      <div class="card">
        <div class="card-title">Talking points</div>
        <p style="font-size:12px;margin-bottom:8px;">Market completion funded at ${ctFormatUGX(proj.amount)} for FY2025/26 <span class="source-tag">Jinja City budget</span></p>
        <p style="font-size:12px;margin-bottom:8px;">Part of a wider ${ctFormatUGX(ctProgrammeOf('UG-JJC').budget.current)} Jinja City budget, up from ${ctFormatUGX(ctProgrammeOf('UG-JJC').budget.prior)} last year <span class="source-tag">verified</span></p>
      </div>
      <button class="btn btn-yellow" onclick="ctSubmitWithNote('ctMobNotes','Outcome logged')">Log outcome</button>
      <textarea class="field" id="ctMobNotes" placeholder="Meeting notes…"></textarea>
      <div class="footer-note">Sample screen — funding figures real and sourced; meeting details illustrative.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// LC1 — DASHBOARD (village / cell scoped by session geography)
// ---------------------------------------------------------------------------
function ctLC1ProjectModal(){
  const proj = ctProgrammeOf('UG-JJC').projects.find(p => p.id === 'namulesa-market');
  ctInfoModal(proj.name, `
    <div class="card" style="margin:0;box-shadow:none;padding:0;">
      <div class="row"><div class="row-title">Funded amount</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(proj.amount)}</div></div>
      <div class="row"><div class="row-title">Ward</div><div class="row-sub" style="text-align:right;">Jinja North Ward</div></div>
      <div class="row"><div class="row-title">On-the-ground status</div><div class="row-sub" style="text-align:right;">Not yet field-verified</div></div>
    </div>`, 'Source: Jinja City Approved Budget Estimates, FY2025/26.');
}

ctRoute('#/lc1/dashboard', function(){
  const s = ctSess();
  const g = ctSessGeo();
  const cellName = s.cellId ? ctGeoName(s.cellId) : 'Village level';

  if (s.cellId === 'UG-JJC-C-NAM'){
    const proj = ctProgrammeOf('UG-JJC').projects.find(p => p.id === 'namulesa-market');
    return ctTopbar(cellName, 'Jinja North Ward, Jinja City', 'lc1') + `
      <div class="content">
        ${ctCompassPanel('lc1')}
        ${ctRolePanel('lc1')}
        ${ctClusterStrip('lc1')}
        ${ctFlagshipParityCard()}
        <div class="card" style="text-align:center;padding:28px 16px;cursor:pointer;" onclick="ctLC1ProjectModal()">
          <div class="card-title" style="font-size:16px;justify-content:center;">Project near you</div>
          <p style="font-size:14px;margin:8px 0 16px;">${proj.name} — completion works, funded ${ctFormatUGX(proj.amount)}</p>
          <div class="dot-tracker" style="justify-content:center;">
            <div class="dot done"></div><div class="dot-line"></div>
            <div class="dot done"></div><div class="dot-line"></div>
            <div class="dot stuck"></div><div class="dot-line"></div>
            <div class="dot"></div><div class="dot-line"></div>
            <div class="dot"></div>
          </div>
          <p style="font-size:12px;color:var(--ct-text-secondary);margin-top:10px;">Funded — construction status not yet confirmed on the ground</p>
        </div>
        <a href="#/lc1/report" class="btn btn-yellow btn-large" style="text-decoration:none;display:block;text-align:center;">Report what I see</a>
        <a href="#/collect" style="text-decoration:none;">
          <div class="indicator-card clickable" style="margin-top:12px;">
            <div class="icat">Other monitoring aspects</div>
            <div class="isub">Health, education, roads, water, PDM groups, markets — with photo evidence</div>
            <div class="cta">Open collection prompts →</div>
          </div>
        </a>
        ${ctCommunityScorecard('LC1')}
        <div class="footer-note">Sample screen — offline-first, designed for low-end Android use.</div>
      </div>`;
  }

  return ctTopbar(cellName, g.name + ', ' + g.region, 'lc1') + `
    <div class="content">
      ${ctCompassPanel('lc1')}
      ${ctRolePanel('lc1')}
      ${ctClusterStrip('lc1')}
      ${ctFlagshipParityCard()}
      ${ctDemoLevelPanel('Project near you — ' + cellName,
        (g.levelsNote || 'Village-level items are not itemized in the reviewed documents for this Local Government.') +
        ' This screen would show the nearest funded project to this village once the village register is connected.')}
      <a href="#/lc1/report" class="btn btn-yellow btn-large" style="text-decoration:none;display:block;text-align:center;">Report what I see</a>
      <a href="#/collect" style="text-decoration:none;">
        <div class="indicator-card clickable" style="margin-top:12px;">
          <div class="icat">Other monitoring aspects</div>
          <div class="isub">Health, education, roads, water, PDM groups, markets — with photo evidence</div>
          <div class="cta">Open collection prompts →</div>
        </div>
      </a>
      <div class="indicator-card clickable" onclick="ctProgrammeBreakdownModal('${g.id}')">
        <div class="icat">District-wide projects (context)</div>
        <div class="ival amber">${ctSessDistrict().projects.length} tracked</div>
        <div class="isub">drill up to ${g.name}'s full programme &amp; project breakdown</div>
        <div class="cta">Programme breakdown →</div>
      </div>
      ${ctCommunityScorecard('LC1')}
      <div class="footer-note">Sample screen — village-level detail shown as DEMO where the reviewed documents do not itemize it.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// LC1 — FIELD REPORT
// ---------------------------------------------------------------------------
ctRoute('#/lc1/report', function(){
  const s = ctSess();
  const named = s.cellId === 'UG-JJC-C-NAM';
  const siteName = named ? 'Namulesa Market' : 'Community site (demo)';
  const cellName = s.cellId ? ctGeoName(s.cellId) : 'Village level';
  return ctTopbar(cellName, 'Report site status', 'lc1') + `
    <div class="content">
      ${ctBreadcrumb([{ label: 'Dashboard', href: '#/lc1/dashboard' }, { label: 'Report site status' }])}
      <div class="screen-title" style="font-size:17px;">${siteName}</div>
      ${named ? '' : '<div class="hypothetical-banner"><strong>DEMO:</strong> no named site exists for this village in the reviewed documents — this form is shown so the reporting flow can be exercised end-to-end.</div>'}
      <label class="photo-box" style="height:190px;"><input type="file" accept="image/*" capture="environment" style="display:none" onchange="ctPhotoPreview(this)"><div class="icon" style="font-size:34px;">📷</div>Tap to take or upload a photo</label>

      <p style="font-size:14px;font-weight:500;margin-bottom:10px;">Is work happening at this site?</p>
      <div class="choice-row">
        <div class="choice-btn" onclick="document.querySelectorAll('.choice-btn').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">Yes</div>
        <div class="choice-btn selected" onclick="document.querySelectorAll('.choice-btn').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">No</div>
        <div class="choice-btn" onclick="document.querySelectorAll('.choice-btn').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">Unsure</div>
      </div>

      <p style="font-size:14px;font-weight:500;margin-bottom:8px;">What did you see?</p>
      <textarea class="field" id="ctLC1Note" style="height:70px;" placeholder="No construction activity, market stalls unchanged since last visit…"></textarea>

      <button class="btn btn-black btn-large" onclick="ctSubmitWithNote('ctLC1Note','Report submitted');setTimeout(()=>location.hash='#/lc1/dashboard',1400)">Submit report</button>

      <a href="#/collect" style="display:inline-block;margin-top:12px;font-size:12.5px;font-weight:600;color:var(--ct-black);text-decoration:none;">Report on other NDP IV aspects (health, roads, PDM groups…) →</a>

      <div class="sync-banner" style="margin-top:14px;">☁️ Saved — will sync when you're back online</div>
      <div class="footer-note">The photo preview is real, but in this demo the image never leaves your device and the submission is not stored.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// OUTCOME RECORDING — hypothetical, clearly marked
// ---------------------------------------------------------------------------
ctRoute('#/outcome', function(){
  return ctTopbar('Outcome Recording', 'Bbaale HC IV maternity ward — Bbaale County, Kayunga', 'mp') + `
    <div class="content">
      <div class="hypothetical-banner">
        <strong>Hypothetical screen:</strong> this shows what CivicTrack would display <em>if</em> advocacy succeeds — it is not a claim that the real Bbaale HC IV project has been resolved. As of the latest Kayunga District performance report, it remains in stalled procurement.
      </div>
      <div class="screen-title">What success would look like</div>
      <div class="stage-tracker">
        <div class="stage-pill done">Idea</div><div class="stage-pill done">Feasibility</div><div class="stage-pill done">Procurement</div>
        <div class="stage-pill done">Implementation</div><div class="stage-pill done">Complete</div>
      </div>
      <div class="two-col">
        <div class="card">
          <div class="card-title">Timeline logged</div>
          <div class="row"><div class="row-title">Parliamentary Question filed</div><div class="row-sub">Sample: Month 1</div></div>
          <div class="row"><div class="row-title">Ministry briefing held</div><div class="row-sub">Sample: Month 2</div></div>
          <div class="row"><div class="row-title">Contractor engaged</div><div class="row-sub">Sample: Month 4</div></div>
          <div class="row"><div class="row-title">Works completed</div><div class="row-sub">Sample: Month 11</div></div>
        </div>
        <div class="card">
          <div class="card-title">Attribution — handled carefully</div>
          <p style="font-size:12px;color:var(--ct-text-secondary);">CivicTrack records this as a <strong>contribution</strong>, not a proven causal claim. The event, the change, and the time lag between them are logged and shown together, not presented as MP-caused impact.</p>
        </div>
      </div>
      <div class="footer-note">The only screen in this app built from a hypothetical scenario rather than a real, current record.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// FIELD DATA COLLECTION — structured monitoring prompts for the NDP IV
// aspects CivicTrack tracks, usable by MPs and every LC level. LC1 project
// monitoring (photo + report) is one instance of this pattern; this route
// generalizes it across all aspects of interest. The photo preview is real;
// submissions are simulated (Demo Mode toast) and never uploaded.
// ---------------------------------------------------------------------------
const CT_COLLECT_ASPECTS = [
  { id: 'health', icon: '🏥', label: 'Health facility status', programme: 'Human Capital Development',
    statuses: ['Functional', 'Partially functional', 'Not functional'],
    prompt: 'Staffing, drug stock, roof / equipment condition…' },
  { id: 'education', icon: '🏫', label: 'School & classroom status', programme: 'Human Capital Development',
    statuses: ['Functional', 'Partially functional', 'Not functional'],
    prompt: 'Classroom condition, teacher presence, materials…' },
  { id: 'roads', icon: '🛣️', label: 'Road & drainage condition', programme: 'Integrated Transport Infrastructure and Services',
    statuses: ['Motorable', 'Difficult to pass', 'Impassable'],
    prompt: 'Surface condition, swampy sections, culverts…' },
  { id: 'water', icon: '💧', label: 'Water point status', programme: 'Natural Resources, Environment, Climate Change, Land and Water Management',
    statuses: ['Working', 'Intermittent', 'Broken'],
    prompt: 'Flow, queue length, repair needs…' },
  { id: 'pdm', icon: '🏘️', label: 'PDM / wealth-group activity', programme: 'Flagship initiatives (PDM, Emyooga, UWEP/YLP)',
    statuses: ['Active group', 'Dormant group', 'No group formed'],
    prompt: 'SACCO meetings, disbursement progress, enterprise activity…' },
  { id: 'market', icon: '🧺', label: 'Market & local revenue', programme: 'Private Sector Development',
    statuses: ['Operating normally', 'Partially operating', 'Closed / stalled'],
    prompt: 'Stall occupancy, vendor concerns, revenue collection…' },
  { id: 'community', icon: '🗣️', label: 'Community mobilization', programme: 'Development Plan Implementation',
    statuses: ['Meeting held', 'Meeting planned', 'No recent activity'],
    prompt: 'Barazas, parish meetings, citizen priorities raised…' },
  { id: 'environment', icon: '🌳', label: 'Environment & natural resources', programme: 'Natural Resources, Environment, Climate Change, Land and Water Management',
    statuses: ['Well kept', 'Under pressure', 'Degraded'],
    prompt: 'Wetland encroachment, forest loss, tree cover, dumping sites…' },
  { id: 'money', icon: '💳', label: 'Money economy participation', programme: 'Private Sector Development · FY2026/27 theme',
    statuses: ['Formalizing — TIN/URSB uptake visible', 'Mostly informal, interest growing', 'Entirely informal'],
    prompt: 'Trading activity, TIN registration, business names, mobile-money use…' }
];

ctRoute('#/collect', function(){
  const s = ctSess();
  const g = ctSessGeo();
  const dist = ctSessDistrict();
  const active = CT_COLLECT_ASPECTS.find(a => a.id === (ctGetQuery().aspect || '')) || CT_COLLECT_ASPECTS[0];
  const projects = dist ? dist.projects : [];
  const areaName = ctGeoName(s.constituencyId || s.subCountyId || s.wardId || s.cellId || s.geoId);
  return ctTopbar('Field data collection', g.name + ' · NDP IV monitoring', s.role) + `
    <div class="content">
      ${ctBreadcrumb([{ label: 'Dashboard', href: CT_ROLES[s.role].home }, { label: 'Field data collection' }])}
      <div class="screen-title">Collect field data</div>
      <div class="screen-sub">Structured prompts for the NDP IV aspects CivicTrack monitors. Pick an aspect, record what you see, attach photo evidence — reports feed the responsible leader dashboards (simulated in this demo).</div>

      <div class="filter-strip" style="margin-bottom:14px;">
        ${CT_COLLECT_ASPECTS.map(a => `<a class="filter-chip${a.id === active.id ? ' active' : ''}" href="#/collect?aspect=${a.id}" style="text-decoration:none;">${a.icon} ${a.label}</a>`).join('')}
      </div>

      <div class="card">
        <div class="card-title">${active.icon} ${active.label}</div>
        <div style="font-size:11px;color:var(--ct-text-muted);margin-bottom:12px;">NDP IV aspect: ${active.programme} · reporting from <strong>${areaName}</strong></div>

        <div class="loc-block">
          <div class="loc-title">📍 Location of this report <span class="loc-required">required</span></div>
          <div class="loc-row"><span class="loc-key">Area (from your account)</span><span class="loc-val">${areaName === g.name ? areaName : areaName + ', ' + g.name}</span></div>
          <input class="login-field" id="ctLocLandmark" type="text" placeholder="Village / landmark — e.g. near Namulesa Market gate" autocomplete="off" style="margin:8px 0;">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <button class="btn" style="padding:8px 14px;font-size:12px;width:auto;" onclick="ctCaptureGPS()">📡 Capture GPS (demo)</button>
            <span id="ctGpsOut" style="font-size:11.5px;color:var(--ct-text-muted);">no coordinates attached yet</span>
          </div>
          <div class="loc-note">Every report is pinned to a place. A single incident at one site is shown as <em>that site</em> — leader dashboards only draw wider conclusions from many located reports, so one isolated problem never paints the picture for everyone.</div>
        </div>

        <p style="font-size:13px;font-weight:500;margin-bottom:8px;">What is the status?</p>
        <div class="choice-row">
          ${active.statuses.map((st, i) => `<div class="choice-btn${i === 0 ? ' selected' : ''}" onclick="document.querySelectorAll('.choice-btn').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">${st}</div>`).join('')}
        </div>

        <p style="font-size:13px;font-weight:500;margin-bottom:8px;">What did you see?</p>
        <textarea class="field" id="ctCollectNote" style="height:70px;" placeholder="${active.prompt}"></textarea>

        <p style="font-size:13px;font-weight:500;margin-bottom:8px;">Link to a project (optional)</p>
        <select class="field" style="color:var(--ct-text);">
          <option value="">— not linked to a specific project —</option>
          ${projects.map(p => `<option>${p.name}</option>`).join('')}
        </select>

        <p style="font-size:13px;font-weight:500;margin-bottom:8px;">Photo evidence</p>
        <label class="photo-box"><input type="file" accept="image/*" capture="environment" style="display:none" onchange="ctPhotoPreview(this)"><div class="icon">📷</div>Tap to take or upload a photo</label>

        <button class="btn btn-black btn-large" onclick="ctSubmitWithNote('ctCollectNote','Field report submitted');setTimeout(()=>location.hash='${CT_ROLES[s.role].home}',1400)">Submit report</button>
        <div class="sync-banner" style="margin-top:14px;">☁️ Saved — will sync when you're back online</div>
      </div>
      <div class="footer-note">The photo preview is real, but in this demo the image never leaves your device and submissions are not stored. In production, reports route to the relevant leader dashboards and attach to the linked project.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// GPS CAPTURE (demo) — writes plausible coordinates near the session district.
// In production this would use the device GPS; here it demonstrates that every
// field report carries a location pin.
// ---------------------------------------------------------------------------
const CT_GPS_BASE = { 'UG-KYG': [0.7021, 32.9003], 'UG-JJD': [0.4710, 33.0930], 'UG-JJC': [0.4244, 33.2041] };
function ctCaptureGPS(){
  const s = ctSess();
  const base = CT_GPS_BASE[s.geoId] || [0.4244, 33.2041];
  const lat = (base[0] + (Math.random() - 0.5) * 0.04).toFixed(5);
  const lng = (base[1] + (Math.random() - 0.5) * 0.04).toFixed(5);
  const out = document.getElementById('ctGpsOut');
  if (out) out.innerHTML = '📌 <strong>' + lat + '° N, ' + lng + '° E</strong> attached (demo coordinates)';
  ctDemoModeToast('GPS coordinates captured');
}

// ---------------------------------------------------------------------------
// NDP IV PROGRAMMES — the whole plan organised as 4 clusters / 18 programmes
// (NPA, NDP IV Table 3.3). This is the single doorway to every programme,
// including the flagship initiatives (PDM, Emyooga, UWEP/YLP) — so PDM is
// reached as ONE programme among many, not as a headline of its own.
// ---------------------------------------------------------------------------
// Map a Jinja City funded project onto its NDP IV programme (city budget lines
// carry sectors, not programme names).
function ctCityProg(p){
  if (p.programme) return p.programme;
  const map = {
    'health': 'Human Capital Development',
    'education': 'Human Capital Development',
    'roads': 'Integrated Transport Infrastructure and Services',
    'water': 'Natural Resources, Environment, Climate Change, Land and Water Management',
    'sanitation': 'Sustainable Urbanisation and Housing',
    'private sector development': 'Private Sector Development'
  };
  return map[(p.sector || '').toLowerCase()] || null;
}

// One programme row inside a cluster card.
function ctClusterProgrammeRow(dist, distId, progName, scope){
  const dimmed = scope && scope.dimProgs.some(p => ctNormProg(p) === ctNormProg(progName));
  const dimStyle = dimmed ? 'opacity:0.45;' : '';
  const dimTag = dimmed ? ' <span style="font-size:9px;color:var(--ct-text-muted);">· limited scope for your role</span>' : '';
  if (dist.dataKind === 'performance'){
    const hit = (dist.programmes || []).find(p => ctNormProg(p.name) === ctNormProg(progName)
      || ctNormProg(CT_DATA.ndp4.aliases[ctNormProg(p.name)] || '') === ctNormProg(progName));
    if (hit){
      const pct = hit.pctOfRevised != null ? hit.pctOfRevised : hit.pct;
      const cls = pct >= dist.paceTarget ? 'good' : (pct < 20 ? 'danger' : 'amber');
      return `<div class="row" style="cursor:pointer;${dimStyle}" onclick="ctProgrammeBreakdownModal('${distId}','${hit.name}')">
        <div class="row-title" style="max-width:66%;font-weight:500;">${progName}${dimTag}</div>
        <div class="row-sub" style="text-align:right;"><span class="subvalue ${cls}" style="font-weight:700;">${pct}%</span></div></div>`;
    }
    return `<div class="row" style="cursor:pointer;opacity:0.75;${dimStyle}" onclick="ctDemoModal('${progName}', 'This NDP IV programme is not itemized in the ${dist.quarter} report reviewed for this Local Government. It may be delivered through national votes or not yet funded locally — no figures are invented here.')">
      <div class="row-title" style="max-width:66%;font-weight:400;color:var(--ct-text-muted);">${progName}${dimTag}</div>
      <div class="row-sub" style="text-align:right;font-size:10.5px;">not itemized ›</div></div>`;
  }
  // Budget-kind district (Jinja City): show funded projects mapped to the programme.
  const mine = (dist.projects || []).filter(p => ctNormProg(ctCityProg(p) || '') === ctNormProg(progName));
  if (mine.length){
    const sum = mine.reduce((a, p) => a + (p.amount || 0), 0);
    return `<div class="row" style="cursor:pointer;${dimStyle}" onclick="ctProgrammeBreakdownModal('${distId}')">
      <div class="row-title" style="max-width:66%;font-weight:500;">${progName}${dimTag}</div>
      <div class="row-sub" style="text-align:right;">${mine.length} project${mine.length > 1 ? 's' : ''} · ${ctFormatUGX(sum)}</div></div>`;
  }
  return `<div class="row" style="cursor:pointer;opacity:0.75;${dimStyle}" onclick="ctDemoModal('${progName}', 'No FY2025/26 funded project under this programme appears in the budget extract reviewed for Jinja City — no figures are invented here.')">
    <div class="row-title" style="max-width:66%;font-weight:400;color:var(--ct-text-muted);">${progName}${dimTag}</div>
    <div class="row-sub" style="text-align:right;font-size:10.5px;">not funded ›</div></div>`;
}

ctRoute('#/programmes', function(){
  const s = ctSess();
  const g = ctSessGeo();
  const dist = ctSessDistrict();
  const distId = ctDistrictIdOf(s.geoId);
  const q = ctGetQuery();
  const focus = q.cluster ? CT_DATA.ndp4.clusters.find(c => c.id === q.cluster) : null;
  const scope = ctRoleScope(s.role);

  // Cluster card: programmes + a one-line health summary for this district.
  const clusterCard = (c) => {
    let summary = '';
    if (dist.dataKind === 'performance'){
      const reported = c.programmes.filter(pn =>
        (dist.programmes || []).some(p => ctNormProg(p.name) === ctNormProg(pn)
          || ctNormProg(CT_DATA.ndp4.aliases[ctNormProg(p.name)] || '') === ctNormProg(pn)));
      const behind = reported.filter(pn => {
        const hit = (dist.programmes || []).find(p => ctNormProg(p.name) === ctNormProg(pn)
          || ctNormProg(CT_DATA.ndp4.aliases[ctNormProg(p.name)] || '') === ctNormProg(pn));
        const pct = hit.pctOfRevised != null ? hit.pctOfRevised : hit.pct;
        return pct < dist.paceTarget;
      });
      summary = `${reported.length} of ${c.programmes.length} reported · <strong class="${behind.length ? 'ct-danger-text' : ''}">${behind.length} behind pace</strong>`;
    } else {
      const funded = c.programmes.filter(pn => (dist.projects || []).some(p => ctNormProg(ctCityProg(p) || '') === ctNormProg(pn)));
      summary = `${funded.length} of ${c.programmes.length} with funded FY2025/26 projects`;
    }
    const clusterDim = scope.dimClusters.includes(c.id);
    return `<div class="card cluster-card"${clusterDim ? ' style="opacity:0.55;"' : ''}>
      <div class="cluster-head" onclick="location.hash='${focus ? '#/programmes' : '#/programmes?cluster=' + c.id}'">
        <span class="cluster-icon">${c.icon}</span>
        <div style="flex:1;">
          <div class="cluster-name">${c.name}</div>
          <div class="cluster-meta">${c.programmes.length} programmes · ${summary}${clusterDim ? ' · limited scope for your role' : ''}</div>
        </div>
        <span class="chevron">›</span>
      </div>
      <div class="cluster-body" style="${focus ? '' : 'display:none;'}">
        ${c.programmes.map(pn => ctClusterProgrammeRow(dist, distId, pn, scope)).join('')}
      </div>
    </div>`;
  };

  const flags = ctFlagshipsOf(distId);
  const flagshipSection = `
    <div class="card-title" style="margin-top:20px;">Flagship initiatives under these programmes</div>
    <div style="font-size:11px;color:var(--ct-text-muted);margin-bottom:8px;">
      "Full operationalisation of the Parish Development Model and Emyooga" is an NDP IV core public project — UGX 1,594.0bn over the plan period (MoFPED IBP). Reached here as one part of the wider programme landscape.
    </div>
    <div class="card" style="padding:0;">
      ${flags.map(f => `
        <div class="row" style="cursor:pointer;" onclick="ctFlagshipModal('${distId}','${f.id}')">
          <div><div class="row-title">${f.name}</div>
          <div class="row-sub">${f.status === 'reported' ? f.summary : (f.status === 'issue' ? '⚠ ' + f.summary : 'DEMO — no geo-level figures in reviewed documents')}</div></div>
          <span class="chevron">›</span></div>`).join('')}
    </div>`;

  const belowPaceN = dist.dataKind === 'performance'
    ? dist.programmes.filter(p => (p.pctOfRevised != null ? p.pctOfRevised : p.pct) < dist.paceTarget - 15).length : 0;
  const stalledN = dist.projects.filter(p => p.stageStatus === 'stalled').length;
  const actions = (belowPaceN || stalledN) ? ctLeaderActions([
    { icon: '📞', label: 'Contact LC1 chairman on the ground' },
    { icon: '📄', label: 'Request CAO explanation' },
    { icon: '⚡', label: 'Escalate to OPM' },
    { icon: '🏛️', label: 'Table before council' }
  ], { title: `Challenges visible in this landscape (${belowPaceN} programme(s) well behind pace · ${stalledN} stalled project(s)) — options to consider` }) : '';

  return ctTopbar('Programmes', g.name + ' · 4 clusters · 18 programmes', s.role) + `
    <div class="content">
      ${ctBreadcrumb([{ label: 'Dashboard', href: CT_ROLES[s.role].home }, { label: 'Programmes' }])}
      <div class="screen-title">NDP IV — 4 clusters, 18 programmes</div>
      <div class="screen-sub">The whole Fourth National Development Plan, mapped to what ${g.name} actually reports (${dist.dataKind === 'performance' ? 'LG Performance Report, ' + dist.quarter + ' · pace target ' + dist.paceTarget + '%' : 'Approved Budget Estimates, FY2025/26'}). Tap a cluster to open its programmes; tap a programme for the district breakdown.</div>
      ${focus ? `<a href="#/programmes" style="display:inline-block;font-size:12.5px;font-weight:600;color:var(--ct-black);text-decoration:none;margin-bottom:10px;">← All clusters</a>` : ''}
      <div class="cluster-grid">
        ${(focus ? [focus] : CT_DATA.ndp4.clusters).map(clusterCard).join('')}
      </div>
      ${focus ? '' : flagshipSection}
      ${focus ? '' : ctPlugInCard()}
      ${focus ? '' : actions}
      <div class="footer-note">Structure: ${CT_DATA.ndp4.source}. District figures: ${dist.dataKind === 'performance' ? g.name + ' LG Performance Report (' + dist.quarter + '), Section A2' : 'Jinja City Approved Budget Estimates, FY2025/26'}.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// RESPONSIBILITY PANELS — every position's NDP IV responsibilities shown as
// indicators. The cluster/programme issues are shared across levels; the
// CONTRIBUTION TYPE differs per level (oversight vs delivery vs convening vs
// mobilizing vs observing). Real figures where the reviewed documents carry
// them; DEMO chips where they don't.
// ---------------------------------------------------------------------------
function ctRolePanel(roleKey){
  const s = ctSess();
  const dist = ctSessDistrict();
  const behind = dist && dist.dataKind === 'performance'
    ? dist.programmes.filter(p => (p.pctOfRevised != null ? p.pctOfRevised : p.pct) < dist.paceTarget) : [];
  const stalled = dist ? dist.projects.filter(p => p.stageStatus === 'stalled') : [];
  const funded = dist ? dist.projects.length : 0;
  const chipReal = (v, l) => `<div class="role-ind"><div class="role-ind-val">${v}</div><div class="role-ind-label">${l}</div></div>`;
  const chipDemo = (l) => `<div class="role-ind demo-ind"><div class="role-ind-val">DEMO</div><div class="role-ind-label">${l}</div></div>`;
  const defs = {
    mp: {
      title: '🏛️ Your role in NDP IV — oversight, representation & advocacy',
      note: 'Programme 14 (Legislature, Oversight and Representation) is literally your mandate: you watch the other 17.',
      chips: dist && dist.dataKind === 'performance'
        ? chipReal(behind.length, 'programmes behind pace in your district') + chipReal(stalled.length, 'stalled projects to raise') + chipDemo('questions tabled (demo counter)') + chipDemo('committee follow-ups (demo)')
        : chipReal(funded, 'funded projects in the city budget') + chipDemo('questions tabled (demo counter)') + chipDemo('committee follow-ups (demo)')
    },
    lc5: {
      title: '🏢 Your role in NDP IV — district delivery & coordination',
      note: 'You account for absorption and coordinate the technical wing (CAO) and the council.',
      chips: dist && dist.dataKind === 'performance'
        ? chipReal(dist.budget.expenditurePct + '%', 'budget absorption (' + dist.quarter + ')') + chipReal(behind.length, 'programmes behind pace') + chipReal(stalled.length, 'stalled projects') + chipDemo('council motions (demo)')
        : chipReal(ctFormatUGX(dist.budget.current), 'approved FY2025/26 budget') + chipReal(funded, 'funded projects') + chipDemo('council motions (demo)')
    },
    lc3: {
      title: '🏘️ Your role in NDP IV — convene & follow up across parishes',
      note: 'Sub-county chief: you follow up projects that span parishes and convene barazas where delivery is explained.',
      chips: chipReal(stalled.length, 'stalled projects district-wide to watch') + chipDemo('site visits logged (demo)') + chipDemo('barazas held (demo)')
    },
    lc2: {
      title: '🌾 Your role in NDP IV — mobilize the parish & verify on the ground',
      note: 'The parish is where the PDM lives (SACCO level) — and where non-financial progress is first visible.',
      chips: chipDemo('parish meetings held (demo)') + chipDemo('PDM SACCO sittings attended (demo)') + chipDemo('site checks filed (demo)')
    },
    lc1: {
      title: '🏠 Your role in NDP IV — observe & report, village by village',
      note: 'You are the eyes and ears: every school, water point, road and PDM group in the village, reported with location and photo.',
      chips: chipDemo('reports filed (demo)') + chipDemo('photo evidence attached (demo)') + chipDemo('escalations answered (demo)')
    }
  };
  const d = defs[roleKey];
  if (!d) return '';
  return `
    <div class="role-panel">
      <div class="role-panel-title">${d.title}</div>
      <div class="role-panel-note">${d.note}</div>
      <div class="role-ind-row">${d.chips}</div>
      <a href="#/programmes" style="font-size:12px;font-weight:600;color:var(--ct-black);text-decoration:none;">See how your work maps onto the 4 clusters &amp; 18 programmes →</a>
    </div>`;
}

// ---------------------------------------------------------------------------
// COMMUNITY SCORECARD — the granular, NON-FINANCIAL NDP IV signals an LC1/LC2
// is responsible for. LC1/LC2 do far more than watch construction: attendance,
// functionality, meetings, environment. Each row is a yes/no/attention signal
// per village or parish — reported through #/collect with a location pin, so
// one bad site never stands in for the whole area. All rows start unreported
// (DEMO) — no status is invented.
// ---------------------------------------------------------------------------
const CT_SCORECARD = [
  { icon: '🏫', label: 'Pupil attendance at the nearest school', aspect: 'education', prog: 'Human Capital Development' },
  { icon: '💧', label: 'Nearest water point functional', aspect: 'water', prog: 'Natural Resources & Environment' },
  { icon: '🏥', label: 'Health facility staffed, drugs in stock', aspect: 'health', prog: 'Human Capital Development' },
  { icon: '👥', label: 'PDM group active & meeting', aspect: 'pdm', prog: 'Private Sector Development / PDM' },
  { icon: '🗣️', label: 'Community meeting held on local priorities', aspect: 'community', prog: 'Development Plan Implementation' },
  { icon: '🌳', label: 'Wetlands & tree cover respected locally', aspect: 'environment', prog: 'Natural Resources & Environment' },
  { icon: '🧺', label: 'Community market operating normally', aspect: 'market', prog: 'Private Sector Development' },
  { icon: '🛣️', label: 'Access road passable this season', aspect: 'roads', prog: 'Integrated Transport' },
  { icon: '💳', label: 'Local businesses formalizing (TIN / URSB)', aspect: 'money', prog: 'Private Sector Development' }
];
function ctCommunityScorecard(levelLabel){
  return `
    <div class="card">
      <div class="card-title">${levelLabel} community scorecard — beyond infrastructure</div>
      <div style="font-size:11px;color:var(--ct-text-muted);margin-bottom:10px;">
        Your non-financial NDP IV deliverables, village by village. Nothing is reported yet — report what you see and each row lights up for <em>your</em> ${levelLabel === 'LC2' ? 'parish' : 'village'} only (every report carries a location, so no isolated incident speaks for everyone).
      </div>
      ${CT_SCORECARD.map(r => `
        <div class="score-row">
          <span class="score-icon">${r.icon}</span>
          <div style="flex:1;">
            <div class="score-label">${r.label}</div>
            <div class="score-prog">${r.prog}</div>
          </div>
          <span class="dim-chip demo">not yet reported</span>
          <a class="score-report" href="#/collect?aspect=${r.aspect}">Report →</a>
        </div>`).join('')}
    </div>`;
}

// Reads a textarea's value and echoes it in the demo toast, so entered text
// visibly is captured even though submission stays simulated.
function ctSubmitWithNote(fieldId, baseMsg){
  const el = document.getElementById(fieldId);
  const note = el && el.value ? el.value.trim() : '';
  ctDemoModeToast(baseMsg + (note ? ' — captured: "' + (note.length > 60 ? note.slice(0, 57) + '…' : note) + '"' : ' (no notes entered)'));
}

// ===========================================================================
// PART 5 — ROLE SCOPING OVER ONE TAXONOMY. Every role sees the SAME
// 4 clusters / 18 programmes; what changes is emphasis. Out-of-scope items
// are greyed/collapsed, never hidden or renamed.
// ===========================================================================
const CT_ROLE_SCOPE = {
  mp:  { dimClusters: [], dimProgs: [] },  // oversight spans all 18
  lc5: { dimClusters: [], dimProgs: [] },  // CEO of the district — all 18
  lc3: { dimClusters: [], dimProgs: ['Sustainable Extractives Industry Development', 'Manufacturing',
        'Innovation, Technology Development and Transfer', 'Sustainable Energy Development', 'Digital Transformation',
        'Legislature, Oversight and Representation', 'Administration of Justice', 'Governance and Security'] },
  lc2: { dimClusters: ['governance'], dimProgs: ['Sustainable Extractives Industry Development', 'Manufacturing',
        'Innovation, Technology Development and Transfer', 'Sustainable Energy Development', 'Digital Transformation', 'Tourism Development'] },
  lc1: { dimClusters: ['governance'], dimProgs: ['Sustainable Extractives Industry Development', 'Manufacturing',
        'Innovation, Technology Development and Transfer', 'Sustainable Energy Development', 'Digital Transformation', 'Tourism Development'] }
};
function ctRoleScope(roleKey){ return CT_ROLE_SCOPE[roleKey] || { dimClusters: [], dimProgs: [] }; }

// Compact 4-cluster strip for the LC5/LC3/LC2/LC1 dashboards — same taxonomy,
// one tap into #/programmes.
function ctClusterStrip(roleKey){
  const s = ctSess();
  const dist = ctSessDistrict();
  const g = ctSessGeo();
  const scope = ctRoleScope(roleKey);
  if (!dist) return '';
  const cells = CT_DATA.ndp4.clusters.map(c => {
    let stat;
    if (dist.dataKind === 'performance'){
      const hitFor = pn => dist.programmes.find(p => ctNormProg(p.name) === ctNormProg(pn)
        || ctNormProg(CT_DATA.ndp4.aliases[ctNormProg(p.name)] || '') === ctNormProg(pn));
      const reported = c.programmes.filter(pn => hitFor(pn));
      const behind = reported.filter(pn => { const h = hitFor(pn); return (h.pctOfRevised != null ? h.pctOfRevised : h.pct) < dist.paceTarget; });
      stat = behind.length ? `<span style="color:#F0B429;font-weight:700;">${behind.length} behind</span>` : 'on pace';
    } else {
      const mine = dist.projects.filter(p => { const cp = ctCityProg(p); return cp && c.programmes.some(pn => ctNormProg(pn) === ctNormProg(cp)); });
      stat = mine.length + ' funded';
    }
    const dim = scope.dimClusters.includes(c.id);
    return `<div class="cluster-chip${dim ? ' dim' : ''}" onclick="location.hash='#/programmes?cluster=${c.id}'">
      <span class="cluster-chip-icon">${c.icon}</span>
      <div style="min-width:0;"><div class="cluster-chip-name">${c.name}</div><div class="cluster-chip-stat">${stat}${dim ? ' · limited role scope' : ''}</div></div>
    </div>`;
  }).join('');
  return `<div class="card">
    <div class="card-title">NDP IV — the 4 clusters, ${g.shortName || g.name} scope</div>
    <div class="cluster-chip-grid">${cells}</div>
    <a href="#/programmes" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:var(--ct-black);text-decoration:none;">All 18 programmes &amp; flagship initiatives →</a>
  </div>`;
}

// ===========================================================================
// PART 5b — FLAGSHIP PARITY. ONE compact card giving MP, LC3 and LC1 the
// same PDM/Emyooga/UWEP-YLP visibility LC5/LC2 already had — one line item
// among the programme set, not a promoted feature.
// ===========================================================================
function ctFlagshipParityCard(){
  const s = ctSess();
  const flags = ctFlagshipsOf(s.geoId);
  if (!flags.length) return '';
  const line = flags.map(f =>
    f.status === 'reported' ? `<strong>${f.name.split('(')[0].trim()}:</strong> ${f.summary}`
    : f.status === 'issue' ? `<strong>${f.name.split('(')[0].trim()}:</strong> ⚠ ${f.summary}`
    : `<strong>${f.name.split('(')[0].trim()}:</strong> DEMO — no geo-level figures`).join('<br>');
  return `<div class="indicator-card clickable" onclick="location.hash='#/programmes'">
    <div class="icat">Flagship initiatives — PDM · Emyooga · UWEP/YLP</div>
    <div class="isub" style="line-height:1.55;">${line}</div>
    <div class="cta">Open under Programmes →</div>
  </div>`;
}

// ===========================================================================
// ADDENDUM A — GRANT & FUND STREAMS. Compact, collapsed-by-default secondary
// list on district-level dashboards. Statuses strictly from reviewed reports.
// ===========================================================================
function ctGrantModal(i){
  const g = (window._ctGrants || [])[i];
  if (g) ctDemoModal(g.name, g.basis + (g.status === 'notAvailable' ? ' Marked "no report" — nothing is guessed.' : ''));
}
function ctGrantStreamCard(){
  const s = ctSess();
  const streams = ctGrantStreamsOf(s.geoId);
  if (!streams.length) return '';
  window._ctGrants = streams;
  const dotCls = st => st === 'released' ? 'released' : (st === 'notreleased' ? 'notreleased' : 'na');
  const label = st => st === 'released' ? 'released' : (st === 'notreleased' ? 'NOT RELEASED' : 'no report');
  const bad = streams.filter(x => x.status === 'notreleased').length;
  return `<div class="card">
    <div class="card-title" style="cursor:pointer;" onclick="const b=document.getElementById('ctGrants');const open=b.style.display!=='none';b.style.display=open?'none':'block';document.getElementById('ctGrantsIcon').textContent=open?'▸':'▾';">Grant &amp; fund streams ${bad ? `<span class="dim-chip demo" style="background:var(--ct-red-tint);color:#791F1F;">${bad} not released</span>` : ''} <span class="expand-icon" id="ctGrantsIcon">▸</span></div>
    <div style="font-size:10.5px;color:var(--ct-text-muted);">Named funding streams from the reviewed report's underperformance causes — a secondary signal next to the flagship initiatives.</div>
    <div id="ctGrants" style="display:none;">
      ${streams.map((g, i) => `<div class="grant-row" style="cursor:pointer;" onclick="ctGrantModal(${i})"><span class="grant-dot ${dotCls(g.status)}"></span><span class="grant-name">${g.name}</span><span class="grant-status" style="color:${g.status === 'notreleased' ? 'var(--ct-red)' : 'var(--ct-text-muted)'};">${label(g.status)}</span></div>`).join('')}
    </div>
  </div>`;
}

// ===========================================================================
// PART 6 — GENERALIZED MOBILIZATION. Beyond PDM/infrastructure: the breadth
// of Human Capital Development (WASH, child protection, nutrition, girl-child
// retention, teenage pregnancy prevention) plus economic mobilization.
// LC1/LC2/LC3 (+LC5) schedule/log directly; MP gets the commission/advocate
// version consistent with an oversight role. Same data shape as collect.
// ===========================================================================
const CT_MOB_ACTIVITIES = [
  { id: 'pdm', icon: '🏘️', label: 'PDM / economic mobilization', prog: 'Flagship initiatives (PDM, Emyooga)' },
  { id: 'wash', icon: '🧼', label: 'Hygiene & WASH behaviour change', prog: 'Human Capital Development' },
  { id: 'child', icon: '🧒', label: 'Child protection & rights sensitization', prog: 'Human Capital Development' },
  { id: 'nutrition', icon: '🥗', label: 'Nutrition campaign', prog: 'Human Capital Development' },
  { id: 'girls', icon: '🎒', label: 'Girl-child school retention', prog: 'Human Capital Development' },
  { id: 'teen', icon: '🤝', label: 'Teenage pregnancy prevention', prog: 'Human Capital Development' },
  { id: 'money', icon: '💳', label: 'Money economy & tax awareness', prog: 'FY2026/27 theme — with URA tax education' },
  { id: 'formalize', icon: '📑', label: 'Business formalization drive (URSB)', prog: 'Private Sector Development' },
  { id: 'wetlands', icon: '🌿', label: 'Wetland & forest stewardship baraza', prog: 'Natural Resources & Environment' }
];
function ctMobTypePick(id){
  window._ctMobType = id;
  document.querySelectorAll('.mob-type').forEach(el => el.classList.toggle('selected', el.dataset.mob === id));
}
ctRoute('#/mobilize', function(){
  const s = ctSess();
  const g = ctSessGeo();
  const areaName = ctGeoName(s.constituencyId || s.subCountyId || s.wardId || s.cellId || s.geoId);
  const q = ctGetQuery();
  const pre = CT_MOB_ACTIVITIES.find(a => a.id === (q.type || '')) || CT_MOB_ACTIVITIES[0];
  window._ctMobType = pre.id;
  const isAdvocate = s.role === 'mp';

  const typeGrid = `<div class="mob-type-grid">
    ${CT_MOB_ACTIVITIES.map(a => `<div class="mob-type${a.id === pre.id ? ' selected' : ''}" data-mob="${a.id}" onclick="ctMobTypePick('${a.id}')">
      <div class="mob-type-icon">${a.icon}</div><div class="mob-type-label">${a.label}</div><div class="mob-type-prog">${a.prog}</div></div>`).join('')}
  </div>`;

  if (isAdvocate){
    return ctTopbar('Commission mobilization', g.name + ' · oversight role', s.role) + `
      <div class="content">
        ${ctBreadcrumb([{ label: 'Dashboard', href: CT_ROLES[s.role].home }, { label: 'Commission mobilization' }])}
        <div class="screen-title">Commission / advocate a mobilization activity</div>
        <div class="screen-sub">As MP you don't run the session — you flag the need and press the offices that do. The need you flag here routes to the district's delivery chain (simulated in this demo).</div>
        <div class="card">
          <div class="card-title">What is the need?</div>
          ${typeGrid}
          <p style="font-size:13px;font-weight:500;margin-bottom:8px;">Press through</p>
          <div class="choice-row">
            <div class="choice-btn selected" onclick="document.querySelectorAll('.choice-btn').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">Your oversight committee</div>
            <div class="choice-btn" onclick="document.querySelectorAll('.choice-btn').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">LC5 / CAO's office</div>
            <div class="choice-btn" onclick="document.querySelectorAll('.choice-btn').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">Ministry / OPM</div>
          </div>
          <p style="font-size:13px;font-weight:500;margin:12px 0 8px;">Why here, why now?</p>
          <textarea class="field" id="ctMobNote" style="height:70px;" placeholder="e.g. 3 parishes in ${areaName} have no reported PDM activity this quarter…"></textarea>
          <button class="btn btn-black btn-large" onclick="ctSubmitWithNote('ctMobNote','Need flagged with the delivery chain (' + (CT_MOB_ACTIVITIES.find(a=>a.id===window._ctMobType)||{}).label + ')')">Flag the need</button>
        </div>
        <div class="footer-note">Simulated in this demo — in production this posts to the committee clerk and the CAO's office, attached to ${areaName}.</div>
      </div>`;
  }

  return ctTopbar('Mobilize community', areaName + ', ' + g.name, s.role) + `
    <div class="content">
      ${ctBreadcrumb([{ label: 'Dashboard', href: CT_ROLES[s.role].home }, { label: 'Mobilize' }])}
      <div class="screen-title">Schedule a mobilization activity</div>
      <div class="screen-sub">The forward-looking counterpart to monitoring: barazas, sensitization sessions, door-to-door campaigns — across the whole Human Capital Development agenda, not just PDM.</div>
      <div class="card">
        <div class="card-title">Activity type</div>
        ${typeGrid}
        <p style="font-size:13px;font-weight:500;margin-bottom:8px;">Venue</p>
        <input class="login-field" id="ctMobVenue" type="text" placeholder="e.g. ${areaName} trading centre, 2:00pm" autocomplete="off" style="margin-bottom:12px;">
        <p style="font-size:13px;font-weight:500;margin-bottom:8px;">Expected attendance &amp; notes</p>
        <textarea class="field" id="ctMobNote" style="height:64px;" placeholder="e.g. 40 expected; invite the health assistant and the PDM focal point…"></textarea>
        <button class="btn btn-black btn-large" onclick="ctSubmitWithNote('ctMobNote','Mobilization activity scheduled (' + (CT_MOB_ACTIVITIES.find(a=>a.id===window._ctMobType)||{}).label + ')');setTimeout(()=>location.hash='${CT_ROLES[s.role].home}',1400)">Schedule activity</button>
        <div class="sync-banner" style="margin-top:12px;">☁️ Saved — will sync when you're back online</div>
      </div>
      <div class="footer-note">Simulated in this demo — nothing is stored. In production the activity appears on the dashboards of the leaders above and below you in the reachability network.</div>
    </div>`;
});

// ===========================================================================
// PART 7 — THE COMPASS. Data-driven "recommended next actions" per role,
// generated from what is actually in the reviewed data (stalled projects,
// behind-pace programmes, non-released grants, unreported scorecards) — never
// generic advice. The FAB opens the same recommendations as a sheet.
// ===========================================================================
function ctCompassRecs(roleKey){
  const s = ctSess();
  const dist = ctSessDistrict();
  const g = ctSessGeo();
  if (!dist) return [];
  const recs = [];
  const stalled = dist.projects.filter(p => p.stageStatus === 'stalled');
  const behind = dist.dataKind === 'performance'
    ? dist.programmes.filter(p => (p.pctOfRevised != null ? p.pctOfRevised : p.pct) < dist.paceTarget) : [];
  const grants = ctGrantStreamsOf(s.geoId).filter(x => x.status === 'notreleased');

  if (roleKey === 'mp' || roleKey === 'lc5' || roleKey === 'lc3'){
    if (stalled.length){
      const p = stalled[0];
      const twoQ = p.confirmedPersistence ? ' across two consecutive reports' : '';
      const cause = p.contributingCause ? ` (${p.contributingCause})` : '';
      const tail = roleKey === 'mp' ? '— as ' + (s.role === 'mp' ? 'MP, this is a question for your oversight committee' : '') :
                   roleKey === 'lc5' ? '— summon the CAO and that office to explain' :
                   '— follow it up on site and report upward';
      recs.push({
        text: `<strong>${p.name}</strong> has been stalled${twoQ} — <strong>${ctOfficeOf(p)}</strong> has not confirmed release${cause} ${tail}.`,
        cta: roleKey === 'lc3' ? 'Open site monitoring' : 'Open the project',
        href: roleKey === 'mp' ? `#/mp/project/${p.id}`
          : roleKey === 'lc5' ? `#/lc5/project/${CT_GEO_PREFIX[ctDistrictIdOf(s.geoId)]}${p.id}`
          : '#/lc3/monitoring'
      });
    }
    if (behind.length){
      const weakest = behind.slice().sort((a, b) => (a.pctOfRevised != null ? a.pctOfRevised : a.pct) - (b.pctOfRevised != null ? b.pctOfRevised : b.pct))[0];
      const wpct = weakest.pctOfRevised != null ? weakest.pctOfRevised : weakest.pct;
      const cl = ctClusterOf(weakest.name);
      recs.push({
        text: `<strong>${behind.length} of ${dist.programmes.length} programmes</strong> are behind the ${dist.paceTarget}% pace target — weakest is <strong>${weakest.name} (${wpct}%)</strong>. ${roleKey === 'mp' ? 'Request the CAO\'s written explanation before next quarter.' : 'Put it on the next council agenda.'}`,
        cta: 'Open the cluster', href: '#/programmes?cluster=' + (cl ? cl.id : 'governance')
      });
    }
    if (grants.length && roleKey !== 'lc3'){
      recs.push({
        text: `<strong>${grants[0].name}</strong> did not release in ${dist.quarter}${grants.length > 1 ? ` (plus ${grants.length - 1} other named stream${grants.length > 2 ? 's' : ''})` : ''} — ${roleKey === 'mp' ? 'raise it with the ministry, or escalate to OPM' : 'log it for the next budget-formance review'}.`,
        cta: 'See grant streams',
        action: "(function(){var b=document.getElementById('ctGrants');if(b){b.style.display='block';var i=document.getElementById('ctGrantsIcon');if(i)i.textContent='▾';b.scrollIntoView({behavior:'smooth',block:'center'});}})()"
      });
    }
    if (dist.dataKind === 'budget'){
      const p = dist.projects[0];
      recs.push({
        text: `<strong>${p.name}</strong> is funded (${ctFormatUGX(p.amount)}) but <strong>not yet field-verified</strong> — ask the LC1 under whose jurisdiction it lies to file a status report with photo.`,
        cta: 'Open field collection', href: '#/collect'
      });
    }
    {
      const lr = dist.localRevenuePct;
      recs.push({
        text: lr != null
          ? `<strong>Local revenue is at ${lr}%</strong> of expectation (${dist.quarter}) — the report blames "${dist.localRevenueCause}". The FY2026/27 theme (full monetisation) starts with opinion: ${roleKey === 'mp' ? 'commission a money-economy outreach with URA &amp; URSB for your constituency' : 'host a money-economy baraza with URA &amp; URSB'}.`
          : `The FY2026/27 budget theme is <strong>full monetisation of the economy</strong> — ~33% of households are still subsistence. No money-economy outreach is on record for your area: ${roleKey === 'mp' ? 'commission one with URA &amp; URSB' : 'schedule a baraza with URA tax education &amp; URSB registration'}.`,
        cta: roleKey === 'mp' ? 'Commission the outreach' : 'Schedule the outreach', href: '#/mobilize?type=money'
      });
    }
  } else {
    // LC2 / LC1 — ground-truth & mobilization framing
    recs.push({
      text: `Your <strong>community scorecard has 8 unreported signals</strong> (school, water, health, PDM group, meetings, environment, market, road) — file your first report so your ${roleKey === 'lc2' ? 'parish' : 'village'} speaks for itself, with location.`,
      cta: 'Report a signal', href: '#/collect'
    });
    const nearProj = s.wardId || s.cellId ? dist.projects.find(p => p.wardId === s.wardId || p.cellId === s.cellId || p.subCountyId === s.subCountyId) : null;
    if (nearProj){
      recs.push({
        text: `<strong>${nearProj.name}</strong> is funded (${ctFormatUGX(nearProj.amount)}) but construction status is <strong>not yet verified on the ground</strong> — you are the verification.`,
        cta: 'Report what you see', href: roleKey === 'lc1' ? '#/lc1/report' : '#/collect'
      });
    }
    recs.push({
      text: `No mobilization activity is on record for your area this quarter — the FY2026/27 theme asks leaders to <strong>shape opinion on joining the money economy</strong> (TIN with URA, business names with URSB) and on <strong>protecting wetlands &amp; forests</strong>, alongside the usual barazas.`,
      cta: 'Schedule an activity', href: '#/mobilize?type=money'
    });
  }
  return recs.slice(0, 3);
}

function ctCompassPanel(roleKey){
  const recs = ctCompassRecs(roleKey);
  if (!recs.length) return '';
  return `
    <div class="compass-panel">
      <div class="compass-head">
        <img src="${CT_COMPASS_LOGO}" alt="CivicTrack compass">
        <div>
          <div class="compass-title">Your compass — recommended next actions</div>
          <div class="compass-sub">Generated from this geography's actual reviewed data, not generic advice</div>
        </div>
      </div>
      ${recs.map((r, i) => `
        <div class="compass-rec" onclick="${r.action ? r.action : `location.hash='${r.href}'`}">
          <span class="compass-rec-num">${i + 1}</span>
          <div class="compass-rec-text">${r.text}<div class="compass-rec-cta">${r.cta} →</div></div>
        </div>`).join('')}
    </div>`;
}

// FAB entry point — the same compass recommendations as a modal sheet.
function ctCompassSheet(roleKey){
  const recs = ctCompassRecs(roleKey);
  ctOpenModal(`
    <h3>🧭 Recommended next actions</h3>
    <div style="font-size:11px;color:var(--ct-text-secondary);margin-bottom:10px;">From your geography's actual reviewed data.</div>
    ${recs.map((r, i) => `
      <div class="compass-rec" style="background:var(--ct-yellow-soft);border-color:var(--ct-border);cursor:pointer;" onclick="ctCloseModal();${r.action ? r.action : `location.hash='${r.href}'`}">
        <span class="compass-rec-num">${i + 1}</span>
        <div class="compass-rec-text" style="color:var(--ct-text);">${r.text}<div class="compass-rec-cta">${r.cta} →</div></div>
      </div>`).join('')}
    <div class="action-chip-row" style="margin-top:14px;">
      <button class="action-chip" onclick="ctCloseModal();location.hash='#/collect'"><span class="action-icon">📋</span>Collect field data</button>
      <button class="action-chip" onclick="ctCloseModal();location.hash='#/mobilize'"><span class="action-icon">📣</span>${roleKey === 'mp' ? 'Commission mobilization' : 'Schedule mobilization'}</button>
      <button class="action-chip" onclick="ctCloseModal();location.hash='#/programmes'"><span class="action-icon">🧭</span>Programmes</button>
    </div>`, { wide: false });
}

// ADDENDUM C — office attribution block: responsible district office (structural
// inference from the project's sector) + DEMO-flagged release expectation.
function ctOfficeBlock(dist, proj){
  return `
    <div class="row"><div class="row-title">Responsible office</div><div class="row-sub" style="text-align:right;max-width:60%;">${ctOfficeOf(proj)}</div></div>
    <div style="font-size:10.5px;color:var(--ct-text-muted);background:var(--ct-panel-grey);border-radius:8px;padding:8px 10px;margin-top:6px;">
      <span class="dim-chip demo" style="margin-right:4px;">DEMO</span>${ctOfficeReleaseNote(dist, proj)}
    </div>`;
}

// ---------------------------------------------------------------------------
// MONEY ECONOMY & STEWARDSHIP — the FY2026/27 budget theme as a plug-in card:
// who leaders connect citizens to (URA, URSB, local councils, NEMA/NFA) and
// what opinion-shaping looks like. Lives under Programmes as a compact
// secondary section — never competing with the 4 clusters for priority.
// ---------------------------------------------------------------------------
function ctInstitutionModal(i){
  const t = (window._ctInstitutions || [])[i];
  if (!t) return;
  const forms = CT_DATA.moneyEconomy.forms.map(f =>
    `<div class="row"><div><div class="row-title" style="font-size:12px;">${f.form}</div><div class="row-sub">${f.note}</div></div></div>`).join('');
  ctOpenModal(`
    <h3>${t.icon} ${t.name}</h3>
    <p style="font-size:12px;color:var(--ct-text-secondary);line-height:1.6;">${t.role}</p>
    <p style="font-size:12px;line-height:1.6;"><strong>How a leader plugs in:</strong> ${t.plugIn}</p>
    ${t.id === 'ursb' || t.id === 'ura' ? '<div class="card-title" style="margin-top:8px;">The three states a trader can be in</div><div class="card" style="margin:0;box-shadow:none;padding:0;">' + forms + '</div>' : ''}
    <div class="footer-note">Contact is simulated in this demo — in production this opens the institution's district focal point.</div>
    <div class="action-chip-row" style="margin-top:12px;">
      <button class="action-chip" onclick="ctCloseModal();location.hash='#/mobilize?type=${t.id === 'nema-nfa' ? 'wetlands' : (t.id === 'ursb' ? 'formalize' : 'money')}'"><span class="action-icon">📣</span>Schedule an outreach (demo)</button>
      <button class="action-chip" onclick="ctDemoModeToast('Contact ${t.name.split(' — ')[0]}')"><span class="action-icon">📞</span>Contact focal point (demo)</button>
    </div>`, { wide: true });
}
function ctPlugInCard(){
  const dist = ctSessDistrict();
  const g = ctSessGeo();
  const me = CT_DATA.moneyEconomy;
  window._ctInstitutions = me.institutions;
  const lrLine = dist.localRevenuePct != null
    ? `<strong>${g.name}: local revenue at ${dist.localRevenuePct}%</strong> of its budget expectation (${dist.quarter}) — the report blames "${dist.localRevenueCause}"`
    : `Local-revenue performance is not itemized in the reviewed ${g.name} documents — shown honestly as a gap, not guessed.`;
  return `
    <div class="card-title" style="margin-top:20px;">The FY2026/27 theme in your area — money economy &amp; stewardship</div>
    <div style="font-size:11px;color:var(--ct-text-muted);margin-bottom:8px;">
      "${me.theme}" (${me.themeFY}). Leaders don't collect tax — they shape opinion and plug citizens into the right institutions.
    </div>
    <div class="card">
      <div style="font-size:11.5px;color:var(--ct-text-secondary);line-height:1.6;margin-bottom:10px;">${lrLine}</div>
      ${me.institutions.map((t, i) => `
        <div class="row" style="cursor:pointer;" onclick="ctInstitutionModal(${i})">
          <div style="display:flex;gap:10px;align-items:flex-start;"><span style="font-size:18px;">${t.icon}</span>
          <div><div class="row-title" style="font-size:12.5px;">${t.name}</div>
          <div class="row-sub">${t.plugIn}</div></div></div>
          <span class="chevron">›</span></div>`).join('')}
      <div class="action-chip-row" style="margin-top:10px;">
        <button class="action-chip" onclick="location.hash='#/mobilize?type=money'"><span class="action-icon">💳</span>Money-economy baraza</button>
        <button class="action-chip" onclick="location.hash='#/mobilize?type=formalize'"><span class="action-icon">📑</span>URSB formalization drive</button>
        <button class="action-chip" onclick="location.hash='#/mobilize?type=wetlands'"><span class="action-icon">🌿</span>Wetland stewardship</button>
      </div>
      <div class="footer-note" style="margin-top:8px;">National context: ${me.national.domesticRevenue} domestic revenue target · ${me.national.subsistence}. Source: ${me.source}.</div>
    </div>`;
}
