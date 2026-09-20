import {
  assignConsultationAction,
  createBrokerAction,
  createCommissionAction,
  createCommissionAdjustmentAction,
  createCommissionAgreementAction,
} from "@/app/admin/actions";
import {
  OperationsHeader,
  OperationsMetric,
  OperationsPanel,
  formatChf,
  formatDate,
  operationsButton,
  operationsInput,
} from "@/components/operations/OperationsUi";
import { getAdminWorkspace } from "@/lib/admin-operations";
import {
  commissionStatusLabel,
  commissionTypeLabel,
  consultationStatusLabel,
  consultationTypeLabel,
  contractStatusLabel,
} from "@/lib/operations-labels";

export const metadata = { title: "Admin | ATLAS" };

export default async function AdminDashboard() {
  const data = await getAdminWorkspace();
  const activeBrokers = data.brokers.filter((broker) => broker.active);
  const assignedRequests = data.requests.filter((request) => request.assigned_broker_id);

  return (
    <>
      <OperationsHeader
        eyebrow="ATLAS control plane"
        title="Broker & Revenue"
        description="Governance centralizzata di assegnazioni, contratti e attribuzione economica. Ogni split resta storico e ogni rettifica viene aggiunta al ledger."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <OperationsMetric label="Commissioni lorde" value={formatChf(data.summary.grossCommission)} />
        <OperationsMetric label="Revenue ATLAS" value={formatChf(data.summary.atlasRevenue)} />
        <OperationsMetric label="Quote broker" value={formatChf(data.summary.brokerRevenue)} />
        <OperationsMetric
          label="Netto"
          value={formatChf(data.summary.netCommission)}
          detail={`Clawback ${formatChf(data.summary.clawbacks)}`}
        />
        <OperationsMetric
          label="Contratti"
          value={String(data.summary.contractsCount)}
          detail={`${data.summary.wonClients} clienti`}
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div id="requests">
          <OperationsPanel title="Richieste e assegnazioni">
            <div className="space-y-3">
              {data.requests.map((request) => (
                <form
                  action={assignConsultationAction}
                  key={request.id}
                  className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <input type="hidden" name="request_id" value={request.id} />
                  <div>
                    <p className="text-[12px] font-semibold">
                      {request.clientName} · {consultationTypeLabel(request.request_type)}
                    </p>
                    <p className="text-[10px] text-muted">
                      {consultationStatusLabel(request.status)} · {formatDate(request.created_at)}
                    </p>
                  </div>
                  <select
                    name="broker_id"
                    defaultValue={request.assigned_broker_id ?? ""}
                    className={operationsInput}
                  >
                    <option value="">Non assegnata</option>
                    {activeBrokers.map((broker) => (
                      <option key={broker.id} value={broker.id}>
                        {broker.display_name}
                      </option>
                    ))}
                  </select>
                  <button className={operationsButton}>Assegna</button>
                </form>
              ))}
              {!data.requests.length ? (
                <p className="text-[12px] text-muted">Nessuna richiesta.</p>
              ) : null}
            </div>
          </OperationsPanel>
        </div>

        <div id="brokers">
          <OperationsPanel title="Broker attivi">
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              {data.brokers.map((broker) => (
                <div key={broker.id} className="rounded-lg border border-border p-3 text-[12px]">
                  <span className="font-semibold">{broker.display_name}</span>
                  <span
                    className={`float-right text-[10px] ${broker.active ? "text-[var(--success-text)]" : "text-muted"}`}
                  >
                    {broker.active ? "attivo" : "inattivo"}
                  </span>
                  <p className="mt-1 text-[10px] text-muted">
                    {broker.organization_name ?? broker.email ?? broker.display_name}
                  </p>
                </div>
              ))}
            </div>
            <details>
              <summary className="cursor-pointer text-[12px] font-semibold text-accent">
                Registra nuovo broker
              </summary>
              <form action={createBrokerAction} className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="sm:col-span-2 text-[10px] text-muted">
                  Account ATLAS del broker
                  <input
                    required
                    name="auth_user_id"
                    className={operationsInput}
                    placeholder="Identificativo account (Supabase Authentication)"
                  />
                  <span className="mt-1 block">
                    Il broker deve prima registrarsi su ATLAS con la sua email. Poi incolla qui
                    il suo identificativo account.
                  </span>
                </label>
                <input required name="display_name" className={operationsInput} placeholder="Nome visualizzato" />
                <input required type="email" name="email" className={operationsInput} placeholder="Email di lavoro" />
                <input name="legal_name" className={operationsInput} placeholder="Ragione sociale" />
                <input name="organization_name" className={operationsInput} placeholder="Organizzazione" />
                <input name="phone" className={operationsInput} placeholder="Telefono" />
                <select name="active" className={operationsInput} defaultValue="active">
                  <option value="active">Attivo</option>
                  <option value="inactive">Inattivo</option>
                </select>
                <button className={`${operationsButton} sm:col-span-2`}>Crea e assegna ruolo broker</button>
              </form>
            </details>
          </OperationsPanel>
        </div>
      </div>

      <div id="revenue" className="mt-5 grid gap-5 xl:grid-cols-2">
        <OperationsPanel title="Nuovo accordo commissionale">
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
            <input type="date" name="effective_to" className={operationsInput} />
            <select name="scope" className={operationsInput}>
              <option value="global">Globale</option>
              <option value="category">Categoria</option>
              <option value="insurer">Assicuratore</option>
              <option value="category_insurer">Categoria + assicuratore</option>
            </select>
            <input
              required
              type="number"
              step="0.0001"
              min="0"
              max="100"
              name="atlas_percentage"
              defaultValue="40"
              className={operationsInput}
              placeholder="ATLAS %"
            />
            <input
              required
              type="number"
              step="0.0001"
              min="0"
              max="100"
              name="broker_percentage"
              defaultValue="60"
              className={operationsInput}
              placeholder="Broker %"
            />
            <input name="category" className={operationsInput} placeholder="Categoria (se scope)" />
            <input name="insurer" className={operationsInput} placeholder="Assicuratore (se scope)" />
            <textarea name="notes" className={`${operationsInput} sm:col-span-2`} placeholder="Note" />
            <button className={`${operationsButton} sm:col-span-2`}>Salva versione accordo</button>
          </form>
        </OperationsPanel>

        <OperationsPanel title="Registra commissione">
          <form action={createCommissionAction} className="grid gap-2 sm:grid-cols-2">
            <select required name="request_id" className={operationsInput}>
              <option value="">Richiesta assegnata</option>
              {assignedRequests.map((request) => (
                <option key={request.id} value={request.id}>
                  {request.clientName} · {consultationStatusLabel(request.status)}
                </option>
              ))}
            </select>
            <select name="contract_id" className={operationsInput}>
              <option value="">Contratto facoltativo</option>
              {data.contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.insurer} · {contract.product}
                </option>
              ))}
            </select>
            <input required name="insurer" className={operationsInput} placeholder="Assicuratore" />
            <input name="product" className={operationsInput} placeholder="Prodotto" />
            <input required name="category" className={operationsInput} placeholder="Categoria" />
            <select name="commission_type" className={operationsInput}>
              <option value="acquisition">Acquisizione</option>
              <option value="renewal">Rinnovo</option>
              <option value="recurring">Ricorrente</option>
              <option value="bonus">Bonus</option>
              <option value="other">Altro</option>
            </select>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              name="gross_commission"
              className={operationsInput}
              placeholder="Lordo CHF"
            />
            <input
              type="number"
              step="0.0001"
              min="0"
              max="100"
              name="commission_rate"
              className={operationsInput}
              placeholder="Tasso %"
            />
            <label className="text-[10px] text-muted">
              Data maturazione
              <input type="datetime-local" name="earned_at" className={operationsInput} />
            </label>
            <select name="status" className={operationsInput}>
              <option value="expected">Attesa</option>
              <option value="earned">Maturata</option>
              <option value="paid">Pagata</option>
            </select>
            <select name="parent_commission_id" className={operationsInput}>
              <option value="">Commissione padre (rinnovo)</option>
              {data.commissions.map((commission) => (
                <option key={commission.id} value={commission.id}>
                  {commission.insurer} · {formatChf(commission.gross_commission)} ·{" "}
                  {commissionTypeLabel(commission.commission_type)}
                </option>
              ))}
            </select>
            <input name="external_reference" className={operationsInput} placeholder="Riferimento esterno" />
            <p className="sm:col-span-2 text-[10px] text-muted">
              Se lo stato è Pagata, la data di maturazione vale anche come data di pagamento. Per un
              rinnovo seleziona la commissione dell&apos;anno precedente.
            </p>
            <button className={`${operationsButton} sm:col-span-2`}>Attribuisci con split storico</button>
          </form>
        </OperationsPanel>

        <OperationsPanel title="Rettifica / clawback">
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
              <option value="manual_adjustment">Rettifica manuale</option>
            </select>
            <input
              required
              type="number"
              step="0.01"
              name="amount"
              className={operationsInput}
              placeholder="Importo (negativo per clawback)"
            />
            <input required name="reason" className={operationsInput} placeholder="Motivazione" />
            <button className={`${operationsButton} sm:col-span-2`}>Aggiungi al ledger</button>
          </form>
        </OperationsPanel>

        <div id="contracts">
          <OperationsPanel title="Contratti conclusi">
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {data.contracts.map((contract) => (
                <div key={contract.id} className="rounded-lg border border-border p-3 text-[12px]">
                  <p className="font-semibold">
                    {contract.insurer} · {contract.product}
                    <span className="float-right text-accent">{contractStatusLabel(contract.status)}</span>
                  </p>
                  <p className="mt-1 text-[10px] text-muted">
                    {contract.category} · decorrenza {formatDate(contract.contract_start_date)}
                  </p>
                </div>
              ))}
              {!data.contracts.length ? (
                <p className="text-[12px] text-muted">Nessun contratto registrato.</p>
              ) : null}
            </div>
          </OperationsPanel>
        </div>

        <OperationsPanel title="Ledger ricavi">
          <div className="max-h-[32rem] space-y-2 overflow-y-auto">
            {data.commissions.map((commission) => (
              <div key={commission.id} className="rounded-lg border border-border p-3 text-[12px]">
                <p className="font-semibold">
                  {commission.insurer} · {commission.product ?? commission.category}
                  <span className="float-right">{formatChf(commission.gross_commission)}</span>
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-muted">
                  <span>ATLAS {formatChf(commission.atlas_share)}</span>
                  <span>Broker {formatChf(commission.broker_share)}</span>
                  <span>
                    {commissionTypeLabel(commission.commission_type)} ·{" "}
                    {commissionStatusLabel(commission.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </OperationsPanel>
      </div>
    </>
  );
}
