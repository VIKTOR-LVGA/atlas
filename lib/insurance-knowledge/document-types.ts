export const insuranceDocumentTypes = [
  "policy",
  "general_conditions",
  "supplementary_conditions",
  "invoice",
  "premium_notice",
  "renewal_notice",
  "claim_document",
  "coverage_summary",
  "customer_information",
  "certificate",
  "quote",
  "offer",
  "unknown",
] as const;

export type InsuranceDocumentType = (typeof insuranceDocumentTypes)[number];

export const insuranceDocumentTypeLabels: Record<InsuranceDocumentType, string> = {
  policy: "Polizza personale",
  general_conditions: "Condizioni generali (CGA/AVB)",
  supplementary_conditions: "Condizioni supplementari",
  invoice: "Fattura",
  premium_notice: "Avviso di premio",
  renewal_notice: "Avviso di rinnovo",
  claim_document: "Documento sinistro",
  coverage_summary: "Riepilogo coperture",
  customer_information: "Informazione alla clientela",
  certificate: "Attestato assicurativo",
  quote: "Preventivo / quotazione",
  offer: "Offerta assicurativa",
  unknown: "Non classificato",
};

export type DocumentClassification = {
  type: InsuranceDocumentType;
  confidence: number;
  evidence: string[];
  personalContractScore?: number;
  embeddedGeneralConditionsReference?: boolean;
  reasoningSignals?: string[];
};

export type InsuranceDocumentLanguage = "it" | "de" | "fr" | "other";

export type PersonalContractSignals = {
  score: number;
  evidence: string[];
  embeddedGeneralConditionsReference: boolean;
};

const languageSignals: Record<Exclude<InsuranceDocumentLanguage, "other">, string[]> = {
  it: ["assicurazione", "polizza", "contraente", "premio", "franchigia", "copertura"],
  de: ["versicherung", "police", "versicherungsnehmer", "pramie", "selbstbehalt", "deckung"],
  fr: ["assurance", "police", "preneur", "prime", "franchise", "couverture"],
};

