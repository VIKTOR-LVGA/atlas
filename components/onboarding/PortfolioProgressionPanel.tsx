import Link from "next/link";
import { Check, Circle } from "lucide-react";
import type { PortfolioProgression } from "@/lib/portfolio-progression";
import { atlasCard } from "@/lib/atlas-ui";
import { cn } from "@/lib/utils";

type PortfolioProgressionPanelProps = {
  progression: PortfolioProgression;
  compact?: boolean;
};

function ProgressRing({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex h-[88px] w-[88px] shrink-0 items-center justify-center">
      <svg className="h-[88px] w-[88px] -rotate-90" viewBox="0 0 88 88" aria-hidden>
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-border-subtle"
        />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-accent transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[18px] font-semibold tabular-nums text-foreground">
          {clamped}%
        </span>
        <span className="text-[9px] font-medium uppercase tracking-wide text-muted">
          Pronto
        </span>
      </div>
    </div>
  );
}

export function PortfolioProgressionPanel({
  progression,
  compact = false,
}: PortfolioProgressionPanelProps) {
  const {
    headline,
    subheadline,
    maturityLabel,
    overallPercent,
    milestones,
    nextStep,
    completedMilestones,
    totalMilestones,
    portfolioReadinessPercent,
    intelligenceReadinessPercent,
  } = progression;

  const visibleMilestones = compact
    ? milestones.filter(
        (step) => step.status === "current" || step.status === "done"
      ).slice(-3)
    : milestones;

  return (
    <section className={`${atlasCard.primary} overflow-hidden`}>
      <div className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
          <ProgressRing percent={overallPercent} />
          <div className="min-w-0 flex-1">
            <p className="atlas-section-eyebrow text-accent">{maturityLabel}</p>
            <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-foreground sm:text-[18px]">
              {headline}
            </h2>
            <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted">
              {subheadline}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-border-subtle bg-card-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                Portafoglio {portfolioReadinessPercent}%
              </span>
              <span className="rounded-full border border-border-subtle bg-card-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                Analisi {intelligenceReadinessPercent}%
              </span>
              <span className="rounded-full border border-border-subtle bg-card-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                {completedMilestones}/{totalMilestones} passi
              </span>
            </div>
          </div>
        </div>

        {nextStep ? (
          <div className="shrink-0 rounded-xl border border-border-subtle bg-card-muted/40 p-4 sm:min-w-[220px]">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">
              Prossimo passo
            </p>
            <p className="mt-1 text-[13px] font-semibold text-foreground">
              {nextStep.label}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted">
              {nextStep.description}
            </p>
            {nextStep.ctaHref && nextStep.ctaLabel ? (
              <Link
                href={nextStep.ctaHref}
                className="atlas-btn-primary mt-3 inline-flex w-full justify-center px-4 py-2 text-[12px] sm:w-auto"
              >
                {nextStep.ctaLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="border-t border-border-subtle bg-card-muted/30 px-5 py-4 sm:px-6">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
          Percorso guidato
        </p>
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleMilestones.map((step) => (
            <li
              key={step.id}
              className={cn(
                "flex gap-2.5 rounded-lg border px-3 py-2.5",
                step.status === "done" &&
                  "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20",
                step.status === "current" &&
                  "border-accent/30 bg-card shadow-sm ring-1 ring-accent/10",
                step.status === "upcoming" &&
                  "border-border-subtle bg-card/60 opacity-80"
              )}
            >
              <span className="mt-0.5 shrink-0">
                {step.status === "done" ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : step.status === "current" ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-accent bg-card">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                  </span>
                ) : (
                  <Circle className="h-5 w-5 text-border" strokeWidth={1.5} />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-medium leading-snug text-foreground">
                  {step.label}
                </p>
                {!compact ? (
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted">
                    {step.description}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
