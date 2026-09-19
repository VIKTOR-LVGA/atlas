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
  "unknown",
] as const;

export type InsuranceDocumentType = (typeof insuranceDocumentTypes)[number];

export const insuranceDocumentTypeLabels: Record<InsuranceDocumentType, string> = {
  policy: "Polizza",
  general_conditions: "Condizioni generali (CGA/AVB)",
  supplementary_conditions: "Condizioni supplementari",
  invoice: "Fattura",
  premium_notice: "Avviso di premio",
  renewal_notice: "Avviso di rinnovo",
  claim_document: "Documento sinistro",
  coverage_summary: "Riepilogo coperture",
  customer_information: "Informazione alla clientela",
  certificate: "Attestato assicurativo",
  unknown: "Non classificato",
};

export type DocumentClassification = {
  type: InsuranceDocumentType;
  confidence: number;
  evidence: string[];
};

export type InsuranceDocumentLanguage = "it" | "de" | "fr" | "other";

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
      "cga",
      "avb",
    ],
    weak: ["disposizioni comuni", "gemeinsame bestimmungen", "dispositions communes"],
  },
  {
    type: "policy",
    strong: [
      "polizza assicurativa",
      "versicherungspolice",
      "police d assurance",
      "numero di polizza",
      "policennummer",
      "numero de police",
    ],
    weak: ["contraente", "versicherungsnehmer", "preneur d assurance"],
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

export function normalizeKnowledgeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyInsuranceDocument(text: string): DocumentClassification {
  const normalized = normalizeKnowledgeText(text.slice(0, 30000));
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
  if (!winner) {
    return { type: "unknown", confidence: 0, evidence: [] };
  }

  // Conditions describe possible product rules, never the customer's purchase.
  const conditions = ranked.find(
    (candidate) =>
      candidate.type === "general_conditions" ||
      candidate.type === "supplementary_conditions"
  );
  const selected = conditions && conditions.score >= 4 ? conditions : winner;

  return {
    type: selected.type,
    confidence: Math.min(99, 58 + selected.score * 7),
    evidence: selected.evidence.slice(0, 6),
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
