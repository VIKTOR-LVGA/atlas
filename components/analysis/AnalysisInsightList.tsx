import Link from "next/link";
import { AlertTriangle, ChevronRight, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AnalysisInsight,
  AnalysisInsightSeverity,
} from "@/lib/analysis-intelligence";

const severityStyles: Record<
  AnalysisInsightSeverity,
  { wrap: string; icon: string }
> = {
  high: {
    wrap: "bg-[var(--danger-bg)] ring-1 ring-[var(--danger-border)]",
    icon: "text-[var(--danger-text)]",
  },
  medium: {
    wrap: "bg-[var(--warning-bg)] ring-1 ring-[var(--warning-border)]",
    icon: "text-[var(--warning-text)]",
  },
  low: {
    wrap: "bg-card-muted ring-1 ring-border",
    icon: "text-muted",
  },
  info: {
    wrap: "bg-accent-soft ring-1 ring-accent/15",
    icon: "text-accent",
  },
};

interface AnalysisInsightListProps {
  insights: AnalysisInsight[];
}

export function AnalysisInsightList({ insights }: AnalysisInsightListProps) {
  if (insights.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card-muted/40 px-3 py-8 text-center">
        <Sparkles className="mx-auto h-5 w-5 text-muted" />
        <p className="mt-2 text-[12px] font-medium text-foreground">
          Nessun insight al momento
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Carica e conferma più polizze per attivare l&apos;analisi.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border-subtle">
      {insights.map((insight) => {
        const styles = severityStyles[insight.severity];
        const content = (
          <>
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]",
                styles.wrap
              )}
            >
              {insight.severity === "info" ? (
                <Sparkles className={cn("h-3.5 w-3.5", styles.icon)} />
              ) : insight.severity === "low" ? (
                <Info className={cn("h-3.5 w-3.5", styles.icon)} />
              ) : (
                <AlertTriangle className={cn("h-3.5 w-3.5", styles.icon)} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-medium text-foreground">
                {insight.title}
              </span>
              <span className="mt-px block text-[11px] leading-snug text-muted-foreground">
                {insight.explanation}
              </span>
            </span>
            {insight.ctaHref ? (
              <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted sm:block" />
            ) : null}
          </>
        );

        return (
          <li key={insight.id}>
            {insight.ctaHref ? (
              <Link
                href={insight.ctaHref}
                className="atlas-row-interactive group flex items-start gap-2.5 py-2.5"
              >
                {content}
              </Link>
            ) : (
              <div className="flex items-start gap-2.5 py-2.5">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
