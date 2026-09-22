import { Wallet } from "lucide-react";
import {
  OperationsHeader,
  OperationsPanel,
  formatChf,
  formatDate,
} from "@/components/operations/OperationsUi";
import { PartnerEmptyState } from "@/components/partner/PartnerEmptyState";
import { SimpleLineChart } from "@/components/charts/SimpleCharts";
import { getBrokerCommissionLedger, getBrokerWorkspace } from "@/lib/broker-operations";
import { commissionStatusLabel, commissionTypeLabel } from "@/lib/operations-labels";

export const metadata = { title: "Commissioni | Partner" };

export default async function BrokerCommissionsPage() {
  const [ledger, workspace] = await Promise.all([
    getBrokerCommissionLedger(),
    getBrokerWorkspace(),
  ]);

  const renewals = ledger
    .filter((row: { commission_type?: string }) => row.commission_type === "renewal")
    .reduce(
      (sum: number, row: { net_broker_share?: number | string }) =>
        sum + Number(row.net_broker_share ?? 0),
      0
    );

  const monthly = Array.from({ length: 12 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const rows = ledger.filter((row: { earned_at?: string | null; created_at?: string }) => {
      const stamp = String(row.earned_at ?? row.created_at ?? "").slice(0, 7);
      return stamp === key;
    });
    return {
      key,
      broker: rows.reduce(
        (sum: number, row: { broker_share?: number | string }) =>
          sum + Number(row.broker_share ?? 0),
        0
      ),
      paid: rows
        .filter((row: { status?: string }) => row.status === "paid")
        .reduce(
          (sum: number, row: { net_broker_share?: number | string }) =>
            sum + Number(row.net_broker_share ?? 0),
          0
        ),
    };
  });

  const expectedRows = ledger.filter(
    (row: { status?: string }) => row.status === "expected" || row.status === "earned"
  );
  const nowMs = new Date().getTime();
  const forecast = [30, 60, 90].map((days) => {
    const cutoff = nowMs + days * 24 * 60 * 60 * 1000;
    const amount = expectedRows
      .filter((row: { earned_at?: string | null; created_at?: string }) => {
        const stamp = new Date(String(row.earned_at ?? row.created_at ?? "")).getTime();
        return !Number.isNaN(stamp) && stamp <= cutoff;
      })
      .reduce(
        (sum: number, row: { net_broker_share?: number | string }) =>
          sum + Number(row.net_broker_share ?? 0),
        0
      );
    return { days, amount };
  });
  const hasForecastBasis = expectedRows.length > 0;

  return (
    <>
      <OperationsHeader
        eyebrow="Centro commissioni"
        title="Commissioni"
        description="Solo la tua quota broker e le rettifiche. La quota ATLAS non è visibile qui."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Attese</p>
          <p className="mt-2 text-xl font-semibold">
            {formatChf(workspace.revenue.expectedShare)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Maturate / lorde</p>
          <p className="mt-2 text-xl font-semibold">
            {formatChf(workspace.revenue.brokerShare)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Pagate</p>
          <p className="mt-2 text-xl font-semibold">
            {formatChf(workspace.revenue.paidShare)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Storni</p>
          <p className="mt-2 text-xl font-semibold">
            {formatChf(workspace.revenue.clawbackShare)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Rinnovi (netto)</p>
          <p className="mt-2 text-xl font-semibold">{formatChf(renewals)}</p>
        </div>
      </div>

      <div className="mb-5 grid gap-5 xl:grid-cols-2">
        <SimpleLineChart
          title="Andamento mensile — quota broker"
          series={[
            { label: "Quota broker", values: monthly.map((row) => row.broker) },
            {
              label: "Pagate",
              values: monthly.map((row) => row.paid),
              color: "var(--muted-foreground)",
            },
          ]}
          emptyLabel="Nessuna serie commissionale nel periodo."
        />
        <OperationsPanel title="Prossimi incassi (fattuale)">
          {!hasForecastBasis ? (
            <p className="text-[12px] text-muted">
              Nessuna commissione attesa/maturata con data utilizzabile. Nessuna previsione
              inventata.
            </p>
          ) : (
            <dl className="space-y-3 text-[12px]">
              {forecast.map((row) => (
                <div
                  key={row.days}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-3"
                >
                  <dt className="text-muted">{row.days} giorni</dt>
                  <dd className="font-semibold tabular-nums">{formatChf(row.amount)}</dd>
                </div>
              ))}
              <p className="text-[11px] text-muted">
                Somma delle sole voci già registrate come attese/maturate, entro la data
                di maturazione nota. Non è una probabilità commerciale.
              </p>
            </dl>
          )}
        </OperationsPanel>
      </div>

      <OperationsPanel title="Ledger personale">
        {!ledger.length ? (
          <PartnerEmptyState
            icon={Wallet}
            title="Nessuna commissione"
            description="Le commissioni appariranno quando i contratti verranno attribuiti."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[12px]">
              <thead className="text-[10px] uppercase text-muted">
                <tr>
                  <th className="pb-3">Prodotto</th>
                  <th className="pb-3">Tipo</th>
                  <th className="pb-3">Stato</th>
                  <th className="pb-3">Quota</th>
                  <th className="pb-3">Rettifiche</th>
                  <th className="pb-3">Netto</th>
                  <th className="pb-3">Maturata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ledger.map(
                  (row: {
                    id: string;
                    insurer: string;
                    product: string | null;
                    category: string;
                    commission_type: string;
                    status: string;
                    broker_share: number | string;
                    broker_adjustments: number | string;
                    net_broker_share: number | string;
                    earned_at: string | null;
                  }) => (
                    <tr key={row.id}>
                      <td className="py-3">
                        <span className="font-semibold">{row.insurer}</span>
                        <p className="text-[10px] text-muted">
                          {row.product ?? row.category}
                        </p>
                      </td>
                      <td>{commissionTypeLabel(row.commission_type)}</td>
                      <td>{commissionStatusLabel(row.status)}</td>
                      <td>{formatChf(row.broker_share)}</td>
                      <td>{formatChf(row.broker_adjustments)}</td>
                      <td className="font-semibold">{formatChf(row.net_broker_share)}</td>
                      <td>{formatDate(row.earned_at)}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </OperationsPanel>
    </>
  );
}
