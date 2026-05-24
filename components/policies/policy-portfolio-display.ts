import {
  getPolicyCoverages,
  getPolicyInsuredPeople,
  getPolicyReviewStatusBadge,
  getPolicyTypeLabel,
} from "@/lib/policy-types";
import type { PolicyPremiumFrequency, TypedPolicyType, UserPolicy } from "@/lib/types";
import { formatCHF } from "@/lib/utils";

export type PolicyPortfolioStatusFilter =
  | "all"
  | "review"
  | "active"
  | "expiring"
  | "ai_draft"
  | "manual";

export type PolicyPortfolioCategoryFilter = "all" | TypedPolicyType;

const premiumFrequencyLabels: Record<PolicyPremiumFrequency, string> = {
  monthly: "mensile",
  quarterly: "trimestrale",
  semiannual: "semestrale",
  annual: "annuale",
};

export function getPolicyAnnualPremium(policy: UserPolicy): number | null {
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

export function getPolicyPremiumLabel(policy: UserPolicy): string {
  if (policy.premiumAmount !== null && Number.isFinite(policy.premiumAmount)) {
    return `${formatCHF(policy.premiumAmount)} / ${premiumFrequencyLabels[policy.premiumFrequency]}`;
  }

  const annual = getPolicyAnnualPremium(policy);
  if (annual !== null) {
    return `${formatCHF(annual)} / anno`;
  }

  return "Non disponibile";
}

export function getPolicyInsuredCount(policy: UserPolicy): number {
  return getPolicyInsuredPeople(policy.details).length;
}

export function getPolicyCoverageCount(policy: UserPolicy): number {
  return getPolicyCoverages(policy.details).length;
}

export function getDaysUntilRenewal(
  renewalDate: string | null,
  now = new Date()
): number | null {
  if (!renewalDate) {
    return null;
  }

  const renewal = new Date(`${renewalDate}T12:00:00`);
  if (!Number.isFinite(renewal.getTime())) {
    return null;
  }

  const today = new Date(now);
  today.setHours(12, 0, 0, 0);

  return Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isPolicyExpiringSoon(policy: UserPolicy, withinDays = 30): boolean {
  if (policy.requiresReview) {
    return false;
  }

  const days = getDaysUntilRenewal(policy.renewalDate);
  return days !== null && days >= 0 && days <= withinDays;
}

export function getPolicyDisplayStatus(policy: UserPolicy) {
  if (policy.requiresReview) {
    return { label: "Da rivedere", variant: "attention" as const };
  }

  if (isPolicyExpiringSoon(policy)) {
    return { label: "In scadenza", variant: "expiring" as const };
  }

  return getPolicyReviewStatusBadge(policy);
}

export function getPolicySearchHaystack(policy: UserPolicy): string {
  const typeLabel = getPolicyTypeLabel(policy.policyType, policy.policyCategoryLabel);

  return [
    policy.provider,
    policy.policyNumber,
    typeLabel,
    policy.policyCategoryLabel,
    policy.document?.fileName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function matchesPolicyFilters(
  policy: UserPolicy,
  query: string,
  category: PolicyPortfolioCategoryFilter,
  status: PolicyPortfolioStatusFilter
): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery && !getPolicySearchHaystack(policy).includes(normalizedQuery)) {
    return false;
  }

  if (category !== "all" && policy.policyType !== category) {
    return false;
  }

  switch (status) {
    case "review":
      return policy.requiresReview;
    case "active":
      return !policy.requiresReview && policy.status === "active" && !isPolicyExpiringSoon(policy);
    case "expiring":
      return isPolicyExpiringSoon(policy);
    case "ai_draft":
      return policy.source === "ai_draft";
    case "manual":
      return policy.source === "manual";
    default:
      return true;
  }
}

export function formatRenewalRelative(days: number | null): string | null {
  if (days === null) {
    return null;
  }

  if (days < 0) {
    return `Scaduta da ${Math.abs(days)} giorni`;
  }

  if (days === 0) {
    return "Scade oggi";
  }

  if (days === 1) {
    return "Tra 1 giorno";
  }

  return `Tra ${days} giorni`;
}
