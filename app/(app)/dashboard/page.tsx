import Link from "next/link";
import { ShieldCheck, Sparkles } from "lucide-react";
import { AtlasReferenceDashboard } from "@/components/dashboard/AtlasReferenceDashboard";
import { AtlasAlpineHero } from "@/components/visual/AtlasAlpineHero";
import { after } from "next/server";
import { ActionCenter } from "@/components/insurance-os/ActionCenter";
import { CoverageMap } from "@/components/insurance-os/CoverageMap";
import { ConsultationPrepCard } from "@/components/consumer/ConsultationPrepCard";
import { ConsumerSection, EmptyState } from "@/components/consumer/EmptyState";
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
  getUpcomingDeadlines,
  greetingForZurich,
} from "@/lib/policy-schedule";
import { sumPortfolioPremiums } from "@/lib/premium-totals";
import { getProfileShortName } from "@/lib/profile-display";
import { getCurrentProfile } from "@/lib/profiles";

export const metadata = { title: "Home" };

const ONBOARDING_STEPS = [
  { title: "Carica un PDF", body: "Aggiungi una polizza dal telefono o dal computer." },
  { title: "Controlla i dati", body: "ATLAS propone una bozza: verifica premi, persone e coperture prima di confermarla." },
  { title: "Tieni tutto sotto controllo", body: "Ritrova costi, documenti, scadenze e domande in un solo posto." },
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
      <div className="space-y-8">
        <AtlasAlpineHero greeting={greeting} name={name} empty />

        <AtlasReferenceDashboard policies={[]} documents={documents} deadlines={[]} activeCount={0} annualPremium={null} needsVerification={coverageMap.summary.needsVerificationCount} />

        <EmptyState
          title="La prima cosa da fare"
          description="Carica il PDF della tua assicurazione. ATLAS ti aiuta a leggerlo, poi sei tu a confermare i dati."
          actionLabel="Carica la prima polizza"
          actionHref="/documents"
          secondaryLabel="Inseriscila a mano"
          secondaryHref="/policies/new"
        />

        <ConsumerSection title="Tre passi per iniziare">
          <ol className="grid gap-2 sm:grid-cols-3">
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
  const previewCategories = [...coverageMap.categories]
    .sort((a, b) => STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status])
    .slice(0, 6);


  return (
    <div className="space-y-7">
      <AtlasAlpineHero greeting={greeting} name={name} />

      <AtlasReferenceDashboard
        policies={policies}
        documents={documents}
        deadlines={deadlines}
        activeCount={activeCount}
        annualPremium={premiums.annual}
        needsVerification={coverageMap.summary.needsVerificationCount}
      />

      <p className="flex items-start gap-2 rounded-2xl bg-card-muted px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden/>
        Versione pilota: i dati analizzati dall&apos;AI richiedono sempre conferma sui documenti originali.
      </p>

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

      <ConsumerSection
        title="Da controllare"
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
            Cosa risulta coperto
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

      <ConsumerSection title="Vuoi capire meglio?">
        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href="/atlas/ask"
            className="atlas-consumer-card atlas-consumer-press flex min-h-[140px] flex-col justify-center px-5 py-5"
          >
            <p className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-foreground">
              <Sparkles className="h-4 w-4 text-accent" aria-hidden/> Fai una domanda
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

      <ConsultationPrepCard request={activeConsultation} />
    </div>
  );
}
