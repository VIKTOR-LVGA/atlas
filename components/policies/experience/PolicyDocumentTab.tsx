import Link from "next/link";
import type { UserPolicy } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { insuranceDocumentTypeLabels } from "@/lib/insurance-knowledge";
import { DocumentAnalysisFeedback } from "@/components/documents/DocumentAnalysisFeedback";

export function PolicyDocumentTab({ policy }: { policy: UserPolicy }) {
  const doc = policy.document;

  if (!doc && !policy.documentId) {
    return (
      <div className="rounded-2xl border border-border bg-card px-4 py-6 text-[13px] text-muted">
        Nessun documento collegato.{" "}
        <Link href="/documents" className="font-medium text-accent hover:underline">
          Vai ai documenti
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card px-4 py-4 sm:px-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Documento sorgente
        </h2>
        <dl className="mt-3 space-y-2 text-[13px]">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">File</dt>
            <dd className="max-w-[65%] truncate text-right font-medium">
              {doc?.fileName ?? "PDF collegato"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Compagnia rilevata</dt>
            <dd className="font-medium">{policy.provider || "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Aggiornata</dt>
            <dd className="font-medium">{formatDateTime(policy.updatedAt)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Origine</dt>
            <dd className="font-medium">
              {policy.source === "ai_draft" ? "Estrazione AI" : "Manuale / confermata"}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          {policy.documentId ? (
            <>
              <Link
                href={`/documents/${policy.documentId}`}
                className="atlas-btn-secondary min-h-10 px-3 text-[12px]"
              >
                Apri PDF
              </Link>
              <Link
                href={`/documents/${policy.documentId}/download`}
                className="atlas-btn-secondary min-h-10 px-3 text-[12px]"
              >
                Scarica
              </Link>
            </>
          ) : null}
        </div>
      </section>

      {policy.documentId ? (
        <DocumentAnalysisFeedback documentId={policy.documentId} />
      ) : null}

      <p className="text-[11px] text-muted">
        Tipi documento riconosciuti:{" "}
        {Object.values(insuranceDocumentTypeLabels).slice(0, 4).join(", ")}…
      </p>
    </div>
  );
}
