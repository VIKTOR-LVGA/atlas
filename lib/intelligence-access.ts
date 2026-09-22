import "server-only";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getOperationsIdentity, OperationsAccessError } from "@/lib/operations-access";
import { BENCHMARK_MINIMUM_COHORT_SIZE } from "@/lib/opportunities-intelligence/foundation";

export const INTELLIGENCE_MIN_COHORT = BENCHMARK_MINIMUM_COHORT_SIZE;
export const INTELLIGENCE_REPRESENTATIVENESS_NOTE =
  "I dati rappresentano il campione osservato da ATLAS (utenti e pratiche ATLAS), non necessariamente l'intero mercato assicurativo svizzero.";

export const INTELLIGENCE_MODULES = [
  "market_overview",
  "switching",
  "premium_benchmark",
  "coverage_benchmark",
  "geography",
  "insurer_comparison",
  "reports",
] as const;

export type IntelligenceModule = (typeof INTELLIGENCE_MODULES)[number];

export async function hasIntelligenceAccess() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("has_atlas_intelligence");
  if (error) return false;
  return Boolean(data);
}

export async function requireIntelligenceAccess() {
  const identity = await getOperationsIdentity();
  if (!identity.user) redirect("/login?next=%2Fintelligence%2Fdashboard");
  if (identity.role === "admin") return { ...identity, isAdmin: true as const };

  const allowed = await hasIntelligenceAccess();
  if (!allowed) {
    redirect("/intelligence/apply");
  }
  return { ...identity, isAdmin: false as const };
}

export async function getIntelligenceMarketOverview(filters?: {
  category?: string;
  canton?: string;
}) {
  const { supabase } = await requireIntelligenceAccess();
  const { data, error } = await supabase.rpc("get_intelligence_market_overview", {
    p_category: filters?.category ?? null,
    p_canton: filters?.canton ?? null,
  });
  if (error) throw new OperationsAccessError(error.message);
  return (data ?? []) as Array<{
    category: string;
    canton: string | null;
    observed_policies: number | null;
    median_premium: number | null;
    p25_premium: number | null;
    p75_premium: number | null;
    sample_status: string;
    minimum_cohort_size: number;
    methodology_version: string;
    calculated_at: string;
    period_start: string;
    period_end: string;
  }>;
}

export async function getIntelligenceSwitchingMatrix(category?: string) {
  const { supabase } = await requireIntelligenceAccess();
  const { data, error } = await supabase.rpc("get_intelligence_switching_matrix", {
    p_category: category ?? null,
  });
  if (error) throw new OperationsAccessError(error.message);
  return (data ?? []) as Array<{
    from_insurer: string;
    to_insurer: string;
    switch_count: number | null;
    sample_status: string;
    minimum_cohort_size: number;
    methodology_version: string;
    calculated_at: string;
  }>;
}

export function insufficientSampleLabel(min = INTELLIGENCE_MIN_COHORT) {
  return `Campione insufficiente — questa vista richiede almeno ${min} osservazioni eleggibili (soglia privacy, pending review legale).`;
}
