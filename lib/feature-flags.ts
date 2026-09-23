/**
 * Centralized feature flags for pilot-risk features.
 * Env overrides: ATLAS_FLAG_<NAME>=1|0|true|false
 *
 * Also accepts ENABLE_BROKER_PORTAL for broker_portal (explicit product hibernation switch).
 */

const DEFAULTS = {
  /** Public Broker Workspace / Partner apply portal. OFF = hibernated, code retained. */
  broker_portal: false,
  benchmark_savings: false,
  intelligence_csv_export: false,
  email_notifications: false,
  partner_choropleth_money: true,
  /** Insurance Operating System surfaces */
  coverage_intelligence: true,
  ask_atlas: true,
  claims: true,
  annual_checkup: true,
  benchmarks: true,
} as const;

export type AtlasFeatureFlag = keyof typeof DEFAULTS;

function parseBool(raw: string | undefined | null): boolean | null {
  if (raw == null || raw === "") return null;
  if (["1", "true", "yes", "on"].includes(raw.toLowerCase())) return true;
  if (["0", "false", "no", "off"].includes(raw.toLowerCase())) return false;
  return null;
}

function envOverride(name: AtlasFeatureFlag): boolean | null {
  if (name === "broker_portal") {
    const explicit = parseBool(process.env.ENABLE_BROKER_PORTAL);
    if (explicit != null) return explicit;
  }
  return parseBool(process.env[`ATLAS_FLAG_${name.toUpperCase()}`]);
}

export function isFeatureEnabled(flag: AtlasFeatureFlag): boolean {
  const override = envOverride(flag);
  if (override != null) return override;
  return DEFAULTS[flag];
}

export function featureFlagsSnapshot(): Record<AtlasFeatureFlag, boolean> {
  return {
    broker_portal: isFeatureEnabled("broker_portal"),
    benchmark_savings: isFeatureEnabled("benchmark_savings"),
    intelligence_csv_export: isFeatureEnabled("intelligence_csv_export"),
    email_notifications: isFeatureEnabled("email_notifications"),
    partner_choropleth_money: isFeatureEnabled("partner_choropleth_money"),
    coverage_intelligence: isFeatureEnabled("coverage_intelligence"),
    ask_atlas: isFeatureEnabled("ask_atlas"),
    claims: isFeatureEnabled("claims"),
    annual_checkup: isFeatureEnabled("annual_checkup"),
    benchmarks: isFeatureEnabled("benchmarks"),
  };
}
