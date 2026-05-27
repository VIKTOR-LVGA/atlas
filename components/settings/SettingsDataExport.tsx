"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileJson } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { cn } from "@/lib/utils";

const EXPORT_JSON_PATH = "/settings/export";
const EXPORT_CSV_PATH = "/settings/export?format=csv";

type ExportState = "idle" | "loading" | "error";

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function getFilenameFromDisposition(header: string | null): string | null {
  if (!header) {
    return null;
  }

  const match = header.match(/filename="([^"]+)"/i);
  return match?.[1] ?? null;
}

async function downloadExport(path: string, fallbackFilename: string) {
  const response = await fetch(path, { credentials: "same-origin" });

  if (!response.ok) {
    let message =
      "Non siamo riusciti a preparare l'esportazione. Riprova tra qualche minuto.";

    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error?.trim()) {
        message = payload.error;
      }
    } catch {
      // Keep default friendly message.
    }

    throw new Error(message);
  }

  const filename =
    getFilenameFromDisposition(response.headers.get("Content-Disposition")) ??
    fallbackFilename;
  const blob = await response.blob();
  triggerBrowserDownload(blob, filename);
}

export function SettingsDataExport() {
  const [state, setState] = useState<ExportState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleExport = async (path: string, fallbackFilename: string) => {
    setState("loading");
    setErrorMessage("");

    try {
      await downloadExport(path, fallbackFilename);
      setState("idle");
    } catch (error) {
      setState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Non siamo riusciti a preparare l'esportazione. Riprova tra qualche minuto."
      );
    }
  };

  const isLoading = state === "loading";
  const generatedLabel = new Intl.DateTimeFormat("it-CH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  return (
    <SectionCard
      title="Esporta dati"
      description="Scarica una copia strutturata dei dati collegati al tuo account Atlas."
      bodyClassName="space-y-4"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-border-subtle bg-card-muted/40 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Incluso
          </p>
          <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-muted-foreground">
            <li>Profilo e preferenze account</li>
            <li>Metadati documenti caricati</li>
            <li>Polizze e dettagli estratti</li>
            <li>Correzioni estrazione salvate</li>
            <li>Riepiloghi raccomandazioni, mercato e consulenza</li>
            <li>Timestamp dove disponibili</li>
          </ul>
        </div>
        <div className="rounded-xl border border-border-subtle bg-card-muted/40 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Non incluso
          </p>
          <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-muted-foreground">
            <li>File PDF originali</li>
            <li>Chiavi API, token o segreti di servizio</li>
            <li>Log interni o variabili d&apos;ambiente</li>
            <li>Dati di altri utenti</li>
          </ul>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-muted">
        Esportazione generata al momento del download ({generatedLabel}). Solo i dati
        del tuo account autenticato sono inclusi nel file.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={isLoading}
          onClick={() =>
            handleExport(EXPORT_JSON_PATH, `atlas-export-${Date.now()}.json`)
          }
          className={cn(
            "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[12px] font-semibold transition sm:w-auto",
            isLoading
              ? "cursor-wait border border-border bg-card-muted/50 text-muted"
              : "bg-accent text-accent-foreground hover:opacity-90"
          )}
        >
          <FileJson className="h-4 w-4" />
          {isLoading ? "Preparazione export…" : "Esporta dati JSON"}
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={() =>
            handleExport(EXPORT_CSV_PATH, `atlas-policies-${Date.now()}.csv`)
          }
          className={cn(
            "atlas-btn-secondary inline-flex min-h-[44px] w-full items-center justify-center gap-2 text-[12px] sm:w-auto",
            isLoading && "cursor-wait opacity-70"
          )}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Esporta polizze CSV
        </button>
      </div>

      {state === "error" && errorMessage ? (
        <p
          role="alert"
          className="rounded-lg border border-[var(--danger-text)]/20 bg-[var(--danger-text)]/5 px-3 py-2 text-[11px] leading-relaxed text-[var(--danger-text)]"
        >
          {errorMessage}
        </p>
      ) : null}

      <p className="flex items-start gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-[11px] leading-relaxed text-muted">
        <Download className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
        Conserva il file in un luogo sicuro. L&apos;export può contenere dati assicurativi
        sensibili: non condividerlo con terzi non autorizzati.
      </p>
    </SectionCard>
  );
}
