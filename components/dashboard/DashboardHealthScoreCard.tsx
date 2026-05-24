import { cn } from "@/lib/utils";
import type { DashboardHealthScore } from "@/lib/dashboard-intelligence";

interface DashboardHealthScoreCardProps {
  healthScore: DashboardHealthScore;
}

function scoreRingColor(score: number) {
  if (score >= 75) {
    return "border-emerald-500/35 text-emerald-600 dark:text-emerald-400";
  }
  if (score >= 50) {
    return "border-amber-500/35 text-amber-600 dark:text-amber-400";
  }
  return "border-red-500/35 text-red-600 dark:text-red-400";
}

export function DashboardHealthScoreCard({
  healthScore,
}: DashboardHealthScoreCardProps) {
  return (
    <section className="atlas-surface-card h-full p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              <div
                className={cn(
                  "flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border-[3px] bg-card-muted/80",
                  scoreRingColor(healthScore.score)
                )}
                aria-label={`Score ${healthScore.score} su 100`}
              >
                <span className="text-[1.375rem] font-semibold tabular-nums">
                  {healthScore.score}
                </span>
              </div>
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
