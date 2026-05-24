import "server-only";

import { cache } from "react";
import {
  buildDashboardAlerts,
  computeDashboardHealthScore,
  computeDashboardIntelligence,
  type DashboardWorkflowStep,
} from "@/lib/dashboard-intelligence";
import {
  getPolicyCoverages,
  getPolicyExtractionMetadata,
  getPolicyInsuredPeople,
  getPolicyTypeLabel,
  typedPolicyTypes,
} from "@/lib/policy-types";
import { getCurrentUserDocuments } from "@/lib/documents";
import { getCurrentUserPolicies } from "@/lib/policies";
import type { TypedPolicyType, UserDocument, UserPolicy } from "@/lib/types";
import type { DashboardHealthScore, DashboardPortfolioKpis } from "@/lib/dashboard-intelligence";

export type AnalysisInsightSeverity = "low" | "medium" | "high" | "info";

export type AnalysisInsight = {
  id: string;
  title: string;
  explanation: string;
  severity: AnalysisInsightSeverity;
  ctaLabel?: string;
  ctaHref?: string;
};

export type AnalysisDistributionSegment = {
  id: string;
  label: string;
  value: number;
  tone: "blue" | "green" | "yellow" | "purple" | "red" | "indigo" | "neutral";
};

export type AnalysisCompleteness = {
  withPremium: number;
  withRenewal: number;
  withDeductible: number;
  withLinkedDocument: number;
  confirmedTotal: number;
};

export type AnalysisRenewalItem = {
  policyId: string;
  label: string;
  renewalDate: string;
  daysUntil: number;
};

export type AnalysisExecutiveOverview = {
  healthScore: DashboardHealthScore;
  policiesAnalyzed: number;
  policiesConfirmed: number;
  analysisCompletionPercent: number | null;
  reviewPending: number;
  averageConfidence: number | null;
  documentProcessingPercent: number | null;
  unresolvedWarnings: number;
  linkedDocumentPercent: number | null;
  annualPremiumTotal: number | null;
};

export type AnalysisIntelligence = {
  executive: AnalysisExecutiveOverview;
  kpis: DashboardPortfolioKpis;
  workflowSteps: DashboardWorkflowStep[];
  documentPipeline: AnalysisDistributionSegment[];
  policiesByCategory: AnalysisDistributionSegment[];
  reviewStatus: AnalysisDistributionSegment[];
  confidenceBuckets: AnalysisDistributionSegment[];
  completeness: AnalysisCompleteness;
  premiumByCategory: AnalysisDistributionSegment[];
  renewalTimeline: AnalysisRenewalItem[];
  familyOverview: {
    insuredPeople: number;
    coverages: number;
    unassignedCoverages: number;
  };
  insights: AnalysisInsight[];
  hasPortfolio: boolean;
  hasConfirmedPortfolio: boolean;
};

function getPolicyAnnualPremium(policy: UserPolicy): number | null {
  if (
    policy.premiumAmount !== null &&
    Number.isFinite(policy.premiumAmount) &&
    policy.premiumAmount > 0
  ) {
    switch (policy.premiumFrequency) {
      case "quarterly":
        return policy.premiumAmount * 4;
      case "semiannual":
        return policy.premiumAmount * 2;
      case "annual":
        return policy.premiumAmount;
      default:
        return policy.premiumAmount * 12;
    }
  }

  const summary = policy.details.premium_summary;
  const annual =
    summary?.total_annual ??
    (summary?.final_monthly ? summary.final_monthly * 12 : null) ??
    (summary?.total_monthly ? summary.total_monthly * 12 : null);

  if (annual !== null && Number.isFinite(annual) && annual > 0) {
    return annual;
  }

  return null;
}

const categoryTones: Record<TypedPolicyType, AnalysisDistributionSegment["tone"]> = {
  health: "green",
  car: "blue",
  household: "yellow",
  liability: "purple",
  legal: "indigo",
  other: "neutral",
};

function countExtractionWarnings(policies: UserPolicy[]): number {
  return policies.reduce((total, policy) => {
    const warnings = getPolicyExtractionMetadata(policy.details).warnings ?? [];
    return total + warnings.length;
  }, 0);
}

function policyHasDeductible(policy: UserPolicy): boolean {
  if (policy.deductible !== null) {
    return true;
  }

  const details = policy.details;
  return (
    details.deductible != null ||
    details.franchise != null ||
    getPolicyCoverages(details).some(
      (coverage) => coverage.deductible != null || coverage.franchise != null
    )
  );
}

function buildDocumentPipeline(documents: UserDocument[]): AnalysisDistributionSegment[] {
  const segments: AnalysisDistributionSegment[] = [
    {
      id: "analyzed",
      label: "Analizzati",
      value: documents.filter((doc) => doc.status === "analyzed").length,
      tone: "green",
    },
    {
      id: "processing",
      label: "In elaborazione",
      value: documents.filter((doc) => doc.status === "processing").length,
      tone: "blue",
    },
    {
      id: "uploaded",
      label: "In attesa",
      value: documents.filter((doc) => doc.status === "uploaded").length,
      tone: "yellow",
    },
    {
      id: "failed",
      label: "Non leggibili",
      value: documents.filter((doc) => doc.status === "failed").length,
      tone: "red",
    },
  ];

  return segments.filter((segment) => segment.value > 0);
}

