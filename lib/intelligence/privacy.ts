/**
 * ATLAS Intelligence — privacy + analytics pure helpers.
 * Central cohort threshold (env override for tests only).
 */

export const ATLAS_INTELLIGENCE_METHODOLOGY_VERSION = "atlas-intelligence-v1";

const DEFAULT_MIN_COHORT = 20;

/** Centralized privacy threshold — never hardcode k in product UI. */
export function getIntelligenceMinCohortSize(): number {
  const fromEnv = Number(
    process.env.ATLAS_INTELLIGENCE_MIN_COHORT_SIZE ??
      process.env.NEXT_PUBLIC_ATLAS_INTELLIGENCE_MIN_COHORT_SIZE ??
      ""
  );
  if (Number.isFinite(fromEnv) && fromEnv >= 1) return Math.floor(fromEnv);
  return DEFAULT_MIN_COHORT;
}

export const INTELLIGENCE_AGE_BANDS = [
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
] as const;

export type IntelligenceAgeBand = (typeof INTELLIGENCE_AGE_BANDS)[number];

export const SWITCH_REASON_CODES = [
  "lower_price",
  "better_coverage",
  "lower_deductible",
  "service",
  "broker_advice",
  "bundle",
  "life_event",
  "other",
  "unknown",
  "prefer_not_to_say",
] as const;

export type SwitchReasonCode = (typeof SWITCH_REASON_CODES)[number];

export function ageBandFromBirthDate(
  birthDate: Date | string | null | undefined,
  asOf: Date = new Date()
): IntelligenceAgeBand | null {
  if (!birthDate) return null;
  const d = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  if (Number.isNaN(d.getTime())) return null;
  let age = asOf.getFullYear() - d.getFullYear();
  const m = asOf.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && asOf.getDate() < d.getDate())) age -= 1;
  if (age < 18) return null;
  if (age <= 24) return "18-24";
  if (age <= 34) return "25-34";
  if (age <= 44) return "35-44";
  if (age <= 54) return "45-54";
  if (age <= 64) return "55-64";
  return "65+";
}

export type PremiumFrequency =
  | "annual"
  | "yearly"
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "semi_annual"
  | "semi-annual"
  | string;

export function annualizePremium(
  amount: number | null | undefined,
  frequency: PremiumFrequency | null | undefined
): number | null {
  if (amount == null || !Number.isFinite(amount) || amount < 0) return null;
  const f = (frequency ?? "annual").toLowerCase();
  if (f === "annual" || f === "yearly") return amount;
  if (f === "monthly") return amount * 12;
  if (f === "quarterly") return amount * 4;
  if (f === "semiannual" || f === "semi_annual" || f === "semi-annual") return amount * 2;
  return null;
}

/** Linear interpolation percentile on a sorted ascending array. */
export function percentile(sortedAsc: number[], p: number): number | null {
  const n = sortedAsc.length;
  if (n === 0) return null;
  if (n === 1) return sortedAsc[0]!;
  const idx = 1 + (p / 100) * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo - 1]!;
  const a = sortedAsc[lo - 1]!;
  const b = sortedAsc[hi - 1]!;
  return a + (b - a) * (idx - lo);
}

export function premiumDistribution(values: number[]) {
  const sorted = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  return {
    n: sorted.length,
    median: percentile(sorted, 50),
    p25: percentile(sorted, 25),
    p75: percentile(sorted, 75),
  };
}

export function meetsCohortThreshold(
  eligibleCount: number,
  minCohort = getIntelligenceMinCohortSize()
): boolean {
  return eligibleCount >= minCohort;
}

export type SampleGate =
  | { status: "ok"; eligibleCount: number }
  | { status: "insufficient_sample"; eligibleCount: number; minimumCohortSize: number };

export function gateSample(
  eligibleCount: number,
  minCohort = getIntelligenceMinCohortSize()
): SampleGate {
  if (eligibleCount >= minCohort) return { status: "ok", eligibleCount };
  return {
    status: "insufficient_sample",
    eligibleCount,
    minimumCohortSize: minCohort,
  };
}

/** Suppress cell values below threshold — never return the real count. */
export function suppressBelowThreshold<T extends number | null>(
  value: T,
  count: number,
  minCohort = getIntelligenceMinCohortSize()
): T | null {
  if (count < minCohort) return null;
  return value;
}

export function isConfirmedSwitch(input: {
  fromInsurer: string | null | undefined;
  toInsurer: string | null | undefined;
  source?: string | null;
}): boolean {
  const from = (input.fromInsurer ?? "").trim().toLowerCase();
  const to = (input.toInsurer ?? "").trim().toLowerCase();
  if (!from || !to || from === to) return false;
  const src = (input.source ?? "broker_confirmed").toLowerCase();
  return ["broker_confirmed", "contract_confirmed", "consumer_confirmed", "user_declared"].includes(
    src
  );
}

export function coveragePenetration(params: {
  included: number;
  excluded: number;
  unknown: number;
}): { penetrationPct: number | null; knownDenominator: number } {
  const known = params.included + params.excluded;
  if (known === 0) return { penetrationPct: null, knownDenominator: 0 };
  return {
    penetrationPct: (params.included / known) * 100,
    knownDenominator: known,
  };
}

export function netObservedSwitching(inflow: number, outflow: number): number {
  return inflow - outflow;
}

export function formatInsufficientSample(min = getIntelligenceMinCohortSize()): string {
  return `Campione ancora insufficiente. Questa analisi si attiverà automaticamente quando il campione ATLAS raggiungerà almeno ${min} osservazioni idonee.`;
}

export function eligibleCountLabel(
  count: number | null | undefined,
  min = getIntelligenceMinCohortSize()
): string {
  if (count == null || count < min) return `< ${min} osservazioni idonee`;
  return `${count} osservazioni idonee`;
}
