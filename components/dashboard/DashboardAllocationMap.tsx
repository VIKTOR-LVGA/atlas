import Link from "next/link";
import { PieChart } from "lucide-react";
import type { DashboardAllocationSegment } from "@/lib/dashboard-view";
import { cn } from "@/lib/utils";

const segmentColors = [
  "bg-accent",
  "bg-indigo-500/80",
  "bg-emerald-500/80",
  "bg-amber-500/80",
  "bg-violet-500/80",
  "bg-sky-500/80",
];

type DashboardAllocationMapProps = {
  segments: DashboardAllocationSegment[];
};

export function DashboardAllocationMap({ segments }: DashboardAllocationMapProps) {
  if (segments.length === 0) {
    return (
      <section className="atlas-card-secondary p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <PieChart className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-[13px] font-semibold text-foreground">
              Mappa esposizione
            </p>
            <p className="mt-0.5 text-[12px] text-muted">
              Conferma almeno una polizza per vedere come è distribuito il portafoglio.
            </p>
            <Link href="/documents" className="mt-2 inline-block text-[11px] font-medium text-accent">
              Carica un PDF
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const basisLabel = segments.some((segment) => segment.hasPremiumData)
    ? "Quota premio mensile stimato"
    : "Quota per numero di polizze";

  return (
    <section className="atlas-card-primary p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="atlas-section-eyebrow">Esposizione</p>
          <h2 className="text-[14px] font-semibold text-foreground">
            Mappa rischio e concentrazione
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">{basisLabel}</p>
        </div>
        <Link href="/policies" className="text-[11px] font-medium text-accent">
          Vedi polizze
        </Link>
      </div>

      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-card-muted ring-1 ring-border/60">
        {segments.map((segment, index) => (
          <span
            key={segment.id}
            className={cn(segmentColors[index % segmentColors.length], "min-w-[2px]")}
            style={{ width: `${Math.max(segment.sharePercent, 4)}%` }}
            title={`${segment.label} ${segment.sharePercent}%`}
            aria-hidden
          />
        ))}
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {segments.map((segment, index) => (
          <li
            key={segment.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-border-subtle bg-card-muted/30 px-3 py-2"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-full",
                  segmentColors[index % segmentColors.length]
                )}
                aria-hidden
              />
              <span className="truncate text-[12px] font-medium text-foreground">
                {segment.label}
              </span>
            </span>
            <span className="shrink-0 text-[11px] tabular-nums text-muted">
              {segment.sharePercent}% · {segment.policyCount}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
