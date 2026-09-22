import Link from "next/link";
import {
  OperationsPanel,
  formatChf,
  formatDate,
} from "@/components/operations/OperationsUi";
import {
  PartnerBadge,
  PartnerEmptyState,
  PartnerPageIntro,
} from "@/components/partner/PartnerEmptyState";
import { getBrokerWorkspace } from "@/lib/broker-operations";
import { consultationStatusLabel } from "@/lib/operations-labels";
import { deriveNextAction } from "@/lib/partner-workspace";

export const metadata = { title: "Clienti | Partner" };

export default async function BrokerClientsPage() {
  const { leads, contracts, ledger } = await getBrokerWorkspace();
  const clients = [...new Map(leads.map((lead) => [lead.userId, lead])).values()];
  const openCount = clients.filter((client) =>
    leads.some(
      (lead) =>
        lead.userId === client.userId &&
        !["won", "lost", "completed", "cancelled"].includes(lead.status)
    )
  ).length;

  return (
    <>
      <PartnerPageIntro
        area="clients"
        eyebrow="Portafoglio assegnato"
        title="Clienti"
        description="Il cliente compare solo se esiste una consulenza assegnata. Documenti e polizze restano invisibili finché non vengono condivisi."
        actions={
          openCount > 0 ? (
            <PartnerBadge tone="accent">{openCount} con richieste aperte</PartnerBadge>
          ) : null
        }
      />
      <OperationsPanel title={`${clients.length} clienti`}>
        {!clients.length ? (
          <PartnerEmptyState
            area="clients"
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
              const needsAttention = !["won", "lost", "completed", "cancelled"].includes(
                openLead.status
              );
              return (
                <Link
                  key={client.userId}
                  href={`/partner/clients/${client.userId}`}
                  className="rounded-xl border border-border bg-card p-4 transition hover:border-accent/50 hover:shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-semibold">{client.clientName}</p>
                    {needsAttention ? (
                      <PartnerBadge tone="warn">Aperto</PartnerBadge>
                    ) : (
                      <PartnerBadge tone="neutral">Chiuso</PartnerBadge>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    {client.clientEmail ?? "Email non disponibile"}
                  </p>
                  <p className="mt-3 text-[11px] text-muted">
                    {consultationStatusLabel(openLead.status)} ·{" "}
                    {deriveNextAction(openLead.status)}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-[10px] text-muted">
                    <span>{clientLeadIds.length} richieste</span>
                    <span>{clientContracts.length} contratti</span>
                    <span className="tabular-nums">{formatChf(commissionValue)}</span>
                  </div>
                  <p className="mt-3 text-[10px] uppercase tracking-wide text-accent">
                    Cliente 360° · {formatDate(openLead.updatedAt)}
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
