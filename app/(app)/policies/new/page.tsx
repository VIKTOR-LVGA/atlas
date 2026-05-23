import Link from "next/link";
import { FileText } from "lucide-react";
import { PolicyForm } from "@/components/policies/PolicyForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { getCurrentUserDocuments } from "@/lib/documents";

interface PageProps {
  searchParams: Promise<{ documentId?: string | string[] }>;
}

export const metadata = { title: "Nuova polizza" };

function getDocumentId(documentId: string | string[] | undefined) {
  return Array.isArray(documentId) ? documentId[0] ?? null : documentId ?? null;
}

export default async function NewPolicyPage({ searchParams }: PageProps) {
  const documents = await getCurrentUserDocuments();
  const requestedDocumentId = getDocumentId((await searchParams).documentId);
  const selectedDocument =
    documents.find((document) => document.id === requestedDocumentId) ?? null;

  return (
    <PageShell backHref="/policies" backLabel="Torna alle polizze">
      <PageHeader
        title="Nuova polizza"
        description="Crea una scheda strutturata manuale prima dell'estrazione AI."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <SectionCard title="Dati manuali" padding="md">
          <PolicyForm
            documents={documents}
            selectedDocumentId={selectedDocument?.id ?? null}
          />
        </SectionCard>

        <SectionCard title="PDF sorgente" padding="md">
          {selectedDocument ? (
            <Link
              href={`/documents/${selectedDocument.id}`}
              className="flex items-start gap-3 rounded-xl border border-border bg-accent-soft p-3 hover:bg-accent-soft"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-accent">
                <FileText className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12px] font-semibold text-foreground">
                  {selectedDocument.fileName}
                </span>
                <span className="mt-0.5 block text-[11px] text-muted">
                  Collegato dalla pagina documento
                </span>
              </span>
            </Link>
          ) : (
            <div className="space-y-3">
              <p className="text-[12px] leading-relaxed text-muted">
                Puoi creare la polizza senza PDF o scegliere un documento
                caricato nel form.
              </p>
              <Link
                href="/documents"
                className="inline-flex rounded-lg border border-border bg-card px-3.5 py-2 text-[12px] font-medium text-muted-foreground hover:bg-card-muted"
              >
                Apri documenti
              </Link>
            </div>
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}
