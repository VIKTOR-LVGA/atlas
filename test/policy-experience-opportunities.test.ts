import assert from "node:assert/strict";
import {
  buildCoverageDisplayTree,
  findDuplicateDisplayLabels,
  getCoverageStatusTone,
} from "../lib/policy-experience/coverages";
import { getMotorVehicleDisplay } from "../lib/policy-experience/tabs";
import {
  BENCHMARK_MINIMUM_COHORT_SIZE,
  canShowSavingsEstimate,
  buildBenchmarkMetrics,
  scoreProfileSimilarity,
} from "../lib/opportunities-intelligence/foundation";
import { buildIntelligenceOpportunities } from "../lib/opportunities-intelligence/build";
import type { PolicyCoverageDetail, UserPolicy } from "../lib/types";

const coverages: PolicyCoverageDetail[] = [
  {
    name: "Responsabilità civile",
    canonical_type: "motor_liability",
    coverage_status: "included",
    premium_amount: 500,
  },
  {
    name: "Protezione bonus",
    canonical_type: "bonus_protection",
    coverage_status: "included",
  },
  {
    name: "Casco parziale",
    canonical_type: "partial_casco",
    coverage_status: "included",
  },
  {
    name: "Furto",
    canonical_type: "theft",
    coverage_status: "included",
  },
  {
    name: "Soccorso stradale",
    canonical_type: "roadside_assistance",
    coverage_status: "excluded",
  },
];

const tree = buildCoverageDisplayTree(coverages);
assert.ok(tree.some((g) => g.groupId === "essential"));
assert.ok(tree.some((g) => g.groupId === "casco"));
const rc = tree.flatMap((g) => g.items).find((i) => i.canonicalType === "motor_liability");
assert.ok(rc?.features.some((f) => /bonus/i.test(f)));
assert.equal(getCoverageStatusTone(coverages[4]), "excluded");

const vehicle = getMotorVehicleDisplay({
  vehicle_make: "MERCEDES-BENZ",
  vehicle_model: "C 220d",
  license_plate: "TI 291091",
  plate_number: "TI 291091",
});
assert.equal(vehicle.plate, "TI 291091");
assert.equal(findDuplicateDisplayLabels(["Targa", "Targa", "Premio"]).length, 1);

assert.equal(BENCHMARK_MINIMUM_COHORT_SIZE, 20);
assert.equal(
  canShowSavingsEstimate({
    maturity: 0,
    kind: "savings_potential",
    sampleSize: 5,
    similarityBand: "low",
    coverageComparable: false,
    dataComplete: false,
    freshnessDate: null,
    comparisonBasis: null,
    estimatedImpactRangeChf: { min: 100, max: 200 },
    isRealQuote: false,
  }),
  false,
  "must not show savings without evidence"
);

const metrics = buildBenchmarkMetrics([100, 200, 300, 400]);
assert.equal(metrics.sampleSize, 4);
assert.ok(metrics.medianPremium !== null);

const sim = scoreProfileSimilarity({
  vehicle: 1,
  location: 1,
  ageRiskBand: 1,
  coverage: 1,
  deductible: 1,
  usage: 1,
});
assert.equal(sim.band, "high");

const policy = {
  id: "p1",
  policyType: "car",
  policyCategoryLabel: "Auto",
  provider: "Zurich",
  premiumAmount: 1873,
  premiumFrequency: "annual",
  documentId: "d1",
  requiresReview: false,
  updatedAt: new Date().toISOString(),
  startDate: "2025-01-01",
  endDate: "2031-12-31",
  renewalDate: null,
  details: { coverages },
} as unknown as UserPolicy;

const cards = buildIntelligenceOpportunities({ policies: [policy], documents: [] });
assert.ok(cards.some((c) => c.kind === "coverage_gap"));
assert.ok(cards.some((c) => c.section === "analyzing"));
assert.ok(cards.every((c) => c.evidence.estimatedImpactRangeChf === null));

console.info("PASS policy experience + opportunities intelligence foundation");
