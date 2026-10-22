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
        title="Aggiungi una polizza"
        description="Carica un PDF, lascia che INSURA estragga i dati e confermali prima di salvarli."
      />

      <p className="text-[12px] leading-5 text-muted">Carica il PDF, poi aprilo per analizzare e confermare i dati.</p>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="order-2 lg:order-2 lg:col-span-2">
          <SectionCard
            title="Documenti caricati"
            description="Se hai già caricato un PDF, aprilo per continuare l’analisi e la verifica."
            padding="none"
          >
            <DocumentList documents={documents} />
          </SectionCard>
        </div>

        <div className="order-1 space-y-4 lg:order-1">
          <SectionCard title="Carica il tuo PDF" padding="md">
            <DocumentUploadForm />
          </SectionCard>

          {recent.length > 0 ? (
            <SectionCard title="Recenti" padding="sm">
              <ul className="divide-y divide-border-subtle">
                {recent.map((doc) => (
                  <li key={doc.id}>
                    <Link
                      href={`/documents/${doc.id}`}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-0"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] font-medium text-foreground">
                          {doc.fileName}
                        </span>
                        <span className="text-[10px] text-muted">
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

      <details className="rounded-[20px] border border-[#e5eaf3] bg-white p-4"><summary className="cursor-pointer text-[13px] font-bold text-[#101e3c]">Statistiche documenti</summary><div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
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
      </div></details>
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="text-[13px] font-semibold text-foreground">
              Archivio privato e sicuro
            </p>
            <p className="text-[12px] text-muted">
              I PDF restano nel tuo account Supabase, accessibili solo a te.
            </p>
          </div>
        </div>
        <Link
          href="/settings"
          className="shrink-0 rounded-lg border border-border px-4 py-2 text-[12px] font-medium text-muted-foreground hover:bg-card-muted"
        >
          Impostazioni account
        </Link>
      </div>
    </PageShell>
  );
}
