import Link from "next/link";
import { OperationsHeader, OperationsMetric, OperationsPanel, formatChf, formatDate } from "@/components/operations/OperationsUi";
import { getBrokerWorkspace } from "@/lib/broker-operations";

export const metadata = { title: "Broker | ATLAS" };

export default async function BrokerDashboard() {
  const data = await getBrokerWorkspace();
  const active = data.leads.filter((lead) => !["won", "lost", "completed", "cancelled"].includes(lead.status));
  const completed = (data.pipeline.won ?? 0) + (data.pipeline.completed ?? 0);
  const decided = completed + (data.pipeline.lost ?? 0);
  return <>
    <OperationsHeader eyebrow="Broker workspace" title={`Buongiorno, ${data.broker.displayName}`} description="Una pipeline operativa basata esclusivamente sulle consulenze assegnate e sulle risorse condivise in modo esplicito dal cliente." />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <OperationsMetric label="Lead attivi" value={String(active.length)} detail={`${data.leads.length} assegnazioni totali`} />
      <OperationsMetric label="Da contattare" value={String((data.pipeline.assigned ?? 0) + (data.pipeline.submitted ?? 0))} />
      <OperationsMetric label="Appuntamenti" value={String(data.appointmentCount)} />
      <OperationsMetric label="In review" value={String(data.pipeline.in_review ?? 0)} />
      <OperationsMetric label="Conclusi" value={String(completed)} detail={`${decided ? Math.round((completed / decided) * 100) : 0}% conversione sui casi decisi`} />
      <OperationsMetric label="Commissioni" value={String(data.ledger.length)} detail={`${data.contracts.length} contratti`} />
      <OperationsMetric label="Commissioni attese" value={formatChf(data.revenue.expectedShare)} />
      <OperationsMetric label="Ricavo broker netto" value={formatChf(data.revenue.netBrokerRevenue)} detail={`Clawback ${formatChf(data.revenue.clawbackShare)}`} />
    </div>
    <div className="mt-6"><OperationsPanel title="Priorità operative" action={<Link href="/broker/leads" className="text-[12px] font-medium text-accent">Tutta la pipeline</Link>}>
      <div className="divide-y divide-border">
        {active.slice(0, 8).map((lead) => <Link href={`/broker/leads/${lead.id}`} key={lead.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <div><p className="text-[13px] font-semibold">{lead.clientName}</p><p className="mt-0.5 text-[11px] text-muted">{lead.requestType} · aggiornato {formatDate(lead.updatedAt)}</p></div>
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent">{lead.status}</span>
        </Link>)}
        {!active.length ? <p className="text-[12px] text-muted">Nessun lead attivo assegnato.</p> : null}
      </div>
    </OperationsPanel></div>
  </>;
}
