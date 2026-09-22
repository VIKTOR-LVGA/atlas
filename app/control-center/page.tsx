import Link from "next/link";
import {
  assignConsultationAction,
  createBrokerAction,
  createCommissionAction,
  createCommissionAdjustmentAction,
  createCommissionAgreementAction,
} from "@/app/control-center/actions";
import {
  OperationsHeader,
  OperationsMetric,
  OperationsPanel,
  formatChf,
  formatDate,
  operationsButton,
  operationsInput,
} from "@/components/operations/OperationsUi";
import { SimpleFunnel, SimpleLineChart } from "@/components/charts/SimpleCharts";
import { SwitzerlandChoropleth } from "@/components/maps/SwitzerlandChoropleth";
import { getControlCenterDashboard } from "@/lib/control-center-operations";
import type { AnalyticsPeriod } from "@/lib/analytics-period";
import {
  commissionStatusLabel,
  commissionTypeLabel,
  consultationStatusLabel,
  consultationTypeLabel,
  contractStatusLabel,
} from "@/lib/operations-labels";

export const metadata = { title: "Control Center | ATLAS" };

const PERIODS: Array<[AnalyticsPeriod, string]> = [
  ["today", "Oggi"],
  ["7d", "7D"],
  ["30d", "30D"],
  ["90d", "90D"],
  ["ytd", "YTD"],
  ["12m", "12M"],
  ["all", "Tutto"],
];

export default async function ControlCenterDashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = (params.period as AnalyticsPeriod) || "30d";
  const data = await getControlCenterDashboard(period);
  const workspace = data.workspace;
  const activeBrokers = workspace.brokers.filter((broker) => broker.active);
  const assignedRequests = workspace.requests.filter((request) => request.assigned_broker_id);
  const s = data.summary;

  return (
    <>
      <OperationsHeader
        eyebrow="ATLAS Control Center"
        title="Broker & Revenue"
        description="Vista executive e governance operativa. Autorizzazione server-side/admin; nessuna azione sensibile è possibile dal solo client."
      />

      <div className="mb-4 flex flex-wrap gap-2 text-[12px]">
        {PERIODS.map(([value, label]) => (
          <Link
            key={value}
            href={`/control-center?period=${value}`}
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
        <OperationsMetric label="Utenti (periodo)" value={String(s.users)} detail={`Totale ${s.usersTotal}`} />
        <OperationsMetric label="Partner attivi" value={String(s.partnersActive)} detail={`Nuovi ${s.partners}`} />
        <OperationsMetric label="Candidature" value={String(s.applicationsPending)} detail="In revisione" />
        <OperationsMetric label="Polizze" value={String(s.policies)} detail={`Totale ${s.policiesTotal}`} />
        <OperationsMetric label="Documenti" value={String(s.documents)} detail={`Fail ${s.documentsFailed}`} />
        <OperationsMetric label="Consulenze" value={String(s.consultations)} />
        <OperationsMetric label="Appuntamenti" value={String(s.appointments)} />
        <OperationsMetric label="Offerte" value={String(s.offers)} />
        <OperationsMetric label="Contratti" value={String(s.contracts)} />
        <OperationsMetric label="Commissioni lorde" value={formatChf(s.gross)} />
        <OperationsMetric label="Revenue ATLAS" value={formatChf(s.atlas)} />
        <OperationsMetric
          label="Quote broker"
          value={formatChf(s.broker)}
          detail={`Clawback ${formatChf(s.clawbacks)}`}
        />
        <OperationsMetric label="Attese" value={formatChf(s.expected)} />
        <OperationsMetric label="Pagate" value={formatChf(s.paid)} />
        <OperationsMetric
          label="Extraction"
          value={String(s.documentsProcessing)}
          detail={`Pending · fail ${s.documentsFailed}`}
        />
        <OperationsMetric
          label="Doc Intelligence"
          value={String(Math.max(0, s.documents - s.documentsFailed))}
          detail={`OK proxy · fail ${s.documentsFailed} (no PII)`}
        />
        <OperationsMetric
          label="Netto storico"
          value={formatChf(workspace.summary.netCommission)}
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <SimpleFunnel
          title="Engagement funnel"
          steps={data.funnel.map((step) => ({
            id: step.id,
            label: step.label,
            count: Number(step.count ?? 0),
          }))}
        />
        <SimpleLineChart
          title="Crescita utenti"
          series={[
            {
              label: "Nuovi",
              values: data.growth.map((row) => Number(row.new_users ?? 0)),
            },
            {
              label: "Cumulativi",
              values: data.growth.map((row) => Number(row.cumulative_users ?? 0)),
              color: "var(--muted-foreground)",
            },
            {
              label: "Nuovi partner",
              values: data.growth.map((row) => Number(row.new_partners ?? 0)),
              color: "var(--accent-strong)",
            },
          ]}
        />
      </div>

      <div className="mt-5">
        <SwitzerlandChoropleth
          title="Svizzera · aggregazioni piattaforma"
          data={data.cantons}
          metric="leads"
          metrics={[
            "users",
            "policies",
            "consultations",
            "contracts",
            "grossCommission",
            "atlasRevenue",
          ]}
          showAtlasShare
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div id="requests">
          <OperationsPanel title="Richieste e assegnazioni">
            <div className="space-y-3">
              {workspace.requests.map((request) => (
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
              {!workspace.requests.length ? (
                <p className="text-[12px] text-muted">Nessuna richiesta.</p>
              ) : null}
            </div>
          </OperationsPanel>
        </div>

        <div id="brokers">
          <OperationsPanel
            title="Broker attivi"
            action={
              <Link href="/control-center/partners" className="text-[12px] text-accent">
                Gestione partner
              </Link>
            }
          >
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              {workspace.brokers.map((broker) => (
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
              {workspace.contracts.map((contract) => (
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
              {workspace.commissions.map((commission) => (
                <option key={commission.id} value={commission.id}>
                  {commission.insurer} · {formatChf(commission.gross_commission)} ·{" "}
                  {commissionTypeLabel(commission.commission_type)}
                </option>
              ))}
            </select>
            <input name="external_reference" className={operationsInput} placeholder="Riferimento esterno" />
            <button className={`${operationsButton} sm:col-span-2`}>Attribuisci con split storico</button>
          </form>
        </OperationsPanel>

        <OperationsPanel title="Rettifica / clawback">
          <form action={createCommissionAdjustmentAction} className="grid gap-2 sm:grid-cols-2">
            <select required name="commission_id" className={operationsInput}>
              <option value="">Commissione</option>
              {workspace.commissions.map((commission) => (
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
              {workspace.contracts.map((contract) => (
                <div key={contract.id} className="rounded-lg border border-border p-3 text-[12px]">
                  <p className="font-semibold">
                    {contract.insurer} · {contract.product}
                    <span className="float-right text-accent">
                      {contractStatusLabel(contract.status)}
                    </span>
                  </p>
                  <p className="mt-1 text-[10px] text-muted">
                    {contract.category} · decorrenza {formatDate(contract.contract_start_date)}
                  </p>
                </div>
              ))}
              {!workspace.contracts.length ? (
                <p className="text-[12px] text-muted">Nessun contratto registrato.</p>
              ) : null}
            </div>
          </OperationsPanel>
        </div>

        <OperationsPanel title="Ledger ricavi">
          <div className="max-h-[32rem] space-y-2 overflow-y-auto">
            {workspace.commissions.map((commission) => (
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
