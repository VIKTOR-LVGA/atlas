import Link from "next/link";
import { AtlasScoreCard } from "@/components/consumer/AtlasScoreCard";
import { ConsultationPrepCard } from "@/components/consumer/ConsultationPrepCard";
import { EmptyState, MetricTile, ConsumerSection } from "@/components/consumer/EmptyState";
import { PolicyConsumerCard } from "@/components/policies/PolicyConsumerCard";
import { buildAtlasScore } from "@/lib/atlas-score";
import { getCurrentUserDocuments } from "@/lib/documents";
import { buildOpportunities } from "@/lib/opportunities";
import { getCurrentUserPolicies } from "@/lib/policies";
import { syncCurrentUserOpportunities } from "@/lib/persisted-opportunities";
import { formatScheduleDate, getUpcomingDeadlines, greetingForZurich } from "@/lib/policy-schedule";
import { sumPortfolioPremiums } from "@/lib/premium-totals";
import { getPolicyStatusLabel } from "@/lib/policy-consumer-display";
import { getProfileShortName } from "@/lib/profile-display";
import { getCurrentProfile } from "@/lib/profiles";
import { formatCHF } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [profile, policies, documents] = await Promise.all([
    getCurrentProfile(),
    getCurrentUserPolicies(),
    getCurrentUserDocuments(),
  ]);

  const name = getProfileShortName(profile);
  const greeting = greetingForZurich();
  const premiums = sumPortfolioPremiums(policies);
  const deadlines = getUpcomingDeadlines(policies, new Date(), 5);
  const score = buildAtlasScore({ profile, policies, documents });
  const opportunities = buildOpportunities({ policies, documents }).slice(0, 3);
  await syncCurrentUserOpportunities({ policies, documents });
  const attentionCount = opportunities.filter((item) => item.kind !== "stale_review").length;
  const nextDeadline = deadlines[0] ?? null;
  const activeCount = policies.filter(
    (policy) => getPolicyStatusLabel(policy) === "Attiva"
  ).length;

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground sm:text-[30px]">
          {greeting}, {name}
        </h1>
        <p className="mt-1 text-[15px] text-muted-foreground">Il tuo mondo assicurativo</p>
      </header>

      {policies.length === 0 ? (
        <EmptyState
          title="Porta le tue assicurazioni in ATLAS."
          description="Aggiungi la prima polizza per iniziare a vedere premi, scadenze e documenti in un unico posto."
          actionLabel="Aggiungi polizza"
          actionHref="/policies/new"
          secondaryLabel="Carica un documento"
          secondaryHref="/documents"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <MetricTile
            label="Premi annuali"
            value={premiums.annual !== null ? formatCHF(premiums.annual) : "—"}
            hint={premiums.annual === null ? "Aggiungi i premi" : "Totale dal portafoglio"}
          />
          <MetricTile
            label="Equivalente mensile"
            value={premiums.monthly !== null ? formatCHF(premiums.monthly) : "—"}
            hint={premiums.monthly === null ? "Non ancora disponibile" : "Media sul 12 mesi"}
          />
          <MetricTile
            label="Polizze attive"
            value={String(activeCount)}
            hint={`${policies.length} in totale`}
          />
          <MetricTile
            label="Documenti"
            value={String(documents.length)}
            hint={documents.length === 0 ? "Wallet ancora vuoto" : "Nel wallet privato"}
          />
          <MetricTile
            label="Prossima scadenza"
            value={nextDeadline ? formatScheduleDate(nextDeadline.date) : "—"}
            hint={nextDeadline ? nextDeadline.label : "Nessuna data inserita"}
          />
        </div>
      )}

      <AtlasScoreCard score={score} />

      {policies.length > 0 ? (
        <ConsumerSection
          title="Prossime scadenze"
          action={
            <Link href="/policies" className="text-[13px] font-medium text-accent">
              Vedi tutte
            </Link>
          }
        >
          {deadlines.length === 0 ? (
            <p className="atlas-consumer-card px-4 py-5 text-[13px] leading-relaxed text-muted">
              Completa le date delle tue polizze per ricevere promemoria.
            </p>
          ) : (
            <ul className="atlas-consumer-card divide-y divide-border-subtle overflow-hidden">
              {deadlines.map((item) => (
                <li key={`${item.policyId}-${item.date}`}>
                  <Link
                    href={`/policies/${item.policyId}`}
                    className="flex min-h-14 items-center justify-between gap-3 px-4 py-3"
                  >
                    <span>
                      <span className="block text-[13px] font-semibold text-foreground">
                        {formatScheduleDate(item.date)}
                      </span>
                      <span className="text-[12px] text-muted">{item.label}</span>
                    </span>
                    <span className="text-[12px] text-muted">
                      {item.daysUntil === 0 ? "Oggi" : `${item.daysUntil} g`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ConsumerSection>
      ) : null}

      {policies.length > 0 ? (
        <ConsumerSection
          title="Richiede attenzione"
          action={
            <Link href="/opportunities" className="text-[13px] font-medium text-accent">
              Opportunità
            </Link>
          }
        >
          {attentionCount === 0 ? (
            <p className="atlas-consumer-card px-4 py-5 text-[13px] text-muted">
              Nessun dato incompleto o scadenza imminente al momento.
            </p>
          ) : (
            <ul className="space-y-2">
              {opportunities.map((item) => (
                <li key={item.id} className="atlas-consumer-card px-4 py-4">
                  <p className="text-[14px] font-medium text-foreground">{item.title}</p>
                  <p className="mt-1 text-[13px] text-muted">{item.description}</p>
                  <Link href={item.ctaHref} className="mt-3 inline-flex text-[13px] font-medium text-accent">
                    {item.ctaLabel}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ConsumerSection>
      ) : null}

      {policies.length > 0 ? (
        <ConsumerSection
          title="Polizze recenti"
          action={
            <Link href="/policies" className="text-[13px] font-medium text-accent">
              Vedi tutte
            </Link>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            {policies.slice(0, 4).map((policy) => (
              <PolicyConsumerCard key={policy.id} policy={policy} />
            ))}
          </div>
        </ConsumerSection>
      ) : null}

      <ConsumerSection title="Cosa puoi fare ora">
        <div className="grid gap-2 sm:grid-cols-3">
          <Link
            href="/policies/new"
            className="atlas-consumer-card atlas-consumer-press min-h-16 px-4 py-4 text-[14px] font-medium text-foreground"
          >
            Aggiungi una polizza
          </Link>
          <Link
            href="/documents"
            className="atlas-consumer-card atlas-consumer-press min-h-16 px-4 py-4 text-[14px] font-medium text-foreground"
          >
            Carica un documento
          </Link>
          <Link
            href="/settings"
            className="atlas-consumer-card atlas-consumer-press min-h-16 px-4 py-4 text-[14px] font-medium text-foreground"
          >
            Completa il profilo
          </Link>
        </div>
      </ConsumerSection>

      <ConsultationPrepCard />
    </div>
  );
}
