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
   - UBOS, National Population and Housing Census (NPHC) 2024 — Final Report
     Vol. I and the UBOS NPHC 2024 dissemination portal (statistics.ubos.org)
   - Electoral Commission, Voter Statistics by District (2021 general election)
   - Parliament of Uganda, 11th Parliament (2021-2026) membership records,
     cross-checked against Parliament Watch committee listings and press
     coverage of the 2021 results

   ---------------------------------------------------------------------------
   THE ONE SHARED GEOGRAPHY KEY
   Four real-world dimensions — administrative geography, political
   representation, quality-of-life indicators, and citizen mobilization — in
   reality live in four unrelated government sources. In this app they are
   integrated through ONE canonical geography ID:

     Districts/cities : "UG-KYG"  (Kayunga District)
                        "UG-JJD"  (Jinja District — rural LG, separate from
                                   Jinja City since 2020)
                        "UG-JJC"  (Jinja City)
     Constituencies   : districtId + suffix, e.g. "UG-KYG-BBA" (Bbaale County)
     Lower levels     : districtId + level prefix, e.g. "UG-KYG-SC-BBAALE"
                        (sub-county), "UG-JJC-W-JN" (ward), "UG-JJC-C-NAM"
                        (cell/village)

   `geo` is the registry. `representation`, `qualityOfLife`, `mobilization`
   and `programmeData` all hang off the SAME ids. When a user views a place,
   all four dimensions are retrieved through that one id. A dimension with no
   verified data is an explicit `{ notAvailable: true }` record — the views
   render that as a DEMO-watermarked panel, never a silent omission.
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
      "National Budget Speech, FY2026/27",
      "UBOS NPHC 2024 Final Report Vol. I & dissemination portal",
      "Electoral Commission, Voter Statistics by District (2021)",
      "Parliament of Uganda, 11th Parliament membership records"
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
  // NDP IV Programme structure — the same government-wide Programmes
  // used in both district performance reports (Section A2 of each).
  // Kayunga additionally reports "Digital Transformation"; Jinja District
  // additionally reports "Sustainable Urbanisation and Housing" — kept
  // district-specific inside programmeData, since that's a real difference
  // in each district's own Programme mix.
  // -------------------------------------------------------------------------
  programmeNames: [
    "Agro-Industrialization", "Tourism Development",
    "Natural Resources, Environment, Climate Change, Land and Water Management",
    "Private Sector Development", "Integrated Transport Infrastructure and Services",
    "Human Capital Development", "Public Sector Transformation",
    "Governance and Security", "Regional Balanced Development",
    "Development Plan Implementation"
  ],

  // -------------------------------------------------------------------------
  // GEO REGISTRY — the canonical geography IDs every other dataset keys off.
  // Three Local Governments have real reviewed data in this prototype; other
  // districts of Uganda (~146 as of 2025) are not listed because no reviewed
  // source document exists for them here — adding them would mean inventing
  // data.
  // -------------------------------------------------------------------------
  geo: {
    "UG-KYG": {
      id: "UG-KYG", name: "Kayunga District", shortName: "Kayunga",
      kind: "district", type: "rural", region: "Central Region",
      constituencies: ["UG-KYG-NTN", "UG-KYG-NTS", "UG-KYG-BBA"],
      // 9 sub-counties/town councils — matches the EC's count of 9 for Kayunga;
      // names as they appear in the district's own performance report.
      subCounties: [
        { id: "UG-KYG-SC-BBAALE",    name: "Bbaale Sub-county" },
        { id: "UG-KYG-SC-BUKAMBA",   name: "Bukamba Sub-county" },
        { id: "UG-KYG-SC-KAYONZA",   name: "Kayonza Sub-county" },
        { id: "UG-KYG-SC-KITIMBWA",  name: "Kitimbwa Sub-county" },
        { id: "UG-KYG-SC-BUSAANA",   name: "Busaana Sub-county" },
        { id: "UG-KYG-SC-NAZIGO",    name: "Nazigo Sub-county" },
        { id: "UG-KYG-SC-KANGULUMIRA", name: "Kangulumira Sub-county" },
        { id: "UG-KYG-SC-GALIRAYA",  name: "Galiraya Sub-county" },
        { id: "UG-KYG-SC-KAYUNGATC", name: "Kayunga Town Council" }
      ],
      // LC2/LC1 levels: parish/village names are not itemized in the reviewed
      // reports — recorded honestly so views show the DEMO watermark.
      wards: [],
      cells: [],
      levelsNote: "Parish (LC2) and village (LC1) names for Kayunga are not itemized in the reviewed reports; the EC counts 62 electoral parishes."
    },

    "UG-JJD": {
      id: "UG-JJD", name: "Jinja District", shortName: "Jinja District",
      kind: "district", type: "rural fringe", region: "Eastern Region",
      constituencies: ["UG-JJD-BUT", "UG-JJD-KAG", "UG-JJD-KGN"],
      // EC counts 13 sub-counties for Jinja; only those named in the reviewed
      // reports are enumerated here rather than guessed.
      subCounties: [
        { id: "UG-JJD-SC-KAGOMA",  name: "Kagoma" },
        { id: "UG-JJD-SC-BUTAGAYA", name: "Butagaya Sub-county" },
        { id: "UG-JJD-SC-BUWENGE", name: "Buwenge Sub-county" }
      ],
      subCountiesNote: "EC lists 13 sub-counties for Jinja District; only those named in reviewed reports are shown — the rest would be guesses.",
      wards: [],
      cells: [],
      levelsNote: "Parish (LC2) and village (LC1) names for Jinja District are not itemized in the reviewed reports; the EC counts 58 electoral parishes."
    },

    "UG-JJC": {
      id: "UG-JJC", name: "Jinja City", shortName: "Jinja City",
      kind: "city", type: "urban", region: "Eastern Region",
      constituencies: ["UG-JJC-JN", "UG-JJC-JSE", "UG-JJC-JSW"],
      // Division/ward naming follows the city's approved FY2025/26 budget
      // document exactly (it names "Mpumudde Division" and "Jinja North
      // Division"). Public sources describe the city as the 3 former
      // municipality divisions plus Bugembe TC, Budondo and Mafubira
      // sub-counties, added when city status was granted in 2020.
      subCounties: [
        { id: "UG-JJC-DV-MPUMUDDE", name: "Mpumudde Division" },
        { id: "UG-JJC-DV-JNORTH",   name: "Jinja North Division" },
        { id: "UG-JJC-DV-CENTRAL",  name: "Jinja Central" },
        { id: "UG-JJC-DV-BUGEMBE",  name: "Bugembe" },
        { id: "UG-JJC-DV-BUDONDO",  name: "Budondo" },
        { id: "UG-JJC-DV-MAFUBIRA", name: "Mafubira" }
      ],
      subCountiesNote: "Named as in the Jinja City FY2025/26 budget document and the 2020 city-structure descriptions.",
      // Wards named in the budget document, plus Jinja North Ward (Namulesa).
      wards: [
        { id: "UG-JJC-W-CJE",      name: "Central Jinja East Ward" },
        { id: "UG-JJC-W-WALUKUBA", name: "Walukuba East Ward" },
        { id: "UG-JJC-W-MPUMUDDE", name: "Mpumudde Ward" },
        { id: "UG-JJC-W-OLDBOMA",  name: "Old Boma Ward" },
        { id: "UG-JJC-W-MASESE",   name: "Masese Ward" },
        { id: "UG-JJC-W-NALUFENYA", name: "Nalufenya Ward" },
        { id: "UG-JJC-W-JN",       name: "Jinja North Ward" }
      ],
      cells: [
        { id: "UG-JJC-C-NAM", name: "Namulesa Cell", wardId: "UG-JJC-W-JN" }
      ],
      levelsNote: "Only Namulesa Cell has project-level data in the reviewed budget document; other cells/villages are not itemized."
    }
  },

  // -------------------------------------------------------------------------
  // CONSTITUENCIES — same key scheme; each points back at its district.
  // Names verified against 11th Parliament (2021-2026) records.
  // NOTE / CORRECTION: an earlier draft of this app referred to a
  // "Kayunga North County". No such constituency exists — Kayunga District's
  // constituencies are Ntenjeru North, Ntenjeru South and Bbaale County.
  // -------------------------------------------------------------------------
  constituencies: {
    "UG-KYG-NTN": { id: "UG-KYG-NTN", districtId: "UG-KYG", name: "Ntenjeru North County" },
    "UG-KYG-NTS": { id: "UG-KYG-NTS", districtId: "UG-KYG", name: "Ntenjeru South County" },
    "UG-KYG-BBA": { id: "UG-KYG-BBA", districtId: "UG-KYG", name: "Bbaale County" },

    "UG-JJD-BUT": { id: "UG-JJD-BUT", districtId: "UG-JJD", name: "Butembe County" },
    "UG-JJD-KAG": { id: "UG-JJD-KAG", districtId: "UG-JJD", name: "Kagoma County" },
    "UG-JJD-KGN": { id: "UG-JJD-KGN", districtId: "UG-JJD", name: "Kagoma North County" },

    "UG-JJC-JN":  { id: "UG-JJC-JN",  districtId: "UG-JJC", name: "Jinja North" },
    "UG-JJC-JSE": { id: "UG-JJC-JSE", districtId: "UG-JJC", name: "Jinja South East" },
    "UG-JJC-JSW": { id: "UG-JJC-JSW", districtId: "UG-JJC", name: "Jinja South West" }
  },

  // -------------------------------------------------------------------------
  // DIMENSION 1 — POLITICAL REPRESENTATION, keyed by geoId.
  // 11th Parliament (2021-2026) and LC5/Mayoral office-holders, verified
  // against Parliament records cross-checked with press coverage of the 2021
  // results. `verified` states the basis for each record — this is what the
  // app's "MP verification" badge is built from.
  // -------------------------------------------------------------------------
  representation: {

    "UG-KYG": { leaders: [
      { name: "Idah Erios Nantaba", office: "District Woman MP (DWR)", party: "Independent",
        elected: "2021 general election (stood as Independent after losing the NRM primary)",
        verified: "Parliament of Uganda 11th Parliament records; corroborated by press coverage",
        level: "district" },
      { name: "Andrew Muwonge", office: "LC5 Chairperson", party: "NRM",
        elected: "December 2021 by-election (after the death of Ffeffeka Sserubogo, NUP); victory upheld by the Court of Appeal in 2024",
        verified: "Electoral Commission declaration, 17 Dec 2021; Court of Appeal ruling 2024",
        level: "district" }
    ]},
    "UG-KYG-NTN": { leaders: [
      { name: "Amos Lugoloobi", office: "MP — Ntenjeru North County", party: "NRM",
        elected: "2021 general election; also appointed Minister of State for Finance (Planning)",
        verified: "Parliament of Uganda 11th Parliament records",
        level: "constituency" }
    ]},
    "UG-KYG-NTS": { leaders: [
      { name: "Patrick Mabirizi Nsanja", office: "MP — Ntenjeru South County", party: "Independent",
        elected: "2021 general election (11,300 votes; NRM's Fred Baseke second with 9,718)",
        verified: "Parliament of Uganda 11th Parliament records; corroborated by press coverage",
        level: "constituency" }
    ]},
    "UG-KYG-BBA": { leaders: [
      { name: "Charles Tebandeke", office: "MP — Bbaale County", party: "NUP",
        elected: "2021 general election (defeated NRM's Swaliki Matovu by 7,679 votes)",
        verified: "Parliament of Uganda 11th Parliament records; corroborated by press coverage",
        level: "constituency" }
    ]},

    "UG-JJD": { leaders: [
      { name: "Loy Katali", office: "District Woman MP (DWR)", party: "NRM",
        elected: "2021 general election",
        verified: "Parliament of Uganda 11th Parliament records",
        level: "district" },
      { name: "Moses Batwala", office: "LC5 Chairperson", party: "NRM",
        elected: "2021 general election (unopposed)",
        verified: "Jinja District LG records; corroborated by press coverage",
        level: "district" }
    ]},
    "UG-JJD-BUT": { leaders: [
      { name: "David Livingstone Zijjan", office: "MP — Butembe County", party: "Independent",
        elected: "2021 general election",
        verified: "Parliament of Uganda 11th Parliament records; corroborated by press coverage",
        level: "constituency" }
    ]},
    "UG-JJD-KAG": { leaders: [
      { name: "Moses Walyomu Muwanika", office: "MP — Kagoma County", party: "Independent",
        elected: "2021 general election (won as an Independent after losing the NRM primary)",
        verified: "Parliament of Uganda 11th Parliament records",
        level: "constituency" }
    ]},
    "UG-JJD-KGN": { leaders: [
      { name: "Alex Brandon Kintu", office: "MP — Kagoma North County", party: "NRM",
        elected: "2021 general election",
        verified: "Parliament of Uganda 11th Parliament records",
        level: "constituency" }
    ]},

    "UG-JJC": { leaders: [
      { name: "Manjeri Kyebakutika", office: "City Woman MP (DWR)", party: "NUP",
        elected: "2021 general election",
        verified: "Parliament of Uganda 11th Parliament records",
        level: "district" },
      { name: "Peter Kasolo Okocha", office: "City Mayor", party: "NUP",
        elected: "2021 general election (defeated FDC's Frank Nabwiso)",
        verified: "Electoral Commission records; corroborated by press coverage",
        level: "district" }
    ]},
    "UG-JJC-JN": { leaders: [
      { name: "Isabirye David Iga", office: "MP — Jinja North", party: "FDC",
        elected: "2021 general election",
        verified: "Parliament of Uganda 11th Parliament records",
        level: "constituency" }
    ]},
    "UG-JJC-JSE": { leaders: [
      { name: "Igeme Nathan Nabeta", office: "MP — Jinja South East (Jinja South Division East)", party: "NRM",
        elected: "2021 general election",
        verified: "Parliament of Uganda 11th Parliament records",
        level: "constituency" }
    ]},
    "UG-JJC-JSW": { leaders: [
      { name: "Dr. Timothy Batuwa Lusala", office: "MP — Jinja South West", party: "FDC",
        elected: "2021 general election; ranked among the most active first-term MPs by plenary contributions (Hansard-based)",
        verified: "Parliament of Uganda 11th Parliament records",
        level: "constituency" }
    ]}
  },

  // -------------------------------------------------------------------------
  // DIMENSION 2 — QUALITY OF LIFE (NPHC 2024 census), keyed by geoId.
  // -------------------------------------------------------------------------
  qualityOfLife: {
    "UG-KYG": {
      census: "NPHC 2024", population: 439175, male: 208845, female: 230330,
      households: 104678, avgHouseholdSize: 4.2,
      facilities: { health: 22, healthLLGs: 13, primarySchools: 168, secondarySchools: 22,
        notable: "Ahmed Seguya Memorial Technical Institute" },
      facilitiesSource: "Kayunga District LG Quarterly Performance Report, FY2025/26 Q2",
      source: "UBOS NPHC 2024 Final Report Vol. I (Table 2.4A) and UBOS NPHC 2024 dissemination portal"
    },
    "UG-JJD": {
      notAvailable: true,
      note: "NPHC 2024 district-level figures for Jinja District were not retrievable from the reviewed sources during this build; recorded as a gap rather than estimated."
    },
    "UG-JJC": {
      census: "NPHC 2024", population: 279184, male: 123031, female: 156153,
      households: 71326,
      source: "UBOS NPHC 2024 dissemination portal (Jinja City profile)"
    }
  },

  // -------------------------------------------------------------------------
  // DIMENSION 3 — CITIZEN MOBILIZATION (EC voter statistics + PDM), keyed by geoId.
  // -------------------------------------------------------------------------
  mobilization: {
    "UG-KYG": {
      voters: { registered: 162880, female: 86338, male: 76542,
        constituencies: 3, subCounties: 9, parishes: 62, pollingStations: 305,
        source: "Electoral Commission, Voter Statistics by District (2021 general election)" },
      pdm: { householdsFacilitated: 3593, parishes: 71, parishChiefAllowance: 300000,
        parishesNote: "The district report counts 71 PDM parishes versus the EC's 62 electoral parishes — PDM counts include town-council wards; kept exactly as reported.",
        source: "Kayunga District LG Quarterly Performance Report, FY2025/26 Q2" }
    },
    "UG-JJD": {
      voters: { registered: 233850, female: 122595, male: 111255,
        constituencies: 4, subCounties: 13, parishes: 58, pollingStations: 399,
        note: "EC 2021 statistics list \"Jinja\" as one electoral district and do not break out Jinja City separately.",
        source: "Electoral Commission, Voter Statistics by District (2021 general election)" },
      pdm: { notAvailable: true,
        note: "PDM figures for Jinja District were not available in the report reviewed for this prototype." }
    },
    "UG-JJC": {
      voters: { notAvailable: true,
        note: "EC 2021 district statistics do not break out Jinja City separately (listed within \"Jinja\")." },
      pdm: { notAvailable: true,
        note: "City-level PDM figures were not available in the documents reviewed for this prototype." }
    }
  },

  // -------------------------------------------------------------------------
  // DIMENSION 4 — NDP IV PROGRAMME DATA (budgets, releases, projects),
  // keyed by geoId. These are the reviewed district/city documents, unchanged
  // in substance from the reviewed sources; projects now carry subCountyId
  // (and constituencyId where the reviewed report makes it unambiguous) so
  // they join to the same geography key as the other three dimensions.
  // -------------------------------------------------------------------------
  programmeData: {

    // KAYUNGA DISTRICT — rural, Q2 FY2025/26
    "UG-KYG": {
      geoId: "UG-KYG", name: "Kayunga District", type: "rural", region: "Central Region",
      quarter: "Q2 FY2025/26", paceTarget: 50, dataKind: "performance",
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
          subCountyId: "UG-KYG-SC-BBAALE", constituencyId: "UG-KYG-BBA",
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
          subCountyId: "UG-KYG-SC-BUKAMBA", constituencyId: null,
          programme: "Human Capital Development", stage: "procurement", stageStatus: "stalled",
          statusQuote: "works not yet started — procurement process was still going on" },
        { id: "nkokonjeru-latrine", name: "Nkokonjeru RGC — public latrine", sector: "Sanitation", location: "Nkokonjeru",
          subCountyId: null, constituencyId: null,
          programme: "Human Capital Development", stage: "procurement", stageStatus: "stalled",
          statusQuote: "delayed procurement process" },
        { id: "kawoomya-hc", name: "Kawoomya HC — maternity ward", sector: "Health", location: "Kawoomya",
          subCountyId: null, constituencyId: null,
          programme: "Human Capital Development", stage: "retention", stageStatus: "pending",
          statusQuote: "contractors submitted their requisition for payment late" },
        { id: "buyobe-hc3", name: "Buyobe HC III — maternity ward", sector: "Health", location: "Buyobe",
          subCountyId: null, constituencyId: null,
          programme: "Human Capital Development", stage: "retention", stageStatus: "pending",
          statusQuote: "retention payment unpaid" },
        { id: "ntenjeru-hc3", name: "Ntenjeru HC III — maternity ward", sector: "Health", location: "Ntenjeru",
          subCountyId: null, constituencyId: null,
          programme: "Human Capital Development", stage: "retention", stageStatus: "pending",
          statusQuote: "retention payment unpaid" },
        { id: "ndeeba-classroom", name: "Ndeeba C/U & Kitimbwa RC — classroom blocks", sector: "Education", location: "Ndeeba / Kitimbwa",
          subCountyId: "UG-KYG-SC-KITIMBWA", constituencyId: null,
          programme: "Human Capital Development", stage: "implementation", stageStatus: "ontrack" },
        { id: "ndeeba-sss", name: "Ndeeba Senior Secondary School — classroom block", sector: "Education", location: "Ndeeba",
          subCountyId: null, constituencyId: null,
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

    // JINJA DISTRICT — rural fringe, Q1 FY2025/26 (separate LG from Jinja City
    // since Jinja attained city status in 2020)
    "UG-JJD": {
      geoId: "UG-JJD", name: "Jinja District", type: "rural fringe", region: "Eastern Region",
      quarter: "Q1 FY2025/26", paceTarget: 25, dataKind: "performance",
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
          subCountyId: null, constituencyId: null,
          length: "4.7km", programme: "Integrated Transport Infrastructure and Services", programmeCode: "09", piapOutput: "09020101",
          piapOutputName: "rural roads maintained to a motorable standard",
          stage: "implementation", stageStatus: "stalled",
          statusQuote: "the road has got swampy sections",
          contributingCause: "Uganda Road Fund non-release, same quarter",
          confirmedPersistence: "Reported incomplete in both the FY2024/25 Q4 report and again in FY2025/26 Q1",
          engineeringBenchmark: { notAvailable: true, note: "no PPDA-style statutory benchmark applies to road maintenance duration — unlike procurement" } },
        { id: "kagoma-hq", name: "District Headquarters, Kagoma — construction", sector: "Public infrastructure", location: "Kagoma",
          subCountyId: "UG-JJD-SC-KAGOMA", constituencyId: null,
          programme: "Development Plan Implementation", stage: "implementation", stageStatus: "ontrack",
          statusQuote: "roofing complete — ongoing" }
      ]
    },

    // JINJA CITY — urban, FY2025/26 approved budget (a planning document,
    // not a performance report — no % released data exists for it yet)
    "UG-JJC": {
      geoId: "UG-JJC", name: "Jinja City", type: "urban", region: "Eastern Region",
      dataKind: "budget",
      documentType: "Approved Budget Estimates, FY2025/26 — not a performance report",
      budget: { current: 64992433000, prior: 58765992000 },
      wards: ["Central Jinja East", "Walukuba East", "Mpumudde", "Old Boma", "Masese", "Nalufenya"],
      transportPogrammeTotal: 6800000000,
      projects: [
        { id: "mpumudde-hc4", name: "Renovation of Mpumudde Maternity Roof", sector: "Health", location: "Mpumudde Division",
          subCountyId: "UG-JJC-DV-MPUMUDDE", constituencyId: null,
          amount: 35000000, stage: "funded", stageStatus: "pending",
          statusNote: "funded, FY2025/26 — implementation status not yet reported (this is a budget document, not a performance report)" },
        { id: "jinja-central-hc3", name: "Renovation of Maternity at Jinja Central", sector: "Health", location: "Jinja Central",
          subCountyId: "UG-JJC-DV-CENTRAL", constituencyId: null,
          amount: 40000000, stage: "funded", stageStatus: "pending" },
        { id: "namulesa-market", name: "Completion of Namulesa Market", sector: "Private Sector Development", location: "Jinja North Division",
          subCountyId: "UG-JJC-DV-JNORTH", constituencyId: null, wardId: "UG-JJC-W-JN", cellId: "UG-JJC-C-NAM",
          amount: 50000000, stage: "funded", stageStatus: "pending" },
        { id: "road-patching", name: "Patching Various Roads in the City", sector: "Roads", location: "City-wide",
          subCountyId: null, constituencyId: null,
          amount: 465000000, stage: "funded", stageStatus: "pending" },
        { id: "drainage-repairs", name: "Drainage and Road Repairs in the City", sector: "Roads", location: "City-wide",
          subCountyId: null, constituencyId: null,
          amount: 465000000, stage: "funded", stageStatus: "pending" }
      ],
      healthFacilityBudgets: [
        { name: "Walukuba HC IV", government: 68986000, resultsBased: 34775000 },
        { name: "Bugembe HC IV", government: 68986000, resultsBased: 58938000 },
        { name: "Budondo HC IV", government: 68986000, resultsBased: 40140000 }
      ]
    }
  },

  // -------------------------------------------------------------------------
  // NPA FY2024/25 Annual Performance Report — Jinja-specific real items
  // -------------------------------------------------------------------------
  jinjaARHighlights: {
    fieldVisits: 27,
    jinjaStreets: ["Scott Road (Walukuba)", "Bridge Street (Nalufenya)", "Elizabeth Road", "Clarke Road", "Lubas Road"],
    disputeType: "blocked service lanes and encroachment disputes"
  },

  // -------------------------------------------------------------------------
  // DIMENSION 4b — FLAGSHIP INITIATIVES, keyed by the SAME geoId and housed
  // UNDER the NDP IV Programmes (dimension 4). These are the cross-cutting,
  // nationally significant initiatives — PDM, Emyooga, UWEP/YLP. Progress is
  // tracked with MORE than cash disbursements: institutional coverage,
  // facilitation, and non-cash activities. `kind: "noncash"` marks progress
  // that isn't about money; `gap: true` marks an aspect the tool tracks but
  // the reviewed documents don't yet report (shown honestly, never filled in).
  // -------------------------------------------------------------------------
  flagships: {
    "UG-KYG": [
      { id: "pdm", name: "Parish Development Model (PDM)",
        kind: "Cross-cutting wealth-creation flagship (coordinated by MoLG; financial-inclusion pillar)",
        status: "reported",
        summary: "3,593 households facilitated across 71 parishes",
        national: { capitalization: "UGX 1.059 trillion", saccos: "10,594 SACCOs nationally",
          source: "National Budget Speech, FY2026/27" },
        progress: [
          { label: "Households facilitated (financing)", value: "3,593", kind: "cash" },
          { label: "Parishes covered (institutional reach)", value: "71 / 71", kind: "noncash" },
          { label: "Parish Chief monthly facilitation", value: "UGX 300,000", kind: "noncash" },
          { label: "Mindset change & community mobilization activities", value: "Not reported in reviewed documents", kind: "noncash", gap: true },
          { label: "Beneficiary enumeration & enterprise selection", value: "Not reported in reviewed documents", kind: "noncash", gap: true }
        ],
        note: "The district report counts 71 PDM parishes versus the EC's 62 electoral parishes — PDM counts include town-council wards; kept exactly as reported.",
        source: "Kayunga District LG Quarterly Performance Report, FY2025/26 Q2" },
      { id: "emyooga", name: "Emyooga — Presidential Initiative on Wealth & Job Creation",
        kind: "Cross-cutting wealth-creation flagship (constituency SACCOs, 18 enterprise categories)",
        status: "notAvailable",
        national: { launched: "August 2019", admin: "Ministry of Finance, implemented through the Microfinance Support Centre (MSC)",
          categories: "18 specialized enterprise categories (boda-boda, market vendors, carpenters, salon operators, journalists, veterans, etc.)",
          seed: "UGX 30m seed capital per constituency SACCO (UGX 50m for elected-leaders' SACCOs)",
          goal: "shift 68% of homesteads from subsistence to market-oriented production",
          source: "Microfinance Support Centre programme records" },
        note: "District-level Emyooga figures for Kayunga (SACCOs formed, savings mobilized, loans recovered) are not in the reviewed reports." },
      { id: "uwep-ylp", name: "UWEP & Youth Livelihood Programme (YLP)",
        kind: "Cross-cutting community-empowerment programmes",
        status: "notAvailable",
        note: "No UWEP/YLP status line appears in the Kayunga report extract reviewed for this prototype." }
    ],

    "UG-JJD": [
      { id: "pdm", name: "Parish Development Model (PDM)",
        kind: "Cross-cutting wealth-creation flagship (coordinated by MoLG; financial-inclusion pillar)",
        status: "notAvailable",
        national: { capitalization: "UGX 1.059 trillion", saccos: "10,594 SACCOs nationally",
          source: "National Budget Speech, FY2026/27" },
        note: "PDM figures for Jinja District were not available in the report reviewed for this prototype." },
      { id: "emyooga", name: "Emyooga — Presidential Initiative on Wealth & Job Creation",
        kind: "Cross-cutting wealth-creation flagship (constituency SACCOs, 18 enterprise categories)",
        status: "notAvailable",
        national: { launched: "August 2019", admin: "Ministry of Finance, implemented through the Microfinance Support Centre (MSC)",
          categories: "18 specialized enterprise categories",
          source: "Microfinance Support Centre programme records" },
        note: "District-level Emyooga figures for Jinja District are not in the reviewed reports." },
      { id: "uwep-ylp", name: "UWEP & Youth Livelihood Programme (YLP)",
        kind: "Cross-cutting community-empowerment programmes",
        status: "issue",
        summary: "UWEP & YLP grants not released in Q1 FY2025/26",
        progress: [
          { label: "Q1 FY2025/26 grant release", value: "Not released — named by the district among its underperformance causes (with National Oil Seed Project, UNEB; donors GAVI, UNICEF, WHO also absent that quarter)", kind: "cash", gap: true }
        ],
        source: "Jinja District LG Performance Report, FY2025/26 Q1" }
    ],

    "UG-JJC": [
      { id: "pdm", name: "Parish Development Model (PDM)",
        kind: "Cross-cutting wealth-creation flagship (coordinated by MoLG; financial-inclusion pillar)",
        status: "notAvailable",
        national: { capitalization: "UGX 1.059 trillion", saccos: "10,594 SACCOs nationally",
          source: "National Budget Speech, FY2026/27" },
        note: "City-level PDM figures were not available in the documents reviewed for this prototype." },
      { id: "emyooga", name: "Emyooga — Presidential Initiative on Wealth & Job Creation",
        kind: "Cross-cutting wealth-creation flagship (constituency SACCOs, 18 enterprise categories)",
        status: "notAvailable",
        national: { launched: "August 2019", admin: "Ministry of Finance, implemented through the Microfinance Support Centre (MSC)",
          categories: "18 specialized enterprise categories",
          source: "Microfinance Support Centre programme records" },
        note: "City-level Emyooga figures are not in the reviewed reports." },
      { id: "uwep-ylp", name: "UWEP & Youth Livelihood Programme (YLP)",
        kind: "Cross-cutting community-empowerment programmes",
        status: "notAvailable",
        note: "No UWEP/YLP status line appears in the Jinja City budget extract reviewed." }
    ]
  },

  // ---- NDP IV architecture ---------------------------------------------------
  // The Fourth National Development Plan (2025/26–2029/30) organises all of
  // Uganda's development effort into 4 clusters and 18 programmes (NPA, NDP IV,
  // Table 3.3). Every district report itemizes a subset of these programmes;
  // aliases map the names districts use onto the canonical NDP IV names.
  ndp4: {
    source: "Fourth National Development Plan (NDP IV) 2025/26-2029/30, NPA — Table 3.3",
    clusters: [
      { id: "production", name: "Production and Value Addition", icon: "🏭",
        programmes: ["Agro-Industrialisation", "Sustainable Extractives Industry Development", "Tourism Development", "Manufacturing", "Private Sector Development"] },
      { id: "social", name: "Social Development", icon: "🎓",
        programmes: ["Human Capital Development", "Sustainable Urbanisation and Housing", "Regional Development"] },
      { id: "enablers", name: "Enablers", icon: "⚡",
        programmes: ["Integrated Transport Infrastructure and Services", "Sustainable Energy Development", "Digital Transformation", "Natural Resources, Environment, Climate Change, Land and Water Management", "Innovation, Technology Development and Transfer"] },
      { id: "governance", name: "Governance", icon: "🏛️",
        programmes: ["Legislature, Oversight and Representation", "Administration of Justice", "Development Plan Implementation", "Governance and Security", "Public Sector Transformation"] }
    ],
    aliases: {
      "regionalbalanceddevelopment": "Regional Development",
      "agroindustrialization": "Agro-Industrialisation"
    }
  },

  // ---- Technocrats (accounting officers) --------------------------------------
  // Real names from report signatures; part of the leadership network — leaders
  // reach these officers for delivery-side questions (procurement, works, releases).
  technocrats: {
    "UG-KYG": [
      { office: "Chief Administrative Officer (CAO)", name: "Mahabba Malik",
        basis: "Accounting Officer — signed the Kayunga DLG Quarterly Performance Report, FY2025/26 Q2",
        verified: true }
    ],
    "UG-JJD": [
      { office: "Chief Administrative Officer (CAO)", name: "Nakamatte Lilian",
        basis: "Accounting Officer — signed the Jinja District LG Performance Reports, FY2024/25 Q4 & FY2025/26 Q1",
        verified: true }
    ],
    "UG-JJC": [
      { office: "City Town Clerk", name: null,
        basis: "The accounting officer is not named in the budget extract reviewed.",
        verified: false }
    ]
  }
};

