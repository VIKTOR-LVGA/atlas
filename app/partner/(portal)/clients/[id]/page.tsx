import Link from "next/link";
import { notFound } from "next/navigation";
import {
  OperationsHeader,
  OperationsPanel,
  formatChf,
  formatDate,
  operationsButton,
  operationsInput,
} from "@/components/operations/OperationsUi";
import { PartnerBadge } from "@/components/partner/PartnerEmptyState";
import { addBrokerNoteAction } from "@/app/partner/actions";
import { getBrokerClient360 } from "@/lib/broker-operations";
import {
  appointmentChannelLabel,
  appointmentStatusLabel,
  consultationStatusLabel,
  consultationTypeLabel,
  contractStatusLabel,
  documentTypeLabel,
  eventTypeLabel,
  offerStatusLabel,
} from "@/lib/operations-labels";
import { deriveNextAction } from "@/lib/partner-workspace";

export const metadata = { title: "Cliente 360° | Partner" };

export default async function BrokerClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getBrokerClient360(id);
  if (!data) notFound();

  const commissionValue = data.ledger.reduce(
    (total: number, entry: { net_broker_share: number | string }) =>
      total + Number(entry.net_broker_share),
    0
  );
  const nextAppt = data.appointments
    .filter((row) => !["cancelled", "completed", "no_show"].includes(String(row.status)))
    .sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at)))[0];

  return (
    <>
      <OperationsHeader
        eyebrow="Cliente 360°"
        title={data.client.clientName}
        description={`Mandati assegnati a te · ${consultationStatusLabel(data.openLead.status)} · ${deriveNextAction(data.openLead.status)}`}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Ultima attività</p>
          <p className="mt-1 text-[13px] font-semibold">{formatDate(data.client.updatedAt)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Prossima attività</p>
          <p className="mt-1 text-[13px] font-semibold">
            {nextAppt ? formatDate(String(nextAppt.scheduled_at)) : deriveNextAction(data.openLead.status)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Contratti</p>
          <p className="mt-1 text-[13px] font-semibold">{data.contracts.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Quota broker</p>
          <p className="mt-1 text-[13px] font-semibold">{formatChf(commissionValue)}</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <OperationsPanel title="Overview">
          <dl className="space-y-3 text-[12px]">
            <div>
              <dt className="text-muted">Email</dt>
              <dd>{data.client.clientEmail ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Telefono</dt>
              <dd>{data.client.clientPhone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Broker owner</dt>
              <dd>{data.broker.displayName}</dd>
            </div>
            <div>
              <dt className="text-muted">Prossima azione</dt>
              <dd className="font-medium">{deriveNextAction(data.openLead.status)}</dd>
            </div>
          </dl>
        </OperationsPanel>

        <OperationsPanel title={`Consulenze (${data.leads.length})`}>
          <div className="space-y-2">
            {data.leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/partner/leads/${lead.id}`}
                className="block rounded-lg border border-border p-3 text-[12px] hover:border-accent"
              >
                <span className="font-semibold">{consultationTypeLabel(lead.requestType)}</span>
                <span className="float-right">
                  <PartnerBadge tone="accent">{consultationStatusLabel(lead.status)}</PartnerBadge>
                </span>
                <p className="mt-2 text-[10px] text-muted">{deriveNextAction(lead.status)}</p>
              </Link>
            ))}
          </div>
        </OperationsPanel>

        <OperationsPanel title={`Polizze condivise (${data.policies.length})`}>
          {!data.policies.length ? (
            <p className="text-[12px] text-muted">Nessuna polizza condivisa esplicitamente.</p>
          ) : (
            <div className="space-y-2">
              {data.policies.map((policy) => (
                <div key={String(policy.id)} className="rounded-lg border border-border p-3 text-[12px]">
                  <p className="font-semibold">
                    {String(policy.provider)} · {String(policy.policy_type)}
                  </p>
                  <p className="mt-1 text-[10px] text-muted">
                    {policy.premium_amount != null ? formatChf(Number(policy.premium_amount)) : "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </OperationsPanel>

        <OperationsPanel title={`Documenti condivisi (${data.documents.length})`}>
          {!data.documents.length ? (
            <p className="text-[12px] text-muted">Nessun documento condiviso esplicitamente.</p>
          ) : (
            <div className="space-y-2">
              {data.documents.map((document) => (
                <div key={String(document.id)} className="rounded-lg border border-border p-3 text-[12px]">
                  <p className="font-semibold">{String(document.file_name)}</p>
                  <p className="mt-1 text-[10px] text-muted">
                    {documentTypeLabel(String(document.document_type))} ·{" "}
                    {formatDate(String(document.created_at))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </OperationsPanel>

        <OperationsPanel title={`Note (${data.notes.length})`}>
          <form action={addBrokerNoteAction} className="mb-4 space-y-2">
            <input type="hidden" name="request_id" value={data.openLead.id} />
            <textarea
              name="content"
              required
              rows={3}
              className={operationsInput}
              placeholder="Nuova nota privata sul mandato attivo…"
            />
            <button className={operationsButton}>Salva nota</button>
          </form>
          <div className="space-y-2">
            {data.notes.map((note) => (
              <div key={String(note.id)} className="rounded-lg border border-border p-3 text-[12px]">
                <p className="whitespace-pre-wrap">{String(note.content)}</p>
                <p className="mt-2 text-[10px] text-muted">{formatDate(String(note.created_at))}</p>
              </div>
            ))}
            {!data.notes.length ? (
              <p className="text-[12px] text-muted">Nessuna nota ancora. Visibile solo a te e agli admin.</p>
            ) : null}
          </div>
        </OperationsPanel>

        <OperationsPanel title={`Appuntamenti (${data.appointments.length})`}>
          <div className="space-y-2">
            {data.appointments.map((appt) => (
              <div key={String(appt.id)} className="rounded-lg border border-border p-3 text-[12px]">
                <p className="font-semibold">{formatDate(String(appt.scheduled_at))}</p>
                <p className="mt-1 text-[10px] text-muted">
                  {appointmentChannelLabel(String(appt.channel))} ·{" "}
                  {appointmentStatusLabel(String(appt.status))}
                </p>
              </div>
            ))}
            {!data.appointments.length ? (
              <p className="text-[12px] text-muted">Nessun appuntamento.</p>
            ) : null}
          </div>
        </OperationsPanel>

        <OperationsPanel title={`Offerte (${data.offers.length})`}>
          <div className="space-y-2">
            {data.offers.map((offer) => (
              <div key={String(offer.id)} className="rounded-lg border border-border p-3 text-[12px]">
                <p className="font-semibold">
                  {String(offer.insurer)} · {String(offer.product)}
                </p>
                <p className="mt-1 text-[10px] text-muted">
                  {offerStatusLabel(String(offer.status))}
                  {offer.premium_amount != null
                    ? ` · ${formatChf(Number(offer.premium_amount))}`
                    : ""}
                </p>
              </div>
            ))}
            {!data.offers.length ? (
              <p className="text-[12px] text-muted">Nessuna offerta.</p>
            ) : null}
          </div>
        </OperationsPanel>

        <OperationsPanel title={`Contratti (${data.contracts.length})`}>
          <div className="space-y-2">
            {data.contracts.map((contract) => (
              <div key={String(contract.id)} className="rounded-lg border border-border p-3 text-[12px]">
                <p className="font-semibold">
                  {String(contract.insurer)} · {String(contract.product)}
                </p>
                <p className="mt-1 text-[10px] text-muted">
                  {contractStatusLabel(String(contract.status))} ·{" "}
                  {formatDate(String(contract.created_at))}
                </p>
              </div>
            ))}
            {!data.contracts.length ? (
              <p className="text-[12px] text-muted">Nessun contratto.</p>
            ) : null}
          </div>
        </OperationsPanel>

        <OperationsPanel title="Activity">
          <div className="space-y-2">
            {data.events.slice(0, 20).map((event) => (
              <div
                key={String(event.id)}
                className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 text-[12px]"
              >
                <div>
                  <p className="font-medium">{eventTypeLabel(String(event.event_type))}</p>
                  <p className="mt-1 text-[10px] text-muted">
                    Mandato{" "}
                    <Link
                      className="text-accent"
                      href={`/partner/leads/${event.consultation_request_id}`}
                    >
                      apri
                    </Link>
                  </p>
                </div>
                <span className="text-[10px] text-muted">
                  {formatDate(String(event.created_at))}
                </span>
              </div>
            ))}
            {!data.events.length ? (
              <p className="text-[12px] text-muted">Nessun evento registrato.</p>
            ) : null}
          </div>
        </OperationsPanel>
      </div>
    </>
  );
}
