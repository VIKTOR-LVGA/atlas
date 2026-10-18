/**
 * Unit tests for Insurance Operating System pure cores (no server-only).
 */
import assert from "node:assert/strict";
import { createHash } from "crypto";
import { buildCoverageMap } from "../lib/insurance-os/coverage-map-core";
import {
  buildAttentionCandidates,
  detectPossibleOverlaps,
} from "../lib/insurance-os/action-center-core";
import { verificationFromProvenance, softCoveragePhrase } from "../lib/insurance-os/verification";
import { MIN_BENCHMARK_COHORT_SIZE } from "../lib/insurance-os/flags";
import type { PolicyCoverage, UserPolicy } from "../lib/types";
import { sumPortfolioPremiums } from "../lib/premium-totals";
import { getUpcomingDeadlines } from "../lib/policy-schedule";

function policy(partial: Partial<UserPolicy> & { id: string }): UserPolicy {
  return {
    id: partial.id,
    userId: "u1",
    documentId: partial.documentId ?? "d1",
    document: null,
    familyMemberId: null,
    propertyId: null,
    vehicleId: null,
    provider: partial.provider ?? "Zurich",
    policyType: partial.policyType ?? "household",
    policyCategoryLabel: partial.policyCategoryLabel ?? null,
    policyNumber: partial.policyNumber ?? "P-1",
    premiumAmount: partial.premiumAmount ?? 870,
    premiumFrequency: partial.premiumFrequency ?? "annual",
    deductible: partial.deductible ?? 500,
    startDate: partial.startDate ?? "2025-01-01",
    endDate: partial.endDate ?? "2026-01-01",
    renewalDate: partial.renewalDate ?? "2026-01-01",
    currency: "CHF",
    coverageAmount: null,
    details: partial.details ?? {},
    notes: null,
    extractionConfidence: 80,
    extractionNotes: null,
    source: partial.source ?? "ai_draft",
    requiresReview: partial.requiresReview ?? false,
    status: "active",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };
}

function coverage(
  partial: Partial<PolicyCoverage> & { id: string; policyId: string }
): PolicyCoverage {
  return {
    id: partial.id,
    policyId: partial.policyId,
    canonicalType: partial.canonicalType ?? "household_contents",
    originalLabel: partial.originalLabel ?? "Mobilia",
    insuranceCategory: partial.insuranceCategory ?? "household",
    coverageStatus: partial.coverageStatus ?? "included",
    coverageLimit: partial.coverageLimit ?? 100000,
    limitUnit: null,
    currency: "CHF",
    deductible: partial.deductible ?? 500,
    deductibleUnit: null,
    reimbursementPercent: null,
    waitingPeriodDays: null,
    territorialScope: "CH",
    description: null,
    source: "extracted",
    provenance: partial.provenance ?? "explicit",
    confidence: partial.confidence ?? 90,
    sourceDocumentId: partial.sourceDocumentId ?? "d1",
    sourcePage: partial.sourcePage ?? 3,
    evidence: partial.evidence ?? "clausola mobilia",
    familyMemberId: null,
    propertyId: null,
    vehicleId: null,
    effectiveFrom: null,
    effectiveUntil: null,
    terms: {},
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };
}

function premiumDiffKey(policyId: string, prev: number, next: number) {
  return createHash("sha256")
    .update(`premium:${policyId}:d1→d2:${prev}:${next}`)
    .digest("hex")
    .slice(0, 32);
}

