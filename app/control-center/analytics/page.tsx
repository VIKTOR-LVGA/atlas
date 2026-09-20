import {
  OperationsHeader,
  OperationsPanel,
  formatChf,
} from "@/components/operations/OperationsUi";
import { SimpleBarChart, SimpleFunnel, SimpleLineChart } from "@/components/charts/SimpleCharts";
import { SwitzerlandChoropleth } from "@/components/maps/SwitzerlandChoropleth";
import { getControlCenterDashboard, getPartnerPerformanceRows } from "@/lib/control-center-operations";
import { getAdminWorkspace } from "@/lib/admin-operations";

export const metadata = { title: "Analytics | Control Center" };

export default async function ControlCenterAnalyticsPage() {
  const [dashboard, partners, workspace] = await Promise.all([
    getControlCenterDashboard("12m"),
    getPartnerPerformanceRows(),
    getAdminWorkspace(),
  ]);

  const byInsurer = workspace.commissions.reduce<
    Record<string, { contracts: number; gross: number }>
  >((acc, row) => {
    const key = String(row.insurer ?? "Altro");
    acc[key] ??= { contracts: 0, gross: 0 };
    acc[key].gross += Number(row.gross_commission ?? 0);
    return acc;
  }, {});
  for (const contract of workspace.contracts) {
    const key = String(contract.insurer ?? "Altro");
    byInsurer[key] ??= { contracts: 0, gross: 0 };
    byInsurer[key].contracts += 1;
  }

  const byCategory = workspace.contracts.reduce<Record<string, number>>((acc, row) => {
    const key = String(row.category ?? "Altro");
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <OperationsHeader
        eyebrow="Platform analytics"
        title="Growth · Engagement · Revenue · Geography"
        description="Aggregazioni privacy-safe. Nessuna raccomandazione commerciale automatica."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <SimpleLineChart
          title="Growth — nuovi e cumulativi"
          series={[
            {
              label: "Nuovi",
              values: dashboard.growth.map((r) => Number(r.new_users ?? 0)),
            },
            {
              label: "Cumulativi",
              values: dashboard.growth.map((r) => Number(r.cumulative_users ?? 0)),
              color: "var(--muted-foreground)",
            },
          ]}
        />
        <SimpleFunnel
          title="Engagement funnel"
          steps={dashboard.funnel.map((step) => ({
            id: step.id,
            label: step.label,
            count: Number(step.count ?? 0),
          }))}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <SimpleBarChart
          title="Insurance portfolio — contratti per categoria"
          points={Object.entries(byCategory).map(([label, value]) => ({ label, value }))}
        />
        <SimpleBarChart
          title="Insurer analytics — commissioni lorde"
          points={Object.entries(byInsurer).map(([label, value]) => ({
            label,
            value: Math.round(value.gross),
          }))}
        />
      </div>

      <div className="mt-5">
        <SwitzerlandChoropleth
          title="Geography"
          data={dashboard.cantons}
          metric="grossCommission"
          metrics={["leads", "clients", "contracts", "grossCommission", "atlasRevenue"]}
          showAtlasShare
        />
      </div>

      <div className="mt-5">
        <OperationsPanel title="Broker performance (oggettivo)">
          {!partners.length ? (
            <p className="text-[12px] text-muted">Nessun partner.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[12px]">
                <thead className="text-[10px] uppercase text-muted">
                  <tr>
                    <th className="pb-2">Partner</th>
                    <th className="pb-2">Lead</th>
                    <th className="pb-2">Contratti</th>
                    <th className="pb-2">Conv %</th>
                    <th className="pb-2">Gross</th>
                    <th className="pb-2">ATLAS</th>
                    <th className="pb-2">Broker</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {partners.map((row) => (
                    <tr key={row.id}>
                      <td className="py-2 font-medium">{row.name}</td>
                      <td>{row.leads}</td>
                      <td>{row.contracts}</td>
                      <td>{row.conversion}</td>
                      <td>{formatChf(row.gross)}</td>
                      <td>{formatChf(row.atlas)}</td>
                      <td>{formatChf(row.brokerShare)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </OperationsPanel>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <OperationsPanel title="Health · extraction fail">
          <p className="text-2xl font-semibold">{dashboard.summary.documentsFailed}</p>
        </OperationsPanel>
        <OperationsPanel title="Health · extraction pending">
          <p className="text-2xl font-semibold">{dashboard.summary.documentsProcessing}</p>
        </OperationsPanel>
        <OperationsPanel title="Polizze consumer vs contratti ATLAS">
          <p className="text-[12px] text-muted">
            Polizze caricate: {dashboard.summary.policiesTotal}. Contratti intermediato:{" "}
            {workspace.contracts.length}. Metriche tenute separate.
          </p>
        </OperationsPanel>
      </div>
    </>
  );
}
