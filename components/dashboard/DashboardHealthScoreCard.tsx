import { HealthScoreRing } from "@/components/motion/HealthScoreRing";
import { cn } from "@/lib/utils";
import type { DashboardHealthScore } from "@/lib/dashboard-intelligence";

interface DashboardHealthScoreCardProps {
  healthScore: DashboardHealthScore;
}

export function DashboardHealthScoreCard({
  healthScore,
}: DashboardHealthScoreCardProps) {
  return (
    <section className="atlas-card-primary atlas-surface-card-interactive h-full p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="atlas-section-eyebrow">Salute del portafoglio</p>
          <h2 className="mt-1 text-[14px] font-semibold tracking-tight text-foreground">
            Insurance Health Score
          </h2>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            {healthScore.disclaimer}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {healthScore.available && healthScore.score !== null ? (
            <>
              <HealthScoreRing score={healthScore.score} />
              <div>
                <p className="text-[13px] font-semibold text-foreground">
                  {healthScore.label}
                </p>
                <p className="text-[10px] text-muted">su 100</p>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-card-muted/50 px-3 py-2 text-[11px] text-muted">
              Non disponibile
            </div>
          )}
        </div>
      </div>

      {healthScore.factors.length > 0 ? (
        <ul className="mt-3 grid gap-1.5 border-t border-border-subtle pt-3 sm:grid-cols-2">
          {healthScore.factors.map((factor) => (
            <li
              key={`${factor.label}-${factor.detail}`}
              className="flex items-start gap-2 rounded-md px-1 py-0.5 text-[11px] leading-snug"
            >
              <span
                className={cn(
                  "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                  factor.impact === "positive" && "bg-emerald-500",
                  factor.impact === "negative" && "bg-amber-500",
                  factor.impact === "neutral" && "bg-muted"
                )}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="font-medium text-foreground">{factor.label}</span>
                <span className="text-muted-foreground"> — {factor.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
