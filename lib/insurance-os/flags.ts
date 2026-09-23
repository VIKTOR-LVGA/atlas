import { isFeatureEnabled, type AtlasFeatureFlag } from "@/lib/feature-flags";

export type IosFeatureFlag = Extract<
  AtlasFeatureFlag,
  | "coverage_intelligence"
  | "ask_atlas"
  | "claims"
  | "annual_checkup"
  | "benchmarks"
>;

export function isIosFeatureEnabled(flag: IosFeatureFlag): boolean {
  return isFeatureEnabled(flag);
}

export const MIN_BENCHMARK_COHORT_SIZE = Math.max(
  30,
  Number.parseInt(process.env.ATLAS_MIN_BENCHMARK_COHORT_SIZE ?? "30", 10) || 30
);
