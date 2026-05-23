/** Shared premium helpers (no imports from grouping to avoid cycles). */

export function getCoverageNetPremium(coverage: {
  premium_final?: number | null;
  premium_amount?: number | null;
}) {
  return coverage.premium_final ?? coverage.premium_amount ?? null;
}
