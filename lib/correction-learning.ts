import "server-only";

import { logPolicyAnalysisError } from "@/lib/policy-analysis-logging";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { TypedPolicyType } from "@/lib/types";

export type CorrectionKind =
  | "changed"
  | "added"
  | "removed"
  | "assigned"
  | "unassigned"
  | "confirmed";

export type CorrectionSource =
  | "policy_field"
  | "insured_person"
  | "coverage"
  | "assignment"
  | "premium"
  | "renewal"
  | "deductible"
  | "category"
  | "other";

export type CorrectionSignalInput = {
  policy_id: string;
  document_id: string | null;
  provider: string | null;
  policy_type: TypedPolicyType | null;
  correction_type?: string | null;
  correction_kind: CorrectionKind;
  correction_source: CorrectionSource;
  field_name?: string | null;
  field_path: string;
  ai_value_before?: unknown;
  corrected_value_after: unknown;
  confidence_before?: number | null;
  coverage_name?: string | null;
  coverage_kind?: string | null;
  coverage_stable_key?: string | null;
  previous_assignment?: Record<string, unknown> | null;
  corrected_assignment?: Record<string, unknown> | null;
  source_context?: Record<string, unknown> | null;
  reviewed_at?: string | null;
};

function toJsonValue(value: unknown): unknown {
  if (value === undefined) {
    return null;
  }

  if (value === null) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toJsonValue(item));
  }

  if (typeof value === "object") {
    return value;
  }

  return String(value);
}

function buildInsertRow(userId: string, signal: CorrectionSignalInput) {
  const aiBefore = toJsonValue(signal.ai_value_before);
  const correctedAfter = toJsonValue(signal.corrected_value_after);
  const legacyPrevious =
    signal.previous_assignment ??
    (signal.correction_kind === "assigned" ||
    signal.correction_kind === "unassigned"
      ? (aiBefore as Record<string, unknown> | null)
      : null);
  const legacyCorrected =
    signal.corrected_assignment ??
    (signal.correction_kind === "assigned" ||
    signal.correction_kind === "unassigned"
      ? (correctedAfter as Record<string, unknown>)
      : { value: correctedAfter });

  return {
    user_id: userId,
    policy_id: signal.policy_id,
    document_id: signal.document_id,
    correction_type:
      signal.correction_type ??
      (signal.correction_kind === "assigned"
        ? "coverage_person_assignment"
        : signal.correction_kind),
    provider: signal.provider,
    policy_type: signal.policy_type,
    coverage_name: signal.coverage_name ?? null,
    coverage_kind: signal.coverage_kind ?? null,
    coverage_stable_key: signal.coverage_stable_key ?? null,
    previous_assignment: legacyPrevious,
    corrected_assignment: legacyCorrected,
    source_context: signal.source_context ?? null,
    field_name: signal.field_name ?? null,
    field_path: signal.field_path,
    ai_value_before: aiBefore,
    corrected_value_after: correctedAfter,
    confidence_before: signal.confidence_before ?? null,
    correction_source: signal.correction_source,
    correction_kind: signal.correction_kind,
    reviewed_at: signal.reviewed_at ?? null,
  };
}

/**
 * Best-effort batch insert — never throws; logs server-side on failure.
 */
export async function saveCorrectionSignals(
  userId: string,
  signals: CorrectionSignalInput[]
): Promise<{ saved: number; failed: boolean }> {
  if (signals.length === 0) {
    return { saved: 0, failed: false };
  }

  const supabase = await getSupabaseServerClient();
  const rows = signals.map((signal) => buildInsertRow(userId, signal));

  const { error } = await supabase.from("extraction_corrections").insert(rows);

  if (error) {
    logPolicyAnalysisError("correction_signals_save_failed", {
      user_id: userId,
      signal_count: signals.length,
      reason: error.message,
    });
    return { saved: 0, failed: true };
  }

  return { saved: rows.length, failed: false };
}

export async function saveCorrectionSignal(
  userId: string,
  signal: CorrectionSignalInput
) {
  return saveCorrectionSignals(userId, [signal]);
}
