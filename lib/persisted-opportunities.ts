import "server-only";

import { buildOpportunities, type Opportunity } from "@/lib/opportunities";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  PersistedOpportunity,
  PersistedOpportunityType,
  UserDocument,
  UserPolicy,
} from "@/lib/types";

export class OpportunityDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpportunityDataError";
  }
}

const typeMap: Record<Opportunity["kind"], PersistedOpportunityType> = {
  expiring: "upcoming_expiry",
  missing_premium: "missing_premium",
  missing_document: "missing_document",
  stale_review: "periodic_review",
};

function policyIdFromOpportunity(item: Opportunity) {
  if (item.id === "empty-portfolio") return null;
  const separator = item.id.indexOf("-");
  return separator >= 0 ? item.id.slice(separator + 1) : null;
}

function sourceKey(item: Opportunity, policies: Map<string, UserPolicy>) {
  const policyId = policyIdFromOpportunity(item);
  if (!policyId) return "atlas:incomplete_policy:portfolio";
  const policy = policies.get(policyId);
  const discriminator = item.kind === "expiring"
    ? policy?.renewalDate ?? policy?.endDate ?? "unknown"
    : item.kind === "stale_review"
      ? policy?.updatedAt.slice(0, 10) ?? "unknown"
      : "current";
  return `atlas:${typeMap[item.kind]}:${policyId}:${discriminator}`;
}

function toPersisted(row: Record<string, unknown>): PersistedOpportunity {
  return {
    id: String(row.id),
    policyId: row.policy_id ? String(row.policy_id) : null,
    opportunityType: row.opportunity_type as PersistedOpportunityType,
    title: String(row.title),
    description: String(row.description),
    status: row.status as PersistedOpportunity["status"],
    source: String(row.source),
    sourceKey: row.source_key ? String(row.source_key) : null,
    detectedAt: String(row.detected_at),
    seenAt: row.seen_at ? String(row.seen_at) : null,
    dismissedAt: row.dismissed_at ? String(row.dismissed_at) : null,
    resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}

async function current() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new OpportunityDataError("Accedi di nuovo per continuare.");
  return { supabase, user };
}

export async function syncCurrentUserOpportunities(input: {
  policies: UserPolicy[];
  documents: UserDocument[];
  now?: Date;
}) {
  const { supabase, user } = await current();
  const policyMap = new Map(input.policies.map((policy) => [policy.id, policy]));
  const dynamic = buildOpportunities(input);
  const candidates = dynamic.map((item) => {
    const policyId = policyIdFromOpportunity(item);
    return {
      item,
      policyId,
      type: item.id === "empty-portfolio" ? "incomplete_policy" as const : typeMap[item.kind],
      key: sourceKey(item, policyMap),
    };
  });
  const activeKeys = new Set(candidates.map((candidate) => candidate.key));

  const { data: existing, error: readError } = await supabase
    .from("opportunities")
    .select("id, source_key, status")
    .eq("user_id", user.id)
    .eq("source", "atlas_rules");
  if (readError) throw new OpportunityDataError("Opportunita non disponibili.");

  const byKey = new Map((existing ?? []).map((row) => [row.source_key, row]));
  const inserts = candidates.filter((candidate) => !byKey.has(candidate.key)).map((candidate) => ({
    user_id: user.id,
    policy_id: candidate.policyId,
    opportunity_type: candidate.type,
    title: candidate.item.title,
    description: candidate.item.description,
    source: "atlas_rules",
    source_key: candidate.key,
    metadata: { cta_href: candidate.item.ctaHref, cta_label: candidate.item.ctaLabel },
  }));
  if (inserts.length) {
    const { error } = await supabase.from("opportunities").upsert(inserts, {
      onConflict: "user_id,source_key",
      ignoreDuplicates: true,
    });
    if (error) throw new OpportunityDataError("Sincronizzazione opportunita non riuscita.");
  }

  const staleIds = (existing ?? [])
    .filter((row) => row.source_key && !activeKeys.has(row.source_key) && row.status !== "resolved")
    .map((row) => row.id);
  if (staleIds.length) {
    const { error } = await supabase.from("opportunities").update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
    }).eq("user_id", user.id).in("id", staleIds);
    if (error) throw new OpportunityDataError("Storico opportunita non aggiornato.");
  }

  return listCurrentUserOpportunities();
}

export async function listCurrentUserOpportunities(options: { includeHistory?: boolean } = {}) {
  const { supabase, user } = await current();
  let query = supabase.from("opportunities").select("*").eq("user_id", user.id).order("detected_at", { ascending: false });
  if (!options.includeHistory) query = query.in("status", ["new", "seen"]);
  const { data, error } = await query;
  if (error) throw new OpportunityDataError("Opportunita non disponibili.");
  return (data ?? []).map((row) => toPersisted(row));
}

export async function markOpportunitySeen(id: string) {
  const { supabase, user } = await current();
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("opportunities").update({ status: "seen", seen_at: now }).eq("id", id).eq("user_id", user.id).in("status", ["new", "seen"]).select("*").maybeSingle();
  if (error || !data) throw new OpportunityDataError("Opportunita non aggiornata.");
  return toPersisted(data);
}

export async function dismissOpportunity(id: string) {
  const { supabase, user } = await current();
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("opportunities").update({ status: "dismissed", dismissed_at: now }).eq("id", id).eq("user_id", user.id).in("status", ["new", "seen"]).select("*").maybeSingle();
  if (error || !data) throw new OpportunityDataError("Opportunita non archiviata.");
  return toPersisted(data);
}
