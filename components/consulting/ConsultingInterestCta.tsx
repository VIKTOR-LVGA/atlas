import Link from "next/link";
import { Bell, FileText, Lock } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

type ConsultingInterestCtaProps = {
  readinessPercent: number;
};

export function ConsultingInterestCta({ readinessPercent }: ConsultingInterestCtaProps) {
  return (
    <SectionCard title="Interesse al servizio" padding="sm" tone="primary">
      <div className="space-y-3">
        <p className="text-[12px] leading-relaxed text-muted">
          La revisione con esperto non è ancora prenotabile. Puoi preparare il dossier in
          Atlas e ricevere aggiornamenti quando il servizio sarà attivo — senza invio
          automatico di richieste in questa versione.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/documents"
            className="atlas-btn-primary inline-flex flex-1 items-center justify-center gap-2 py-2.5 text-[12px]"
          >
            <FileText className="h-4 w-4" />
            Prepara il dossier
          </Link>
          <button
            type="button"
            disabled
            className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card-muted/50 px-4 py-2.5 text-[12px] font-medium text-muted opacity-90"
            title="Disponibile quando il servizio consulenza sarà attivato"
          >
            <Lock className="h-4 w-4 shrink-0" />
            Richiedi informazioni · Prossimamente
          </button>
        </div>
        <p className="flex items-center gap-2 text-[10px] text-muted">
          <Bell className="h-3.5 w-3.5 shrink-0" />
          Readiness attuale {readinessPercent}% — nessuna prenotazione registrata.
        </p>
      </div>
    </SectionCard>
  );
}
