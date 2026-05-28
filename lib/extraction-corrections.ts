import "server-only";

import {
  saveCorrectionSignal,
  saveCorrectionSignals,
  type CorrectionSignalInput,
} from "@/lib/correction-learning";
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
  correction_kind: string | null;
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

export {
  saveCorrectionSignal,
  saveCorrectionSignals,
  type CorrectionSignalInput,
};

/** @deprecated Prefer saveCorrectionSignal — kept for compatibility; best-effort. */
export async function saveExtractionCorrection(
  userId: string,
  input: CoveragePersonAssignmentCorrection
) {
  return saveCorrectionSignal(userId, {
    policy_id: input.policy_id,
    document_id: input.document_id,
    provider: input.provider,
    policy_type: input.policy_type,
    correction_type: input.correction_type,
    correction_kind: "assigned",
    correction_source: "assignment",
    field_name: "coverage_assignment",
    field_path: "coverage.assignment",
    ai_value_before: input.previous_assignment,
    corrected_value_after: input.corrected_assignment,
    coverage_name: input.coverage_name,
    coverage_kind: input.coverage_kind,
    coverage_stable_key: input.coverage_stable_key,
    previous_assignment: input.previous_assignment,
    corrected_assignment: input.corrected_assignment,
    source_context: input.source_context,
  });
}

/**
 * Loads past assignment corrections for future internal use (not sent to OpenAI).
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
      "id, user_id, policy_id, document_id, correction_type, correction_kind, provider, policy_type, coverage_name, coverage_kind, coverage_stable_key, previous_assignment, corrected_assignment, source_context, created_at"
    )
    .eq("user_id", userId)
    .or(
      "correction_type.eq.coverage_person_assignment,correction_kind.eq.assigned"
    )
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

/** Aggregate counts for internal diagnostics only. */
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
