import Link from "next/link";
import {
  OperationsHeader,
  OperationsMetric,
  OperationsPanel,
  formatChf,
} from "@/components/operations/OperationsUi";
import { SimpleBarChart, SimpleFunnel, SimpleLineChart } from "@/components/charts/SimpleCharts";
import { SwitzerlandChoropleth } from "@/components/maps/SwitzerlandChoropleth";
import { getBrokerWorkspace } from "@/lib/broker-operations";
import { getCantonAggregates } from "@/lib/partner-applications";
import { requireOperationsRole } from "@/lib/operations-access";
import { pct } from "@/lib/analytics-period";

export const metadata = { title: "Analytics | Partner" };

export default async function PartnerAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = params.range ?? "12m";
  const [{ supabase, broker }, workspace, cantons] = await Promise.all([
    requireOperationsRole(["broker"]),
    getBrokerWorkspace(),
    getCantonAggregates("partner").catch(() => []),
  ]);
  if (!broker) throw new Error("Profilo broker mancante.");

  const { data: offers } = await supabase
    .from("insurance_offers")
    .select("id, policy_category, insurer, status, created_at")
    .eq("broker_id", broker.id);
  const { data: ledger } = await supabase.rpc("get_broker_commission_ledger");

  const completed =
    (workspace.pipeline.won ?? 0) + (workspace.pipeline.completed ?? 0);
  const decided = completed + (workspace.pipeline.lost ?? 0);

  const funnel = [
    { id: "assigned", label: "Lead assegnati", count: workspace.leads.length },
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
    { id: "appointments", label: "Appuntamenti", count: workspace.appointmentCount },
    { id: "offers", label: "Offerte", count: (offers ?? []).length },
    { id: "contracts", label: "Contratti", count: workspace.contracts.length },
  ];

  const byCategory = (offers ?? []).reduce<
    Record<string, { offers: number; contracts: number }>
  >((acc, offer) => {
    const key = String(offer.policy_category ?? "Altro");
    acc[key] ??= { offers: 0, contracts: 0 };
    acc[key].offers += 1;
    return acc;
  }, {});
  for (const contract of workspace.contracts) {
    const key = String(contract.category ?? "Altro");
    byCategory[key] ??= { offers: 0, contracts: 0 };
    byCategory[key].contracts += 1;
  }

  const byInsurer = (offers ?? []).reduce<
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
    const rows = ((ledger ?? []) as Array<{
      earned_at?: string | null;
      created_at?: string;
      broker_share?: number | string;
      net_broker_share?: number | string;
    }>).filter((row) => {
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
    range === "3m" ? 3 : range === "6m" ? 6 : range === "ytd" ? new Date().getMonth() + 1 : 12;
  const seriesSlice = monthly.slice(-months);

  return (
    <>
      <OperationsHeader
        eyebrow="Performance"
        title="Analytics partner"
        description="Solo i tuoi dati assegnati. ATLAS share non è esposto in questo portale."
      />

      <div className="mb-4 flex flex-wrap gap-2 text-[12px]">
        {[
          ["3m", "3M"],
          ["6m", "6M"],
          ["12m", "12M"],
          ["ytd", "YTD"],
        ].map(([value, label]) => (
          <Link
            key={value}
            href={`/partner/analytics?range=${value}`}
            className={`rounded-lg border px-3 py-1.5 ${
              range === value
                ? "border-accent bg-accent-soft text-accent"
                : "border-border text-muted"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OperationsMetric label="Conversion" value={`${pct(completed, decided)}%`} />
        <OperationsMetric
          label="Broker share"
          value={formatChf(workspace.revenue.brokerShare)}
        />
        <OperationsMetric label="Expected" value={formatChf(workspace.revenue.expectedShare)} />
        <OperationsMetric label="Paid" value={formatChf(workspace.revenue.paidShare)} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <SimpleFunnel title="Funnel" steps={funnel} />
        <SimpleLineChart
          title="Revenue temporale (broker share)"
          series={[
            { label: "Broker share", values: seriesSlice.map((r) => r.broker) },
            {
              label: "Netto",
              values: seriesSlice.map((r) => r.net),
              color: "var(--muted-foreground)",
            },
          ]}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <SimpleBarChart
          title="Performance by category — contratti"
          points={Object.entries(byCategory).map(([label, value]) => ({
            label,
            value: value.contracts,
          }))}
        />
        <SimpleBarChart
          title="Performance by insurer — offerte"
          points={Object.entries(byInsurer).map(([label, value]) => ({
            label,
            value: value.offers,
          }))}
        />
      </div>

      <div className="mt-5">
        <SwitzerlandChoropleth
          title="Il tuo portafoglio in Svizzera"
          data={cantons}
          metric="contracts"
          metrics={["leads", "clients", "contracts", "brokerRevenue"]}
        />
      </div>

      <div className="mt-5">
        <OperationsPanel title="Dettaglio categorie">
          {!Object.keys(byCategory).length ? (
            <p className="text-[12px] text-muted">Nessuna categoria ancora.</p>
          ) : (
            <table className="w-full text-left text-[12px]">
              <thead className="text-[10px] uppercase text-muted">
                <tr>
                  <th className="pb-2">Categoria</th>
                  <th className="pb-2">Offerte</th>
                  <th className="pb-2">Contratti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Object.entries(byCategory).map(([label, value]) => (
                  <tr key={label}>
                    <td className="py-2">{label}</td>
                    <td>{value.offers}</td>
                    <td>{value.contracts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </OperationsPanel>
      </div>
    </>
  );
}
