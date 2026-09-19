import type { PolicyPremiumFrequency, UserPolicy } from "@/lib/types";

export const premiumFrequencyLabels: Record<PolicyPremiumFrequency, string> = {
  monthly: "mese",
  quarterly: "trimestre",
  semiannual: "semestre",
  annual: "anno",
};

export const premiumFrequencyLongLabels: Record<PolicyPremiumFrequency, string> = {
  monthly: "Mensile",
  quarterly: "Trimestrale",
  semiannual: "Semestrale",
  annual: "Annuale",
};

export function toAnnualPremium(
  amount: number,
  frequency: PolicyPremiumFrequency
) {
  switch (frequency) {
    case "quarterly":
      return amount * 4;
    case "semiannual":
      return amount * 2;
    case "annual":
      return amount;
    default:
      return amount * 12;
  }
}

export function toMonthlyPremium(
  amount: number,
  frequency: PolicyPremiumFrequency
) {
  return toAnnualPremium(amount, frequency) / 12;
}

export function getPolicyAnnualPremium(policy: UserPolicy): number | null {
  if (
    policy.premiumAmount !== null &&
    Number.isFinite(policy.premiumAmount) &&
    policy.premiumAmount > 0
  ) {
    return toAnnualPremium(policy.premiumAmount, policy.premiumFrequency);
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

export function sumPortfolioPremiums(policies: UserPolicy[]) {
  const countable = policies.filter((policy) => !policy.requiresReview);
  const annualValues = countable
    .map((policy) => getPolicyAnnualPremium(policy))
    .filter((value): value is number => value !== null);

  if (annualValues.length === 0) {
    return { annual: null as number | null, monthly: null as number | null };
  }

  const annual = annualValues.reduce((sum, value) => sum + value, 0);

  return { annual, monthly: annual / 12 };
}