function buildPoliciesByCategory(policies: UserPolicy[]): AnalysisDistributionSegment[] {
  const counts = new Map<TypedPolicyType, number>();

  for (const policy of policies) {
    counts.set(policy.policyType, (counts.get(policy.policyType) ?? 0) + 1);
  }

  return typedPolicyTypes
    .map((type) => ({
      id: type,
      label: getPolicyTypeLabel(type),
      value: counts.get(type) ?? 0,
      tone: categoryTones[type],
    }))
    .filter((segment) => segment.value > 0);
}

function buildReviewStatus(policies: UserPolicy[]): AnalysisDistributionSegment[] {
  const pending = policies.filter((policy) => policy.requiresReview).length;
  const confirmedAi = policies.filter(
    (policy) => !policy.requiresReview && policy.source === "ai_draft"
  ).length;
  const manual = policies.filter((policy) => policy.source === "manual").length;

  return [
    { id: "confirmed", label: "Confermate", value: confirmedAi, tone: "green" as const },
    { id: "review", label: "Da rivedere", value: pending, tone: "yellow" as const },
    { id: "manual", label: "Manuali", value: manual, tone: "indigo" as const },
  ].filter((segment) => segment.value > 0);
}

function buildConfidenceBuckets(policies: UserPolicy[]): AnalysisDistributionSegment[] {
  const values = policies
    .map((policy) => policy.extractionConfidence)
    .filter((value): value is number => value !== null && Number.isFinite(value));

  if (values.length === 0) {
    return [];
  }

  const low = values.filter((value) => value < 50).length;
  const medium = values.filter((value) => value >= 50 && value < 75).length;
  const high = values.filter((value) => value >= 75).length;

  return [
    { id: "high", label: "75–100%", value: high, tone: "green" as const },
    { id: "medium", label: "50–74%", value: medium, tone: "yellow" as const },
    { id: "low", label: "0–49%", value: low, tone: "red" as const },
  ].filter((segment) => segment.value > 0);
}

function buildPremiumByCategory(policies: UserPolicy[]): AnalysisDistributionSegment[] {
  const totals = new Map<TypedPolicyType, number>();

  for (const policy of policies.filter((item) => !item.requiresReview)) {
    const annual = getPolicyAnnualPremium(policy);
    if (annual === null) {
      continue;
    }
    totals.set(policy.policyType, (totals.get(policy.policyType) ?? 0) + annual);
  }

  return typedPolicyTypes
    .map((type) => ({
      id: `premium-${type}`,
      label: getPolicyTypeLabel(type),
      value: Math.round(totals.get(type) ?? 0),
      tone: categoryTones[type],
    }))
    .filter((segment) => segment.value > 0);
}

function buildRenewalTimeline(policies: UserPolicy[]): AnalysisRenewalItem[] {
  const now = new Date();
  const items: AnalysisRenewalItem[] = [];

  for (const policy of policies) {
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

    items.push({
      policyId: policy.id,
      label: policy.provider || getPolicyTypeLabel(policy.policyType),
      renewalDate: policy.renewalDate,
      daysUntil,
    });
  }

  return items.sort((left, right) => left.daysUntil - right.daysUntil).slice(0, 6);
}

function buildCompleteness(policies: UserPolicy[]): AnalysisCompleteness {
  const confirmed = policies.filter((policy) => !policy.requiresReview);

  return {
    withPremium: confirmed.filter((policy) => getPolicyAnnualPremium(policy) !== null)
      .length,
    withRenewal: confirmed.filter((policy) => policy.renewalDate).length,
    withDeductible: confirmed.filter(policyHasDeductible).length,
    withLinkedDocument: confirmed.filter((policy) => policy.documentId).length,
    confirmedTotal: confirmed.length,
  };
}

const insightSeverityOrder: Record<AnalysisInsightSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
  info: 3,
};

