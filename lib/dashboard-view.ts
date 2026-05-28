import "server-only";

import type {
  DashboardAlert,
  DashboardHealthScore,
  DashboardIntelligence,
  DashboardPortfolioKpis,
} from "@/lib/dashboard-intelligence";
import { getPolicyTypeLabel } from "@/lib/policy-types";
import type { PortfolioProgression } from "@/lib/portfolio-progression";
import type { DashboardStats } from "@/lib/dashboard";
import type { TypedPolicyType, UserDocument, UserPolicy } from "@/lib/types";

export type DashboardPortfolioStatus =
  | "stable"
  | "watch"
  | "high_risk"
  | "unbalanced"
  | "incomplete";

export type DashboardHeroSnapshot = {
  greeting: string;
  headline: string;
  reason: string;
  todayLine: string | null;
  primaryCta: {
    label: string;
    href: string;
  };
};

export type DashboardHealthPresentation = {
  status: DashboardPortfolioStatus;
  statusLabel: string;
  summary: string;
};

export type DashboardSignal = {
  id: string;
  title: string;
  insight: string;
  href: string;
  severity: DashboardAlert["severity"];
};

export type DashboardAllocationSegment = {
  id: string;
  label: string;
  sharePercent: number;
  policyCount: number;
  hasPremiumData: boolean;
};

export type DashboardNextAction = {
  label: string;
  description: string;
  href: string;
};

const STATUS_LABELS: Record<DashboardPortfolioStatus, string> = {
  stable: "Stabile",
  watch: "Da monitorare",
  high_risk: "Attenzione",
  unbalanced: "Sbilanciato",
  incomplete: "Da completare",
};

function isSameCalendarDay(iso: string, reference = new Date()) {
  const date = new Date(iso);
  return (
    Number.isFinite(date.getTime()) &&
    date.toDateString() === reference.toDateString()
  );
}

function getPolicyMonthlyPremiumForAllocation(policy: UserPolicy): number | null {
  if (
    policy.premiumAmount !== null &&
    Number.isFinite(policy.premiumAmount) &&
    policy.premiumAmount > 0
  ) {
    const frequency = policy.premiumFrequency;
    switch (frequency) {
      case "quarterly":
        return policy.premiumAmount / 3;
      case "semiannual":
        return policy.premiumAmount / 6;
      case "annual":
        return policy.premiumAmount / 12;
      default:
        return policy.premiumAmount;
    }
  }

  const summary = policy.details.premium_summary;
  const summaryMonthly =
    summary?.final_monthly ?? summary?.total_monthly ?? null;

  if (
    summaryMonthly !== null &&
    Number.isFinite(summaryMonthly) &&
    summaryMonthly > 0
  ) {
    return summaryMonthly;
  }

  return null;
}

export function getDashboardPortfolioStatus(
  healthScore: DashboardHealthScore,
  kpis: DashboardPortfolioKpis,
  policies: UserPolicy[]
): DashboardHealthPresentation {
  const confirmed = policies.filter((policy) => !policy.requiresReview);

  if (policies.length === 0) {
    return {
      status: "incomplete",
      statusLabel: STATUS_LABELS.incomplete,
      summary: "Carica e conferma almeno una polizza per attivare il punteggio.",
    };
  }

  const typeCounts = new Map<TypedPolicyType, number>();
  for (const policy of confirmed) {
    typeCounts.set(policy.policyType, (typeCounts.get(policy.policyType) ?? 0) + 1);
  }

  const dominantShare =
    confirmed.length > 0
      ? Math.max(...[...typeCounts.values()]) / confirmed.length
      : 0;
  const hasDuplicateTypes = [...typeCounts.values()].some((count) => count > 1);
  const score = healthScore.score ?? 0;

  if (
    hasDuplicateTypes ||
    (confirmed.length >= 2 && dominantShare >= 0.7)
  ) {
    return {
      status: "unbalanced",
      statusLabel: STATUS_LABELS.unbalanced,
      summary: "Concentrazione o sovrapposizioni tra categorie: verifica le coperture.",
    };
  }

  if (
    kpis.failedDocuments > 0 ||
    score < 50 ||
    kpis.policiesRequiringReview > kpis.confirmedPolicies
  ) {
    return {
      status: "high_risk",
      statusLabel: STATUS_LABELS.high_risk,
      summary: "Ci sono criticità che richiedono un intervento prima di affidarsi allo score.",
    };
  }

  if (
    score < 75 ||
    kpis.policiesRequiringReview > 0 ||
    kpis.unassignedCoverageCount > 0 ||
    kpis.uploadedDocumentsAwaitingAnalysis > 0
  ) {
    return {
      status: "watch",
      statusLabel: STATUS_LABELS.watch,
      summary: "Il portafoglio è avviato ma servono ancora conferme o dati mancanti.",
    };
  }

  return {
    status: "stable",
    statusLabel: STATUS_LABELS.stable,
    summary: "Dati verificati e nessuna criticità prioritaria sul portafoglio attuale.",
  };
}

