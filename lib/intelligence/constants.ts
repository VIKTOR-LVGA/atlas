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

export const INTELLIGENCE_MODULE_LABELS: Record<IntelligenceModule, string> = {
  market_overview: "Panoramica mercato osservato",
  switching: "Switching tra compagnie",
  premium_benchmark: "Benchmark premi",
  coverage_benchmark: "Analisi coperture",
  geography: "Geografia",
  insurer_comparison: "Analisi compagnie",
  reports: "Report",
};

export const INTELLIGENCE_COMPANY_TYPES = [
  { value: "insurer", label: "Compagnia assicurativa" },
  { value: "general_agency", label: "Agenzia generale" },
  { value: "broker_intermediary", label: "Broker / intermediario" },
  { value: "insurtech", label: "Insurtech" },
  { value: "market_partner", label: "Partner B2B" },
  { value: "other", label: "Altro" },
] as const;
