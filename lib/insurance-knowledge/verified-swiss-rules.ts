import type { SwissKnowledgeRule } from "@/lib/insurance-knowledge/types";

/**
 * Original ATLAS interpretations grounded in regulator and insurer education.
 * The linked pages are references, not proof that a customer bought a benefit.
 * Do not embed copyrighted CGA bodies or a customer's source documents here.
 */
export const VERIFIED_SWISS_INSURANCE_RULES: SwissKnowledgeRule[] = [
  {
    id: "ch-verified-lamal-cost-sharing-2026",
    category: "health", policyType: "health", subtypes: ["lamal_base"],
    jurisdiction: "CH", sourceType: "official", sourceName: "UFSP: premi e partecipazione ai costi",
    sourceUrl: "https://www.bag.admin.ch/it/assicurazione-malattie-premi-e-partecipazione-ai-costi",
    lastReviewed: "2026-10-20",
    ruleSummary: "LAMal separates annual franchise, percentage cost sharing and hospital contribution.",
    extractionHint: "LAMal cost sharing: keep actual chosen annual franchise separate from the 10% aliquota percentuale and hospital daily contribution. The standard adult franchise of CHF 300 and children's statutory ordinary franchise of CHF 0 are general context, never evidence of the insured person's chosen franchise. Record a higher elective franchise only when stated in the individual policy.",
    riskIfMisread: "Confusing statutory examples, cost sharing and the active contract franchise.",
    appliesWhen: { policyTypes: ["health"], keywords: ["franchigia", "aliquota", "partecipazione ai costi", "lamal", "kvg"] }
  },
  {
    id: "ch-verified-lamal-optional-franchise-2026",
    category: "health", policyType: "health", subtypes: ["lamal_base"],
    jurisdiction: "CH", sourceType: "official", sourceName: "UFSP: franchigie opzionali",
    sourceUrl: "https://www.bag.admin.ch/it/assicurazione-malattie-franchigie-opzionali",
    lastReviewed: "2026-10-20",
    ruleSummary: "A table comparing optional franchises is not evidence of the elected franchise.",
    extractionHint: "Treat proposals, savings tables, alternative franchise simulations and renewal information leaflets as comparison material. Extract the contracted franchise and current premium from the personal policy's effective-year product section, not a higher or lower illustrative franchise in an attached marketing or change-of-franchise sheet.",
    riskIfMisread: "Turning a hypothetical franchise or premium into an active policy fact.",
    appliesWhen: { policyTypes: ["health"], keywords: ["franchigia", "franchigie", "risparmiare", "franchise", "sconto"] }
  },
  {
    id: "ch-verified-lamal-premium-location-year-2026",
    category: "health", policyType: "health", subtypes: ["lamal_base"],
    jurisdiction: "CH", sourceType: "official", sourceName: "UFSP: regioni di premio e Priminfo",
    sourceUrl: "https://www.bag.admin.ch/it/assicurazione-malattie-regioni-di-premio",
    lastReviewed: "2026-10-20",
    ruleSummary: "Public LAMal prices vary by year, age band, location, model and franchise.",
    extractionHint: "Never overwrite a policy's printed contractual premium with an unrelated Priminfo tariff, average or current-year quote. Record contract year, premium region, model and insured person's age band only when the personal PDF supports them. Do not compare historical premium amounts as though they were current offers.",
    riskIfMisread: "Reporting public comparison tariffs as paid premiums on an older individual policy.",
    appliesWhen: { policyTypes: ["health"], keywords: ["regione di premio", "premi", "modello", "priminfo", "premed"] }
  },
  {
    id: "ch-verified-health-accident-vs-lainf-2026",
    category: "accident_income", policyType: "health",
    jurisdiction: "CH", sourceType: "official", sourceName: "Suva: chi è assicurato LAINF",
    sourceUrl: "https://www.suva.ch/it-ch/assicurazione/assicurazione-contro-gli-infortuni/assicurazione-contro-gli-infortuni-lainf/assicurazione-contro-gli-infortuni-chi-e-assicurato",
    lastReviewed: "2026-10-20",
    ruleSummary: "Employee accident insurance and LAMal accident inclusion are different.",
    extractionHint: "Separate LAINF work/nonwork accident insurance from 'con infortunio' and 'senza infortunio' printed inside a LAMal product. Working-hours general rules never establish this individual person's actual coverage or employment. Extract the actual document's accident status for each insured person.",
    riskIfMisread: "Inventing or deleting accident cover based on general employment guidance.",
    appliesWhen: { policyTypes: ["health"], keywords: ["infortunio", "infortuni", "unfall", "lainf", "uvg"] }
  },
  {
    id: "ch-verified-helsana-multiperson-overview-2026",
    category: "health", policyType: "health",
    jurisdiction: "CH", sourceType: "insurer", sourceName: "Helsana: struttura di una polizza assicurativa",
    sourceUrl: "https://www.helsana.ch/it/privati/servizi/assicurazione/polizza-assicurativa.html",
    lastReviewed: "2026-10-20",
    ruleSummary: "A household health envelope may contain multiple people, products and supporting leaflets.",
    extractionHint: "For a health renewal packet, identify the premium overview per person and the overall monthly household payable total, then corroborate LAMal and LCA products on their individual pages. Never sum the overall total again with its person or product components. Distinguish a personal policy from accompanying letters, marketing brochures or change-of-franchise tables.",
    riskIfMisread: "Double-counting a family premium or extracting brochure features as subscribed cover.",
    appliesWhen: { policyTypes: ["health"], keywords: ["panoramica dei premi", "assicurazione integrativa", "totale premio mensile", "helsana", "assicurato"] }
  },
  {
    id: "ch-verified-private-contract-document-hierarchy-2026",
    category: "legal_travel_personal", policyType: "other",
    jurisdiction: "CH", sourceType: "official", sourceName: "FINMA: basi legali delle assicurazioni",
    sourceUrl: "https://www.finma.ch/it/documentazione/basi-legali/leggi-e-ordinanze/assicurazioni/",
    lastReviewed: "2026-10-20",
    ruleSummary: "LCA contract facts depend on the signed policy, applicable conditions and edition.",
    extractionHint: "Separate personal policy schedule, particular conditions (CPA), supplemental conditions (CSA/CC) and general terms (CGA/AVB). A general conditions document describes potential contractual clauses, not necessarily a purchased optional benefit. Resolve applicable product and edition from the individual contract; when absent, say 'versione delle condizioni da verificare'.",
    riskIfMisread: "Asserting a coverage or exclusion from the wrong CGA edition.",
    appliesWhen: { keywords: ["cga", "avb", "condizioni generali", "condizioni particolari", "lca", "vvg"] }
  },
  {
    id: "ch-verified-motor-final-premium-2026",
    category: "vehicle", policyType: "car",
    jurisdiction: "CH", sourceType: "insurer", sourceName: "Zurich: assicurazione auto",
    sourceUrl: "https://www.zurich.ch/it/clientela-privata/mobilita-viaggi/assicurazione-auto",
    lastReviewed: "2026-10-20",
    ruleSummary: "Motor annual premium and installment frequency are separate.",
    extractionHint: "On motor policies distinguish coverage subtotals from final payable 'totale premio annuo' AFTER explicit discounts, installment surcharges and statutory taxes. The payment mode 'semestrale' is billing cadence, not proof that the final annual figure must be doubled. Do not add taxes again when the final total says they are included.",
    riskIfMisread: "Double-billing annual premiums or replacing final net total with a pre-adjustment subtotal.",
    appliesWhen: { policyTypes: ["car"], keywords: ["premio annuo", "premio totale", "semestrale", "ribasso", "tasse legali"] }
  },
  {
    id: "ch-verified-motor-coverage-status-2026",
    category: "vehicle", policyType: "car",
    jurisdiction: "CH", sourceType: "insurer", sourceName: "AXA: assicurazione veicoli e CGA",
    sourceUrl: "https://www.axa.ch/it/clienti-privati/offerte/veicoli-viaggi/assicurazione-auto.html",
    lastReviewed: "2026-10-20",
    ruleSummary: "Motor liability, partial/full casco and extras are different coverages.",
    extractionHint: "Read insured/not insured (Si/No, Ja/Nein) status per motor coverage. RC verso terzi is different from damage to the insured vehicle; collision and partial casco can carry separate premiums and deductibles. Do not infer roadside assistance, legal expenses, passenger accident or cyber coverage from a list where the item is marked 'No'.",
    riskIfMisread: "Reporting explicitly excluded vehicle services as purchased protection.",
    appliesWhen: { policyTypes: ["car"], keywords: ["collisione", "casco", "responsabilita civile", "assicurato", "non assicurato"] }
  },
  {
    id: "ch-verified-motor-deductible-conditions-2026",
    category: "vehicle", policyType: "car",
    jurisdiction: "CH", sourceType: "insurer", sourceName: "Zurich: assicurazione auto",
    sourceUrl: "https://www.zurich.ch/it/clientela-privata/mobilita-viaggi/assicurazione-auto",
    lastReviewed: "2026-10-20",
    ruleSummary: "Vehicle deductibles differ by damage type and driver/claim circumstance.",
    extractionHint: "A vehicle policy may specify distinct franchigie for RC, collision, parking, glass and drivers under a stated age. Record deductible against the matching coverage and condition; never turn multiple conditional amounts into one unconditional franchise applying to every claim.",
    riskIfMisread: "Presenting a conditional or age-dependent deductible as universal.",
    appliesWhen: { policyTypes: ["car"], keywords: ["franchigia", "conducenti", "collisione", "parcheggio", "vetri"] }
  },
  {
    id: "ch-verified-private-vs-motor-liability-2026",
    category: "liability_household", policyType: "liability",
    jurisdiction: "CH", sourceType: "official", sourceName: "FINMA: diritto del contratto assicurativo",
    sourceUrl: "https://www.finma.ch/it/documentazione/basi-legali/leggi-e-ordinanze/assicurazioni/",
    lastReviewed: "2026-10-20",
    ruleSummary: "Private third-party liability and mandatory vehicle liability are not interchangeable.",
    extractionHint: "Keep RC privata, RC professionale and RC veicoli separate. Read the insured persons, object, territory and limit from the contract. General motor compulsory liability does not prove that an individual also holds private liability.",
    riskIfMisread: "Mistaking one type of liability for another.",
    appliesWhen: { policyTypes: ["liability"], keywords: ["responsabilita civile privata", "rc privata", "privathaftpflicht", "massimale"] }
  },
  {
    id: "ch-verified-household-building-contract-scope-2026",
    category: "liability_household", policyType: "household",
    jurisdiction: "CH", sourceType: "insurer", sourceName: "Vaudoise: CGA patrimonio e proprietà",
    sourceUrl: "https://www.vaudoise.ch/it/chi-siamo/broker/documentazione/condizioni-generali",
    lastReviewed: "2026-10-20",
    ruleSummary: "Household movable property, buildings and personal liability are separate insurable interests.",
    extractionHint: "For household and building cover, bind sums and covered risks to the proper insured location and product. Do not infer all-risk, accidental damage, glass, bicycle or valuables extensions merely from a general product description; honor exclusions, peril-specific limits, and the relevant contractual CGA edition.",
    riskIfMisread: "Extending house contents cover to buildings or excluded optional risks.",
    appliesWhen: { policyTypes: ["household"], keywords: ["economia domestica", "mobilia", "stabili", "furto", "fabbricato"] }
  },
  {
    id: "ch-verified-health-cga-product-edition-2026",
    category: "health", policyType: "health", subtypes: ["lca_complementary"],
    jurisdiction: "CH", sourceType: "insurer", sourceName: "Helsana: condizioni assicurazione per prodotto",
    sourceUrl: "https://www.helsana.ch/it/privati/servizi/documenti-e-download/condizioni-assicurazione.html",
    lastReviewed: "2026-10-20",
    ruleSummary: "LCA supplemental health conditions depend on named product and edition.",
    extractionHint: "Match the individual LCA product name with applicable CGA, CSA and CPA edition. An insurer's public catalog lists products that the policyholder may NOT have purchased. Never promote a catalog item or later edition into active coverage without personalized documentary evidence.",
    riskIfMisread: "Confusing product catalog features and the insured's actual purchased options.",
    appliesWhen: { policyTypes: ["health"], keywords: ["lca", "completa", "world", "hospital", "condizioni supplementari", "cga"] }
  },
  {
    id: "ch-verified-lainf-employee-work-hours-2026",
    category: "accident_income", policyType: "other",
    jurisdiction: "CH", sourceType: "official", sourceName: "Suva: assicurazione contro gli infortuni",
    sourceUrl: "https://www.suva.ch/it-ch/assicurazione/assicurazione-contro-gli-infortuni/assicurazione-contro-gli-infortuni-lainf/assicurazione-contro-gli-infortuni-chi-e-assicurato",
    lastReviewed: "2026-10-20",
    ruleSummary: "Compulsory workplace accident and nonoccupational accident eligibility vary.",
    extractionHint: "For employer LAINF documentation separate professional and nonprofessional accident, insured earnings, benefit periods and exclusions. The minimum weekly-hours principle is background knowledge only: employment and benefit status for an individual must be evidenced by personal/employer records.",
    riskIfMisread: "Promising nonoccupational accident coverage absent the individual's employment conditions.",
    appliesWhen: { keywords: ["lainf", "uvg", "infortuni non professionali", "infortuni professionali"] }
  },
  {
    id: "ch-verified-income-daily-benefits-2026",
    category: "accident_income", policyType: "other",
    jurisdiction: "CH", sourceType: "insurer", sourceName: "Helsana: CGA Business Salary",
    sourceUrl: "https://www.helsana.ch/it/aziende/servizi/documenti-e-download/condizioni-assicurazione.html",
    lastReviewed: "2026-10-20",
    ruleSummary: "Sickness daily benefits differ from LAMal medical expense cover and statutory accident compensation.",
    extractionHint: "For Krankentaggeld / indennita giornaliera malattia identify legal/contractual basis, waiting days, replacement percentage, insured salary base, duration and employer participation separately. Do not import another employer's or insurer's default benefit terms into an individual's contract.",
    riskIfMisread: "Guaranteeing income replacement from an unrelated insurance scheme.",
    appliesWhen: { keywords: ["indennita giornaliera", "krankentaggeld", "perdita di guadagno", "salario assicurato"] }
  },
  {
    id: "ch-verified-pension-pillar-difference-2026",
    category: "life_pension", policyType: "other",
    jurisdiction: "CH", sourceType: "official", sourceName: "UFAS: sistema dei tre pilastri",
    sourceUrl: "https://www.bsv.admin.ch/it/tre-pilastri",
    lastReviewed: "2026-10-20",
    ruleSummary: "Old-age social insurance, occupational pension and private pillar 3a/3b differ.",
    extractionHint: "Distinguish compulsory occupational pension certificate, individual 3a banking contributions, 3a life-insurance premium, free 3b life policies, risk protection and accumulated savings. Do not add retirement savings contributions to household insurance-risk premiums as if they had the same meaning.",
    riskIfMisread: "Misclassifying retirement savings, death benefits or accumulated capital as ordinary premiums.",
    appliesWhen: { keywords: ["pilastro 3a", "pilastro 3b", "previdenza", "lpp", "bvg", "assicurazione vita"] }
  },
  {
    id: "ch-verified-pension-tax-year-2026",
    category: "life_pension", policyType: "other",
    jurisdiction: "CH", sourceType: "official", sourceName: "UFAS: contributi al pilastro 3a",
    sourceUrl: "https://www.bsv.admin.ch/it/contributi-al-pilastro-3a",
    lastReviewed: "2026-10-20",
    ruleSummary: "Tax-deductible 3a limits change by tax year and employment status.",
    extractionHint: "Extract only the actual contractual 3a contribution or insurance premium, duration and beneficiary. Do not replace a contribution with a legal annual maximum or treat a general tax limit as the customer's current payment. Any tax statement must be tagged with the tax year and reviewed against up-to-date law.",
    riskIfMisread: "Presenting statutory deduction ceilings as invested amounts or insurance benefits.",
    appliesWhen: { keywords: ["3a", "op3", "deduzione fiscale", "riscatto", "previdenza vincolata"] }
  },
  {
    id: "ch-verified-legal-travel-coverage-2026",
    category: "legal_travel_personal", policyType: "legal",
    jurisdiction: "CH", sourceType: "insurer", sourceName: "AXA-ARAG: protezione giuridica",
    sourceUrl: "https://www.axa.ch/it/clienti-privati/offerte/diritto-cyber/assicurazione-di-protezione-giuridica/protezione-giuridica-per-privati.html",
    lastReviewed: "2026-10-20",
    ruleSummary: "Legal protection may be a standalone product or a named optional rider.",
    extractionHint: "Separate explicitly purchased private, traffic, internet or patient legal cover from generic advisory service marketing. Identify waiting periods, insured dispute types, monetary ceilings, territory and version of contractual conditions. Free bundled coverage has effective payable premium zero when explicitly stated.",
    riskIfMisread: "Inferring general legal-expenses protection from a small rider or excluded module.",
    appliesWhen: { policyTypes: ["legal"], keywords: ["protezione giuridica", "rechtsschutz", "advocare", "spese legali"] }
  }
];
