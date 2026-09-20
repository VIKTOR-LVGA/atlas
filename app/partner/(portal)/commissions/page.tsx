import { OperationsHeader, OperationsPanel, formatChf, formatDate } from "@/components/operations/OperationsUi";
import { getBrokerCommissionLedger, getBrokerWorkspace } from "@/lib/broker-operations";
import { commissionStatusLabel, commissionTypeLabel } from "@/lib/operations-labels";

export default async function BrokerCommissionsPage() {
  const [ledger, workspace] = await Promise.all([
    getBrokerCommissionLedger(),
    getBrokerWorkspace(),
  ]);
  return (
    <>
      <OperationsHeader
        eyebrow="Compensi broker"
        title="Commissioni"
        description="Sono esposte solo la quota broker e le relative rettifiche. La quota ATLAS e i ricavi di altri broker non sono accessibili."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Attese</p>
          <p className="mt-2 text-xl font-semibold">{formatChf(workspace.revenue.expectedShare)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Pagate</p>
          <p className="mt-2 text-xl font-semibold">{formatChf(workspace.revenue.paidShare)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Netto</p>
          <p className="mt-2 text-xl font-semibold">{formatChf(workspace.revenue.netBrokerRevenue)}</p>
        </div>
      </div>
      <OperationsPanel title="Ledger personale">
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
                      <p className="text-[10px] text-muted">{row.product ?? row.category}</p>
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
      </OperationsPanel>
    </>
  );
}
