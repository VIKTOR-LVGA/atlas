import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";
import { AnimatedProgressBar } from "@/components/motion/AnimatedProgressBar";
import type { MarketReadinessScore } from "@/lib/market-intelligence";
import { cn } from "@/lib/utils";

type MarketReadinessHeroProps = {
  readiness: MarketReadinessScore;
};

const labelTone: Record<MarketReadinessScore["label"], string> = {
  not_ready: "text-muted-foreground",
  preparing: "text-[var(--warning-text)]",
  almost_ready: "text-accent",
  comparison_ready: "text-[var(--success-text)]",
};

export function MarketReadinessHero({ readiness }: MarketReadinessHeroProps) {
  const topBlocker = readiness.blockers[0];

  return (
    <section className="atlas-card-primary overflow-hidden">
      <div className="border-b border-border-subtle bg-gradient-to-r from-accent-soft/40 via-card to-card px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="atlas-section-eyebrow text-accent">Market readiness</p>
            <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-foreground sm:text-[18px]">
              {readiness.headline}
            </h2>
            <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-muted">
              {readiness.subheadline}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span
              className={cn(
                "inline-flex h-14 w-14 items-center justify-center rounded-full border-[3px] bg-card-muted/60 text-[15px] font-bold tabular-nums",
                readiness.percent >= 75
                  ? "border-emerald-500/40 text-[var(--success-text)]"
                  : readiness.percent >= 50
                    ? "border-amber-500/40 text-[var(--warning-text)]"
                    : "border-border text-muted-foreground"
              )}
            >
              {readiness.percent}%
            </span>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-[13px] font-semibold",
                  labelTone[readiness.label]
                )}
              >
                {readiness.labelText}
              </p>
              <p className="mt-0.5 text-[10px] text-muted">Indice preparazione</p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <AnimatedProgressBar percent={readiness.percent} />
        </div>
      </div>

      {topBlocker ? (
        <div className="flex flex-col gap-3 border-t border-border-subtle px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Prossimo sblocco
            </p>
            <p className="mt-0.5 text-[13px] font-semibold text-foreground">
              {topBlocker.title}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">{topBlocker.progressDetail}</p>
          </div>
          <Link
            href={topBlocker.ctaHref}
            className="atlas-btn-primary inline-flex shrink-0 items-center justify-center gap-1.5 px-4 py-2.5 text-[12px]"
          >
            {topBlocker.ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-t border-border-subtle px-4 py-3.5 text-[12px] text-muted sm:px-5">
          <BarChart3 className="h-4 w-4 text-accent" />
          Requisiti portafoglio soddisfatti. In attesa dataset benchmark verificato.
        </div>
      )}
    </section>
  );
}
