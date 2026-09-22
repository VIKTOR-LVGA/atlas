import "server-only";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getOperationsIdentity, OperationsAccessError } from "@/lib/operations-access";
import {
  formatInsufficientSample,
  getIntelligenceMinCohortSize,
} from "@/lib/intelligence/privacy";
import {
  INTELLIGENCE_COMPANY_TYPES,
  INTELLIGENCE_MODULE_LABELS,
  INTELLIGENCE_MODULES,
  type IntelligenceModule,
} from "@/lib/intelligence/constants";

export const INTELLIGENCE_MIN_COHORT = getIntelligenceMinCohortSize();
export const INTELLIGENCE_REPRESENTATIVENESS_NOTE =
  "I dati rappresentano il campione osservato da ATLAS (utenti e pratiche ATLAS), non necessariamente l'intero mercato assicurativo svizzero.";

export {
  INTELLIGENCE_COMPANY_TYPES,
  INTELLIGENCE_MODULE_LABELS,
  INTELLIGENCE_MODULES,
};
export type { IntelligenceModule };

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

export type IntelligenceApplicationRow = {
  id: string;
  status: string;
  company_name: string;
  work_email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  rejection_reason: string | null;
  company_id: string | null;
};

export async function hasIntelligenceAccess() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("has_atlas_intelligence");
  if (error) return false;
  return Boolean(data);
}

export async function getLatestIntelligenceApplication(userId?: string) {
  const supabase = await getSupabaseServerClient();
  let uid = userId;
  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    uid = user?.id;
  }
  if (!uid) return null;

  const { data } = await supabase
    .from("intelligence_applications")
    .select(
      "id, status, company_name, work_email, first_name, last_name, created_at, rejection_reason, company_id"
    )
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as IntelligenceApplicationRow | null) ?? null;
}

/** Post-login destination for Intelligence intent. */
export async function resolveIntelligenceEntryPath(): Promise<string> {
  if (await hasIntelligenceAccess()) return "/intelligence/dashboard";
  const app = await getLatestIntelligenceApplication();
  if (app) return "/intelligence/apply/status";
  return "/intelligence/apply";
}

export async function requireIntelligenceAccess() {
  const identity = await getOperationsIdentity();
  if (!identity.user) redirect("/login?intent=intelligence&next=%2Fintelligence%2Fdashboard");
  if (identity.role === "admin") return { ...identity, isAdmin: true as const };

  const allowed = await hasIntelligenceAccess();
  if (allowed) return { ...identity, isAdmin: false as const };

  const application = await getLatestIntelligenceApplication(identity.user.id);
  if (application) {
    redirect("/intelligence/apply/status");
  }
  redirect("/intelligence/apply");
}

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
