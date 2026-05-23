"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import {
  deleteDocumentAction,
  type DeleteDocumentActionState,
} from "@/app/(app)/documents/actions";
import { cn } from "@/lib/utils";

const initialState: DeleteDocumentActionState = {
  status: "idle",
  message: "",
};

interface DocumentDeleteFormProps {
  documentId: string;
  redirectToDocuments?: boolean;
  variant?: "button" | "icon" | "menu";
}

export function DocumentDeleteForm({
  documentId,
  redirectToDocuments = false,
  variant = "button",
}: DocumentDeleteFormProps) {
  const [state, formAction, pending] = useActionState(
    deleteDocumentAction.bind(
      null,
      documentId,
      redirectToDocuments ? "/documents" : null
    ),
    initialState
  );

  return (
    <form
      action={formAction}
      className={cn(variant === "icon" ? "inline-flex" : "space-y-2")}
      onClick={(event) => event.stopPropagation()}
      onSubmit={(event) => {
        event.stopPropagation();

        if (!window.confirm("Eliminare questo PDF? L'azione non puo essere annullata.")) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        disabled={pending}
        title="Elimina documento"
        className={cn(
          "inline-flex items-center justify-center gap-1.5 font-medium text-red-600 transition disabled:cursor-wait disabled:opacity-60",
          variant === "icon" &&
            "h-8 w-8 rounded-lg border border-border bg-card shadow-sm hover:-translate-y-px hover:bg-[var(--danger-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger-border)]",
          variant === "button" &&
            "rounded-lg border border-[var(--danger-border)] bg-card px-3.5 py-2 text-[12px] hover:bg-[var(--danger-bg)]",
          variant === "menu" &&
            "w-full justify-start rounded-lg px-2.5 py-2 text-[12px] hover:bg-[var(--danger-bg)]"
        )}
      >
        <Trash2 className={variant === "icon" ? "h-4 w-4" : "h-3.5 w-3.5"} />
        {variant === "icon" ? <span className="sr-only">Elimina</span> : "Elimina"}
      </button>
      {variant !== "icon" && state.status === "error" && (
        <p aria-live="polite" className="text-[11px] text-red-600">
          {state.message}
        </p>
      )}
    </form>
  );
}
