import {
  getExtractionConfidenceLabel,
  getExtractionConfidenceTier,
} from "@/lib/policy-extraction-reveal";
import {
  getPolicyCoverages,
  getPolicyInsuredPeople,
} from "@/lib/policy-types";
import type { UserDocument, UserPolicy } from "@/lib/types";

export type DocumentWorkflowStage =
  | "uploaded"
  | "processing"
  | "analyzed"
  | "draft_created"
  | "review_required"
  | "confirmed"
  | "failed";

export type DocumentFilterId =
  | "all"
  | "analyzed"
  | "needs_review"
  | "unanalyzed"
  | "error"
  | "confirmed";

export type DocumentNextActionKind =
  | "analyze"
  | "retry"
  | "review_draft"
  | "open_policy"
  | "verify_data"
  | "open_detail"
  | "wait";

export type DocumentNextAction = {
  kind: DocumentNextActionKind;
  label: string;
  description: string;
  href?: string;
  priority: "primary" | "secondary" | "muted";
};

export type DocumentIntelligenceIndicator = {
  id: string;
  label: string;
  tone: "success" | "warning" | "neutral" | "danger";
};

export type DocumentIntelligenceSummaryItem = {
  id: string;
  label: string;
  value: string;
};

export type DocumentIntelligenceView = {
  document: UserDocument;
  linkedPolicy: UserPolicy | null;
  workflowStage: DocumentWorkflowStage;
  filterIds: DocumentFilterId[];
  nextAction: DocumentNextAction;
  indicators: DocumentIntelligenceIndicator[];
  summaryItems: DocumentIntelligenceSummaryItem[];
  insuredCount: number;
  coverageCount: number;
};

export const documentWorkflowSteps: Array<{
  stage: DocumentWorkflowStage;
  label: string;
}> = [
  { stage: "uploaded", label: "Caricato" },
  { stage: "analyzed", label: "Analizzato" },
  { stage: "draft_created", label: "Bozza AI" },
  { stage: "review_required", label: "Revisione" },
  { stage: "confirmed", label: "Confermato" },
];

export const documentFilterOptions: Array<{
  id: DocumentFilterId;
  label: string;
}> = [
  { id: "all", label: "Tutti" },
  { id: "analyzed", label: "Analizzati" },
  { id: "needs_review", label: "Da revisionare" },
  { id: "unanalyzed", label: "Non analizzati" },
  { id: "error", label: "Errore" },
  { id: "confirmed", label: "Confermati" },
];

export function getPoliciesByDocumentId(
  policies: UserPolicy[]
): Map<string, UserPolicy> {
  const map = new Map<string, UserPolicy>();

  for (const policy of policies) {
    if (policy.documentId && !map.has(policy.documentId)) {
      map.set(policy.documentId, policy);
    }
  }

  return map;
}

export function getDocumentWorkflowStage(
  document: UserDocument,
  policy: UserPolicy | null
): DocumentWorkflowStage {
  if (document.status === "failed") {
    return "failed";
  }
  if (document.status === "uploaded") {
    return "uploaded";
  }
  if (document.status === "processing") {
    return "processing";
  }
  if (document.status === "analyzed") {
    if (!policy) {
      return "analyzed";
    }
    if (policy.requiresReview) {
      return "review_required";
    }
    if (policy.source === "ai_draft" && !policy.details.reviewed_at) {
      return "draft_created";
    }
    return "confirmed";
  }

  return "uploaded";
}

function getWorkflowStepIndex(stage: DocumentWorkflowStage): number {
  switch (stage) {
    case "uploaded":
    case "processing":
    case "failed":
      return 0;
    case "analyzed":
      return 1;
    case "draft_created":
      return 2;
    case "review_required":
      return 3;
    case "confirmed":
      return 4;
    default:
      return 0;
  }
}

export function getDocumentWorkflowProgress(stage: DocumentWorkflowStage): number {
  if (stage === "failed") {
    return 0;
  }
  if (stage === "processing") {
    return 0.35;
  }

  const index = getWorkflowStepIndex(stage);
  return Math.min(1, (index + 1) / documentWorkflowSteps.length);
}

export function getDocumentFilterIds(
  document: UserDocument,
  policy: UserPolicy | null
): DocumentFilterId[] {
  const ids: DocumentFilterId[] = ["all"];

  if (document.status === "failed") {
    ids.push("error");
  }

  if (document.status === "uploaded" || document.status === "processing") {
    ids.push("unanalyzed");
  }

  if (document.status === "analyzed") {
    ids.push("analyzed");
  }

  if (policy?.requiresReview) {
    ids.push("needs_review");
  }

  if (
    document.status === "analyzed" &&
    policy &&
    !policy.requiresReview &&
    (policy.source !== "ai_draft" || Boolean(policy.details.reviewed_at))
  ) {
    ids.push("confirmed");
  }

  return ids;
}

