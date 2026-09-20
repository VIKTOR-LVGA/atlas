import {
  assignConsultationAction,
} from "@/app/control-center/actions";
import {
  OperationsHeader,
  OperationsPanel,
  formatDate,
  operationsButton,
  operationsInput,
} from "@/components/operations/OperationsUi";
import { getAdminWorkspace } from "@/lib/admin-operations";
import {
  consultationStatusLabel,
  consultationTypeLabel,
} from "@/lib/operations-labels";

export const metadata = { title: "Consulenze | Control Center" };

const BUCKETS = [
  "submitted",
  "assigned",
  "contacted",
  "consultation_scheduled",
  "in_review",
  "quoted",
  "won",
  "lost",
] as const;

export default async function ControlCenterConsultationsPage() {
  const data = await getAdminWorkspace();
  const activeBrokers = data.brokers.filter((b) => b.active);

  return (
    <>
      <OperationsHeader
        eyebrow="Pipeline"
        title="Gestione consulenze"
        description="Assegnazione e riassegnazione partner. Timeline completa sul dettaglio lead partner."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {BUCKETS.map((status) => {
          const count = data.requests.filter((r) => r.status === status).length;
          return (
            <OperationsPanel key={status} title={consultationStatusLabel(status)}>
              <p className="text-2xl font-semibold tabular-nums">{count}</p>
            </OperationsPanel>
          );
        })}
        <OperationsPanel title="Non assegnate">
          <p className="text-2xl font-semibold tabular-nums">
            {data.requests.filter((r) => !r.assigned_broker_id).length}
          </p>
        </OperationsPanel>
      </div>
      <OperationsPanel title="Tutte le richieste">
        <div className="space-y-3">
          {data.requests.map((request) => (
            <form
              key={request.id}
              action={assignConsultationAction}
              className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1.4fr_1fr_auto]"
            >
              <input type="hidden" name="request_id" value={request.id} />
              <div>
                <p className="text-[12px] font-semibold">
                  {request.clientName} · {consultationTypeLabel(request.request_type)}
                </p>
                <p className="text-[10px] text-muted">
                  {consultationStatusLabel(request.status)} · {formatDate(request.updated_at)}
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
              <button className={operationsButton}>Assegna / riassegna</button>
            </form>
          ))}
          {!data.requests.length ? (
            <p className="text-[12px] text-muted">Nessuna consulenza.</p>
          ) : null}
        </div>
      </OperationsPanel>
    </>
  );
}
