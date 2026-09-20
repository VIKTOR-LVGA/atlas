"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { reportAtlasError } from "@/lib/observability";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportAtlasError({
      code: "consumer_render_error",
      route: typeof window !== "undefined" ? window.location.pathname : undefined,
      digest: error.digest,
      role: "consumer",
    });
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--danger-bg)] text-[var(--danger-text)]">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-[18px] font-semibold tracking-tight text-foreground">
        Qualcosa non ha funzionato
      </h1>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted">
        Non siamo riusciti a caricare questa sezione. I tuoi dati non sono stati
        modificati — riprova o torna alla dashboard.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => reset()}
          className="atlas-btn-primary inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px]"
        >
          <RefreshCw className="h-4 w-4" />
          Riprova
        </button>
        <Link
          href="/dashboard"
          className="atlas-btn-secondary inline-flex items-center justify-center px-4 py-2.5 text-[13px]"
        >
          Torna alla dashboard
        </Link>
      </div>
    </div>
  );
}
