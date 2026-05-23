import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { TypedPolicyType } from "@/lib/types";

export type ExtractionCorrectionType = "coverage_person_assignment";

export type CoveragePersonAssignmentCorrection = {
  correction_type: ExtractionCorrectionType;
  provider: string | null;
  policy_type: TypedPolicyType | null;
  coverage_name: string | null;
  coverage_kind: string | null;
  coverage_stable_key: string;
  previous_assignment: Record<string, unknown> | null;
  corrected_assignment: Record<string, unknown>;
  source_context: Record<string, unknown> | null;
  policy_id: string;
  document_id: string | null;
};

type ExtractionCorrectionRow = {
  id: string;
  user_id: string;
  policy_id: string | null;
  document_id: string | null;
  correction_type: string;
  provider: string | null;
  policy_type: string | null;
  coverage_name: string | null;
  coverage_kind: string | null;
  coverage_stable_key: string | null;
  previous_assignment: Record<string, unknown> | null;
  corrected_assignment: Record<string, unknown>;
  source_context: Record<string, unknown> | null;
  created_at: string;
};

export class ExtractionCorrectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractionCorrectionError";
  }
}

export async function saveExtractionCorrection(
  userId: string,
  input: CoveragePersonAssignmentCorrection
) {
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.from("extraction_corrections").insert({
    user_id: userId,
    policy_id: input.policy_id,
    document_id: input.document_id,
    correction_type: input.correction_type,
    provider: input.provider,
    policy_type: input.policy_type,
    coverage_name: input.coverage_name,
    coverage_kind: input.coverage_kind,
    coverage_stable_key: input.coverage_stable_key,
    previous_assignment: input.previous_assignment,
    corrected_assignment: input.corrected_assignment,
    source_context: input.source_context,
  });

  if (error) {
    throw new ExtractionCorrectionError(
      "Salvataggio correzione non riuscito. Riprova tra poco."
    );
  }
}

/**
 * Loads past corrections for prompt enrichment (patterns only — no PII in OpenAI yet).
 */
export async function getRelevantExtractionCorrections(
  userId: string,
  provider: string | null,
  policyType: TypedPolicyType | null,
  limit = 50
): Promise<ExtractionCorrectionRow[]> {
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("extraction_corrections")
    .select(
      "id, user_id, policy_id, document_id, correction_type, provider, policy_type, coverage_name, coverage_kind, coverage_stable_key, previous_assignment, corrected_assignment, source_context, created_at"
    )
    .eq("user_id", userId)
    .eq("correction_type", "coverage_person_assignment")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (provider?.trim()) {
    query = query.ilike("provider", provider.trim());
  }

  if (policyType) {
    query = query.eq("policy_type", policyType);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data as ExtractionCorrectionRow[];
}

/** Lightweight hook for future prompt tuning — logs aggregate count only. */
export async function reportExtractionCorrectionCount(
  userId: string,
  provider: string | null,
  policyType: TypedPolicyType | null
) {
  const corrections = await getRelevantExtractionCorrections(
    userId,
    provider,
    policyType,
    100
  );

  if (corrections.length === 0) {
    return { count: 0 };
  }

  return {
    count: corrections.length,
    coverageKinds: [
      ...new Set(
        corrections
          .map((row) => row.coverage_kind)
          .filter((value): value is string => Boolean(value))
      ),
    ].slice(0, 8),
  };
}
