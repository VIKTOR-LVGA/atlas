import { Sparkles } from "lucide-react";
import {
  buildExtractionSummaryMetrics,
  getExtractionConfidenceDescription,
  getExtractionConfidenceLabel,
  getExtractionConfidenceTier,
  type ExtractionSummaryMetric,
} from "@/lib/policy-extraction-reveal";
import type { UserPolicy } from "@/lib/types";
import { cn } from "@/lib/utils";

const PLACEHOLDER_METRIC_VALUES = new Set(["—", "–", "-"]);

function isVisibleSummaryMetric(metric: ExtractionSummaryMetric) {
  const value = metric.value?.trim() ?? "";
  return value.length > 0 && !PLACEHOLDER_METRIC_VALUES.has(value);
}

type PolicyExtractionSummaryHeroProps = {
  policy: UserPolicy;
  insuredCount: number;
  coverageCount: number;
  completenessPercent: number | null;
};

const emphasisClasses = {
  default: "text-foreground",
  success: "text-[var(--success-text)]",
  warning: "text-[var(--warning-text)]",
  muted: "text-muted",
} as const;

export function PolicyExtractionSummaryHero({
  policy,
  insuredCount,
  coverageCount,
  completenessPercent,
}: PolicyExtractionSummaryHeroProps) {
  const visibleMetrics = buildExtractionSummaryMetrics({
    policy,
    insuredCount,
    coverageCount,
    completenessPercent,
  }).filter(isVisibleSummaryMetric);
  const confidenceTier = getExtractionConfidenceTier(policy.extractionConfidence);

  return (
    <section className="atlas-card-primary overflow-hidden">
      <div className="border-b border-border-subtle bg-gradient-to-r from-accent-soft/40 via-card to-card px-4 py-3.5 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="atlas-section-eyebrow text-accent">Riepilogo estrazione Atlas</p>
            <h2 className="mt-1 text-[16px] font-semibold tracking-tight text-foreground sm:text-[17px]">
              Atlas ha mappato la tua polizza
            </h2>
            <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
              {getExtractionConfidenceDescription(
                confidenceTier,
                policy.extractionConfidence
              )}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/20 bg-accent-soft px-3 py-1.5 text-[11px] font-medium text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            {getExtractionConfidenceLabel(confidenceTier)}
          </span>
        </div>
      </div>

      {visibleMetrics.length > 0 ? (
        <div className="p-3.5 sm:p-5">
          <ul className="grid list-none gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,10.5rem),1fr))]">
            {visibleMetrics.map((metric) => (
              <li
                key={metric.id}
                className="min-w-0 rounded-lg border border-border-subtle bg-card px-3 py-3 sm:px-3.5"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                  {metric.label}
                </p>
                <p
                  className={cn(
                    "mt-0.5 truncate text-[14px] font-semibold tabular-nums",
                    emphasisClasses[metric.emphasis ?? "default"]
                  )}
                >
                  {metric.value}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  {metric.subtext}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
