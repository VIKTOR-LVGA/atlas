import Link from "next/link";
import { after } from "next/server";
import { ActionCenter } from "@/components/insurance-os/ActionCenter";
import { CoverageMap } from "@/components/insurance-os/CoverageMap";
import { SituationSummary } from "@/components/insurance-os/SituationSummary";
import { ConsultationPrepCard } from "@/components/consumer/ConsultationPrepCard";
import { ConsumerSection, EmptyState } from "@/components/consumer/EmptyState";
import { PolicyConsumerCard } from "@/components/policies/PolicyConsumerCard";
import { consumerConsultationStatusLabel } from "@/lib/collaboration-status";
import { listCurrentUserConsultationRequests } from "@/lib/consultations";
import { getCurrentUserDocuments } from "@/lib/documents";
import { syncAttentionItems } from "@/lib/insurance-os/action-center";
import { listCurrentUserClaims } from "@/lib/insurance-os/claims";
import {
  buildCoverageMap,
  listCurrentUserPolicyCoverages,
  persistCoverageMapSnapshot,
} from "@/lib/insurance-os/coverage-map";
import type { CoverageMapCategoryView } from "@/lib/insurance-os/coverage-map";
import { listRecentPolicyChanges } from "@/lib/insurance-os/policy-diff";
import { getCurrentUserPolicies } from "@/lib/policies";
import { getPolicyStatusLabel } from "@/lib/policy-consumer-display";
import {
  formatScheduleDate,
  getUpcomingDeadlines,
  greetingForZurich,
} from "@/lib/policy-schedule";
import { sumPortfolioPremiums } from "@/lib/premium-totals";
import { getProfileShortName } from "@/lib/profile-display";
import { getCurrentProfile } from "@/lib/profiles";

export const metadata = { title: "Home" };

const ONBOARDING_STEPS = [
  {
    title: "Carichi i documenti",
    body: "Polizze, condizioni generali, fatture di premio. Un PDF alla volta o tutti insieme.",
  },
  {
    title: "ATLAS li legge",
    body: "Estrae compagnia, premi, franchigie e coperture, indicando sempre da quale pagina arriva il dato.",
  },
  {
    title: "Vedi il tuo quadro",
    body: "Una mappa per aree della vita: cosa è coperto, cosa è da verificare, cosa manca.",
  },
  {
    title: "Ti muovi con calma",
    body: "Domande in linguaggio naturale, scenari «e se…», check-up e dossier sinistri.",
  },
];

const STATUS_WEIGHT: Record<CoverageMapCategoryView["status"], number> = {
  needs_verification: 0,
  covered: 1,
  partially_known: 2,
  no_policy_found: 3,
  not_applicable: 4,
};

