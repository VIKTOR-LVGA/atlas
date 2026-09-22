/**
 * Centralized feature flags for pilot-risk features.
 * Env overrides: ATLAS_FLAG_<NAME>=1|0|true|false
 */

const DEFAULTS = {
  benchmark_savings: false,
  intelligence_csv_export: false,
  email_notifications: false,
  partner_choropleth_money: true,
} as const;

export type AtlasFeatureFlag = keyof typeof DEFAULTS;

function envOverride(name: AtlasFeatureFlag): boolean | null {
  const raw = process.env[`ATLAS_FLAG_${name.toUpperCase()}`];
  if (raw == null || raw === "") return null;
  if (["1", "true", "yes", "on"].includes(raw.toLowerCase())) return true;
  if (["0", "false", "no", "off"].includes(raw.toLowerCase())) return false;
  return null;
}

export function isFeatureEnabled(flag: AtlasFeatureFlag): boolean {
  const override = envOverride(flag);
  if (override != null) return override;
  return DEFAULTS[flag];
}

export function featureFlagsSnapshot(): Record<AtlasFeatureFlag, boolean> {
  return {
    benchmark_savings: isFeatureEnabled("benchmark_savings"),
    intelligence_csv_export: isFeatureEnabled("intelligence_csv_export"),
    email_notifications: isFeatureEnabled("email_notifications"),
    partner_choropleth_money: isFeatureEnabled("partner_choropleth_money"),
  };
}
