import Link from "next/link";
import {
  OperationsPanel,
  formatDate,
} from "@/components/operations/OperationsUi";
import {
  PartnerBadge,
  PartnerEmptyState,
  PartnerPageIntro,
} from "@/components/partner/PartnerEmptyState";
import { getBrokerWorkspace } from "@/lib/broker-operations";
import {
  appointmentChannelLabel,
  appointmentStatusLabel,
} from "@/lib/operations-labels";

export const metadata = { title: "Appuntamenti | Broker" };

function dayKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function AppointmentRow({
  row,
}: {
  row: {
    id: string | number;
    consultation_request_id: string;
    clientName?: string | null;
    scheduled_at: string;
    channel: string;
    status: string;
    duration_minutes?: number | null;
  };
}) {
  return (
    <Link
      href={`/broker/requests/${row.consultation_request_id}`}
      className="block rounded-xl border border-border bg-card p-3.5 text-[12px] transition hover:border-accent/50"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold">{row.clientName ?? "Cliente ATLAS"}</p>
        <PartnerBadge tone="accent">
          {appointmentStatusLabel(String(row.status))}
        </PartnerBadge>
      </div>
      <p className="mt-1.5 text-[10px] text-muted">
        {formatDate(String(row.scheduled_at))} ·{" "}
        {appointmentChannelLabel(String(row.channel))} · {row.duration_minutes ?? "—"}{" "}
        min
      </p>
    </Link>
  );
}

export default async function BrokerAppointmentsPage() {
  const { appointments } = await getBrokerWorkspace();
  const now = new Date().getTime();
  const todayKey = dayKey(new Date().toISOString());

  const today = appointments.filter(
    (row) =>
      dayKey(String(row.scheduled_at)) === todayKey &&
      !["cancelled", "completed", "no_show"].includes(String(row.status))
  );
  const needsResponse = appointments.filter((row) =>
    ["counter_proposed"].includes(String(row.status))
  );
  const upcoming = appointments.filter((row) => {
    const t = new Date(String(row.scheduled_at)).getTime();
    return (
      t >= now &&
      dayKey(String(row.scheduled_at)) !== todayKey &&
      !["cancelled", "completed", "no_show"].includes(String(row.status)) &&
      String(row.status) !== "counter_proposed"
    );
  });
  const past = appointments.filter((row) => {
    const t = new Date(String(row.scheduled_at)).getTime();
    return (
      t < now ||
      ["cancelled", "completed", "no_show"].includes(String(row.status))
    );
  });

  return (
    <>
      <PartnerPageIntro
        area="appointments"
        eyebrow="Agenda ATLAS"
        title="Appuntamenti"
        description="Solo appuntamenti legati alle pratiche ATLAS assegnate. Nessun calendario esterno."
        actions={
          needsResponse.length ? (
            <PartnerBadge tone="warn">{needsResponse.length} da rispondere</PartnerBadge>
          ) : (
            <PartnerBadge tone="neutral">{appointments.length} totali</PartnerBadge>
          )
        }
      />

      {!appointments.length ? (
        <PartnerEmptyState
          area="appointments"
          title="Nessun appuntamento"
          description="Proponi un incontro dalla pratica cliente."
          action={{ href: "/broker/requests", label: "Vai alle richieste" }}
        />
      ) : (
        <div className="space-y-4">
          {needsResponse.length ? (
            <OperationsPanel title="Needs response">
              <div className="space-y-2">
                {needsResponse.map((row) => (
                  <AppointmentRow key={String(row.id)} row={row as never} />
                ))}
              </div>
            </OperationsPanel>
          ) : null}
          <OperationsPanel title="Today">
            <div className="space-y-2">
              {today.length ? (
                today.map((row) => <AppointmentRow key={String(row.id)} row={row as never} />)
              ) : (
                <p className="text-[12px] text-muted">Nessun appuntamento oggi.</p>
              )}
            </div>
          </OperationsPanel>
          <OperationsPanel title="Upcoming">
            <div className="space-y-2">
              {upcoming.length ? (
                upcoming.map((row) => (
                  <AppointmentRow key={String(row.id)} row={row as never} />
                ))
              ) : (
                <p className="text-[12px] text-muted">Nessun prossimo appuntamento.</p>
              )}
            </div>
          </OperationsPanel>
          <OperationsPanel title="Past">
            <div className="space-y-2">
              {past.slice(0, 20).map((row) => (
                <AppointmentRow key={String(row.id)} row={row as never} />
              ))}
              {!past.length ? (
                <p className="text-[12px] text-muted">Nessuno storico.</p>
              ) : null}
            </div>
          </OperationsPanel>
        </div>
      )}
    </>
  );
}
