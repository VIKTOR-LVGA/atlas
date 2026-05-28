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

/** Headline shown above the progress bar for each visual step. */
export const ANALYSIS_STEP_HEADLINES = [
  "Documento ricevuto",
  "Estrazione del testo dal PDF…",
  "Analisi di premi, coperture e condizioni…",
  "Identificazione persone assicurate…",
  "Strutturazione della bozza polizza…",
  "Preparazione della revisione…",
] as const;

export const ANALYSIS_FINALIZATION_MESSAGES = [
  "Finalizzazione analisi…",
  "Preparazione della bozza…",
  "Verifica dei dati estratti…",
] as const;

const ANALYSIS_PROGRESS_CAP_PERCENT = 92;

export function getAnalysisProgressPercent(
  activeStepIndex: number,
  awaitingCompletion: boolean
) {
  const stepCount = ANALYSIS_PROCESSING_STEPS.length;
  const clampedActive = Math.min(Math.max(activeStepIndex, 0), stepCount - 1);

  if (awaitingCompletion) {
    return ANALYSIS_PROGRESS_CAP_PERCENT;
  }

  return Math.min(
    ANALYSIS_PROGRESS_CAP_PERCENT,
    ((clampedActive + 1) / stepCount) * ANALYSIS_PROGRESS_CAP_PERCENT
  );
}

type DocumentAnalysisTimelineProps = {
  activeStepIndex: number;
  compact?: boolean;
  className?: string;
  /** When true and on the last step, show finalization copy until the action resolves. */
  awaitingCompletion?: boolean;
  /** Rotating finalization headline while awaiting server completion. */
  finalizationMessage?: string;
};

export function DocumentAnalysisTimeline({
  activeStepIndex,
  compact = false,
  className,
  awaitingCompletion = false,
  finalizationMessage,
}: DocumentAnalysisTimelineProps) {
  const clampedActive = Math.min(
    Math.max(activeStepIndex, 0),
    ANALYSIS_PROCESSING_STEPS.length - 1
  );
  const onFinalStep = clampedActive >= ANALYSIS_PROCESSING_STEPS.length - 1;
  const progressPercent = getAnalysisProgressPercent(
    clampedActive,
    awaitingCompletion && onFinalStep
  );
  const pendingMessage =
    awaitingCompletion && onFinalStep
      ? (finalizationMessage ?? ANALYSIS_FINALIZATION_MESSAGES[0])
      : ANALYSIS_STEP_HEADLINES[clampedActive];

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
        {awaitingCompletion && onFinalStep ? (
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
            width: `${progressPercent}%`,
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
                    <LoaderCircle className="atlas-analysis-step-spinner h-3 w-3 animate-spin text-accent" />
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
