import Link from "next/link";
import {
  OperationsMetric,
  OperationsPanel,
  formatChf,
} from "@/components/operations/OperationsUi";
import {
  SimpleBarChart,
  SimpleFunnel,
  SimpleLineChart,
} from "@/components/charts/SimpleCharts";
import { SwitzerlandChoropleth } from "@/components/maps/SwitzerlandChoropleth";
import { PartnerPageIntro } from "@/components/partner/PartnerEmptyState";
import { getBrokerWorkspace } from "@/lib/broker-operations";
import { getCantonAggregates } from "@/lib/partner-applications";
import { pct } from "@/lib/analytics-period";

export const metadata = { title: "Analytics | Partner" };

export default async function PartnerAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = params.range ?? "12m";
  const [workspace, cantons] = await Promise.all([
    getBrokerWorkspace(),
    getCantonAggregates("partner").catch(() => []),
  ]);

  const completed =
    (workspace.pipeline.won ?? 0) + (workspace.pipeline.completed ?? 0);
  const decided = completed + (workspace.pipeline.lost ?? 0);
  const avgPerContract =
    workspace.contracts.length > 0
      ? workspace.revenue.netBrokerRevenue / workspace.contracts.length
      : 0;

  const funnel = [
    { id: "assigned", label: "Assegnati", count: workspace.leads.length },
    {
      id: "contacted",
      label: "Contattati+",
      count: Math.max(
        0,
        workspace.leads.length -
          (workspace.pipeline.assigned ?? 0) -
          (workspace.pipeline.submitted ?? 0)
      ),
    },
    {
      id: "appointments",
      label: "Appuntamento",
      count: workspace.appointmentCount,
    },
    { id: "offers", label: "Offerta", count: workspace.offers.length },
    { id: "contracts", label: "Vinti", count: workspace.contracts.length },
  ];

  const byCategory = workspace.offers.reduce<
    Record<string, { offers: number; contracts: number; revenue: number }>
  >((acc, offer) => {
    const key = String(offer.policy_category ?? "Altro");
    acc[key] ??= { offers: 0, contracts: 0, revenue: 0 };
    acc[key].offers += 1;
    return acc;
  }, {});
  for (const contract of workspace.contracts) {
    const key = String(contract.category ?? "Altro");
    byCategory[key] ??= { offers: 0, contracts: 0, revenue: 0 };
    byCategory[key].contracts += 1;
  }

  const byInsurer = workspace.offers.reduce<
    Record<string, { offers: number; contracts: number }>
  >((acc, offer) => {
    const key = String(offer.insurer ?? "Altro");
    acc[key] ??= { offers: 0, contracts: 0 };
    acc[key].offers += 1;
    return acc;
  }, {});
  for (const contract of workspace.contracts) {
    const key = String(contract.insurer ?? "Altro");
    byInsurer[key] ??= { offers: 0, contracts: 0 };
    byInsurer[key].contracts += 1;
  }

  const monthly = Array.from({ length: 12 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const rows = (
      workspace.ledger as Array<{
        earned_at?: string | null;
        created_at?: string;
        broker_share?: number | string;
        net_broker_share?: number | string;
      }>
    ).filter((row) => {
      const stamp = String(row.earned_at ?? row.created_at ?? "").slice(0, 7);
      return stamp === key;
    });
    return {
      key,
      broker: rows.reduce((sum, row) => sum + Number(row.broker_share ?? 0), 0),
      net: rows.reduce((sum, row) => sum + Number(row.net_broker_share ?? 0), 0),
    };
  });

  const months =
    range === "3m"
      ? 3
      : range === "6m"
        ? 6
        : range === "ytd"
          ? new Date().getMonth() + 1
          : 12;
  const seriesSlice = monthly.slice(-months);

  const openOffers = workspace.offers.filter((o) =>
    ["draft", "proposed", "sent"].includes(String(o.status))
  ).length;

  const insightParts: string[] = [];
  if (workspace.leads.length === 0) {
    insightParts.push(
      "Quando inizierai a ricevere richieste, qui vedrai conversione, trend e performance territoriale."
    );
  } else if (decided > 0) {
    insightParts.push(
      `Conversione su lead decisi: ${pct(completed, decided)}% (${completed}/${decided}).`
    );
  }
  if (workspace.revenue.expectedShare > 0) {
    insightParts.push(
      `${formatChf(workspace.revenue.expectedShare)} in attesa — verifica lo stato in Commissioni.`
    );
  }
  if (openOffers > 0) {
    insightParts.push(
      `${openOffers} offerte aperte richiedono follow-up o risposta cliente.`
    );
  }

  return (
    <>
      <PartnerPageIntro
        area="analytics"
        eyebrow="Performance"
        title="Analytics partner"
        description="Solo i tuoi dati assegnati. La quota ATLAS non è esposta in questo portale."
      />

      <div className="mb-5 flex flex-wrap gap-2 text-[12px]">
        {[
          ["3m", "3M"],
          ["6m", "6M"],
          ["12m", "12M"],
          ["ytd", "YTD"],
        ].map(([value, label]) => (
          <Link
            key={value}
            href={`/partner/analytics?range=${value}`}
            className={`rounded-lg border px-3.5 py-1.5 transition ${
              range === value
                ? "border-accent bg-accent-soft text-accent shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_35%,transparent)]"
                : "border-border text-muted hover:border-accent/40 hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <section>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          KPI principali
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <OperationsMetric
            label="Tasso di conversione"
            value={`${pct(completed, decided)}%`}
            detail={`${completed} su ${decided || 0} decisi`}
          />
          <OperationsMetric
            label="Quota broker"
            value={formatChf(workspace.revenue.brokerShare)}
          />
          <OperationsMetric
            label="Attese"
            value={formatChf(workspace.revenue.expectedShare)}
          />
          <OperationsMetric
            label="Pagate"
            value={formatChf(workspace.revenue.paidShare)}
          />
          <OperationsMetric
            label="Media / contratto"
            value={formatChf(avgPerContract)}
            detail={`${workspace.contracts.length} contratti`}
          />
        </div>
      </section>

      {insightParts.length > 0 ? (
        <div className="mt-5">
          <OperationsPanel title="Insight operativo">
            <ul className="space-y-2 text-[12px] text-muted">
              {insightParts.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </OperationsPanel>
        </div>
      ) : null}

      <section className="mt-6">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Overview & funnel
        </p>
        <div className="grid gap-5 xl:grid-cols-2">
          <SimpleFunnel title="Funnel operativo" steps={funnel} />
          <SimpleLineChart
            title="Andamento temporale — quota broker"
            series={[
              { label: "Quota broker", values: seriesSlice.map((r) => r.broker) },
              {
                label: "Netto",
                values: seriesSlice.map((r) => r.net),
                color: "var(--muted-foreground)",
              },
            ]}
            emptyLabel="Nessuna serie temporale nel periodo selezionato."
          />
        </div>
      </section>

      <section className="mt-6">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Categorie & compagnie
        </p>
        <div className="grid gap-5 xl:grid-cols-2">
          <SimpleBarChart
            title="Performance per categoria — contratti"
            points={Object.entries(byCategory)
              .filter(([, value]) => value.contracts > 0 || value.offers > 0)
              .map(([label, value]) => ({
                label,
                value: value.contracts,
              }))}
            emptyLabel="Nessuna categoria con dati nel periodo."
          />
          <SimpleBarChart
            title="Performance per compagnia — offerte"
            points={Object.entries(byInsurer)
              .filter(([, value]) => value.offers > 0 || value.contracts > 0)
              .map(([label, value]) => ({
                label,
                value: value.offers,
              }))}
            emptyLabel="Nessuna compagnia con dati nel periodo."
          />
        </div>
      </section>

      <section className="mt-6">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Geografia
        </p>
        <SwitzerlandChoropleth
          title="Portafoglio geografico"
          data={cantons}
          metric="contracts"
          metrics={["leads", "clients", "contracts", "brokerRevenue"]}
          emptyHint="Il tuo portafoglio geografico apparirà qui quando riceverai le prime richieste."
          showRanking
          showAtlasShare={false}
        />
      </section>

      <section className="mt-6">
        <OperationsPanel title="Dettaglio categorie">
          {!Object.keys(byCategory).length ? (
            <p className="text-[12px] text-muted">
              Quando creerai offerte e contratti, qui vedrai conversione per ramo.
            </p>
          ) : (
            <table className="w-full text-left text-[12px]">
              <thead className="text-[10px] uppercase text-muted">
                <tr>
                  <th className="pb-2">Categoria</th>
                  <th className="pb-2">Offerte</th>
                  <th className="pb-2">Contratti</th>
                  <th className="pb-2">Conversione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Object.entries(byCategory).map(([label, value]) => (
                  <tr key={label}>
                    <td className="py-2.5 font-medium">{label}</td>
                    <td className="tabular-nums">{value.offers}</td>
                    <td className="tabular-nums">{value.contracts}</td>
                    <td className="tabular-nums text-accent">
                      {pct(value.contracts, value.offers)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </OperationsPanel>
      </section>
    </>
  );
}
