import { notFound } from "next/navigation";
import { Download, FileText, PlusCircle } from "lucide-react";
import { DocumentDeleteForm } from "@/components/documents/DocumentDeleteForm";
import { DocumentAnalysisForm } from "@/components/documents/DocumentAnalysisForm";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import { ActionBar, ActionButton } from "@/components/ui/ActionBar";
import { InfoGrid } from "@/components/ui/InfoGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { getCurrentUserDocumentById } from "@/lib/documents";
import { formatDateTime, formatFileSize, formatRelativeTime } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Dettaglio documento" };

function getStatusGuidance(status: string) {
  switch (status) {
    case "analyzed":
      return "Estrazione completata. Apri la polizza collegata o rianalizza se il PDF e cambiato.";
    case "processing":
      return "Analisi in corso. Attendi il completamento prima di ricaricare la pagina.";
    case "failed":
      return "L'analisi non e riuscita. Verifica che il PDF contenga testo leggibile e riprova.";
    default:
      return "Documento pronto. Avvia l'analisi AI per creare una bozza polizza strutturata.";
  }
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const document = await getCurrentUserDocumentById(id);

  if (!document) {
    notFound();
  }

  return (
    <PageShell backHref="/documents" backLabel="Torna ai documenti">
      <PageHeader
        title={document.fileName}
        description={getStatusGuidance(document.status)}
        meta={<DocumentStatusBadge status={document.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <SectionCard title="Informazioni file">
          <InfoGrid
            items={[
              { label: "Nome", value: document.fileName, span: 2 },
              { label: "Dimensione", value: formatFileSize(document.fileSize) },
              { label: "Formato", value: document.mimeType ?? "application/pdf" },
              {
                label: "Caricato",
                value: (
                  <span>
                    {formatRelativeTime(document.createdAt)}
                    <span className="mt-0.5 block text-[11px] font-normal text-slate-400">
                      {formatDateTime(document.createdAt)}
                    </span>
                  </span>
                ),
              },
              {
                label: "Aggiornato",
                value: formatDateTime(document.updatedAt),
              },
            ]}
          />

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <p className="text-[12px] leading-relaxed text-slate-600">
              {getStatusGuidance(document.status)}
            </p>
          </div>
        </SectionCard>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <SectionCard title="Azioni" padding="sm">
            <ActionBar>
              <DocumentAnalysisForm
                documentId={document.id}
                documentStatus={document.status}
              />
              <ActionButton
                href={`/policies/new?documentId=${document.id}`}
                variant="secondary"
              >
                <PlusCircle className="h-4 w-4" />
                Crea polizza manuale
              </ActionButton>
              <a
                href={`/documents/${document.id}/download`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Scarica PDF
              </a>
              <DocumentDeleteForm documentId={document.id} redirectToDocuments />
            </ActionBar>
          </SectionCard>
        </aside>
      </div>

      <CollapsibleSection
        title="Dettagli tecnici storage"
        description="Percorso interno del file"
      >
        <p className="break-all font-mono text-[11px] text-slate-600">
          {document.filePath}
        </p>
      </CollapsibleSection>
    </PageShell>
  );
}
