import Link from "next/link";
import { Users } from "lucide-react";
import {
  OperationsHeader,
  OperationsPanel,
  formatChf,
  formatDate,
} from "@/components/operations/OperationsUi";
import { PartnerEmptyState } from "@/components/partner/PartnerEmptyState";
import { getBrokerWorkspace } from "@/lib/broker-operations";
import { consultationStatusLabel } from "@/lib/operations-labels";
import { deriveNextAction } from "@/lib/partner-workspace";

export const metadata = { title: "Clienti | Partner" };

export default async function BrokerClientsPage() {
  const { leads, contracts, ledger } = await getBrokerWorkspace();
  const clients = [...new Map(leads.map((lead) => [lead.userId, lead])).values()];

  return (
    <>
      <OperationsHeader
        eyebrow="Portafoglio assegnato"
        title="Clienti"
        description="Il cliente compare qui solo se esiste una consulenza assegnata. Documenti e polizze restano invisibili finché non vengono condivisi esplicitamente."
      />
      <OperationsPanel title={`${clients.length} clienti`}>
        {!clients.length ? (
          <PartnerEmptyState
            icon={Users}
            title="Nessun cliente"
            description="I clienti appariranno quando riceverai le prime richieste assegnate."
            action={{ href: "/partner/leads", label: "Vai alle richieste" }}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {clients.map((client) => {
              const clientLeadIds = leads
                .filter((lead) => lead.userId === client.userId)
                .map((lead) => lead.id);
              const openLead =
                leads.find(
                  (lead) =>
                    lead.userId === client.userId &&
                    !["won", "lost", "completed", "cancelled"].includes(lead.status)
                ) ?? client;
              const clientContracts = contracts.filter(
                (contract) => contract.user_id === client.userId
              );
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
                <Link
                  key={client.userId}
                  href={`/partner/clients/${client.userId}`}
                  className="rounded-xl border border-border bg-card p-4 transition hover:border-accent"
                >
                  <p className="text-[13px] font-semibold">{client.clientName}</p>
                  <p className="mt-1 text-[11px] text-muted">
                    {client.clientEmail ?? "Email non disponibile"}
                  </p>
                  <p className="mt-3 text-[11px] text-muted">
                    {consultationStatusLabel(openLead.status)} ·{" "}
                    {deriveNextAction(openLead.status)}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-muted">
                    <span>{clientLeadIds.length} richieste</span>
                    <span>{clientContracts.length} contratti</span>
                    <span>{formatChf(commissionValue)}</span>
                  </div>
                  <p className="mt-3 text-[10px] uppercase tracking-wide text-accent">
                    Cliente 360° · aggiornato {formatDate(openLead.updatedAt)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </OperationsPanel>
    </>
  );
}
