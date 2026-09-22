"use client";

import { useState, useTransition } from "react";
import { MessageSquareWarning } from "lucide-react";
import { submitDocumentAnalysisFeedbackAction } from "@/app/(app)/documents/actions";
import { cn } from "@/lib/utils";

const REASONS = [
  { id: "classification_wrong", label: "Classificazione errata" },
  { id: "premium_wrong", label: "Premio errato" },
  { id: "coverage_wrong", label: "Coperture errate" },
  { id: "date_wrong", label: "Date errate" },
  { id: "other", label: "Altro" },
] as const;

type DocumentAnalysisFeedbackProps = {
  documentId: string;
  className?: string;
};

/**
 * Lightweight feedback capture. Never uploads raw PDFs to the corpus.
 */
export function DocumentAnalysisFeedback({
  documentId,
  className,
}: DocumentAnalysisFeedbackProps) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(reason: (typeof REASONS)[number]["id"]) {
    startTransition(async () => {
      await submitDocumentAnalysisFeedbackAction({ documentId, reason });
      setSent(true);
      setOpen(false);
    });
  }

  if (sent) {
    return (
      <p className={cn("text-[11px] text-muted", className)}>
        Grazie. Il feedback aiuta a migliorare ATLAS (senza archiviare il PDF nel corpus).
      </p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-accent hover:underline"
      >
        <MessageSquareWarning className="h-3.5 w-3.5" aria-hidden />
        Dato errato / segnala classificazione
      </button>
      {open ? (
        <div className="flex flex-wrap gap-1.5">
          {REASONS.map((reason) => (
            <button
              key={reason.id}
              type="button"
              disabled={pending}
              onClick={() => submit(reason.id)}
              className="rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] text-foreground hover:border-accent/40 disabled:opacity-60"
            >
              {reason.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
