import {
  OperationsHeader,
  OperationsMetric,
  OperationsPanel,
  formatChf,
} from "@/components/operations/OperationsUi";
import { SimpleBarChart, SimpleFunnel } from "@/components/charts/SimpleCharts";
import { getAdminWorkspace } from "@/lib/admin-operations";
import { getCantonAggregates } from "@/lib/partner-applications";
import { pct } from "@/lib/analytics-period";

export const metadata = { title: "Partner detail | Control Center" };

export default async function ControlCenterPartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [workspace, cantons] = await Promise.all([
    getAdminWorkspace(),
    getCantonAggregates("admin", id).catch(() => []),
  ]);
  const broker = workspace.brokers.find((row) => row.id === id);
  if (!broker) {
    return (
      <OperationsHeader
        eyebrow="Partner"
        title="Partner non trovato"
        description="L'identificativo non corrisponde a un broker registrato."
      />
    );
  }

  const leads = workspace.requests.filter((row) => row.assigned_broker_id === id);
  const contracts = workspace.contracts.filter((row) => row.broker_id === id);
  const commissions = workspace.commissions.filter((row) => row.broker_id === id);
  const won = leads.filter((row) => ["won", "completed"].includes(row.status)).length;
  const decided = leads.filter((row) =>
    ["won", "completed", "lost"].includes(row.status)
  ).length;
  const gross = commissions.reduce((sum, row) => sum + Number(row.gross_commission ?? 0), 0);
  const brokerShare = commissions.reduce(
    (sum, row) => sum + Number(row.broker_share ?? 0),
    0
  );
  const atlas = commissions.reduce((sum, row) => sum + Number(row.atlas_share ?? 0), 0);

  const funnel = [
    { id: "leads", label: "Lead assegnati", count: leads.length },
    {
      id: "contacted",
      label: "Contattati+",
      count: leads.filter((l) => !["assigned", "submitted"].includes(l.status)).length,
    },
    {
      id: "quoted",
      label: "Quoted",
      count: leads.filter((l) => ["quoted", "won", "completed"].includes(l.status)).length,
    },
    { id: "contracts", label: "Contratti", count: contracts.length },
  ];

  const byCategory = contracts.reduce<Record<string, number>>((acc, row) => {
    const key = String(row.category ?? "Altro");
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <OperationsHeader
        eyebrow={broker.active ? "Partner attivo" : "Partner sospeso"}
        title={broker.display_name}
        description={`${broker.organization_name ?? broker.email ?? ""} · iscritto ${broker.created_at.slice(0, 10)}`}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OperationsMetric label="Lead" value={String(leads.length)} />
        <OperationsMetric label="Contratti" value={String(contracts.length)} />
        <OperationsMetric label="Conversion" value={`${pct(won, decided)}%`} />
        <OperationsMetric label="Gross" value={formatChf(gross)} />
        <OperationsMetric label="Broker revenue" value={formatChf(brokerShare)} />
        <OperationsMetric label="ATLAS revenue" value={formatChf(atlas)} />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <SimpleFunnel title="Funnel partner" steps={funnel} />
        <SimpleBarChart
          title="Contratti per categoria"
          points={Object.entries(byCategory).map(([label, value]) => ({ label, value }))}
        />
      </div>
      <div className="mt-5">
        <OperationsPanel title="Cantoni (aggregato)">
          {!cantons.length ? (
            <p className="text-[12px] text-muted">Nessun dato cantonale.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 text-[12px]">
              {cantons.map((row) => (
                <li key={row.canton} className="rounded-lg border border-border p-2">
                  {row.canton}: {row.leads} lead · {row.contracts} contratti ·{" "}
                  {formatChf(row.brokerRevenue)}
                </li>
              ))}
            </ul>
          )}
        </OperationsPanel>
      </div>
    </>
  );
}
