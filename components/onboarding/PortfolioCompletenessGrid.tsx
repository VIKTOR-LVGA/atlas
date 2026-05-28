import type { CompletenessMetric } from "@/lib/portfolio-progression";
import { SectionCard } from "@/components/ui/SectionCard";
import { cn } from "@/lib/utils";

type PortfolioCompletenessGridProps = {
  metrics: CompletenessMetric[];
  title?: string;
  description?: string;
};

export function PortfolioCompletenessGrid({
  metrics,
  title = "Completezza portafoglio",
  description = "Completezza del portafoglio in base a documenti e polizze strutturate.",
}: PortfolioCompletenessGridProps) {
  const applicable = metrics.filter((metric) => metric.percent !== null);

  if (applicable.length === 0) {
    return null;
  }

  return (
    <SectionCard title={title} description={description}>
      <ul className="grid gap-3 sm:grid-cols-2">
        {applicable.map((metric) => (
          <li
            key={metric.id}
            className="rounded-lg border border-border-subtle bg-card-muted/30 px-3 py-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] font-medium text-foreground">{metric.label}</p>
              <span
                className={cn(
                  "shrink-0 text-[12px] font-semibold tabular-nums",
                  metric.status === "complete" && "text-emerald-600",
                  metric.status === "partial" && "text-amber-600",
                  metric.status === "empty" && "text-muted"
                )}
              >
                {metric.percent}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border-subtle">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  metric.status === "complete" && "bg-emerald-500",
                  metric.status === "partial" && "bg-amber-500",
                  metric.status === "empty" && "bg-muted/40"
                )}
                style={{ width: `${metric.percent ?? 0}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-muted">{metric.detail}</p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
