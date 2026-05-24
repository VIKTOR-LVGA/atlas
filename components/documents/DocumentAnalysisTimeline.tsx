"use client";

import { Check, Circle, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const ANALYSIS_PROCESSING_STEPS = [
  "Documento ricevuto",
  "Estrazione testo PDF",
  "Analisi AI delle coperture",
  "Identificazione persone assicurate",
  "Strutturazione polizza",
  "Preparazione bozza",
] as const;

export const ANALYSIS_PENDING_MESSAGES = [
  "Atlas sta leggendo la polizza…",
  "Identificazione di premi, coperture e persone assicurate…",
  "Preparazione della bozza da rivedere…",
] as const;

type DocumentAnalysisTimelineProps = {
  activeStepIndex: number;
  compact?: boolean;
  className?: string;
};

function getPendingMessage(activeStepIndex: number) {
  if (activeStepIndex <= 1) {
    return ANALYSIS_PENDING_MESSAGES[0];
  }
  if (activeStepIndex <= 4) {
    return ANALYSIS_PENDING_MESSAGES[1];
  }
  return ANALYSIS_PENDING_MESSAGES[2];
}

export function DocumentAnalysisTimeline({
  activeStepIndex,
  compact = false,
  className,
}: DocumentAnalysisTimelineProps) {
  const clampedActive = Math.min(
    Math.max(activeStepIndex, 0),
    ANALYSIS_PROCESSING_STEPS.length - 1
  );
  const pendingMessage = getPendingMessage(clampedActive);
  const onFinalStep = clampedActive >= ANALYSIS_PROCESSING_STEPS.length - 1;

  return (
    <div
      className={cn(
        "atlas-analysis-timeline min-w-0",
        compact ? "space-y-3" : "space-y-4",
        className
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
          Analisi AI in corso
        </p>
        <p className="text-[13px] font-medium text-foreground">{pendingMessage}</p>
        {onFinalStep ? (
          <p className="text-[11px] text-muted">
            Apertura della bozza polizza al completamento…
          </p>
        ) : null}
      </div>

      <div
        className="h-1 overflow-hidden rounded-full bg-accent-soft"
        role="progressbar"
        aria-label="Avanzamento analisi"
        aria-valuetext={ANALYSIS_PROCESSING_STEPS[clampedActive]}
      >
        <span
          className="atlas-analysis-progress block h-full rounded-full bg-accent"
          style={{
            width: `${((clampedActive + 1) / ANALYSIS_PROCESSING_STEPS.length) * 100}%`,
          }}
        />
      </div>

      <ol
        className={cn(
          "grid min-w-0 gap-2",
          compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
        )}
      >
        {ANALYSIS_PROCESSING_STEPS.map((label, index) => {
          const done = index < clampedActive;
          const active = index === clampedActive;

          return (
            <li
              key={label}
              className={cn(
                "flex min-w-0 items-start gap-2 rounded-lg border px-2.5 py-2 transition-colors",
                done &&
                  "border-emerald-500/20 bg-emerald-500/[0.06] dark:border-emerald-900/40 dark:bg-emerald-950/20",
                active &&
                  "border-accent/30 bg-accent-soft/50 shadow-sm ring-1 ring-accent/10",
                !done && !active && "border-border-subtle bg-card-muted/30 opacity-70"
              )}
            >
              <span className="mt-0.5 shrink-0">
                {done ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : active ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-accent bg-card">
                    <LoaderCircle className="h-3 w-3 animate-spin text-accent" />
                  </span>
                ) : (
                  <Circle className="h-5 w-5 text-border" strokeWidth={1.5} />
                )}
              </span>
              <span
                className={cn(
                  "min-w-0 text-[11px] leading-snug",
                  active ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