function main() {
  assert.equal(verificationFromProvenance("explicit", "included"), "confirmed");
  assert.equal(verificationFromProvenance("derived", "included"), "inferred");
  assert.equal(verificationFromProvenance("unknown", "unknown"), "needs_verification");
  assert.ok(softCoveragePhrase("confirmed").includes("documenti"));

  const policies = [
    policy({ id: "p1", policyType: "household", premiumAmount: 870 }),
    policy({ id: "p2", policyType: "car", provider: "AXA", premiumAmount: 1200 }),
  ];
  const coverages = [
    coverage({ id: "c1", policyId: "p1", provenance: "explicit" }),
    coverage({
      id: "c2",
      policyId: "p2",
      canonicalType: "motor_liability",
      insuranceCategory: "vehicle",
      originalLabel: "RC Auto",
      provenance: "unknown",
      coverageStatus: "unknown",
      confidence: 40,
    }),
  ];

  const map = buildCoverageMap({ policies, coverages });
  assert.equal(map.categories.find((c) => c.id === "household")?.status, "covered");
  assert.equal(map.categories.find((c) => c.id === "travel")?.status, "no_policy_found");
  assert.ok(
    map.categories.find((c) => c.id === "travel")?.explanation.includes("non trova")
  );

  const conditionalMap = buildCoverageMap({
    policies: [policy({ id: "conditional", policyType: "travel" })],
    coverages: [
      coverage({
        id: "conditional-coverage",
        policyId: "conditional",
        insuranceCategory: "travel",
        coverageStatus: "conditional",
      }),
    ],
  });
  const travel = conditionalMap.categories.find((c) => c.id === "travel");
  assert.equal(travel?.coverages.length, 0);
  assert.equal(travel?.conditional.length, 1);
  assert.equal(travel?.status, "partially_known");

  const inferredMap = buildCoverageMap({
    policies: [policy({ id: "inferred", policyType: "household" })],
    coverages: [
      coverage({
        id: "inferred-coverage",
        policyId: "inferred",
        provenance: "derived",
      }),
    ],
  });
  assert.equal(
    inferredMap.categories.find((c) => c.id === "household")?.status,
    "partially_known",
    "derived coverage must not be presented as document-confirmed"
  );

  const uncertainIncludedMap = buildCoverageMap({
    policies: [policy({ id: "uncertain", policyType: "household" })],
    coverages: [
      coverage({
        id: "uncertain-coverage",
        policyId: "uncertain",
        provenance: "unknown",
        coverageStatus: "included",
      }),
    ],
  });
  const uncertainHousehold = uncertainIncludedMap.categories.find(
    (c) => c.id === "household"
  );
  assert.equal(uncertainHousehold?.coverages.length, 0);
  assert.equal(uncertainHousehold?.needsVerification.length, 1);

  const familyPremium = sumPortfolioPremiums([
    policy({
      id: "family-health",
      policyType: "health",
      premiumAmount: 940,
      premiumFrequency: "monthly",
      details: {
        premium_summary: { total_monthly: 940, total_annual: 11_280 },
        insured_people: [
          { name: "Adulto", premium_amount: 620 },
          { name: "Bambino", premium_amount: 320 },
        ],
      },
    }),
  ]);
  assert.equal(familyPremium.annual, 11_280, "family premium must be counted once");

  const deadlines = getUpcomingDeadlines(
    [
      policy({
        id: "cancel",
        endDate: "2027-12-31",
        renewalDate: "2027-12-31",
        details: { cancellation_deadline: "2027-09-30" },
      }),
    ],
    new Date("2027-01-01T12:00:00Z")
  );
  assert.equal(deadlines[0]?.kind, "cancellation");
  assert.equal(deadlines[1]?.kind, "renewal");

  const futureDeadline = getUpcomingDeadlines(
    [
      policy({
        id: "past-cancellation",
        renewalDate: "2027-12-31",
        details: { cancellation_deadline: "2026-09-30" },
      }),
    ],
    new Date("2027-01-01T12:00:00Z")
  );
  assert.equal(futureDeadline[0]?.kind, "renewal", "past dates must not hide future ones");

  const overlaps = detectPossibleOverlaps([
    policy({ id: "a", policyType: "travel", provider: "A" }),
    policy({ id: "b", policyType: "travel", provider: "B" }),
  ]);
  assert.equal(overlaps.length, 1);
  assert.ok(overlaps[0].description.toLowerCase().includes("da verificare"));
  assert.ok(!overlaps[0].description.toLowerCase().includes("inutilmente"));

  const attention = buildAttentionCandidates({
    policies: [policy({ id: "p1", premiumAmount: null, documentId: null })],
    documents: [],
  });
  const keys = attention.map((a) => a.sourceKey);
  assert.equal(new Set(keys).size, keys.length);

  // Idempotent diff key stability
  assert.equal(premiumDiffKey("p1", 870, 995), premiumDiffKey("p1", 870, 995));

  assert.ok(MIN_BENCHMARK_COHORT_SIZE >= 30);

  console.log("insurance-os unit tests: PASS");
}

main();
