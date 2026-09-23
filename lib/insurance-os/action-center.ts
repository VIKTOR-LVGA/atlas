import "server-only";

import {
  buildAttentionCandidates,
} from "@/lib/insurance-os/action-center-core";
import type { CoverageMapResult } from "@/lib/insurance-os/coverage-map-types";
import type { PolicyChangeEvent } from "@/lib/insurance-os/policy-diff-types";
import type { AttentionItem } from "@/lib/insurance-os/shared-types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { UserDocument, UserPolicy } from "@/lib/types";

export type { AttentionItem, AttentionItemType, AttentionPriority } from "@/lib/insurance-os/shared-types";
export { buildAttentionCandidates, detectPossibleOverlaps } from "@/lib/insurance-os/action-center-core";

export async function syncAttentionItems(input: {
  policies: UserPolicy[];
  documents: UserDocument[];
  coverageMap?: CoverageMapResult | null;
  changes?: PolicyChangeEvent[];
  openClaimCount?: number;
  pendingConsultation?: boolean;
}) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const candidates = buildAttentionCandidates(input);
  const activeKeys = new Set(candidates.map((c) => c.sourceKey));

  if (candidates.length > 0) {
    const inserts = candidates.map((c) => ({
      user_id: user.id,
      policy_id: c.policyId,
      document_id: c.documentId,
      opportunity_type: c.type,
      title: c.title.slice(0, 240),
      description: c.description.slice(0, 2000),
      status: "new",
      source: "atlas_rules",
      source_key: c.sourceKey,
      priority: c.priority,
      metadata: { ctaHref: c.ctaHref, ctaLabel: c.ctaLabel },
    }));

    await supabase.from("opportunities").upsert(inserts, {
      onConflict: "user_id,source_key",
      ignoreDuplicates: false,
    });
  }

  const { data: existing } = await supabase
    .from("opportunities")
    .select("id, source_key, status")
    .eq("user_id", user.id)
    .in("status", ["new", "seen"]);

  for (const row of existing ?? []) {
    const key = row.source_key as string | null;
    if (key && !activeKeys.has(key)) {
      await supabase
        .from("opportunities")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", row.id)
        .eq("user_id", user.id);
    }
  }

  return listAttentionItems();
}

export async function listAttentionItems(): Promise<AttentionItem[]> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["new", "seen"])
    .order("detected_at", { ascending: false })
    .limit(40);

  if (error) {
    console.error("[atlas:action-center] list failed", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const meta = (row.metadata as Record<string, unknown>) ?? {};
    return {
      id: String(row.id),
      type: row.opportunity_type as AttentionItem["type"],
      priority: (row.priority as AttentionItem["priority"]) ?? "attention",
      title: String(row.title),
      description: String(row.description),
      policyId: row.policy_id ? String(row.policy_id) : null,
      documentId: row.document_id ? String(row.document_id) : null,
      ctaLabel: typeof meta.ctaLabel === "string" ? meta.ctaLabel : "Apri",
      ctaHref: typeof meta.ctaHref === "string" ? meta.ctaHref : "/dashboard",
      sourceKey: row.source_key ? String(row.source_key) : String(row.id),
      status: row.status as AttentionItem["status"],
    };
  });
}

export async function dismissAttentionItem(id: string) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("opportunities")
    .update({ status: "dismissed", dismissed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  return data?.id ?? null;
}

export async function resolveAttentionItem(id: string) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("opportunities")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  return data?.id ?? null;
}
