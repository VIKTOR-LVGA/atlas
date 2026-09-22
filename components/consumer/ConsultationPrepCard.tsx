import Link from "next/link";
import type { ConsultationRequest } from "@/lib/types";

const statusLabels: Record<string, string> = {
  submitted: "Richiesta inviata, in attesa di assegnazione",
  assigned: "Assegnata a un consulente partner",
  contacted: "Il consulente ti ha contattato",
  consultation_scheduled: "Appuntamento fissato",
  in_review: "Revisione in corso",
  quoted: "Hai ricevuto una proposta",
  won: "Pratica conclusa",
  lost: "Pratica chiusa senza seguito",
  completed: "Revisione completata",
  cancelled: "Richiesta annullata",
};

export function ConsultationPrepCard({
  request = null,
}: {
  request?: ConsultationRequest | null;
}) {
  return (
    <section className="atlas-consumer-card px-5 py-5">
      <p className="text-[15px] font-semibold tracking-tight text-foreground">
        Revisione con un consulente
      </p>

      {request ? (
        <>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            {statusLabels[request.status] ?? "Richiesta in gestione"}. Vedi i dati che hai
            scelto di condividere e lo stato della pratica.
          </p>
          <Link
            href={`/consultations/${request.id}`}
            className="atlas-btn-secondary mt-4 flex min-h-11 items-center justify-center px-4 text-[13px]"
          >
            Apri la pratica
          </Link>
        </>
      ) : (
        <>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            Un consulente partner ATLAS può rivedere gratuitamente il tuo portafoglio.
            Scegli tu quali polizze e documenti condividere: niente viene inviato senza il
            tuo consenso.
          </p>
          <Link
            href="/consulting"
            className="atlas-btn-primary mt-4 flex min-h-11 items-center justify-center px-4 text-[13px]"
          >
            Richiedi una revisione gratuita
          </Link>
        </>
      )}
    </section>
  );
}
