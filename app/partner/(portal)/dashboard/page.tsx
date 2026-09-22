import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LineChart,
} from "lucide-react";
import {
  OperationsMetric,
  OperationsPanel,
  formatChf,
  formatDate,
} from "@/components/operations/OperationsUi";
import { PartnerBadge, PartnerEmptyState } from "@/components/partner/PartnerEmptyState";
import {
  PartnerAreaIcon,
  PartnerHeroArtwork,
} from "@/components/partner/PartnerVisuals";
import { SwitzerlandChoropleth } from "@/components/maps/SwitzerlandChoropleth";
import { getBrokerWorkspace } from "@/lib/broker-operations";
import { getCantonAggregates } from "@/lib/partner-applications";
import { eventTypeLabel } from "@/lib/operations-labels";
import {
  buildTodayPriorities,
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
  const openOffers = data.offers.filter((o) =>
    ["draft", "proposed"].includes(String(o.status))
  );
  const openPremium = openOffers.reduce(
    (sum, offer) => sum + Number(offer.premium_amount ?? 0),
    0
  );

  const nowMs = new Date().getTime();
  const upcoming = data.appointments
    .filter((appt) => {
      if (["cancelled", "completed", "no_show"].includes(String(appt.status))) return false;
      return new Date(String(appt.scheduled_at)).getTime() >= nowMs - 60 * 60 * 1000;
    })
    .slice(0, 4);

  const activity = (
    data.events as Array<{
      id: string;
      consultation_request_id: string;
      event_type: string;
      created_at: string;
    }>
  )
    .slice(0, 6)
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
      {/* Hero operativo */}
      <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between gap-4 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_14%,transparent),transparent)] px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              {formatPartnerTodayLabel()}
            </p>
            <h1 className="mt-1 text-[24px] font-semibold tracking-tight text-foreground sm:text-[28px]">
              {partnerGreetingHour()}, {firstName}
            </h1>
            <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted">
              {subtitle}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <PartnerBadge tone="accent">{data.broker.displayName}</PartnerBadge>
              <PartnerBadge tone="neutral">
                {active.length} lead attivi
              </PartnerBadge>
            </div>
          </div>
          <PartnerHeroArtwork area="dashboard" />
        </div>
      </section>

      {/* KPI top */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OperationsMetric label="Lead attivi" value={String(active.length)} />
        <OperationsMetric
          label="Conversion"
          value={`${conversion}%`}
          detail={`${completed} conclusi su ${decided || 0} decisi`}
        />
        <OperationsMetric
          label="Offerte aperte"
          value={String(openOffers.length)}
          detail={openPremium > 0 ? `Premio noto ${formatChf(openPremium)}` : undefined}
        />
        <OperationsMetric
          label="Ricavo broker netto"
          value={formatChf(data.revenue.netBrokerRevenue)}
          detail={`Attese ${formatChf(data.revenue.expectedShare)}`}
        />
      </div>

      {/* Oggi + Azioni */}
      <div className="mb-6 grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-[13px] font-semibold">Da fare oggi</h2>
            <Link href="/partner/leads" className="text-[12px] font-medium text-accent">
              Tutte le richieste
            </Link>
          </div>
          {priorities.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {priorities.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="rounded-xl border border-border bg-card p-4 transition hover:border-accent/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[13px] font-semibold">{item.clientName}</p>
                    <PartnerBadge tone={item.tone === "urgent" ? "warn" : "accent"}>
                      {item.dueLabel ?? "Azione"}
                    </PartnerBadge>
                  </div>
                  <p className="mt-2 text-[12px] text-muted">{item.reason}</p>
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

        <section>
          <h2 className="mb-3 text-[13px] font-semibold">Azioni rapide</h2>
          <div className="grid gap-2">
            {[
              { href: "/partner/leads", label: "Apri richieste", area: "leads" as const },
              {
                href: "/partner/appointments",
                label: "Appuntamenti",
                area: "appointments" as const,
              },
              { href: "/partner/offers", label: "Offerte", area: "offers" as const },
              {
                href: "/partner/commissions",
                label: "Commissioni",
                area: "commissions" as const,
              },
              { href: "/partner/analytics", label: "Analytics", area: "analytics" as const },
              { href: "/partner/clients", label: "Clienti", area: "clients" as const },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-[12px] font-medium transition hover:border-accent/50"
              >
                <PartnerAreaIcon area={action.area} size="sm" />
                {action.label}
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Pipeline */}
      <section className="mb-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-[13px] font-semibold">Pipeline</h2>
          <p className="text-[11px] text-muted">{data.leads.length} richieste</p>
        </div>
        {stages.some((s) => s.count > 0) ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {stages.map((stage) => (
              <Link
                key={stage.id}
                href={`/partner/leads?status=${stage.id}`}
                className="rounded-xl border border-border bg-card p-3 transition hover:border-accent/50"
              >
                <p className="text-[11px] text-muted">{stage.label}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{stage.count}</p>
                <p className="mt-1 text-[10px] text-muted">{stage.pct}%</p>
              </Link>
            ))}
          </div>
        ) : (
          <PartnerEmptyState
            area="leads"
            title="Nessun lead attivo"
            description="Quando inizierai a ricevere richieste, qui vedrai la pipeline operativa."
            action={{ href: "/partner/leads", label: "Vai alle richieste" }}
          />
        )}
      </section>

      {/* Attività + Appuntamenti */}
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
                  <span className="shrink-0 text-[10px] text-muted">
                    {formatDate(item.at)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <PartnerEmptyState
              icon={ClipboardList}
              area="leads"
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
              area="appointments"
              title="Nessun appuntamento programmato"
              description="Fissa il prossimo incontro dalle richieste assegnate."
              action={{ href: "/partner/leads", label: "Vai alle richieste" }}
            />
          )}
        </OperationsPanel>
      </div>

      {/* Commissioni + geo teaser — full analytics on dedicated page */}
      <div className="mb-6 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <OperationsPanel title="Commissioni">
          <div className="flex items-start gap-3">
            <PartnerAreaIcon area="commissions" />
            <div>
              <p className="text-[12px] text-muted">Ricavo netto broker</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {formatChf(data.revenue.netBrokerRevenue)}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Attese {formatChf(data.revenue.expectedShare)} · Pagate{" "}
                {formatChf(data.revenue.paidShare)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/partner/commissions"
              className="inline-flex text-[12px] font-medium text-accent"
            >
              Centro commissioni →
            </Link>
            <Link
              href="/partner/analytics"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted hover:text-accent"
            >
              <LineChart className="h-3.5 w-3.5" />
              Analytics
            </Link>
          </div>
        </OperationsPanel>

        <SwitzerlandChoropleth
          title="Portafoglio geografico"
          data={cantons}
          metric="leads"
          metrics={["leads", "clients", "contracts", "brokerRevenue"]}
          emptyHint="Il tuo portafoglio geografico apparirà qui quando riceverai le prime richieste."
          showRanking={false}
          showAtlasShare={false}
        />
      </div>
    </>
  );
}
