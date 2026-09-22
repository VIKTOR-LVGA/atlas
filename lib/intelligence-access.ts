import "server-only";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getOperationsIdentity, OperationsAccessError } from "@/lib/operations-access";
import {
  formatInsufficientSample,
  getIntelligenceMinCohortSize,
} from "@/lib/intelligence/privacy";

export const INTELLIGENCE_MIN_COHORT = getIntelligenceMinCohortSize();
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

export type IntelligenceDashboardSummary = {
  sample_label?: string;
  methodology_version?: string;
  minimum_cohort_size?: number;
  last_updated?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  policies_eligible?: number | null;
  quotes_eligible?: number | null;
  switches_eligible?: number | null;
  contracts_eligible?: number | null;
  market_series_ok?: number;
  switching_cells_ok?: number;
  representativeness?: string;
};

export const EMPTY_INTELLIGENCE_SUMMARY: IntelligenceDashboardSummary = {};

export async function getIntelligenceDashboardSummary(): Promise<IntelligenceDashboardSummary> {
  const { supabase } = await requireIntelligenceAccess();
  const { data, error } = await supabase.rpc("get_intelligence_dashboard_summary");
  if (error) throw new OperationsAccessError(error.message);
  return (data ?? {}) as IntelligenceDashboardSummary;
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

export async function getIntelligencePremiums(filters?: {
  category?: string;
  canton?: string;
}) {
  const { supabase } = await requireIntelligenceAccess();
  const { data, error } = await supabase.rpc("get_intelligence_premiums", {
    p_category: filters?.category ?? null,
    p_canton: filters?.canton ?? null,
  });
  if (error) throw new OperationsAccessError(error.message);
  return (data ?? []) as Array<{
    category: string;
    canton: string | null;
    insurer: string | null;
    source_count: number | null;
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

export async function getIntelligenceCoverages(category?: string) {
  const { supabase } = await requireIntelligenceAccess();
  const { data, error } = await supabase.rpc("get_intelligence_coverages", {
    p_category: category ?? null,
  });
  if (error) throw new OperationsAccessError(error.message);
  return (data ?? []) as Array<{
    category: string;
    coverage_code: string;
    penetration_pct: number | null;
    source_count: number | null;
    sample_status: string;
    minimum_cohort_size: number;
    methodology_version: string;
    calculated_at: string;
  }>;
}

export async function getIntelligenceGeography(category?: string) {
  const { supabase } = await requireIntelligenceAccess();
  const { data, error } = await supabase.rpc("get_intelligence_geography", {
    p_category: category ?? null,
  });
  if (error) throw new OperationsAccessError(error.message);
  return (data ?? []) as Array<{
    category: string;
    canton: string;
    observed_policies: number | null;
    median_premium: number | null;
    switch_count: number | null;
    sample_status: string;
    minimum_cohort_size: number;
    methodology_version: string;
    calculated_at: string;
  }>;
}

export async function getIntelligenceInsurers(category?: string) {
  const { supabase } = await requireIntelligenceAccess();
  const { data, error } = await supabase.rpc("get_intelligence_insurers", {
    p_category: category ?? null,
  });
  if (error) throw new OperationsAccessError(error.message);
  return (data ?? []) as Array<{
    category: string;
    insurer: string;
    observed_policies: number | null;
    median_premium: number | null;
    switch_inflow: number | null;
    switch_outflow: number | null;
    net_observed_switching: number | null;
    sample_status: string;
    minimum_cohort_size: number;
    methodology_version: string;
    calculated_at: string;
  }>;
}

export async function getIntelligenceDataHealth() {
  const identity = await getOperationsIdentity();
  if (identity.role !== "admin") throw new OperationsAccessError("admin required");
  const { data, error } = await identity.supabase.rpc("get_intelligence_data_health");
  if (error) throw new OperationsAccessError(error.message);
  return data as Record<string, unknown>;
}

export async function triggerIntelligenceSnapshotRefresh(periodDays = 365) {
  const identity = await getOperationsIdentity();
  if (identity.role !== "admin") throw new OperationsAccessError("admin required");
  const { data, error } = await identity.supabase.rpc("refresh_intelligence_snapshots", {
    p_trigger_source: "manual",
    p_period_days: periodDays,
  });
  if (error) throw new OperationsAccessError(error.message);
  return data as string;
}

export function insufficientSampleLabel(min = INTELLIGENCE_MIN_COHORT) {
  return formatInsufficientSample(min);
}

export { formatInsufficientSample, getIntelligenceMinCohortSize };
