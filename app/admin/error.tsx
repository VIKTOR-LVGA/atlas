"use client";

import { useEffect } from "react";
import { reportAtlasError } from "@/lib/observability";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isInputError = error.name === "OperationsInputError";

  useEffect(() => {
    if (isInputError) return;
    reportAtlasError({
      code: "admin_render_error",
      route: typeof window !== "undefined" ? window.location.pathname : undefined,
      digest: error.digest,
      role: "admin",
    });
  }, [error, isInputError]);

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-border bg-card px-5 py-6">
      <h1 className="text-[16px] font-semibold text-foreground">
        {isInputError ? "Operazione non completata" : "Area admin non disponibile"}
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        {isInputError
          ? error.message
          : "Non è stato possibile caricare i dati operativi. Nessuna modifica è stata salvata."}
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="atlas-btn-primary min-h-11 px-4 text-[13px]"
        >
          Riprova
        </button>
        <a
          href="/admin"
          className="atlas-btn-secondary flex min-h-11 items-center justify-center px-4 text-[13px]"
        >
          Torna al control plane
        </a>
      </div>
    </div>
  );
}
