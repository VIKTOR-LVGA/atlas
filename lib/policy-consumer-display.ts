import type { UserPolicy } from "@/lib/types";

export function getPolicyProductName(policy: UserPolicy): string | null {
  const primary = policy.details.products?.[0]?.name?.trim();
  if (primary) {
    return primary;
  }

  const complementary = policy.details.complementary_products?.[0]?.name?.trim();
  return complementary || null;
}

export function getPolicyStatusLabel(policy: UserPolicy) {
  if (policy.requiresReview) {
    return "Da completare";
  }

  const status = policy.status.trim().toLowerCase();
  if (status === "expired" || status === "cancelled") {
    return "Non attiva";
  }

  return "Attiva";
}
