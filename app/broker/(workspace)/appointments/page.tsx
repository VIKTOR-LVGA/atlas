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

export const metadata = { title: "Appuntamenti | Partner" };

function dayKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export default async function PartnerAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const view = params.view ?? "list";
  const { appointments } = await getBrokerWorkspace();

  const upcoming = appointments.filter(
    (row) => !["cancelled", "completed", "no_show"].includes(String(row.status))
  );
  const byDay = upcoming.reduce<Record<string, typeof upcoming>>((acc, row) => {
    const key = dayKey(String(row.scheduled_at));
    acc[key] ??= [];
    acc[key].push(row);
    return acc;
  }, {});
  const days = Object.keys(byDay).sort().slice(0, 14);
  const todayKey = dayKey(new Date().toISOString());
  const todayCount = byDay[todayKey]?.length ?? 0;

  return (
    <>
      <PartnerPageIntro
        area="appointments"
        eyebrow="Agenda"
        title="Appuntamenti"
        description="Solo gli appuntamenti legati ai tuoi mandati assegnati."
        actions={
          todayCount > 0 ? (
            <PartnerBadge tone="warn">{todayCount} oggi</PartnerBadge>
          ) : (
            <PartnerBadge tone="neutral">{upcoming.length} in agenda</PartnerBadge>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 text-[12px]">
        {[
          ["list", "Lista"],
          ["week", "Prossimi giorni"],
        ].map(([value, label]) => (
          <Link
            key={value}
            href={`/broker/appointments?view=${value}`}
            className={`rounded-lg border px-3.5 py-1.5 transition ${
              view === value
                ? "border-accent bg-accent-soft text-accent shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_30%,transparent)]"
                : "border-border text-muted hover:border-accent/40 hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {!appointments.length ? (
        <PartnerEmptyState
          area="appointments"
          title="Nessun appuntamento programmato"
          description="Fissa il prossimo incontro dalle richieste assegnate."
          action={{ href: "/broker/requests", label: "Vai alle richieste" }}
        />
      ) : view === "week" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {days.length ? (
            days.map((day) => (
              <OperationsPanel
                key={day}
                title={new Intl.DateTimeFormat("it-CH", {
                  timeZone: "Europe/Zurich",
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }).format(new Date(`${day}T12:00:00`))}
              >
                <div className="space-y-2">
                  {byDay[day].map((row) => (
                    <Link
                      key={String(row.id)}
                      href={`/broker/requests/${row.consultation_request_id}`}
                      className="block rounded-lg border border-border p-3 text-[12px] transition hover:border-accent/50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{row.clientName ?? "Cliente"}</p>
                        <PartnerBadge tone="accent">
                          {appointmentStatusLabel(String(row.status))}
                        </PartnerBadge>
                      </div>
                      <p className="mt-1 text-[10px] text-muted">
                        {formatDate(String(row.scheduled_at))} ·{" "}
                        {appointmentChannelLabel(String(row.channel))}
                      </p>
                    </Link>
                  ))}
                </div>
              </OperationsPanel>
            ))
          ) : (
            <PartnerEmptyState
              area="appointments"
              title="Nessun appuntamento imminente"
              description="Gli appuntamenti futuri appariranno raggruppati per giorno."
            />
          )}
        </div>
      ) : (
        <OperationsPanel title={`${appointments.length} appuntamenti`}>
          <div className="space-y-2">
            {appointments.map((row) => {
              const isToday = dayKey(String(row.scheduled_at)) === todayKey;
              return (
                <Link
                  key={String(row.id)}
                  href={`/broker/requests/${row.consultation_request_id}`}
                  className="block rounded-xl border border-border bg-card p-3.5 text-[12px] transition hover:border-accent/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{row.clientName ?? "Cliente"}</p>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {isToday ? <PartnerBadge tone="warn">Oggi</PartnerBadge> : null}
                      <PartnerBadge tone="accent">
                        {appointmentStatusLabel(String(row.status))}
                      </PartnerBadge>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted">
                    {formatDate(String(row.scheduled_at))} ·{" "}
                    {appointmentChannelLabel(String(row.channel))} · {row.duration_minutes}{" "}
                    min
                  </p>
                </Link>
              );
            })}
          </div>
        </OperationsPanel>
      )}
    </>
  );
}
