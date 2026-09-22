"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  FileText,
  MessageSquare,
  Send,
  Share2,
} from "lucide-react";
import {
  consumerAppointmentAction,
  consumerOfferDecisionAction,
  markMessagesReadAction,
  sendConsumerMessageAction,
} from "@/app/(app)/consultations/actions";
import { SectionCard } from "@/components/ui/SectionCard";
import { appointmentStatusLabel, offerStatusLabel } from "@/lib/collaboration-status";
import { eventTypeLabel } from "@/lib/operations-labels";

type Tab = "overview" | "messages" | "appointment" | "offers" | "shared" | "activity";

type Props = {
  consultationId: string;
  initialTab?: string;
  data: {
    request: {
      id: string;
      status: string;
      statusLabel: string;
      reasonLabel: string | null;
      review_reason_detail?: string | null;
      message: string | null;
      created_at: string;
    };
    broker: { display_name?: string | null; company_name?: string | null } | null;
    shared: Array<{ id: string; resource_type: string; resource_id: string }>;
    messages: Array<{
      id: string;
      sender_role: string;
      body: string;
      created_at: string;
      read_at: string | null;
      message_kind?: string;
    }>;
    appointment: {
      id: string;
      scheduled_at: string;
      duration_minutes: number | null;
      channel: string;
      status: string;
      location_or_link: string | null;
      proposal_note: string | null;
    } | null;
    offers: Array<{
      id: string;
      insurer: string;
      product: string;
      premium_amount: number | string | null;
      premium_frequency: string | null;
      status: string;
      currency: string | null;
    }>;
    events: Array<{ id: string; event_type: string; created_at: string }>;
    nextAction: { label: string; href?: string };
    unreadFromBroker: number;
  };
};

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Panoramica" },
  { id: "messages", label: "Messaggi" },
  { id: "appointment", label: "Appuntamento" },
  { id: "offers", label: "Offerte" },
  { id: "shared", label: "Dati condivisi" },
  { id: "activity", label: "Attività" },
];

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("it-CH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function ConsumerConsultationDetail({ consultationId, initialTab, data }: Props) {
  const validTab = tabs.some((t) => t.id === initialTab) ? (initialTab as Tab) : "overview";
  const [tab, setTab] = useState<Tab>(validTab);
  const [draft, setDraft] = useState("");
  const [counterAt, setCounterAt] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (data.unreadFromBroker > 0) {
      void markMessagesReadAction(consultationId);
    }
  }, [consultationId, data.unreadFromBroker]);

  const brokerLabel = useMemo(() => {
    if (!data.broker) return "In assegnazione";
    return data.broker.display_name || data.broker.company_name || "Consulente ATLAS";
  }, [data.broker]);

  return (
    <div className="space-y-4" data-testid="consumer-consultation-detail">
      <header className="rounded-2xl border border-border bg-surface px-4 py-4 sm:px-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
          Revisione ATLAS
        </p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight text-foreground">
              {data.request.statusLabel}
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              Consulente: {brokerLabel}
              {data.request.reasonLabel ? ` · ${data.request.reasonLabel}` : ""}
            </p>
          </div>
          {data.nextAction.href ? (
            <Link href={data.nextAction.href} className="atlas-btn-primary px-4 py-2 text-[12px]">
              {data.nextAction.label}
            </Link>
          ) : (
            <span className="rounded-lg border border-border px-3 py-2 text-[12px] text-muted">
              {data.nextAction.label}
            </span>
          )}
        </div>
      </header>

      <nav
        className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1"
        aria-label="Sezioni pratica"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-[12px] font-medium transition ${
              tab === item.id
                ? "bg-accent-soft text-foreground"
                : "text-muted hover:text-foreground"
            }`}
            aria-current={tab === item.id ? "page" : undefined}
          >
            {item.label}
            {item.id === "messages" && data.unreadFromBroker > 0 ? (
              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-white">
                {data.unreadFromBroker}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {tab === "overview" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <SectionCard title="Stato" padding="sm">
            <p className="text-[13px] text-foreground">{data.request.statusLabel}</p>
            <p className="mt-1 text-[11px] text-muted">
              Inviata il {formatWhen(data.request.created_at)}
            </p>
            {data.request.message ? (
              <p className="mt-3 text-[12px] leading-relaxed text-muted">{data.request.message}</p>
            ) : null}
          </SectionCard>
          <SectionCard title="Prossimo passo" padding="sm">
            <p className="text-[13px] text-foreground">{data.nextAction.label}</p>
            <p className="mt-2 text-[11px] text-muted">
              Non è un ordine di acquisto: è una pratica di revisione con il consulente assegnato.
            </p>
          </SectionCard>
          <SectionCard title="Messaggi" padding="sm">
            <p className="flex items-center gap-2 text-[13px]">
              <MessageSquare className="h-4 w-4 text-muted" />
              {data.messages.length
                ? `Ultimo: ${data.messages[data.messages.length - 1].body.slice(0, 80)}`
                : "Nessun messaggio ancora"}
            </p>
          </SectionCard>
          <SectionCard title="Appuntamento" padding="sm">
            <p className="flex items-center gap-2 text-[13px]">
              <Calendar className="h-4 w-4 text-muted" />
              {data.appointment
                ? `${appointmentStatusLabel(data.appointment.status)} · ${formatWhen(data.appointment.scheduled_at)}`
                : "Nessun appuntamento proposto"}
            </p>
          </SectionCard>
        </div>
      ) : null}

      {tab === "messages" ? (
        <SectionCard title="Conversazione" padding="sm">
          <div className="mb-3 max-h-[50vh] space-y-2 overflow-y-auto" role="log" aria-live="polite">
            {!data.messages.length ? (
              <p className="py-8 text-center text-[12px] text-muted">
                Scrivi al consulente quando vuoi chiarire qualcosa sulla revisione.
              </p>
            ) : (
              data.messages.map((msg) => {
                const mine = msg.sender_role === "consumer";
                const system = msg.sender_role === "system" || msg.message_kind === "system";
                if (system) {
                  return (
                    <p key={msg.id} className="text-center text-[11px] text-muted">
                      {msg.body}
                    </p>
                  );
                }
                return (
                  <div
                    key={msg.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                        mine
                          ? "bg-accent text-white"
                          : "border border-border bg-background text-foreground"
                      }`}
                    >
                      <p>{msg.body}</p>
                      <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-muted"}`}>
                        {formatWhen(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const text = draft.trim();
              if (!text) return;
              startTransition(async () => {
                const result = await sendConsumerMessageAction(consultationId, text);
                setStatus(result.message);
                if (result.ok) setDraft("");
              });
            }}
          >
            <label className="sr-only" htmlFor="consumer-msg">
              Messaggio
            </label>
            <input
              id="consumer-msg"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={4000}
              placeholder="Scrivi un messaggio…"
              className="flex-1 rounded-xl border border-border bg-input px-3 py-2.5 text-[13px]"
            />
            <button
              type="submit"
              disabled={pending || !draft.trim()}
              className="atlas-btn-primary inline-flex items-center gap-2 px-3 py-2.5 text-[12px]"
            >
              <Send className="h-4 w-4" />
              Invia
            </button>
          </form>
          {status ? <p className="mt-2 text-[11px] text-muted">{status}</p> : null}
        </SectionCard>
      ) : null}

      {tab === "appointment" ? (
        <SectionCard title="Appuntamento" padding="sm">
          {!data.appointment ? (
            <p className="text-[12px] text-muted">
              Il consulente non ha ancora proposto un appuntamento.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-[14px] font-medium text-foreground">
                Il consulente propone un appuntamento
              </p>
              <dl className="grid gap-2 text-[12px] sm:grid-cols-2">
                <div>
                  <dt className="text-muted">Quando</dt>
                  <dd className="font-medium">{formatWhen(data.appointment.scheduled_at)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Durata</dt>
                  <dd className="font-medium">
                    {data.appointment.duration_minutes ?? 45} minuti
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Modalità</dt>
                  <dd className="font-medium">{data.appointment.channel}</dd>
                </div>
                <div>
                  <dt className="text-muted">Stato</dt>
                  <dd className="font-medium">
                    {appointmentStatusLabel(data.appointment.status)}
                  </dd>
                </div>
              </dl>
              {["proposed", "counter_proposed", "scheduled"].includes(data.appointment.status) &&
              data.appointment.status !== "confirmed" ? (
                <div className="flex flex-col gap-2 border-t border-border pt-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      className="atlas-btn-primary px-3 py-2 text-[12px]"
                      onClick={() =>
                        startTransition(async () => {
                          const result = await consumerAppointmentAction({
                            consultationId,
                            appointmentId: data.appointment!.id,
                            action: "confirm",
                          });
                          setStatus(result.message);
                        })
                      }
                    >
                      <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                      Conferma
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      className="atlas-btn-secondary px-3 py-2 text-[12px]"
                      onClick={() =>
                        startTransition(async () => {
                          const result = await consumerAppointmentAction({
                            consultationId,
                            appointmentId: data.appointment!.id,
                            action: "decline",
                            note,
                          });
                          setStatus(result.message);
                        })
                      }
                    >
                      Rifiuta
                    </button>
                  </div>
                  <label className="block text-[11px] text-muted">
                    Proponi altro orario
                    <input
                      type="datetime-local"
                      value={counterAt}
                      onChange={(e) => setCounterAt(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-[12px]"
                    />
                  </label>
                  <label className="block text-[11px] text-muted">
                    Nota (opzionale)
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-[12px]"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={pending || !counterAt}
                    className="atlas-btn-secondary self-start px-3 py-2 text-[12px]"
                    onClick={() =>
                      startTransition(async () => {
                        const result = await consumerAppointmentAction({
                          consultationId,
                          appointmentId: data.appointment!.id,
                          action: "counter",
                          scheduledAt: new Date(counterAt).toISOString(),
                          note,
                        });
                        setStatus(result.message);
                      })
                    }
                  >
                    Invia controproposta
                  </button>
                </div>
              ) : null}
            </div>
          )}
          {status ? <p className="mt-2 text-[11px] text-muted">{status}</p> : null}
        </SectionCard>
      ) : null}

      {tab === "offers" ? (
        <div className="space-y-3">
          {!data.offers.length ? (
            <SectionCard title="Offerte" padding="sm">
              <p className="text-[12px] text-muted">
                Non ci sono ancora offerte strutturate per questa pratica.
              </p>
            </SectionCard>
          ) : (
            data.offers.map((offer) => (
              <SectionCard key={offer.id} title={`${offer.insurer} · ${offer.product}`} padding="sm">
                <p className="text-[12px] text-muted">
                  {offerStatusLabel(offer.status)}
                  {offer.premium_amount != null
                    ? ` · ${offer.currency ?? "CHF"} ${Number(offer.premium_amount).toLocaleString("it-CH")}`
                    : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/consultations/${consultationId}/offers/${offer.id}`}
                    className="atlas-btn-primary px-3 py-2 text-[12px]"
                  >
                    Vedi confronto
                  </Link>
                  <button
                    type="button"
                    className="atlas-btn-secondary px-3 py-2 text-[12px]"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await consumerOfferDecisionAction({
                          consultationId,
                          offerId: offer.id,
                          decision: "interested",
                        });
                        setStatus(result.message);
                      })
                    }
                  >
                    Sono interessato
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-border px-3 py-2 text-[12px]"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await consumerOfferDecisionAction({
                          consultationId,
                          offerId: offer.id,
                          decision: "declined",
                        });
                        setStatus(result.message);
                      })
                    }
                  >
                    Non sono interessato
                  </button>
                </div>
              </SectionCard>
            ))
          )}
          {status ? <p className="text-[11px] text-muted">{status}</p> : null}
        </div>
      ) : null}

      {tab === "shared" ? (
        <SectionCard title="Cosa hai condiviso" padding="sm">
          <p className="mb-3 flex items-start gap-2 text-[12px] text-muted">
            <Share2 className="mt-0.5 h-4 w-4 shrink-0" />
            Solo questi elementi sono visibili al consulente assegnato. Potrai revocare
            l&apos;accesso quando la pratica sarà chiusa, salvo dati necessari per
            operatività/audit.
          </p>
          <ul className="space-y-2">
            {data.shared.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[12px]"
              >
                <FileText className="h-4 w-4 text-muted" />
                <span className="capitalize">{row.resource_type}</span>
                <span className="font-mono text-[10px] text-muted">
                  {row.resource_id.slice(0, 8)}…
                </span>
              </li>
            ))}
            {!data.shared.length ? (
              <li className="text-[12px] text-muted">Nessuna risorsa condivisa.</li>
            ) : null}
          </ul>
        </SectionCard>
      ) : null}

      {tab === "activity" ? (
        <SectionCard title="Attività" padding="sm">
          <ol className="space-y-2">
            {data.events.map((event) => (
              <li key={event.id} className="border-l-2 border-border pl-3 text-[12px]">
                <p className="font-medium text-foreground">
                  {eventTypeLabel(event.event_type)}
                </p>
                <p className="text-[10px] text-muted">{formatWhen(event.created_at)}</p>
              </li>
            ))}
            {!data.events.length ? (
              <li className="text-[12px] text-muted">Nessun evento ancora.</li>
            ) : null}
          </ol>
        </SectionCard>
      ) : null}
    </div>
  );
}
