import "server-only";

import {
  getCanonicalCoverageDefinition,
  normalizeCoverageLabel,
} from "@/lib/insurance-knowledge";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  PolicyCoverageDetail,
  TypedPolicyType,
  UserPolicy,
} from "@/lib/types";

export class PolicyCoverageManagementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolicyCoverageManagementError";
  }
}

const policyCategoryFallback: Record<TypedPolicyType, string> = {
  health: "health_supplementary",
  liability: "private_liability",
  household: "household",
  car: "vehicle",
  legal: "legal_protection",
  travel: "travel",
  life: "life",
  pension: "pension",
  building: "building",
  pet: "pet",
  other: "other",
};

function extractedCoverageLines(policy: UserPolicy) {
  const direct = policy.details.coverages ?? [];
  const nested = (policy.details.insured_people ?? []).flatMap((person, personIndex) =>
    (person.coverages ?? []).map((coverage) => ({
      ...coverage,
      insured_person_name: coverage.insured_person_name ?? person.name,
      insured_number: coverage.insured_number ?? person.insured_number,
      person_index: coverage.person_index ?? personIndex,
    }))
  );
  const seen = new Set<string>();

  return [...direct, ...nested].filter((coverage) => {
    const key = [
      coverage.stable_key,
      coverage.original_label ?? coverage.name,
      coverage.insured_number,
      coverage.person_index,
      coverage.source_page,
      coverage.source_order,
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toCoverageRow(
  coverage: PolicyCoverageDetail,
  policy: UserPolicy,
  userId: string,
  documentId: string
) {
  const originalLabel = (coverage.original_label ?? coverage.name).trim();
  const normalized = normalizeCoverageLabel(originalLabel);
  const requestedCanonical = coverage.canonical_type?.trim();
  const knownRequested = requestedCanonical
    ? getCanonicalCoverageDefinition(requestedCanonical)
    : undefined;
  const canonicalType = knownRequested?.canonicalType ?? normalized.canonicalType ?? "other_coverage";
  const category =
    knownRequested?.category ??
    normalized.category ??
    policyCategoryFallback[policy.policyType];

  return {
    user_id: userId,
    policy_id: policy.id,
    canonical_type: canonicalType,
    original_label: originalLabel,
    insurance_category: category,
    coverage_status: coverage.coverage_status ?? "unknown",
    coverage_limit: coverage.coverage_amount ?? null,
    limit_unit: coverage.limit_unit ?? null,
    currency: coverage.currency ?? policy.currency ?? null,
    deductible: coverage.deductible ?? coverage.franchise ?? null,
    deductible_unit: coverage.deductible_unit ?? null,
    reimbursement_percent: coverage.reimbursement_percent ?? null,
    waiting_period_days:
      coverage.waiting_period_days === null || coverage.waiting_period_days === undefined
        ? null
        : Math.round(coverage.waiting_period_days),
    territorial_scope: coverage.territorial_scope ?? coverage.applies_to ?? null,
    description: coverage.notes ?? null,
    source: "extracted",
    provenance: coverage.provenance ?? "unknown",
    confidence: coverage.confidence ?? null,
    source_document_id: documentId,
    source_page:
      coverage.source_page === null || coverage.source_page === undefined
        ? null
        : Math.round(coverage.source_page),
    evidence: coverage.evidence ?? null,
    family_member_id: policy.familyMemberId,
    property_id: policy.propertyId,
    vehicle_id: policy.vehicleId,
    effective_from: policy.startDate,
    effective_until: policy.endDate,
    terms: {
      ...coverage.terms,
      insured_person_name: coverage.insured_person_name ?? null,
      insured_number: coverage.insured_number ?? null,
      category_label: coverage.category_label ?? null,
      ownership_confidence: coverage.ownership_confidence ?? null,
    },
  };
}

export async function syncExtractedPolicyCoverages(
  policy: UserPolicy,
  documentId: string
) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || policy.userId !== user.id) {
    throw new PolicyCoverageManagementError("Coperture non aggiornabili.");
  }

  const { error: deleteError } = await supabase
    .from("policy_coverages")
    .delete()
    .eq("user_id", user.id)
    .eq("policy_id", policy.id)
    .eq("source", "extracted")
    .eq("source_document_id", documentId);

  if (deleteError) {
    throw new PolicyCoverageManagementError("Coperture estratte non sincronizzate.");
  }

  const rows = extractedCoverageLines(policy).map((coverage) =>
    toCoverageRow(coverage, policy, user.id, documentId)
  );

  if (!rows.length) return [];

  const { data, error } = await supabase
    .from("policy_coverages")
    .insert(rows)
    .select("id");

  if (error) {
    throw new PolicyCoverageManagementError("Coperture estratte non salvate.");
  }

  return data ?? [];
}
