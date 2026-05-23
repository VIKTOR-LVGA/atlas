import Link from "next/link";
import { Shield } from "lucide-react";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import {
  IconDocuments,
  IconFolder,
  IconUpload,
} from "@/components/icons";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { getCurrentUserDocuments } from "@/lib/documents";
import { formatDate, formatFileSize } from "@/lib/utils";

export const metadata = { title: "Documenti" };

export default async function DocumentsPage() {
  const documents = await getCurrentUserDocuments();
  const recent = documents.slice(0, 4);
  const uploadedCount = documents.filter((doc) => doc.status === "uploaded").length;
  const analyzedCount = documents.filter((doc) => doc.status === "analyzed").length;
  const failedCount = documents.filter((doc) => doc.status === "failed").length;

  return (
    <PageShell>
      <PageHeader
        title="Documenti"
        description="Carica PDF assicurativi, analizzali con AI e collega le polizze estratte."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Archivio"
          value={String(documents.length)}
          subtext="PDF totali"
          variant="blue"
          icon={<IconFolder className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label="Da analizzare"
          value={String(uploadedCount)}
          subtext="Pronti"
          variant="yellow"
          icon={<IconUpload className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label="Analizzati"
          value={String(analyzedCount)}
          subtext="Estrazione completata"
          variant="green"
          icon={<IconDocuments className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label="Errori"
          value={String(failedCount)}
          subtext={failedCount > 0 ? "Riprova analisi" : "Nessun errore"}
          variant={failedCount > 0 ? "red" : "indigo"}
          icon={<IconDocuments className="h-[18px] w-[18px]" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="I tuoi documenti"
            description="Clicca una riga per aprire dettagli, analisi e download."
            padding="none"
          >
            <DocumentList documents={documents} />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Carica PDF" padding="md">
            <DocumentUploadForm />
          </SectionCard>

          {recent.length > 0 ? (
            <SectionCard title="Recenti" padding="sm">
              <ul className="divide-y divide-slate-50">
                {recent.map((doc) => (
                  <li key={doc.id}>
                    <Link
                      href={`/documents/${doc.id}`}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-0"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] font-medium text-slate-800">
                          {doc.fileName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(doc.createdAt)} · {formatFileSize(doc.fileSize)}
                        </span>
                      </span>
                      <DocumentStatusBadge status={doc.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-[13px] font-semibold text-slate-900">
              Archivio privato e sicuro
            </p>
            <p className="text-[12px] text-slate-500">
              I PDF restano nel tuo account Supabase, accessibili solo a te.
            </p>
          </div>
        </div>
        <Link
          href="/settings"
          className="shrink-0 rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
        >
          Impostazioni account
        </Link>
      </div>
    </PageShell>
  );
}
