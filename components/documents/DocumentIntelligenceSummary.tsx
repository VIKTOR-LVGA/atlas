import { Sparkles } from "lucide-react";
import type { DocumentIntelligenceView } from "@/lib/document-intelligence";
import { SectionCard } from "@/components/ui/SectionCard";

type DocumentIntelligenceSummaryProps = {
  view: DocumentIntelligenceView;
};

export function DocumentIntelligenceSummary({ view }: DocumentIntelligenceSummaryProps) {
  if (view.summaryItems.length === 0) {
    return (
      <SectionCard tone="support" padding="sm">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
          <div>
            <p className="text-[13px] font-semibold text-foreground">
              Riepilogo non ancora disponibile
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              {view.document.status === "uploaded"
                ? "Avvia l'analisi per generare il riepilogo estratto."
                : view.document.status === "processing"
                  ? "L'analisi è in corso. Il riepilogo apparirà al completamento."
                  : "Nessun dato strutturato collegato a questo documento."}
            </p>
          </div>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Riepilogo estrazione"
      description="Solo dati reali dalla polizza collegata"
      tone="primary"
      padding="sm"
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {view.summaryItems.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-border-subtle bg-card-muted/40 px-3 py-2.5"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
              {item.label}
            </p>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-foreground">
              {item.value}
            </p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
