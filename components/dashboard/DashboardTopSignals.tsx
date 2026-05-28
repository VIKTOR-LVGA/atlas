import Link from "next/link";
import { AlertTriangle, ChevronRight, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardSignal } from "@/lib/dashboard-view";

const severityStyles = {
  high: "border-[var(--danger-border)] bg-[var(--danger-bg)]/40",
  medium: "border-[var(--warning-border)] bg-[var(--warning-bg)]/40",
  low: "border-border bg-card-muted/50",
} as const;

type DashboardTopSignalsProps = {
  signals: DashboardSignal[];
};

export function DashboardTopSignals({ signals }: DashboardTopSignalsProps) {
  if (signals.length === 0) {
    return (
      <section className="atlas-card-secondary p-5 text-center">
        <Sparkles className="mx-auto h-5 w-5 text-accent" aria-hidden />
        <p className="mt-2 text-[13px] font-semibold text-foreground">
          Nessun segnale urgente
        </p>
        <p className="mt-0.5 text-[12px] text-muted">
          Il portafoglio non richiede azioni prioritarie in questo momento.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Segnali principali">
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <p className="atlas-section-eyebrow">Segnali</p>
          <h2 className="text-[14px] font-semibold text-foreground">
            Cosa conta adesso
          </h2>
        </div>
        <p className="text-[10px] text-muted">Max 3 prioritari</p>
      </div>
      <ul className="grid gap-3 md:grid-cols-3">
        {signals.map((signal) => (
          <li key={signal.id}>
            <Link
              href={signal.href}
              className={cn(
                "group flex h-full flex-col rounded-xl border p-4 transition hover:-translate-y-px hover:shadow-[var(--shadow-card)]",
                severityStyles[signal.severity]
              )}
            >
              <span className="flex items-center gap-2">
                {signal.severity === "low" ? (
                  <Info className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                ) : (
                  <AlertTriangle
                    className="h-4 w-4 shrink-0 text-[var(--warning-text)]"
                    aria-hidden
                  />
                )}
                <span className="text-[12px] font-semibold leading-snug text-foreground">
                  {signal.title}
                </span>
              </span>
              <p className="mt-2 flex-1 text-[11px] leading-relaxed text-muted">
                {signal.insight}
              </p>
              <span className="mt-3 inline-flex items-center gap-0.5 text-[10px] font-medium text-accent">
                Approfondisci
                <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
