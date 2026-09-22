/**
 * Opportunities Intelligence Engine — foundation.
 * No fake savings. Benchmark activation requires privacy-safe cohorts.
 */

export const BENCHMARK_MINIMUM_COHORT_SIZE = 20;
/** Documented as product default — must be legal-reviewed before production analytics. */
export const BENCHMARK_COHORT_SIZE_NOTE =
  "Minimum cohort size (k>=20) is a product default pending legal/compliance calibration.";

export const opportunityIntelligenceKinds = [
  "missing_data",
  "expiration",
  "document_followup",
  "broker_review",
  "coverage_gap",
  "coverage_overlap",
  "savings_potential",
  "lower_cost_same_coverage",
  "better_coverage_same_budget",
  "better_coverage_small_increase",
  "deductible_optimization",
  "payment_frequency_optimization",
  "renewal_opportunity",
] as const;

export type OpportunityIntelligenceKind =
  (typeof opportunityIntelligenceKinds)[number];

export type OpportunityMaturityLevel = 0 | 1 | 2 | 3 | 4;

export const opportunityMaturityLabels: Record<OpportunityMaturityLevel, string> = {
  0: "Confronto non disponibile",
  1: "Promemoria account/documento",
  2: "Benchmark preliminare interno",
  3: "Benchmark ad alta confidenza",
  4: "Preventivo verificato (broker/compagnia)",
};

export type ComparisonOutcome =
  | "lower_cost_same_coverage"
  | "same_cost_better_coverage"
  | "lower_cost_reduced_coverage"
  | "higher_cost_better_coverage"
  | "incomparable";

export type SimilarityBand = "low" | "medium" | "high";

export type OpportunityEvidence = {
  maturity: OpportunityMaturityLevel;
  kind: OpportunityIntelligenceKind;
  sampleSize: number | null;
  similarityBand: SimilarityBand | null;
  coverageComparable: boolean | null;
  dataComplete: boolean;
  freshnessDate: string | null;
  comparisonBasis: string | null;
  estimatedImpactRangeChf: { min: number; max: number } | null;
  isRealQuote: boolean;
};

export type PolicyComparisonSignature = {
  category: string;
  insurer: string | null;
  coverageSignature: string[];
  deductibleSignature: string[];
  paymentFrequency: string | null;
  regionHint: string | null;
  vehicleAgeBand: string | null;
  catalogValueBand: string | null;
};

export type BenchmarkCohortDescriptor = {
  category: string;
  region: string | null;
  profileDimensions: string[];
  coverageSignature: string[];
  sampleSize: number;
  periodStart: string | null;
  periodEnd: string | null;
  calculatedAt: string;
  sourceQuality: "internal_aggregate" | "broker_quote" | "insufficient";
};

export type BenchmarkMetricSet = {
  medianPremium: number | null;
  p25Premium: number | null;
  p75Premium: number | null;
  sampleSize: number;
  coverageEquivalenceCount: number | null;
};

/** Guard: never surface CHF savings without evidence. */
export function canShowSavingsEstimate(evidence: OpportunityEvidence): boolean {
  if (evidence.isRealQuote) return true;
  if (evidence.maturity < 2) return false;
  if (evidence.sampleSize === null || evidence.sampleSize < BENCHMARK_MINIMUM_COHORT_SIZE) {
    return false;
  }
  if (evidence.coverageComparable !== true) return false;
  if (evidence.similarityBand === "low" || evidence.similarityBand === null) {
    return false;
  }
  if (!evidence.dataComplete) return false;
  return evidence.estimatedImpactRangeChf !== null;
}

export function similarityBandFromScore(score: number): SimilarityBand {
  if (score >= 0.75) return "high";
  if (score >= 0.45) return "medium";
  return "low";
}

/**
 * Transparent weighted similarity (0–1). Not a black box — weights are explicit.
 */
export function scoreProfileSimilarity(parts: {
  vehicle: number;
  location: number;
  ageRiskBand: number;
  coverage: number;
  deductible: number;
  usage: number;
}): { score: number; band: SimilarityBand } {
  const score =
    parts.vehicle * 0.22 +
    parts.location * 0.12 +
    parts.ageRiskBand * 0.14 +
    parts.coverage * 0.28 +
    parts.deductible * 0.14 +
    parts.usage * 0.1;
  const clamped = Math.max(0, Math.min(1, score));
  return { score: clamped, band: similarityBandFromScore(clamped) };
}

export function buildCoverageSignature(
  canonicalTypes: Array<string | null | undefined>
): string[] {
  return [
    ...new Set(
      canonicalTypes
        .map((value) => value?.trim().toLowerCase())
        .filter((value): value is string => Boolean(value))
    ),
  ].sort();
}

export function percentileSorted(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return sorted[index] ?? null;
}

export function buildBenchmarkMetrics(premiums: number[]): BenchmarkMetricSet {
  const clean = premiums.filter((value) => Number.isFinite(value) && value >= 0);
  return {
    medianPremium: percentileSorted(clean, 50),
    p25Premium: percentileSorted(clean, 25),
    p75Premium: percentileSorted(clean, 75),
    sampleSize: clean.length,
    coverageEquivalenceCount: null,
  };
}