const signals: Array<{
  type: Exclude<InsuranceDocumentType, "unknown">;
  strong: string[];
  weak?: string[];
}> = [
  {
    type: "supplementary_conditions",
    strong: [
      "condizioni supplementari",
      "condizioni complementari",
      "zusatzbedingungen",
      "besondere bedingungen",
      "conditions complementaires",
      "conditions supplementaires",
    ],
  },
  {
    type: "general_conditions",
    strong: [
      "condizioni generali di assicurazione",
      "condizioni generali d assicurazione",
      "allgemeine versicherungsbedingungen",
      "conditions generales d assurance",
    ],
    // Bare "cga"/"avb" alone are too weak: personal policies often cite them.
    weak: [
      "cga",
      "avb",
      "disposizioni comuni",
      "gemeinsame bestimmungen",
      "dispositions communes",
      "edizione",
      "articolo 1",
      "art 1",
    ],
  },
  {
    type: "policy",
    strong: [
      "la mia assicurazione",
      "polizza n",
      "polizza nr",
      "polizza assicurativa",
      "versicherungspolice",
      "police d assurance",
      "numero di polizza",
      "policennummer",
      "numero de police",
      "dati del contratto",
      "panoramica premi",
      "totale premio annuo",
    ],
    weak: [
      "contraente",
      "versicherungsnehmer",
      "preneur d assurance",
      "scadenza principale",
      "modalita di pagamento",
      "zahlungsweise",
      "mode de paiement",
    ],
  },
  {
    type: "premium_notice",
    strong: [
      "avviso di premio",
      "conteggio premi",
      "pramienrechnung",
      "prämienrechnung",
      "decompte de primes",
      "décompte de primes",
    ],
    weak: ["premio dovuto", "zahlbar bis", "prime due"],
  },
  {
    type: "invoice",
    strong: ["fattura", "rechnung", "facture"],
    weak: ["importo totale", "totale da pagare", "zahlungsfrist", "montant a payer"],
  },
  {
    type: "renewal_notice",
    strong: [
      "avviso di rinnovo",
      "rinnovo del contratto",
      "vertragsverlangerung",
      "vertragsverlängerung",
      "avis de renouvellement",
      "renouvellement du contrat",
    ],
  },
  {
    type: "claim_document",
    strong: [
      "annuncio di sinistro",
      "numero sinistro",
      "schadenmeldung",
      "schadennummer",
      "declaration de sinistre",
      "déclaration de sinistre",
      "numero de sinistre",
    ],
  },
  {
    type: "coverage_summary",
    strong: [
      "panoramica delle prestazioni",
      "riepilogo coperture",
      "leistungsübersicht",
      "deckungsübersicht",
      "apercu des prestations",
      "aperçu des prestations",
      "resume des couvertures",
    ],
  },
  {
    type: "quote",
    strong: [
      "preventivo",
      "offerta di assicurazione",
      "offerta assicurativa",
      "quotazione",
      "offerte di premio",
      "versicherungsofferte",
      "offerte",
      "devis d assurance",
      "devis d'assurance",
      "quotation",
      "insurance quote",
      "quote validity",
      "validita dell offerta",
      "validità dell'offerta",
      "offerta valida fino",
    ],
    weak: ["premio proposto", "proposta di premio", "angebot"],
  },
  {
    type: "offer",
    strong: [
      "proposta commerciale",
      "offerta commerciale assicurativa",
      "versicherungsangebot",
      "proposition d assurance",
    ],
  },
  {
    type: "customer_information",
    strong: [
      "informazione alla clientela",
      "informazioni per la clientela",
      "kundeninformation",
      "information a la clientele",
      "information à la clientèle",
    ],
  },
  {
    type: "certificate",
    strong: [
      "attestato d assicurazione",
      "certificato di assicurazione",
      "versicherungsnachweis",
      "versicherungsbestatigung",
      "versicherungsbestätigung",
      "attestation d assurance",
      "certificat d assurance",
    ],
  },
];

