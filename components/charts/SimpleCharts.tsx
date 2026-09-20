"use client";

import { cn } from "@/lib/utils";

type Point = { label: string; value: number };

export function SimpleBarChart({
  title,
  points,
  emptyLabel = "Nessun dato nel periodo.",
}: {
  title: string;
  points: Point[];
  emptyLabel?: string;
}) {
  const max = Math.max(...points.map((p) => p.value), 0);
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <h2 className="text-[13px] font-semibold">{title}</h2>
      {!points.length || max === 0 ? (
        <p className="mt-4 text-[12px] text-muted">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {points.map((point) => (
            <li key={point.label} className="grid grid-cols-[7rem_1fr_3.5rem] items-center gap-2 text-[11px]">
              <span className="truncate text-muted">{point.label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-card-muted">
                <span
                  className="block h-full rounded-full bg-accent"
                  style={{ width: `${max ? (point.value / max) * 100 : 0}%` }}
                />
              </span>
              <span className="text-right tabular-nums font-medium">{point.value}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function SimpleFunnel({
  title,
  steps,
}: {
  title: string;
  steps: Array<{ id: string; label: string; count: number }>;
}) {
  const first = steps[0]?.count ?? 0;
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <h2 className="text-[13px] font-semibold">{title}</h2>
      {!steps.length || first === 0 ? (
        <p className="mt-4 text-[12px] text-muted">Nessun dato di funnel disponibile.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {steps.map((step, index) => {
            const prev = index === 0 ? step.count : steps[index - 1].count;
            const conversion = prev ? Math.round((step.count / prev) * 1000) / 10 : 0;
            const drop = prev ? Math.round(((prev - step.count) / prev) * 1000) / 10 : 0;
            const width = first ? Math.max(12, (step.count / first) * 100) : 12;
            return (
              <li key={step.id}>
                <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-medium">{step.label}</span>
                  <span className="tabular-nums text-muted">
                    {step.count}
                    {index > 0 ? ` · ${conversion}% · drop ${drop}%` : null}
                  </span>
                </div>
                <div className="h-8 rounded-lg bg-card-muted">
                  <div
                    className={cn("flex h-full items-center rounded-lg bg-accent/80 px-3 text-[11px] font-medium text-accent-foreground")}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function SimpleLineChart({
  title,
  series,
  emptyLabel = "Nessuna serie temporale.",
}: {
  title: string;
  series: Array<{ label: string; values: number[]; color?: string }>;
  emptyLabel?: string;
}) {
  const labels = series[0] ? series[0].values.map((_, i) => String(i + 1)) : [];
  const allValues = series.flatMap((s) => s.values);
  const max = Math.max(...allValues, 0);
  const height = 160;
  const width = 480;

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <h2 className="text-[13px] font-semibold">{title}</h2>
      {!series.length || max === 0 ? (
        <p className="mt-4 text-[12px] text-muted">{emptyLabel}</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-auto w-full" role="img" aria-label={title}>
            {series.map((s, seriesIndex) => {
              const points = s.values
                .map((value, index) => {
                  const x = (index / Math.max(s.values.length - 1, 1)) * (width - 20) + 10;
                  const y = height - 10 - (max ? (value / max) * (height - 30) : 0);
                  return `${x},${y}`;
                })
                .join(" ");
              return (
                <polyline
                  key={s.label}
                  fill="none"
                  stroke={s.color ?? (seriesIndex === 0 ? "var(--accent)" : "var(--muted)")}
                  strokeWidth="2"
                  points={points}
                />
              );
            })}
          </svg>
          <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted">
            {series.map((s) => (
              <span key={s.label}>{s.label}</span>
            ))}
            <span className="ml-auto">{labels.length} periodi</span>
          </div>
        </>
      )}
    </section>
  );
}