export function buildDashboardHeroSnapshot(input: {
  profileName: string;
  healthPresentation: DashboardHealthPresentation;
  kpis: DashboardPortfolioKpis;
  documents: UserDocument[];
  progression: PortfolioProgression;
  nextAction: DashboardNextAction;
}): DashboardHeroSnapshot {
  const { profileName, healthPresentation, kpis, documents, progression, nextAction } =
    input;

  const uploadedToday = documents.filter((doc) =>
    isSameCalendarDay(doc.createdAt)
  ).length;
  const analyzedToday = documents.filter(
    (doc) => doc.status === "analyzed" && isSameCalendarDay(doc.updatedAt)
  ).length;
  const processingNow = kpis.processingDocuments;

  const todayParts: string[] = [];
  if (uploadedToday > 0) {
    todayParts.push(
      `${uploadedToday} PDF caricato${uploadedToday === 1 ? "" : "i"} oggi`
    );
  }
  if (analyzedToday > 0) {
    todayParts.push(
      `${analyzedToday} analisi completata${analyzedToday === 1 ? "" : "e"} oggi`
    );
  }
  if (processingNow > 0) {
    todayParts.push(
      `${processingNow} analisi in corso`
    );
  }
  if (kpis.policiesRequiringReview > 0) {
    todayParts.push(
      `${kpis.policiesRequiringReview} bozza${kpis.policiesRequiringReview === 1 ? "" : "e"} da confermare`
    );
  }

  const todayLine =
    todayParts.length > 0 ? todayParts.slice(0, 2).join(" · ") : null;

  let headline = "Il tuo portafoglio è sotto controllo.";
  if (kpis.totalPolicies === 0) {
    headline = "Inizia con il primo documento assicurativo.";
  } else if (healthPresentation.status === "high_risk") {
    headline = "Serve un passo in più per mettere in sicurezza i dati.";
  } else if (healthPresentation.status === "unbalanced") {
    headline = "Rivedi concentrazione e sovrapposizioni tra polizze.";
  } else if (healthPresentation.status === "watch") {
    headline = "Stai costruendo il portafoglio: mancano ancora conferme.";
  } else if (progression.maturity === "empty" || progression.maturity === "starting") {
    headline = progression.headline;
  }

  return {
    greeting: `Ciao ${profileName}`,
    headline,
    reason: healthPresentation.summary,
    todayLine,
    primaryCta: {
      label: nextAction.label,
      href: nextAction.href,
    },
  };
}

export function buildDashboardTopSignals(
  alerts: DashboardAlert[],
  maxItems = 3
): DashboardSignal[] {
  return alerts.slice(0, maxItems).map((alert) => ({
    id: alert.id,
    title: alert.title,
    insight: alert.explanation.split(".")[0] ?? alert.explanation,
    href: alert.ctaHref,
    severity: alert.severity,
  }));
}

