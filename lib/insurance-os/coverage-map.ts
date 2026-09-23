import "server-only";

export { buildCoverageMap } from "@/lib/insurance-os/coverage-map-core";
import type { CoverageMapResult } from "@/lib/insurance-os/coverage-map-types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { PolicyCoverage } from "@/lib/types";

export type {
  CoverageMapCategoryView,
  CoverageMapFact,
  CoverageMapPolicyRef,
  CoverageMapResult,
} from "@/lib/insurance-os/coverage-map-types";

function mapCoverageRow(row: Record<string, unknown>): PolicyCoverage {
  return {
    id: String(row.id),
    policyId: String(row.policy_id),
    canonicalType: String(row.canonical_type),
    originalLabel: String(row.original_label),
    insuranceCategory: String(row.insurance_category),
    coverageStatus: row.coverage_status as PolicyCoverage["coverageStatus"],
    coverageLimit: row.coverage_limit == null ? null : Number(row.coverage_limit),
    limitUnit: row.limit_unit ? String(row.limit_unit) : null,
    currency: row.currency ? String(row.currency) : null,
    deductible: row.deductible == null ? null : Number(row.deductible),
    deductibleUnit: row.deductible_unit ? String(row.deductible_unit) : null,
    reimbursementPercent:
      row.reimbursement_percent == null ? null : Number(row.reimbursement_percent),
    waitingPeriodDays:
      row.waiting_period_days == null ? null : Number(row.waiting_period_days),
    territorialScope: row.territorial_scope ? String(row.territorial_scope) : null,
    description: row.description ? String(row.description) : null,
    source: row.source as PolicyCoverage["source"],
    provenance: (row.provenance as PolicyCoverage["provenance"]) ?? "unknown",
    confidence: row.confidence == null ? null : Number(row.confidence),
    sourceDocumentId: row.source_document_id ? String(row.source_document_id) : null,
    sourcePage: row.source_page == null ? null : Number(row.source_page),
    evidence: row.evidence ? String(row.evidence) : null,
    familyMemberId: row.family_member_id ? String(row.family_member_id) : null,
    propertyId: row.property_id ? String(row.property_id) : null,
    vehicleId: row.vehicle_id ? String(row.vehicle_id) : null,
    effectiveFrom: row.effective_from ? String(row.effective_from) : null,
    effectiveUntil: row.effective_until ? String(row.effective_until) : null,
    terms: (row.terms as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listCurrentUserPolicyCoverages(): Promise<PolicyCoverage[]> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("policy_coverages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[atlas:coverage-map] list coverages failed", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapCoverageRow(row as Record<string, unknown>));
}

export async function persistCoverageMapSnapshot(map: CoverageMapResult) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("coverage_map_snapshots").upsert(
    {
      user_id: user.id,
      categories: map.categories,
      summary: map.summary,
      source_hash: map.sourceHash,
      computed_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}