export function documentMatchesFilter(
  view: DocumentIntelligenceView,
  filterId: DocumentFilterId
): boolean {
  if (filterId === "all") {
    return true;
  }

  return view.filterIds.includes(filterId);
}

function countPolicyEntities(policy: UserPolicy | null) {
  if (!policy) {
    return { insuredCount: 0, coverageCount: 0 };
  }

  const insured = getPolicyInsuredPeople(policy.details);
  const coverages = getPolicyCoverages(policy.details);

  return {
    insuredCount: insured.length,
    coverageCount: coverages.length,
  };
}

export function buildDocumentNextAction(
  document: UserDocument,
  policy: UserPolicy | null
): DocumentNextAction {
  const documentHref = `/documents/${document.id}`;

  if (document.status === "failed") {
    return {
      kind: "retry",
      label: "Riprova analisi",
      description: "L'estrazione non è riuscita. Verifica il PDF e riprova.",
      href: documentHref,
      priority: "primary",
    };
  }

  if (document.status === "processing") {
    return {
      kind: "wait",
      label: "Analisi in corso",
      description: "Atlas sta elaborando il documento.",
      priority: "muted",
    };
  }

  if (document.status === "uploaded") {
    return {
      kind: "analyze",
      label: "Analizza documento",
      description: "Avvia l'estrazione AI per creare una bozza polizza.",
      href: documentHref,
      priority: "primary",
    };
  }

  if (policy?.requiresReview) {
    return {
      kind: "review_draft",
      label: "Rivedi bozza AI",
      description: "Conferma premio, persone e coperture estratte.",
      href: `/policies/${policy.id}`,
      priority: "primary",
    };
  }

  if (policy) {
    const uncertain =
      policy.extractionConfidence !== null && policy.extractionConfidence < 75;

    if (uncertain) {
      return {
        kind: "verify_data",
        label: "Verifica dati mancanti",
        description: "Alcuni campi richiedono revisione manuale.",
        href: `/policies/${policy.id}`,
        priority: "primary",
      };
    }

    return {
      kind: "open_policy",
      label: "Apri polizza",
      description: "Visualizza la scheda strutturata collegata a questo PDF.",
      href: `/policies/${policy.id}`,
      priority: "primary",
    };
  }

  if (document.status === "analyzed") {
    return {
      kind: "open_detail",
      label: "Apri dettaglio",
      description: "Analisi completata. Apri il documento per i dettagli.",
      href: documentHref,
      priority: "secondary",
    };
  }

  return {
    kind: "open_detail",
    label: "Apri dettaglio",
    description: "Visualizza informazioni e azioni del documento.",
    href: documentHref,
    priority: "secondary",
  };
}

function buildDocumentIndicators(
  document: UserDocument,
  policy: UserPolicy | null,
  counts: { insuredCount: number; coverageCount: number }
): DocumentIntelligenceIndicator[] {
  const indicators: DocumentIntelligenceIndicator[] = [];

  indicators.push({
    id: "upload",
    label: "PDF caricato",
    tone: "neutral",
  });

  if (document.status === "processing") {
    indicators.push({
      id: "processing",
      label: "Analisi in corso",
      tone: "warning",
    });
  }

  if (document.status === "analyzed") {
    indicators.push({
      id: "analyzed",
      label: "Analisi completata",
      tone: "success",
    });
  }

  if (document.status === "failed") {
    indicators.push({
      id: "failed",
      label: "Estrazione fallita",
      tone: "danger",
    });
  }

  if (policy) {
    indicators.push({
      id: "policy",
      label: policy.source === "ai_draft" ? "Bozza AI creata" : "Polizza collegata",
      tone: "success",
    });
  }

  if (policy?.requiresReview) {
    indicators.push({
      id: "review",
      label: "Revisione richiesta",
      tone: "warning",
    });
  }

  if (policy && !policy.requiresReview && policy.details.reviewed_at) {
    indicators.push({
      id: "confirmed",
      label: "Confermato",
      tone: "success",
    });
  }

  if (counts.insuredCount > 0) {
    indicators.push({
      id: "people",
      label:
        counts.insuredCount === 1
          ? "1 persona assicurata"
          : `${counts.insuredCount} persone assicurate`,
      tone: "neutral",
    });
  }

  if (counts.coverageCount > 0) {
    indicators.push({
      id: "coverages",
      label:
        counts.coverageCount === 1
          ? "1 copertura"
          : `${counts.coverageCount} coperture`,
      tone: "neutral",
    });
  }

  if (
    policy &&
    policy.extractionConfidence !== null &&
    policy.extractionConfidence !== undefined
  ) {
    const tier = getExtractionConfidenceTier(policy.extractionConfidence);
    indicators.push({
      id: "confidence",
      label: getExtractionConfidenceLabel(tier),
      tone:
        tier === "high" ? "success" : tier === "medium" ? "warning" : "neutral",
    });
  }

  return indicators;
}