export function buildDashboardAllocationSegments(
  policies: UserPolicy[]
): DashboardAllocationSegment[] {
  const confirmed = policies.filter((policy) => !policy.requiresReview);

  if (confirmed.length === 0) {
    return [];
  }

  const buckets = new Map<
    TypedPolicyType,
    { policyCount: number; monthlyPremium: number }
  >();

  for (const policy of confirmed) {
    const current = buckets.get(policy.policyType) ?? {
      policyCount: 0,
      monthlyPremium: 0,
    };
    const premium = getPolicyMonthlyPremiumForAllocation(policy);
    buckets.set(policy.policyType, {
      policyCount: current.policyCount + 1,
      monthlyPremium: current.monthlyPremium + (premium ?? 0),
    });
  }

  const premiumTotal = [...buckets.values()].reduce(
    (sum, bucket) => sum + bucket.monthlyPremium,
    0
  );
  const usePremium = premiumTotal > 0;

  const totalWeight = usePremium
    ? premiumTotal
    : confirmed.length;

  return [...buckets.entries()]
    .map(([type, bucket]) => {
      const weight = usePremium ? bucket.monthlyPremium : bucket.policyCount;
      return {
        id: type,
        label: getPolicyTypeLabel(type),
        sharePercent:
          totalWeight > 0 ? Math.round((weight / totalWeight) * 100) : 0,
        policyCount: bucket.policyCount,
        hasPremiumData: usePremium && bucket.monthlyPremium > 0,
      };
    })
    .sort((left, right) => right.sharePercent - left.sharePercent);
}

export function resolveDashboardNextAction(input: {
  progression: PortfolioProgression;
  policies: UserPolicy[];
  documentStats: DashboardStats;
  recentDocuments: UserDocument[];
}): DashboardNextAction {
  const { progression, policies, documentStats, recentDocuments } = input;
  const pendingReview = policies.filter((policy) => policy.requiresReview);

  if (progression.nextStep?.ctaHref) {
    return {
      label: progression.nextStep.label,
      description: progression.nextStep.description,
      href: progression.nextStep.ctaHref,
    };
  }

  if (pendingReview.length > 0) {
    return {
      label: "Conferma la bozza AI",
      description: `${pendingReview.length} polizza${pendingReview.length === 1 ? "" : "e"} in attesa di revisione.`,
      href: `/policies/${pendingReview[0].id}/edit`,
    };
  }

  if (documentStats.totalDocuments === 0) {
    return {
      label: "Carica la prima polizza",
      description: "Un PDF svizzero basta per avviare l'estrazione strutturata.",
      href: "/documents",
    };
  }

  const awaitingAnalysis = recentDocuments.find((doc) => doc.status === "uploaded");
  if (awaitingAnalysis) {
    return {
      label: "Analizza il PDF in coda",
      description: "Il documento è pronto per l'estrazione AI.",
      href: `/documents/${awaitingAnalysis.id}`,
    };
  }

  if (policies.length === 0) {
    return {
      label: "Crea la prima scheda polizza",
      description: "Collega un documento analizzato o inserisci i dati manualmente.",
      href: "/policies/new",
    };
  }

  return {
    label: "Apri il portafoglio polizze",
    description: "Consulta schede, coperture e alert sulle polizze confermate.",
    href: "/policies",
  };
}

export function buildDashboardViewModel(input: {
  profileName: string;
  intelligence: DashboardIntelligence;
  policies: UserPolicy[];
  documents: UserDocument[];
  documentStats: DashboardStats;
  progression: PortfolioProgression;
}) {
  const { intelligence, policies, documents, progression } = input;
  const { healthScore, kpis, alerts } = intelligence;

  const healthPresentation = getDashboardPortfolioStatus(
    healthScore,
    kpis,
    policies
  );
  const nextAction = resolveDashboardNextAction({
    progression,
    policies,
    documentStats: input.documentStats,
    recentDocuments: documents,
  });
  const hero = buildDashboardHeroSnapshot({
    profileName: input.profileName,
    healthPresentation,
    kpis,
    documents,
    progression,
    nextAction,
  });
  const signals = buildDashboardTopSignals(alerts);
  const allocation = buildDashboardAllocationSegments(policies);

  return {
    hero,
    healthScore,
    healthPresentation,
    signals,
    allocation,
    nextAction,
    intelligence,
    kpis,
    alerts,
  };
}
