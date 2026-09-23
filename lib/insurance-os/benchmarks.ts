import "server-only";

import { MIN_BENCHMARK_COHORT_SIZE } from "@/lib/insurance-os/flags";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type BenchmarkResult =
  | {
      available: false;
      reason: "insufficient_cohort" | "disabled" | "error";
      minCohortSize: number;
      message: string;
    }
  | {
      available: true;
      category: string;
      region: string | null;
      sampleSize: number;
      medianAnnualPremium: number | null;
      p25AnnualPremium: number | null;
      p75AnnualPremium: number | null;
      currency: string;
      computedAt: string;
    };

/**
 * Never invents data. Below threshold → unavailable message.
 * Uses security-definer RPC that only returns aggregates.
 */
export async function getConsumerBenchmark(input: {
  category: string;
  region?: string | null;
}): Promise<BenchmarkResult> {
  const min = MIN_BENCHMARK_COHORT_SIZE;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_consumer_benchmark", {
    p_category: input.category,
    p_region: input.region ?? null,
    p_min_cohort: min,
  });

  if (error) {
    return {
      available: false,
      reason: "error",
      minCohortSize: min,
      message:
        "Non ci sono ancora abbastanza dati aggregati per creare un confronto affidabile.",
    };
  }

  const payload = data as Record<string, unknown>;
  if (!payload?.available) {
    return {
      available: false,
      reason: "insufficient_cohort",
      minCohortSize: min,
      message:
        typeof payload?.message === "string"
          ? payload.message
          : "Non ci sono ancora abbastanza dati aggregati per creare un confronto affidabile.",
    };
  }

  return {
    available: true,
    category: String(payload.category),
    region: payload.region ? String(payload.region) : null,
    sampleSize: Number(payload.sample_size),
    medianAnnualPremium:
      payload.median_annual_premium == null
        ? null
        : Number(payload.median_annual_premium),
    p25AnnualPremium:
      payload.p25_annual_premium == null ? null : Number(payload.p25_annual_premium),
    p75AnnualPremium:
      payload.p75_annual_premium == null ? null : Number(payload.p75_annual_premium),
    currency: String(payload.currency ?? "CHF"),
    computedAt: String(payload.computed_at),
  };
}
