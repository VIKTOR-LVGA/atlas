import {
  documentWorkflowSteps,
  getDocumentWorkflowProgress,
  getWorkflowStageLabel,
  type DocumentWorkflowStage,
} from "@/lib/document-intelligence";
import { cn } from "@/lib/utils";

type DocumentWorkflowStripProps = {
  stage: DocumentWorkflowStage;
  compact?: boolean;
};

export function DocumentWorkflowStrip({
  stage,
  compact = false,
}: DocumentWorkflowStripProps) {
  const progress = getDocumentWorkflowProgress(stage);
  const activeIndex =
    stage === "failed" || stage === "processing"
      ? stage === "processing"
        ? 0
        : -1
      : documentWorkflowSteps.findIndex((step) => {
          if (stage === "uploaded") {
            return step.stage === "uploaded";
          }
          if (stage === "analyzed") {
            return step.stage === "analyzed";
          }
          if (stage === "draft_created") {
            return step.stage === "draft_created";
          }
          if (stage === "review_required") {
            return step.stage === "review_required";
          }
          if (stage === "confirmed") {
            return step.stage === "confirmed";
          }
          return false;
        });

  if (stage === "failed") {
    return (
      <div
        className={cn(
          "rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)]/40 px-2.5 py-2",
          compact ? "text-[10px]" : "text-[11px]"
        )}
      >
        <p className="font-medium text-[var(--danger-text)]">
          {getWorkflowStageLabel(stage)}
        </p>
        <p className="mt-0.5 text-muted">Riprova l&apos;analisi dal dettaglio documento.</p>
      </div>
    );
  }

  return (
    <div className={cn("min-w-0 max-w-full space-y-2", compact && "space-y-1.5")}>
      <div className="flex items-center justify-between gap-2 text-[10px]">
        <span className="font-medium uppercase tracking-wide text-muted">Workflow</span>
        <span className="font-medium text-foreground">{getWorkflowStageLabel(stage)}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-card-muted">
        <div
          className="atlas-bar-grow h-full rounded-full bg-accent/80"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <ol
        className={cn(
          "flex max-w-full flex-wrap gap-1",
          compact ? "gap-0.5" : "gap-1"
        )}
        aria-label="Stato workflow documento"
      >
        {documentWorkflowSteps.map((step, index) => {
          const isActive = index === activeIndex;
          const isPast = activeIndex >= 0 && index < activeIndex;

          return (
            <li
              key={step.stage}
              className={cn(
                "max-w-full rounded-full border px-2 py-0.5 text-[9px] font-medium leading-snug sm:text-[10px]",
                isActive &&
                  "border-accent/30 bg-accent-soft text-accent",
                isPast &&
                  !isActive &&
                  "border-emerald-500/20 bg-emerald-500/[0.06] text-[var(--success-text)] dark:border-emerald-900/30",
                !isActive &&
                  !isPast &&
                  "border-border-subtle bg-card-muted/50 text-muted"
              )}
            >
              {step.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
