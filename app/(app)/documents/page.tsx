import { EmptyState } from "@/components/consumer/EmptyState";
import { DocumentWalletList } from "@/components/documents/DocumentWalletList";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import { getCurrentUserDocuments } from "@/lib/documents";
import { getPoliciesByDocumentId } from "@/lib/document-wallet";
import { getCurrentUserPolicies } from "@/lib/policies";

export const metadata = { title: "I tuoi documenti" };

export default async function DocumentsPage() {
  const [documents, policies] = await Promise.all([
    getCurrentUserDocuments(),
    getCurrentUserPolicies(),
  ]);
  const policiesByDocumentId = getPoliciesByDocumentId(policies);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
          Wallet documenti
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Carica le tue polizze PDF. Puoi analizzarle e ritrovarle qui quando vuoi.
        </p>
      </header>

      <section className="atlas-consumer-card px-4 py-4 sm:px-5">
        <h2 className="text-[15px] font-semibold text-foreground">Aggiungi un PDF</h2>
        <p className="mt-1 text-[12px] text-muted">
          Il PDF resta nel tuo archivio privato. L’analisi AI, avviata solo su tua richiesta, elabora il testo tramite OpenAI.
        </p>
        <div className="mt-4">
          <DocumentUploadForm />
        </div>
      </section>

      {documents.length === 0 ? (
        <EmptyState
          title="Il wallet è vuoto"
          description="Carica il primo PDF per tenere polizze, condizioni e comunicazioni nello stesso posto."
        />
      ) : (
        <DocumentWalletList
          documents={documents}
          policiesByDocumentId={policiesByDocumentId}
        />
      )}
    </div>
  );
}
