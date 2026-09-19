import type { AtlasScore } from "@/lib/atlas-score";

export function AtlasScoreCard({ score }: { score: AtlasScore }) {
  const percent = Math.max(0, Math.min(100, score.score));

  return (
    <section className="atlas-consumer-card px-5 py-5" aria-labelledby="atlas-score-title">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            id="atlas-score-title"
            className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted"
          >
            ATLAS Score
          </p>
          <p className="mt-2 text-[28px] font-semibold tracking-tight text-foreground">
            {score.score}
            <span className="text-[16px] font-medium text-muted"> / {score.max}</span>
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-foreground">{score.headline}</p>
        </div>
        <div
          className="relative h-16 w-16 shrink-0"
          role="img"
          aria-label={`Indice di completezza ${score.score} su ${score.max}`}
        >
          <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="var(--border)"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${percent} 100`}
            />
          </svg>
        </div>
      </div>
      <ul className="mt-4 space-y-1.5">
        {score.factors.map((factor) => (
          <li key={factor.id} className="flex items-center justify-between gap-3 text-[12px]">
            <span className={factor.done ? "text-foreground" : "text-muted"}>{factor.label}</span>
            <span className={factor.done ? "text-[var(--success-text)]" : "text-muted"}>
              {factor.done ? "Completato" : "Manca"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] leading-relaxed text-muted">{score.disclaimer}</p>
    </section>
  );
}
