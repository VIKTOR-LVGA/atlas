import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { TypedPolicyType } from "@/lib/types";

type CorrectionRow = {
  id: string;
  policy_id: string | null;
  document_id: string | null;
  correction_type: string | null;
  correction_kind: string | null;
  correction_source: string | null;
  field_name: string | null;
  field_path: string | null;
  provider: string | null;
  policy_type: string | null;
  ai_value_before: unknown;
  corrected_value_after: unknown;
  confidence_before: number | null;
  created_at: string;
};

const correctionSelect =
  "id, policy_id, document_id, correction_type, correction_kind, correction_source, field_name, field_path, provider, policy_type, ai_value_before, corrected_value_after, confidence_before, created_at";

async function getUserCorrectionRows(
  userId: string,
  options?: {
    provider?: string | null;
    policyType?: TypedPolicyType | null;
    policyId?: string;
    fieldName?: string;
    limit?: number;
  }
): Promise<CorrectionRow[]> {
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("extraction_corrections")
    .select(correctionSelect)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (options?.policyId) {
    query = query.eq("policy_id", options.policyId);
  }

  if (options?.provider?.trim()) {
    query = query.ilike("provider", options.provider.trim());
  }

  if (options?.policyType) {
    query = query.eq("policy_type", options.policyType);
  }

  if (options?.fieldName) {
    query = query.eq("field_name", options.fieldName);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data as CorrectionRow[];
}

export type UserCorrectionSummary = {
  totalCount: number;
  lastCorrectionAt: string | null;
  topFields: Array<{ fieldName: string; count: number }>;
};

export async function getUserCorrectionSummary(
  userId: string
): Promise<UserCorrectionSummary> {
  const supabase = await getSupabaseServerClient();

  const { count, error: countError } = await supabase
    .from("extraction_corrections")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const totalCount = countError ? 0 : (count ?? 0);

  const { data: latestRow } = await supabase
    .from("extraction_corrections")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const recent = await getUserCorrectionRows(userId, { limit: 500 });
  const fieldCounts = new Map<string, number>();

  for (const row of recent) {
    const label =
      row.field_name ??
      row.field_path ??
      row.correction_kind ??
      row.correction_type ??
      "other";
    fieldCounts.set(label, (fieldCounts.get(label) ?? 0) + 1);
  }

  const topFields = [...fieldCounts.entries()]
    .map(([fieldName, fieldCount]) => ({ fieldName, count: fieldCount }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalCount,
    lastCorrectionAt: latestRow?.created_at ?? null,
    topFields,
  };
}

export async function getPolicyCorrectionSummary(policyId: string, userId: string) {
  const rows = await getUserCorrectionRows(userId, { policyId, limit: 200 });

  return {
    policyId,
    count: rows.length,
    lastCorrectionAt: rows[0]?.created_at ?? null,
    kinds: [...new Set(rows.map((row) => row.correction_kind ?? row.correction_type))],
  };
}

export async function getProviderCorrectionPatterns(
  userId: string,
  provider: string | null,
  policyType: TypedPolicyType | null,
  limit = 50
) {
  const rows = await getUserCorrectionRows(userId, {
    provider,
    policyType,
    limit,
  });

  const byField = new Map<string, number>();
  const byKind = new Map<string, number>();

  for (const row of rows) {
    const field =
      row.field_path ?? row.field_name ?? row.correction_source ?? "unknown";
    byField.set(field, (byField.get(field) ?? 0) + 1);
    const kind = row.correction_kind ?? row.correction_type ?? "unknown";
    byKind.set(kind, (byKind.get(kind) ?? 0) + 1);
  }

  return {
    provider,
    policyType,
    total: rows.length,
    fieldPatterns: [...byField.entries()]
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count),
    kindPatterns: [...byKind.entries()]
      .map(([kind, count]) => ({ kind, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export async function getCorrectionStatsForField(
  userId: string,
  fieldName: string
) {
  const rows = await getUserCorrectionRows(userId, { fieldName, limit: 200 });

  return {
    fieldName,
    count: rows.length,
    providers: [
      ...new Set(rows.map((row) => row.provider).filter(Boolean)),
    ].slice(0, 10) as string[],
    lastAt: rows[0]?.created_at ?? null,
  };
}
