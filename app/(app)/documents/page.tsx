import { EmptyState } from "@/components/consumer/EmptyState";
import { CheckCircle2, FileUp, ScanSearch, ShieldCheck } from "lucide-react";
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
      <header className="atlas-consumer-hero p-6 sm:p-8">
        <p className="atlas-premium-eyebrow">Il tuo archivio privato</p>
        <h1 className="atlas-premium-title mt-2">Documenti, tutto in ordine.</h1>
        <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-muted-foreground">
          Carica una polizza in PDF. Puoi farla analizzare ad ATLAS, controllare la bozza e ritrovarla quando vuoi.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3" aria-label="Come funziona">
        {[
          ["1", "Carica", "Aggiungi il PDF originale."],
          ["2", "Analizza", "ATLAS prepara una bozza."],
          ["3", "Conferma", "Verifica importi e coperture."],
        ].map(([step, title, description]) => (
          <div key={step} className="atlas-premium-tile px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-accent">Passo {step}</p>
            <p className="mt-1 text-[14px] font-semibold text-foreground">{title}</p>
            <p className="mt-3 text-[12px] leading-relaxed text-muted">{description}</p>
          </div>
        ))}
      </div>

      <section className="atlas-consumer-card px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center gap-3"><span className="atlas-pill-icon"><FileUp className="h-5 w-5" aria-hidden/></span><h2 className="text-[19px] font-bold tracking-tight text-foreground">Carica la tua polizza</h2></div>
        <p className="mt-1 text-[12px] text-muted">
          Il PDF resta nel tuo archivio privato. L’analisi AI, avviata solo su tua richiesta, elabora il testo tramite OpenAI.
        </p>
        <div className="mt-6">
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
