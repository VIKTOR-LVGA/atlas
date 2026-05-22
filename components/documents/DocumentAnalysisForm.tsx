"use client";

import { useActionState } from "react";
import { CheckCircle2, LoaderCircle, WandSparkles } from "lucide-react";
import {
  analyzeDocumentAction,
  type AnalyzeDocumentActionState,
} from "@/app/(app)/documents/actions";
import type { DocumentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const initialState: AnalyzeDocumentActionState = {
  status: "idle",
  message: "",
};

type DocumentAnalysisFormVariant = "button" | "icon" | "menu";

interface DocumentAnalysisFormProps {
  documentId: string;
  documentStatus: DocumentStatus;
  variant?: DocumentAnalysisFormVariant;
}

function getAnalysisLabel(status: DocumentStatus, pending: boolean) {
  if (pending || status === "processing") {
    return "Analisi in corso...";
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

  return (
    <form
      action={formAction}
      className={cn(variant === "icon" ? "inline-flex" : "space-y-2")}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="submit"
        disabled={unavailable}
        title={label}
        aria-label={variant === "icon" ? label : undefined}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 font-medium transition disabled:cursor-not-allowed disabled:opacity-65",
          variant === "button" &&
            "w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-[13px] text-white shadow-sm hover:bg-indigo-700",
          variant === "icon" &&
            "h-8 w-8 rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-700 shadow-sm hover:-translate-y-px hover:border-indigo-200 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200",
          variant === "menu" &&
            "w-full justify-start rounded-lg px-2.5 py-2 text-[12px] text-indigo-700 hover:bg-indigo-50"
        )}
      >
        <AnalysisIcon
          analyzed={documentStatus === "analyzed"}
          busy={busy}
          variant={variant}
        />
        {variant === "icon" ? <span className="sr-only">{label}</span> : label}
      </button>
      {variant !== "icon" && busy && (
        <p className="animate-pulse text-[11px] text-indigo-600">
          Atlas prepara una bozza strutturata da rivedere.
        </p>
      )}
      {variant !== "icon" && state.status === "error" && (
        <p aria-live="polite" className="text-[11px] text-red-600">
          {state.message}
        </p>
      )}
    </form>
  );
}
