import "server-only";

import { createHash } from "crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { PolicyChangeEvent, PolicyChangeType } from "@/lib/insurance-os/policy-diff-types";
import type { VerificationStatus } from "@/lib/insurance-os/verification";
import type { UserPolicy } from "@/lib/types";

export type { PolicyChangeEvent, PolicyChangeType } from "@/lib/insurance-os/policy-diff-types";

function moneyDelta(prev: number | null, next: number | null): string | null {
  if (prev == null || next == null) return null;
  if (prev === next) return null;
  const delta = next - prev;
  const sign = delta > 0 ? "+" : "";
  return `CHF ${prev.toLocaleString("it-CH")} → CHF ${next.toLocaleString("it-CH")} (${sign}${delta.toLocaleString("it-CH")})`;
}

/**
 * Compare two policy snapshots (e.g. previous vs new document version).
 * Only emits changes supported by structured fields — never invents.
 */
export function computePolicyDiff(input: {
  policyId: string;
  previous: Partial<UserPolicy> | null;
  next: UserPolicy;
  sourceDocumentId?: string | null;
  previousDocumentId?: string | null;
}): Omit<PolicyChangeEvent, "id" | "createdAt">[] {
  const prev = input.previous;
  if (!prev) return [];

  const events: Omit<PolicyChangeEvent, "id" | "createdAt">[] = [];
  const docKey = `${input.previousDocumentId ?? "none"}→${input.sourceDocumentId ?? "none"}`;

  const premiumSummary = moneyDelta(prev.premiumAmount ?? null, input.next.premiumAmount);
  if (premiumSummary) {
    const key = createHash("sha256")
      .update(`premium:${input.policyId}:${docKey}:${prev.premiumAmount}:${input.next.premiumAmount}`)
      .digest("hex")
      .slice(0, 32);
    events.push({
      policyId: input.policyId,
      changeType: "premium",
      fieldPath: "premium_amount",
      previousValue: prev.premiumAmount,
      newValue: input.next.premiumAmount,
      displaySummary: `Premio: ${premiumSummary}`,
      verificationStatus: "inferred",
      sourceDocumentId: input.sourceDocumentId ?? null,
      idempotencyKey: key,
    });
  }

  const dedSummary = moneyDelta(prev.deductible ?? null, input.next.deductible);
  if (dedSummary) {
    const key = createHash("sha256")
      .update(`deductible:${input.policyId}:${docKey}:${prev.deductible}:${input.next.deductible}`)
      .digest("hex")
      .slice(0, 32);
    events.push({
      policyId: input.policyId,
      changeType: "deductible",
      fieldPath: "deductible",
      previousValue: prev.deductible,
      newValue: input.next.deductible,
      displaySummary: `Franchigia: ${dedSummary}`,
      verificationStatus: "inferred",
      sourceDocumentId: input.sourceDocumentId ?? null,
      idempotencyKey: key,
    });
  }

  if (
    prev.provider &&
    input.next.provider &&
    prev.provider.trim().toLowerCase() !== input.next.provider.trim().toLowerCase()
  ) {
    const key = createHash("sha256")
      .update(`insurer:${input.policyId}:${docKey}:${prev.provider}:${input.next.provider}`)
      .digest("hex")
      .slice(0, 32);
    events.push({
      policyId: input.policyId,
      changeType: "insurer",
      fieldPath: "provider",
      previousValue: prev.provider,
      newValue: input.next.provider,
      displaySummary: `Compagnia: ${prev.provider} → ${input.next.provider}`,
      verificationStatus: "needs_verification",
      sourceDocumentId: input.sourceDocumentId ?? null,
      idempotencyKey: key,
    });
  }

  if (
    (prev.endDate || prev.renewalDate) &&
    (input.next.endDate || input.next.renewalDate) &&
    (prev.endDate !== input.next.endDate || prev.renewalDate !== input.next.renewalDate)
  ) {
    const key = createHash("sha256")
      .update(
        `duration:${input.policyId}:${docKey}:${prev.endDate}:${input.next.endDate}:${prev.renewalDate}:${input.next.renewalDate}`
      )
      .digest("hex")
      .slice(0, 32);
    events.push({
      policyId: input.policyId,
      changeType: "duration",
      fieldPath: "end_date|renewal_date",
      previousValue: { end: prev.endDate, renewal: prev.renewalDate },
      newValue: { end: input.next.endDate, renewal: input.next.renewalDate },
      displaySummary: "Date di durata/rinnovo aggiornate rispetto al documento precedente.",
      verificationStatus: "inferred",
      sourceDocumentId: input.sourceDocumentId ?? null,
      idempotencyKey: key,
    });
  }

  return events;
}

export async function persistPolicyChangeEvents(
  events: Omit<PolicyChangeEvent, "id" | "createdAt">[],
  userId: string
) {
  if (events.length === 0) return [];
  const supabase = await getSupabaseServerClient();
  const rows = events.map((e) => ({
    user_id: userId,
    policy_id: e.policyId,
    source_document_id: e.sourceDocumentId,
    change_type: e.changeType,
    field_path: e.fieldPath,
    previous_value: e.previousValue == null ? null : e.previousValue,
    new_value: e.newValue == null ? null : e.newValue,
    display_summary: e.displaySummary,
    verification_status: e.verificationStatus,
    idempotency_key: e.idempotencyKey,
  }));

  const { data, error } = await supabase
    .from("policy_change_events")
    .upsert(rows, { onConflict: "user_id,idempotency_key", ignoreDuplicates: true })
    .select("*");

  if (error) {
    console.error("[atlas:policy-diff] persist failed", error.message);
    return [];
  }

  return (data ?? []).map(
    (row): PolicyChangeEvent => ({
      id: String(row.id),
      policyId: String(row.policy_id),
      changeType: row.change_type as PolicyChangeType,
      fieldPath: String(row.field_path),
      previousValue: row.previous_value,
      newValue: row.new_value,
      displaySummary: String(row.display_summary),
      verificationStatus: row.verification_status as VerificationStatus,
      sourceDocumentId: row.source_document_id ? String(row.source_document_id) : null,
      idempotencyKey: String(row.idempotency_key),
      createdAt: String(row.created_at),
    })
  );
}

export async function listRecentPolicyChanges(limit = 20): Promise<PolicyChangeEvent[]> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("policy_change_events")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []).map(
    (row): PolicyChangeEvent => ({
      id: String(row.id),
      policyId: String(row.policy_id),
      changeType: row.change_type as PolicyChangeType,
      fieldPath: String(row.field_path),
      previousValue: row.previous_value,
      newValue: row.new_value,
      displaySummary: String(row.display_summary),
      verificationStatus: row.verification_status as VerificationStatus,
      sourceDocumentId: row.source_document_id ? String(row.source_document_id) : null,
      idempotencyKey: String(row.idempotency_key),
      createdAt: String(row.created_at),
    })
  );
}
