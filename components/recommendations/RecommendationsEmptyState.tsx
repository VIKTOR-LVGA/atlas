import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

interface RecommendationsEmptyStateProps {
  hasPortfolio: boolean;
}

export function RecommendationsEmptyState({
  hasPortfolio,
}: RecommendationsEmptyStateProps) {
  return (
    <SectionCard tone="primary" padding="sm">
      <div className="flex flex-col items-center px-4 py-10 text-center sm:py-12">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent ring-1 ring-accent/15">
          <Sparkles className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-[15px] font-semibold text-foreground">
          {hasPortfolio
            ? "Portafoglio allineato"
            : "Sblocca le raccomandazioni Atlas"}
        </h2>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted">
          {hasPortfolio
            ? "Non ci sono azioni urgenti sui dati attuali. Carica e conferma più polizze per raccomandazioni avanzate su completezza e coperture."
            : "Carica e conferma più polizze per sbloccare raccomandazioni avanzate. Atlas analizza solo dati reali estratti dai tuoi documenti."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/documents"
            className="atlas-btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-[13px] shadow-sm"
          >
            <FileText className="h-4 w-4" />
            Carica PDF
          </Link>
          <Link
            href="/policies"
            className="atlas-btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-[13px]"
          >
            Vedi polizze
          </Link>
        </div>
      </div>
    </SectionCard>
  );
}
