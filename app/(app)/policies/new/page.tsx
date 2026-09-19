import { PolicyCreateWizard } from "@/components/policies/PolicyCreateWizard";
import { PageShell } from "@/components/ui/PageShell";
import { getCurrentUserDocuments } from "@/lib/documents";

interface PageProps {
  searchParams: Promise<{ documentId?: string | string[] }>;
}

export const metadata = { title: "Aggiungi polizza" };

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
      <div className="mx-auto max-w-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          Nuova polizza
        </p>
        <h1 className="mt-2 text-[24px] font-semibold tracking-tight text-foreground">
          Aggiungi un&apos;assicurazione
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Un passo alla volta. Puoi salvare e completare dopo.
        </p>
        <div className="mt-6">
          <PolicyCreateWizard
            documents={documents}
            selectedDocumentId={selectedDocument?.id ?? null}
          />
        </div>
      </div>
    </PageShell>
  );
}
