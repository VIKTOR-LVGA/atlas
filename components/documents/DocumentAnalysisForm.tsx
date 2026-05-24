"use client";

import { useActionState, useRef, useSyncExternalStore } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, WandSparkles } from "lucide-react";
import {
  analyzeDocumentAction,
  type AnalyzeDocumentActionState,
} from "@/app/(app)/documents/actions";
import {
  ANALYSIS_PROCESSING_STEPS,
  DocumentAnalysisTimeline,
} from "@/components/documents/DocumentAnalysisTimeline";
import type { DocumentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const initialState: AnalyzeDocumentActionState = {
  status: "idle",
  message: "",
};

const STEP_INTERVAL_MS = 2200;

type DocumentAnalysisFormVariant = "button" | "icon" | "menu";

interface DocumentAnalysisFormProps {
  documentId: string;
  documentStatus: DocumentStatus;
  variant?: DocumentAnalysisFormVariant;
}

function getStepSnapshot(busy: boolean, tick: number) {
  if (!busy) {
    return 0;
  }
  return Math.min(tick, ANALYSIS_PROCESSING_STEPS.length - 1);
}

function getServerStepSnapshot() {
  return 0;
}

function useAnalysisVisualStep(busy: boolean) {
  const tickRef = useRef(0);

  return useSyncExternalStore(
    (onStoreChange) => {
      if (!busy) {
        tickRef.current = 0;
        return () => {};
      }

      tickRef.current = 0;
      const intervalId = window.setInterval(() => {
        tickRef.current += 1;
        onStoreChange();
      }, STEP_INTERVAL_MS);

      return () => window.clearInterval(intervalId);
    },
    () => getStepSnapshot(busy, tickRef.current),
    getServerStepSnapshot
  );
}

function getAnalysisLabel(status: DocumentStatus, pending: boolean) {
  if (pending || status === "processing") {
    return "Analisi in corso…";
  }

  if (status === "analyzed") {
    return "Documento analizzato";
  }

  if (status === "failed") {
    return "Riprova analisi";
  }

  return "Analizza documento";
}

function AnalysisIcon({
  analyzed,
  busy,
  variant,
}: {
  analyzed: boolean;
  busy: boolean;
  variant: DocumentAnalysisFormVariant;
}) {
  const className = variant === "icon" ? "h-4 w-4" : "h-3.5 w-3.5";

  if (busy) {
    return <LoaderCircle className={cn(className, "animate-spin")} />;
  }

  if (analyzed) {
    return <CheckCircle2 className={className} />;
  }

  return <WandSparkles className={className} />;
}

function AnalysisProcessingOverlay({
  activeStepIndex,
  compact,
}: {
  activeStepIndex: number;
  compact: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-background/75 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Analisi documento in corso"
    >
      <div className="atlas-surface-card w-full max-w-md rounded-2xl border border-border p-4 shadow-xl sm:p-5">
        <DocumentAnalysisTimeline
          activeStepIndex={activeStepIndex}
          compact={compact}
        />
      </div>
    </div>
  );
}

export function DocumentAnalysisForm({
  documentId,
  documentStatus,
  variant = "button",
}: DocumentAnalysisFormProps) {
  const [state, formAction, pending] = useActionState(
    analyzeDocumentAction.bind(null, documentId),
    initialState
  );
  const unavailable =
    pending ||
    documentStatus === "processing" ||
    documentStatus === "analyzed";
  const busy = pending || documentStatus === "processing";
  const label = getAnalysisLabel(documentStatus, pending);
  const visualStep = useAnalysisVisualStep(busy);
  const showInlineTimeline = busy && variant === "button";
  const showOverlayTimeline = busy && variant !== "button";

  return (
    <>
      <form
        action={formAction}
        className={cn(variant === "icon" ? "inline-flex" : "min-w-0 space-y-3")}
        onClick={(event) => event.stopPropagation()}
        aria-busy={busy}
      >
        <button
          type="submit"
          disabled={unavailable}
          title={label}
          aria-label={variant === "icon" ? label : undefined}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 font-medium transition disabled:cursor-not-allowed disabled:opacity-65",
            variant === "button" &&
              "atlas-btn-primary min-h-[44px] w-full px-4 py-2.5 text-[13px] shadow-sm",
            variant === "icon" &&
              "h-8 w-8 rounded-lg border border-border bg-accent-soft text-accent shadow-sm hover:-translate-y-px hover:border-accent/40 hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            variant === "menu" &&
              "min-h-[44px] w-full justify-start rounded-lg px-2.5 py-2 text-[12px] text-accent hover:bg-accent-soft"
          )}
        >
          <AnalysisIcon
            analyzed={documentStatus === "analyzed"}
            busy={busy}
            variant={variant}
          />
          {variant === "icon" ? <span className="sr-only">{label}</span> : label}
        </button>

        {showInlineTimeline ? (
          <div className="atlas-surface-card rounded-xl border border-border-subtle p-4">
            <DocumentAnalysisTimeline activeStepIndex={visualStep} />
          </div>
        ) : null}

        {!busy &&
          variant !== "icon" &&
          documentStatus === "failed" &&
          state.status !== "error" && (
            <p className="text-[11px] leading-relaxed text-muted">
              Ultima analisi non riuscita. Riprova o crea la polizza manualmente.
            </p>
          )}

        {state.status === "error" && (
          <div
            role="alert"
            aria-live="polite"
            className="atlas-message-enter flex gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3.5 py-3 dark:border-amber-400/20 dark:bg-amber-950/25"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-foreground">
                Analisi non riuscita
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                {state.message}
              </p>
            </div>
          </div>
        )}
      </form>

      {showOverlayTimeline ? (
        <AnalysisProcessingOverlay
          activeStepIndex={visualStep}
          compact={variant === "menu"}
        />
      ) : null}
    </>
  );
}
