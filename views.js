/* ============================================================================
   CIVICTRACK VIEWS
   Each function returns an HTML string for the #app mount point.
   Registered against the router in app.js via ctRoute(path, fn).
   ========================================================================= */

const D = CT_DATA; // shorthand

// Combined, prefixed project list for LC5's cross-district project view —
// used by the prev/next navigation on LC5 project detail screens.
const CT_LC5_PROJECTS = [
  ...D.kayunga.projects.map(p => ({ id: 'kyg-' + p.id, name: p.name })),
  ...D.jinjaDistrict.projects.map(p => ({ id: 'jd-' + p.id, name: p.name }))
];

const CT_ROLE_DESC = {
  mp:  "Constituency-level oversight & advocacy",
  lc5: "District-level performance & comparison",
  lc3: "Sub-county contractor & service monitoring",
  lc2: "Parish-level project oversight & mobilization",
  lc1: "Village-level field reporting"
};

// ---------------------------------------------------------------------------
// DASHBOARD TILE MODALS — every clickable tile resolves to one of these.
// Real figures use ctInfoModal; anything without a verified source uses
// ctDemoModal, so nothing is ever a dead click.
// ---------------------------------------------------------------------------
function ctMPMoreProgrammesModal(){
  const k = D.kayunga;
  const extra = ['Private Sector Development', 'Digital Transformation', 'Tourism Development'];
  const rows = extra.map(name => {
    const p = k.programmes.find(pr => pr.name === name);
    return `<div class="row"><div class="row-title">${name}</div><div class="row-sub" style="text-align:right;">${p.pct}% of ${ctFormatUGX(p.approved)} released</div></div>`;
  }).join('');
  ctInfoModal('More NDP IV Programmes — Kayunga', `<div class="card" style="margin:0;box-shadow:none;padding:0;">${rows}</div>`,
    'Source: Kayunga District LG Quarterly Performance Report, FY2025/26 Q2, Section A2.');
}

function ctPDMModal(distKey){
  const dist = D[distKey];
  if (!dist || !dist.pdm){
    ctDemoModal('Parish Development Model', 'PDM figures for this Local Government were not available in the report reviewed for this prototype.');
    return;
  }
  const pdm = dist.pdm;
  ctInfoModal('Parish Development Model — ' + dist.name, `
    <div class="card" style="margin:0;box-shadow:none;padding:0;">
      <div class="row"><div class="row-title">Households facilitated</div><div class="row-sub" style="text-align:right;">${pdm.householdsFacilitated.toLocaleString()}</div></div>
      <div class="row"><div class="row-title">Parishes covered</div><div class="row-sub" style="text-align:right;">${pdm.parishes}</div></div>
      <div class="row"><div class="row-title">Parish Chief monthly allowance</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(pdm.parishChiefAllowance)}</div></div>
    </div>`,
    'Source: ' + dist.name + ' LG Quarterly Performance Report, FY2025/26 Q2.');
}

