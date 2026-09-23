import Link from "next/link";
import type { TimelineEvent, TimelineEventType } from "@/lib/insurance-os/timeline";
import { formatDateTime } from "@/lib/utils";

const EVENT_LABELS: Record<TimelineEventType, string> = {
  policy_added: "Polizza aggiunta",
  document_uploaded: "Documento caricato",
  parsing_completed: "Lettura completata",
  parsing_failed: "Lettura non riuscita",
  premium_changed: "Premio cambiato",
  coverage_changed: "Copertura cambiata",
  renewal: "Rinnovo",
  expiry: "Scadenza",
  consultation_requested: "Revisione richiesta",
  annual_checkup: "Check-up",
  claim_created: "Dossier sinistro",
  claim_closed: "Dossier chiuso",
  document_updated: "Documento aggiornato",
  attention_resolved: "Elemento risolto",
  other: "Attività",
};

function eventHref(event: TimelineEvent) {
  if (event.claimId) return `/claims/${event.claimId}`;
  if (event.policyId) return `/policies/${event.policyId}`;
  if (event.documentId) return `/documents/${event.documentId}`;
  return null;
}

export function TimelineList({
  events,
  emptyMessage = "Non c’è ancora storia da mostrare. Ogni documento caricato e ogni cambiamento comparirà qui.",
}: {
  events: TimelineEvent[];
  emptyMessage?: string;
}) {
  if (events.length === 0) {
    return (
      <p className="atlas-consumer-card px-4 py-5 text-[13px] leading-relaxed text-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ol className="relative space-y-0 border-l border-border-subtle pl-5">
      {events.map((event) => {
        const href = eventHref(event);
        const body = (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[14px] font-medium tracking-tight text-foreground">
                {event.title}
              </p>
              <span className="text-[11px] text-muted">{formatDateTime(event.occurredAt)}</span>
            </div>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-muted">
              {EVENT_LABELS[event.eventType] ?? EVENT_LABELS.other}
            </p>
            {event.description ? (
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {event.description}
              </p>
            ) : null}
          </>
        );

        return (
          <li key={event.id} className="relative pb-5 last:pb-0">
            <span
              aria-hidden="true"
              className="absolute -left-[1.5625rem] top-1.5 h-2 w-2 rounded-full border border-border bg-card"
            />
            {href ? (
              <Link
                href={href}
                className="block rounded-xl px-2 py-1.5 transition hover:bg-card-muted"
              >
                {body}
              </Link>
            ) : (
              <div className="px-2 py-1.5">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
