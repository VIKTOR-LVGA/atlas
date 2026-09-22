import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileSignature,
  Search,
  StickyNote,
  Wallet,
} from "lucide-react";
import {
  OperationsHeader,
  OperationsMetric,
  OperationsPanel,
  formatChf,
  formatDate,
} from "@/components/operations/OperationsUi";
import { PartnerBadge, PartnerEmptyState } from "@/components/partner/PartnerEmptyState";
import { SwitzerlandChoropleth } from "@/components/maps/SwitzerlandChoropleth";
import { getBrokerWorkspace } from "@/lib/broker-operations";
import { getCantonAggregates } from "@/lib/partner-applications";
import {
  consultationStatusLabel,
  consultationTypeLabel,
  eventTypeLabel,
} from "@/lib/operations-labels";
import {
  buildTodayPriorities,
  deriveNextAction,
  formatPartnerTodayLabel,
  partnerGreetingHour,
  pipelineStageCounts,
} from "@/lib/partner-workspace";
import { pct } from "@/lib/analytics-period";

export const metadata = { title: "Partner Dashboard | ATLAS" };

export default async function PartnerDashboardPage() {
  const [data, cantons] = await Promise.all([
    getBrokerWorkspace(),
    getCantonAggregates("partner").catch(() => []),
  ]);

  const firstName = data.broker.displayName.split(/\s+/)[0] || data.broker.displayName;
  const priorities = buildTodayPriorities({
    leads: data.leads,
    appointments: data.appointments,
    offers: data.offers,
  });
  const stages = pipelineStageCounts(data.leads);
  const active = data.leads.filter(
    (lead) => !["won", "lost", "completed", "cancelled"].includes(lead.status)
  );
  const completed = (data.pipeline.won ?? 0) + (data.pipeline.completed ?? 0);
  const decided = completed + (data.pipeline.lost ?? 0);
  const conversion = pct(completed, decided);
  const openPremium = data.offers
    .filter((offer) => ["draft", "proposed"].includes(String(offer.status)))
    .reduce((sum, offer) => sum + Number(offer.premium_amount ?? 0), 0);

  const nowMs = new Date().getTime();
  const upcoming = data.appointments
    .filter((appt) => {
      if (["cancelled", "completed", "no_show"].includes(String(appt.status))) return false;
      return new Date(String(appt.scheduled_at)).getTime() >= nowMs - 60 * 60 * 1000;
    })
    .slice(0, 5);

  const activity = (data.events as Array<{
    id: string;
    consultation_request_id: string;
    event_type: string;
    created_at: string;
  }>)
    .slice(0, 10)
    .map((event) => {
      const lead = data.leads.find((row) => row.id === event.consultation_request_id);
      return {
        id: event.id,
        title: eventTypeLabel(event.event_type),
        detail: lead?.clientName ?? "Cliente",
        at: event.created_at,
        href: `/partner/leads/${event.consultation_request_id}`,
      };
    });

  const subtitle =
    priorities.length > 0
      ? `Oggi hai ${priorities.length} attiv${priorities.length === 1 ? "ità" : "ità"} da gestire.`
      : "Sei in pari. Nessuna attività urgente.";

  return (
    <>
      <OperationsHeader
        eyebrow={formatPartnerTodayLabel()}
        title={`${partnerGreetingHour()}, ${firstName}`}
        description={subtitle}
      />

      <section className="mb-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-[13px] font-semibold">Da fare oggi</h2>
          <Link href="/partner/leads" className="text-[12px] font-medium text-accent">
            Tutte le richieste
          </Link>
        </div>
        {priorities.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {priorities.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="rounded-xl border border-border bg-card p-4 transition hover:border-accent"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-semibold">{item.clientName}</p>
                  <PartnerBadge tone={item.tone === "urgent" ? "warn" : "accent"}>
                    {item.dueLabel ?? "Azione"}
                  </PartnerBadge>
                </div>
                <p className="mt-2 text-[12px] text-muted">{item.reason}</p>
                <p className="mt-3 text-[11px] font-medium text-accent">Apri →</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card px-5 py-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-accent" />
              <div>
                <p className="text-[14px] font-semibold">Tutto sotto controllo</p>
                <p className="mt-1 text-[12px] text-muted">
                  Nessuna richiesta urgente, follow-up scaduto o appuntamento imminente.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-[13px] font-semibold">Azioni rapide</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/partner/clients", label: "Cerca cliente", icon: Search },
            { href: "/partner/leads", label: "Apri richieste", icon: ClipboardList },
            { href: "/partner/appointments", label: "Appuntamenti", icon: CalendarDays },
            { href: "/partner/offers", label: "Offerte", icon: StickyNote },
            { href: "/partner/contracts", label: "Contratti", icon: FileSignature },
            { href: "/partner/commissions", label: "Commissioni", icon: Wallet },
          ].map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[12px] font-medium transition hover:border-accent hover:text-accent"
            >
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-[13px] font-semibold">Pipeline</h2>
          <p className="text-[11px] text-muted">{data.leads.length} richieste totali</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {stages.map((stage) => (
            <Link
              key={stage.id}
              href={`/partner/leads?status=${stage.id}`}
              className="rounded-xl border border-border bg-card p-3 transition hover:border-accent"
            >
              <p className="text-[11px] text-muted">{stage.label}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{stage.count}</p>
              <p className="mt-1 text-[10px] text-muted">{stage.pct}% pipeline</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OperationsMetric label="Lead attivi" value={String(active.length)} />
        <OperationsMetric
          label="Conversion"
          value={`${conversion}%`}
          detail={`${completed} conclusi su ${decided || 0} decisi`}
        />
        <OperationsMetric
          label="Offerte aperte"
          value={String(
            data.offers.filter((o) => ["draft", "proposed"].includes(String(o.status))).length
          )}
          detail={openPremium > 0 ? `Premio noto ${formatChf(openPremium)}` : undefined}
        />
        <OperationsMetric
          label="Ricavo broker netto"
          value={formatChf(data.revenue.netBrokerRevenue)}
          detail={`Attese ${formatChf(data.revenue.expectedShare)} · Pagate ${formatChf(data.revenue.paidShare)}`}
        />
      </div>

      <div className="mb-6 grid gap-5 xl:grid-cols-2">
        <OperationsPanel title="Attività recente">
          {activity.length ? (
            <div className="divide-y divide-border">
              {activity.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-[13px] font-medium">{item.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted">{item.detail}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted">{formatDate(item.at)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <PartnerEmptyState
              icon={ClipboardList}
              title="Nessuna attività ancora"
              description="Quando riceverai e gestirai richieste, la timeline apparirà qui."
              action={{ href: "/partner/leads", label: "Vai alle richieste" }}
            />
          )}
        </OperationsPanel>

        <OperationsPanel
          title="Prossimi appuntamenti"
          action={
            <Link href="/partner/appointments" className="text-[12px] font-medium text-accent">
              Agenda
            </Link>
          }
        >
          {upcoming.length ? (
            <div className="divide-y divide-border">
              {upcoming.map((appt) => (
                <Link
                  key={String(appt.id)}
                  href={`/partner/leads/${appt.consultation_request_id}`}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-[13px] font-semibold">
                      {appt.clientName ?? "Cliente"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {formatDate(String(appt.scheduled_at))}
                    </p>
                  </div>
                  <PartnerBadge tone="accent">{String(appt.status)}</PartnerBadge>
                </Link>
              ))}
            </div>
          ) : (
            <PartnerEmptyState
              icon={CalendarDays}
              title="Nessun appuntamento programmato"
              description="Fissa il prossimo incontro dalle richieste assegnate."
              action={{ href: "/partner/leads", label: "Vai alle richieste" }}
            />
          )}
        </OperationsPanel>
      </div>

      <div className="mb-6 grid gap-5 xl:grid-cols-2">
        <OperationsPanel title="Priorità pipeline">
          <div className="divide-y divide-border">
            {active.slice(0, 8).map((lead) => (
              <Link
                key={lead.id}
                href={`/partner/leads/${lead.id}`}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-[13px] font-semibold">{lead.clientName}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {consultationTypeLabel(lead.requestType)} · {deriveNextAction(lead.status)}
                  </p>
                </div>
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent">
                  {consultationStatusLabel(lead.status)}
                </span>
              </Link>
            ))}
            {!active.length ? (
              <p className="text-[12px] text-muted">Nessun lead attivo assegnato.</p>
            ) : null}
          </div>
        </OperationsPanel>

        <OperationsPanel title="Commissioni">
          <dl className="grid gap-3 sm:grid-cols-2 text-[12px]">
            <div className="rounded-lg border border-border p-3">
              <dt className="text-muted">Attese</dt>
              <dd className="mt-1 text-lg font-semibold">{formatChf(data.revenue.expectedShare)}</dd>
            </div>
            <div className="rounded-lg border border-border p-3">
              <dt className="text-muted">Pagate</dt>
              <dd className="mt-1 text-lg font-semibold">{formatChf(data.revenue.paidShare)}</dd>
            </div>
            <div className="rounded-lg border border-border p-3">
              <dt className="text-muted">Storni</dt>
              <dd className="mt-1 text-lg font-semibold">{formatChf(data.revenue.clawbackShare)}</dd>
            </div>
            <div className="rounded-lg border border-border p-3">
              <dt className="text-muted">Netto</dt>
              <dd className="mt-1 text-lg font-semibold">
                {formatChf(data.revenue.netBrokerRevenue)}
              </dd>
            </div>
          </dl>
          <Link
            href="/partner/commissions"
            className="mt-4 inline-flex text-[12px] font-medium text-accent"
          >
            Apri centro commissioni →
          </Link>
        </OperationsPanel>
      </div>

      <SwitzerlandChoropleth
        title="Portafoglio geografico"
        data={cantons}
        metric="leads"
        metrics={["leads", "clients", "contracts", "brokerRevenue"]}
        emptyHint="Il tuo portafoglio geografico apparirà qui quando riceverai le prime richieste."
        showRanking
      />
    </>
  );
}
