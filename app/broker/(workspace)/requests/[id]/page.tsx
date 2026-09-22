import { notFound } from "next/navigation";
import {
  addBrokerNoteAction,
  analyzeOfferQuoteAction,
  brokerRespondAppointmentAction,
  brokerRespondAssignmentAction,
  createContractAction,
  createOfferAction,
  createOfferRevisionAction,
  scheduleAppointmentAction,
  sendConsultationMessageAction,
  transitionLeadAction,
  updateOfferStatusAction,
  uploadOfferQuotePdfAction,
  verifyOfferQuoteAction,
} from "@/app/broker/actions";
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
        eyebrow={`Richiesta ATLAS · ${consultationStatusLabel(String(request.status))}`}
        title={profile?.full_name ?? "Cliente ATLAS"}
        description="Pratica ATLAS: vedi solo i dati di contatto e le risorse che il cliente ha scelto di condividere per questa richiesta."
      />

      {(request as { broker_acceptance?: string | null }).broker_acceptance !==
        "accepted" &&
      ["assigned", "submitted"].includes(String(request.status)) ? (
        <div className="mb-5">
          <OperationsPanel title="Nuova assegnazione ATLAS">
            <p className="mb-3 text-[12px] text-muted">
              ATLAS ti ha assegnato questa richiesta. Prendila in carico o dichiara
              indisponibilità (ATLAS potrà riassegnare).
            </p>
            <div className="flex flex-wrap gap-2">
              <form action={brokerRespondAssignmentAction}>
                <input type="hidden" name="request_id" value={id} />
                <input type="hidden" name="decision" value="accepted" />
                <button className={`${operationsButton}`}>Prendi in carico</button>
              </form>
              <form
                action={brokerRespondAssignmentAction}
                className="flex flex-wrap gap-2"
              >
                <input type="hidden" name="request_id" value={id} />
                <input type="hidden" name="decision" value="declined" />
                <input
                  name="reason"
                  placeholder="Motivo opzionale (interno)"
                  className={`${operationsInput} min-w-[12rem]`}
                />
                <button className="rounded-lg border border-border px-3 py-2 text-[12px]">
                  Non disponibile
                </button>
              </form>
            </div>
          </OperationsPanel>
        </div>
      ) : null}

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
              <option value="other">Altro</option>
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
                {String(appointment.status) === "counter_proposed" ? (
                  <form action={brokerRespondAppointmentAction} className="mt-2 flex flex-wrap gap-2">
                    <input type="hidden" name="request_id" value={id} />
                    <input type="hidden" name="appointment_id" value={String(appointment.id)} />
                    <button name="action" value="accept" className="text-[10px] font-medium text-accent">
                      Accetta controproposta
                    </button>
                    <button name="action" value="reject" className="text-[10px] text-muted">
                      Rifiuta
                    </button>
                  </form>
                ) : null}
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
            <select name="source_policy_id" className={operationsInput}>
              <option value="">Confronta con polizza…</option>
              {data.resources.policies.map((policy) => (
                <option key={String(policy.id)} value={String(policy.id)}>
                  {String(policy.provider)} · {String(policy.policy_type)}
                </option>
              ))}
            </select>
            <input
              name="consumer_notes"
              className={`${operationsInput} sm:col-span-2`}
              placeholder="Nota visibile al cliente"
            />
            <button className={`${operationsButton} sm:col-span-2`}>Nuova offerta (bozza)</button>
          </form>
          <div className="mt-4 space-y-2">
            {data.offers.map((offer) => (
              <div key={offer.id} className="rounded-lg border border-border p-3 text-[12px]">
                <span className="font-semibold">
                  {offer.insurer} · {offer.product}
                  {offer.version ? ` · v${offer.version}` : ""}
                </span>
                <span className="float-right text-accent">{offerStatusLabel(String(offer.status))}</span>
                <p className="text-[10px] text-muted">
                  {formatChf(offer.premium_amount)} / {premiumFrequencyLabel(String(offer.premium_frequency ?? ""))}
                  {offer.extraction_status
                    ? ` · Estrazione: ${String(offer.extraction_status)}`
                    : ""}
                </p>
                {offer.extraction_error ? (
                  <p className="mt-1 text-[10px] text-[var(--danger-text)]">
                    {String(offer.extraction_error)}
                  </p>
                ) : null}

                {offer.status === "draft" ? (
                  <div className="mt-3 space-y-2 border-t border-border pt-2">
                    <form
                      action={uploadOfferQuotePdfAction}
                      className="flex flex-wrap items-end gap-2"
                      encType="multipart/form-data"
                    >
                      <input type="hidden" name="request_id" value={id} />
                      <input type="hidden" name="offer_id" value={String(offer.id)} />
                      <label className="block text-[10px] text-muted">
                        Carica preventivo (PDF)
                        <input
                          required
                          type="file"
                          name="file"
                          accept="application/pdf"
                          className="mt-1 block w-full text-[11px]"
                        />
                      </label>
                      <button className="text-[10px] font-medium text-accent">Carica preventivo</button>
                    </form>
                    {offer.quote_document_id ? (
                      <form action={analyzeOfferQuoteAction} className="inline">
                        <input type="hidden" name="request_id" value={id} />
                        <input type="hidden" name="offer_id" value={String(offer.id)} />
                        <button className="text-[10px] font-medium text-accent">
                          Analizza con Insurance Intelligence
                        </button>
                      </form>
                    ) : null}

                    <form action={verifyOfferQuoteAction} className="grid gap-2 sm:grid-cols-2">
                      <input type="hidden" name="request_id" value={id} />
                      <input type="hidden" name="offer_id" value={String(offer.id)} />
                      <p className="sm:col-span-2 text-[11px] font-semibold text-foreground">
                        Verifica preventivo
                      </p>
                      <input
                        required
                        name="insurer"
                        defaultValue={String(offer.insurer ?? "")}
                        className={operationsInput}
                        placeholder="Compagnia"
                      />
                      <input
                        required
                        name="product"
                        defaultValue={String(offer.product ?? "")}
                        className={operationsInput}
                        placeholder="Prodotto"
                      />
                      <input
                        required
                        name="category"
                        defaultValue={String(offer.policy_category ?? "")}
                        className={operationsInput}
                        placeholder="Categoria"
                      />
                      <input
                        name="premium_amount"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={
                          offer.premium_amount != null ? String(offer.premium_amount) : ""
                        }
                        className={operationsInput}
                        placeholder="Premio"
                      />
                      <select
                        name="premium_frequency"
                        defaultValue={String(offer.premium_frequency ?? "annual")}
                        className={operationsInput}
                      >
                        <option value="annual">Annuale</option>
                        <option value="monthly">Mensile</option>
                        <option value="quarterly">Trimestrale</option>
                        <option value="semiannual">Semestrale</option>
                      </select>
                      <select
                        required
                        name="source_policy_id"
                        defaultValue={String(offer.source_policy_id ?? "")}
                        className={operationsInput}
                      >
                        <option value="">Confronta con polizza…</option>
                        {data.resources.policies.map((policy) => (
                          <option key={String(policy.id)} value={String(policy.id)}>
                            {String(policy.provider)} · {String(policy.policy_type)}
                          </option>
                        ))}
                      </select>
                      <input
                        name="effective_date"
                        type="date"
                        defaultValue={
                          offer.effective_date ? String(offer.effective_date) : ""
                        }
                        className={operationsInput}
                      />
                      <input
                        name="quote_validity_date"
                        type="date"
                        defaultValue={
                          offer.quote_validity_date
                            ? String(offer.quote_validity_date)
                            : ""
                        }
                        className={operationsInput}
                      />
                      <input
                        name="consumer_notes"
                        defaultValue={String(offer.consumer_visible_notes ?? "")}
                        className={`${operationsInput} sm:col-span-2`}
                        placeholder="Nota visibile al cliente"
                      />
                      <button className={`${operationsButton} sm:col-span-2`}>
                        Dati verificati
                      </button>
                    </form>

                    {["verified", "ready_to_send"].includes(
                      String(offer.extraction_status ?? "")
                    ) ? (
                      <form action={updateOfferStatusAction}>
                        <input type="hidden" name="request_id" value={id} />
                        <input type="hidden" name="offer_id" value={String(offer.id)} />
                        <button
                          name="status"
                          value="sent"
                          className="text-[10px] font-medium text-accent"
                        >
                          Invia al cliente
                        </button>
                      </form>
                    ) : (
                      <p className="text-[10px] text-muted">
                        Completa «Dati verificati» prima dell&apos;invio.
                      </p>
                    )}
                  </div>
                ) : null}

                {["sent", "proposed", "viewed", "interested", "clarification_requested"].includes(
                  String(offer.status)
                ) ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-[10px] text-muted">
                      {offer.consumer_decision
                        ? `Decisione: ${String(offer.consumer_decision)}`
                        : "In attesa del cliente"}
                    </span>
                    <form action={createOfferRevisionAction}>
                      <input type="hidden" name="request_id" value={id} />
                      <input type="hidden" name="offer_id" value={String(offer.id)} />
                      <button className="text-[10px] font-medium text-accent">
                        Crea revisione
                      </button>
                    </form>
                  </div>
                ) : null}
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
        <OperationsPanel title="Messaggi pratica">
          <div className="mb-3 max-h-72 space-y-2 overflow-y-auto">
            {(data.messages ?? []).length ? (
              (data.messages as Array<{
                id: string;
                sender_role: string;
                message_kind: string;
                body: string;
                created_at: string;
              }>).map((msg) => (
                <div
                  key={msg.id}
                  className={
                    msg.message_kind === "system"
                      ? "rounded-lg border border-dashed border-border px-3 py-2 text-[11px] text-muted"
                      : "rounded-lg border border-border bg-card px-3 py-2 text-[12px]"
                  }
                >
                  <p className="text-[10px] uppercase tracking-wide text-muted">
                    {msg.message_kind === "system" ? "Sistema" : msg.sender_role} ·{" "}
                    {formatDate(msg.created_at)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{msg.body}</p>
                </div>
              ))
            ) : (
              <p className="text-[12px] text-muted">
                Nessun messaggio ancora. La conversazione resta legata a questa pratica ATLAS.
              </p>
            )}
          </div>
          <form action={sendConsultationMessageAction} className="space-y-2">
            <input type="hidden" name="request_id" value={id} />
            <textarea
              name="body"
              required
              rows={3}
              className={operationsInput}
              placeholder="Scrivi al cliente…"
            />
            <button className={operationsButton}>Invia messaggio</button>
          </form>
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
