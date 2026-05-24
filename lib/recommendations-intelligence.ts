import "server-only";

import { cache } from "react";
import {
  buildDashboardAlerts,
  computeDashboardHealthScore,
  computeDashboardIntelligence,
  type DashboardAlert,
  type DashboardAlertSeverity,
  type DashboardPortfolioKpis,
  type DashboardWorkflowStep,
} from "@/lib/dashboard-intelligence";
import {
  getPolicyTypeLabel,
  typedPolicyTypes,
} from "@/lib/policy-types";
import { getCurrentUserDocuments } from "@/lib/documents";
import { getCurrentUserPolicies } from "@/lib/policies";
import type { UserDocument, UserPolicy } from "@/lib/types";

export type RecommendationPriority = "high" | "medium" | "low";

export type RecommendationCategory =
  | "review"
  | "completeness"
  | "documents"
  | "extraction"
  | "coverage"
  | "portfolio"
  | "renewal";

export type AtlasRecommendation = {
  id: string;
  title: string;
  explanation: string;
  priority: RecommendationPriority;
  category: RecommendationCategory;
  categoryLabel: string;
  policyId?: string;
  documentId?: string;
  affectedLabel?: string;
  ctaLabel: string;
  ctaHref: string;
};

export type RecommendationGroup = {
  category: RecommendationCategory;
  label: string;
  items: AtlasRecommendation[];
};

export type RecommendationsExecutiveOverview = {
  totalRecommendations: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
  pendingReviewCount: number;
  confirmedPoliciesPercent: number | null;
  portfolioReadinessPercent: number | null;
  intelligenceCompletionPercent: number | null;
  criticalItemsCount: number;
};

export type RecommendationsIntelligence = {
  executive: RecommendationsExecutiveOverview;
  recommendations: AtlasRecommendation[];
  groups: RecommendationGroup[];
  priorityActions: AtlasRecommendation[];
  upcomingRenewals: AtlasRecommendation[];
  workflowSteps: DashboardWorkflowStep[];
  hasPortfolio: boolean;
  hasActionableRecommendations: boolean;
  readinessLabel: string;
};

const categoryLabels: Record<RecommendationCategory, string> = {
  review: "Revisione e conferma",
  completeness: "Completezza dati",
  documents: "Documenti e archivio",
  extraction: "Qualità estrazione",
  coverage: "Coperture e persone",
  portfolio: "Portafoglio",
  renewal: "Rinnovi e scadenze",
};

const categoryOrder: RecommendationCategory[] = [
  "review",
  "renewal",
  "extraction",
  "coverage",
  "completeness",
  "documents",
  "portfolio",
];

const priorityOrder: Record<RecommendationPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function severityToPriority(
  severity: DashboardAlertSeverity
): RecommendationPriority {
  return severity;
}

function inferCategory(alert: DashboardAlert): RecommendationCategory {
  const id = alert.id;

  if (id.startsWith("review-")) {
    return "review";
  }
  if (id.startsWith("renewal-")) {
    return "renewal";
  }
  if (id.startsWith("premium-") || id.startsWith("deductible-")) {
    return "completeness";
  }
  if (id.startsWith("confidence-")) {
    return "extraction";
  }
  if (
    id.startsWith("document-") ||
    id.startsWith("orphan-") ||
    id.startsWith("failed-doc-")
  ) {
    return "documents";
  }
  if (id.startsWith("unassigned-")) {
    return "coverage";
  }
  if (id.startsWith("duplicate-")) {
    return "portfolio";
  }

  return "portfolio";
}

function alertToRecommendation(
  alert: DashboardAlert,
  policies: UserPolicy[]
): AtlasRecommendation {
  const category = inferCategory(alert);
  const policy = alert.policyId
    ? policies.find((item) => item.id === alert.policyId)
    : undefined;

  return {
    id: alert.id,
    title: alert.title,
    explanation: alert.explanation,
    priority: severityToPriority(alert.severity),
    category,
    categoryLabel: categoryLabels[category],
    policyId: alert.policyId,
    documentId: alert.documentId,
    affectedLabel: policy
      ? policy.provider || getPolicyTypeLabel(policy.policyType)
      : undefined,
    ctaLabel: alert.ctaLabel,
    ctaHref: alert.ctaHref,
  };
}

