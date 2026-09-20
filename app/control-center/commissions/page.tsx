import {
  createCommissionAction,
  createCommissionAdjustmentAction,
  createCommissionAgreementAction,
} from "@/app/control-center/actions";
import {
  OperationsHeader,
  OperationsMetric,
  OperationsPanel,
  formatChf,
  operationsButton,
  operationsInput,
} from "@/components/operations/OperationsUi";
import { getAdminWorkspace } from "@/lib/admin-operations";
import {
  commissionStatusLabel,
  commissionTypeLabel,
  consultationStatusLabel,
} from "@/lib/operations-labels";

export const metadata = { title: "Commissioni | Control Center" };

export default async function ControlCenterCommissionsPage() {
  const data = await getAdminWorkspace();
  const activeBrokers = data.brokers.filter((b) => b.active);
  const assignedRequests = data.requests.filter((r) => r.assigned_broker_id);

  return (
    <>
      <OperationsHeader
        eyebrow="Ledger"
        title="Commissioni"
        description="Solo append: nessuna modifica distruttiva dello storico. Audit via platform_audit_log / eventi commission."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OperationsMetric label="Lorde" value={formatChf(data.summary.grossCommission)} />
        <OperationsMetric label="ATLAS" value={formatChf(data.summary.atlasRevenue)} />
        <OperationsMetric label="Broker" value={formatChf(data.summary.brokerRevenue)} />
        <OperationsMetric label="Clawback" value={formatChf(data.summary.clawbacks)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <OperationsPanel title="Nuovo accordo">
          <form action={createCommissionAgreementAction} className="grid gap-2 sm:grid-cols-2">
            <select required name="broker_id" className={operationsInput}>
              <option value="">Broker</option>
              {activeBrokers.map((broker) => (
                <option key={broker.id} value={broker.id}>
                  {broker.display_name}
                </option>
              ))}
            </select>
            <input required type="date" name="effective_from" className={operationsInput} />
            <input
              required
              type="number"
              step="0.0001"
              name="atlas_percentage"
              defaultValue="40"
              className={operationsInput}
            />
            <input
              required
              type="number"
              step="0.0001"
              name="broker_percentage"
              defaultValue="60"
              className={operationsInput}
            />
            <button className={`${operationsButton} sm:col-span-2`}>Salva accordo</button>
          </form>
        </OperationsPanel>

        <OperationsPanel title="Entry manuale">
          <form action={createCommissionAction} className="grid gap-2 sm:grid-cols-2">
            <select required name="request_id" className={operationsInput}>
              <option value="">Richiesta</option>
              {assignedRequests.map((request) => (
                <option key={request.id} value={request.id}>
                  {request.clientName} · {consultationStatusLabel(request.status)}
                </option>
              ))}
            </select>
            <input required name="insurer" className={operationsInput} placeholder="Assicuratore" />
            <input required name="category" className={operationsInput} placeholder="Categoria" />
            <input
              required
              type="number"
              step="0.01"
              name="gross_commission"
              className={operationsInput}
              placeholder="Lordo"
            />
            <select name="commission_type" className={operationsInput}>
              <option value="acquisition">Acquisizione</option>
              <option value="renewal">Rinnovo</option>
            </select>
            <select name="status" className={operationsInput}>
              <option value="expected">Attesa</option>
              <option value="paid">Pagata</option>
            </select>
            <button className={`${operationsButton} sm:col-span-2`}>Registra</button>
          </form>
        </OperationsPanel>

        <OperationsPanel title="Payment / clawback / correction">
          <form action={createCommissionAdjustmentAction} className="grid gap-2 sm:grid-cols-2">
            <select required name="commission_id" className={operationsInput}>
              <option value="">Commissione</option>
              {data.commissions.map((commission) => (
                <option key={commission.id} value={commission.id}>
                  {commission.insurer} · {formatChf(commission.gross_commission)}
                </option>
              ))}
            </select>
            <select required name="adjustment_type" className={operationsInput}>
              <option value="clawback">Clawback</option>
              <option value="correction">Correzione</option>
              <option value="bonus">Bonus</option>
              <option value="manual_adjustment">Rettifica</option>
            </select>
            <input required type="number" step="0.01" name="amount" className={operationsInput} />
            <input required name="reason" className={operationsInput} placeholder="Motivo" />
            <button className={`${operationsButton} sm:col-span-2`}>Append al ledger</button>
          </form>
        </OperationsPanel>

        <OperationsPanel title="Ledger">
          <div className="max-h-[28rem] space-y-2 overflow-y-auto">
            {data.commissions.map((commission) => (
              <div key={commission.id} className="rounded-lg border border-border p-3 text-[12px]">
                <p className="font-semibold">
                  {commission.insurer} · {commission.product ?? commission.category}
                  <span className="float-right">{formatChf(commission.gross_commission)}</span>
                </p>
                <p className="mt-1 text-[10px] text-muted">
                  ATLAS {formatChf(commission.atlas_share)} · Broker{" "}
                  {formatChf(commission.broker_share)} ·{" "}
                  {commissionTypeLabel(commission.commission_type)} ·{" "}
                  {commissionStatusLabel(commission.status)}
                </p>
              </div>
            ))}
            {!data.commissions.length ? (
              <p className="text-[12px] text-muted">Ledger vuoto.</p>
            ) : null}
          </div>
        </OperationsPanel>
      </div>
    </>
  );
}
