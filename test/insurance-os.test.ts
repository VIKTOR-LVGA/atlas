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