export function buildAnalysisInsights(
  policies: UserPolicy[],
  documents: UserDocument[],
  kpis: DashboardPortfolioKpis
): AnalysisInsight[] {
  const insights: AnalysisInsight[] = [];
  const confirmed = policies.filter((policy) => !policy.requiresReview);
  const confirmedTypes = new Set(confirmed.map((policy) => policy.policyType));

  for (const alert of buildDashboardAlerts(policies, documents)) {
    insights.push({
      id: `alert-${alert.id}`,
      title: alert.title,
      explanation: alert.explanation,
      severity: alert.severity,
      ctaLabel: alert.ctaLabel,
      ctaHref: alert.ctaHref,
    });
  }

  if (policies.length > 0 && confirmed.length === 0) {
    insights.push({
      id: "confirm-portfolio",
      title: "Portafoglio in attesa di conferma",
      explanation:
        "Conferma le bozze AI per sbloccare analisi complete e intelligence sul portafoglio.",
      severity: "high",
      ctaHref: policies.find((policy) => policy.requiresReview)
        ? `/policies/${policies.find((policy) => policy.requiresReview)!.id}/edit`
        : "/policies",
      ctaLabel: "Inizia revisione",
    });
  }

  if (policies.length >= 2 && !confirmedTypes.has("household")) {
    insights.push({
      id: "no-household",
      title: "Nessuna polizza economia domestica",
      explanation:
        "Tra le polizze confermate non risulta una copertura casa: verifica se manca nel portafoglio.",
      severity: "low",
      ctaHref: "/policies",
      ctaLabel: "Vedi portafoglio",
    });
  }

  if (kpis.insuredPeopleCount > 1) {
    insights.push({
      id: "family-portfolio",
      title: "Portafoglio familiare rilevato",
      explanation: `${kpis.insuredPeopleCount} persone assicurate estratte tra le polizze analizzate.`,
      severity: "info",
      ctaHref: "/policies",
      ctaLabel: "Vedi persone",
    });
  }

  const uniqueInsured = new Set<string>();
  for (const policy of policies) {
    for (const person of getPolicyInsuredPeople(policy.details)) {
      const key = person.stable_key ?? person.name ?? person.insured_number;
      if (key) {
        uniqueInsured.add(key);
      }
    }
  }

  if (uniqueInsured.size > 1) {
    insights.push({
      id: "multiple-members",
      title: "Più membri nel portafoglio",
      explanation: `${uniqueInsured.size} profili assicurati distinti rilevati nei documenti.`,
      severity: "info",
    });
  }

  if (
    kpis.analyzedDocuments > 0 &&
    kpis.analyzedDocuments < kpis.totalDocuments
  ) {
    insights.push({
      id: "partial-doc-pipeline",
      title: "Analisi documenti parziale",
      explanation: `${kpis.analyzedDocuments} di ${kpis.totalDocuments} PDF hanno completato l'estrazione.`,
      severity: "medium",
      ctaHref: "/documents",
      ctaLabel: "Vai ai documenti",
    });
  }

  if (kpis.unassignedCoverageCount > 0) {
    insights.push({
      id: "uncertain-coverages",
      title: "Coperture da verificare",
      explanation: `${kpis.unassignedCoverageCount} righe di copertura risultano incerte o non assegnate.`,
      severity: "medium",
      ctaHref: "/policies",
      ctaLabel: "Rivedi coperture",
    });
  }

  const seen = new Set<string>();
  return insights
    .filter((insight) => {
      if (seen.has(insight.id)) {
        return false;
      }
      seen.add(insight.id);
      return true;
    })
    .sort(
      (left, right) =>
        insightSeverityOrder[left.severity] - insightSeverityOrder[right.severity]
    )
    .slice(0, 8);
}

export function computeAnalysisIntelligence(
  policies: UserPolicy[],
  documents: UserDocument[]
): AnalysisIntelligence {
  const dashboard = computeDashboardIntelligence(policies, documents);
  const { kpis } = dashboard;
  const confirmed = policies.filter((policy) => !policy.requiresReview);
  const healthScore = computeDashboardHealthScore(policies, documents);

  const analysisCompletionPercent =
    policies.length > 0
      ? Math.round((confirmed.length / policies.length) * 100)
      : null;

  const documentProcessingPercent =
    documents.length > 0
      ? Math.round((kpis.analyzedDocuments / documents.length) * 100)
      : null;

  const linkedDocumentPercent =
    policies.length > 0
      ? Math.round(
          (policies.filter((policy) => policy.documentId).length / policies.length) *
            100
        )
      : null;

  return {
    executive: {
      healthScore,
      policiesAnalyzed: policies.length,
      policiesConfirmed: confirmed.length,
      analysisCompletionPercent,
      reviewPending: kpis.policiesRequiringReview,
      averageConfidence: kpis.averageExtractionConfidence,
      documentProcessingPercent,
      unresolvedWarnings: countExtractionWarnings(policies),
      linkedDocumentPercent,
      annualPremiumTotal: kpis.totalAnnualPremium,
    },
    kpis,
    workflowSteps: dashboard.workflowSteps,
    documentPipeline: buildDocumentPipeline(documents),
    policiesByCategory: buildPoliciesByCategory(policies),
    reviewStatus: buildReviewStatus(policies),
    confidenceBuckets: buildConfidenceBuckets(policies),
    completeness: buildCompleteness(policies),
    premiumByCategory: buildPremiumByCategory(policies),
    renewalTimeline: buildRenewalTimeline(policies),
    familyOverview: {
      insuredPeople: kpis.insuredPeopleCount,
      coverages: kpis.coverageCount,
      unassignedCoverages: kpis.unassignedCoverageCount,
    },
    insights: buildAnalysisInsights(policies, documents, kpis),
    hasPortfolio: policies.length > 0,
    hasConfirmedPortfolio: confirmed.length > 0,
  };
}

export const getAnalysisIntelligence = cache(async () => {
  const [policies, documents] = await Promise.all([
    getCurrentUserPolicies(),
    getCurrentUserDocuments(),
  ]);

  return computeAnalysisIntelligence(policies, documents);
});
