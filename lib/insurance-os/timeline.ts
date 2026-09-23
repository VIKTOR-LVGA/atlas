import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type TimelineEventType =
  | "policy_added"
  | "document_uploaded"
  | "parsing_completed"
  | "parsing_failed"
  | "premium_changed"
  | "coverage_changed"
  | "renewal"
  | "expiry"
  | "consultation_requested"
  | "annual_checkup"
  | "claim_created"
  | "claim_closed"
  | "document_updated"
  | "attention_resolved"
  | "other";

export type TimelineEvent = {
  id: string;
  eventType: TimelineEventType;
  title: string;
  description: string | null;
  entityType: string | null;
  entityId: string | null;
  policyId: string | null;
  documentId: string | null;
  claimId: string | null;
  occurredAt: string;
  metadata: Record<string, unknown>;
};

/**
 * Idempotent timeline write. Same (user, idempotency_key) never duplicates.
 */
export async function recordTimelineEvent(input: {
  eventType: TimelineEventType;
  title: string;
  description?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  policyId?: string | null;
  documentId?: string | null;
  claimId?: string | null;
  occurredAt?: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
}): Promise<TimelineEvent | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("insurance_timeline_events")
    .upsert(
      {
        user_id: user.id,
        event_type: input.eventType,
        title: input.title.slice(0, 240),
        description: input.description?.slice(0, 2000) ?? null,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        policy_id: input.policyId ?? null,
        document_id: input.documentId ?? null,
        claim_id: input.claimId ?? null,
        occurred_at: input.occurredAt ?? new Date().toISOString(),
        idempotency_key: input.idempotencyKey,
        metadata: input.metadata ?? {},
      },
      { onConflict: "user_id,idempotency_key", ignoreDuplicates: true }
    )
    .select("*")
    .maybeSingle();

  if (error) {
    // Race: already exists
    const { data: existing } = await supabase
      .from("insurance_timeline_events")
      .select("*")
      .eq("user_id", user.id)
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (!existing) {
      console.error("[atlas:timeline] record failed", error.message);
      return null;
    }
    return mapRow(existing as Record<string, unknown>);
  }

  return data ? mapRow(data as Record<string, unknown>) : null;
}

function mapRow(row: Record<string, unknown>): TimelineEvent {
  return {
    id: String(row.id),
    eventType: row.event_type as TimelineEventType,
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    entityType: row.entity_type ? String(row.entity_type) : null,
    entityId: row.entity_id ? String(row.entity_id) : null,
    policyId: row.policy_id ? String(row.policy_id) : null,
    documentId: row.document_id ? String(row.document_id) : null,
    claimId: row.claim_id ? String(row.claim_id) : null,
    occurredAt: String(row.occurred_at),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}

export async function listCurrentUserTimelineEvents(options?: {
  limit?: number;
  filter?: "all" | "policies" | "documents" | "checkups" | "claims";
}): Promise<TimelineEvent[]> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("insurance_timeline_events")
    .select("*")
    .eq("user_id", user.id)
    .order("occurred_at", { ascending: false })
    .limit(options?.limit ?? 50);

  const filter = options?.filter ?? "all";
  if (filter === "policies") {
    query = query.in("event_type", [
      "policy_added",
      "premium_changed",
      "coverage_changed",
      "renewal",
      "expiry",
    ]);
  } else if (filter === "documents") {
    query = query.in("event_type", [
      "document_uploaded",
      "parsing_completed",
      "parsing_failed",
      "document_updated",
    ]);
  } else if (filter === "checkups") {
    query = query.eq("event_type", "annual_checkup");
  } else if (filter === "claims") {
    query = query.in("event_type", ["claim_created", "claim_closed"]);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[atlas:timeline] list failed", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}