/** Deterministic personal-contract signals that prove an individualized policy. */
const personalSignalGroups: Array<{ id: string; weight: number; patterns: RegExp[] }> = [
  {
    id: "policy_number",
    weight: 4,
    patterns: [
      /\bpolizza\s*n[°o.]?\s*[\d.']{5,}/i,
      /\bpolicen(?:nummer|nr\.?)\s*[:.]?\s*[\d.A-Z-]{5,}/i,
      /\bnumero\s+(?:di\s+)?polic(?:e|ia)\s*[:.]?\s*[\d.A-Z-]{5,}/i,
      /\b(?:policy|contract)\s*(?:no|number|#)\s*[:.]?\s*[\d.A-Z-]{5,}/i,
      /\b\d{2,3}[.\s]\d{3}[.\s]\d{3}\b/,
    ],
  },
  {
    id: "named_insured",
    weight: 3,
    patterns: [
      /\bcontraente\b/i,
      /\bversicherungsnehmer\b/i,
      /\bpreneur\b/i,
      /\bsignor[ea]?\b/i,
      /\bmr\.?\s+[A-ZÀ-Ü]/i,
      /\bmme\.?\s+[A-ZÀ-Ü]/i,
    ],
  },
  {
    id: "personal_address",
    weight: 2,
    patterns: [
      /\bvia\s+[A-Za-zÀ-ü]/i,
      /\bstrasse\b/i,
      /\brue\b/i,
      /\b\d{4}\s+[A-Za-zÀ-ü]/,
    ],
  },
  {
    id: "contract_dates",
    weight: 3,
    patterns: [
      /\binizio\s*[:.]?\s*\d{1,2}[./]\d{1,2}[./]\d{2,4}/i,
      /\bscadenza\s*[:.]?\s*\d{1,2}[./]\d{1,2}[./]\d{2,4}/i,
      /\bbeginn\s*[:.]?\s*\d{1,2}[./]\d{1,2}[./]\d{2,4}/i,
      /\bablauf\s*[:.]?\s*\d{1,2}[./]\d{1,2}[./]\d{2,4}/i,
      /\bdebut\s*[:.]?\s*\d{1,2}[./]\d{1,2}[./]\d{2,4}/i,
      /\becheance\s*[:.]?\s*\d{1,2}[./]\d{1,2}[./]\d{2,4}/i,
    ],
  },
  {
    id: "premium",
    weight: 4,
    patterns: [
      /\btotale\s+premio\s+annuo\b/i,
      /\bpremio\s+annuo\b/i,
      /\bjahrespramie\b/i,
      /\bprime\s+annuelle\b/i,
      /\bchf\s*[\d'’.\s]{3,}/i,
    ],
  },
  {
    id: "payment_frequency",
    weight: 2,
    patterns: [
      /\bmodalit[aà]\s+di\s+pagamento\b/i,
      /\bsemestrale\b/i,
      /\btrimestrale\b/i,
      /\bzahlungsweise\b/i,
      /\bmode\s+de\s+paiement\b/i,
    ],
  },
  {
    id: "insured_vehicle",
    weight: 4,
    patterns: [
      /\bveicolo\b/i,
      /\bfahrzeug\b/i,
      /\bvehicule\b/i,
      /\bmercedes[-\s]?benz\b/i,
      /\bvw\b|\baudi\b|\bbmw\b|\btoyota\b|\bskoda\b|\bfiat\b|\brenault\b/i,
    ],
  },
  {
    id: "license_plate",
    weight: 4,
    patterns: [
      /\bnumero\s+di\s+targa\b/i,
      /\btarga\s*[:.]?\s*[A-Z]{2}\s*\d{1,6}\b/i,
      /\bkennzeichen\b/i,
      /\bplaque\b/i,
      /\b[A-Z]{2}\s?\d{4,6}\b/,
    ],
  },
  {
    id: "selected_coverages_table",
    weight: 3,
    patterns: [
      /\bresponsabilit[aà]\s+civile\b/i,
      /\bcasco\s+(?:totale|parziale)\b/i,
      /\bvollkasko\b|\bteilkasko\b/i,
      /\bpanoramica\s+(?:premi|delle\s+prestazioni)\b/i,
      /\bprestazioni\s+assicurate\b/i,
    ],
  },
  {
    id: "deductible",
    weight: 2,
    patterns: [/\bfranchigia\b/i, /\bselbstbehalt\b/i, /\bfranchise\b/i],
  },
  {
    id: "personal_policy_title",
    weight: 3,
    patterns: [
      /\bla\s+mia\s+assicurazione\b/i,
      /\bmeine\s+versicherung\b/i,
      /\bmon\s+assurance\b/i,
      /\bcopia\s+polizza\b/i,
    ],
  },
];

export function normalizeKnowledgeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function scorePersonalContractSignals(text: string): PersonalContractSignals {
  const sample = text.slice(0, 80000);
  const evidence: string[] = [];
  let score = 0;

  for (const group of personalSignalGroups) {
    if (group.patterns.some((pattern) => pattern.test(sample))) {
      score += group.weight;
      evidence.push(group.id);
    }
  }

  const normalized = normalizeKnowledgeText(sample);
  const embeddedGeneralConditionsReference =
    normalized.includes("condizioni generali") ||
    normalized.includes("allgemeine versicherungsbedingungen") ||
    normalized.includes("conditions generales") ||
    /\bcga\b/.test(normalized) ||
    /\bavb\b/.test(normalized);

  return { score, evidence, embeddedGeneralConditionsReference };
}

export function classifyInsuranceDocument(text: string): DocumentClassification {
  const sample = text.slice(0, 80000);
  const normalized = normalizeKnowledgeText(sample);
  const personal = scorePersonalContractSignals(sample);

  const ranked = signals
    .map((definition) => {
      const strong = definition.strong.filter((term) =>
        normalized.includes(normalizeKnowledgeText(term))
      );
      const weak = (definition.weak ?? []).filter((term) =>
        normalized.includes(normalizeKnowledgeText(term))
      );
      return {
        type: definition.type,
        score: strong.length * 4 + weak.length,
        evidence: [...strong, ...weak],
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);

  const winner = ranked[0];
  const conditions = ranked.find(
    (candidate) =>
      candidate.type === "general_conditions" ||
      candidate.type === "supplementary_conditions"
  );
  const policyCandidate = ranked.find((candidate) => candidate.type === "policy");

  // Strong personal-contract evidence wins over CGA citations inside a personal policy.
  const PERSONAL_POLICY_THRESHOLD = 8;
  if (personal.score >= PERSONAL_POLICY_THRESHOLD) {
    return {
      type: "policy",
      confidence: Math.min(99, 70 + personal.score * 2),
      evidence: [
        ...(policyCandidate?.evidence ?? []).slice(0, 4),
        ...personal.evidence.slice(0, 6),
      ],
      personalContractScore: personal.score,
      embeddedGeneralConditionsReference: personal.embeddedGeneralConditionsReference,
      reasoningSignals: [
        "personal_contract_signals_override",
        ...personal.evidence.slice(0, 8),
      ],
    };
  }

  // Pure/generic conditions only when personal signals are weak.
  if (conditions && conditions.score >= 4 && personal.score < 5) {
    return {
      type: conditions.type,
      confidence: Math.min(99, 58 + conditions.score * 7),
      evidence: conditions.evidence.slice(0, 6),
      personalContractScore: personal.score,
      embeddedGeneralConditionsReference: false,
      reasoningSignals: ["conditions_dominant", ...conditions.evidence.slice(0, 4)],
    };
  }

  if (!winner) {
    return {
      type: "unknown",
      confidence: 0,
      evidence: [],
      personalContractScore: personal.score,
      embeddedGeneralConditionsReference: personal.embeddedGeneralConditionsReference,
      reasoningSignals: personal.evidence.slice(0, 6),
    };
  }

  // Prefer policy / coverage_summary over weak CGA mentions.
  const preferred =
    personal.score >= 5 &&
    (policyCandidate || ranked.find((c) => c.type === "coverage_summary"))
      ? policyCandidate ??
        ranked.find((c) => c.type === "coverage_summary") ??
        winner
      : winner;

  return {
    type: preferred.type,
    confidence: Math.min(99, 58 + preferred.score * 7 + Math.min(personal.score, 10)),
    evidence: preferred.evidence.slice(0, 6),
    personalContractScore: personal.score,
    embeddedGeneralConditionsReference:
      preferred.type === "policy" ? personal.embeddedGeneralConditionsReference : false,
    reasoningSignals: [
      preferred.type,
      ...personal.evidence.slice(0, 4),
      ...preferred.evidence.slice(0, 3),
    ],
  };
}

export function detectInsuranceDocumentLanguage(
  text: string
): InsuranceDocumentLanguage {
  const normalized = normalizeKnowledgeText(text.slice(0, 30000));
  const ranked = Object.entries(languageSignals)
    .map(([language, terms]) => ({
      language: language as Exclude<InsuranceDocumentLanguage, "other">,
      score: terms.filter((term) => normalized.includes(normalizeKnowledgeText(term)))
        .length,
    }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score ? ranked[0].language : "other";
}

export function isInsuranceDocumentType(value: string): value is InsuranceDocumentType {
  return insuranceDocumentTypes.includes(value as InsuranceDocumentType);
}

/** Friendly label for UI — never expose raw enums to end users as errors. */
export function friendlyInsuranceDocumentTypeLabel(type: string | null | undefined) {
  if (!type) return insuranceDocumentTypeLabels.unknown;
  if (isInsuranceDocumentType(type)) return insuranceDocumentTypeLabels[type];
  return insuranceDocumentTypeLabels.unknown;
}