function ctLC3MetricModal(which){
  const c = D.jinjaCity;
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

function ctLC2NamulesaModal(){
  const proj = D.jinjaCity.projects.find(p => p.id === 'namulesa-market');
  ctInfoModal('Namulesa Market completion', `
    <div class="card" style="margin:0;box-shadow:none;padding:0;">
      <div class="row"><div class="row-title">Funded amount</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(proj.amount)}</div></div>
      <div class="row"><div class="row-title">Location</div><div class="row-sub" style="text-align:right;">${proj.location}</div></div>
      <div class="row"><div class="row-title">Stage</div><div class="row-sub" style="text-align:right;">Funded, FY2025/26 — completion works</div></div>
    </div>`, 'Source: Jinja City Approved Budget Estimates, FY2025/26.');
}

function ctLC1ProjectModal(){
  const proj = D.jinjaCity.projects.find(p => p.id === 'namulesa-market');
  ctInfoModal(proj.name, `
    <div class="card" style="margin:0;box-shadow:none;padding:0;">
      <div class="row"><div class="row-title">Funded amount</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(proj.amount)}</div></div>
      <div class="row"><div class="row-title">Ward</div><div class="row-sub" style="text-align:right;">Jinja North Ward</div></div>
      <div class="row"><div class="row-title">On-the-ground status</div><div class="row-sub" style="text-align:right;">Not yet field-verified</div></div>
    </div>`, 'Source: Jinja City Approved Budget Estimates, FY2025/26.');
}

// ---------------------------------------------------------------------------
// LOGIN — STEP 1: SELECT POSITION
// ---------------------------------------------------------------------------
ctRoute('#/login', function(){
  return `
    <div class="login-wrap" style="max-width:720px;">
      <div class="login-card card" style="padding-bottom:26px;">
        <div class="login-logo-row">
          <div class="logo"></div>
          <img src="NICE_UG_Logo.png" alt="NICE-UG" class="nice-ug-logo login-nice-logo">
        </div>
        <h1>CivicTrack</h1>
        <p>Select your position to see NDP IV tracked at your level of leadership.</p>
      </div>

      <div class="role-grid" style="padding:var(--space-5) 0 0;">
        ${Object.keys(CT_ROLES).map(r => `
          <div class="role-card card" onclick="ctSetPendingRole('${r}')">
            <div class="role-icon" style="display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;">${CT_ROLES[r].badge}</div>
            <div class="role-name">${CT_ROLES[r].label}</div>
            <div class="role-desc">${CT_ROLE_DESC[r]}</div>
          </div>`).join('')}
      </div>

      <p style="text-align:center;font-size:11px;color:var(--ct-text-muted);margin-top:20px;max-width:440px;margin-left:auto;margin-right:auto;">
        These 5 roles have real data behind them in this prototype. Additional institutional roles — Ministry, NPA, District Planner, CAO, RDC, Inspector, Development Partner — are planned for a later phase, once real data feeds for each are confirmed. They are not shown here to avoid demonstrating them with invented information.
      </p>
    </div>`;
});

// ---------------------------------------------------------------------------
// LOGIN — STEP 2: DEMO SIGN-IN (role already chosen; no real credentials
// are required in this prototype — the demo access button skips them)
// ---------------------------------------------------------------------------
ctRoute('#/signin', function(){
  const pendingKey = ctGetPendingRole();
  const role = CT_ROLES[pendingKey];
  if (!role){ return ''; } // router already redirects to #/login when this happens
  return `
    <div class="login-wrap">
      <div class="login-card card">
        <div class="login-logo-row">
          <div class="logo"></div>
          <img src="NICE_UG_Logo.png" alt="NICE-UG" class="nice-ug-logo login-nice-logo">
        </div>
        <h1>Sign in</h1>
        <p>Signing in as <strong>${role.label}</strong>. <a href="#/login" style="color:var(--ct-black);font-weight:600;text-decoration:none;">Not you? Choose a different role →</a></p>

        <div class="login-field-label">Official phone number or Staff ID</div>
        <div class="login-field">e.g. 07XX XXX XXX or LC5-KYG-014</div>

        <div class="login-field-label">Password</div>
        <div class="login-field">••••••••••</div>

        <button class="btn btn-black btn-large" onclick="ctToast('Real sign-in is not part of this demo — use demo access below.')">Sign in</button>
        <button class="btn" onclick="ctToast('OTP flow is not part of this demo — use demo access below.')">Sign in with OTP instead</button>

        <button class="btn btn-yellow btn-large" style="margin-top:12px;" onclick="ctSetSession('${pendingKey}');location.hash=CT_ROLES['${pendingKey}'].home;">Continue with demo access →</button>

        <div class="verify-note">
          <strong>How your identity is verified:</strong> against the Electoral Commission's elected office-holder roll and the Ministry of Local Government's LC1–LC5 structure records. NICE-UG does not issue credentials independently. <strong>This prototype does not require real credentials</strong> — use "Continue with demo access" above.
        </div>
        <div class="help-link">New here? <a href="#" onclick="ctToast('Field support officer contact — demo only.');return false;">Contact your sub-region field support officer →</a></div>
      </div>
    </div>`;
});

// ---------------------------------------------------------------------------
// MP — DASHBOARD
// ---------------------------------------------------------------------------
ctRoute('#/mp/dashboard', function(){
  const k = D.kayunga;
  const stalled = k.projects.filter(p => p.stageStatus === 'stalled').length;
  return ctTopbar('Hon. [MP Name] — Kayunga North County', 'Kayunga District, Central Region', 'mp') + `
    <div class="content">
      <div class="screen-title">Dashboard</div>
      <div class="screen-sub">NDP IV Programmes active in Kayunga — the same 11 government-wide Programmes NDP IV uses nationally, tracked here at constituency level</div>

      <div class="indicator-grid">
        ${ctProgrammeTile(k.programmes.find(p=>p.name==='Human Capital Development'), {paceTarget:k.paceTarget, uidSuffix:'mp'})}
        ${ctProgrammeTile(k.programmes.find(p=>p.name==='Integrated Transport Infrastructure and Services'), {paceTarget:k.paceTarget, uidSuffix:'mp'})}
        ${ctProgrammeTile(k.programmes.find(p=>p.name==='Governance and Security'), {paceTarget:k.paceTarget, uidSuffix:'mp'})}
        ${ctProgrammeTile(k.programmes.find(p=>p.name==='Public Sector Transformation'), {paceTarget:k.paceTarget, uidSuffix:'mp'})}
        ${ctProgrammeTile(k.programmes.find(p=>p.name==='Agro-Industrialization'), {paceTarget:k.paceTarget, uidSuffix:'mp'})}
        ${ctProgrammeTile(k.programmes.find(p=>p.name==='Development Plan Implementation'), {paceTarget:k.paceTarget, uidSuffix:'mp'})}
        ${ctProgrammeTile(k.programmes.find(p=>p.name==='Regional Balanced Development'), {paceTarget:k.paceTarget, uidSuffix:'mp'})}
        ${ctProgrammeTile(k.programmes.find(p=>p.name==='Natural Resources, Environment, Climate Change, Land and Water Management'), {paceTarget:k.paceTarget, uidSuffix:'mp'})}
        <a href="#/mp/projects" style="text-decoration:none;">
          <div class="indicator-card clickable" style="border-color:#E29A9A;background:var(--ct-red-tint);">
            <div class="icat" style="color:#791F1F;">Projects</div>
            <div class="ival danger">${stalled} stalled</div>
            <div class="isub">of ${k.projects.length} tracked capital projects</div>
            <div class="cta">View all projects →</div>
          </div>
        </a>
        <div class="indicator-card clickable" onclick="ctMPMoreProgrammesModal()">
          <div class="icat">More Programmes</div>
          <div class="ival" style="color:var(--ct-text-secondary);font-size:16px;">+3 more</div>
          <div class="isub">Private Sector Dev (40%) · Digital Transformation (34%) · Tourism (25%)</div>
          <div class="cta">View detail →</div>
        </div>
        <div class="indicator-card clickable" onclick="ctPDMModal('kayunga')">
          <div class="icat">Parish Development Model</div>
          <div class="ival good">${k.pdm.householdsFacilitated.toLocaleString()}</div>
          <div class="isub">households facilitated across ${k.pdm.parishes} parishes</div>
          <div class="cta">View detail →</div>
        </div>
      </div>
      <div class="footer-note">Sample screen — every figure sourced from Kayunga District's own Local Government Quarterly Performance Report, FY2025/26 (Q2), Section A2.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// MP — PROJECTS LIST
// ---------------------------------------------------------------------------
ctRoute('#/mp/projects', function(){
  const k = D.kayunga;
  return ctTopbar('Hon. [MP Name] — Kayunga North County', 'Projects › Kayunga North', 'mp') + `
    <div class="content">
      ${ctBreadcrumb([{label:'Dashboard', href:'#/mp/dashboard'},{label:'Projects'}])}
      <div class="screen-title">Projects in my constituency</div>
      <div class="screen-sub">Every discrete capital project whose beneficiary geography includes Kayunga North County</div>
      <div class="filter-strip">
        <span class="filter-chip active">All stages (${k.projects.length})</span>
        <span class="filter-chip">Stalled (${k.projects.filter(p=>p.stageStatus==='stalled').length})</span>
        <span class="filter-chip">Pending (${k.projects.filter(p=>p.stageStatus==='pending').length})</span>
        <span class="filter-chip">On track / Complete (${k.projects.filter(p=>['ontrack','complete'].includes(p.stageStatus)).length})</span>
      </div>
      <div class="card">
        ${k.projects.map(p => ctProjectRow(p, '#/mp/project/')).join('')}
      </div>
      <div class="footer-note">Click any row to open its full detail and oversight screen.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// MP — PROJECT DETAIL (Bbaale HC IV) — the flagship drill chain
// ---------------------------------------------------------------------------
ctRoute('#/mp/project/bbaale-hc4', function(){
  const proj = D.kayunga.projects.find(p => p.id === 'bbaale-hc4');
  const related = proj.relatedFacilities.map(id => D.kayunga.projects.find(p => p.id === id));
  return ctTopbar('Hon. [MP Name] — Kayunga North County', 'Projects › ' + proj.name, 'mp') + `
    <div class="content">
      ${ctBreadcrumb([{label:'Dashboard', href:'#/mp/dashboard'},{label:'Projects', href:'#/mp/projects'},{label:proj.name}])}
      ${ctPrevNextNav(D.kayunga.projects, proj.id, '#/mp/project/')}

      <div class="alert-banner">
        <div class="alert-banner-title">Uganda ranks second-worst globally for project delays — World Bank</div>
        <div class="alert-banner-source">Cited by the Secretary to the Treasury, 2026 Public Procurement Cadre Forum</div>
      </div>

      <div class="screen-title">${proj.name}</div>
      <div class="screen-sub">${proj.sector} facility · ${proj.location}, Kayunga District</div>

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
          ${ctDrillTabs([{label:'Overview',id:'overview'},{label:'Timeline',id:'timeline'},{label:'Related Facilities',id:'related'}])}

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
            ${ctConstitutionalNote('MPs do not personally fund projects. This toolkit supports oversight, coordination, and advocacy — raising issues, requesting briefings, and escalating blockers to the government agency actually responsible for delivery.')}
          </div>
          <div class="card">
            <div class="card-title">Other MPs facing the same gap</div>
            <span class="ally-chip" style="cursor:pointer;" onclick="ctDemoModal('Bukamba constituency MP', 'Cross-MP coordination workflows are not yet built in this prototype.')"><span class="avatar"></span>Bukamba constituency MP</span>
            <span class="ally-chip" style="cursor:pointer;" onclick="ctDemoModal('Ntenjeru North MP', 'Cross-MP coordination workflows are not yet built in this prototype.')"><span class="avatar"></span>Ntenjeru North MP</span>
          </div>
        </div>
      </div>
      <div class="footer-note">Sample screen — figures sourced from the Kayunga District LG Quarterly Performance Report, FY2025/26, and PPDA Regulations.</div>
    </div>`;
});

// generic detail route for the other, non-flagship Kayunga projects (lighter template)
Object.values(D.kayunga.projects).forEach(function(proj){
  if (CT_ROUTES['#/mp/project/' + proj.id]) return;
  ctRoute('#/mp/project/' + proj.id, function(){
    return ctTopbar('Hon. [MP Name] — Kayunga North County', 'Projects › ' + proj.name, 'mp') + `
      <div class="content">
        ${ctBreadcrumb([{label:'Dashboard', href:'#/mp/dashboard'},{label:'Projects', href:'#/mp/projects'},{label:proj.name}])}
        ${ctPrevNextNav(D.kayunga.projects, proj.id, '#/mp/project/')}
        <div class="screen-title">${proj.name}</div>
        <div class="screen-sub">${proj.sector} · ${proj.location} · NDP IV Programme: ${proj.programme}</div>
        <div class="card">
          <div class="card-title">Status</div>
          <div class="row"><div class="row-title">Current stage</div>${ctStatusPill(proj.stageStatus)}</div>
          <div class="row"><div class="row-title">District report says</div><div class="row-sub" style="text-align:right;">"${proj.statusQuote}"</div></div>
        </div>
        <div class="footer-note">Sample screen — Kayunga District LG Quarterly Performance Report, FY2025/26.</div>
      </div>`;
  });
});

// ---------------------------------------------------------------------------
// LC5 — DASHBOARD (Kayunga vs Jinja District comparison)
// ---------------------------------------------------------------------------
ctRoute('#/lc5/dashboard', function(){
  const k = D.kayunga, j = D.jinjaDistrict;
  return ctTopbar('District Council Dashboard', 'Comparing two real Local Governments, by NDP IV Programme', 'lc5') + `
    <div class="content">
      <div class="screen-title">Dashboard</div>
      <div class="screen-sub">Same 11 NDP IV Programmes, two districts — pace-adjusted, since each reports a different quarter</div>

      <div class="card" style="background:var(--ct-panel-grey);border-style:dashed;">
        <div style="font-size:12px;color:#4A4943;">
          <strong>Reading this fairly:</strong> Kayunga's report is for ${k.quarter} (pace target ${k.paceTarget}%). Jinja District's report is for ${j.quarter} (pace target ${j.paceTarget}%). Figures below are shown against each district's own pace target, not against each other directly.
        </div>
      </div>

      <div class="compare-grid">
        <div class="compare-card">
          <h4>${k.name}</h4>
          <div class="compare-type">Rural · ${k.region} · ${k.quarter} · pace target ${k.paceTarget}%</div>
          <div class="compare-row"><span class="label">Overall released</span><span class="value amber">${k.budget.expenditurePct}%</span></div>
          <div class="compare-row"><span class="label">Human Capital Development</span><span class="value amber">${k.programmes.find(p=>p.name==='Human Capital Development').pct}%</span></div>
          <div class="compare-row"><span class="label">Integrated Transport Infrastructure</span><span class="value amber">${k.programmes.find(p=>p.name==='Integrated Transport Infrastructure and Services').pct}%</span></div>
          <div class="compare-row"><span class="label">Public Sector Transformation</span><span class="value danger">${k.programmes.find(p=>p.name==='Public Sector Transformation').pct}%</span></div>
          <div class="compare-row"><span class="label">Stalled projects flagged</span><span class="value danger">${k.projects.filter(p=>p.stageStatus==='stalled').length}</span></div>
          <div class="compare-row" style="cursor:pointer;" onclick="ctPDMModal('kayunga')"><span class="label">PDM households facilitated</span><span class="value good">${k.pdm.householdsFacilitated.toLocaleString()} ›</span></div>
        </div>
        <div class="compare-card">
          <h4>${j.name}</h4>
          <div class="compare-type">Rural fringe · ${j.region} · ${j.quarter} · pace target ${j.paceTarget}%</div>
          <div class="compare-row"><span class="label">Overall released</span><span class="value good">${j.budget.expenditurePct}%</span></div>
          <div class="compare-row"><span class="label">Human Capital Development</span><span class="value good">${j.programmes.find(p=>p.name==='Human Capital Development').pct}%</span></div>
          <div class="compare-row"><span class="label">Integrated Transport Infrastructure</span><span class="value danger">${j.programmes.find(p=>p.name==='Integrated Transport Infrastructure and Services').pct}%</span></div>
          <div class="compare-row"><span class="label">Sustainable Urbanisation &amp; Housing</span><span class="value danger">${j.programmes.find(p=>p.name==='Sustainable Urbanisation and Housing').pct}%</span></div>
          <div class="compare-row"><span class="label">Stalled projects flagged</span><span class="value danger">${j.projects.filter(p=>p.stageStatus==='stalled').length}+</span></div>
          <div class="compare-row"><span class="label">PDM households facilitated</span><span class="value" style="color:var(--ct-text-muted);font-weight:500;font-size:12px;">not in report reviewed</span></div>
        </div>
      </div>

      <div class="card" style="margin-top:6px;">
        <div style="font-size:12px;color:var(--ct-text-secondary);">
          <strong>What this shows:</strong> Kayunga is running roughly on pace overall, but its Public Sector Transformation Programme is badly behind. Jinja District is close to on-pace overall for Q1, but its Integrated Transport Infrastructure (7%) and Sustainable Urbanisation &amp; Housing (0%) Programmes are the ones to watch.
        </div>
      </div>

      <a href="#/lc5/projects" style="text-decoration:none;">
        <div class="indicator-card clickable" style="border-color:#E29A9A;background:var(--ct-red-tint);margin-top:16px;">
          <div class="icat" style="color:#791F1F;">Projects</div>
          <div class="ival danger">4 stalled across both districts</div>
          <div class="isub">Kayunga: Bbaale HC IV, Bukamba HC III, Nkokonjeru RGC · Jinja: Buwolero–Kitanaba road</div>
          <div class="cta">View all projects →</div>
        </div>
      </a>
      <div class="footer-note">Sample screen — Kayunga: FY2025/26 Q2. Jinja: FY2025/26 Q1. Both use the same NDP IV Programme structure.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// LC5 — PROJECTS (tabbed)
// ---------------------------------------------------------------------------
ctRoute('#/lc5/projects', function(){
  const k = D.kayunga, j = D.jinjaDistrict;
  return ctTopbar('District Council Dashboard', 'Projects › Both districts', 'lc5') + `
    <div class="content">
      ${ctBreadcrumb([{label:'Dashboard', href:'#/lc5/dashboard'},{label:'Projects'}])}
      <div class="screen-title">Projects</div>
      ${ctDrillTabs([{label:`Kayunga District (${k.projects.length})`,id:'kayunga'},{label:`Jinja District (${j.projects.length})`,id:'jinja'}])}
      <div class="drill-panel active" data-panel="kayunga">
        <div class="card">${k.projects.map(p => ctProjectRow(p, '#/lc5/project/kyg-')).join('')}</div>
      </div>
      <div class="drill-panel" data-panel="jinja">
        <div class="card">${j.projects.map(p => ctProjectRow(p, '#/lc5/project/jd-')).join('')}</div>
      </div>
      <div class="footer-note">Sample screen — Jinja District items sourced from its FY2024/25 Q4 and FY2025/26 Q1 reports.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// LC5 — PROJECT DETAIL (Buwolero-Kitanaba road)
// ---------------------------------------------------------------------------
ctRoute('#/lc5/project/jd-buwolero-road', function(){
  const proj = D.jinjaDistrict.projects.find(p => p.id === 'buwolero-road');
  return ctTopbar('District Council Dashboard', 'Projects › Jinja District › ' + proj.name, 'lc5') + `
    <div class="content">
      ${ctBreadcrumb([{label:'Dashboard', href:'#/lc5/dashboard'},{label:'Projects', href:'#/lc5/projects'},{label:proj.name}])}
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
          </div>
        </div>
        <div>
          <div class="card">
            <div class="card-title">Advocacy &amp; Lobbying Toolkit</div>
            <p style="font-size:12px;color:var(--ct-text-secondary);margin-bottom:12px;">A terrain-related blocker plus a funding-release problem — two distinct asks.</p>
            <button class="btn btn-red" onclick="ctDemoModeToast('Parliamentary Question drafted')">Draft Parliamentary Question — URF release</button>
            <button class="btn" onclick="ctDemoModeToast('Engineering assessment requested')">Request engineering assessment</button>
            <button class="btn" onclick="ctDemoModeToast('Escalated to Uganda Road Fund')">Escalate to Uganda Road Fund</button>
            ${ctConstitutionalNote("the District Council's role is oversight and coordination — verifying, escalating, and holding the Uganda Road Fund and contractor accountable — not directly financing the repair itself.")}
          </div>
        </div>
      </div>
      <div class="footer-note">Sample screen — Jinja District LG Performance Reports.</div>
    </div>`;
});

// generic fallback for remaining LC5-listed projects (kyg-*, jd-*)
[...D.kayunga.projects.map(p=>({...p, prefix:'kyg-'})), ...D.jinjaDistrict.projects.map(p=>({...p, prefix:'jd-'}))].forEach(function(proj){
  const key = '#/lc5/project/' + proj.prefix + proj.id;
  if (CT_ROUTES[key]) return;
  ctRoute(key, function(){
    return ctTopbar('District Council Dashboard', 'Projects › ' + proj.name, 'lc5') + `
      <div class="content">
        ${ctBreadcrumb([{label:'Dashboard', href:'#/lc5/dashboard'},{label:'Projects', href:'#/lc5/projects'},{label:proj.name}])}
        ${ctPrevNextNav(CT_LC5_PROJECTS, proj.prefix + proj.id, '#/lc5/project/')}
        <div class="screen-title">${proj.name}</div>
        <div class="screen-sub">${proj.sector} · ${proj.location}</div>
        <div class="card">
          <div class="row"><div class="row-title">Current stage</div>${ctStatusPill(proj.stageStatus)}</div>
          <div class="row"><div class="row-title">Report says</div><div class="row-sub" style="text-align:right;">"${proj.statusQuote||''}"</div></div>
        </div>
      </div>`;
  });
});

// ---------------------------------------------------------------------------
// LC3 — DASHBOARD (Jinja City, Mpumudde Division)
// ---------------------------------------------------------------------------
ctRoute('#/lc3/dashboard', function(){
  const c = D.jinjaCity;
  const mpumudde = c.projects.find(p => p.id === 'mpumudde-hc4');
  return ctTopbar('Mpumudde Division', 'Jinja City, Eastern Region', 'lc3') + `
    <div class="content">
      <div class="screen-title">Dashboard</div>
      <div class="screen-sub">NDP IV Programmes budgeted for Jinja City, FY2025/26</div>
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
        <div class="metric-value good">${ctFormatUGX(c.projects.find(p=>p.id==='namulesa-market').amount)}</div>
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
      <div class="footer-note">Sample screen — Jinja City's approved FY2025/26 Budget Estimates, organized by NDP IV Programme.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// LC3 — MONITORING (Mpumudde HC IV site visit)
// ---------------------------------------------------------------------------
ctRoute('#/lc3/monitoring', function(){
  const proj = D.jinjaCity.projects.find(p => p.id === 'mpumudde-hc4');
  return ctTopbar('Mpumudde Division', 'Projects › ' + proj.name, 'lc3') + `
    <div class="content">
      ${ctBreadcrumb([{label:'Dashboard', href:'#/lc3/dashboard'},{label:proj.name}])}
      <div class="screen-title">Contractor &amp; service monitoring</div>
      <div class="screen-sub">${proj.name} — ${ctFormatUGX(proj.amount)}, FY2025/26</div>
      <div class="card">
        <div class="card-title">Site visit log</div>
        <div class="photo-box" onclick="ctDemoModeToast('Photo capture')"><div class="icon">📷</div>Tap to take a photo — site visit</div>
        <div class="row"><div class="row-title">Observed</div><div class="row-sub" style="text-align:right;">No visible roofing works started as of this visit</div></div>
        <div class="row"><div class="row-title">Budget status</div><div class="row-sub" style="text-align:right;">${ctFormatUGX(proj.amount)} allocated, disbursement not yet confirmed locally</div></div>
      </div>
      <button class="btn btn-red" onclick="ctDemoModeToast('Blocker reported')">Report a blocker</button>
      <div class="field">Blocker type: Funding disbursement ▾</div>
      <button class="btn btn-black" onclick="ctDemoModeToast('Escalated to LC5 / Jinja City Council')">Escalate to LC5 / Jinja City Council</button>
      <div class="footer-note">Sample screen — Jinja City's FY2025/26 budget confirms funding; on-the-ground status is field-reported, not yet in an official performance report.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// LC2 — DASHBOARD (Jinja North Ward, Namulesa Market)
// ---------------------------------------------------------------------------
ctRoute('#/lc2/dashboard', function(){
  const proj = D.jinjaCity.projects.find(p => p.id === 'namulesa-market');
  return ctTopbar('Jinja North Ward', 'Jinja City, Eastern Region', 'lc2') + `
    <div class="content">
      <div class="screen-title">Dashboard</div>
      <div class="screen-sub">Ward-level view, Jinja City FY2025/26 approved budget</div>
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
      <div class="footer-note">Sample screen — funding figure sourced from Jinja City's approved FY2025/26 Budget Estimates; vendor count and mobilization detail are illustrative.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// LC2 — MOBILIZATION
// ---------------------------------------------------------------------------
ctRoute('#/lc2/mobilize', function(){
  const proj = D.jinjaCity.projects.find(p => p.id === 'namulesa-market');
  return ctTopbar('Jinja North Ward', 'Projects › ' + proj.name, 'lc2') + `
    <div class="content">
      ${ctBreadcrumb([{label:'Dashboard', href:'#/lc2/dashboard'},{label:proj.name}])}
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
        <p style="font-size:12px;margin-bottom:8px;">Part of a wider ${ctFormatUGX(D.jinjaCity.budget.current)} Jinja City budget, up from ${ctFormatUGX(D.jinjaCity.budget.prior)} last year <span class="source-tag">verified</span></p>
      </div>
      <button class="btn btn-yellow" onclick="ctDemoModeToast('Outcome logged')">Log outcome</button>
      <div class="field">Meeting notes…</div>
      <div class="footer-note">Sample screen — funding figures real and sourced; meeting details illustrative.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// LC1 — DASHBOARD (Namulesa Cell)
// ---------------------------------------------------------------------------
ctRoute('#/lc1/dashboard', function(){
  const proj = D.jinjaCity.projects.find(p => p.id === 'namulesa-market');
  return ctTopbar('Namulesa Cell', 'Jinja North Ward, Jinja City', 'lc1') + `
    <div class="content">
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
      <div class="footer-note">Sample screen — offline-first, designed for low-end Android use.</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// LC1 — FIELD REPORT
// ---------------------------------------------------------------------------
ctRoute('#/lc1/report', function(){
  return ctTopbar('Namulesa Cell', 'Report site status', 'lc1') + `
    <div class="content">
      ${ctBreadcrumb([{label:'Dashboard', href:'#/lc1/dashboard'},{label:'Report site status'}])}
      <div class="screen-title" style="font-size:17px;">Namulesa Market</div>
      <div class="photo-box" style="height:190px;" onclick="ctDemoModeToast('Photo captured')"><div class="icon" style="font-size:34px;">📷</div>Tap to take a photo</div>

      <p style="font-size:14px;font-weight:500;margin-bottom:10px;">Is work happening at this site?</p>
      <div class="choice-row">
        <div class="choice-btn" onclick="document.querySelectorAll('.choice-btn').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">Yes</div>
        <div class="choice-btn selected" onclick="document.querySelectorAll('.choice-btn').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">No</div>
        <div class="choice-btn" onclick="document.querySelectorAll('.choice-btn').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">Unsure</div>
      </div>

      <p style="font-size:14px;font-weight:500;margin-bottom:8px;">What did you see?</p>
      <div class="field" style="height:70px;">No construction activity, market stalls unchanged since last visit…</div>

      <button class="btn btn-black btn-large" onclick="ctDemoModeToast('Report submitted');setTimeout(()=>location.hash='#/lc1/dashboard',1200)">Submit report</button>

      <div class="sync-banner" style="margin-top:14px;">☁️ Saved — will sync when you're back online</div>
    </div>`;
});

// ---------------------------------------------------------------------------
// OUTCOME RECORDING — hypothetical, clearly marked
// ---------------------------------------------------------------------------
ctRoute('#/outcome', function(){
  return ctTopbar('Outcome Recording', 'Bbaale HC IV maternity ward — Kayunga North County', 'mp') + `
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
