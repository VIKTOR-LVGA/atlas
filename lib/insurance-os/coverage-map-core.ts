/**
 * Pure coverage-map builder — safe for unit tests (no server-only).
 */
import { createHash } from "crypto";
import { COVERAGE_MAP_CATEGORIES } from "@/lib/insurance-os/coverage-categories";
import type {
  CoverageMapCategoryView,
  CoverageMapFact,
  CoverageMapResult,
} from "@/lib/insurance-os/coverage-map-types";
import type { CoverageMapStatus } from "@/lib/insurance-os/shared-types";
import type { VerificationStatus } from "@/lib/insurance-os/verification";
import { verificationFromProvenance } from "@/lib/insurance-os/verification";
import type { PolicyCoverage, UserPolicy } from "@/lib/types";

function hashPortfolio(policies: UserPolicy[], coverages: PolicyCoverage[]) {
  const payload = [
    ...policies.map((p) => `${p.id}:${p.updatedAt}:${p.policyType}`),
    ...coverages.map((c) => `${c.id}:${c.coverageStatus}:${c.confidence}`),
  ].join("|");
  return createHash("sha256").update(payload).digest("hex").slice(0, 24);
}

function toFact(c: PolicyCoverage, verificationOverride?: VerificationStatus): CoverageMapFact {
  const verification =
    verificationOverride ??
    verificationFromProvenance(c.provenance, c.coverageStatus);
  return {
    id: c.id,
    label: c.originalLabel,
    status: c.coverageStatus,
    limit: c.coverageLimit,
    deductible: c.deductible,
    verificationStatus: verification,
    sourceDocumentId: c.sourceDocumentId,
    sourcePage: c.sourcePage,
    evidence: c.evidence,
    policyId: c.policyId,
  };
}

function resolveStatus(input: {
  policies: UserPolicy[];
  coverages: PolicyCoverage[];
}): CoverageMapStatus {
  if (input.policies.length === 0) return "no_policy_found";

  const included = input.coverages.filter((c) => c.coverageStatus === "included");
  const unknown = input.coverages.filter(
    (c) =>
      c.coverageStatus === "unknown" ||
      c.provenance === "unknown" ||
      (c.confidence != null && c.confidence < 50)
  );

  if (included.length === 0 && input.coverages.length === 0) {
    return "partially_known";
  }
  if (unknown.length > 0) return "needs_verification";
  if (included.length > 0) return "covered";
  return "partially_known";
}

export function buildCoverageMap(input: {
  policies: UserPolicy[];
  coverages: PolicyCoverage[];
}): CoverageMapResult {
  const categories: CoverageMapCategoryView[] = COVERAGE_MAP_CATEGORIES.map((def) => {
    const policies = input.policies.filter(
      (p) =>
        def.policyTypes.includes(p.policyType) ||
        (def.id === "other" &&
          !COVERAGE_MAP_CATEGORIES.some(
            (other) =>
              other.id !== "other" && other.policyTypes.includes(p.policyType)
          ))
    );
    const policyIds = new Set(policies.map((p) => p.id));
    const coverages = input.coverages.filter(
      (c) =>
        policyIds.has(c.policyId) ||
        def.insuranceCategories.includes(c.insuranceCategory)
    );

    const status = resolveStatus({ policies, coverages });
    const facts = coverages.map((c) => toFact(c));
    const included = facts.filter((f) => f.status === "included" || f.status === "conditional");
    const exclusions = facts.filter((f) => f.status === "excluded");
    const needsVerification = facts.filter(
      (f) =>
        f.verificationStatus === "needs_verification" ||
        f.verificationStatus === "missing"
    );

    return {
      id: def.id,
      label: def.label,
      description: def.description,
      status,
      policies: policies.map((p) => ({
        id: p.id,
        provider: p.provider,
        policyType: p.policyType,
        policyNumber: p.policyNumber,
        premiumAmount: p.premiumAmount,
        deductible: p.deductible,
      })),
      coverages: included,
      exclusions,
      needsVerification,
      explanation:
        status === "no_policy_found"
          ? "ATLAS non trova una polizza caricata che confermi questa copertura. Non significa automaticamente che sei scoperto."
          : status === "covered"
            ? "Dai documenti caricati risultano coperture in quest’area."
            : status === "needs_verification"
              ? "Ci sono elementi da verificare nelle condizioni."
              : "Abbiamo trovato indicazioni parziali.",
    };
  });

  return {
    categories,
    summary: {
      coveredCount: categories.filter((c) => c.status === "covered").length,
      needsVerificationCount: categories.filter((c) => c.status === "needs_verification")
        .length,
      noPolicyCount: categories.filter((c) => c.status === "no_policy_found").length,
      activePolicies: input.policies.length,
    },
    sourceHash: hashPortfolio(input.policies, input.coverages),
  };
}