function buildRenewalRecommendations(policies: UserPolicy[]): AtlasRecommendation[] {
  const now = new Date();
  const items: AtlasRecommendation[] = [];

  for (const policy of policies.filter((item) => !item.requiresReview)) {
    if (!policy.renewalDate) {
      continue;
    }

    const renewal = new Date(`${policy.renewalDate}T12:00:00`);
    if (!Number.isFinite(renewal.getTime())) {
      continue;
    }

    const daysUntil = Math.ceil(
      (renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil > 60 || daysUntil < 0) {
      continue;
    }

    const label = policy.provider || getPolicyTypeLabel(policy.policyType);
    const priority: RecommendationPriority =
      daysUntil <= 30 ? "high" : "medium";

    items.push({
      id: `renewal-soon-${policy.id}`,
      title:
        daysUntil <= 0
          ? "Rinnovo scaduto o imminente"
          : "Rinnovo in avvicinamento",
      explanation: `${label}: scadenza tra ${daysUntil === 0 ? "oggi" : `${daysUntil} giorni`}. Verifica premio e coperture prima del rinnovo.`,
      priority,
      category: "renewal",
      categoryLabel: categoryLabels.renewal,
      policyId: policy.id,
      affectedLabel: label,
      ctaLabel: "Apri polizza",
      ctaHref: `/policies/${policy.id}`,
    });
  }

  return items;
}

function buildPortfolioRecommendations(
  policies: UserPolicy[],
  documents: UserDocument[],
  kpis: DashboardPortfolioKpis
): AtlasRecommendation[] {
  const items: AtlasRecommendation[] = [];
  const confirmed = policies.filter((policy) => !policy.requiresReview);

  if (policies.length === 0) {
    items.push({
      id: "onboard-empty",
      title: "Avvia il portafoglio",
      explanation:
        "Carica un PDF assicurativo e lascia che Atlas estragga la prima polizza strutturata.",
      priority: "high",
      category: "portfolio",
      categoryLabel: categoryLabels.portfolio,
      ctaLabel: "Carica PDF",
      ctaHref: "/documents",
    });
    return items;
  }

  if (policies.length > 0 && confirmed.length === 0) {
    items.push({
      id: "confirm-portfolio",
      title: "Conferma le bozze AI",
      explanation: `${kpis.policiesRequiringReview} polizza${kpis.policiesRequiringReview === 1 ? "" : "e"} in attesa di revisione. Le raccomandazioni avanzate si attivano dopo la conferma.`,
      priority: "high",
      category: "review",
      categoryLabel: categoryLabels.review,
      ctaLabel: "Vai alle polizze",
      ctaHref: "/policies",
    });
  }

  if (documents.length === 0 && policies.length > 0) {
    items.push({
      id: "no-documents",
      title: "Archivio documenti vuoto",
      explanation:
        "Collega i PDF originali alle polizze per tracciare origine e revisioni.",
      priority: "medium",
      category: "documents",
      categoryLabel: categoryLabels.documents,
      ctaLabel: "Carica documenti",
      ctaHref: "/documents",
    });
  }

  if (kpis.uploadedDocumentsAwaitingAnalysis > 0) {
    items.push({
      id: "docs-awaiting-analysis",
      title: "PDF in attesa di analisi",
      explanation: `${kpis.uploadedDocumentsAwaitingAnalysis} documento${kpis.uploadedDocumentsAwaitingAnalysis === 1 ? "" : "i"} caricato${kpis.uploadedDocumentsAwaitingAnalysis === 1 ? "" : "i"} ma non ancora analizzati.`,
      priority: "high",
      category: "documents",
      categoryLabel: categoryLabels.documents,
      ctaLabel: "Apri documenti",
      ctaHref: "/documents",
    });
  }

  if (confirmed.length >= 2) {
    const confirmedTypes = new Set(confirmed.map((policy) => policy.policyType));
    const missingTypes = typedPolicyTypes.filter((type) => !confirmedTypes.has(type));

    if (missingTypes.length > 0 && missingTypes.length < typedPolicyTypes.length) {
      const sample = missingTypes
        .slice(0, 3)
        .map((type) => getPolicyTypeLabel(type))
        .join(", ");

      items.push({
        id: "missing-categories",
        title: "Categorie assicurative non presenti",
        explanation: `Tra le polizze confermate non risultano: ${sample}. Verifica se mancano nel portafoglio reale.`,
        priority: "low",
        category: "portfolio",
        categoryLabel: categoryLabels.portfolio,
        ctaLabel: "Vedi portafoglio",
        ctaHref: "/policies",
      });
    }
  }

  if (
    policies.length >= 2 &&
    kpis.insuredPeopleCount === 0 &&
    kpis.coverageCount === 0
  ) {
    items.push({
      id: "incomplete-extraction",
      title: "Estrazione incompleta",
      explanation:
        "Le polizze non contengono ancora persone o coperture strutturate: rivedi le bozze o ricarica i PDF.",
      priority: "medium",
      category: "extraction",
      categoryLabel: categoryLabels.extraction,
      ctaLabel: "Apri analisi",
      ctaHref: "/analysis",
    });
  }

  return items;
}

function dedupeRecommendations(
  items: AtlasRecommendation[]
): AtlasRecommendation[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

function sortRecommendations(
  items: AtlasRecommendation[]
): AtlasRecommendation[] {
  return [...items].sort((left, right) => {
    const priorityDiff =
      priorityOrder[left.priority] - priorityOrder[right.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    return left.title.localeCompare(right.title, "it");
  });
}

function groupRecommendations(
  items: AtlasRecommendation[]
): RecommendationGroup[] {
  const byCategory = new Map<RecommendationCategory, AtlasRecommendation[]>();

  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  return categoryOrder
    .filter((category) => (byCategory.get(category)?.length ?? 0) > 0)
    .map((category) => ({
      category,
      label: categoryLabels[category],
      items: sortRecommendations(byCategory.get(category) ?? []),
    }));
}

function buildExecutiveOverview(
  recommendations: AtlasRecommendation[],
  kpis: DashboardPortfolioKpis,
  policies: UserPolicy[],
  healthScoreAvailable: number | null
): RecommendationsExecutiveOverview {
  const highPriorityCount = recommendations.filter(
    (item) => item.priority === "high"
  ).length;
  const mediumPriorityCount = recommendations.filter(
    (item) => item.priority === "medium"
  ).length;
  const lowPriorityCount = recommendations.filter(
    (item) => item.priority === "low"
  ).length;

  const confirmedPoliciesPercent =
    policies.length > 0
      ? Math.round((kpis.confirmedPolicies / policies.length) * 100)
      : null;

  const intelligenceCompletionPercent =
    policies.length > 0
      ? Math.round((kpis.confirmedPolicies / policies.length) * 100)
      : null;

  return {
    totalRecommendations: recommendations.length,
    highPriorityCount,
    mediumPriorityCount,
    lowPriorityCount,
    pendingReviewCount: kpis.policiesRequiringReview,
    confirmedPoliciesPercent,
    portfolioReadinessPercent: healthScoreAvailable,
    intelligenceCompletionPercent,
    criticalItemsCount: highPriorityCount,
  };
}

export function computeRecommendationsIntelligence(
  policies: UserPolicy[],
  documents: UserDocument[]
): RecommendationsIntelligence {
  const dashboard = computeDashboardIntelligence(policies, documents);
  const healthScore = computeDashboardHealthScore(policies, documents);

  const fromAlerts = buildDashboardAlerts(policies, documents).map((alert) =>
    alertToRecommendation(alert, policies)
  );
  const fromRenewals = buildRenewalRecommendations(policies);
  const fromPortfolio = buildPortfolioRecommendations(
    policies,
    documents,
    dashboard.kpis
  );

  const recommendations = sortRecommendations(
    dedupeRecommendations([...fromAlerts, ...fromRenewals, ...fromPortfolio])
  );

  const groups = groupRecommendations(recommendations);
  const priorityActions = recommendations
    .filter((item) => item.priority === "high")
    .slice(0, 6);
  const upcomingRenewals = recommendations
    .filter((item) => item.category === "renewal")
    .slice(0, 5);

  const executive = buildExecutiveOverview(
    recommendations,
    dashboard.kpis,
    policies,
    healthScore.available ? healthScore.score : null
  );

  let readinessLabel = "In preparazione";
  if (policies.length === 0) {
    readinessLabel = "Servono più dati";
  } else if (executive.criticalItemsCount > 0) {
    readinessLabel = "Azioni urgenti";
  } else if (dashboard.kpis.confirmedPolicies === policies.length) {
    readinessLabel = "Portafoglio allineato";
  } else {
    readinessLabel = "Da completare";
  }

  return {
    executive,
    recommendations,
    groups,
    priorityActions,
    upcomingRenewals,
    workflowSteps: dashboard.workflowSteps,
    hasPortfolio: policies.length > 0,
    hasActionableRecommendations: recommendations.length > 0,
    readinessLabel,
  };
}

export const getRecommendationsIntelligence = cache(async () => {
  const [policies, documents] = await Promise.all([
    getCurrentUserPolicies(),
    getCurrentUserDocuments(),
  ]);

  return computeRecommendationsIntelligence(policies, documents);
});
