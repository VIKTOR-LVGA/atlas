import Link from "next/link";
import { OperationsHeader, OperationsPanel, formatDate } from "@/components/operations/OperationsUi";
import { getBrokerWorkspace } from "@/lib/broker-operations";
import {
  consultationStatusLabel,
  consultationTypeLabel,
  contactMethodLabel,
} from "@/lib/operations-labels";

export default async function BrokerLeadsPage() {
  const { leads } = await getBrokerWorkspace();
  return (
    <>
      <OperationsHeader
        eyebrow="Pipeline"
        title="Lead assegnati"
        description="Vedi solo le richieste affidate al tuo profilo broker."
      />
      <OperationsPanel title={`${leads.length} richieste`}>
        {!leads.length ? (
          <div className="rounded-lg border border-dashed border-border bg-card-muted/20 px-4 py-8 text-center">
            <p className="text-[13px] font-medium text-foreground">Nessun lead assegnato</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
              Quando ATLAS ti assegna una consulenza, compare qui. Nessun dato dimostrativo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-[12px]">
              <thead className="text-[10px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Stato</th>
                  <th className="pb-3">Contatto</th>
                  <th className="pb-3">Aggiornata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="py-3">
                      <Link className="font-semibold text-accent" href={`/partner/leads/${lead.id}`}>
                        {lead.clientName}
                      </Link>
                      <p className="text-[10px] text-muted">{consultationTypeLabel(lead.requestType)}</p>
                    </td>
                    <td className="py-3">{consultationStatusLabel(lead.status)}</td>
                    <td className="py-3">{contactMethodLabel(lead.preferredContactMethod)}</td>
                    <td className="py-3">{formatDate(lead.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </OperationsPanel>
    </>
  );
}
