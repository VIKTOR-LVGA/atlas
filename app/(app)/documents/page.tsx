import { EmptyState } from "@/components/consumer/EmptyState";
import { CheckCircle2, FileUp, ScanLine, Sparkles } from "lucide-react";
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
      <header className="atlas-consumer-hero flex flex-col items-center gap-5 overflow-hidden p-6 sm:flex-row sm:justify-between sm:p-8">
        <div className="w-full min-w-0 sm:max-w-[65%]">
          <p className="atlas-premium-eyebrow">Il tuo archivio privato</p>
          <h1 className="atlas-premium-title mt-2">Documenti, tutto in ordine.</h1>
          <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-muted-foreground">
            Carica la tua polizza PDF, chiedi ad ATLAS di analizzarla e verifica la bozza prima di salvarla.
          </p>
        </div>
        <div aria-hidden="true" className="atlas-v2-dossier-art relative h-[150px] w-full max-w-[240px] shrink-0 overflow-hidden rounded-[25px] sm:h-[160px] sm:w-[200px]">
          <div className="absolute left-[23%] top-[18%] h-[126px] w-[89px] rotate-[-13deg] rounded-xl border border-white bg-white/80 p-3 shadow-xl">
            <FileUp className="h-5 w-5 text-[#3b5fe8]"/>
            <div className="mt-4 h-1.5 w-full rounded-full bg-[#dae4fc]"/><div className="mt-2 h-1.5 w-4/5 rounded-full bg-[#dae4fc]"/>
          </div>
          <div className="absolute left-[43%] top-[18%] h-[132px] w-[98px] rotate-[10deg] rounded-xl border border-white bg-white p-3 shadow-xl">
            <Sparkles className="h-6 w-6 text-[#6656e9]"/>
            <div className="mt-4 h-1.5 w-full rounded-full bg-[#dae4fc]"/><div className="mt-2 h-1.5 w-2/3 rounded-full bg-[#dae4fc]"/>
            <div className="mt-5 flex h-7 w-7 items-center justify-center rounded-full bg-[#e0f7ed]"><CheckCircle2 className="h-4 w-4 text-[#33a982]"/></div>
          </div>
          <span className="absolute bottom-3 left-3 rounded-full border border-white bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#5266c8]">PDF</span>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3" aria-label="Come funziona">
        {[
          {step:"01",title:"Carica",description:"Aggiungi il PDF originale.",Icon:FileUp},
          {step:"02",title:"Analizza",description:"ATLAS prepara una bozza.",Icon:ScanLine},
          {step:"03",title:"Conferma",description:"Controlla premi e coperture.",Icon:CheckCircle2},
        ].map(({step,title,description,Icon}) => (
          <div key={step} className="atlas-premium-tile flex items-center gap-3.5 px-5 py-4 sm:flex-col sm:items-start">
            <span className="atlas-pill-icon shrink-0"><Icon className="h-5 w-5" aria-hidden/></span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-accent">Passo {step}</p>
              <p className="mt-1 text-[14px] font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{description}</p>
            </div>
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
