/**
 * Public official catalogs, not mirrored copyrighted CGA PDFs.
 * An entry's latest online edition is NOT automatically the edition governing
 * a customer's signed policy. The contract's date/product is authoritative.
 */
export type CgaCatalogEntry = {
  id: string;
  provider: string;
  officialUrl: string;
  documentFamily: "cga_catalog" | "product_terms" | "regulator_guide";
  coverageFamilies: string[];
  productExamples: string[];
  checkedAt: string;
  limitation: string;
};

const contractualEditionRule =
  "Catalog only. Match named product, insured risk, individual contract and applicable edition; never infer purchased coverage from this page.";

export const officialSwissInsuranceCatalogs: readonly CgaCatalogEntry[] = [
  {
    id: "helsana-private-conditions",
    provider: "Helsana",
    officialUrl: "https://www.helsana.ch/it/privati/servizi/documenti-e-download/condizioni-assicurazione.html",
    documentFamily: "cga_catalog",
    coverageFamilies: ["LAMal", "LCA", "travel", "legal", "hospital", "health_supplementary"],
    productExamples: ["PREMED-24", "BeneFit PLUS", "COMPLETA", "HOSPITAL", "WORLD", "Advocare"],
    checkedAt: "2026-10-20", limitation: contractualEditionRule
  },
  {
    id: "helsana-business-conditions",
    provider: "Helsana",
    officialUrl: "https://www.helsana.ch/it/aziende/servizi/documenti-e-download/condizioni-assicurazione.html",
    documentFamily: "cga_catalog",
    coverageFamilies: ["LAINF", "daily_sickness", "business"],
    productExamples: ["Business Accident", "Business Salary"],
    checkedAt: "2026-10-20", limitation: contractualEditionRule
  },
  {
    id: "css-insurance-conditions",
    provider: "CSS",
    officialUrl: "https://www.css.ch/it/clienti-privati/presto-fatto/fallo-da-solo/ordinazione/cga.html",
    documentFamily: "cga_catalog",
    coverageFamilies: ["LAMal", "LCA", "health_supplementary", "household", "liability", "building", "legal", "travel"],
    productExamples: ["myFlex", "Callmed", "economia domestica", "RC privata"],
    checkedAt: "2026-10-20", limitation: contractualEditionRule
  },
  {
    id: "swica-insurance-conditions",
    provider: "SWICA",
    officialUrl: "https://www.swica.ch/it/privati/servizi/richiedere-scaricare/download",
    documentFamily: "cga_catalog",
    coverageFamilies: ["LAMal", "LCA", "health_supplementary", "hospital", "travel", "daily_sickness"],
    productExamples: ["FAVORIT", "COMPLETA", "OPTIMA", "HOSPITA", "VACANZA"],
    checkedAt: "2026-10-20", limitation: contractualEditionRule
  },
  {
    id: "sanitas-insurance-conditions",
    provider: "Sanitas",
    officialUrl: "https://www.sanitas.com/it/clienti-privati/servizi/aiuto/documenti-e-download/condizioni-assicurazione.html",
    documentFamily: "cga_catalog",
    coverageFamilies: ["LAMal", "LCA", "health_supplementary", "hospital", "daily_sickness"],
    productExamples: ["Vital", "Hospital", "Dental", "complementari"],
    checkedAt: "2026-10-20", limitation: contractualEditionRule
  },
  {
    id: "axa-vehicle-conditions",
    provider: "AXA",
    officialUrl: "https://www.axa.ch/it/clienti-privati/offerte/veicoli-viaggi/assicurazione-auto.html",
    documentFamily: "product_terms",
    coverageFamilies: ["vehicle", "motor_liability", "casco", "legal"],
    productExamples: ["RC auto", "casco parziale", "casco totale"],
    checkedAt: "2026-10-20", limitation: contractualEditionRule
  },
  {
    id: "zurich-vehicle-conditions",
    provider: "Zurich",
    officialUrl: "https://www.zurich.ch/it/clientela-privata/mobilita-viaggi/assicurazione-auto",
    documentFamily: "product_terms",
    coverageFamilies: ["vehicle", "motor_liability", "casco", "assistance"],
    productExamples: ["RC auto", "casco parziale", "collisione", "protezione bonus"],
    checkedAt: "2026-10-20", limitation: contractualEditionRule
  },
  {
    id: "finma-private-insurance-law",
    provider: "FINMA",
    officialUrl: "https://www.finma.ch/it/documentazione/basi-legali/leggi-e-ordinanze/assicurazioni/",
    documentFamily: "regulator_guide",
    coverageFamilies: ["LCA", "LSA", "private_insurance", "intermediaries"],
    productExamples: ["contratto d'assicurazione", "sorveglianza"],
    checkedAt: "2026-10-20",
    limitation: "Legal framework only; it does not establish any personal policy coverage."
  },
  {
    id: "bag-premiums-and-cost-sharing",
    provider: "UFSP",
    officialUrl: "https://www.bag.admin.ch/it/assicurazione-malattie-premi-e-partecipazione-ai-costi",
    documentFamily: "regulator_guide",
    coverageFamilies: ["LAMal", "franchise", "cost_share"],
    productExamples: ["franchigia", "aliquota percentuale", "premi"],
    checkedAt: "2026-10-20",
    limitation: "General law and explanatory values may change; individual coverage and premiums require contract-year evidence."
  },
  {
    id: "priminfo-health-premium-comparison",
    provider: "Priminfo (UFSP)",
    officialUrl: "https://www.priminfo.admin.ch/it/praemien",
    documentFamily: "regulator_guide",
    coverageFamilies: ["LAMal", "premium_comparison"],
    productExamples: ["modello", "regione", "franchigia", "anno tariffario"],
    checkedAt: "2026-10-20",
    limitation: "Public price comparison, not proof of the policyholder's paid amount."
  },
  {
    id: "suva-accident-guidance",
    provider: "Suva",
    officialUrl: "https://www.suva.ch/it-ch/assicurazione/assicurazione-contro-gli-infortuni/assicurazione-contro-gli-infortuni-lainf/assicurazione-contro-gli-infortuni-chi-e-assicurato",
    documentFamily: "regulator_guide",
    coverageFamilies: ["LAINF", "accident", "occupational"],
    productExamples: ["infortuni professionali", "infortuni non professionali"],
    checkedAt: "2026-10-20",
    limitation: "Employment facts and actual insured benefits must be established from authorized personal records."
  },
  {
    id: "bsv-pension-overview",
    provider: "UFAS",
    officialUrl: "https://www.bsv.admin.ch/it/tre-pilastri",
    documentFamily: "regulator_guide",
    coverageFamilies: ["LPP", "3a", "3b", "life"],
    productExamples: ["primo pilastro", "secondo pilastro", "terzo pilastro"],
    checkedAt: "2026-10-20",
    limitation: "General pension context; cannot determine individual benefits or contractual contributions."
  },
  {
    id: "svv-afa-glossary",
    provider: "ASA / AFA",
    officialUrl: "https://svv.ch/it/informazioni-di-base/contesto/glossario",
    documentFamily: "regulator_guide",
    coverageFamilies: ["terminology", "all"],
    productExamples: ["glossario assicurativo multilingue AFA"],
    checkedAt: "2026-10-20",
    limitation: "External glossary reference only: text is not reproduced or assumed to be licensed for model training."
  }
];