// ---- Small pure helpers used by app.js / views.js ---------------------------
function ctFormatUGX(n){
  if (n == null) return "n/a";
  if (n >= 1e9) return "UGX " + (n/1e9).toFixed(2).replace(/\.00$/,'') + "bn";
  if (n >= 1e6) return "UGX " + (n/1e6).toFixed(0) + "m";
  return "UGX " + n.toLocaleString();
}
function ctStatusClass(status){
  return { stalled:"danger", pending:"amber", ontrack:"amber", complete:"good" }[status] || "";
}

// ---- Shared-geography-key accessors -----------------------------------------
// Every view resolves a geoId to its four dimensions through these — one key,
// one source of truth. A missing dimension returns the { notAvailable }
// record (or null), and the view renders a DEMO watermark, never a broken join.

// Any geo id (district, constituency, sub-county, ward, cell) -> its district id.
function ctDistrictIdOf(geoId){
  if (!geoId) return null;
  if (CT_DATA.geo[geoId]) return geoId;
  const c = CT_DATA.constituencies[geoId];
  if (c) return c.districtId;
  const prefix = geoId.slice(0, 6); // "UG-XXX"
  return CT_DATA.geo[prefix] ? prefix : null;
}
// District record for any geo id.
function ctGeoDistrict(geoId){
  const d = ctDistrictIdOf(geoId);
  return d ? CT_DATA.geo[d] : null;
}
// Display name for any geo id (district, constituency, or lower level).
function ctGeoName(geoId){
  if (!geoId) return "";
  if (CT_DATA.geo[geoId]) return CT_DATA.geo[geoId].name;
  if (CT_DATA.constituencies[geoId]) return CT_DATA.constituencies[geoId].name;
  const dist = ctGeoDistrict(geoId);
  if (dist){
    const all = [].concat(dist.subCounties || [], dist.wards || [], dist.cells || []);
    const hit = all.find(x => x.id === geoId);
    if (hit) return hit.name;
  }
  return geoId;
}
// The four dimensions, always addressed by the same key.
function ctProgrammeOf(geoId){ return CT_DATA.programmeData[ctDistrictIdOf(geoId)] || null; }
function ctRepresentationOf(geoId){ return CT_DATA.representation[geoId] || null; }
function ctQoLOf(geoId){ return CT_DATA.qualityOfLife[ctDistrictIdOf(geoId)] || null; }
function ctMobilizationOf(geoId){ return CT_DATA.mobilization[ctDistrictIdOf(geoId)] || null; }
// Flagship initiatives (PDM, Emyooga, UWEP/YLP) — housed under the Programmes
// dimension, retrieved through the same geo key.
function ctFlagshipsOf(geoId){ return CT_DATA.flagships[ctDistrictIdOf(geoId)] || []; }
function ctFlagship(geoId, fid){
  return ctFlagshipsOf(geoId).find(f => f.id === fid) || null;
}

// ---- NDP IV cluster helpers ---------------------------------------------------
// Normalise a programme name so district report wording matches canonical NDP IV
// wording ("Regional Balanced Development" == "Regional Development").
function ctNormProg(s){
  return (s || '').toLowerCase().replace(/[^a-z]/g, '').replace(/isation/g, 'ization');
}
// Which NDP IV cluster does a programme belong to? null if it isn't an NDP IV
// programme line (e.g. a district's local-revenue or statutory line).
function ctClusterOf(progName){
  let n = ctNormProg(progName);
  if (CT_DATA.ndp4.aliases[n]) n = ctNormProg(CT_DATA.ndp4.aliases[n]);
  for (const c of CT_DATA.ndp4.clusters){
    if (c.programmes.some(p => ctNormProg(p) === n)) return c;
  }
  return null;
}
