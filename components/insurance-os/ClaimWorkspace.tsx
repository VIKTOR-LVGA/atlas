"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  claimFileUrlAction,
  closeClaimAction,
  markSubmittedExternallyAction,
  updateChecklistAction,
  uploadClaimFileAction,
} from "@/app/(app)/claims/actions";
import { claimCategoryLabel } from "@/lib/insurance-os/claims-client";
import type { ClaimFileView, InsuranceClaimView } from "@/lib/insurance-os/claims-view";
import { cn, formatDate, formatDateTime, formatFileSize } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  draft: "In preparazione",
  ready: "Pronto da inviare",
  submitted_externally: "Inviato da te alla compagnia",
  in_progress: "In lavorazione",
  closed: "Chiuso",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "atlas-surface-muted text-muted",
  ready: "atlas-alert-success",
  submitted_externally: "atlas-alert-info",
  in_progress: "atlas-alert-info",
  closed: "atlas-surface-muted text-muted",
};

const FILE_KINDS = [
  { id: "photo", label: "Foto" },
  { id: "invoice", label: "Fattura o preventivo" },
  { id: "police_report", label: "Denuncia o constatazione" },
  { id: "damage_report", label: "Rapporto danni" },
  { id: "correspondence", label: "Corrispondenza" },
  { id: "other", label: "Altro" },
];

function fileKindLabel(kind: string) {
  return FILE_KINDS.find((item) => item.id === kind)?.label ?? kind;
}

