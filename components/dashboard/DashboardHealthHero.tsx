import { HealthScoreRing } from "@/components/motion/HealthScoreRing";
import { cn } from "@/lib/utils";
import type { DashboardHealthPresentation } from "@/lib/dashboard-view";
import type { DashboardHealthScore } from "@/lib/dashboard-intelligence";

const statusStyles: Record<
  DashboardHealthPresentation["status"],
  { badge: string; ring: string }
> = {
  stable: {
    badge: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-400",
    ring: "text-emerald-600 dark:text-emerald-400",
  },
  watch: {
    badge: "bg-[var(--warning-bg)] text-[var(--warning-text)] ring-[var(--warning-border)]",
    ring: "text-amber-600 dark:text-amber-400",
  },
  high_risk: {
    badge: "bg-[var(--danger-bg)] text-[var(--danger-text)] ring-[var(--danger-border)]",
    ring: "text-[var(--danger-text)]",
  },
  unbalanced: {
    badge: "bg-accent-soft text-accent ring-accent/25",
    ring: "text-accent",
  },
  incomplete: {
    badge: "bg-card-muted text-muted-foreground ring-border",
    ring: "text-muted",
  },
};

type DashboardHealthHeroProps = {
  healthScore: DashboardHealthScore;
  presentation: DashboardHealthPresentation;
};

export function DashboardHealthHero({
  healthScore,
  presentation,
}: DashboardHealthHeroProps) {
  const styles = statusStyles[presentation.status];
  const scoreAvailable = healthScore.available && healthScore.score !== null;

  return (
    <section className="atlas-card-primary atlas-surface-card-interactive p-5 sm:p-6">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          {scoreAvailable ? (
            <div className={cn("shrink-0", styles.ring)}>
              <HealthScoreRing
                score={healthScore.score!}
                className="h-[7rem] w-[7rem] border-4 [&_span]:text-[2rem]"
              />
            </div>
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-dashed border-border bg-card-muted/50 text-[11px] text-muted">
              —
            </div>
          )}
          <div className="text-center sm:text-left">
            <p className="atlas-section-eyebrow">Salute portafoglio</p>
            {!scoreAvailable ? (
              <p className="mt-1 text-[15px] font-semibold text-foreground">
                Score non ancora disponibile
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-muted">Indice su 100 punti</p>
            )}
            <span
              className={cn(
                "mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
                styles.badge
              )}
            >
              {presentation.statusLabel}
            </span>
          </div>
        </div>
        <p className="max-w-md text-center text-[12px] leading-relaxed text-muted sm:text-right">
          {presentation.summary}
        </p>
      </div>
    </section>
  );
}
