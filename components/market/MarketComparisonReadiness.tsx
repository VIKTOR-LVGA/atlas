import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { AnimatedProgressBar } from "@/components/motion/AnimatedProgressBar";
import { SectionCard } from "@/components/ui/SectionCard";
import type { MarketReadinessBlocker } from "@/lib/market-intelligence";
import { cn } from "@/lib/utils";

type MarketComparisonReadinessProps = {
  blockers: MarketReadinessBlocker[];
};

export function MarketComparisonReadiness({ blockers }: MarketComparisonReadinessProps) {
  if (blockers.length === 0) {
    return (
      <SectionCard title="Prontezza confronti" padding="sm" tone="primary">
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-3 dark:border-emerald-900/30">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--success-text)]" />
          <div>
            <p className="text-[13px] font-semibold text-foreground">
              Requisiti portafoglio soddisfatti
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              I moduli benchmark restano in preparazione fino all&apos;integrazione di un
              dataset svizzero verificato. Nessun confronto simulato è mostrato.
            </p>
          </div>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Prontezza confronti"
      description="Cosa Atlas necessita prima di attivare analisi comparative reali"
      bodyClassName="space-y-2"
    >
      <ul className="space-y-2">
        {blockers.map((blocker) => (
          <li
            key={blocker.id}
            className={cn(
              "rounded-xl border px-3 py-3 sm:px-3.5",
              blocker.priority === "high"
                ? "border-amber-500/25 bg-amber-500/[0.05] dark:border-amber-900/35"
                : "border-border-subtle bg-card-muted/40"
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-2.5">
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    blocker.priority === "high"
                      ? "bg-[var(--warning-bg)] text-[var(--warning-text)]"
                      : "bg-accent-soft text-accent"
                  )}
                >
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground">
                    {blocker.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                    {blocker.description}
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                    {blocker.progressDetail}
                  </p>
                </div>
              </div>
              <Link
                href={blocker.ctaHref}
                className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold text-accent transition hover:bg-accent-soft sm:mt-0.5"
              >
                {blocker.ctaLabel}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {blocker.progressPercent !== null ? (
              <div className="mt-2.5 pl-[42px] sm:pl-0">
                <AnimatedProgressBar percent={blocker.progressPercent} />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
