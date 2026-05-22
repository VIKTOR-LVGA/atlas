import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, PlusCircle } from "lucide-react";
import { DocumentDeleteForm } from "@/components/documents/DocumentDeleteForm";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import { IconDocuments } from "@/components/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { getCurrentUserDocumentById } from "@/lib/documents";
import { formatDateTime, formatFileSize } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Dettaglio documento" };

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const document = await getCurrentUserDocumentById(id);

  if (!document) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <Link href="/documents" className="text-[12px] text-slate-500 hover:text-slate-700">
        Torna ai documenti
      </Link>

      <PageHeader
        title={document.fileName}
        description="PDF assicurativo caricato nell'archivio privato."
        action={<DocumentStatusBadge status={document.status} />}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <SectionCard title="Dettagli file" padding="md">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Nome file</dt>
              <dd className="mt-1 break-words text-[13px] font-medium text-slate-900">
                {document.fileName}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Dimensione</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {formatFileSize(document.fileSize)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Mime type</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {document.mimeType ?? "application/pdf"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Creato il</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {formatDateTime(document.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Stato</dt>
              <dd className="mt-1">
                <DocumentStatusBadge status={document.status} />
              </dd>
            </div>
          </dl>

          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[11px] uppercase text-slate-400">Percorso Storage</p>
            <p className="mt-1 break-all font-mono text-[12px] text-slate-700">
              {document.filePath}
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Azioni" padding="md">
          <div className="space-y-3">
            <Link
              href={`/policies/new?documentId=${document.id}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-blue-700"
            >
              <PlusCircle className="h-4 w-4" />
              Crea polizza
            </Link>
            <a
              href={`/documents/${document.id}/download`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Scarica PDF
            </a>
            <DocumentDeleteForm documentId={document.id} redirectToDocuments />
            <Link
              href="/documents"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <IconDocuments className="h-4 w-4" />
              Documenti
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