export function ClaimWorkspace({
  claim: initialClaim,
  files: initialFiles,
  relatedPolicies,
  dossierText,
}: {
  claim: InsuranceClaimView;
  files: ClaimFileView[];
  relatedPolicies: Array<{ id: string; label: string }>;
  dossierText: string;
}) {
  const router = useRouter();
  const [claim, setClaim] = useState(initialClaim);
  const [files, setFiles] = useState(initialFiles);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const closed = claim.status === "closed";
  const requiredItems = claim.checklist.filter((item) => item.required);
  const requiredDone = requiredItems.filter((item) => item.done).length;

  const toggleChecklistItem = (id: string, done: boolean) => {
    const next = claim.checklist.map((item) =>
      item.id === id ? { ...item, done } : item
    );
    setError(null);
    startTransition(async () => {
      const result = await updateChecklistAction(claim.id, next);
      if (result.ok && result.data) {
        setClaim(result.data);
      } else {
        setError(result.error ?? "Aggiornamento non riuscito.");
      }
    });
  };

  const downloadDossier = () => {
    const blob = new Blob([dossierText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `atlas-dossier-${claim.id.slice(0, 8)}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("space-y-4 transition-opacity duration-200", pending && "opacity-80")}>
      <header className="atlas-consumer-card px-4 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="atlas-section-eyebrow">{claimCategoryLabel(claim.category)}</p>
            <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">
              {claim.title}
            </h1>
            <p className="mt-1 text-[12px] text-muted">
              Creato il {formatDateTime(claim.createdAt)}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium",
              STATUS_STYLES[claim.status] ?? "atlas-surface-muted text-muted"
            )}
          >
            {STATUS_LABELS[claim.status] ?? claim.status}
          </span>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="atlas-section-eyebrow">Data evento</dt>
            <dd className="mt-1 text-[13px] text-foreground">
              {claim.eventDate ? formatDate(claim.eventDate) : "Non indicata"}
            </dd>
          </div>
          <div>
            <dt className="atlas-section-eyebrow">Luogo</dt>
            <dd className="mt-1 text-[13px] text-foreground">
              {claim.eventLocation ?? "Non indicato"}
            </dd>
          </div>
          <div>
            <dt className="atlas-section-eyebrow">Importo stimato</dt>
            <dd className="mt-1 text-[13px] text-foreground">
              {claim.estimatedAmount != null
                ? `${claim.currency} ${claim.estimatedAmount.toLocaleString("it-CH")}`
                : "Non indicato"}
            </dd>
          </div>
        </dl>

        {claim.description ? (
          <p className="mt-4 whitespace-pre-line border-t border-border-subtle pt-4 text-[13px] leading-relaxed text-muted-foreground">
            {claim.description}
          </p>
        ) : null}
      </header>

      {error ? (
        <p role="status" className="atlas-alert-danger rounded-xl px-4 py-3 text-[13px]">
          {error}
        </p>
      ) : null}

      <section className="atlas-consumer-card px-4 py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
            Cosa serve per la pratica
          </h2>
          {requiredItems.length > 0 ? (
            <span className="text-[12px] text-muted">
              {requiredDone} di {requiredItems.length} obbligatori
            </span>
          ) : null}
        </div>
        <ul className="mt-3 space-y-1">
          {claim.checklist.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                disabled={pending || closed}
                aria-pressed={item.done}
                onClick={() => toggleChecklistItem(item.id, !item.done)}
                className="atlas-consumer-focus flex w-full min-h-11 items-center gap-3 rounded-lg px-2 text-left transition hover:bg-card-muted disabled:opacity-60"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold transition-colors duration-200",
                    item.done
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-card text-transparent"
                  )}
                >
                  ✓
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 text-[13px]",
                    item.done ? "text-muted line-through" : "text-foreground"
                  )}
                >
                  {item.label}
                </span>
                {item.required ? (
                  <span className="shrink-0 text-[10px] uppercase tracking-[0.08em] text-muted">
                    Obbligatorio
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="atlas-consumer-card px-4 py-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          Allegati privati
        </h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          Restano nel tuo spazio. ATLAS non li invia a nessuno.
        </p>

        {files.length > 0 ? (
          <ul className="mt-3 divide-y divide-border-subtle">
            {files.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {file.fileName}
                  </p>
                  <p className="text-[11px] text-muted">
                    {fileKindLabel(file.kind)} · {formatFileSize(file.fileSize)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const result = await claimFileUrlAction(file.filePath);
                      if (result.ok && result.data) {
                        window.open(result.data.url, "_blank", "noopener,noreferrer");
                      } else {
                        setError(result.error ?? "Allegato non disponibile.");
                      }
                    });
                  }}
                  className="shrink-0 text-[12px] font-medium text-accent disabled:opacity-50"
                >
                  Apri
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {!closed ? (
          <form
            className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const formData = new FormData(form);
              formData.set("claimId", claim.id);
              setError(null);
              startTransition(async () => {
                const result = await uploadClaimFileAction(formData);
                if (result.ok && result.data) {
                  const uploaded = result.data;
                  setFiles((prev) => [uploaded, ...prev]);
                  form.reset();
                  router.refresh();
                } else {
                  setError(result.error ?? "Caricamento non riuscito.");
                }
              });
            }}
          >
            <input
              type="file"
              name="file"
              required
              aria-label="File da allegare"
              className="atlas-input py-2 text-[12px] file:mr-3 file:rounded-md file:border-0 file:bg-card-muted file:px-3 file:py-1.5 file:text-[12px] file:text-foreground"
            />
            <select
              name="kind"
              defaultValue="photo"
              aria-label="Tipo di allegato"
              className="atlas-input text-[13px]"
            >
              {FILE_KINDS.map((kind) => (
                <option key={kind.id} value={kind.id}>
                  {kind.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={pending}
              className="atlas-btn-secondary min-h-11 px-4 text-[13px]"
            >
              Allega
            </button>
          </form>
        ) : null}
      </section>

      <section className="atlas-consumer-card px-4 py-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          Polizze potenzialmente correlate
        </h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          Selezionate in base al tipo di evento. Non è una conferma di copertura.
        </p>
        {relatedPolicies.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted">
            Nessuna polizza collegata chiaramente a questo evento.
          </p>
        ) : (
          <ul className="mt-3 space-y-1">
            {relatedPolicies.map((policy) => (
              <li key={policy.id}>
                <Link
                  href={`/policies/${policy.id}`}
                  className="block truncate rounded-lg px-2 py-2 text-[13px] font-medium text-foreground transition hover:bg-card-muted"
                >
                  {policy.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="atlas-consumer-card px-4 py-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          Esporta e chiudi
        </h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          Scarica il dossier e allegalo alla tua denuncia. L’invio alla compagnia lo fai tu.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadDossier}
            className="atlas-btn-primary min-h-11 px-4 text-[13px]"
          >
            Scarica il dossier
          </button>
          {claim.status !== "submitted_externally" && !closed ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await markSubmittedExternallyAction(claim.id);
                  if (result.ok && result.data) {
                    setClaim(result.data);
                  } else {
                    setError(result.error ?? "Operazione non riuscita.");
                  }
                });
              }}
              className="atlas-btn-secondary min-h-11 px-4 text-[13px]"
            >
              L’ho inviato alla compagnia
            </button>
          ) : null}
          {!closed ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await closeClaimAction(claim.id);
                  if (result.ok) {
                    router.push("/activity?tab=claims");
                  } else {
                    setError(result.error ?? "Operazione non riuscita.");
                  }
                });
              }}
              className="atlas-btn-secondary min-h-11 px-4 text-[13px]"
            >
              Chiudi il dossier
            </button>
          ) : null}
        </div>
        {closed && claim.closedAt ? (
          <p className="mt-3 text-[12px] text-muted">
            Chiuso il {formatDateTime(claim.closedAt)}.
          </p>
        ) : null}
      </section>
    </div>
  );
}
