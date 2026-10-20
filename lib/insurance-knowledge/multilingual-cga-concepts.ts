import type { TypedPolicyType } from "@/lib/types";

/**
 * Independently authored interpretation guidance. The source language
 * keywords identify concepts, but never supply evidence of a customer's
 * contract or import insurer CGA text.
 */
export type CgaMultilingualConcept = {
  id: string;
  policyTypes: readonly TypedPolicyType[];
  markers: { it: readonly string[]; de: readonly string[]; fr: readonly string[] };
  hint: string;
};

export const swissMultilingualCgaConcepts: readonly CgaMultilingualConcept[] = [
  {
    id: "ch-cga-language-edition-001", policyTypes: ["car", "health", "household", "liability", "legal", "other"],
    markers: {
      it: ["condizioni generali di assicurazione", "condizioni particolari", "edizione"],
      de: ["allgemeine versicherungsbedingungen", "besondere versicherungsbedingungen", "ausgabe"],
      fr: ["conditions generales d assurance", "conditions particulieres", "edition"]
    },
    hint: "CGA (IT/FR) = AVB (DE); CSA (IT/FR) = ZVB (DE); CPA (IT/FR) = BVB (DE), subject to insurer-specific naming. Match the stated insurer, product and edition before explaining a condition. General terms are not proof that an optional module is insured. Newest published is not necessarily the edition applicable to this policy."
  },
  {
    id: "ch-cga-motor-premium-multilingual-001", policyTypes: ["car"],
    markers: {
      it: ["totale premio annuo", "premio annuo", "modalita di pagamento"],
      de: ["jahrespraemie", "jahrespramie", "zahlungsweise", "halbjaehrlich", "halbjahrlich"],
      fr: ["prime annuelle", "prime totale annuelle", "mode de paiement", "semestriel"]
    },
    hint: "IT premio annuo / DE Jahresprämie / FR prime annuelle: the contract-year premium is distinct from a half-yearly payment cadence (semestrale / halbjährlich / semestriel). Separate pre-discount subtotals and final net payable including taxes. Never multiply an annual premium by two because invoices are semestral."
  },
  {
    id: "ch-cga-motor-exclusions-multilingual-001", policyTypes: ["car"],
    markers: {
      it: ["non assicurato", "non compreso", "esclusione di copertura"],
      de: ["nicht versichert", "nicht eingeschlossen", "deckungsausschluss"],
      fr: ["non assure", "non couvert", "exclusion de couverture"]
    },
    hint: "IT assicurato Sì/No; DE versichert Ja/Nein; FR assuré Oui/Non. A 'No/Nein/Non' in a personal selected-cover table is negative coverage evidence. Distinguish the exclusions of a contractually selected module from optional covers merely described in general CGA."
  },
  {
    id: "ch-cga-health-family-premium-multilingual-001", policyTypes: ["health"],
    markers: {
      it: ["panoramica dei premi", "totale premio mensile", "a suo carico"],
      de: ["praemienuebersicht", "pramienubersicht", "monatliche gesamtpraemie", "zu ihren lasten"],
      fr: ["apercu des primes", "total des primes mensuelles", "a votre charge"]
    },
    hint: "IT panoramica dei premi / DE Prämienübersicht / FR aperçu des primes: distinguish per-person LAMal base and LCA supplemental premiums from a final family payable monthly total. Do not add the household total to its product or insured-person components."
  },
  {
    id: "ch-cga-health-franchise-multilingual-001", policyTypes: ["health"],
    markers: {
      it: ["franchigia annua", "aliquota percentuale", "franchigia"],
      de: ["franchise", "kostenbeteiligung", "selbstbehalt"],
      fr: ["franchise annuelle", "quote-part", "franchise"]
    },
    hint: "LAMal IT franchigia + aliquota / DE Franchise + Selbstbehalt / FR franchise + quote-part are distinct. In other insurance types, DE Selbstbehalt often means the deductible instead. Use document category and person-specific clauses; never confuse an optional higher franchise shown in comparison material with the elected franchise."
  },
  {
    id: "ch-cga-claims-deadlines-multilingual-001", policyTypes: ["car", "health", "household", "liability", "legal", "other"],
    markers: {
      it: ["termine di disdetta", "obblighi in caso di sinistro", "scadenza"],
      de: ["kuendigungsfrist", "kundigungsfrist", "obliegenheiten im schadenfall"],
      fr: ["delai de resiliation", "obligations en cas de sinistre", "echeance"]
    },
    hint: "IT disdetta / DE Kündigung / FR résiliation, and claims duties, differ by product and edition. Distinguish coverage start/end dates, notice deadline and automatic renewal. Do not infer an individual's contractual deadline from generic public CGA or an example date."
  }  ,
  {
    id: "ch-cga-travel-modules-multilingual-001", policyTypes: ["other"],
    markers: {
      it: ["assicurazione viaggi", "spese di annullamento", "bagaglio da viaggio"],
      de: ["reiseversicherung", "annullierungskosten", "reisegepaeck"],
      fr: ["assurance voyage", "frais d annulation", "bagages"]
    },
    hint: "Travel CGA/AB can describe cancellation, assistance, baggage, legal protection and rental-car deductible modules. Separate the product catalogue from the modules individually purchased and their geographic scope. IT spese di annullamento / DE Annullierungskosten / FR frais d'annulation are not a guaranteed reimbursement unless shown as selected in the personal policy."
  },
  {
    id: "ch-cga-dental-insurance-multilingual-001", policyTypes: ["health"],
    markers: {
      it: ["assicurazione cure dentarie", "cure dentarie", "cure dentistiche"],
      de: ["zahnpflegeversicherung", "zahnversicherung", "zahnbehandlung"],
      fr: ["assurance soins dentaires", "soins dentaires", "traitements dentaires"]
    },
    hint: "Dental insurance is a distinct supplementary product. IT cure dentarie / DE Zahnpflege / FR soins dentaires: read the subscribed tariff, coverage share, insured annual limit, waiting period and age restrictions only from the corresponding policy plus its applicable edition of dental CGA; a dental CGA alone does not establish purchased cover."
  },
  {
    id: "ch-cga-daily-sickness-multilingual-001", policyTypes: ["other"],
    markers: {
      it: ["indennita giornaliera", "salario assicurato", "periodo d attesa"],
      de: ["krankentaggeld", "versicherter lohn", "wartefrist"],
      fr: ["indemnites journalieres", "salaire assure", "delai d attente"]
    },
    hint: "Collective sickness daily allowance: IT indennità giornaliera / DE Krankentaggeld / FR indemnités journalières. Identify the employer/insured group, insured salary, waiting period (carenza/Wartefrist/délai d'attente), benefit percentage and duration. Never infer a worker's exact income replacement from a generic 2026 AVB/CGA without their specific employer contract."
  }

];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getMultilingualCgaInterpretationHints(
  text: string,
  policyType: TypedPolicyType,
  maxHints = 2
): { hints: string[]; ruleIds: string[] } {
  const normalized = normalize(text);
  const applicable = swissMultilingualCgaConcepts.filter((concept) =>
    concept.policyTypes.includes(policyType) &&
    Object.values(concept.markers).some((terms) =>
      terms.some((term) => normalized.includes(normalize(term)))
    )
  );
  const selected = applicable.slice(0, Math.max(0, maxHints));
  return {
    hints: selected.map((concept) => `- [${concept.id}] ${concept.hint}`),
    ruleIds: selected.map((concept) => concept.id)
  };
}
