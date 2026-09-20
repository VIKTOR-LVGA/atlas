import { notFound } from "next/navigation";
import {
  addBrokerNoteAction,
  createContractAction,
  createOfferAction,
  scheduleAppointmentAction,
  transitionLeadAction,
  updateOfferStatusAction,
} from "@/app/partner/actions";
import {
  OperationsHeader,
  OperationsPanel,
  formatChf,
  formatDate,
  operationsButton,
  operationsInput,
} from "@/components/operations/OperationsUi";
import { getBrokerLeadDetail } from "@/lib/broker-operations";
import {
  actorTypeLabel,
  appointmentChannelLabel,
  appointmentStatusLabel,
  consultationStatusLabel,
  contactMethodLabel,
  contractStatusLabel,
  eventTypeLabel,
  offerStatusLabel,
  premiumFrequencyLabel,
  documentTypeLabel,
} from "@/lib/operations-labels";

const nextStatuses: Record<string, string[]> = {
  assigned: ["contacted", "lost", "cancelled"],
  contacted: ["consultation_scheduled", "lost", "cancelled"],
  consultation_scheduled: ["in_review", "lost", "cancelled"],
  in_review: ["quoted", "lost", "completed"],
  quoted: ["won", "lost", "in_review"],
};

export default async function BrokerLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getBrokerLeadDetail(id);
  if (!data) notFound();
  const request = data.request;
  const profile = data.profile as {
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  const transitions = nextStatuses[String(request.status)] ?? [];
  return (
    <>
      <OperationsHeader
        eyebrow={`Lead · ${consultationStatusLabel(String(request.status))}`}
        title={profile?.full_name ?? "Cliente ATLAS"}
        description="Workspace operativo con i dati di contatto e le sole risorse che il cliente ha scelto di condividere."
      />
      <div className="mb-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <OperationsPanel title="Richiesta e contatto">
          <dl className="grid gap-3 text-[12px] sm:grid-cols-2">
            <div>
              <dt className="text-muted">Email</dt>
              <dd>{profile?.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Telefono</dt>
              <dd>{profile?.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Preferenza</dt>
              <dd>{contactMethodLabel(String(request.preferred_contact_method ?? ""))}</dd>
            </div>
            <div>
              <dt className="text-muted">Orario</dt>
              <dd>{String(request.preferred_contact_time ?? "—")}</dd>
            </div>
          </dl>
          {request.message ? (
            <p className="mt-4 rounded-lg bg-card-muted p-3 text-[12px] leading-relaxed">
              {String(request.message)}
            </p>
          ) : null}
        </OperationsPanel>
        <OperationsPanel title="Prossimo passo">
          <form action={transitionLeadAction} className="space-y-3">
            <input type="hidden" name="request_id" value={id} />
            <select name="status" className={operationsInput} disabled={!transitions.length}>
              {transitions.map((status) => (
                <option key={status} value={status}>
                  {consultationStatusLabel(status)}
                </option>
              ))}
            </select>
            <button disabled={!transitions.length} className={`${operationsButton} w-full`}>
              {transitions.length ? "Aggiorna stato" : "Pipeline conclusa"}
            </button>
          </form>
        </OperationsPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <OperationsPanel title="Risorse condivise esplicitamente">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase text-muted">Polizze</p>
              {data.resources.policies.map((policy) => (
                <div key={String(policy.id)} className="mb-2 rounded-lg border border-border p-3 text-[12px]">
                  <span className="font-semibold">
                    {String(policy.provider)} · {String(policy.policy_type)}
                  </span>
                  <p className="text-[10px] text-muted">
                    {String(policy.policy_number ?? "senza numero")} · {formatChf(policy.premium_amount as number)}
                  </p>
                </div>
              ))}
              {!data.resources.policies.length ? (
                <p className="text-[11px] text-muted">Nessuna polizza condivisa.</p>
              ) : null}
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase text-muted">Documenti</p>
              {data.resources.documents.map((document) => (
                <div key={String(document.id)} className="mb-2 rounded-lg border border-border p-3 text-[12px]">
                  <span className="font-semibold">{String(document.file_name)}</span>
                  <p className="text-[10px] text-muted">{documentTypeLabel(String(document.document_type))}</p>
                </div>
              ))}
              {!data.resources.documents.length ? (
                <p className="text-[11px] text-muted">Nessun documento condiviso.</p>
              ) : null}
            </div>
          </div>
        </OperationsPanel>
        <OperationsPanel title="Note interne">
          <form action={addBrokerNoteAction} className="mb-4 space-y-2">
            <input type="hidden" name="request_id" value={id} />
            <textarea
              required
              name="content"
              rows={3}
              maxLength={8000}
              className={operationsInput}
              placeholder="Nota visibile solo a te e agli admin"
            />
            <button className={operationsButton}>Aggiungi nota</button>
          </form>
          <div className="space-y-2">
            {data.notes.map((note) => (
              <div key={note.id} className="rounded-lg bg-card-muted p-3 text-[12px]">
                <p>{note.content}</p>
                <p className="mt-1 text-[10px] text-muted">{formatDate(note.created_at)}</p>
              </div>
            ))}
          </div>
        </OperationsPanel>

        <OperationsPanel title="Appuntamenti">
          <form action={scheduleAppointmentAction} className="grid gap-2 sm:grid-cols-2">
            <input type="hidden" name="request_id" value={id} />
            <input required type="datetime-local" name="scheduled_at" className={operationsInput} />
            <select name="channel" className={operationsInput}>
              <option value="video">Video</option>
              <option value="phone">Telefono</option>
              <option value="in_person">In presenza</option>
            </select>
            <input name="location_or_link" className={operationsInput} placeholder="Link o luogo" />
            <input
              name="duration_minutes"
              type="number"
              min="5"
              max="480"
              defaultValue="45"
              className={operationsInput}
            />
            <button className={`${operationsButton} sm:col-span-2`}>Pianifica</button>
          </form>
          <div className="mt-4 space-y-2">
            {data.appointments.map((appointment) => (
              <div key={appointment.id} className="rounded-lg border border-border p-3 text-[12px]">
                <span className="font-semibold">{formatDate(appointment.scheduled_at)}</span>
                <span className="float-right text-accent">
                  {appointmentStatusLabel(String(appointment.status))}
                </span>
                <p className="text-[10px] text-muted">
                  {appointmentChannelLabel(String(appointment.channel))} ·{" "}
                  {appointment.duration_minutes ?? "—"} min
                </p>
              </div>
            ))}
          </div>
        </OperationsPanel>
        <OperationsPanel title="Offerte">
          <form action={createOfferAction} className="grid gap-2 sm:grid-cols-2">
            <input type="hidden" name="request_id" value={id} />
            <input required name="insurer" className={operationsInput} placeholder="Assicuratore" />
            <input required name="product" className={operationsInput} placeholder="Prodotto" />
            <input required name="category" className={operationsInput} placeholder="Categoria" />
            <input
              name="premium_amount"
              type="number"
              min="0"
              step="0.01"
              className={operationsInput}
              placeholder="Premio CHF"
            />
            <select name="premium_frequency" className={operationsInput}>
              <option value="annual">Annuale</option>
              <option value="monthly">Mensile</option>
              <option value="quarterly">Trimestrale</option>
              <option value="semiannual">Semestrale</option>
            </select>
            <button className={operationsButton}>Crea bozza</button>
          </form>
          <div className="mt-4 space-y-2">
            {data.offers.map((offer) => (
              <div key={offer.id} className="rounded-lg border border-border p-3 text-[12px]">
                <span className="font-semibold">
                  {offer.insurer} · {offer.product}
                </span>
                <span className="float-right text-accent">{offerStatusLabel(String(offer.status))}</span>
                <p className="text-[10px] text-muted">
                  {formatChf(offer.premium_amount)} / {premiumFrequencyLabel(String(offer.premium_frequency ?? ""))}
                </p>
                <form action={updateOfferStatusAction} className="mt-2 flex flex-wrap gap-2">
                  <input type="hidden" name="request_id" value={id} />
                  <input type="hidden" name="offer_id" value={offer.id} />
                  {offer.status === "draft" ? (
                    <button name="status" value="proposed" className="text-[10px] font-medium text-accent">
                      Invia proposta
                    </button>
                  ) : null}
                  {offer.status === "proposed" ? (
                    <>
                      <button
                        name="status"
                        value="accepted"
                        className="text-[10px] font-medium text-[var(--success-text)]"
                      >
                        Accetta
                      </button>
                      <button name="status" value="rejected" className="text-[10px] text-[var(--danger-text)]">
                        Rifiuta
                      </button>
                    </>
                  ) : null}
                </form>
              </div>
            ))}
          </div>
        </OperationsPanel>
        <OperationsPanel title="Contratti">
          <form action={createContractAction} className="grid gap-2 sm:grid-cols-2">
            <input type="hidden" name="request_id" value={id} />
            <select name="offer_id" className={operationsInput}>
              <option value="">Nessuna offerta collegata</option>
              {data.offers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.insurer} · {offer.product}
                </option>
              ))}
            </select>
            <input required name="insurer" className={operationsInput} placeholder="Assicuratore" />
            <input required name="product" className={operationsInput} placeholder="Prodotto" />
            <input required name="category" className={operationsInput} placeholder="Categoria" />
            <input name="policy_number" className={operationsInput} placeholder="Numero polizza esterno" />
            <input required type="date" name="start_date" className={operationsInput} />
            <input type="date" name="end_date" className={operationsInput} />
            <button className={operationsButton}>Registra contratto</button>
          </form>
          <div className="mt-4 space-y-2">
            {data.contracts.map((contract) => (
              <div key={contract.id} className="rounded-lg border border-border p-3 text-[12px]">
                <span className="font-semibold">
                  {contract.insurer} · {contract.product}
                </span>
                <span className="float-right text-accent">{contractStatusLabel(String(contract.status))}</span>
                <p className="text-[10px] text-muted">Dal {formatDate(contract.contract_start_date)}</p>
              </div>
            ))}
          </div>
        </OperationsPanel>
        <OperationsPanel title="Storico pratica">
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {data.events.map((event) => (
              <div key={event.id} className="border-l-2 border-accent-soft pl-3 text-[11px]">
                <p className="font-medium">{eventTypeLabel(String(event.event_type))}</p>
                <p className="text-muted">
                  {actorTypeLabel(String(event.actor_type))} · {formatDate(event.created_at)}
                </p>
              </div>
            ))}
          </div>
        </OperationsPanel>
      </div>
    </>
  );
}