export default async function DashboardPage() {
  const [profile, policies, documents, consultationRequests, coverages, changes, claims] =
    await Promise.all([
      getCurrentProfile(),
      getCurrentUserPolicies(),
      getCurrentUserDocuments(),
      listCurrentUserConsultationRequests(),
      listCurrentUserPolicyCoverages(),
      listRecentPolicyChanges(10),
      listCurrentUserClaims(),
    ]);

  const name = getProfileShortName(profile);
  const greeting = greetingForZurich();

  const activeConsultation =
    consultationRequests.find(
      (request) => !["won", "lost", "completed", "cancelled"].includes(request.status)
    ) ?? null;

  const coverageMap = buildCoverageMap({ policies, coverages });
  const openClaims = claims.filter((claim) => claim.status !== "closed");

  const attentionItems = await syncAttentionItems({
    policies,
    documents,
    coverageMap,
    changes,
    openClaimCount: openClaims.length,
    pendingConsultation: activeConsultation !== null,
  });

  // The snapshot is a cache, not part of the rendered answer: never block the page on it.
  after(async () => {
    try {
      await persistCoverageMapSnapshot(coverageMap);
    } catch {
      /* snapshot is best-effort */
    }
  });

  if (policies.length === 0) {
    return (
      <div className="space-y-7">
        <header>
          <h1 className="text-[26px] font-semibold tracking-tight text-foreground sm:text-[30px]">
            {greeting}, {name}
          </h1>
        </header>

        <EmptyState
          title="Costruiamo il tuo quadro assicurativo."
          description="ATLAS parte dai tuoi documenti. Carica la prima polizza: da lì nasce tutto il resto."
          actionLabel="Carica un documento"
          actionHref="/documents"
          secondaryLabel="Inserisci una polizza a mano"
          secondaryHref="/policies/new"
        />

        <ConsumerSection title="Come funziona">
          <ol className="grid gap-2 sm:grid-cols-2">
            {ONBOARDING_STEPS.map((step, index) => (
              <li key={step.title} className="atlas-consumer-card px-4 py-4">
                <p className="atlas-section-eyebrow">Passo {index + 1}</p>
                <p className="mt-1.5 text-[14px] font-semibold tracking-tight text-foreground">
                  {step.title}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </ConsumerSection>

        <ConsultationPrepCard request={activeConsultation} />
      </div>
    );
  }

  const premiums = sumPortfolioPremiums(policies);
  const deadlines = getUpcomingDeadlines(policies, new Date(), 5);
  const nextDeadline = deadlines[0] ?? null;
  const activeCount = policies.filter(
    (policy) => getPolicyStatusLabel(policy) === "Attiva"
  ).length;
  const overlapCount = attentionItems.filter(
    (item) => item.type === "possible_overlap"
  ).length;

  const previewCategories = [...coverageMap.categories]
    .sort((a, b) => STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status])
    .slice(0, 6);

  const recentDocuments = documents.slice(0, 3);

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground sm:text-[30px]">
          {greeting}, {name}
        </h1>
        <p className="mt-1 text-[15px] text-muted-foreground">La tua situazione assicurativa</p>
      </header>

      {activeConsultation ? (
        <div
          className="atlas-consumer-card px-4 py-4"
          data-testid="active-consultation-card"
        >
          <p className="atlas-section-eyebrow">Revisione in corso</p>
          <p className="mt-1 text-[15px] font-semibold text-foreground">
            {consumerConsultationStatusLabel(activeConsultation.status)}
          </p>
          <Link
            href={`/consultations/${activeConsultation.id}`}
            className="mt-3 inline-flex text-[13px] font-medium text-accent"
          >
            Apri la pratica
          </Link>
        </div>
      ) : null}

      <SituationSummary
        data={{
          annualCost: premiums.annual,
          monthlyCost: premiums.monthly,
          activePolicies: activeCount,
          totalPolicies: policies.length,
          coveredAreas: coverageMap.summary.coveredCount,
          needsVerificationCount: coverageMap.summary.needsVerificationCount,
          overlapCount,
          nextDeadline,
        }}
      />

      <ConsumerSection
        title="Richiede la tua attenzione"
        action={
          attentionItems.length > 5 ? (
            <Link
              href="/activity?tab=actions"
              className="text-[13px] font-medium text-accent"
            >
              Vedi tutto ({attentionItems.length})
            </Link>
          ) : null
        }
      >
        <ActionCenter
          items={attentionItems}
          limit={5}
          emptyMessage="Nessuna scadenza imminente e nessun dato incompleto. ATLAS continua a controllare."
        />
      </ConsumerSection>

      <section className="min-w-0">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
            Mappa delle coperture
          </h2>
          <Link href="/atlas" className="text-[13px] font-medium text-accent">
            Mappa completa
          </Link>
        </div>
        <CoverageMap
          categories={previewCategories}
          title=""
          description="Tocca un’area per vedere polizze, coperture e fonti."
        />
      </section>

      <ConsumerSection title="Chiedi ad ATLAS">
        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href="/atlas/ask"
            className="atlas-consumer-card atlas-consumer-press px-4 py-4"
          >
            <p className="text-[14px] font-semibold tracking-tight text-foreground">
              Fai una domanda
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              «Quanto pago all’anno?», «Che franchigia ho sull’auto?». Risposte con le fonti
              nei tuoi documenti.
            </p>
          </Link>
          <Link
            href="/atlas/what-if"
            className="atlas-consumer-card atlas-consumer-press px-4 py-4"
          >
            <p className="text-[14px] font-semibold tracking-tight text-foreground">
              Simula uno scenario
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              «E se mi rubano il telefono in vacanza?» ATLAS mostra cosa risulta e cosa resta
              da verificare.
            </p>
          </Link>
        </div>
      </ConsumerSection>

      {deadlines.length > 0 ? (
        <ConsumerSection
          title="Prossimi appuntamenti"
          action={
            <Link href="/policies" className="text-[13px] font-medium text-accent">
              Vedi tutte
            </Link>
          }
        >
          <ul className="atlas-consumer-card divide-y divide-border-subtle overflow-hidden">
            {deadlines.map((item) => (
              <li key={`${item.policyId}-${item.date}`}>
                <Link
                  href={`/policies/${item.policyId}`}
                  className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 transition hover:bg-card-muted"
                >
                  <span>
                    <span className="block text-[13px] font-semibold text-foreground">
                      {formatScheduleDate(item.date)}
                    </span>
                    <span className="text-[12px] text-muted">{item.label}</span>
                  </span>
                  <span className="text-[12px] text-muted">
                    {item.daysUntil === 0 ? "Oggi" : `tra ${item.daysUntil} g`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </ConsumerSection>
      ) : null}

      <section className="atlas-consumer-card atlas-consumer-press px-4 py-5">
        <p className="atlas-section-eyebrow">Check-up</p>
        <p className="mt-1.5 text-[15px] font-semibold tracking-tight text-foreground">
          Rivedi tutto il portafoglio in una volta
        </p>
        <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-muted">
          ATLAS separa ciò che è chiaro, ciò che è da verificare e ciò che manca. Nessuna
          proposta commerciale.
        </p>
        <Link
          href="/atlas/checkup"
          className="atlas-btn-secondary mt-4 min-h-11 px-4 text-[13px]"
        >
          Apri il check-up
        </Link>
      </section>

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

      {recentDocuments.length > 0 ? (
        <ConsumerSection
          title="Documenti recenti"
          action={
            <Link href="/documents" className="text-[13px] font-medium text-accent">
              Wallet
            </Link>
          }
        >
          <ul className="atlas-consumer-card divide-y divide-border-subtle overflow-hidden">
            {recentDocuments.map((document) => (
              <li key={document.id}>
                <Link
                  href={`/documents/${document.id}`}
                  className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 transition hover:bg-card-muted"
                >
                  <span className="min-w-0 truncate text-[13px] font-medium text-foreground">
                    {document.fileName}
                  </span>
                  <span className="shrink-0 text-[12px] text-muted">
                    {document.recognizedInsurer ?? "Compagnia da confermare"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </ConsumerSection>
      ) : null}

      <ConsultationPrepCard request={activeConsultation} />
    </div>
  );
}
