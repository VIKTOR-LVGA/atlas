import Link from "next/link";
import { OperationsHeader, OperationsPanel, formatDate } from "@/components/operations/OperationsUi";
import { getBrokerWorkspace } from "@/lib/broker-operations";

export default async function BrokerLeadsPage() {
  const { leads } = await getBrokerWorkspace();
  return <><OperationsHeader eyebrow="Pipeline" title="Lead assegnati" description="Visibilità circoscritta alle richieste affidate al tuo profilo broker." />
    <OperationsPanel title={`${leads.length} richieste`}><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-[12px]"><thead className="text-[10px] uppercase tracking-wide text-muted"><tr><th className="pb-3">Cliente</th><th className="pb-3">Stato</th><th className="pb-3">Contatto</th><th className="pb-3">Fonte</th><th className="pb-3">Aggiornata</th></tr></thead><tbody className="divide-y divide-border">{leads.map((lead) => <tr key={lead.id}><td className="py-3"><Link className="font-semibold text-accent" href={`/broker/leads/${lead.id}`}>{lead.clientName}</Link><p className="text-[10px] text-muted">{lead.requestType}</p></td><td className="py-3">{lead.status}</td><td className="py-3">{lead.preferredContactMethod ?? "da concordare"}</td><td className="py-3">{lead.source}</td><td className="py-3">{formatDate(lead.updatedAt)}</td></tr>)}</tbody></table></div></OperationsPanel>
  </>;
}
