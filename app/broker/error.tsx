"use client";

import { useEffect } from "react";
import { reportAtlasError } from "@/lib/observability";

export default function BrokerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isAccessError = error.name === "OperationsAccessError";

  useEffect(() => {
    reportAtlasError({
      code: isAccessError ? "broker_access_denied" : "broker_render_error",
      route: typeof window !== "undefined" ? window.location.pathname : undefined,
      digest: error.digest,
      role: "broker",
    });
  }, [error, isAccessError]);

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-border bg-card px-5 py-6">
      <h1 className="text-[16px] font-semibold text-foreground">
        {isAccessError ? "Accesso broker non attivo" : "Workspace non disponibile"}
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        {isAccessError
          ? "Il tuo profilo broker non risulta attivo. Contatta il referente ATLAS che ti ha invitato."
          : "Non è stato possibile caricare la pipeline. Nessuna modifica è stata salvata."}
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
          href="/broker"
          className="atlas-btn-secondary flex min-h-11 items-center justify-center px-4 text-[13px]"
        >
          Torna alla dashboard
        </a>
      </div>
    </div>
  );
}
