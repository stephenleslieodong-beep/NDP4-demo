/* ============================================================================
   CIVICTRACK DATA MODULE
   Every figure in this file is sourced from a real document reviewed during
   this project. Nothing here is invented. Where a figure could not be
   confirmed, that gap is recorded explicitly (see `.notAvailable` fields)
   rather than filled in.

   Sources:
   - NPA Annual Performance Report FY2024/25 (October 2025)
   - Kayunga District Local Government Quarterly Performance Report,
     FY2025/26 Q2 (signed 25-02-2026, Accounting Officer Mahabba Malik)
   - Jinja District Local Government Performance Reports, FY2024/25 Q4
     and FY2025/26 Q1 (signed 17-12-2025, Accounting Officer Nakamatte Lilian)
   - Jinja City Approved Budget Estimates, FY2025/26
   - PPDA Regulations (procurement timeline benchmarks)
   - National Budget Framework Paper / Budget Speech, FY2026/27
   ========================================================================= */

const CT_DATA = {

  meta: {
    appName: "CivicTrack",
    tagline: "NDP IV Planning & Intelligence Platform",
    sources: [
      "NPA Annual Performance Report FY2024/25 (Oct 2025)",
      "Kayunga District LG Quarterly Performance Report, FY2025/26 Q2",
      "Jinja District LG Performance Reports, FY2024/25 Q4 & FY2025/26 Q1",
      "Jinja City Approved Budget Estimates, FY2025/26",
      "PPDA Regulations on procurement timelines",
      "National Budget Speech, FY2026/27"
    ]
  },

  // -------------------------------------------------------------------------
  // NDP IV national context
  // -------------------------------------------------------------------------
  national: {
    ndpIIIPerformance: {
      overallAchieved: 50.1, priorYearAchieved: 25, noData: 15,
      goalLevelNotFullyAchieved: 90.9, outputLevelNotFullyAchieved: 27.2,
      source: "NPA National Development Report FY2023/24, cited in Annual Performance Report FY2024/25"
    },
    certificateOfCompliance: {
      overallAlignment: 65.1, programmeLevelAlignment: 57.9, rating: "moderately satisfactory",
      source: "NPA Certificate of Compliance, FY2024/25"
    },
    delayBenchmark: {
      worldBankRanking: "second-worst country in the world for project delays",
      citedBy: "Secretary to the Treasury, 2026 Public Procurement Cadre Forum",
      externallyFundedBehindSchedule: 81.3
    },
    budgetFY2627: {
      total: "UGX 84.391 trillion", passedDate: "April 2026",
      debtToGDP: "~51-55%, above the 50% Charter of Fiscal Responsibility ceiling",
      pdmCapitalization: "UGX 1.059 trillion across 10,594 SACCOs nationally",
      transportProgramme: "UGX 6.758 trillion — includes Kampala-Malaba rail corridor through Jinja"
    },
    physicalPlanningGrant: {
      total: "UGX 800 million", districtsCovered: 40, perDistrict: "UGX 20 million",
      note: "NPA's own report calls this financing \"meagre and fragmented\""
    },
    procurementBenchmark: {
      typicalCycleDays: 90,
      typicalCycleNote: "commonly cited PPDA/practitioner benchmark for open domestic bidding, not a strict statutory deadline",
      standstillDays: 10,
      standstillNote: "mandatory working-day standstill after best-evaluated-bidder notice — a hard PPDA Regulation requirement"
    }
  },

  // -------------------------------------------------------------------------
  // NDP IV Programme structure — the same 11 government-wide Programmes
  // used in both district reports (Section A2 of each)
  // -------------------------------------------------------------------------
  programmes: [
    "Agro-Industrialization", "Tourism Development",
    "Natural Resources, Environment, Climate Change, Land and Water Management",
    "Private Sector Development", "Integrated Transport Infrastructure and Services",
    "Human Capital Development", "Public Sector Transformation",
    "Governance and Security", "Regional Balanced Development",
    "Development Plan Implementation"
    // Kayunga additionally reports "Digital Transformation";
    // Jinja District additionally reports "Sustainable Urbanisation and Housing" —
    // kept district-specific below rather than merged, since that's a real
    // difference in each district's own Programme mix.
  ],

  // -------------------------------------------------------------------------
  // KAYUNGA DISTRICT — rural, Q2 FY2025/26
  // -------------------------------------------------------------------------
  kayunga: {
    name: "Kayunga District", type: "rural", region: "Central Region",
    quarter: "Q2 FY2025/26", paceTarget: 50,
    accountingOfficer: "Mahabba Malik", reportSigned: "2026-02-25",
    budget: { approved: 57645862000, revised: 58834385000, receipts: 27948721000, receiptsPct: 48, expenditure: 21734136000, expenditurePct: 38 },
    localRevenuePct: 31,
    localRevenueCause: "political interference both at District and lower local levels, bypass of IRAS in the community",
    programmes: [
      { name: "Agro-Industrialization", approved: 2124575000, pct: 36 },
      { name: "Tourism Development", approved: 10795000, pct: 25 },
      { name: "Natural Resources, Environment, Climate Change, Land and Water Management", approved: 571565000, pct: 42 },
      { name: "Private Sector Development", approved: 160085000, pct: 40 },
      { name: "Integrated Transport Infrastructure and Services", approved: 1571957000, pct: 34 },
      { name: "Digital Transformation", approved: 99740000, pct: 34 },
      { name: "Human Capital Development", approved: 40310702000, pct: 41,
        subLines: [
          { label: "Water & Sanitation (confirmed dept. split)", approved: 819485000, pct: 16 },
          { label: "Health & Education dept. splits", notAvailable: true, note: "not itemized in report extract" }
        ] },
      { name: "Public Sector Transformation", approved: 9444942000, pct: 13 },
      { name: "Governance and Security", approved: 1102005000, revisedApproved: 3868296000, pctOfRevised: 41, pctOfOriginal: 142,
        note: "budget revised up ~3.5x mid-year; % shown here is against the revised figure, not the misleading 142% against original" },
      { name: "Regional Balanced Development", approved: 1151728000, pct: 50 },
      { name: "Development Plan Implementation", approved: 1097769000, pct: 25 }
    ],
    facilities: { health: 22, healthLLGs: 13, primarySchools: 168, secondarySchools: 22, notable: "Ahmed Seguya Memorial Technical Institute" },
    pdm: { householdsFacilitated: 3593, parishes: 71, parishChiefAllowance: 300000 },
    namedFacilities: ["Galiraya", "Bbaale", "Kayonza", "Kitimbwa", "Busaana", "Nazigo", "Kangulumira", "Kayunga Town Council"],
    projects: [
      { id: "bbaale-hc4", name: "Bbaale HC IV — maternity ward construction", sector: "Health", location: "Bbaale Sub-county",
        programme: "Human Capital Development", programmeCode: "12", piapOutput: "12030206",
        piapOutputName: "Public health emergencies prevented and/or detected, managed and controlled in time",
        stage: "procurement", stageStatus: "stalled",
        statusQuote: "works not yet started — ongoing procurement process",
        relatedFacilities: ["bukamba-hc3", "nkokonjeru-latrine", "kawoomya-hc", "buyobe-hc3", "ntenjeru-hc3"],
        timeline: {
          ideaFeasibility: "Marked complete in the Q2 report",
          procurementOpened: "Before Q2 — already \"ongoing\" when this quarter's report was filed",
          contractorEngaged: "Not yet, as of Q2",
          exactDates: "not published — the quarterly report gives stage status, not milestone dates"
        }
      },
      { id: "bukamba-hc3", name: "Bukamba HC III — renovation", sector: "Health", location: "Bukamba Sub-county",
        programme: "Human Capital Development", stage: "procurement", stageStatus: "stalled",
        statusQuote: "works not yet started — procurement process was still going on" },
      { id: "nkokonjeru-latrine", name: "Nkokonjeru RGC — public latrine", sector: "Sanitation", location: "Nkokonjeru",
        programme: "Human Capital Development", stage: "procurement", stageStatus: "stalled",
        statusQuote: "delayed procurement process" },
      { id: "kawoomya-hc", name: "Kawoomya HC — maternity ward", sector: "Health", location: "Kawoomya",
        programme: "Human Capital Development", stage: "retention", stageStatus: "pending",
        statusQuote: "contractors submitted their requisition for payment late" },
      { id: "buyobe-hc3", name: "Buyobe HC III — maternity ward", sector: "Health", location: "Buyobe",
        programme: "Human Capital Development", stage: "retention", stageStatus: "pending",
        statusQuote: "retention payment unpaid" },
      { id: "ntenjeru-hc3", name: "Ntenjeru HC III — maternity ward", sector: "Health", location: "Ntenjeru",
        programme: "Human Capital Development", stage: "retention", stageStatus: "pending",
        statusQuote: "retention payment unpaid" },
      { id: "ndeeba-classroom", name: "Ndeeba C/U & Kitimbwa RC — classroom blocks", sector: "Education", location: "Ndeeba / Kitimbwa",
        programme: "Human Capital Development", stage: "implementation", stageStatus: "ontrack" },
      { id: "ndeeba-sss", name: "Ndeeba Senior Secondary School — classroom block", sector: "Education", location: "Ndeeba",
        programme: "Human Capital Development", stage: "complete", stageStatus: "complete" }
    ],
    // From NPA's FY2024/25 Annual Performance Report — separate source, separate year
    arHighlights: {
      districtHealthOfficer: "Dr. Ahmed Matovu",
      items: [
        "Health equipment handover (delivery beds, neonatal incubators, stethoscopes) at Namulanda C/U Primary School event",
        "14 computers delivered to 10 named schools including Mataba Seed SS, Kibuzi St. Peters, Namulanda P/S",
        "Solar systems installed at Kanjuki Secondary School and Busaana Secondary School",
        "Rainwater harvesting tanks installed at Kangulumira UMEA, Busaale C/U, and New Hope Primary Schools",
        "World Population Day 2025 activities held in Kayunga District"
      ]
    }
  },

  // -------------------------------------------------------------------------
  // JINJA DISTRICT — rural fringe, Q1 FY2025/26 (separate LG from Jinja City
  // since Jinja attained city status in 2020)
  // -------------------------------------------------------------------------
  jinjaDistrict: {
    name: "Jinja District", type: "rural fringe", region: "Eastern Region",
    quarter: "Q1 FY2025/26", paceTarget: 25,
    accountingOfficer: "Nakamatte Lilian", reportSigned: "2025-12-17",
    budget: { approved: 49905241000, receipts: 12003935000, receiptsPct: 24, expenditure: 10595293000, expenditurePct: 21 },
    localRevenuePct: null, // not confirmed in the extract reviewed
    underperformanceCause: "budget cuts of URF and non-release of most grants in Q1, i.e. National Oil Seed Project, UNEB, UWEP & YLP; no funds from donors GAVI, UNICEF, WHO that quarter",
    programmes: [
      { name: "Agro-Industrialization", approved: 2233681000, pct: 19 },
      { name: "Tourism Development", approved: 59374000, pct: 22 },
      { name: "Natural Resources, Environment, Climate Change, Land and Water Management", approved: 605931000, pct: 19 },
      { name: "Private Sector Development", approved: 79287000, pct: 25 },
      { name: "Integrated Transport Infrastructure and Services", approved: 1940853000, pct: 7 },
      { name: "Sustainable Urbanisation and Housing", approved: 1800000, pct: 0 },
      { name: "Human Capital Development", approved: 32911634000, pct: 23 },
      { name: "Public Sector Transformation", approved: 8856163000, pct: 20 },
      { name: "Governance and Security", approved: 2080021000, pct: 17 },
      { name: "Regional Balanced Development", approved: 378477000, pct: 22 },
      { name: "Development Plan Implementation", approved: 758021000, pct: 24 }
    ],
    statutoryBodiesSpentPct: 12,
    projects: [
      { id: "buwolero-road", name: "Buwolero–Kitanaba road — periodic maintenance", sector: "Roads", location: "rural Jinja District",
        length: "4.7km", programme: "Integrated Transport Infrastructure and Services", programmeCode: "09", piapOutput: "09020101",
        piapOutputName: "rural roads maintained to a motorable standard",
        stage: "implementation", stageStatus: "stalled",
        statusQuote: "the road has got swampy sections",
        contributingCause: "Uganda Road Fund non-release, same quarter",
        confirmedPersistence: "Reported incomplete in both the FY2024/25 Q4 report and again in FY2025/26 Q1",
        engineeringBenchmark: { notAvailable: true, note: "no PPDA-style statutory benchmark applies to road maintenance duration — unlike procurement" } },
      { id: "kagoma-hq", name: "District Headquarters, Kagoma — construction", sector: "Public infrastructure", location: "Kagoma",
        programme: "Development Plan Implementation", stage: "implementation", stageStatus: "ontrack",
        statusQuote: "roofing complete — ongoing" }
    ]
  },

  // -------------------------------------------------------------------------
  // JINJA CITY — urban, FY2025/26 approved budget (a planning document,
  // not a performance report — no % released data exists for it yet)
  // -------------------------------------------------------------------------
  jinjaCity: {
    name: "Jinja City", type: "urban", region: "Eastern Region",
    documentType: "Approved Budget Estimates, FY2025/26 — not a performance report",
    budget: { current: 64992433000, prior: 58765992000 },
    wards: ["Central Jinja East", "Walukuba East", "Mpumudde", "Old Boma", "Masese", "Nalufenya"],
    transportPogrammeTotal: 6800000000,
    projects: [
      { id: "mpumudde-hc4", name: "Renovation of Mpumudde Maternity Roof", sector: "Health", location: "Mpumudde Division",
        amount: 35000000, stage: "funded", stageStatus: "pending",
        statusNote: "funded, FY2025/26 — implementation status not yet reported (this is a budget document, not a performance report)" },
      { id: "jinja-central-hc3", name: "Renovation of Maternity at Jinja Central", sector: "Health", location: "Jinja Central",
        amount: 40000000, stage: "funded", stageStatus: "pending" },
      { id: "namulesa-market", name: "Completion of Namulesa Market", sector: "Private Sector Development", location: "Jinja North Division",
        amount: 50000000, stage: "funded", stageStatus: "pending" },
      { id: "road-patching", name: "Patching Various Roads in the City", sector: "Roads", location: "City-wide",
        amount: 465000000, stage: "funded", stageStatus: "pending" },
      { id: "drainage-repairs", name: "Drainage and Road Repairs in the City", sector: "Roads", location: "City-wide",
        amount: 465000000, stage: "funded", stageStatus: "pending" }
    ],
    healthFacilityBudgets: [
      { name: "Walukuba HC IV", government: 68986000, resultsBased: 34775000 },
      { name: "Bugembe HC IV", government: 68986000, resultsBased: 58938000 },
      { name: "Budondo HC IV", government: 68986000, resultsBased: 40140000 }
    ]
  },

  // -------------------------------------------------------------------------
  // NPA FY2024/25 Annual Performance Report — Jinja-specific real items
  // -------------------------------------------------------------------------
  jinjaARHighlights: {
    fieldVisits: 27,
    jinjaStreets: ["Scott Road (Walukuba)", "Bridge Street (Nalufenya)", "Elizabeth Road", "Clarke Road", "Lubas Road"],
    disputeType: "blocked service lanes and encroachment disputes"
  }
};

// ---- Small pure helpers used by app.js -------------------------------------
function ctFormatUGX(n){
  if (n == null) return "n/a";
  if (n >= 1e9) return "UGX " + (n/1e9).toFixed(2).replace(/\.00$/,'') + "bn";
  if (n >= 1e6) return "UGX " + (n/1e6).toFixed(0) + "m";
  return "UGX " + n.toLocaleString();
}
function ctStatusClass(status){
  return { stalled:"danger", pending:"amber", ontrack:"amber", complete:"good" }[status] || "";
}
