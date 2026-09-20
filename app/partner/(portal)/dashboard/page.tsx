import Link from "next/link";
import {
  OperationsHeader,
  OperationsMetric,
  OperationsPanel,
  formatChf,
  formatDate,
} from "@/components/operations/OperationsUi";
import { SimpleFunnel } from "@/components/charts/SimpleCharts";
import { SwitzerlandChoropleth } from "@/components/maps/SwitzerlandChoropleth";
import { getBrokerWorkspace } from "@/lib/broker-operations";
import { getCantonAggregates } from "@/lib/partner-applications";
import { consultationStatusLabel, consultationTypeLabel } from "@/lib/operations-labels";
import { pct } from "@/lib/analytics-period";

export const metadata = { title: "Partner Dashboard | ATLAS" };

export default async function PartnerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = params.period ?? "30d";
  const [data, cantons] = await Promise.all([
    getBrokerWorkspace(),
    getCantonAggregates("partner").catch(() => []),
  ]);

  const active = data.leads.filter(
    (lead) => !["won", "lost", "completed", "cancelled"].includes(lead.status)
  );
  const toContact = (data.pipeline.assigned ?? 0) + (data.pipeline.submitted ?? 0);
  const completed = (data.pipeline.won ?? 0) + (data.pipeline.completed ?? 0);
  const decided = completed + (data.pipeline.lost ?? 0);
  const conversion = pct(completed, decided);

  const funnel = [
    { id: "assigned", label: "Lead assegnati", count: data.leads.length },
    {
      id: "contacted",
      label: "Contattati+",
      count:
        data.leads.length -
        (data.pipeline.assigned ?? 0) -
        (data.pipeline.submitted ?? 0),
    },
    { id: "appointments", label: "Appuntamenti", count: data.appointmentCount },
    {
      id: "quoted",
      label: "Offerte / in quote",
      count: (data.pipeline.quoted ?? 0) + (data.pipeline.in_review ?? 0),
    },
    { id: "contracts", label: "Contratti", count: data.contracts.length },
  ].map((step) => ({
    ...step,
    count: Math.max(0, step.count),
  }));

  return (
    <>
      <OperationsHeader
        eyebrow="Partner Portal"
        title={`Buongiorno, ${data.broker.displayName}`}
        description="Workspace operativo sulle sole consulenze assegnate e sulle risorse condivise esplicitamente dai clienti."
      />

      <div className="mb-4 flex flex-wrap gap-2 text-[12px]">
        {[
          ["7d", "7 giorni"],
          ["30d", "30 giorni"],
          ["90d", "90 giorni"],
          ["ytd", "YTD"],
          ["12m", "12 mesi"],
        ].map(([value, label]) => (
          <Link
            key={value}
            href={`/partner/dashboard?period=${value}`}
            className={`rounded-lg border px-3 py-1.5 ${
              period === value
                ? "border-accent bg-accent-soft text-accent"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OperationsMetric label="Lead attivi" value={String(active.length)} />
        <OperationsMetric label="Da contattare" value={String(toContact)} />
        <OperationsMetric label="Appuntamenti" value={String(data.appointmentCount)} />
        <OperationsMetric label="Contratti" value={String(data.contracts.length)} />
        <OperationsMetric
          label="Conversion"
          value={`${conversion}%`}
          detail={`${completed} conclusi su ${decided || 0} decisi`}
        />
        <OperationsMetric
          label="Commissioni attese"
          value={formatChf(data.revenue.expectedShare)}
        />
        <OperationsMetric
          label="Commissioni pagate"
          value={formatChf(data.revenue.paidShare)}
        />
        <OperationsMetric
          label="Ricavo broker netto"
          value={formatChf(data.revenue.netBrokerRevenue)}
          detail={`Clawback ${formatChf(data.revenue.clawbackShare)}`}
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <SimpleFunnel title="Funnel operativo" steps={funnel} />
        <OperationsPanel
          title="Priorità"
          action={
            <Link href="/partner/leads" className="text-[12px] font-medium text-accent">
              Tutte le richieste
            </Link>
          }
        >
          <div className="divide-y divide-border">
            {active.slice(0, 8).map((lead) => (
              <Link
                key={lead.id}
                href={`/partner/leads/${lead.id}`}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-[13px] font-semibold">{lead.clientName}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {consultationTypeLabel(lead.requestType)} · {formatDate(lead.updatedAt)}
                  </p>
                </div>
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent">
                  {consultationStatusLabel(lead.status)}
                </span>
              </Link>
            ))}
            {!active.length ? (
              <p className="text-[12px] text-muted">Nessun lead attivo assegnato.</p>
            ) : null}
          </div>
        </OperationsPanel>
      </div>

      <div className="mt-5">
        <SwitzerlandChoropleth
          title="Il tuo portafoglio in Svizzera"
          data={cantons}
          metric="leads"
          metrics={["leads", "clients", "contracts", "brokerRevenue"]}
        />
      </div>
    </>
  );
}
