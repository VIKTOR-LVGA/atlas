import Link from "next/link";
import { OperationsHeader, OperationsPanel } from "@/components/operations/OperationsUi";
import { getBrokerWorkspace } from "@/lib/broker-operations";

export default async function BrokerClientsPage() {
  const { leads, contracts, ledger } = await getBrokerWorkspace();
  const clients = [...new Map(leads.map((lead) => [lead.userId, lead])).values()];
  return <><OperationsHeader eyebrow="Portafoglio assegnato" title="Clienti" description="Il cliente compare qui solo se esiste una consulenza assegnata. Documenti e polizze restano invisibili finché non vengono condivisi esplicitamente." />
    <OperationsPanel title={`${clients.length} clienti`}><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{clients.map((client) => {
      const clientLeadIds = leads.filter((lead) => lead.userId === client.userId).map((lead) => lead.id);
      const clientContracts = contracts.filter((contract) => contract.user_id === client.userId);
      const commissionValue = ledger.filter((entry: { consultation_request_id: string }) => clientLeadIds.includes(entry.consultation_request_id)).reduce((total: number, entry: { net_broker_share: number | string }) => total + Number(entry.net_broker_share), 0);
      return <Link key={client.userId} href={`/partner/clients/${client.userId}`} className="rounded-xl border border-border bg-card-muted p-4 hover:border-accent"><p className="text-[13px] font-semibold">{client.clientName}</p><p className="mt-1 text-[11px] text-muted">{client.clientEmail ?? "Email non disponibile"}</p><div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-muted"><span>{clientLeadIds.length} richieste</span><span>{clientContracts.length} contratti</span><span>{new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(commissionValue)}</span></div><p className="mt-3 text-[10px] uppercase tracking-wide text-accent">Apri dossier assegnato</p></Link>;
    })}</div></OperationsPanel>
  </>;
}
