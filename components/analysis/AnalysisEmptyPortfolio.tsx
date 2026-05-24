import Link from "next/link";
import { IconAnalysis, IconUpload } from "@/components/icons";
import { EmptyState } from "@/components/ui/EmptyState";

export function AnalysisEmptyPortfolio() {
  return (
    <div className="atlas-surface-card p-6">
      <EmptyState
        icon={<IconAnalysis className="h-6 w-6" />}
        title="Centro analisi in attesa di dati"
        description="Carica PDF assicurativi, avvia l'estrazione AI e conferma le bozze per attivare l'intelligence sul portafoglio."
        actionLabel="Carica un PDF"
        actionHref="/documents"
        secondaryActionLabel="Crea polizza manuale"
        secondaryActionHref="/policies/new"
      />
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {[
          {
            step: "1",
            title: "Upload",
            text: "Archivia i PDF nel workspace privato.",
          },
          {
            step: "2",
            title: "Estrazione",
            text: "OCR e strutturazione automatica dei campi.",
          },
          {
            step: "3",
            title: "Conferma",
            text: "Rivedi le bozze per sbloccare gli insight.",
          },
        ].map((item) => (
          <div
            key={item.step}
            className="rounded-lg border border-border-subtle bg-card-muted/40 p-3"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">
              {item.step}. {item.title}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              {item.text}
            </p>
          </div>
        ))}
      </div>
      <Link
        href="/documents"
        className="atlas-btn-primary mt-4 inline-flex items-center gap-2 text-[12px]"
      >
        <IconUpload className="h-4 w-4" />
        Inizia con un documento
      </Link>
    </div>
  );
}