function buildDocumentSummaryItems(
  document: UserDocument,
  policy: UserPolicy | null,
  counts: { insuredCount: number; coverageCount: number }
): DocumentIntelligenceSummaryItem[] {
  const items: DocumentIntelligenceSummaryItem[] = [];

  if (policy?.provider?.trim()) {
    items.push({
      id: "provider",
      label: "Compagnia",
      value: policy.provider.trim(),
    });
  }

  if (counts.insuredCount > 0) {
    items.push({
      id: "people",
      label: "Persone",
      value: String(counts.insuredCount),
    });
  }

  if (counts.coverageCount > 0) {
    items.push({
      id: "coverages",
      label: "Coperture",
      value: String(counts.coverageCount),
    });
  }

  if (
    policy &&
    policy.extractionConfidence !== null &&
    policy.extractionConfidence !== undefined
  ) {
    const tier = getExtractionConfidenceTier(policy.extractionConfidence);
    items.push({
      id: "quality",
      label: "Affidabilità",
      value: `${getExtractionConfidenceLabel(tier)} · ${Math.round(policy.extractionConfidence)}%`,
    });
  }

  if (policy) {
    items.push({
      id: "policy",
      label: "Polizza collegata",
      value: policy.policyNumber?.trim() || policy.provider?.trim() || "Scheda attiva",
    });
  }

  if (policy?.requiresReview) {
    items.push({
      id: "review",
      label: "Revisione",
      value: "Richiesta",
    });
  }

  if (document.status === "uploaded") {
    items.push({
      id: "pending",
      label: "Stato",
      value: "In attesa analisi",
    });
  }

  if (document.status === "processing") {
    items.push({
      id: "pending",
      label: "Stato",
      value: "Analisi in corso",
    });
  }

  if (document.status === "failed") {
    items.push({
      id: "error",
      label: "Stato",
      value: "Analisi fallita",
    });
  }

  return items;
}

export function buildDocumentIntelligence(
  document: UserDocument,
  linkedPolicy: UserPolicy | null
): DocumentIntelligenceView {
  const counts = countPolicyEntities(linkedPolicy);
  const workflowStage = getDocumentWorkflowStage(document, linkedPolicy);

  return {
    document,
    linkedPolicy,
    workflowStage,
    filterIds: getDocumentFilterIds(document, linkedPolicy),
    nextAction: buildDocumentNextAction(document, linkedPolicy),
    indicators: buildDocumentIndicators(document, linkedPolicy, counts),
    summaryItems: buildDocumentSummaryItems(document, linkedPolicy, counts),
    insuredCount: counts.insuredCount,
    coverageCount: counts.coverageCount,
  };
}

export function buildDocumentsIntelligence(
  documents: UserDocument[],
  policies: UserPolicy[]
): DocumentIntelligenceView[] {
  const policyByDocument = getPoliciesByDocumentId(policies);

  return documents.map((document) =>
    buildDocumentIntelligence(document, policyByDocument.get(document.id) ?? null)
  );
}

export function countDocumentsByFilter(
  views: DocumentIntelligenceView[]
): Record<DocumentFilterId, number> {
  const counts: Record<DocumentFilterId, number> = {
    all: views.length,
    analyzed: 0,
    needs_review: 0,
    unanalyzed: 0,
    error: 0,
    confirmed: 0,
  };

  for (const view of views) {
    for (const filterId of view.filterIds) {
      if (filterId !== "all") {
        counts[filterId] += 1;
      }
    }
  }

  return counts;
}

export function getWorkflowStageLabel(stage: DocumentWorkflowStage): string {
  switch (stage) {
    case "uploaded":
      return "Caricato";
    case "processing":
      return "In analisi";
    case "analyzed":
      return "Analizzato";
    case "draft_created":
      return "Bozza AI creata";
    case "review_required":
      return "Revisione richiesta";
    case "confirmed":
      return "Confermato";
    case "failed":
      return "Analisi fallita";
    default:
      return "Non disponibile";
  }
}
