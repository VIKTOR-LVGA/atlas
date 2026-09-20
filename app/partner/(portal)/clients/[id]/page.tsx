import { notFound } from "next/navigation";
import { OperationsHeader, OperationsPanel, formatChf, formatDate } from "@/components/operations/OperationsUi";
import { getBrokerWorkspace } from "@/lib/broker-operations";
import {
  consultationStatusLabel,
  consultationTypeLabel,
  contractStatusLabel,
} from "@/lib/operations-labels";

export default async function BrokerClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { leads, contracts, ledger } = await getBrokerWorkspace();
  const clientLeads = leads.filter((lead) => lead.userId === id);
  if (!clientLeads.length) notFound();
  const client = clientLeads[0];
  const clientLeadIds = clientLeads.map((lead) => lead.id);
  const clientContracts = contracts.filter((contract) => contract.user_id === id);
  const commissionValue = ledger
    .filter((entry: { consultation_request_id: string }) =>
      clientLeadIds.includes(entry.consultation_request_id)
    )
    .reduce(
      (total: number, entry: { net_broker_share: number | string }) =>
        total + Number(entry.net_broker_share),
      0
    );
  return (
    <>
      <OperationsHeader
        eyebrow="Cliente assegnato"
        title={client.clientName}
        description="Vista aggregata limitata ai mandati attivi del broker corrente."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <OperationsPanel title="Contatti">
          <dl className="space-y-3 text-[12px]">
            <div>
              <dt className="text-muted">Email</dt>
              <dd>{client.clientEmail ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Telefono</dt>
              <dd>{client.clientPhone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Valore commissionale broker</dt>
              <dd>{formatChf(commissionValue)}</dd>
            </div>
            <div>
              <dt className="text-muted">Ultima attività</dt>
              <dd>{formatDate(client.updatedAt)}</dd>
            </div>
          </dl>
        </OperationsPanel>
        <OperationsPanel title={`Mandati (${clientLeads.length})`}>
          <div className="space-y-2">
            {clientLeads.map((lead) => (
              <a
                key={lead.id}
                href={`/partner/leads/${lead.id}`}
                className="block rounded-lg border border-border p-3 text-[12px]"
              >
                <span className="font-semibold">{consultationTypeLabel(lead.requestType)}</span>
                <span className="float-right text-accent">{consultationStatusLabel(lead.status)}</span>
              </a>
            ))}
          </div>
        </OperationsPanel>
        <OperationsPanel title={`Contratti (${clientContracts.length})`}>
          <div className="space-y-2">
            {clientContracts.map((contract) => (
              <div key={contract.id} className="rounded-lg border border-border p-3 text-[12px]">
                <span className="font-semibold">
                  {contract.insurer} · {contract.product}
                </span>
                <span className="float-right text-accent">
                  {contractStatusLabel(String(contract.status))}
                </span>
              </div>
            ))}
          </div>
        </OperationsPanel>
      </div>
    </>
  );
}
